import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import './App.css';

// Détection automatique de l'adresse du serveur
// Si tu veux forcer une IP spécifique, remplace par: 'http://TON_IP:3001'
const SOCKET_URL = window.location.hostname === 'localhost' 
  ? 'http://localhost:3001'
  : `http://${window.location.hostname}:3001`;

function App() {
  const [socket, setSocket] = useState(null);
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
  
  const chatEndRef = useRef(null);

  useEffect(() => {
    const newSocket = io(SOCKET_URL);
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

    newSocket.on('hand-update', ({ hand }) => {
      setPlayerData(prev => ({ ...prev, hand }));
    });

    newSocket.on('card-drawn', ({ card, hand }) => {
      setPlayerData(prev => ({ ...prev, hand }));
      addSystemMessage('Vous avez pioché une carte');
    });

    newSocket.on('card-played', ({ playerId, playerName, message, gameState }) => {
      setGameData(gameState);
      addSystemMessage(`${playerName}: ${message}`);
      setSelectedCardIndex(null);
      setSelectedTarget(null);
    });

    newSocket.on('turn-changed', ({ currentPlayerId, currentPlayerName }) => {
      addSystemMessage(`C'est au tour de ${currentPlayerName}`);
    });

    newSocket.on('game-update', ({ gameState }) => {
      setGameData(gameState);
    });

    newSocket.on('game-over', ({ winner, finalScores }) => {
      setGameState('gameover');
      addSystemMessage(`🏆 ${winner} a gagné !`);
      setGameData(prev => ({ ...prev, finalScores }));
    });

    newSocket.on('chat-message', ({ playerName, message, timestamp }) => {
      setMessages(prev => [...prev, { type: 'chat', playerName, message, timestamp }]);
    });

    newSocket.on('error', ({ message }) => {
      setError(message);
      setTimeout(() => setError(''), 5000);
    });

    return () => newSocket.close();
  }, []);

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
                .map(player => (
                  <div 
                    key={player.id} 
                    className={`opponent-card ${selectedTarget === player.id ? 'selected' : ''}`}
                    onClick={() => setSelectedTarget(player.id)}
                  >
                    <div className="opponent-header">
                      <strong>{player.name}</strong>
                      <span className="smiles">😊 {player.smiles}</span>
                    </div>
                    <div className="opponent-info">
                      <span>🎴 {player.handSize}</span>
                      <span>📚 {player.studies}</span>
                      {player.job && <span>{getCardEmoji(player.job)}</span>}
                      {player.married && <span>💒</span>}
                      <span>👶 {player.children.length}</span>
                    </div>
                  </div>
                ))}
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
            <div className="player-area">
              <div className="player-header">
                <h3>{playerData?.name}</h3>
                <span className="smiles-big">😊 {playerData?.smiles} Smiles</span>
              </div>

              <div className="player-stats">
                <div className="stat">📚 Études: {playerData?.studies}</div>
                {playerData?.job && (
                  <div className="stat">{getCardEmoji(playerData.job)} {playerData.job.name}</div>
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
                    <div key={index} className={`mini-card ${card.isMalus ? 'malus' : ''}`} title={card.description}>
                      <div className="card-emoji">{getCardEmoji(card)}</div>
                      <div className="card-name">{card.name}</div>
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
    return (
      <div className="App">
        <div className="container">
          <h1 className="title">🏆 Partie terminée 🏆</h1>
          <div className="gameover-card">
            <h2>Scores finaux</h2>
            <div className="scores-list">
              {gameData?.finalScores
                ?.sort((a, b) => b.smiles - a.smiles)
                .map((score, index) => (
                  <div key={index} className="score-item">
                    <span className="rank">{index + 1}.</span>
                    <span className="player-name">{score.name}</span>
                    <span className="score">😊 {score.smiles}</span>
                  </div>
                ))}
            </div>
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
