import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import Documentation from './Documentation';
import MediaPanel from './MediaPanel';
import Confetti from './Confetti';
import SoundManager from './SoundManager';

// Détection automatique de l'adresse du serveur
// Si tu veux forcer une IP spécifique, remplace par: 'http://TON_IP:3001'
const DEFAULT_SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

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
  const [selectedAction, setSelectedAction] = useState('play-self');
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [error, setError] = useState('');
  const [customCards, setCustomCards] = useState(null);
  const [showDocs, setShowDocs] = useState(false);
  const [showMedia, setShowMedia] = useState(false);
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [currentMusic, setCurrentMusic] = useState(null);
  const [expandedPlayers, setExpandedPlayers] = useState({}); // Pour les cartes déroulantes
  const [showDiscardPicker, setShowDiscardPicker] = useState(false); // Pour la carte Chance
  const [showCasinoBet, setShowCasinoBet] = useState(false); // Pour parier au casino
  const [casinoAnimation, setCasinoAnimation] = useState(false); // Animation du casino
  const [showConfetti, setShowConfetti] = useState(false); // Confettis pour célébrations
  
  // États pour le drag & drop
  const [draggedCardIndex, setDraggedCardIndex] = useState(null);
  const [dropZoneActive, setDropZoneActive] = useState(null); // Zone de drop survolée
  const [dragGhostPos, setDragGhostPos] = useState({ x: 0, y: 0 }); // Position du fantôme
  const [showDragGhost, setShowDragGhost] = useState(false); // Afficher le fantôme
  const [shakeZone, setShakeZone] = useState(null); // Zone qui shake en cas d'erreur
  
  // État pour le pari automatique au casino
  const [showCasinoBetPrompt, setShowCasinoBetPrompt] = useState(false);
  const [casinoJustPlayed, setCasinoJustPlayed] = useState(false);
  
  const chatEndRef = useRef(null);

  useEffect(() => {
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
      addSystemMessage(`${playerName} a rejoint la partie`);
    });

    newSocket.on('player-left', ({ playerName, gameState, newHostId }) => {
      setGameData(gameState);
      addSystemMessage(`${playerName} a quitté la partie`);
    });

    newSocket.on('game-started', ({ gameState }) => {
      setGameData(gameState);
      setGameState('playing');
      addSystemMessage('La partie commence !');
    });

    newSocket.on('hand-update', ({ hand, playerState }) => {
      setPlayerData(prev => {
        if (playerState) {
          return { ...playerState, hand };
        }
        return { ...prev, hand };
      });
    });

    newSocket.on('card-drawn', ({ card, hand }) => {
      setPlayerData(prev => ({ ...prev, hand }));
      addSystemMessage('Vous avez pioché une carte');
    });

    newSocket.on('card-played', ({ playerId, playerName, message, gameState }) => {
      setGameData(gameState);
      
      // Mettre à jour les données du joueur local si c'est lui qui a joué
      if (playerId === newSocket.id) {
        const updatedPlayer = gameState.players.find(p => p.id === playerId);
        if (updatedPlayer) {
          setPlayerData(prev => ({
            ...prev,
            studies: updatedPlayer.studies,
            job: updatedPlayer.job,
            married: updatedPlayer.married,
            smiles: updatedPlayer.smiles,
            playedCards: updatedPlayer.playedCards
          }));
        }
      }
      
      addSystemMessage(`${playerName}: ${message}`);
      setSelectedCardIndex(null);
      setSelectedTarget(null);
      setSelectedAction('play-self'); // Réinitialiser l'action à "jouer sur moi"
    });

    newSocket.on('turn-changed', ({ currentPlayerId, currentPlayerName, gameState }) => {
      setGameData(gameState); // IMPORTANT : Mettre à jour l'état complet du jeu
      addSystemMessage(`C'est au tour de ${currentPlayerName}`);
    });

    newSocket.on('player-skipped-turn', ({ playerName, reason }) => {
      addSystemMessage(reason || `⏭️ ${playerName} saute son tour !`);
    });

    newSocket.on('sound-played', ({ soundFile, soundName, playerName }) => {
      // Jouer le son reçu d'un autre joueur
      const audio = new Audio(soundFile);
      audio.play().catch(err => console.log('Erreur lecture son:', err));
      addSystemMessage(`🔊 ${playerName} a joué: ${soundName}`);
    });

    newSocket.on('game-update', ({ gameState }) => {
      setGameData(gameState);
      
      // Mettre à jour aussi les données du joueur local
      const localPlayer = gameState.players.find(p => p.id === newSocket.id);
      if (localPlayer) {
        setPlayerData(prev => ({
          ...prev,
          ...localPlayer,
          hand: prev.hand // Garder la main actuelle
        }));
      }
    });

    newSocket.on('casino-opened', ({ message, playerId, playerName }) => {
      addSystemMessage(message);
      setCasinoAnimation(true);
      setTimeout(() => setCasinoAnimation(false), 3000);
    });
    
    newSocket.on('casino-prompt-bet', ({ message }) => {
      // Proposer au joueur de parier
      setShowCasinoBetPrompt(true);
    });

    newSocket.on('casino-bet-placed', ({ playerName, message, gameState, betCount }) => {
      setGameData(gameState);
      addSystemMessage(message);
      
      // Afficher le nombre de paris
      if (betCount === 1) {
        addSystemMessage("🎰 En attente d'un adversaire pour le duel...");
      }
    });

    newSocket.on('casino-resolved', ({ winner, winnerId, loser, loserId, winnerLevel, loserLevel, sameLevel, totalWinnings, message, gameState }) => {
      setGameData(gameState);
      
      // Message détaillé du résultat
      const resultMessage = sameLevel
        ? `🎰 DUEL CASINO 🎰\n${winner} (Niv.${winnerLevel}) VS ${loser} (Niv.${loserLevel})\nMême niveau ! Le 2ème joueur (${winner}) gagne !`
        : `🎰 DUEL CASINO 🎰\n${winner} (Niv.${winnerLevel}) VS ${loser} (Niv.${loserLevel})\nNiveaux différents ! Le 1er joueur (${winner}) gagne !`;
      
      addSystemMessage(resultMessage);
      addSystemMessage(message);
      
      // Animation de victoire avec confettis
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
      
      // Confettis pour la fin de partie
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 10000);
    });

    newSocket.on('chat-message', ({ playerName, message, timestamp }) => {
      setMessages(prev => [...prev, { type: 'chat', playerName, message, timestamp }]);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 5000);
    });

    return () => newSocket.close();
  }, [serverUrl]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const addSystemMessage = (message) => {
    setMessages(prev => [...prev, { type: 'system', message, timestamp: Date.now() }]);
  };

  const createGame = () => {
    if (!playerName.trim()) {
      setError('Entrez un nom de joueur');
      return;
    }
    socket.emit('create-game', { playerName: playerName.trim(), customCards });
  };

  const joinGame = () => {
    if (!playerName.trim() || !joinRoomId.trim()) {
      setError('Entrez un nom de joueur et un code de partie');
      return;
    }
    socket.emit('join-game', { roomId: joinRoomId.trim().toUpperCase(), playerName: playerName.trim() });
  };

  const startGame = () => {
    socket.emit('start-game');
  };

  const drawCard = () => {
    socket.emit('draw-card');
  };

  const playCard = () => {
    if (selectedCardIndex === null) {
      setError('Sélectionnez une carte');
      return;
    }

    const card = playerData?.hand[selectedCardIndex];
    
    // Si c'est une carte Chance, ouvrir le sélecteur de défausse
    if (card && card.id === 'special-2') {
      setShowDiscardPicker(true);
      return;
    }

    if (selectedAction === 'play-opponent' && !selectedTarget) {
      setError('Sélectionnez un adversaire');
      return;
    }

    socket.emit('play-card', {
      cardIndex: selectedCardIndex,
      targetPlayerId: selectedTarget,
      action: selectedAction
    });
  };

  const takeDiscard = () => {
    socket.emit('take-discard');
  };
  
  const takeDiscardCard = (cardIndex) => {
    socket.emit('take-discard-card', { cardIndex });
    setShowDiscardPicker(false);
    // Jouer automatiquement la carte Chance
    socket.emit('play-card', {
      cardIndex: selectedCardIndex,
      targetPlayerId: null,
      action: 'play-self'
    });
  };
  
  const togglePlayerExpanded = (playerId) => {
    setExpandedPlayers(prev => ({
      ...prev,
      [playerId]: !prev[playerId]
    }));
  };
  
  // ========== DRAG & DROP SYSTEM ==========
  
  // Commence le drag d'une carte
  const handleDragStart = (e, cardIndex) => {
    // Seulement si c'est notre tour
    if (!isMyTurn()) {
      e.preventDefault();
      return;
    }
    
    // 🎵 Son de "whoosh"
    SoundManager.play('whoosh');
    
    setDraggedCardIndex(cardIndex);
    setSelectedCardIndex(cardIndex);
    setShowDragGhost(true);
    
    // Visuel de la carte en train d'être dragged
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('cardIndex', cardIndex);
    
    // Image fantôme transparente (on va utiliser notre propre ghost)
    const img = new Image();
    img.src = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';
    e.dataTransfer.setDragImage(img, 0, 0);
    
    // Ajouter une classe au body pour indiquer qu'on drag
    document.body.classList.add('dragging-card');
  };
  
  const handleDrag = (e) => {
    if (e.clientX === 0 && e.clientY === 0) return; // Ignore les événements fantômes
    setDragGhostPos({ x: e.clientX, y: e.clientY });
  };
  
  const handleDragEnd = (e) => {
    setDraggedCardIndex(null);
    setDropZoneActive(null);
    setShowDragGhost(false);
    document.body.classList.remove('dragging-card');
  };
  
  // Gestion des zones de drop
  const handleDragOver = (e, zone) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDropZoneActive(zone);
  };
  
  const handleDragLeave = (e) => {
    // Vérifier qu'on quitte vraiment la zone (pas juste un enfant)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDropZoneActive(null);
    }
  };
  
  // Drop sur une zone
  const handleDrop = (e, dropData) => {
    e.preventDefault();
    
    if (draggedCardIndex === null) return;
    
    const card = playerData?.hand[draggedCardIndex];
    if (!card) return;
    
    let isValidDrop = true;
    let errorMessage = '';
    
    // Validation et exécution selon la zone
    switch (dropData.type) {
      case 'self':
        // Jouer sur soi
        if (card.type === 'malus') {
          isValidDrop = false;
          errorMessage = '❌ Tu ne peux pas jouer un malus sur toi-même !';
          setShakeZone('self');
        } else {
          // Vérifier si c'est un casino
          if (card.id === 'special-1') {
            // C'est un casino ! Vérifier si le joueur a un salaire
            const hasSalary = playerData?.hand.some(c => c.type === 'salary' && c !== card);
            if (hasSalary) {
              setCasinoJustPlayed(true);
              setShowCasinoBetPrompt(true);
            }
          }
          
          socket.emit('play-card', {
            cardIndex: draggedCardIndex,
            targetPlayerId: null,
            action: 'play-self'
          });
        }
        break;
        
      case 'opponent':
        // Jouer sur un adversaire
        if (card.type !== 'malus') {
          isValidDrop = false;
          errorMessage = '❌ Tu ne peux jouer que des malus sur les adversaires !';
          setShakeZone(`opponent-${dropData.playerId}`);
        } else {
          socket.emit('play-card', {
            cardIndex: draggedCardIndex,
            targetPlayerId: dropData.playerId,
            action: 'play-opponent'
          });
        }
        break;
        
      case 'casino':
        // Parier au casino - directement depuis la main
        if (card.type !== 'salary') {
          isValidDrop = false;
          errorMessage = '❌ Tu ne peux parier que des cartes Salaire au casino !';
          setShakeZone('casino');
        } else {
          // Trouver l'index du salaire dans la main
          const salaryCardsInHand = playerData?.hand.filter(c => c.type === 'salary');
          const salaryIndex = salaryCardsInHand.findIndex(c => c === card);
          
          socket.emit('casino-bet', { salaryCardIndex: salaryIndex });
        }
        break;
        
      case 'discard':
        // Défausser
        socket.emit('play-card', {
          cardIndex: draggedCardIndex,
          targetPlayerId: null,
          action: 'discard'
        });
        break;
        
      default:
        isValidDrop = false;
        break;
    }
    
    // Sons et animations
    if (isValidDrop) {
      // 🎵 Son de succès
      SoundManager.play('ding');
    } else {
      // 🎵 Son d'erreur
      SoundManager.play('error');
      if (errorMessage) {
        setError(errorMessage);
      }
      // Animation shake pendant 500ms
      setTimeout(() => setShakeZone(null), 500);
    }
    
    // Reset
    setDraggedCardIndex(null);
    setDropZoneActive(null);
    setShowDragGhost(false);
    document.body.classList.remove('dragging-card');
  };
  
  // ========== FIN DRAG & DROP SYSTEM ==========

  const placeCasinoBet = (salaryIndex) => {
    socket.emit('casino-bet', { salaryCardIndex: salaryIndex });
    setShowCasinoBet(false);
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
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const cards = JSON.parse(event.target.result);
          setCustomCards(cards);
          addSystemMessage('Cartes personnalisées chargées !');
        } catch (err) {
          setError('Fichier JSON invalide');
        }
      };
      reader.readAsText(file);
    }
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

  const getCardEmoji = (card) => {
    return card.image || '🎴';
  };
  
  // Organiser les cartes par catégorie
  const organizeCardsByCategory = (cards) => {
    const categories = {
      malus: { name: 'Malus', icon: '💔', cards: [] },
      flirt: { name: 'Flirts/Mariage', icon: '❤️', cards: [] },
      job: { name: 'Métier', icon: '💼', cards: [] },
      salary: { name: 'Salaires', icon: '💰', cards: [] },
      child: { name: 'Enfants', icon: '👶', cards: [] },
      pet: { name: 'Animaux', icon: '🐾', cards: [] },
      housing: { name: 'Logement', icon: '🏠', cards: [] },
      study: { name: 'Études', icon: '📚', cards: [] },
      travel: { name: 'Voyages', icon: '✈️', cards: [] },
      other: { name: 'Autre', icon: '🎴', cards: [] }
    };
    
    cards.forEach(card => {
      if (card.isMalus) {
        categories.malus.cards.push(card);
      } else if (card.type === 'flirt' || card.type === 'marriage' || card.type === 'adultery') {
        categories.flirt.cards.push(card);
      } else if (card.type === 'job') {
        categories.job.cards.push(card);
      } else if (card.type === 'salary') {
        categories.salary.cards.push(card);
      } else if (card.type === 'child') {
        categories.child.cards.push(card);
      } else if (card.type === 'pet') {
        categories.pet.cards.push(card);
      } else if (card.type === 'housing') {
        categories.housing.cards.push(card);
      } else if (card.type === 'study') {
        categories.study.cards.push(card);
      } else if (card.type === 'travel') {
        categories.travel.cards.push(card);
      } else {
        categories.other.cards.push(card);
      }
    });
    
    // Retourner seulement les catégories qui ont des cartes
    return Object.values(categories).filter(cat => cat.cards.length > 0);
  };

  // Rendu du menu principal
  if (gameState === 'menu') {
    return (
      <div className="App">
        <div className="container">
          <h1 className="title">😊 Smile Life 😊</h1>
          <div className="menu-card">
            <h2>Bienvenue !</h2>
            
            {/* Configuration serveur */}
            <div className="server-config">
              <button 
                className="server-config-btn" 
                onClick={() => setShowServerConfig(!showServerConfig)}
              >
                🌐 Serveur: {serverUrl.replace('http://', '')}
              </button>
              
              {showServerConfig && (
                <div className="server-config-panel">
                  <p>Pour jouer en ligne ou via ngrok :</p>
                  <input
                    type="text"
                    placeholder="Ex: abc123.ngrok.io:3001"
                    value={customServerUrl}
                    onChange={(e) => setCustomServerUrl(e.target.value)}
                    className="input"
                  />
                  <button onClick={changeServerUrl} className="btn btn-success">
                    Changer le serveur
                  </button>
                  <button 
                    onClick={() => {
                      setServerUrl(DEFAULT_SOCKET_URL);
                      setShowServerConfig(false);
                    }} 
                    className="btn btn-secondary"
                  >
                    Réinitialiser (local)
                  </button>
                </div>
              )}
            </div>

            <input
              type="text"
              placeholder="Votre nom"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="input"
            />
            
            <div className="custom-cards-section">
              <label htmlFor="custom-cards" className="file-label">
                📂 Charger des cartes personnalisées (optionnel)
              </label>
              <input
                id="custom-cards"
                type="file"
                accept=".json"
                onChange={loadCustomCards}
                className="file-input"
              />
              {customCards && <p className="success-text">✅ Cartes personnalisées chargées</p>}
            </div>

            <button onClick={createGame} className="btn btn-primary">
              Créer une partie
            </button>
            
            <div className="divider">OU</div>
            
            <input
              type="text"
              placeholder="Code de la partie"
              value={joinRoomId}
              onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
              className="input"
            />
            <button onClick={joinGame} className="btn btn-secondary">
              Rejoindre une partie
            </button>
            
            {error && <div className="error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Rendu du lobby
  if (gameState === 'lobby') {
    const isHost = gameData && socket && gameData.hostId === socket.id;
    
    return (
      <div className="App">
        <div className="container">
          <h1 className="title">😊 Smile Life 😊</h1>
          <div className="lobby-card">
            <h2>Salon d'attente</h2>
            <div className="room-code">
              <strong>Code de la partie:</strong> {roomId}
            </div>
            
            <div className="players-list">
              <h3>Joueurs ({gameData?.players.length}/6)</h3>
              {gameData?.players.map((player, index) => (
                <div key={player.id} className="player-item">
                  {player.name} {player.id === gameData.hostId && '👑'}
                </div>
              ))}
            </div>

            {isHost && (
              <button 
                onClick={startGame} 
                className="btn btn-primary"
                disabled={gameData.players.length < 2}
              >
                Démarrer la partie
              </button>
            )}
            
            {!isHost && (
              <p className="waiting-text">En attente de l'hôte...</p>
            )}
            
            {error && <div className="error">{error}</div>}
          </div>
        </div>
      </div>
    );
  }

  // Rendu de la partie en cours
  if (gameState === 'playing') {
    return (
      <div className="App game-view">
        {/* Confettis */}
        <Confetti active={showConfetti} />
        
        {/* Fantôme de drag (trainée visuelle) */}
        {showDragGhost && draggedCardIndex !== null && playerData?.hand[draggedCardIndex] && (
          <div 
            className="drag-ghost"
            style={{
              left: dragGhostPos.x,
              top: dragGhostPos.y
            }}
          >
            <div className="drag-ghost-card">
              <div className="card-emoji-large">{getCardEmoji(playerData.hand[draggedCardIndex])}</div>
              <div className="card-name">{playerData.hand[draggedCardIndex].name}</div>
            </div>
          </div>
        )}
        
        {/* Panneaux latéraux */}
        {showDocs && <Documentation onClose={() => setShowDocs(false)} />}
        {showMedia && <MediaPanel onClose={() => setShowMedia(false)} socket={socket} />}
        
        {/* Boutons flottants */}
        <button className="float-btn float-btn-docs" onClick={() => setShowDocs(!showDocs)} title="Guide du jeu">
          📖
        </button>
        <button className="float-btn float-btn-media" onClick={() => setShowMedia(!showMedia)} title="Musique & Sons">
          🎬
        </button>
        
        <div className="game-header">
          <h1>😊 Smile Life - Partie {roomId}</h1>
          <div className="turn-indicator">
            {isMyTurn() ? (
              <span className="your-turn">🟢 C'est votre tour !</span>
            ) : (
              <span>⏳ Tour de {getCurrentPlayerName()}</span>
            )}
          </div>
        </div>

        <div className="game-container">
          {/* Zone de jeu principale */}
          <div className="main-game-area">
            {/* Autres joueurs */}
            <div className="opponents-area">
              {gameData?.players
                .filter(p => p.id !== playerData?.id)
                .map(player => {
                  const isCurrentPlayer = gameData.players[gameData.currentPlayerIndex]?.id === player.id;
                  const isExpanded = expandedPlayers[player.id];
                  return (
                    <div 
                      key={player.id} 
                      className={`opponent-card ${selectedTarget === player.id ? 'selected' : ''} ${isCurrentPlayer ? 'current-turn' : ''} ${dropZoneActive === `opponent-${player.id}` ? 'drop-zone-active' : ''} ${isMyTurn() && draggedCardIndex !== null ? 'droppable' : ''} ${shakeZone === `opponent-${player.id}` ? 'shake' : ''}`}
                      onClick={() => setSelectedTarget(player.id)}
                      onDragOver={(e) => handleDragOver(e, `opponent-${player.id}`)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, { type: 'opponent', playerId: player.id })}
                    >
                      {dropZoneActive === `opponent-${player.id}` && (
                        <div className="drop-hint-opponent">💢 Jouer un malus !</div>
                      )}
                      <div className="opponent-header">
                        <strong>{player.name} {isCurrentPlayer && '🎯'}</strong>
                        <span className="smiles">😊 {player.smiles}</span>
                      </div>
                      <div className="opponent-details">
                        <div className="opponent-stat">🎴 Main: {player.handSize}</div>
                        <div className="opponent-stat">📚 Études: {player.studies}</div>
                        {player.job ? (
                          <div className="opponent-stat opponent-job" title={player.job.description}>
                            💼 {player.job.name} (Sal. max: Niv.{player.job.maxSalaryLevel || 1})
                          </div>
                        ) : (
                          <div className="opponent-stat opponent-no-job">💼 Pas de métier</div>
                        )}
                        <div className="opponent-stat">💰 Salaires: {player.salaryCount}</div>
                        <div className="opponent-stat">❤️ Flirts: {player.flirts.length}/5</div>
                        {player.married && <div className="opponent-stat">💒 Marié(e)</div>}
                        <div className="opponent-stat">👶 Enfants: {player.children.length}</div>
                        <div className="opponent-stat">🐾 Animaux: {player.pets.length}</div>
                      </div>
                      
                      {/* Cartes posées - déroulantes par catégorie */}
                      <div className="opponent-played-cards">
                        <div 
                          className="opponent-cards-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            togglePlayerExpanded(player.id);
                          }}
                        >
                          <span>📋 Cartes posées ({player.playedCards.length})</span>
                          <span className="toggle-icon">{isExpanded ? '▼' : '▶'}</span>
                        </div>
                        {isExpanded && (
                          <div className="opponent-cards-categories">
                            {organizeCardsByCategory(player.playedCards).map((category, catIdx) => (
                              <div key={catIdx} className="card-category-pile">
                                <div className="pile-header">
                                  <span className="pile-icon">{category.icon}</span>
                                  <span className="pile-name">{category.name}</span>
                                  <span className="pile-count">({category.cards.length})</span>
                                </div>
                                <div className="pile-cards">
                                  {category.cards.map((card, cardIdx) => (
                                    <div 
                                      key={cardIdx}
                                      className={`pile-card ${card.isMalus ? 'malus' : ''}`}
                                      title={card.description}
                                    >
                                      <span className="pile-card-emoji">{getCardEmoji(card)}</span>
                                      <span className="pile-card-name">{card.name}</span>
                                      {card.smiles > 0 && <span className="pile-card-smiles">+{card.smiles}😊</span>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>

            {/* Zone centrale */}
            <div className="center-area">
              <div className="deck-info">
                <div className="deck">
                  <div className="card-back">🎴</div>
                  <div className="deck-count">{gameData?.deckSize} cartes</div>
                </div>
                
                {/* Casino */}
                {gameData?.casinoActive && (
                  <div 
                    className={`casino-zone ${casinoAnimation ? 'casino-active' : ''} ${dropZoneActive === 'casino' ? 'drop-zone-active' : ''} ${isMyTurn() && draggedCardIndex !== null ? 'droppable' : ''} ${shakeZone === 'casino' ? 'shake' : ''}`}
                    onDragOver={(e) => handleDragOver(e, 'casino')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, { type: 'casino' })}
                  >
                    <div className="casino-icon">🎰</div>
                    <div className="casino-title">CASINO OUVERT</div>
                    {dropZoneActive === 'casino' && (
                      <div className="drop-hint">💰 Dépose ton salaire ici !</div>
                    )}
                    <div className="casino-bets-count">
                      {gameData.casinoBets?.length || 0} pari(s)
                    </div>
                    {gameData.casinoBets && gameData.casinoBets.length > 0 && (
                      <div className="casino-bets-list">
                        {gameData.casinoBets.map((bet, idx) => (
                          <div key={idx} className="casino-bet-item">
                            {idx === 0 ? (
                              // Premier pari caché
                              `${bet.playerName}: ❓ (Face cachée)`
                            ) : (
                              // Deuxième pari visible
                              `${bet.playerName}: Niv.${bet.betAmount} 💰`
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    <button 
                      className="btn-casino-bet"
                      onClick={() => setShowCasinoBet(true)}
                    >
                      Parier
                    </button>
                  </div>
                )}
                
                {gameData?.discardPile && gameData.discardPile.length > 0 && (
                  <div 
                    className={`discard-pile ${dropZoneActive === 'discard' ? 'drop-zone-active' : ''} ${isMyTurn() && draggedCardIndex !== null ? 'droppable' : ''} ${shakeZone === 'discard' ? 'shake' : ''}`}
                    onClick={takeDiscard}
                    onDragOver={(e) => handleDragOver(e, 'discard')}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, { type: 'discard' })}
                  >
                    {dropZoneActive === 'discard' && (
                      <div className="drop-hint-discard">🗑️ Défausser ici</div>
                    )}
                    <div className="card">
                      {getCardEmoji(gameData.discardPile[gameData.discardPile.length - 1])}
                    </div>
                    <div className="discard-name">{gameData.discardPile[gameData.discardPile.length - 1].name}</div>
                    <button className="btn-small">Prendre</button>
                  </div>
                )}
              </div>

              {isMyTurn() && (
                <div className="actions">
                  <div className="turn-message">
                    ✨ C'est votre tour ! Sélectionnez une carte et jouez-la.
                  </div>
                  
                  {selectedCardIndex !== null && (
                    <div className="action-selector">
                      <select 
                        value={selectedAction} 
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="select"
                      >
                        <option value="play-self">Jouer sur moi</option>
                        {playerData?.hand[selectedCardIndex]?.type === 'malus' && (
                          <option value="play-opponent">Jouer sur adversaire</option>
                        )}
                        <option value="discard">Défausser</option>
                      </select>
                      <button onClick={playCard} className="btn btn-success">
                        Jouer la carte
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Votre zone de jeu */}
            <div 
              className={`player-area ${isMyTurn() ? 'my-turn' : ''} ${dropZoneActive === 'self' ? 'drop-zone-active' : ''} ${isMyTurn() && draggedCardIndex !== null ? 'droppable' : ''} ${shakeZone === 'self' ? 'shake' : ''}`}
              onDragOver={(e) => handleDragOver(e, 'self')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, { type: 'self' })}
            >
              {dropZoneActive === 'self' && (
                <div className="drop-hint-self">✨ Jouer sur toi !</div>
              )}
              <div className="player-header">
                <h3>{playerData?.name} {isMyTurn() && '🎯 (Votre tour)'}</h3>
                <span className="smiles-big">😊 {playerData?.smiles} Smiles</span>
              </div>

              <div className="player-stats">
                <div className="stat">📚 Études: {playerData?.studies}</div>
                {playerData?.job && (
                  <div className="stat stat-job" style={{position: 'relative'}}>
                    💼 Métier: {getCardEmoji(playerData.job)} {playerData.job.name}
                    <button 
                      onClick={() => {
                        if (window.confirm(`Démissionner de ${playerData.job.name}?${playerData.job.canQuitInstantly ? '' : '\n⚠️ Vous sauterez votre prochain tour!'}`)) {
                          socket.emit('resign-job');
                        }
                      }}
                      className="resign-btn"
                      title="Démissionner"
                    >
                      ❌
                    </button>
                  </div>
                )}
                {!playerData?.job && (
                  <div className="stat stat-no-job">💼 Pas de métier</div>
                )}
                {playerData?.married && <div className="stat">💒 Marié(e)</div>}
                <div className="stat">❤️ Flirts: {playerData?.flirts.length}/5</div>
                <div className="stat">👶 Enfants: {playerData?.children.length}</div>
                <div className="stat">🐾 Animaux: {playerData?.pets.length}</div>
                <div className="stat">💰 Salaires: {playerData?.salaryCount}</div>
              </div>

              {/* Cartes posées */}
              <div className="played-cards">
                <h4>Cartes jouées</h4>
                <div className="cards-grid">
                  {playerData?.playedCards.map((card, index) => (
                    <div 
                      key={index} 
                      className={`mini-card ${card.isMalus ? 'malus' : ''} ${card.type === 'job' ? 'job-card' : ''}`} 
                      title={card.description}
                    >
                      <div className="card-emoji">{getCardEmoji(card)}</div>
                      <div className="card-name">{card.name}</div>
                      {card.smiles > 0 && <div className="card-mini-smiles">😊 {card.smiles}</div>}
                    </div>
                  ))}
                </div>
              </div>

              {/* Main du joueur */}
              <div className="hand">
                <h4>Votre main {isMyTurn() && draggedCardIndex === null && '(Glisse une carte pour la jouer ✨)'}</h4>
                <div className="cards-row">
                  {playerData?.hand.map((card, index) => (
                    <div
                      key={index}
                      className={`card-hand ${selectedCardIndex === index ? 'selected' : ''} ${draggedCardIndex === index ? 'dragging' : ''}`}
                      onClick={() => setSelectedCardIndex(index)}
                      draggable={isMyTurn()}
                      onDragStart={(e) => handleDragStart(e, index)}
                      onDrag={handleDrag}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="card-emoji-large">{getCardEmoji(card)}</div>
                      <div className="card-info">
                        <div className="card-name">{card.name}</div>
                        <div className="card-smiles">😊 {card.smiles || 0}</div>
                        {card.type === 'travel' && card.cost && (
                          <div className="card-cost">💰 Coût: {card.cost}</div>
                        )}
                        <div className="card-desc">{card.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Chat */}
          <div className="chat-area">
            <h3>💬 Chat</h3>
            <div className="messages">
              {messages.map((msg, index) => (
                <div key={index} className={`message ${msg.type}`}>
                  {msg.type === 'chat' ? (
                    <><strong>{msg.playerName}:</strong> {msg.message}</>
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
                placeholder="Tapez votre message..."
                className="chat-input"
              />
              <button type="submit" className="btn-send">Envoyer</button>
            </form>
          </div>
        </div>

        {error && <div className="error-toast">{error}</div>}
        
        {/* Prompt automatique de pari après avoir joué le casino */}
        {showCasinoBetPrompt && (
          <div className="modal-overlay">
            <div className="modal-content casino-prompt">
              <h3>🎰 Casino ouvert !</h3>
              <p>Tu viens de jouer le Casino !</p>
              <p><strong>Veux-tu parier un salaire immédiatement ?</strong></p>
              <p className="hint-text">💡 Tu joueras 2 cartes ce tour et piocheras 2 à la fin</p>
              <div className="casino-prompt-actions">
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setShowCasinoBetPrompt(false);
                    setShowCasinoBet(true);
                  }}
                >
                  Oui, parier ! 🎲
                </button>
                <button 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowCasinoBetPrompt(false);
                    setCasinoJustPlayed(false);
                  }}
                >
                  Non, passer
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* Modal pour parier au casino - UTILISE LA MAIN maintenant */}
        {showCasinoBet && (() => {
          const salariesInHand = playerData?.hand.filter(card => card.type === 'salary') || [];
          return salariesInHand.length > 0;
        })() && (
          <div className="modal-overlay" onClick={() => setShowCasinoBet(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>🎰 Choisissez un salaire de votre main à parier</h3>
              <div className="casino-bet-grid">
                {playerData?.hand
                  .map((card, originalIndex) => ({ card, originalIndex }))
                  .filter(({ card }) => card.type === 'salary')
                  .map(({ card, originalIndex }, salaryIndex) => (
                    <div 
                      key={originalIndex} 
                      className="casino-bet-card"
                      onClick={() => {
                        placeCasinoBet(salaryIndex);
                        setCasinoJustPlayed(false);
                      }}
                    >
                      <div className="card-emoji-large">{getCardEmoji(card)}</div>
                      <div className="card-name">{card.name}</div>
                      <div className="card-value">Valeur: {card.salaryValue || 1}</div>
                    </div>
                  ))}
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setShowCasinoBet(false);
                  setCasinoJustPlayed(false);
                }}
              >
                Annuler
              </button>
            </div>
          </div>
        )}
        
        {showCasinoBet && (() => {
          const salariesInHand = playerData?.hand.filter(card => card.type === 'salary') || [];
          return salariesInHand.length === 0;
        })() && (
          <div className="modal-overlay" onClick={() => setShowCasinoBet(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>❌ Aucun salaire dans ta main</h3>
              <p>Tu n'as pas de salaire dans ta main à parier au casino !</p>
              <button className="btn btn-secondary" onClick={() => setShowCasinoBet(false)}>
                Fermer
              </button>
            </div>
          </div>
        )}
        {showDiscardPicker && (
          <div className="modal-overlay" onClick={() => setShowDiscardPicker(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3>🍀 Chance ! Choisissez une carte de la défausse</h3>
              <div className="discard-picker-grid">
                {gameData?.discardPile.slice().reverse().map((card, index) => {
                  const actualIndex = gameData.discardPile.length - 1 - index;
                  return (
                    <div 
                      key={actualIndex} 
                      className="discard-picker-card"
                      onClick={() => takeDiscardCard(actualIndex)}
                    >
                      <div className="card-emoji-large">{getCardEmoji(card)}</div>
                      <div className="card-name">{card.name}</div>
                      <div className="card-smiles">😊 {card.smiles || 0}</div>
                    </div>
                  );
                })}
              </div>
              <button className="btn btn-secondary" onClick={() => setShowDiscardPicker(false)}>
                Annuler
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Rendu de fin de partie
  if (gameState === 'gameover') {
    const renderStat = (statData, emoji, label) => {
      if (!statData || statData.length === 0) return null;
      return (
        <div className="stat-item">
          <span className="stat-emoji">{emoji}</span>
          <span className="stat-label">{label}:</span>
          <span className="stat-values">
            {statData.map((p, i) => (
              <span key={i}>{p.name} ({p.value}){i < statData.length - 1 && ', '}</span>
            ))}
          </span>
        </div>
      );
    };

    return (
      <div className="App">
        {/* Confettis */}
        <Confetti active={showConfetti} />
        
        <div className="container">
          <h1 className="title">🏆 Partie terminée 🏆</h1>
          <div className="gameover-card">
            <h2>🥇 Classement final</h2>
            <div className="scores-list">
              {gameData?.finalScores?.map((score, index) => (
                <div key={index} className={`score-item rank-${index + 1}`}>
                  <span className="rank">
                    {index === 0 && '🥇'}
                    {index === 1 && '🥈'}
                    {index === 2 && '🥉'}
                    {index > 2 && `${index + 1}.`}
                  </span>
                  <span className="player-name">{score.name}</span>
                  <span className="score">😊 {score.smiles}</span>
                </div>
              ))}
            </div>

            {gameData?.stats && (
              <div className="stats-section">
                <h3>📊 Statistiques de la partie</h3>
                <div className="stats-grid">
                  {renderStat(gameData.stats.mostMalus, '💔', 'Plus de malus subis')}
                  {renderStat(gameData.stats.mostStudies, '📚', 'Plus haut niveau d\'études')}
                  {renderStat(gameData.stats.mostSalaryEnd, '💰', 'Plus de salaires à la fin')}
                  {renderStat(gameData.stats.mostSalaryTotal, '💵', 'Plus de salaires durant la partie')}
                  {renderStat(gameData.stats.mostTravels, '✈️', 'Plus de voyages')}
                  {renderStat(gameData.stats.mostFlirts, '❤️', 'Plus de flirts')}
                  {renderStat(gameData.stats.mostChildren, '👶', 'Plus d\'enfants')}
                  {renderStat(gameData.stats.mostPets, '🐾', 'Plus d\'animaux')}
                  {renderStat(gameData.stats.mostJobs, '💼', 'Plus de métiers durant la partie')}
                  {renderStat(gameData.stats.mostMarriages, '💒', 'Plus de mariages durant la partie')}
                </div>
                
                <h3 style={{marginTop: '30px'}}>📈 Stats détaillées de tous les joueurs</h3>
                <div className="all-stats-table">
                  {gameData.stats.allPlayers?.map((player, idx) => (
                    <div key={idx} className="player-stats-row">
                      <div className="player-stats-name">{player.name}</div>
                      <div className="player-stats-details">
                        <span>😊 {player.smiles}</span>
                        <span>📚 {player.studies}</span>
                        <span>💔 {player.malus}</span>
                        <span>💰 {player.salaryEnd}</span>
                        <span>💵 {player.salaryTotal}</span>
                        <span>✈️ {player.travels}</span>
                        <span>❤️ {player.flirts}</span>
                        <span>👶 {player.children}</span>
                        <span>🐾 {player.pets}</span>
                        <span>💼 {player.jobs}</span>
                        <span>💒 {player.marriages}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            <button 
              onClick={() => window.location.reload()} 
              className="btn btn-primary"
            >
              Retour au menu
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default App;
