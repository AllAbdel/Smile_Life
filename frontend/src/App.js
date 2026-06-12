import React, { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';
import './App.css';
import Documentation from './Documentation';
import MediaPanel from './MediaPanel';
import Confetti from './Confetti';
import SoundManager from './SoundManager';
import GameCard from './components/GameCard';
import CategoryPiles from './components/CategoryPiles';

// Détection automatique de l'adresse du serveur.
// Sur la version hébergée (Vercel), il n'y a pas de backend : le joueur doit
// renseigner l'adresse de son serveur (LAN ou tunnel ngrok/https).
const IS_HOSTED = window.location.hostname.endsWith('.vercel.app');
const DEFAULT_SOCKET_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : IS_HOSTED ? '' : `http://${window.location.hostname}:3001`;

// Avatar emoji stable dérivé du nom du joueur
const AVATARS = ['😎', '🤠', '🥳', '🤓', '😺', '🦊', '🐼', '🐸', '🦄', '🐯', '🤖', '👽', '🐙', '🦁', '🐰', '🐨'];
const avatarFor = (name = '') => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return AVATARS[hash % AVATARS.length];
};

function App() {
  const [socket, setSocket] = useState(null);
  const [serverUrl, setServerUrl] = useState(DEFAULT_SOCKET_URL);
  const [customServerUrl, setCustomServerUrl] = useState('');
  const [showServerConfig, setShowServerConfig] = useState(false);
  const [gameState, setGameState] = useState('menu'); // menu, lobby, playing, gameover
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [gameData, setGameData] = useState(null);
  const [playerData, setPlayerData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [targetMode, setTargetMode] = useState(false); // Choix d'un adversaire pour un malus
  const [error, setError] = useState('');
  const [customCards, setCustomCards] = useState(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [showChat, setShowChat] = useState(false); // Chat en overlay sur mobile
  const [unreadChat, setUnreadChat] = useState(0);
  const [expandedPlayers, setExpandedPlayers] = useState({});
  const [showMyCards, setShowMyCards] = useState(false);
  const [showCasinoBet, setShowCasinoBet] = useState(false);
  const [casinoAnimation, setCasinoAnimation] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);

  // Drag & drop (desktop)
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const [dropZoneActive, setDropZoneActive] = useState(null);
  const [dragGhostPos, setDragGhostPos] = useState({ x: 0, y: 0 });
  const [showDragGhost, setShowDragGhost] = useState(false);
  const [shakeZone, setShakeZone] = useState(null);

  // Casino
  const [showCasinoBetPrompt, setShowCasinoBetPrompt] = useState(false);

  // Carte Chance
  const [showChanceModal, setShowChanceModal] = useState(false);
  const [chanceDiscardPile, setChanceDiscardPile] = useState([]);

  const chatEndRef = useRef(null);
  const showChatRef = useRef(showChat);
  showChatRef.current = showChat;

  const addSystemMessage = useCallback((message) => {
    setMessages(prev => [...prev, { type: 'system', message, timestamp: Date.now() }]);
  }, []);

  useEffect(() => {
    if (!serverUrl) return; // Pas de serveur configuré (version hébergée)
    const newSocket = io(serverUrl);
    setSocket(newSocket);

    newSocket.on('game-created', ({ roomId, gameState, playerData }) => {
      setRoomId(roomId);
      setGameData(gameState);
      setPlayerData(playerData);
      setGameState('lobby');
      setError('');
    });

    newSocket.on('game-joined', ({ roomId, gameState, playerData }) => {
      setRoomId(roomId);
      setGameData(gameState);
      setPlayerData(playerData);
      setGameState('lobby');
      setError('');
    });

    newSocket.on('player-joined', ({ playerName, gameState }) => {
      setGameData(gameState);
      addSystemMessage(`👋 ${playerName} a rejoint la partie`);
    });

    newSocket.on('player-left', ({ playerName, gameState }) => {
      setGameData(gameState);
      addSystemMessage(`🚪 ${playerName} a quitté la partie`);
    });

    newSocket.on('game-started', ({ gameState }) => {
      setGameData(gameState);
      setGameState('playing');
      addSystemMessage('🎬 La partie commence !');
    });

    newSocket.on('hand-update', ({ hand, playerState, tsunami }) => {
      setPlayerData(prev => {
        if (playerState) return { ...playerState, hand };
        return { ...prev, hand };
      });
      if (tsunami) addSystemMessage('🌊 Ta main a été emportée par le tsunami !');
    });

    newSocket.on('card-drawn', ({ hand }) => {
      setPlayerData(prev => ({ ...prev, hand }));
    });

    newSocket.on('card-taken-from-discard', ({ card, hand }) => {
      setPlayerData(prev => ({ ...prev, hand }));
      addSystemMessage(`🃏 Tu récupères « ${card.name} »`);
    });

    newSocket.on('card-played', ({ playerId, message, gameState }) => {
      setGameData(gameState);
      if (playerId === newSocket.id) {
        const updatedPlayer = gameState.players.find(p => p.id === playerId);
        if (updatedPlayer) {
          setPlayerData(prev => ({ ...prev, ...updatedPlayer, hand: prev.hand }));
        }
        // Ne réinitialiser la sélection que si C'EST NOUS qui avons joué
        setSelectedCardIndex(null);
        setTargetMode(false);
      }
      addSystemMessage(message);
    });

    newSocket.on('turn-changed', ({ currentPlayerId, currentPlayerName, gameState }) => {
      setGameData(gameState);
      if (currentPlayerId === newSocket.id) {
        addSystemMessage(`🟢 C'est ton tour !`);
        SoundManager.play('ding');
      } else {
        addSystemMessage(`⏳ Tour de ${currentPlayerName}`);
      }
    });

    newSocket.on('player-skipped-turn', ({ reason }) => {
      addSystemMessage(reason);
    });

    newSocket.on('sound-played', ({ soundFile, soundName, playerName, isLocal, procedural }) => {
      if (procedural || soundName === 'Bravo !') {
        SoundManager.play('bravo');
      } else if (isLocal) {
        const audioMp3 = new Audio(soundFile);
        audioMp3.volume = 0.5;
        audioMp3.play().catch(() => {
          const audioWav = new Audio(soundFile.replace('.mp3', '.wav'));
          audioWav.volume = 0.5;
          audioWav.play().catch(() => {});
        });
      } else {
        const audio = new Audio(soundFile);
        audio.volume = 0.5;
        audio.play().catch(() => {});
      }
      addSystemMessage(`🔊 ${playerName} joue : ${soundName}`);
    });

    newSocket.on('game-update', ({ gameState }) => {
      setGameData(gameState);
      const localPlayer = gameState.players.find(p => p.id === newSocket.id);
      if (localPlayer) {
        setPlayerData(prev => ({ ...prev, ...localPlayer, hand: prev?.hand || [] }));
      }
    });

    newSocket.on('casino-opened', ({ message }) => {
      addSystemMessage(message);
      setCasinoAnimation(true);
      setTimeout(() => setCasinoAnimation(false), 3000);
    });

    newSocket.on('casino-prompt-bet', () => {
      setShowCasinoBetPrompt(true);
    });

    newSocket.on('chance-activated', ({ message, discardPile }) => {
      addSystemMessage(message);
      setChanceDiscardPile(discardPile);
      setShowChanceModal(true);
    });

    newSocket.on('casino-bet-placed', ({ message, gameState, betCount }) => {
      setGameData(gameState);
      addSystemMessage(message);
      if (betCount === 1) {
        addSystemMessage("🎰 En attente d'un adversaire pour le duel...");
      }
    });

    newSocket.on('casino-resolved', ({ winner, loser, winnerLevel, loserLevel, sameLevel, message, gameState }) => {
      setGameData(gameState);
      addSystemMessage(`🎰 DUEL : ${winner} (niv.${winnerLevel}) vs ${loser} (niv.${loserLevel}) — ${sameLevel ? 'égalité, le 2e parieur gagne !' : 'mises différentes, le 1er parieur gagne !'}`);
      addSystemMessage(message);
      setCasinoAnimation(true);
      setShowConfetti(true);
      setTimeout(() => {
        setCasinoAnimation(false);
        setShowConfetti(false);
      }, 5000);
    });

    newSocket.on('game-over', ({ winner, finalScores, stats }) => {
      setGameState('gameover');
      addSystemMessage(`🏆 ${winner} a gagné !`);
      setGameData(prev => ({ ...prev, finalScores, stats }));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    });

    newSocket.on('chat-message', ({ playerName, message, timestamp }) => {
      setMessages(prev => [...prev, { type: 'chat', playerName, message, timestamp }]);
      if (!showChatRef.current) {
        setUnreadChat(prev => prev + 1);
      }
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      SoundManager.play('error');
      setTimeout(() => setError(''), 5000);
    });

    return () => newSocket.close();
  }, [serverUrl, addSystemMessage]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (showChat) setUnreadChat(0);
  }, [showChat, messages]);

  // ---------- Actions ----------

  const createGame = () => {
    if (!socket) {
      setError('Configure d\'abord l\'adresse de ton serveur de jeu (⚙️ ci-dessous)');
      setShowServerConfig(true);
      return;
    }
    if (!playerName.trim()) {
      setError('Entre un nom de joueur');
      return;
    }
    socket.emit('create-game', { playerName: playerName.trim(), customCards });
  };

  const joinGame = () => {
    if (!socket) {
      setError('Configure d\'abord l\'adresse de ton serveur de jeu (⚙️ ci-dessous)');
      setShowServerConfig(true);
      return;
    }
    if (!playerName.trim() || !joinRoomId.trim()) {
      setError('Entre un nom de joueur et un code de partie');
      return;
    }
    socket.emit('join-game', { roomId: joinRoomId.trim().toUpperCase(), playerName: playerName.trim() });
  };

  const startGame = () => socket.emit('start-game');

  const emitPlayCard = (cardIndex, action, targetPlayerId = null) => {
    socket.emit('play-card', { cardIndex, targetPlayerId, action });
  };

  const playSelf = () => {
    if (selectedCardIndex === null) return;
    emitPlayCard(selectedCardIndex, 'play-self');
  };

  const discardSelected = () => {
    if (selectedCardIndex === null) return;
    emitPlayCard(selectedCardIndex, 'discard');
  };

  const playOnTarget = (targetId) => {
    if (selectedCardIndex === null) return;
    emitPlayCard(selectedCardIndex, 'play-opponent', targetId);
    setTargetMode(false);
  };

  const takeDiscard = () => socket.emit('take-discard');

  const placeCasinoBet = (salaryIndex) => {
    socket.emit('casino-bet', { salaryCardIndex: salaryIndex });
    setShowCasinoBet(false);
  };

  const selectChanceCard = (cardIndex) => {
    socket.emit('take-discard-card', { cardIndex });
    setShowChanceModal(false);
    setChanceDiscardPile([]);
  };

  const sendMessage = (e) => {
    e.preventDefault();
    if (chatMessage.trim()) {
      socket.emit('send-message', { message: chatMessage.trim() });
      setChatMessage('');
    }
  };

  const loadCustomCards = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const cards = JSON.parse(event.target.result);
        setCustomCards(cards);
        addSystemMessage('Cartes personnalisées chargées !');
      } catch {
        setError('Fichier JSON invalide');
      }
    };
    reader.readAsText(file);
  };

  const changeServerUrl = () => {
    if (customServerUrl.trim()) {
      let url = customServerUrl.trim();
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'http://' + url;
      }
      setServerUrl(url);
      setShowServerConfig(false);
      setCustomServerUrl('');
    }
  };

  const copyRoomCode = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(roomId).then(() => {
        setCopiedCode(true);
        setTimeout(() => setCopiedCode(false), 2000);
      }).catch(() => {});
    }
  };

  const resignJob = () => {
    if (!playerData?.job) return;
    const warn = playerData.job.canQuitInstantly ? '' : '\n⚠️ Tu sauteras ton prochain tour !';
    if (window.confirm(`Démissionner de ${playerData.job.name} ?${warn}`)) {
      socket.emit('resign-job');
    }
  };

  // ---------- Helpers ----------

  const isMyTurn = () => {
    if (!gameData || !playerData) return false;
    const currentPlayer = gameData.players[gameData.currentPlayerIndex];
    return currentPlayer && currentPlayer.id === playerData.id;
  };

  const getCurrentPlayerName = () => {
    if (!gameData) return '';
    const currentPlayer = gameData.players[gameData.currentPlayerIndex];
    return currentPlayer ? currentPlayer.name : '';
  };

  const selectedCard = selectedCardIndex !== null ? playerData?.hand?.[selectedCardIndex] : null;

  const toggleCardSelection = (index) => {
    if (selectedCardIndex === index) {
      setSelectedCardIndex(null);
      setTargetMode(false);
    } else {
      setSelectedCardIndex(index);
      setTargetMode(false);
    }
  };

  const togglePlayerExpanded = (playerId) => {
    setExpandedPlayers(prev => ({ ...prev, [playerId]: !prev[playerId] }));
  };

  // ---------- Drag & drop (desktop) ----------

  const handleDragStart = (e, cardIndex) => {
    if (!isMyTurn()) {
      e.preventDefault();
      return;
    }
    SoundManager.play('whoosh');
    setDraggedCardIndex(cardIndex);
    setSelectedCardIndex(cardIndex);
    setShowDragGhost(true);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardIndex', String(cardIndex));
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    document.body.classList.add('dragging-card');
  };

  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return;
    setDragGhostPos({ x: e.clientX, y: e.clientY });
  };

  const handleDragEnd = () => {
    setDraggedCardIndex(null);
    setDropZoneActive(null);
    setShowDragGhost(false);
    document.body.classList.remove('dragging-card');
  };

  const handleDragOver = (e, zone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropZoneActive(zone);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropZoneActive(null);
    }
  };

  const handleDrop = (e, dropData) => {
    e.preventDefault();
    if (draggedCardIndex === null) return;
    const card = playerData?.hand[draggedCardIndex];
    if (!card) return;

    let isValidDrop = true;
    let errorMessage = '';

    switch (dropData.type) {
      case 'self':
        if (card.type === 'malus') {
          isValidDrop = false;
          errorMessage = '❌ Tu ne peux pas jouer un malus sur toi-même !';
          setShakeZone('self');
        } else {
          emitPlayCard(draggedCardIndex, 'play-self');
        }
        break;

      case 'opponent':
        if (card.type !== 'malus') {
          isValidDrop = false;
          errorMessage = '❌ Seuls les malus se jouent sur un adversaire !';
          setShakeZone(`opponent-${dropData.playerId}`);
        } else {
          emitPlayCard(draggedCardIndex, 'play-opponent', dropData.playerId);
        }
        break;

      case 'casino':
        if (card.type !== 'salary') {
          isValidDrop = false;
          errorMessage = '❌ Seules les cartes Salaire se parient au casino !';
          setShakeZone('casino');
        } else {
          const salaryCardsInHand = playerData?.hand.filter(c => c.type === 'salary');
          const salaryIndex = salaryCardsInHand.indexOf(card);
          socket.emit('casino-bet', { salaryCardIndex: salaryIndex });
        }
        break;

      case 'discard':
        emitPlayCard(draggedCardIndex, 'discard');
        break;

      default:
        isValidDrop = false;
        break;
    }

    if (isValidDrop) {
      SoundManager.play('ding');
    } else {
      SoundManager.play('error');
      if (errorMessage) setError(errorMessage);
      setTimeout(() => setShakeZone(null), 500);
    }

    handleDragEnd();
  };

  // ---------- Écrans ----------

  if (gameState === 'menu') {
    return (
      <div className="app screen-center">
        <div className="menu-wrap">
          <div className="logo-block">
            <div className="logo-emoji">😊</div>
            <h1 className="logo-title">Smile Life</h1>
            <p className="logo-sub">Construis ta vie, vole des sourires.</p>
          </div>

          <div className="glass-card menu-card">
            {IS_HOSTED && !serverUrl && (
              <div className="hosted-notice">
                🌐 Version en ligne : renseigne l'adresse du serveur de jeu de ton hôte
                (tunnel ngrok ou IP) dans <strong>⚙️ Options avancées</strong>.
              </div>
            )}
            <input
              type="text"
              placeholder="Ton nom de joueur"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input"
              maxLength={16}
            />

            <button onClick={createGame} className="btn btn-primary btn-lg">
              ✨ Créer une partie
            </button>

            <div className="divider"><span>ou</span></div>

            <div className="join-row">
              <input
                type="text"
                placeholder="CODE"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                className="input input-code"
                maxLength={6}
              />
              <button onClick={joinGame} className="btn btn-secondary">
                Rejoindre
              </button>
            </div>

            <details className="menu-advanced" open={IS_HOSTED && !serverUrl}>
              <summary>⚙️ Options avancées</summary>
              <div className="menu-advanced-content">
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowServerConfig(!showServerConfig)}
                >
                  🌐 Serveur : {serverUrl ? serverUrl.replace('http://', '') : 'non configuré'}
                </button>
                {showServerConfig && (
                  <div className="server-config-panel">
                    <input
                      type="text"
                      placeholder="Ex : abc123.ngrok.io:3001"
                      value={customServerUrl}
                      onChange={(e) => setCustomServerUrl(e.target.value)}
                      className="input"
                    />
                    <div className="row-gap">
                      <button onClick={changeServerUrl} className="btn btn-secondary">Changer</button>
                      <button
                        onClick={() => { setServerUrl(DEFAULT_SOCKET_URL); setShowServerConfig(false); }}
                        className="btn btn-ghost"
                      >
                        Réinitialiser
                      </button>
                    </div>
                  </div>
                )}
                <label htmlFor="custom-cards" className="btn btn-ghost file-label">
                  📂 Cartes personnalisées (JSON)
                </label>
                <input id="custom-cards" type="file" accept=".json" onChange={loadCustomCards} className="file-input" />
                {customCards && <p className="success-text">✅ Cartes personnalisées chargées</p>}
              </div>
            </details>

            {error && <div className="error-box">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'lobby') {
    const isHost = gameData && socket && gameData.hostId === socket.id;

    return (
      <div className="app screen-center">
        <div className="menu-wrap">
          <div className="logo-block">
            <div className="logo-emoji">😊</div>
            <h1 className="logo-title">Smile Life</h1>
          </div>

          <div className="glass-card menu-card">
            <h2 className="lobby-title">Salon d'attente</h2>

            <button className="room-code" onClick={copyRoomCode} title="Copier le code">
              <span className="room-code-value">{roomId}</span>
              <span className="room-code-hint">{copiedCode ? '✅ Copié !' : '📋 Copier'}</span>
            </button>

            <div className="players-list">
              <h3>Joueurs <span className="players-count">{gameData?.players.length}/6</span></h3>
              {gameData?.players.map(player => (
                <div key={player.id} className="player-item">
                  <span className="player-avatar">{avatarFor(player.name)}</span>
                  <span className="player-item-name">{player.name}</span>
                  {player.id === gameData.hostId && <span className="host-badge">👑 Hôte</span>}
                </div>
              ))}
            </div>

            {isHost ? (
              <button
                onClick={startGame}
                className="btn btn-primary btn-lg"
                disabled={gameData.players.length < 2}
              >
                {gameData.players.length < 2 ? 'En attente de joueurs...' : '🚀 Démarrer la partie'}
              </button>
            ) : (
              <p className="waiting-text">⏳ En attente de l'hôte...</p>
            )}

            {error && <div className="error-box">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (gameState === 'playing') {
    const myTurn = isMyTurn();
    const currentTurnPlayer = gameData?.players[gameData.currentPlayerIndex];

    return (
      <div className="app game-view">
        <Confetti active={showConfetti} />

        {/* Fantôme de drag */}
        {showDragGhost && draggedCardIndex !== null && playerData?.hand[draggedCardIndex] && (
          <div className="drag-ghost" style={{ left: dragGhostPos.x, top: dragGhostPos.y }}>
            <div className="drag-ghost-card">
              <span>{playerData.hand[draggedCardIndex].image || '🎴'}</span>
              <span className="drag-ghost-name">{playerData.hand[draggedCardIndex].name}</span>
            </div>
          </div>
        )}

        {showDocs && <Documentation onClose={() => setShowDocs(false)} />}
        {showMedia && <MediaPanel onClose={() => setShowMedia(false)} socket={socket} />}

        {/* Barre du haut */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="topbar-logo">😊</span>
            <span className="topbar-room">{roomId}</span>
            <span className="topbar-deck">🎴 {gameData?.deckSize}</span>
          </div>
          <div className={`turn-pill ${myTurn ? 'is-mine' : ''}`}>
            {myTurn ? '🟢 À toi de jouer !' : `⏳ ${getCurrentPlayerName()}`}
          </div>
          <div className="topbar-actions">
            <button className="icon-btn" onClick={() => setShowDocs(!showDocs)} title="Guide du jeu">📖</button>
            <button className="icon-btn" onClick={() => setShowMedia(!showMedia)} title="Musique & sons">🎵</button>
            <button className="icon-btn chat-toggle" onClick={() => setShowChat(!showChat)} title="Chat">
              💬
              {unreadChat > 0 && <span className="chat-badge">{unreadChat}</span>}
            </button>
          </div>
        </header>

        <div className="game-layout">
          <main className="game-main">
            {/* Adversaires */}
            <section className="opponents-row">
              {gameData?.players
                .filter(p => p.id !== playerData?.id)
                .map(player => {
                  const isCurrent = currentTurnPlayer?.id === player.id;
                  const isExpanded = expandedPlayers[player.id];
                  const targetable = (targetMode || (draggedCardIndex !== null && playerData?.hand[draggedCardIndex]?.type === 'malus')) && myTurn;
                  return (
                    <div
                      key={player.id}
                      className={`opponent ${isCurrent ? 'is-current' : ''} ${targetable ? 'is-targetable' : ''} ${dropZoneActive === `opponent-${player.id}` ? 'drop-active' : ''} ${shakeZone === `opponent-${player.id}` ? 'shake' : ''}`}
                      onClick={() => targetMode && playOnTarget(player.id)}
                      onDragOver={(e) => handleDragOver(e, `opponent-${player.id}`)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, { type: 'opponent', playerId: player.id })}
                    >
                      <div className="opponent-top">
                        <span className="player-avatar">{avatarFor(player.name)}</span>
                        <div className="opponent-id">
                          <strong className="opponent-name">{player.name} {isCurrent && '🎯'}</strong>
                          <span className="opponent-job-label">
                            {player.prisonTurns > 0 ? `⛓️ Prison (${player.prisonTurns})` : (player.job ? `${player.job.image} ${player.job.name}` : '💤 Sans métier')}
                          </span>
                        </div>
                        <span className="smile-pill">😊 {player.smiles}</span>
                      </div>

                      <div className="opponent-chips">
                        <span className="chip" title="Cartes en main">🎴 {player.handSize}</span>
                        <span className="chip" title="Études">📚 {player.studies}</span>
                        <span className="chip" title="Salaires posés">💰 {player.salaryCount}</span>
                        <span className="chip" title="Flirts">❤️ {player.flirts.length}</span>
                        {player.married && <span className="chip" title="Marié(e)">💒</span>}
                        {player.adultery && <span className="chip" title="Adultère">😈</span>}
                        {player.children.length > 0 && <span className="chip" title="Enfants">👶 {player.children.length}</span>}
                        {player.pets.length > 0 && <span className="chip" title="Animaux">🐾 {player.pets.length}</span>}
                      </div>

                      <button
                        className="opponent-cards-toggle"
                        onClick={(e) => { e.stopPropagation(); togglePlayerExpanded(player.id); }}
                      >
                        {isExpanded ? '▾' : '▸'} Cartes posées ({player.playedCards.length})
                      </button>
                      {isExpanded && <CategoryPiles cards={player.playedCards} />}

                      {targetable && <div className="target-overlay">🎯 Cibler</div>}
                    </div>
                  );
                })}
            </section>

            {/* Table centrale */}
            <section className="table-row">
              <div className="deck-pile" title="Pioche">
                <div className="card-back">🎴</div>
                <span className="pile-label">{gameData?.deckSize} cartes</span>
              </div>

              <div
                className={`discard-pile ${dropZoneActive === 'discard' ? 'drop-active' : ''} ${draggedCardIndex !== null ? 'droppable' : ''} ${shakeZone === 'discard' ? 'shake' : ''}`}
                onDragOver={(e) => handleDragOver(e, 'discard')}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, { type: 'discard' })}
              >
                {gameData?.discardPile?.length > 0 ? (
                  <>
                    <GameCard card={gameData.discardPile[gameData.discardPile.length - 1]} variant="mini" />
                    <button className="btn btn-ghost btn-sm" onClick={takeDiscard}>Prendre</button>
                  </>
                ) : (
                  <>
                    <div className="card-back empty">🗑️</div>
                    <span className="pile-label">Défausse vide</span>
                  </>
                )}
                {dropZoneActive === 'discard' && <div className="drop-hint">🗑️ Défausser</div>}
              </div>

              {gameData?.casinoActive && (
                <div
                  className={`casino-zone ${casinoAnimation ? 'casino-flash' : ''} ${dropZoneActive === 'casino' ? 'drop-active' : ''} ${shakeZone === 'casino' ? 'shake' : ''}`}
                  onDragOver={(e) => handleDragOver(e, 'casino')}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, { type: 'casino' })}
                >
                  <div className="casino-head">🎰 CASINO</div>
                  <div className="casino-bets">
                    {(gameData.casinoBets || []).map((bet, idx) => (
                      <span key={idx} className="chip">{bet.playerName} : 🂠 secret</span>
                    ))}
                    {(gameData.casinoBets || []).length === 0 && <span className="casino-empty">Aucun pari</span>}
                  </div>
                  <button className="btn btn-secondary btn-sm" onClick={() => setShowCasinoBet(true)}>
                    Parier un salaire
                  </button>
                  {dropZoneActive === 'casino' && <div className="drop-hint">💰 Mise ton salaire !</div>}
                </div>
              )}
            </section>

            {/* Ma zone */}
            <section
              className={`my-board ${myTurn ? 'my-turn' : ''} ${dropZoneActive === 'self' ? 'drop-active' : ''} ${draggedCardIndex !== null ? 'droppable' : ''} ${shakeZone === 'self' ? 'shake' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'self')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, { type: 'self' })}
            >
              {dropZoneActive === 'self' && <div className="drop-hint drop-hint-board">✨ Jouer sur toi</div>}

              <div className="my-header">
                <span className="player-avatar player-avatar-lg">{avatarFor(playerData?.name)}</span>
                <div className="my-id">
                  <strong>{playerData?.name}</strong>
                  <span className="my-job">
                    {playerData?.job ? (
                      <>
                        {playerData.job.image} {playerData.job.name}
                        <button className="resign-link" onClick={resignJob} title="Démissionner">✕</button>
                      </>
                    ) : '💤 Sans métier'}
                  </span>
                </div>
                <span className="smile-pill smile-pill-lg">😊 {playerData?.smiles || 0}</span>
              </div>

              <div className="my-chips">
                <span className="chip">📚 Études {playerData?.studies || 0}</span>
                <span className="chip">💰 Salaires {playerData?.salaryCount || 0}</span>
                <span className="chip">❤️ Flirts {playerData?.flirts?.length || 0}/5</span>
                {playerData?.married && <span className="chip">💒 Marié(e)</span>}
                {playerData?.adultery && <span className="chip">😈 Adultère</span>}
                {(playerData?.children?.length || 0) > 0 && <span className="chip">👶 {playerData.children.length}</span>}
                {(playerData?.pets?.length || 0) > 0 && <span className="chip">🐾 {playerData.pets.length}</span>}
              </div>

              <button className="opponent-cards-toggle" onClick={() => setShowMyCards(!showMyCards)}>
                {showMyCards ? '▾' : '▸'} Mes cartes posées ({playerData?.playedCards?.length || 0})
              </button>
              {showMyCards && <CategoryPiles cards={playerData?.playedCards || []} />}
            </section>
          </main>

          {/* Chat */}
          <aside className={`chat-panel ${showChat ? 'is-open' : ''}`}>
            <div className="chat-header">
              <h3>💬 Chat</h3>
              <button className="icon-btn chat-close" onClick={() => setShowChat(false)}>✕</button>
            </div>
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  {msg.type === 'chat' ? (
                    <><strong>{msg.playerName}</strong> {msg.message}</>
                  ) : (
                    <em>{msg.message}</em>
                  )}
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={sendMessage} className="chat-input-form">
              <input
                type="text"
                value={chatMessage}
                onChange={(e) => setChatMessage(e.target.value)}
                placeholder="Ton message..."
                className="chat-input"
              />
              <button type="submit" className="btn btn-primary btn-sm">➤</button>
            </form>
          </aside>
        </div>

        {/* Main du joueur */}
        <footer className="hand-dock">
          <div className="hand-hint">
            {myTurn
              ? (targetMode ? '🎯 Touche un adversaire pour le viser !' : '✨ Glisse une carte ou touche-la pour agir')
              : `⏳ Tour de ${getCurrentPlayerName()}`}
          </div>
          <div className="hand-row">
            {playerData?.hand?.map((card, index) => (
              <GameCard
                key={index}
                card={card}
                variant="hand"
                selected={selectedCardIndex === index}
                dragging={draggedCardIndex === index}
                onClick={() => toggleCardSelection(index)}
                draggable={myTurn}
                onDragStart={(e) => handleDragStart(e, index)}
                onDrag={handleDrag}
                onDragEnd={handleDragEnd}
              />
            ))}
          </div>
        </footer>

        {/* Barre d'action (tactile + clavier) */}
        {myTurn && selectedCard && !targetMode && (
          <div className="action-bar">
            <span className="action-bar-card">{selectedCard.image} {selectedCard.name}</span>
            {selectedCard.type !== 'malus' && (
              <button className="btn btn-primary btn-sm" onClick={playSelf}>✨ Jouer</button>
            )}
            {selectedCard.type === 'malus' && (
              <button className="btn btn-danger btn-sm" onClick={() => setTargetMode(true)}>🎯 Sur un adversaire</button>
            )}
            {selectedCard.type === 'salary' && gameData?.casinoActive && (
              <button className="btn btn-secondary btn-sm" onClick={() => {
                const salaryCardsInHand = playerData.hand.filter(c => c.type === 'salary');
                placeCasinoBet(salaryCardsInHand.indexOf(selectedCard));
              }}>🎰 Parier</button>
            )}
            <button className="btn btn-ghost btn-sm" onClick={discardSelected}>🗑️ Défausser</button>
            <button className="btn btn-ghost btn-sm" onClick={() => toggleCardSelection(selectedCardIndex)}>✕</button>
          </div>
        )}

        {targetMode && (
          <div className="action-bar">
            <span className="action-bar-card">🎯 Choisis ta cible...</span>
            <button className="btn btn-ghost btn-sm" onClick={() => setTargetMode(false)}>Annuler</button>
          </div>
        )}

        {error && <div className="error-toast">{error}</div>}

        {/* Modal : proposition de pari après ouverture du casino */}
        {showCasinoBetPrompt && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>🎰 Casino ouvert !</h3>
              <p>Veux-tu parier un salaire de ta main immédiatement ?</p>
              <p className="hint-text">💡 Parier coûte un tour mais peut doubler ta mise</p>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={() => { setShowCasinoBetPrompt(false); setShowCasinoBet(true); }}>
                  Oui, parier ! 🎲
                </button>
                <button className="btn btn-ghost" onClick={() => setShowCasinoBetPrompt(false)}>
                  Non merci
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal : choisir le salaire à parier */}
        {showCasinoBet && (
          <div className="modal-overlay" onClick={() => setShowCasinoBet(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              {(playerData?.hand?.filter(c => c.type === 'salary') || []).length > 0 ? (
                <>
                  <h3>🎰 Choisis un salaire à parier</h3>
                  <p className="hint-text">Ta mise restera secrète jusqu'à la fin du duel</p>
                  <div className="modal-cards">
                    {playerData.hand
                      .map((card, originalIndex) => ({ card, originalIndex }))
                      .filter(({ card }) => card.type === 'salary')
                      .map(({ card }, salaryIndex) => (
                        <GameCard
                          key={salaryIndex}
                          card={card}
                          variant="pick"
                          onClick={() => placeCasinoBet(salaryIndex)}
                        />
                      ))}
                  </div>
                </>
              ) : (
                <>
                  <h3>❌ Aucun salaire en main</h3>
                  <p>Tu n'as pas de carte Salaire à parier !</p>
                </>
              )}
              <button className="btn btn-ghost" onClick={() => setShowCasinoBet(false)}>Fermer</button>
            </div>
          </div>
        )}

        {/* Modal : carte Chance */}
        {showChanceModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h3>🍀 CHANCE !</h3>
              <p>Choisis une carte de la défausse pour la récupérer dans ta main :</p>
              <div className="modal-cards">
                {chanceDiscardPile.slice().reverse().map((card, index) => {
                  const actualIndex = chanceDiscardPile.length - 1 - index;
                  return (
                    <GameCard
                      key={actualIndex}
                      card={card}
                      variant="pick"
                      onClick={() => selectChanceCard(actualIndex)}
                    />
                  );
                })}
              </div>
              <p className="hint-text">Tu dois choisir une carte pour terminer ton tour 🍀</p>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (gameState === 'gameover') {
    const renderStat = (statData, emoji, label) => {
      if (!statData || statData.length === 0) return null;
      return (
        <div className="stat-item">
          <span className="stat-emoji">{emoji}</span>
          <span className="stat-label">{label}</span>
          <span className="stat-values">
            {statData.map((p, i) => `${p.name} (${p.value})`).join(', ')}
          </span>
        </div>
      );
    };

    return (
      <div className="app screen-center">
        <Confetti active={showConfetti} />
        <div className="gameover-wrap">
          <h1 className="logo-title">🏆 Partie terminée</h1>

          <div className="glass-card gameover-card">
            <div className="podium">
              {gameData?.finalScores?.map((score, index) => (
                <div key={index} className={`podium-row rank-${index + 1}`}>
                  <span className="podium-rank">
                    {['🥇', '🥈', '🥉'][index] || `${index + 1}.`}
                  </span>
                  <span className="player-avatar">{avatarFor(score.name)}</span>
                  <span className="podium-name">{score.name}</span>
                  <span className="smile-pill">😊 {score.smiles}</span>
                </div>
              ))}
            </div>

            {gameData?.stats && (
              <div className="stats-section">
                <h3>📊 Récompenses de la partie</h3>
                <div className="stats-grid">
                  {renderStat(gameData.stats.mostMalus, '💔', 'Tête à claques (malus subis)')}
                  {renderStat(gameData.stats.mostStudies, '📚', 'Grosse tête (études)')}
                  {renderStat(gameData.stats.mostSalaryEnd, '💰', 'Radin (salaires à la fin)')}
                  {renderStat(gameData.stats.mostSalaryTotal, '💵', 'Gagne-pain (salaires totaux)')}
                  {renderStat(gameData.stats.mostTravels, '✈️', 'Globe-trotter (voyages)')}
                  {renderStat(gameData.stats.mostFlirts, '❤️', 'Cœur d\'artichaut (flirts)')}
                  {renderStat(gameData.stats.mostChildren, '👶', 'Famille nombreuse (enfants)')}
                  {renderStat(gameData.stats.mostPets, '🐾', 'Arche de Noé (animaux)')}
                  {renderStat(gameData.stats.mostJobs, '💼', 'Girouette (métiers)')}
                  {renderStat(gameData.stats.mostMarriages, '💒', 'Romantique (mariages)')}
                </div>
              </div>
            )}

            <button onClick={() => window.location.reload()} className="btn btn-primary btn-lg">
              🔄 Retour au menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
