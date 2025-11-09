const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');

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

// État du jeu
const games = new Map(); // roomId -> gameState
const players = new Map(); // socketId -> playerInfo

// Charger les cartes par défaut
const defaultCards = require('./cards/default-cards.json');

class Game {
  constructor(roomId, hostId, customCards = null) {
    this.roomId = roomId;
    this.hostId = hostId;
    this.players = [];
    this.deck = [];
    this.discardPile = [];
    this.currentPlayerIndex = 0;
    this.gameStarted = false;
    this.customCards = customCards || defaultCards;
    this.maxPlayers = 6;
  }

  addPlayer(playerId, playerName) {
    if (this.players.length >= this.maxPlayers) {
      return false;
    }
    
    this.players.push({
      id: playerId,
      name: playerName,
      hand: [],
      playedCards: [],
      smiles: 0,
      studies: 0,
      job: null,
      flirts: [],
      married: false,
      children: [],
      pets: [],
      salary: []
    });
    return true;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index !== -1) {
      this.players.splice(index, 1);
      if (this.players.length === 0) {
        return true; // Game should be deleted
      }
      // Si c'est l'hôte qui part, transférer à un autre joueur
      if (this.hostId === playerId && this.players.length > 0) {
        this.hostId = this.players[0].id;
      }
    }
    return false;
  }

  initializeDeck() {
    this.deck = [];
    
    // Créer le deck à partir des cartes personnalisées
    this.customCards.cards.forEach(cardTemplate => {
      for (let i = 0; i < (cardTemplate.quantity || 1); i++) {
        this.deck.push({ ...cardTemplate });
      }
    });
    
    // Mélanger le deck
    this.shuffleDeck();
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCards() {
    // Distribuer 5 cartes à chaque joueur
    this.players.forEach(player => {
      player.hand = [];
      for (let i = 0; i < 5; i++) {
        if (this.deck.length > 0) {
          player.hand.push(this.deck.pop());
        }
      }
    });
  }

  drawCard(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    if (this.deck.length === 0) {
      // Si le deck est vide, mélanger la défausse
      if (this.discardPile.length > 0) {
        this.deck = [...this.discardPile];
        this.discardPile = [];
        this.shuffleDeck();
      } else {
        return null; // Fin de partie
      }
    }

    const card = this.deck.pop();
    player.hand.push(card);
    return card;
  }

  playCard(playerId, cardIndex, targetPlayerId = null, action = 'play') {
    const player = this.players.find(p => p.id === playerId);
    if (!player || cardIndex >= player.hand.length) {
      return { success: false, message: "Carte invalide" };
    }

    const card = player.hand[cardIndex];
    
    if (action === 'discard') {
      // Défausser la carte
      this.discardPile.push(card);
      player.hand.splice(cardIndex, 1);
      return { success: true, message: "Carte défaussée" };
    }

    if (action === 'play-self') {
      // Jouer la carte sur soi-même
      const result = this.applyCardToPlayer(card, player);
      if (result.success) {
        player.hand.splice(cardIndex, 1);
      }
      return result;
    }

    if (action === 'play-opponent' && targetPlayerId) {
      // Jouer la carte sur un adversaire
      const targetPlayer = this.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer) {
        return { success: false, message: "Joueur cible invalide" };
      }
      
      const result = this.applyCardToPlayer(card, targetPlayer, true);
      if (result.success) {
        player.hand.splice(cardIndex, 1);
      }
      return result;
    }

    return { success: false, message: "Action invalide" };
  }

  applyCardToPlayer(card, player, isNegative = false) {
    // Logique pour appliquer les effets de la carte
    switch (card.type) {
      case 'study':
        player.studies += card.studyLevel || 1;
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a gagné ${card.studyLevel} niveaux d'études` };
      
      case 'job':
        if (player.studies >= (card.requiredStudies || 0)) {
          if (player.job) {
            // Démissionner de l'ancien job
            player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
          }
          player.job = card;
          player.playedCards.push(card);
          player.smiles += card.smiles || 0;
          return { success: true, message: `${player.name} a obtenu le métier: ${card.name}` };
        } else {
          return { success: false, message: "Niveau d'études insuffisant" };
        }
      
      case 'flirt':
        if (player.married && !player.adultery) {
          return { success: false, message: "Vous êtes marié(e), impossible de flirter" };
        }
        if (player.flirts.length >= 5 && !player.adultery) {
          return { success: false, message: "Maximum 5 flirts atteints" };
        }
        
        // Vérifier si un autre joueur a un flirt au même endroit
        this.players.forEach(otherPlayer => {
          if (otherPlayer.id !== player.id) {
            const sameLocationFlirt = otherPlayer.flirts.findIndex(f => f.location === card.location);
            if (sameLocationFlirt !== -1) {
              // Voler le flirt
              const stolenFlirt = otherPlayer.flirts.splice(sameLocationFlirt, 1)[0];
              player.flirts.push(stolenFlirt);
            }
          }
        });
        
        player.flirts.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} flirte à ${card.location}` };
      
      case 'marriage':
        if (player.flirts.length === 0) {
          return { success: false, message: "Vous devez avoir au moins un flirt" };
        }
        if (player.married) {
          return { success: false, message: "Vous êtes déjà marié(e)" };
        }
        player.married = true;
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} s'est marié(e)!` };
      
      case 'child':
        if (!player.married) {
          return { success: false, message: "Vous devez être marié(e)" };
        }
        player.children.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a eu un enfant!` };
      
      case 'pet':
        player.pets.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a adopté ${card.name}` };
      
      case 'salary':
        if (!player.job) {
          return { success: false, message: "Vous devez avoir un métier" };
        }
        player.salary.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a reçu un salaire` };
      
      case 'travel':
        const cost = card.cost || 0;
        if (player.salary.length < cost) {
          return { success: false, message: `Coût: ${cost} salaires nécessaires` };
        }
        // Retirer les salaires nécessaires
        for (let i = 0; i < cost; i++) {
          player.salary.pop();
        }
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} part en voyage à ${card.name}` };
      
      case 'malus':
        if (isNegative) {
          // Appliquer le malus
          this.applyMalus(card, player);
          player.playedCards.push({ ...card, isMalus: true });
          return { success: true, message: `${player.name} subit: ${card.name}` };
        }
        return { success: false, message: "Cette carte ne peut être jouée que sur un adversaire" };
      
      default:
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: "Carte jouée" };
    }
  }

  applyMalus(card, player) {
    switch (card.effect) {
      case 'divorce':
        if (player.married) {
          player.married = false;
          player.playedCards = player.playedCards.filter(c => c.type !== 'marriage');
        }
        break;
      
      case 'fired':
        if (player.job) {
          player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
          player.job = null;
          player.salary = [];
        }
        break;
      
      case 'accident':
        player.smiles = Math.max(0, player.smiles - (card.smilesLoss || 2));
        break;
      
      default:
        break;
    }
  }

  nextTurn() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
  }

  getCurrentPlayer() {
    return this.players[this.currentPlayerIndex];
  }

  getPlayerData(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return null;

    return {
      ...player,
      hand: player.hand // Le joueur voit sa propre main
    };
  }

  getPublicGameState() {
    return {
      roomId: this.roomId,
      hostId: this.hostId,
      players: this.players.map(p => ({
        id: p.id,
        name: p.name,
        handSize: p.hand.length,
        playedCards: p.playedCards,
        smiles: p.smiles,
        studies: p.studies,
        job: p.job,
        flirts: p.flirts,
        married: p.married,
        children: p.children,
        pets: p.pets,
        salaryCount: p.salary.length
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      deckSize: this.deck.length,
      discardPile: this.discardPile.length > 0 ? [this.discardPile[this.discardPile.length - 1]] : [],
      gameStarted: this.gameStarted
    };
  }

  isGameOver() {
    return this.deck.length === 0 && this.discardPile.length === 0;
  }

  getWinner() {
    return this.players.reduce((max, player) => 
      player.smiles > max.smiles ? player : max
    , this.players[0]);
  }
}

// Routes API
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', games: games.size, players: players.size });
});

// Socket.io gestion des connexions
io.on('connection', (socket) => {
  console.log(`Nouveau joueur connecté: ${socket.id}`);

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
    
    console.log(`Partie créée: ${roomId} par ${playerName}`);
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
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || game.hostId !== socket.id) {
      socket.emit('error', { message: 'Seul l\'hôte peut démarrer la partie' });
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
    
    // Envoyer à chaque joueur sa main
    game.players.forEach(player => {
      io.to(player.id).emit('hand-update', {
        hand: game.getPlayerData(player.id).hand
      });
    });
    
    console.log(`Partie ${playerInfo.roomId} démarrée`);
  });

  // Piocher une carte
  socket.on('draw-card', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }
    
    const card = game.drawCard(socket.id);
    if (!card) {
      // Fin de partie
      const winner = game.getWinner();
      io.to(playerInfo.roomId).emit('game-over', {
        winner: winner.name,
        finalScores: game.players.map(p => ({ name: p.name, smiles: p.smiles }))
      });
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
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }
    
    const result = game.playCard(socket.id, cardIndex, targetPlayerId, action);
    
    if (result.success) {
      io.to(playerInfo.roomId).emit('card-played', {
        playerId: socket.id,
        playerName: playerInfo.playerName,
        message: result.message,
        gameState: game.getPublicGameState()
      });
      
      socket.emit('hand-update', {
        hand: game.getPlayerData(socket.id).hand
      });
      
      // Tour suivant
      game.nextTurn();
      io.to(playerInfo.roomId).emit('turn-changed', {
        currentPlayerId: game.getCurrentPlayer().id,
        currentPlayerName: game.getCurrentPlayer().name
      });
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // Prendre la dernière carte défaussée
  socket.on('take-discard', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }
    
    if (game.discardPile.length === 0) {
      socket.emit('error', { message: 'La défausse est vide' });
      return;
    }
    
    const card = game.discardPile.pop();
    currentPlayer.hand.push(card);
    
    socket.emit('card-taken-from-discard', {
      card,
      hand: game.getPlayerData(socket.id).hand
    });
    
    io.to(playerInfo.roomId).emit('game-update', {
      gameState: game.getPublicGameState()
    });
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

  // Déconnexion
  socket.on('disconnect', () => {
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      const game = games.get(playerInfo.roomId);
      if (game) {
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
        }
      }
      players.delete(socket.id);
    }
    
    console.log(`Joueur déconnecté: ${socket.id}`);
  });
});

// Générer un code de partie unique
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🎮 Serveur Smile Life lancé sur le port ${PORT}`);
});
