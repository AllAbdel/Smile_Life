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
    this.casinoActive = false;
    this.casinoBets = []; // {playerId, playerName, salaryCard, betAmount}
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
      adultery: false,
      adulteryFlirts: 0, // Nombre de flirts après adultère
      children: [],
      pets: [],
      salary: [],
      housing: [], // Logements
      skipNextTurn: false,
      hasTakenFromDiscard: false,
      prisonTurns: 0
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
      
      // Si on défausse une carte adultère qui était en jeu, la retirer des cartes jouées
      if (card.type === 'adultery' && player.adultery) {
        player.adultery = false;
        player.adulteryFlirts = 0;
        player.playedCards = player.playedCards.filter(c => c.type !== 'adultery');
      }
      
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
        // Vérifier si le joueur a un métier qui ne permet pas d'étudier
        if (player.job && !player.job.canStudyWhileWorking) {
          return { success: false, message: "Vous devez démissionner pour reprendre vos études" };
        }
        
        // Plafonner à 8 niveaux d'études
        if (player.studies >= 8) {
          return { success: false, message: "Niveau maximum d'études atteint (8)" };
        }
        
        const newStudies = Math.min(8, player.studies + (card.studyLevel || 1));
        player.studies = newStudies;
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a gagné ${card.studyLevel} niveaux d'études (total: ${newStudies})` };
      
      case 'resign':
        // Démissionner de son métier
        if (!player.job) {
          return { success: false, message: "Vous n'avez pas de métier" };
        }
        
        const canQuitInstantly = player.job.canQuitInstantly || false;
        
        // Retirer le métier et les salaires
        player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
        player.job = null;
        player.salary = [];
        
        // Si le métier ne peut pas être quitté instantanément, sauter le prochain tour
        if (!canQuitInstantly) {
          player.skipNextTurn = true;
          return { success: true, message: `${player.name} a démissionné et saute son prochain tour` };
        }
        
        return { success: true, message: `${player.name} a démissionné` };
      
      case 'job':
        if (player.studies >= (card.requiredStudies || 0)) {
          if (player.job && !isNegative) {
            return { success: false, message: "Vous avez déjà un métier. Démissionnez d'abord (défaussez votre carte métier)" };
          }
          if (player.job) {
            // Démissionner de l'ancien job
            player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
          }
          player.job = card;
          player.playedCards.push(card);
          player.smiles += card.smiles || 0;
          
          // Si c'est un Policier, arrêter automatiquement tous les Bandits
          if (card.arrestsBandit) {
            let arrestedBandits = [];
            this.players.forEach(otherPlayer => {
              if (otherPlayer.id !== player.id && otherPlayer.job && otherPlayer.job.name === 'Bandit') {
                // Retirer les smiles du métier Bandit
                const banditSmiles = otherPlayer.job.smiles || 0;
                otherPlayer.smiles = Math.max(0, otherPlayer.smiles - banditSmiles);
                
                // Mettre le bandit en prison
                otherPlayer.prisonTurns = 3;
                otherPlayer.job = null;
                otherPlayer.playedCards = otherPlayer.playedCards.filter(c => c.type !== 'job' || c.name !== 'Bandit');
                arrestedBandits.push(otherPlayer.name);
              }
            });
            
            if (arrestedBandits.length > 0) {
              return { success: true, message: `${player.name} devient Policier et arrête les bandits: ${arrestedBandits.join(', ')} ! (3 tours de prison)` };
            }
          }
          
          return { success: true, message: `${player.name} a obtenu le métier: ${card.name}` };
        } else {
          return { success: false, message: "Niveau d'études insuffisant" };
        }
      
      case 'adultery':
        if (!player.married) {
          return { success: false, message: "Vous devez être marié(e) pour commettre un adultère" };
        }
        if (player.adultery) {
          return { success: false, message: "Vous êtes déjà en situation d'adultère" };
        }
        player.adultery = true;
        player.adulteryFlirts = 0; // Réinitialiser le compteur de flirts après adultère
        player.playedCards.push(card);
        return { success: true, message: `${player.name} peut maintenant flirter en étant marié(e) !` };
      
      case 'flirt':
        if (player.married && !player.adultery) {
          return { success: false, message: "Vous êtes marié(e), impossible de flirter" };
        }
        if (player.flirts.length >= 5 && !player.adultery) {
          return { success: false, message: "Maximum 5 flirts atteints" };
        }
        
        // Si en situation d'adultère, incrémenter le compteur de flirts après adultère
        if (player.adultery && player.married) {
          player.adulteryFlirts++;
        }
        
        // Vérifier si un autre joueur a ce lieu comme DERNIER flirt
        let stolenFlirt = null;
        let victimPlayer = null;
        
        this.players.forEach(otherPlayer => {
          if (otherPlayer.id !== player.id && otherPlayer.flirts.length > 0) {
            const lastFlirt = otherPlayer.flirts[otherPlayer.flirts.length - 1];
            if (lastFlirt.location === card.location) {
              // Voler le dernier flirt
              stolenFlirt = otherPlayer.flirts.pop();
              victimPlayer = otherPlayer;
              
              // Retirer les smiles du flirt volé à la victime
              otherPlayer.smiles = Math.max(0, otherPlayer.smiles - (stolenFlirt.smiles || 1));
              
              // Retirer aussi de ses cartes jouées
              const flirtIndex = otherPlayer.playedCards.findIndex(c => c.id === stolenFlirt.id && c.location === stolenFlirt.location);
              if (flirtIndex !== -1) {
                otherPlayer.playedCards.splice(flirtIndex, 1);
              }
            }
          }
        });
        
        // Ajouter le nouveau flirt
        player.flirts.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        
        // Si flirt volé, l'ajouter aussi
        if (stolenFlirt) {
          player.flirts.push(stolenFlirt);
          player.playedCards.push(stolenFlirt);
          player.smiles += stolenFlirt.smiles || 1;
        }
        
        const message = stolenFlirt 
          ? `${player.name} flirte à ${card.location} et vole le flirt de ${victimPlayer.name} ! (+${(card.smiles || 0) + (stolenFlirt.smiles || 0)} smiles)`
          : `${player.name} flirte à ${card.location}`;
        
        return { success: true, message };
      
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
      
      case 'special':
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        
        // Si c'est une carte Anniversaire, voler le dernier salaire de chaque adversaire
        if (card.id === 'special-3' || card.name === 'Anniversaire') {
          let stolenSalaries = 0;
          this.players.forEach(otherPlayer => {
            if (otherPlayer.id !== player.id && otherPlayer.salary.length > 0) {
              const stolenSalary = otherPlayer.salary.pop();
              const salarySmiles = stolenSalary.smiles || 1;
              
              // Retirer les smiles de la victime
              otherPlayer.smiles = Math.max(0, otherPlayer.smiles - salarySmiles);
              
              // Ajouter au joueur
              player.salary.push(stolenSalary);
              player.smiles += salarySmiles;
              stolenSalaries++;
            }
          });
          
          if (stolenSalaries > 0) {
            return { success: true, message: `${player.name} fête son anniversaire et vole ${stolenSalaries} salaire(s) !` };
          }
        }
        
        return { success: true, message: `${player.name} : ${card.name}` };
      
      case 'salary':
        if (!player.job) {
          return { success: false, message: "Vous devez avoir un métier" };
        }
        const salaryLevel = card.salaryLevel || 1;
        const maxSalaryLevel = player.job.maxSalaryLevel || 1;
        
        if (salaryLevel > maxSalaryLevel) {
          return { success: false, message: `Votre métier ne permet que les salaires jusqu'au niveau ${maxSalaryLevel}` };
        }
        
        player.salary.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a reçu un salaire niveau ${salaryLevel}` };
      
      case 'travel':
        const cost = card.cost || 0;
        
        // Calculer la valeur totale des salaires
        const totalSalaryValue = player.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0);
        
        if (totalSalaryValue < cost) {
          return { success: false, message: `Coût: ${cost} salaires nécessaires (vous avez ${totalSalaryValue})` };
        }
        
        // Retirer les salaires nécessaires intelligemment (en partant des plus gros)
        let remaining = cost;
        player.salary.sort((a, b) => (b.salaryValue || 1) - (a.salaryValue || 1)); // Trier par valeur décroissante
        
        while (remaining > 0 && player.salary.length > 0) {
          const salary = player.salary[0];
          const salaryValue = salary.salaryValue || 1;
          
          if (salaryValue <= remaining) {
            // On peut utiliser ce salaire entièrement
            player.salary.shift();
            player.smiles = Math.max(0, player.smiles - (salary.smiles || 0));
            remaining -= salaryValue;
          } else {
            // Le salaire vaut plus que ce qu'il reste à payer
            // On ne peut pas "casser" un salaire, donc impossible de payer
            return { success: false, message: `Impossible de payer exactement ${cost} salaires` };
          }
        }
        
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} part en voyage à ${card.name}` };
      
      case 'housing':
        let housingCost = card.cost || 0;
        
        // Réduction de 50% si marié
        if (player.married && card.marriedDiscount) {
          housingCost = Math.floor(housingCost / 2);
        }
        
        // Calculer la valeur totale des salaires
        const totalHousingSalary = player.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0);
        
        if (totalHousingSalary < housingCost) {
          const discount = player.married && card.marriedDiscount ? ' (réduit car marié)' : '';
          return { success: false, message: `Coût: ${housingCost} salaires${discount} nécessaires (vous avez ${totalHousingSalary})` };
        }
        
        // Retirer les salaires nécessaires
        let remainingHousing = housingCost;
        player.salary.sort((a, b) => (b.salaryValue || 1) - (a.salaryValue || 1));
        
        while (remainingHousing > 0 && player.salary.length > 0) {
          const salary = player.salary[0];
          const salaryValue = salary.salaryValue || 1;
          
          if (salaryValue <= remainingHousing) {
            player.salary.shift();
            player.smiles = Math.max(0, player.smiles - (salary.smiles || 0));
            remainingHousing -= salaryValue;
          } else {
            return { success: false, message: `Impossible de payer exactement ${housingCost} salaires` };
          }
        }
        
        player.housing.push(card);
        player.playedCards.push(card);
        player.smiles += card.smiles || 0;
        return { success: true, message: `${player.name} a acheté ${card.name} !` };
      
      case 'tsunami':
        // Mélanger et redistribuer toutes les cartes de tous les joueurs
        const allCards = [];
        
        // Récupérer toutes les cartes en main de tous les joueurs
        this.players.forEach(p => {
          allCards.push(...p.hand);
          p.hand = [];
        });
        
        // Mélanger
        for (let i = allCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }
        
        // Redistribuer équitablement
        let cardIndex = 0;
        while (allCards.length > 0) {
          this.players[cardIndex % this.players.length].hand.push(allCards.shift());
          cardIndex++;
        }
        
        return { success: true, message: `🌊 ${player.name} a déclenché un TSUNAMI ! Toutes les cartes ont été mélangées ! 🌊`, tsunami: true };
      
      case 'casino':
        // Activer le casino
        this.casinoActive = true;
        player.playedCards.push(card);
        return { success: true, message: `🎰 ${player.name} a ouvert le CASINO ! Tous les joueurs peuvent parier leurs salaires ! 🎰`, casinoOpened: true };
      
      case 'malus':
        if (isNegative) {
          // Vérifier les conditions selon le type de malus
          if (card.effect === 'divorce' && !player.married) {
            return { success: false, message: `${player.name} n'est pas marié(e)` };
          }
          if (card.effect === 'fired') {
            if (!player.job) {
              return { success: false, message: `${player.name} n'a pas de métier` };
            }
            if (player.job.cannotBeFired) {
              return { success: false, message: `${player.name} est un Bandit, impossible de le licencier !` };
            }
          }
          if (card.effect === 'burnout' && !player.job) {
            return { success: false, message: `${player.name} n'a pas de métier` };
          }
          if (card.effect === 'prison') {
            if (!player.job || player.job.name !== 'Bandit') {
              return { success: false, message: `${player.name} n'est pas un Bandit` };
            }
          }
          if (card.effect === 'attack') {
            // Vérifier si un militaire est en jeu
            const hasMilitary = this.players.some(p => p.job && p.job.preventAttacks);
            if (hasMilitary) {
              return { success: false, message: `Un Militaire empêche tous les attentats !` };
            }
            if (player.children.length === 0) {
              return { success: false, message: `${player.name} n'a pas d'enfants` };
            }
          }
          
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
          const marriageCard = player.playedCards.find(c => c.type === 'marriage');
          player.playedCards = player.playedCards.filter(c => c.type !== 'marriage');
          
          // Perte de smiles du mariage
          const marriageSmiles = marriageCard ? (marriageCard.smiles || 5) : 5;
          player.smiles = Math.max(0, player.smiles - marriageSmiles);
          
          // Si en adultère ET a reflirté au moins une fois, perdre TOUS les enfants
          if (player.adultery && player.adulteryFlirts > 0) {
            const childrenSmiles = player.children.reduce((sum, child) => sum + (child.smiles || 3), 0);
            player.smiles = Math.max(0, player.smiles - childrenSmiles);
            player.children = [];
            player.playedCards = player.playedCards.filter(c => c.type !== 'child');
          }
          
          // Retirer la carte adultère
          player.adultery = false;
          player.adulteryFlirts = 0;
          player.playedCards = player.playedCards.filter(c => c.type !== 'adultery');
        }
        break;
      
      case 'fired':
        if (player.job) {
          const jobSmiles = player.job.smiles || 0;
          player.smiles = Math.max(0, player.smiles - jobSmiles);
          player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
          player.job = null;
          // NE PAS retirer les salaires
        }
        break;
      
      case 'accident':
        player.smiles = Math.max(0, player.smiles - (card.smilesLoss || 2));
        player.skipNextTurn = true; // Sauter le prochain tour
        break;
      
      case 'burnout':
        player.smiles = Math.max(0, player.smiles - (card.smilesLoss || 3));
        player.skipNextTurn = true; // Sauter le prochain tour
        break;
      
      case 'skip_turn':
        player.skipNextTurn = true; // Sauter le prochain tour
        break;
      
      case 'prison':
        // Prison pour 3 tours
        player.prisonTurns = card.prisonTurns || 3;
        // Retirer le métier Bandit
        if (player.job && player.job.name === 'Bandit') {
          player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
          player.job = null;
        }
        break;
      
      case 'attack':
        // Attentat : tuer tous les enfants
        const childrenSmiles = player.children.reduce((sum, child) => sum + (child.smiles || 3), 0);
        player.smiles = Math.max(0, player.smiles - childrenSmiles);
        player.children = [];
        player.playedCards = player.playedCards.filter(c => c.type !== 'child');
        break;
      
      default:
        break;
    }
  }

  nextTurn() {
    const skippedPlayers = [];
    
    // Passer au joueur suivant
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    
    // Boucle pour gérer les joueurs qui doivent sauter leur tour
    let maxIterations = this.players.length; // Éviter une boucle infinie
    while (maxIterations > 0) {
      const currentPlayer = this.players[this.currentPlayerIndex];
      currentPlayer.hasTakenFromDiscard = false;
      
      // Vérifier si le joueur est en prison
      if (currentPlayer.prisonTurns > 0) {
        currentPlayer.prisonTurns--;
        console.log(`[TOUR] ${currentPlayer.name} est en prison ! ${currentPlayer.prisonTurns} tours restants`);
        
        skippedPlayers.push({ name: currentPlayer.name, id: currentPlayer.id, reason: 'prison' });
        
        // Passer au joueur suivant
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        maxIterations--;
        continue;
      }
      
      // Si le joueur suivant doit sauter son tour
      if (currentPlayer.skipNextTurn) {
        currentPlayer.skipNextTurn = false;
        console.log(`[TOUR] ${currentPlayer.name} saute son tour !`);
        
        skippedPlayers.push({ name: currentPlayer.name, id: currentPlayer.id, reason: 'skip' });
        
        // Passer au joueur suivant
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        maxIterations--;
        continue;
      }
      
      // Le joueur actuel peut jouer
      break;
    }
    
    return { skipped: skippedPlayers.length > 0, skippedPlayers };
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
        salaryCount: p.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0)
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      deckSize: this.deck.length,
      discardPile: this.discardPile, // Toute la défausse maintenant
      gameStarted: this.gameStarted,
      casinoActive: this.casinoActive,
      casinoBets: this.casinoBets
    };
  }

  placeCasinoBet(playerId, salaryCardIndex) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "Joueur invalide" };
    
    if (!this.casinoActive) {
      return { success: false, message: "Le casino n'est pas ouvert" };
    }
    
    if (salaryCardIndex >= player.salary.length) {
      return { success: false, message: "Carte salaire invalide" };
    }
    
    // Retirer la carte salaire de la main du joueur
    const salaryCard = player.salary.splice(salaryCardIndex, 1)[0];
    const betAmount = salaryCard.salaryValue || 1;
    
    // Retirer les smiles du salaire
    player.smiles = Math.max(0, player.smiles - (salaryCard.smiles || 0));
    
    // Ajouter le pari
    this.casinoBets.push({
      playerId: player.id,
      playerName: player.name,
      salaryCard: salaryCard,
      betAmount: betAmount
    });
    
    return { success: true, message: `${player.name} a parié ${betAmount} salaire(s) au casino !` };
  }

  resolveCasinoBets() {
    if (this.casinoBets.length === 0) {
      return { success: false, message: "Aucun pari au casino" };
    }
    
    // Tirer au sort un gagnant
    const winnerBet = this.casinoBets[Math.floor(Math.random() * this.casinoBets.length)];
    const winner = this.players.find(p => p.id === winnerBet.playerId);
    
    if (!winner) {
      return { success: false, message: "Erreur: gagnant introuvable" };
    }
    
    // Le gagnant récupère tous les salaires pariés
    let totalWinnings = 0;
    this.casinoBets.forEach(bet => {
      winner.salary.push(bet.salaryCard);
      winner.smiles += bet.salaryCard.smiles || 0;
      totalWinnings += bet.betAmount;
    });
    
    const losers = this.casinoBets
      .filter(bet => bet.playerId !== winner.id)
      .map(bet => bet.playerName);
    
    // Vider les paris
    this.casinoBets = [];
    
    return { 
      success: true, 
      winner: winner.name,
      winnerId: winner.id,
      totalWinnings: totalWinnings,
      losers: losers,
      message: `🎰 ${winner.name} remporte ${totalWinnings} salaire(s) au casino ! 🎰`
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

  calculateStats() {
    const stats = {
      mostMalus: [],
      mostStudies: [],
      mostSalaryEnd: [],
      mostSalaryTotal: [],
      mostTravels: [],
      mostFlirts: [],
      mostChildren: [],
      mostPets: [],
      mostJobs: [],
      mostMarriages: []
    };

    // Calculer chaque stat
    const calcMax = (field, countFn) => {
      const max = Math.max(...this.players.map(countFn));
      return this.players.filter(p => countFn(p) === max && max > 0).map(p => ({ name: p.name, value: max }));
    };

    stats.mostMalus = calcMax('malus', p => p.playedCards.filter(c => c.isMalus).length);
    stats.mostStudies = calcMax('studies', p => p.studies);
    stats.mostSalaryEnd = calcMax('salary', p => p.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0));
    stats.mostSalaryTotal = calcMax('salaryTotal', p => p.playedCards.filter(c => c.type === 'salary').reduce((sum, s) => sum + (s.salaryValue || 1), 0));
    stats.mostTravels = calcMax('travels', p => p.playedCards.filter(c => c.type === 'travel').length);
    stats.mostFlirts = calcMax('flirts', p => p.flirts.length);
    stats.mostChildren = calcMax('children', p => p.children.length);
    stats.mostPets = calcMax('pets', p => p.pets.length);
    stats.mostJobs = calcMax('jobs', p => p.playedCards.filter(c => c.type === 'job').length);
    stats.mostMarriages = calcMax('marriages', p => p.playedCards.filter(c => c.type === 'marriage').length);
    
    // Ajouter aussi les stats de tous les joueurs
    stats.allPlayers = this.players.map(p => ({
      name: p.name,
      smiles: p.smiles,
      studies: p.studies,
      malus: p.playedCards.filter(c => c.isMalus).length,
      salaryEnd: p.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0),
      salaryTotal: p.playedCards.filter(c => c.type === 'salary').reduce((sum, s) => sum + (s.salaryValue || 1), 0),
      travels: p.playedCards.filter(c => c.type === 'travel').length,
      flirts: p.flirts.length,
      children: p.children.length,
      pets: p.pets.length,
      jobs: p.playedCards.filter(c => c.type === 'job').length,
      marriages: p.playedCards.filter(c => c.type === 'marriage').length
    }));

    return stats;
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
      const player = game.players.find(p => p.id === socket.id);
      
      io.to(playerInfo.roomId).emit('card-played', {
        playerId: socket.id,
        playerName: playerInfo.playerName,
        message: result.message,
        gameState: game.getPublicGameState()
      });
      
      // Si c'est un Casino qui est ouvert, notifier tous les joueurs
      if (result.casinoOpened) {
        io.to(playerInfo.roomId).emit('casino-opened', {
          message: result.message
        });
      }
      
      // Si c'est un Tsunami, envoyer les nouvelles mains à tous les joueurs
      if (result.tsunami) {
        game.players.forEach(p => {
          io.to(p.id).emit('hand-update', {
            hand: game.getPlayerData(p.id).hand,
            playerState: game.getPlayerData(p.id),
            tsunami: true
          });
        });
      } else {
        // Piocher automatiquement jusqu'à avoir 5 cartes
        while (player.hand.length < 5 && game.deck.length > 0) {
          const drawnCard = game.drawCard(socket.id);
          if (!drawnCard) break;
        }
        
        socket.emit('hand-update', {
          hand: game.getPlayerData(socket.id).hand,
          playerState: game.getPlayerData(socket.id)
        });
      }
      
      io.to(playerInfo.roomId).emit('game-update', {
        gameState: game.getPublicGameState()
      });
      
      // Vérifier si la partie est terminée (pioche vide)
      if (game.deck.length === 0) {
        const stats = game.calculateStats();
        const winner = game.getWinner();
        io.to(playerInfo.roomId).emit('game-over', {
          winner: winner.name,
          finalScores: game.players.map(p => ({ name: p.name, smiles: p.smiles })).sort((a, b) => b.smiles - a.smiles),
          stats: stats
        });
        return;
      }
      
      // Tour suivant seulement APRÈS avoir pioché
      const turnResult = game.nextTurn();
      
      const nextPlayer = game.getCurrentPlayer();
      console.log(`[TOUR] Passage au joueur: ${nextPlayer.name} (ID: ${nextPlayer.id})`);
      
      // Si des joueurs ont sauté leur tour, envoyer un message pour chacun
      if (turnResult.skipped && turnResult.skippedPlayers) {
        turnResult.skippedPlayers.forEach(skippedPlayer => {
          if (skippedPlayer.reason === 'prison') {
            io.to(playerInfo.roomId).emit('player-skipped-turn', {
              playerName: skippedPlayer.name,
              reason: `⛓️ ${skippedPlayer.name} est en prison !`
            });
          } else {
            io.to(playerInfo.roomId).emit('player-skipped-turn', {
              playerName: skippedPlayer.name,
              reason: `⏭️ ${skippedPlayer.name} saute son tour !`
            });
          }
        });
      }
      
      // Vérifier si la partie est terminée
      if (game.isGameOver()) {
        const winner = game.getWinner();
        io.to(playerInfo.roomId).emit('game-over', {
          winner: winner.name,
          finalScores: game.players.map(p => ({ name: p.name, smiles: p.smiles }))
        });
      } else {
        const updatedGameState = game.getPublicGameState();
        console.log(`[TOUR] Index joueur actuel: ${updatedGameState.currentPlayerIndex}`);
        
        io.to(playerInfo.roomId).emit('turn-changed', {
          currentPlayerId: nextPlayer.id,
          currentPlayerName: nextPlayer.name,
          gameState: updatedGameState
        });
      }
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
    currentPlayer.hasTakenFromDiscard = true; // Marquer qu'il a pris
    
    socket.emit('card-taken-from-discard', {
      card,
      hand: game.getPlayerData(socket.id).hand
    });
    
    io.to(playerInfo.roomId).emit('game-update', {
      gameState: game.getPublicGameState()
    });
  });

  // Prendre une carte spécifique de la défausse (avec carte Chance)
  socket.on('take-discard-card', ({ cardIndex }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }
    
    if (cardIndex < 0 || cardIndex >= game.discardPile.length) {
      socket.emit('error', { message: 'Carte invalide' });
      return;
    }
    
    const card = game.discardPile.splice(cardIndex, 1)[0];
    currentPlayer.hand.push(card);
    
    socket.emit('card-taken-from-discard', {
      card,
      hand: game.getPlayerData(socket.id).hand
    });
    
    io.to(playerInfo.roomId).emit('game-update', {
      gameState: game.getPublicGameState()
    });
  });

  // Parier au casino
  socket.on('casino-bet', ({ salaryCardIndex }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const result = game.placeCasinoBet(socket.id, salaryCardIndex);
    
    if (result.success) {
      const player = game.players.find(p => p.id === socket.id);
      
      io.to(playerInfo.roomId).emit('casino-bet-placed', {
        playerName: playerInfo.playerName,
        message: result.message,
        gameState: game.getPublicGameState()
      });
      
      socket.emit('hand-update', {
        hand: game.getPlayerData(socket.id).hand,
        playerState: game.getPlayerData(socket.id)
      });
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // Résoudre les paris du casino
  socket.on('casino-resolve', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const result = game.resolveCasinoBets();
    
    if (result.success) {
      io.to(playerInfo.roomId).emit('casino-resolved', {
        winner: result.winner,
        winnerId: result.winnerId,
        totalWinnings: result.totalWinnings,
        losers: result.losers,
        message: result.message,
        gameState: game.getPublicGameState()
      });
      
      // Mettre à jour la main du gagnant
      const winner = game.players.find(p => p.id === result.winnerId);
      if (winner) {
        io.to(result.winnerId).emit('hand-update', {
          hand: game.getPlayerData(result.winnerId).hand,
          playerState: game.getPlayerData(result.winnerId)
        });
      }
    } else {
      socket.emit('error', { message: result.message });
    }
  });

  // Démissionner
  socket.on('resign-job', () => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    const game = games.get(playerInfo.roomId);
    if (!game || !game.gameStarted) return;
    
    const currentPlayer = game.getCurrentPlayer();
    if (currentPlayer.id !== socket.id) {
      socket.emit('error', { message: 'Ce n\'est pas votre tour' });
      return;
    }
    
    const player = game.players.find(p => p.id === socket.id);
    if (!player || !player.job) {
      socket.emit('error', { message: 'Vous n\'avez pas de métier' });
      return;
    }
    
    const canQuitInstantly = player.job.canQuitInstantly || false;
    const jobName = player.job.name;
    
    // Retirer le métier et les salaires
    player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
    player.job = null;
    player.salary = [];
    
    // Si le métier ne peut pas être quitté instantanément, sauter le prochain tour
    if (!canQuitInstantly) {
      io.to(playerInfo.roomId).emit('card-played', {
        playerId: socket.id,
        playerName: playerInfo.playerName,
        message: `${playerInfo.playerName} a démissionné de ${jobName} et saute son prochain tour`,
        gameState: game.getPublicGameState()
      });
      
      // Passer directement au tour suivant SANS appeler nextTurn() 
      // car le saut est déjà effectué ici
      game.currentPlayerIndex = (game.currentPlayerIndex + 1) % game.players.length;
      const nextPlayer = game.getCurrentPlayer();
      nextPlayer.hasTakenFromDiscard = false;
      
      io.to(playerInfo.roomId).emit('turn-changed', {
        currentPlayerId: nextPlayer.id,
        currentPlayerName: nextPlayer.name,
        gameState: game.getPublicGameState()
      });
    } else {
      io.to(playerInfo.roomId).emit('card-played', {
        playerId: socket.id,
        playerName: playerInfo.playerName,
        message: `${playerInfo.playerName} a démissionné de ${jobName}`,
        gameState: game.getPublicGameState()
      });
    }
    
    socket.emit('hand-update', {
      hand: game.getPlayerData(socket.id).hand,
      playerState: game.getPlayerData(socket.id)
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

  // Jouer un son (soundboard synchronisé)
  socket.on('play-sound', ({ soundFile, soundName }) => {
    const playerInfo = players.get(socket.id);
    if (!playerInfo) return;
    
    // Broadcast aux AUTRES joueurs (pas à soi-même)
    socket.to(playerInfo.roomId).emit('sound-played', {
      soundFile,
      soundName,
      playerName: playerInfo.playerName
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
