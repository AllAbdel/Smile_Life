// Classe Game : toute la logique des règles de Smile Life.
// Le serveur (server.js) ne fait que router les événements socket vers cette classe.

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
    this.finished = false;
    this.customCards = customCards || defaultCards;
    this.maxPlayers = 6;
    this.casinoActive = false;
    this.casinoBets = []; // Duel : 2 paris max
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
      housing: [],
      skipNextTurn: false,
      hasTakenFromDiscard: false,
      prisonTurns: 0,
      chancePending: false // Carte Chance jouée, en attente du choix dans la défausse
    });
    return true;
  }

  removePlayer(playerId) {
    const index = this.players.findIndex(p => p.id === playerId);
    if (index === -1) return false;

    this.players.splice(index, 1);
    if (this.players.length === 0) {
      return true; // La partie doit être supprimée
    }

    // Réajuster l'index du tour pour ne pas bloquer/sauter un joueur
    if (index < this.currentPlayerIndex) {
      this.currentPlayerIndex--;
    } else if (this.currentPlayerIndex >= this.players.length) {
      this.currentPlayerIndex = 0;
    }

    // Si c'est l'hôte qui part, transférer à un autre joueur
    if (this.hostId === playerId) {
      this.hostId = this.players[0].id;
    }

    // Retirer un éventuel pari casino orphelin
    this.casinoBets = this.casinoBets.filter(bet => bet.playerId !== playerId);

    return false;
  }

  initializeDeck() {
    this.deck = [];
    this.customCards.cards.forEach(cardTemplate => {
      for (let i = 0; i < (cardTemplate.quantity || 1); i++) {
        this.deck.push({ ...cardTemplate });
      }
    });
    this.shuffleDeck();
  }

  shuffleDeck() {
    for (let i = this.deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
    }
  }

  dealCards() {
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
    if (this.deck.length === 0) return null; // Fin de partie : la pioche ne se recycle pas

    const card = this.deck.pop();
    player.hand.push(card);
    return card;
  }

  refillHand(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return;
    while (player.hand.length < 5 && this.deck.length > 0) {
      player.hand.push(this.deck.pop());
    }
  }

  playCard(playerId, cardIndex, targetPlayerId = null, action = 'play') {
    const player = this.players.find(p => p.id === playerId);
    if (!player || cardIndex < 0 || cardIndex >= player.hand.length) {
      return { success: false, message: "Carte invalide" };
    }

    const card = player.hand[cardIndex];

    if (action === 'discard') {
      this.discardPile.push(card);
      player.hand.splice(cardIndex, 1);
      return { success: true, message: `${player.name} défausse une carte` };
    }

    if (action === 'play-self') {
      const result = this.applyCardToPlayer(card, player);
      if (result.success) {
        player.hand.splice(cardIndex, 1);
      }
      return result;
    }

    if (action === 'play-opponent' && targetPlayerId) {
      const targetPlayer = this.players.find(p => p.id === targetPlayerId);
      if (!targetPlayer) {
        return { success: false, message: "Joueur cible invalide" };
      }
      if (targetPlayer.id === player.id) {
        return { success: false, message: "Impossible de se cibler soi-même" };
      }
      // Seuls les malus se jouent sur un adversaire (validé côté serveur, pas seulement UX)
      if (card.type !== 'malus') {
        return { success: false, message: "Seuls les malus se jouent sur un adversaire" };
      }

      const result = this.applyCardToPlayer(card, targetPlayer, true);
      if (result.success) {
        player.hand.splice(cardIndex, 1);
      }
      return result;
    }

    return { success: false, message: "Action invalide" };
  }

  // Paiement exact d'un coût en salaires (subset-sum, valeurs petites).
  // Retourne la liste des cartes salaire à dépenser, ou null si impossible.
  findExactPayment(player, cost) {
    if (cost <= 0) return [];
    const cards = player.salary;
    // dp[montant] = liste d'indices de cartes pour atteindre ce montant
    const dp = new Array(cost + 1).fill(null);
    dp[0] = [];
    cards.forEach((card, idx) => {
      const value = card.salaryValue || 1;
      for (let amount = cost; amount >= value; amount--) {
        if (dp[amount] === null && dp[amount - value] !== null && !dp[amount - value].includes(idx)) {
          dp[amount] = [...dp[amount - value], idx];
        }
      }
    });
    if (dp[cost] === null) return null;
    return dp[cost].map(idx => cards[idx]);
  }

  // Dépense les salaires donnés : retirés de la réserve ET des cartes posées, smiles déduits
  spendSalaries(player, salaryCards) {
    salaryCards.forEach(salaryCard => {
      const reserveIdx = player.salary.indexOf(salaryCard);
      if (reserveIdx !== -1) player.salary.splice(reserveIdx, 1);
      const playedIdx = player.playedCards.indexOf(salaryCard);
      if (playedIdx !== -1) player.playedCards.splice(playedIdx, 1);
      player.smiles = Math.max(0, player.smiles - (salaryCard.smiles || 0));
    });
  }

  totalSalaryValue(player) {
    return player.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0);
  }

  applyCardToPlayer(card, player, isNegative = false) {
    switch (card.type) {
      case 'study': {
        if (player.job && !player.job.canStudyWhileWorking) {
          return { success: false, message: "Vous devez démissionner pour reprendre vos études" };
        }
        if (player.studies >= 8) {
          return { success: false, message: "Niveau maximum d'études atteint (8)" };
        }

        // Bonus de certains métiers (ex : Professeur)
        const bonus = (player.job && player.job.studyBonus) || 0;
        const gained = (card.studyLevel || 1) + bonus;
        const newStudies = Math.min(8, player.studies + gained);
        player.studies = newStudies;
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        const bonusText = bonus > 0 ? ` (dont +${bonus} grâce à son métier)` : '';
        return { success: true, message: `${player.name} gagne ${gained} niveau(x) d'études${bonusText} (total : ${newStudies})` };
      }

      case 'job': {
        if (player.studies < (card.requiredStudies || 0)) {
          return { success: false, message: "Niveau d'études insuffisant" };
        }
        if (player.job) {
          return { success: false, message: "Vous avez déjà un métier. Démissionnez d'abord" };
        }
        player.job = card;
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);

        // Pouvoir du Policier : arrêter automatiquement tous les Bandits
        if (card.arrestsBandit) {
          const arrestedBandits = [];
          this.players.forEach(otherPlayer => {
            if (otherPlayer.id !== player.id && otherPlayer.job && otherPlayer.job.name === 'Bandit') {
              this.sendToPrison(otherPlayer, 3);
              arrestedBandits.push(otherPlayer.name);
            }
          });
          if (arrestedBandits.length > 0) {
            return { success: true, message: `${player.name} devient Policier et arrête : ${arrestedBandits.join(', ')} ! (3 tours de prison)` };
          }
        }

        return { success: true, message: `${player.name} devient ${card.name}` };
      }

      case 'adultery':
        if (!player.married) {
          return { success: false, message: "Vous devez être marié(e) pour commettre un adultère" };
        }
        if (player.adultery) {
          return { success: false, message: "Vous êtes déjà en situation d'adultère" };
        }
        player.adultery = true;
        player.adulteryFlirts = 0;
        player.playedCards.push(card);
        return { success: true, message: `${player.name} peut maintenant flirter en étant marié(e)... 😈` };

      case 'flirt': {
        if (player.married && !player.adultery) {
          return { success: false, message: "Vous êtes marié(e), impossible de flirter" };
        }
        if (player.flirts.length >= 5 && !player.adultery) {
          return { success: false, message: "Maximum 5 flirts atteints" };
        }

        if (player.adultery && player.married) {
          player.adulteryFlirts++;
        }

        // Vol de flirt : si un adversaire a ce lieu comme DERNIER flirt, on le lui vole.
        // Un seul vol possible par carte jouée (premier adversaire trouvé).
        let stolenFlirt = null;
        let victimPlayer = null;
        for (const otherPlayer of this.players) {
          if (otherPlayer.id === player.id || otherPlayer.flirts.length === 0) continue;
          const lastFlirt = otherPlayer.flirts[otherPlayer.flirts.length - 1];
          if (lastFlirt.location === card.location) {
            stolenFlirt = otherPlayer.flirts.pop();
            victimPlayer = otherPlayer;
            otherPlayer.smiles = Math.max(0, otherPlayer.smiles - (stolenFlirt.smiles || 1));
            const flirtIndex = otherPlayer.playedCards.indexOf(stolenFlirt);
            if (flirtIndex !== -1) otherPlayer.playedCards.splice(flirtIndex, 1);
            break;
          }
        }

        player.flirts.push(card);
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);

        if (stolenFlirt) {
          player.flirts.push(stolenFlirt);
          player.playedCards.push(stolenFlirt);
          this.addSmiles(player, stolenFlirt.smiles || 1);
        }

        const message = stolenFlirt
          ? `${player.name} flirte à ${card.location} et vole le flirt de ${victimPlayer.name} !`
          : `${player.name} flirte à ${card.location}`;
        return { success: true, message };
      }

      case 'marriage':
        if (player.flirts.length === 0) {
          return { success: false, message: "Vous devez avoir au moins un flirt" };
        }
        if (player.married) {
          return { success: false, message: "Vous êtes déjà marié(e)" };
        }
        player.married = true;
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        return { success: true, message: `${player.name} se marie ! 💒` };

      case 'child':
        if (!player.married) {
          return { success: false, message: "Vous devez être marié(e)" };
        }
        player.children.push(card);
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        return { success: true, message: `${player.name} a un enfant ! 👶` };

      case 'pet':
        player.pets.push(card);
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        return { success: true, message: `${player.name} adopte ${card.name}` };

      case 'chance':
        if (this.discardPile.length === 0) {
          return { success: false, message: "La défausse est vide, la carte Chance ne sert à rien" };
        }
        // La carte est retirée du jeu (pas dans playedCards ni la défausse).
        // Le tour ne se termine que lorsque le joueur a choisi sa carte (chancePending).
        player.chancePending = true;
        return {
          success: true,
          message: `${player.name} joue la carte Chance ! 🍀`,
          chanceActivated: true
        };

      case 'special':
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);

        // Anniversaire : vole le dernier salaire posé de chaque adversaire
        if (card.effect === 'birthday' || card.name === 'Anniversaire') {
          let stolenSalaries = 0;
          this.players.forEach(otherPlayer => {
            if (otherPlayer.id !== player.id && otherPlayer.salary.length > 0) {
              const stolenSalary = otherPlayer.salary.pop();
              const playedIdx = otherPlayer.playedCards.indexOf(stolenSalary);
              if (playedIdx !== -1) otherPlayer.playedCards.splice(playedIdx, 1);
              otherPlayer.smiles = Math.max(0, otherPlayer.smiles - (stolenSalary.smiles || 1));

              player.salary.push(stolenSalary);
              player.playedCards.push(stolenSalary);
              player.smiles += stolenSalary.smiles || 1;
              stolenSalaries++;
            }
          });
          if (stolenSalaries > 0) {
            return { success: true, message: `${player.name} fête son anniversaire et vole ${stolenSalaries} salaire(s) ! 🎂` };
          }
        }

        return { success: true, message: `${player.name} : ${card.name}` };

      case 'salary': {
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
        this.addSmiles(player, card.smiles || 0);
        return { success: true, message: `${player.name} touche un salaire niveau ${salaryLevel} 💰` };
      }

      case 'travel': {
        let cost = card.cost || 0;
        // Pouvoir de certains métiers (ex : Astronaute) : réduction sur les voyages
        if (player.job && player.job.travelDiscount) {
          cost = Math.max(0, cost - player.job.travelDiscount);
        }

        const payment = this.findExactPayment(player, cost);
        if (payment === null) {
          return { success: false, message: `Impossible de payer ${cost} salaires (vous avez ${this.totalSalaryValue(player)})` };
        }
        this.spendSalaries(player, payment);
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        const discountText = (player.job && player.job.travelDiscount) ? ' (tarif réduit grâce à son métier ✈️)' : '';
        return { success: true, message: `${player.name} part en voyage : ${card.name}${discountText}` };
      }

      case 'housing': {
        let housingCost = card.cost || 0;
        if (player.married && card.marriedDiscount) {
          housingCost = Math.floor(housingCost / 2);
        }

        const payment = this.findExactPayment(player, housingCost);
        if (payment === null) {
          const discount = player.married && card.marriedDiscount ? ' (réduit car marié)' : '';
          return { success: false, message: `Coût : ${housingCost} salaires${discount}, vous avez ${this.totalSalaryValue(player)}` };
        }
        this.spendSalaries(player, payment);
        player.housing.push(card);
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        return { success: true, message: `${player.name} achète : ${card.name} 🏠` };
      }

      case 'tsunami': {
        // Le joueur pioche d'abord pour compenser la carte jouée
        if (this.deck.length > 0) {
          player.hand.push(this.deck.pop());
        }

        // Mélanger et redistribuer toutes les mains
        const allCards = [];
        this.players.forEach(p => {
          allCards.push(...p.hand);
          p.hand = [];
        });
        for (let i = allCards.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allCards[i], allCards[j]] = [allCards[j], allCards[i]];
        }
        let cardIndex = 0;
        while (allCards.length > 0) {
          this.players[cardIndex % this.players.length].hand.push(allCards.shift());
          cardIndex++;
        }

        // La carte Tsunami est retirée du jeu définitivement
        return {
          success: true,
          message: `🌊 ${player.name} déclenche un TSUNAMI ! Toutes les mains sont mélangées et redistribuées !`,
          tsunami: true
        };
      }

      case 'casino':
        if (this.casinoActive) {
          return { success: false, message: "Le casino est déjà ouvert" };
        }
        this.casinoActive = true;
        player.playedCards.push(card);
        return {
          success: true,
          message: `🎰 ${player.name} ouvre le CASINO ! Pariez vos salaires en duel !`,
          casinoOpened: true,
          shouldPromptBet: true
        };

      case 'malus':
        if (!isNegative) {
          return { success: false, message: "Cette carte ne peut être jouée que sur un adversaire" };
        }
        return this.applyMalus(card, player);

      default:
        player.playedCards.push(card);
        this.addSmiles(player, card.smiles || 0);
        return { success: true, message: `${player.name} joue ${card.name}` };
    }
  }

  // +smiles avec aura éventuelle du métier (ex : Influenceur)
  addSmiles(player, amount) {
    if (amount > 0 && player.job && player.job.smileAura) {
      amount += player.job.smileAura;
    }
    player.smiles += amount;
  }

  sendToPrison(player, turns) {
    player.prisonTurns = turns;
    if (player.job) {
      player.smiles = Math.max(0, player.smiles - (player.job.smiles || 0));
      player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
      player.job = null;
    }
  }

  applyMalus(card, player) {
    // Immunités de métier (ex : Pompier immunisé contre les accidents)
    if (player.job && Array.isArray(player.job.immuneEffects) && player.job.immuneEffects.includes(card.effect)) {
      return { success: false, message: `${player.name} est ${player.job.name} : immunisé contre « ${card.name} » !` };
    }

    switch (card.effect) {
      case 'divorce': {
        if (!player.married) {
          return { success: false, message: `${player.name} n'est pas marié(e)` };
        }
        player.married = false;
        const marriageCard = player.playedCards.find(c => c.type === 'marriage');
        player.playedCards = player.playedCards.filter(c => c.type !== 'marriage');
        const marriageSmiles = marriageCard ? (marriageCard.smiles || 5) : 5;
        player.smiles = Math.max(0, player.smiles - marriageSmiles);

        // Adultère découvert (a reflirté) : perd aussi tous ses enfants
        let message = `${player.name} divorce ! 💔`;
        if (player.adultery && player.adulteryFlirts > 0) {
          const childrenSmiles = player.children.reduce((sum, child) => sum + (child.smiles || 3), 0);
          player.smiles = Math.max(0, player.smiles - childrenSmiles);
          player.children = [];
          player.playedCards = player.playedCards.filter(c => c.type !== 'child');
          message = `${player.name} divorce et son adultère est découvert : il/elle perd aussi tous ses enfants ! 💔😱`;
        }

        player.adultery = false;
        player.adulteryFlirts = 0;
        player.playedCards = player.playedCards.filter(c => c.type !== 'adultery');
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message };
      }

      case 'fired': {
        if (!player.job) {
          return { success: false, message: `${player.name} n'a pas de métier` };
        }
        if (player.job.cannotBeFired) {
          return { success: false, message: `${player.name} est ${player.job.name}, impossible de le licencier !` };
        }
        const jobName = player.job.name;
        player.smiles = Math.max(0, player.smiles - (player.job.smiles || 0));
        player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
        player.job = null;
        // Les salaires déjà posés sont conservés
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message: `${player.name} est licencié(e) de son poste de ${jobName} ! 📉` };
      }

      case 'accident':
        player.smiles = Math.max(0, player.smiles - (card.smilesLoss || 2));
        player.skipNextTurn = true;
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message: `${player.name} a un accident : -${card.smilesLoss || 2} smiles et saute son prochain tour 🚨` };

      case 'burnout':
        if (!player.job) {
          return { success: false, message: `${player.name} n'a pas de métier` };
        }
        player.smiles = Math.max(0, player.smiles - (card.smilesLoss || 3));
        player.skipNextTurn = true;
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message: `${player.name} fait un burn-out : saute son prochain tour 😰` };

      case 'skip_turn':
        player.skipNextTurn = true;
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message: `${player.name} tombe malade et saute son prochain tour 🤒` };

      case 'prison':
        if (!player.job || player.job.name !== 'Bandit') {
          return { success: false, message: `${player.name} n'est pas un Bandit` };
        }
        this.sendToPrison(player, card.prisonTurns || 3);
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message: `${player.name} est envoyé(e) en prison pour ${card.prisonTurns || 3} tours ! ⛓️` };

      case 'attack': {
        const hasMilitary = this.players.some(p => p.job && p.job.preventAttacks);
        if (hasMilitary) {
          return { success: false, message: "Un Militaire est en jeu : tous les attentats sont bloqués ! 🪖" };
        }
        if (player.children.length === 0) {
          return { success: false, message: `${player.name} n'a pas d'enfants` };
        }
        const childrenSmiles = player.children.reduce((sum, child) => sum + (child.smiles || 3), 0);
        player.smiles = Math.max(0, player.smiles - childrenSmiles);
        const childCount = player.children.length;
        player.children = [];
        player.playedCards = player.playedCards.filter(c => c.type !== 'child');
        player.playedCards.push({ ...card, isMalus: true });
        return { success: true, message: `Attentat chez ${player.name} : ${childCount} enfant(s) perdus ! 💣` };
      }

      default:
        return { success: false, message: "Malus inconnu" };
    }
  }

  // Démission (bouton dédié ou changement de métier)
  resignJob(playerId) {
    const player = this.players.find(p => p.id === playerId);
    if (!player || !player.job) {
      return { success: false, message: "Vous n'avez pas de métier" };
    }

    const canQuitInstantly = player.job.canQuitInstantly || false;
    const jobName = player.job.name;

    // On perd le métier et ses smiles, mais on garde les salaires déjà posés
    player.smiles = Math.max(0, player.smiles - (player.job.smiles || 0));
    player.playedCards = player.playedCards.filter(c => c.id !== player.job.id);
    player.job = null;

    if (!canQuitInstantly) {
      player.skipNextTurn = true;
      return { success: true, message: `${player.name} démissionne de ${jobName} et saute son prochain tour`, skipsTurn: true };
    }
    return { success: true, message: `${player.name} démissionne de ${jobName}`, skipsTurn: false };
  }

  nextTurn() {
    const skippedPlayers = [];
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;

    let maxIterations = this.players.length * 4; // Garde-fou anti boucle infinie
    while (maxIterations > 0) {
      const currentPlayer = this.players[this.currentPlayerIndex];
      currentPlayer.hasTakenFromDiscard = false;

      if (currentPlayer.prisonTurns > 0) {
        currentPlayer.prisonTurns--;
        skippedPlayers.push({ name: currentPlayer.name, id: currentPlayer.id, reason: 'prison' });
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        maxIterations--;
        continue;
      }

      if (currentPlayer.skipNextTurn) {
        currentPlayer.skipNextTurn = false;
        skippedPlayers.push({ name: currentPlayer.name, id: currentPlayer.id, reason: 'skip' });
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
        maxIterations--;
        continue;
      }

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
    return { ...player };
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
        adultery: p.adultery,
        children: p.children,
        pets: p.pets,
        housing: p.housing,
        prisonTurns: p.prisonTurns,
        skipNextTurn: p.skipNextTurn,
        salaryCount: p.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0)
      })),
      currentPlayerIndex: this.currentPlayerIndex,
      deckSize: this.deck.length,
      discardPile: this.discardPile,
      gameStarted: this.gameStarted,
      casinoActive: this.casinoActive,
      // Les niveaux des paris restent SECRETS : on n'expose jamais betAmount
      casinoBets: this.casinoBets.map(bet => ({
        playerId: bet.playerId,
        playerName: bet.playerName
      }))
    };
  }

  takeDiscardCard(playerId, cardIndex) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "Joueur invalide" };
    if (cardIndex < 0 || cardIndex >= this.discardPile.length) {
      return { success: false, message: "Carte invalide" };
    }
    const card = this.discardPile.splice(cardIndex, 1)[0];
    player.hand.push(card);
    return { success: true, message: `${player.name} récupère ${card.name} de la défausse ! 🍀`, card };
  }

  placeCasinoBet(playerId, salaryCardIndex) {
    const player = this.players.find(p => p.id === playerId);
    if (!player) return { success: false, message: "Joueur invalide" };
    if (!this.casinoActive) {
      return { success: false, message: "Le casino n'est pas ouvert" };
    }
    if (this.casinoBets.length >= 2) {
      return { success: false, message: "Le duel est complet (2 joueurs maximum)" };
    }
    if (this.casinoBets.some(bet => bet.playerId === playerId)) {
      return { success: false, message: "Tu as déjà parié au casino !" };
    }

    const salaryCardsInHand = player.hand.filter(card => card.type === 'salary');
    if (salaryCardIndex < 0 || salaryCardIndex >= salaryCardsInHand.length) {
      return { success: false, message: "Carte salaire invalide dans votre main" };
    }

    const salaryCard = salaryCardsInHand[salaryCardIndex];
    const realIndex = player.hand.indexOf(salaryCard);
    player.hand.splice(realIndex, 1);

    this.casinoBets.push({
      playerId: player.id,
      playerName: player.name,
      salaryCard,
      betAmount: salaryCard.salaryValue || 1
    });

    // Le parieur pioche une carte pour compenser
    if (this.deck.length > 0) {
      player.hand.push(this.deck.pop());
    }

    if (this.casinoBets.length === 2) {
      return {
        success: true,
        message: `${player.name} relève le défi ! Le duel commence ! 🎰`,
        shouldResolve: true,
        skipTurn: true
      };
    }

    return {
      success: true,
      message: `${player.name} parie au casino (mise secrète)... En attente d'un adversaire ! 🎰`,
      skipTurn: true
    };
  }

  resolveCasinoBets() {
    if (this.casinoBets.length !== 2) {
      return { success: false, message: "Le duel nécessite exactement 2 joueurs" };
    }

    const [bet1, bet2] = this.casinoBets;
    let winnerBet, loserBet;

    // Règle maison : même niveau → le 2e parieur gagne, sinon le 1er gagne
    if (bet1.betAmount === bet2.betAmount) {
      winnerBet = bet2;
      loserBet = bet1;
    } else {
      winnerBet = bet1;
      loserBet = bet2;
    }

    const winner = this.players.find(p => p.id === winnerBet.playerId);
    const loser = this.players.find(p => p.id === loserBet.playerId);
    if (!winner || !loser) {
      // Un des duellistes a quitté : rendre sa mise au survivant
      this.casinoBets = [];
      return { success: false, message: "Un des joueurs a quitté la partie, duel annulé" };
    }

    // Le gagnant pose les 2 salaires
    [winnerBet.salaryCard, loserBet.salaryCard].forEach(salaryCard => {
      winner.salary.push(salaryCard);
      winner.playedCards.push(salaryCard);
      winner.smiles += salaryCard.smiles || 0;
    });

    // Le casino reste ouvert : on vide juste les paris pour le duel suivant
    this.casinoBets = [];

    return {
      success: true,
      winner: winner.name,
      winnerId: winner.id,
      loser: loser.name,
      loserId: loser.id,
      winnerLevel: winnerBet.betAmount,
      loserLevel: loserBet.betAmount,
      sameLevel: winnerBet.betAmount === loserBet.betAmount,
      totalWinnings: winnerBet.betAmount + loserBet.betAmount,
      message: winnerBet.betAmount === loserBet.betAmount
        ? `🎰 Même mise (niv.${winnerBet.betAmount}) ! ${winner.name} (2e parieur) remporte le duel !`
        : `🎰 Mises différentes (${bet1.betAmount} vs ${bet2.betAmount}) ! ${winner.name} (1er parieur) remporte le duel !`
    };
  }

  isGameOver() {
    return this.deck.length === 0;
  }

  getWinner() {
    return this.players.reduce((max, player) =>
      player.smiles > max.smiles ? player : max
    , this.players[0]);
  }

  getFinalResults() {
    return {
      winner: this.getWinner().name,
      finalScores: this.players
        .map(p => ({ name: p.name, smiles: p.smiles }))
        .sort((a, b) => b.smiles - a.smiles),
      stats: this.calculateStats()
    };
  }

  calculateStats() {
    const stats = {};

    const calcMax = (countFn) => {
      const max = Math.max(...this.players.map(countFn));
      return this.players.filter(p => countFn(p) === max && max > 0).map(p => ({ name: p.name, value: max }));
    };

    stats.mostMalus = calcMax(p => p.playedCards.filter(c => c.isMalus).length);
    stats.mostStudies = calcMax(p => p.studies);
    stats.mostSalaryEnd = calcMax(p => p.salary.reduce((sum, s) => sum + (s.salaryValue || 1), 0));
    stats.mostSalaryTotal = calcMax(p => p.playedCards.filter(c => c.type === 'salary').reduce((sum, s) => sum + (s.salaryValue || 1), 0));
    stats.mostTravels = calcMax(p => p.playedCards.filter(c => c.type === 'travel').length);
    stats.mostFlirts = calcMax(p => p.flirts.length);
    stats.mostChildren = calcMax(p => p.children.length);
    stats.mostPets = calcMax(p => p.pets.length);
    stats.mostJobs = calcMax(p => p.playedCards.filter(c => c.type === 'job').length);
    stats.mostMarriages = calcMax(p => p.playedCards.filter(c => c.type === 'marriage').length);

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

module.exports = Game;
