import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';
import Documentation from './Documentation';
import MediaPanel from './MediaPanel';

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
    });

    newSocket.on('turn-changed', ({ currentPlayerId, currentPlayerName, gameState }) => {
      setGameData(gameState); // IMPORTANT : Mettre à jour l'état complet du jeu
      addSystemMessage(`C'est au tour de ${currentPlayerName}`);
    });

    newSocket.on('player-skipped-turn', ({ playerName }) => {
      addSystemMessage(`⏭️ ${playerName} saute son tour !`);
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

    newSocket.on('game-over', ({ winner, finalScores, stats }) => {
      setGameState('gameover');
      addSystemMessage(`🏆 ${winner} a gagné !`);
      setGameData(prev => ({ ...prev, finalScores, stats }));
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
                  return (
                    <div 
                      key={player.id} 
                      className={`opponent-card ${selectedTarget === player.id ? 'selected' : ''} ${isCurrentPlayer ? 'current-turn' : ''}`}
                      onClick={() => setSelectedTarget(player.id)}
                    >
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
                
                {gameData?.discardPile && gameData.discardPile.length > 0 && (
                  <div className="discard-pile" onClick={takeDiscard}>
                    <div className="card">
                      {getCardEmoji(gameData.discardPile[0])}
                    </div>
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
                        <option value="play-opponent">Jouer sur adversaire</option>
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
            <div className={`player-area ${isMyTurn() ? 'my-turn' : ''}`}>
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
                <h4>Votre main</h4>
                <div className="cards-row">
                  {playerData?.hand.map((card, index) => (
                    <div
                      key={index}
                      className={`card-hand ${selectedCardIndex === index ? 'selected' : ''}`}
                      onClick={() => setSelectedCardIndex(index)}
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
                  {renderStat(gameData.stats.mostSalaryTotal, '💵', 'Plus de salaires total')}
                  {renderStat(gameData.stats.mostTravels, '✈️', 'Plus de voyages')}
                  {renderStat(gameData.stats.mostFlirts, '❤️', 'Plus de flirts')}
                  {renderStat(gameData.stats.mostChildren, '👶', 'Plus d\'enfants')}
                  {renderStat(gameData.stats.mostPets, '🐾', 'Plus d\'animaux')}
                  {renderStat(gameData.stats.mostJobs, '💼', 'Plus de métiers')}
                  {renderStat(gameData.stats.mostMarriages, '💒', 'Plus de mariages')}
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
