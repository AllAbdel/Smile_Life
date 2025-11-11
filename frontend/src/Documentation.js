import React from 'react';
import './Documentation.css';

const Documentation = ({ onClose }) => {
  return (
    <div className="docs-panel">
      <div className="docs-header">
        <h2>📖 Guide du jeu</h2>
        <button className="docs-close" onClick={onClose}>✕</button>
      </div>
      
      <div className="docs-content">
        <section className="docs-section">
          <h3>🎯 But du jeu</h3>
          <p>Accumuler le maximum de <strong>smiles (😊)</strong> en construisant votre vie et en perturbant celle des autres !</p>
        </section>

        <section className="docs-section">
          <h3>📚 Types de cartes</h3>
          
          <div className="card-type">
            <h4>📖 ÉTUDES</h4>
            <p>• Augmente votre niveau d'études (cumulatif)</p>
            <p>• Nécessaire pour débloquer certains métiers</p>
          </div>

          <div className="card-type">
            <h4>💼 MÉTIERS</h4>
            <p>• <strong>Conditions :</strong> Niveau d'études requis</p>
            <p>• <strong>Limite :</strong> 1 seul métier à la fois</p>
            <p>• Permet de recevoir des salaires</p>
            <p>• Chaque métier a un niveau de salaire maximum :</p>
            <ul>
              <li>Barman : Niveau 1 max</li>
              <li>Infirmier : Niveau 2 max</li>
              <li>Ingénieur : Niveau 3 max</li>
              <li>Chirurgien : Niveau 4 max</li>
            </ul>
          </div>

          <div className="card-type">
            <h4>💰 SALAIRES</h4>
            <p>• <strong>Conditions :</strong> Avoir un métier</p>
            <p>• 4 niveaux de salaires :</p>
            <ul>
              <li>Niveau 1 💰 : 1 salaire</li>
              <li>Niveau 2 💎 : 2 salaires</li>
              <li>Niveau 3 💍 : 3 salaires</li>
              <li>Niveau 4 👑 : 4 salaires</li>
            </ul>
            <p>• Peut poser uniquement les salaires ≤ au niveau max de son métier</p>
          </div>

          <div className="card-type">
            <h4>❤️ FLIRTS</h4>
            <p>• <strong>Limite :</strong> Maximum 5 flirts (sauf si adultère)</p>
            <p>• <strong>Règle spéciale :</strong> Si tu poses un flirt au même endroit que le <strong>dernier flirt</strong> d'un adversaire, tu le lui voles !</p>
            <p>• Exemple : Alice a [Parc, Cinéma], Bob pose Cinéma → Bob vole le Cinéma d'Alice</p>
            <p>• Si Alice avait [Cinéma, Parc], Bob ne peut pas voler le Cinéma (caché)</p>
          </div>

          <div className="card-type">
            <h4>💒 MARIAGE</h4>
            <p>• <strong>Conditions :</strong> Au moins 1 flirt</p>
            <p>• <strong>Limite :</strong> 1 seul mariage (sauf après divorce)</p>
            <p>• Permet d'avoir des enfants</p>
          </div>

          <div className="card-type">
            <h4>👶 ENFANTS</h4>
            <p>• <strong>Conditions :</strong> Être marié</p>
            <p>• Pas de limite</p>
          </div>

          <div className="card-type">
            <h4>🐾 ANIMAUX</h4>
            <p>• Aucune condition</p>
            <p>• Gratuits et illimités</p>
          </div>

          <div className="card-type">
            <h4>✈️ VOYAGES</h4>
            <p>• <strong>Coût :</strong> X salaires (indiqué sur la carte)</p>
            <p>• Les salaires dépensés sont perdus définitivement</p>
            <p>• Rapporte beaucoup de smiles</p>
          </div>

          <div className="card-type danger">
            <h4>💔 MALUS (à jouer sur adversaires)</h4>
            <ul>
              <li><strong>Divorce</strong> : Retire le mariage</li>
              <li><strong>Licenciement</strong> : Retire le métier + tous les salaires</li>
              <li><strong>Accident</strong> 🚨 : -2 smiles + <strong>saute le prochain tour</strong></li>
              <li><strong>Burn-out</strong> 😰 : -3 smiles + <strong>saute le prochain tour</strong></li>
              <li><strong>Maladie</strong> 🤒 : <strong>Saute le prochain tour</strong></li>
            </ul>
          </div>
        </section>

        <section className="docs-section">
          <h3>🎮 Déroulement</h3>
          <ol>
            <li>À ton tour, <strong>joue une carte</strong> de ta main</li>
            <li>Le jeu pioche <strong>automatiquement</strong> jusqu'à avoir 5 cartes</li>
            <li>Le tour passe au joueur suivant</li>
            <li>La partie se termine quand la pioche est vide</li>
            <li>Le joueur avec le plus de <strong>smiles</strong> gagne ! 🏆</li>
          </ol>
        </section>

        <section className="docs-section">
          <h3>💡 Stratégies</h3>
          <ul>
            <li>Accumule des <strong>études</strong> pour débloquer les meilleurs métiers</li>
            <li>Les <strong>métiers avancés</strong> donnent de meilleurs salaires</li>
            <li>Surveille le <strong>dernier flirt</strong> des adversaires pour le voler</li>
            <li>Utilise les <strong>malus</strong> sur les joueurs en tête</li>
            <li>Les voyages sont chers mais rapportent beaucoup !</li>
          </ul>
        </section>

        <section className="docs-section">
          <h3>🎯 Actions possibles</h3>
          <ul>
            <li><strong>Jouer sur soi :</strong> Améliorer sa vie</li>
            <li><strong>Jouer sur adversaire :</strong> Lui donner un malus</li>
            <li><strong>Défausser :</strong> Se débarrasser d'une carte inutile</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Documentation;
