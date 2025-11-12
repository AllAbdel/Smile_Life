import React, { useEffect } from 'react';
import './Confetti.css';

const Confetti = ({ active, duration = 3000 }) => {
  useEffect(() => {
    if (active) {
      const timer = setTimeout(() => {
        // Les confettis s'arrêteront après la durée spécifiée
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [active, duration]);

  if (!active) return null;

  const confettiPieces = Array.from({ length: 50 }, (_, i) => i);

  return (
    <div className="confetti-container">
      {confettiPieces.map((i) => (
        <div
          key={i}
          className="confetti"
          style={{
            left: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 3}s`,
            backgroundColor: `hsl(${Math.random() * 360}, 70%, 60%)`,
            animationDuration: `${2 + Math.random() * 2}s`
          }}
        />
      ))}
    </div>
  );
};

export default Confetti;
