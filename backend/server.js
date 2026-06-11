const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const Game = require('./game');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// État global
const games = new Map();   // roomId -> Game
const players = new Map(); // socketId -> { roomId, playerName }

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size });
});

function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Fin de partie : classement trié + stats, partout pareil
function endGame(game, roomId) {
  game.finished = true;
  const results = game.getFinalResults();
  io.to(roomId).emit('game-over', results);
}

// Termine le tour du joueur courant : recomplète sa main, vérifie la fin de partie,
// passe au joueur suivant et diffuse les sauts de tour.
function finishTurn(game, roomId, playerId, { refill = true } = {}) {
  if (refill) {
    game.refillHand(playerId);
  }
  io.to(playerId).emit('hand-update', {
    hand: game.getPlayerData(playerId)?.hand || [],
    playerState: game.getPlayerData(playerId)
  });

  io.to(roomId).emit('game-update', { gameState: game.getPublicGameState() });

  if (game.isGameOver()) {
    endGame(game, roomId);
    return;
  }

  const turnResult = game.nextTurn();
  const nextPlayer = game.getCurrentPlayer();

  if (turnResult.skipped) {
    turnResult.skippedPlayers.forEach(skippedPlayer => {
      const reason = skippedPlayer.reason === 'prison'
        ? `⛓️ ${skippedPlayer.name} est en prison !`
        : `⏭️ ${skippedPlayer.name} saute son tour !`;
      io.to(roomId).emit('player-skipped-turn', { playerName: skippedPlayer.name, reason });
    });
  }

  io.to(roomId).emit('turn-changed', {
    currentPlayerId: nextPlayer.id,
    currentPlayerName: nextPlayer.name,
    gameState: game.getPublicGameState()
  });
}

io.on('connection', (socket) => {
  console.log(`Nouveau joueur connecté : ${socket.id}`);

  const getContext = () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return {};
    return { playerInfo, game: games.get(playerInfo.roomId) };
  };

  // Créer une nouvelle partie
  socket.on('create-game', ({ playerName, customCards }) => {
    const roomId = generateRoomCode();
    const game = new Game(roomId, socket.id, customCards);
    game.addPlayer(socket.id, playerName);

    games.set(roomId, game);
    players.set(socket.id, { roomId, playerName });
    socket.join(roomId);

    socket.emit('game-created', {
      roomId,
      gameState: game.getPublicGameState(),
      playerData: game.getPlayerData(socket.id)
    });

    console.log(`Partie créée : ${roomId} par ${playerName}`);
  });

  // Rejoindre une partie
  socket.on('join-game', ({ roomId, playerName }) => {
    const game = games.get(roomId);
    if (!game) {
      socket.emit('error', { message: 'Partie introuvable' });
      return;
    }
    if (game.gameStarted) {
      socket.emit('error', { message: 'La partie a déjà commencé' });
      return;
    }
    if (!game.addPlayer(socket.id, playerName)) {
      socket.emit('error', { message: 'Partie pleine' });
      return;
    }

    players.set(socket.id, { roomId, playerName });
    socket.join(roomId);

    socket.emit('game-joined', {
      roomId,
      gameState: game.getPublicGameState(),
      playerData: game.getPlayerData(socket.id)
    });

    io.to(roomId).emit('player-joined', {
      playerName,
      gameState: game.getPublicGameState()
    });

    console.log(`${playerName} a rejoint la partie ${roomId}`);
  });

  // Démarrer la partie
  socket.on('start-game', () => {
    const { playerInfo, game } = getContext();
    if (!game) return;
    if (game.hostId !== socket.id) {
      socket.emit('error', { message: "Seul l'hôte peut démarrer la partie" });
      return;
    }
    if (game.players.length < 2) {
      socket.emit('error', { message: 'Minimum 2 joueurs requis' });
      return;
    }

    game.gameStarted = true;
    game.initializeDeck();
    game.dealCards();

    io.to(playerInfo.roomId).emit('game-started', {
      gameState: game.getPublicGameState()
    });

    game.players.forEach(player => {
      io.to(player.id).emit('hand-update', {
        hand: game.getPlayerData(player.id).hand
      });
    });

    console.log(`Partie ${playerInfo.roomId} démarrée`);
  });

  // Piocher une carte (manuel)
  socket.on('draw-card', () => {
    const { playerInfo, game } = getContext();
    if (!game || !game.gameStarted || game.finished) return;

    if (game.getCurrentPlayer().id !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas votre tour" });
      return;
    }

    const card = game.drawCard(socket.id);
    if (!card) {
      endGame(game, playerInfo.roomId);
      return;
    }

    socket.emit('card-drawn', {
      card,
      hand: game.getPlayerData(socket.id).hand
    });

    io.to(playerInfo.roomId).emit('game-update', {
      gameState: game.getPublicGameState()
    });
  });

  // Jouer une carte
  socket.on('play-card', ({ cardIndex, targetPlayerId, action }) => {
    const { playerInfo, game } = getContext();
    if (!game || !game.gameStarted || game.finished) return;

    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas votre tour" });
      return;
    }
    if (currentPlayer.chancePending) {
      socket.emit('error', { message: "Choisis d'abord ta carte dans la défausse !" });
      return;
    }

    const result = game.playCard(socket.id, cardIndex, targetPlayerId, action);
    if (!result.success) {
      socket.emit('error', { message: result.message });
      return;
    }

    io.to(playerInfo.roomId).emit('card-played', {
      playerId: socket.id,
      playerName: playerInfo.playerName,
      message: result.message,
      gameState: game.getPublicGameState()
    });

    // Casino ouvert : notifier tout le monde + proposer au joueur de parier
    if (result.casinoOpened) {
      io.to(playerInfo.roomId).emit('casino-opened', {
        message: result.message,
        playerId: socket.id,
        playerName: playerInfo.playerName
      });
      if (result.shouldPromptBet) {
        socket.emit('casino-prompt-bet', {
          message: "Veux-tu parier un salaire immédiatement ?"
        });
      }
    }

    // Carte Chance : le tour reste au joueur jusqu'à son choix dans la défausse
    if (result.chanceActivated) {
      socket.emit('chance-activated', {
        message: "Choisis une carte dans la défausse ! 🍀",
        discardPile: game.discardPile
      });
      socket.emit('hand-update', {
        hand: game.getPlayerData(socket.id).hand,
        playerState: game.getPlayerData(socket.id)
      });
      io.to(playerInfo.roomId).emit('game-update', { gameState: game.getPublicGameState() });
      return; // finishTurn sera appelé après take-discard-card
    }

    // Tsunami : envoyer leur nouvelle main à tous les joueurs, pas de pioche auto
    if (result.tsunami) {
      game.players.forEach(p => {
        io.to(p.id).emit('hand-update', {
          hand: game.getPlayerData(p.id).hand,
          playerState: game.getPlayerData(p.id),
          tsunami: true
        });
      });
      finishTurn(game, playerInfo.roomId, socket.id, { refill: false });
      return;
    }

    finishTurn(game, playerInfo.roomId, socket.id);
  });

  // Prendre la dernière carte défaussée (1 fois par tour, avant de jouer)
  socket.on('take-discard', () => {
    const { playerInfo, game } = getContext();
    if (!game || !game.gameStarted || game.finished) return;

    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas votre tour" });
      return;
    }
    if (currentPlayer.hasTakenFromDiscard) {
      socket.emit('error', { message: 'Vous avez déjà pris une carte de la défausse ce tour' });
      return;
    }
    if (game.discardPile.length === 0) {
      socket.emit('error', { message: 'La défausse est vide' });
      return;
    }

    const card = game.discardPile.pop();
    currentPlayer.hand.push(card);
    currentPlayer.hasTakenFromDiscard = true;

    socket.emit('card-taken-from-discard', {
      card,
      hand: game.getPlayerData(socket.id).hand
    });

    io.to(playerInfo.roomId).emit('game-update', {
      gameState: game.getPublicGameState()
    });
  });

  // Choisir une carte de la défausse (suite de la carte Chance)
  socket.on('take-discard-card', ({ cardIndex }) => {
    const { playerInfo, game } = getContext();
    if (!game || !game.gameStarted || game.finished) return;

    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas votre tour" });
      return;
    }
    if (!currentPlayer.chancePending) {
      socket.emit('error', { message: "Tu dois d'abord jouer une carte Chance" });
      return;
    }

    const result = game.takeDiscardCard(socket.id, cardIndex);
    if (!result.success) {
      socket.emit('error', { message: result.message });
      return;
    }

    currentPlayer.chancePending = false;

    io.to(playerInfo.roomId).emit('card-played', {
      playerId: socket.id,
      playerName: playerInfo.playerName,
      message: result.message,
      gameState: game.getPublicGameState()
    });

    socket.emit('card-taken-from-discard', {
      card: result.card,
      hand: game.getPlayerData(socket.id).hand
    });

    // La carte Chance a remplacé la pioche : on termine le tour sans recompléter au-delà de 5
    finishTurn(game, playerInfo.roomId, socket.id);
  });

  // Parier au casino (possible même hors de son tour : on sacrifie alors son prochain tour)
  socket.on('casino-bet', ({ salaryCardIndex }) => {
    const { playerInfo, game } = getContext();
    if (!game || !game.gameStarted || game.finished) return;

    const result = game.placeCasinoBet(socket.id, salaryCardIndex);
    if (!result.success) {
      socket.emit('error', { message: result.message });
      return;
    }

    io.to(playerInfo.roomId).emit('casino-bet-placed', {
      playerName: playerInfo.playerName,
      message: result.message,
      gameState: game.getPublicGameState(),
      betCount: game.casinoBets.length
    });

    socket.emit('hand-update', {
      hand: game.getPlayerData(socket.id).hand,
      playerState: game.getPlayerData(socket.id)
    });

    // Parier coûte un tour : si c'est son tour, il passe ; sinon il sautera le prochain
    if (result.skipTurn) {
      const player = game.players.find(p => p.id === socket.id);
      if (game.getCurrentPlayer().id === socket.id) {
        finishTurn(game, playerInfo.roomId, socket.id);
      } else if (player) {
        player.skipNextTurn = true;
        io.to(playerInfo.roomId).emit('game-update', { gameState: game.getPublicGameState() });
      }
    }

    // 2e pari : résoudre le duel après un délai de suspense
    if (result.shouldResolve) {
      setTimeout(() => {
        const duelResult = game.resolveCasinoBets();
        if (!duelResult.success) return;

        io.to(playerInfo.roomId).emit('casino-resolved', {
          ...duelResult,
          gameState: game.getPublicGameState()
        });

        io.to(duelResult.winnerId).emit('hand-update', {
          hand: game.getPlayerData(duelResult.winnerId)?.hand || [],
          playerState: game.getPlayerData(duelResult.winnerId)
        });
      }, 1500);
    }
  });

  // Démissionner de son métier
  socket.on('resign-job', () => {
    const { playerInfo, game } = getContext();
    if (!game || !game.gameStarted || game.finished) return;

    if (game.getCurrentPlayer().id !== socket.id) {
      socket.emit('error', { message: "Ce n'est pas votre tour" });
      return;
    }

    const result = game.resignJob(socket.id);
    if (!result.success) {
      socket.emit('error', { message: result.message });
      return;
    }

    io.to(playerInfo.roomId).emit('card-played', {
      playerId: socket.id,
      playerName: playerInfo.playerName,
      message: result.message,
      gameState: game.getPublicGameState()
    });

    socket.emit('hand-update', {
      hand: game.getPlayerData(socket.id).hand,
      playerState: game.getPlayerData(socket.id)
    });

    // Démissionner consomme le tour. Le malus "saute un tour" est déjà posé
    // par resignJob via skipNextTurn : nextTurn() le gérera naturellement
    // au prochain passage, sans ignorer la prison des autres joueurs.
    if (result.skipsTurn) {
      // Le joueur vient de jouer son action : son skipNextTurn s'applique au tour SUIVANT.
      // On passe simplement la main, le flag reste armé.
      const turnResult = game.nextTurn();
      if (turnResult.skipped) {
        turnResult.skippedPlayers.forEach(sp => {
          const reason = sp.reason === 'prison' ? `⛓️ ${sp.name} est en prison !` : `⏭️ ${sp.name} saute son tour !`;
          io.to(playerInfo.roomId).emit('player-skipped-turn', { playerName: sp.name, reason });
        });
      }
      const nextPlayer = game.getCurrentPlayer();
      io.to(playerInfo.roomId).emit('turn-changed', {
        currentPlayerId: nextPlayer.id,
        currentPlayerName: nextPlayer.name,
        gameState: game.getPublicGameState()
      });
    } else {
      // Démission instantanée : le joueur peut continuer son tour
      io.to(playerInfo.roomId).emit('game-update', { gameState: game.getPublicGameState() });
    }
  });

  // Chat
  socket.on('send-message', ({ message }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    io.to(playerInfo.roomId).emit('chat-message', {
      playerName: playerInfo.playerName,
      message,
      timestamp: Date.now()
    });
  });

  // Soundboard synchronisé
  socket.on('play-sound', ({ soundFile, soundName, isLocal, procedural }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    socket.to(playerInfo.roomId).emit('sound-played', {
      soundFile,
      soundName,
      playerName: playerInfo.playerName,
      isLocal: isLocal || false,
      procedural: procedural || false
    });
  });

  // Déconnexion
  socket.on('disconnect', () => {
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.roomId);
      if (game) {
        const wasCurrentPlayer = game.gameStarted && !game.finished &&
          game.getCurrentPlayer() && game.getCurrentPlayer().id === socket.id;

        const shouldDelete = game.removePlayer(socket.id);

        if (shouldDelete) {
          games.delete(playerInfo.roomId);
          console.log(`Partie ${playerInfo.roomId} supprimée`);
        } else {
          io.to(playerInfo.roomId).emit('player-left', {
            playerName: playerInfo.playerName,
            gameState: game.getPublicGameState(),
            newHostId: game.hostId
          });

          // Une partie à 1 joueur n'a plus de sens : on la termine
          if (game.gameStarted && !game.finished && game.players.length < 2) {
            endGame(game, playerInfo.roomId);
          } else if (wasCurrentPlayer) {
            // Le joueur dont c'était le tour est parti : annoncer le nouveau tour
            const nextPlayer = game.getCurrentPlayer();
            io.to(playerInfo.roomId).emit('turn-changed', {
              currentPlayerId: nextPlayer.id,
              currentPlayerName: nextPlayer.name,
              gameState: game.getPublicGameState()
            });
          }
        }
      }
      players.delete(socket.id);
    }

    console.log(`Joueur déconnecté : ${socket.id}`);
  });
});

const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0'; // Écoute sur toutes les interfaces (LAN)

server.listen(PORT, HOST, () => {
  console.log(`🎮 Serveur Smile Life lancé sur ${HOST}:${PORT}`);
  console.log('📡 Réseau local activé !');

  const os = require('os');
  const interfaces = os.networkInterfaces();
  console.log('\n🌐 Adresses IP disponibles :');
  console.log(`   - Localhost: http://localhost:${PORT}`);

  Object.keys(interfaces).forEach(interfaceName => {
    interfaces[interfaceName].forEach(iface => {
      if (iface.family === 'IPv4' && !iface.internal) {
        console.log(`   - ${interfaceName}: http://${iface.address}:${PORT}`);
      }
    });
  });
  console.log('\n💡 Partage cette IP avec tes amis pour jouer en réseau local !');
});
