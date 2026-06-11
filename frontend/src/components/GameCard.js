import React from 'react';

// Carte de jeu réutilisable : main, modal, mini…
// variant: 'hand' (grande, en main) | 'mini' (posée) | 'pick' (dans un modal de choix)
const GameCard = ({
  card,
  variant = 'hand',
  selected = false,
  dragging = false,
  onClick,
  draggable = false,
  onDragStart,
  onDrag,
  onDragEnd
}) => {
  if (!card) return null;

  const typeClass = card.isMalus ? 'malus-received' : (card.type || 'other');

  return (
    <div
      className={`gcard gcard-${variant} gcard-type-${typeClass} ${selected ? 'is-selected' : ''} ${dragging ? 'is-dragging' : ''}`}
      onClick={onClick}
      draggable={draggable}
      onDragStart={onDragStart}
      onDrag={onDrag}
      onDragEnd={onDragEnd}
      title={card.description}
    >
      <div className="gcard-art">{card.image || '🎴'}</div>
      <div className="gcard-name">{card.name}</div>

      {variant !== 'mini' && (
        <div className="gcard-badges">
          {(card.smiles || 0) !== 0 && (
            <span className={`gcard-badge ${card.smiles > 0 ? 'badge-smile' : 'badge-loss'}`}>
              {card.smiles > 0 ? `+${card.smiles}` : card.smiles} 😊
            </span>
          )}
          {card.cost > 0 && <span className="gcard-badge badge-cost">💰 {card.cost}</span>}
          {card.salaryValue > 0 && <span className="gcard-badge badge-cost">💵 Niv.{card.salaryLevel || card.salaryValue}</span>}
          {card.requiredStudies > 0 && <span className="gcard-badge badge-study">🎓 {card.requiredStudies}</span>}
          {card.studyLevel > 0 && <span className="gcard-badge badge-study">+{card.studyLevel} 🎓</span>}
        </div>
      )}

      {variant === 'hand' && card.description && (
        <div className="gcard-desc">{card.description}</div>
      )}

      {variant === 'mini' && (card.smiles || 0) > 0 && (
        <span className="gcard-mini-smiles">+{card.smiles}</span>
      )}
    </div>
  );
};

export default GameCard;
