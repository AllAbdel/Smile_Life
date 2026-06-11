import React from 'react';
import GameCard from './GameCard';

const CATEGORIES = [
  { key: 'malus', name: 'Malus', icon: '💔', match: c => c.isMalus },
  { key: 'love', name: 'Amour', icon: '❤️', match: c => ['flirt', 'marriage', 'adultery'].includes(c.type) },
  { key: 'job', name: 'Métier', icon: '💼', match: c => c.type === 'job' },
  { key: 'salary', name: 'Salaires', icon: '💰', match: c => c.type === 'salary' },
  { key: 'child', name: 'Enfants', icon: '👶', match: c => c.type === 'child' },
  { key: 'pet', name: 'Animaux', icon: '🐾', match: c => c.type === 'pet' },
  { key: 'housing', name: 'Logement', icon: '🏠', match: c => c.type === 'housing' },
  { key: 'study', name: 'Études', icon: '📚', match: c => c.type === 'study' },
  { key: 'travel', name: 'Voyages', icon: '✈️', match: c => c.type === 'travel' },
  { key: 'other', name: 'Autre', icon: '🎴', match: () => true }
];

export const organizeCardsByCategory = (cards) => {
  const piles = CATEGORIES.map(cat => ({ ...cat, cards: [] }));
  cards.forEach(card => {
    const pile = piles.find(p => p.match(card));
    pile.cards.push(card);
  });
  return piles.filter(p => p.cards.length > 0);
};

// Affiche les cartes posées d'un joueur, groupées par catégorie
const CategoryPiles = ({ cards }) => {
  if (!cards || cards.length === 0) {
    return <p className="piles-empty">Aucune carte posée</p>;
  }

  return (
    <div className="piles">
      {organizeCardsByCategory(cards).map(category => (
        <div key={category.key} className="pile">
          <div className="pile-header">
            <span>{category.icon} {category.name}</span>
            <span className="pile-count">{category.cards.length}</span>
          </div>
          <div className="pile-cards">
            {category.cards.map((card, idx) => (
              <GameCard key={idx} card={card} variant="mini" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CategoryPiles;
