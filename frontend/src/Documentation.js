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
            <p>• 4 niveaux : BAC (+1), BAC+2 (+2), BAC+3 (+2), BAC+5 (+3)</p>
            <p>• Augmente votre niveau d'études (cumulatif)</p>
            <p>• Nécessaire pour débloquer certains métiers</p>
            <p>• Certains métiers permettent d'étudier en travaillant</p>
          </div>

          <div className="card-type">
            <h4>💼 MÉTIERS</h4>
            <p>• <strong>Conditions :</strong> Niveau d'études requis</p>
            <p>• <strong>Limite :</strong> 1 seul métier à la fois</p>
            <p>• Permet de recevoir des salaires</p>
            <p>• <strong>Liste des métiers :</strong></p>
            <ul>
              <li>🍺 Barman (0) : Niv.1 max - Démission instant</li>
              <li>🛍️ Vendeur (1) : Niv.1 max - Démission instant</li>
              <li>🎨 Artiste (2) : Niv.2 max - Démission instant</li>
              <li>👮 Policier (2) : Niv.1 max - Arrête les bandits !</li>
              <li>💉 Infirmier (3) : Niv.2 max - Peut étudier</li>
              <li>⚙️ Ingénieur (5) : Niv.3 max - Peut étudier</li>
              <li>⚖️ Avocat (5) : Niv.3 max - Peut étudier</li>
              <li>🩺 Chirurgien (6) : Niv.4 max - Peut étudier</li>
              <li>🪖 Militaire (0) : Niv.1 max - Bloque les attentats !</li>
              <li>🦹 Bandit (0) : Niv.4 max - Ne peut pas être licencié !</li>
            </ul>
            <p>• <strong>Démission :</strong> Certains métiers te font sauter ton tour si tu démissionnes</p>
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
            <p>• 5 lieux différents : Café, Cinéma, Parc, Hôtel 🏨, Camping ⛺</p>
            <p>• <strong>Limite :</strong> Maximum 5 flirts (sauf si adultère)</p>
            <p>• <strong>Règle VOL :</strong> Si tu poses un flirt au même endroit que le <strong>dernier flirt visible</strong> d'un adversaire, tu le lui voles !</p>
            <p>• Exemple : Alice a [Parc, Cinéma], Bob pose Cinéma → Bob vole le Cinéma d'Alice</p>
            <p>• Si Alice avait [Cinéma, Parc], Bob ne peut pas voler (Parc est le dernier)</p>
            <p>• <strong>Bébé surprise :</strong> Les flirts 🏨 Hôtel et ⛺ Camping peuvent créer un bébé inattendu !</p>
          </div>

          <div className="card-type">
            <h4>💒 MARIAGE</h4>
            <p>• <strong>Conditions :</strong> Au moins 1 flirt</p>
            <p>• <strong>Limite :</strong> 1 seul mariage (sauf après divorce)</p>
            <p>• Permet d'avoir des enfants volontairement</p>
            <p>• <strong>Bonus :</strong> Réduit de moitié le coût des logements !</p>
          </div>

          <div className="card-type">
            <h4>👶 ENFANTS</h4>
            <p>• <strong>Conditions :</strong> Être marié (pour bébé volontaire)</p>
            <p>• <strong>Bébés surprises :</strong> Flirts à l'hôtel ou au camping</p>
            <p>• Pas de limite de nombre</p>
            <p>• +3 smiles par enfant</p>
          </div>

          <div className="card-type">
            <h4>🐾 ANIMAUX</h4>
            <p>• 3 types : Chat 🐱 (+2), Chien 🐕 (+2), Lapin 🐰 (+1)</p>
            <p>• Aucune condition</p>
            <p>• Gratuits et illimités</p>
          </div>

          <div className="card-type">
            <h4>🏠 LOGEMENTS</h4>
            <p>• 3 types disponibles :</p>
            <ul>
              <li>🏢 Appartement : 6 salaires (3 si marié) → +3 smiles</li>
              <li>🏠 Maison : 8 salaires (4 si marié) → +4 smiles</li>
              <li>🏰 Villa : 10 salaires (5 si marié) → +5 smiles</li>
            </ul>
            <p>• <strong>Astuce :</strong> Marie-toi avant d'acheter pour payer moitié prix !</p>
          </div>

          <div className="card-type">
            <h4>✈️ VOYAGES</h4>
            <p>• 4 destinations :</p>
            <ul>
              <li>🗼 Paris : 2 salaires → +3 smiles</li>
              <li>🗽 New York : 3 salaires → +4 smiles</li>
              <li>🗾 Tokyo : 4 salaires → +5 smiles</li>
              <li>🏝️ Bahamas : 5 salaires → +6 smiles</li>
            </ul>
            <p>• <strong>Coût :</strong> Les salaires dépensés sont perdus définitivement</p>
            <p>• Rapporte beaucoup de smiles</p>
          </div>

          <div className="card-type danger">
            <h4>💔 MALUS (à jouer sur adversaires)</h4>
            <ul>
              <li><strong>💔 Divorce</strong> : Retire le mariage (-3 smiles)</li>
              <li><strong>📉 Licenciement</strong> : Retire le métier + tous les salaires (-2 smiles)</li>
              <li><strong>🚨 Accident</strong> : -2 smiles + <strong>saute le prochain tour</strong></li>
              <li><strong>😰 Burn-out</strong> : -1 smile + <strong>saute le prochain tour</strong> (nécessite un métier)</li>
              <li><strong>🤒 Maladie</strong> : <strong>Saute le prochain tour</strong></li>
              <li><strong>⛓️ Prison</strong> : <strong>Saute 3 tours</strong> + perd le métier Bandit</li>
              <li><strong>💣 Attentat</strong> : Tue tous les enfants du joueur ciblé !</li>
            </ul>
            <p>• <strong>Protection :</strong> Le � Militaire empêche les attentats</p>
          </div>

          <div className="card-type special">
            <h4>✨ CARTES SPÉCIALES</h4>
            <ul>
              <li><strong>😈 Adultère</strong> : Permet de flirter en étant marié (pas de limite de flirts)</li>
              <li><strong>🍀 Chance</strong> : +2 smiles bonus immédiat</li>
              <li><strong>🎂 Anniversaire</strong> : +1 smile + Vole le dernier salaire de chaque adversaire !</li>
              <li><strong>🎰 Casino</strong> : Ouvre un duel de paris (voir section dédiée)</li>
              <li><strong>🌊 Tsunami</strong> : Mélange TOUTES les cartes de TOUS les joueurs et redistribue ! Chaos total !</li>
            </ul>
          </div>
        </section>

        <section className="docs-section">
          <h3>🎰 Le Casino (Nouveau système)</h3>
          <div className="casino-rules">
            <h4>Comment ça marche ?</h4>
            <ol>
              <li><strong>Ouverture :</strong> Un joueur joue la carte 🎰 Casino</li>
              <li><strong>Proposition :</strong> Le joueur peut immédiatement parier un salaire de sa main</li>
              <li><strong>Duel :</strong> Un autre joueur (1 seul !) peut parier un salaire de sa main</li>
              <li><strong>Paris cachés :</strong> Les niveaux des salaires restent secrets</li>
              <li><strong>Résolution automatique :</strong> Dès que 2 joueurs ont parié, le duel se lance</li>
            </ol>

            <h4>Règle du duel :</h4>
            <div className="rule-box">
              <p>🎲 <strong>Si les 2 salaires ont le MÊME niveau</strong> → Le 2ème joueur (dernier à parier) gagne !</p>
              <p>🎲 <strong>Si les 2 salaires ont des niveaux DIFFÉRENTS</strong> → Le 1er joueur gagne !</p>
            </div>

            <h4>Exemples :</h4>
            <ul>
              <li>Alice parie Niv.2, Bob parie Niv.2 → <strong>Bob gagne</strong> (même niveau)</li>
              <li>Alice parie Niv.3, Bob parie Niv.1 → <strong>Alice gagne</strong> (différent)</li>
              <li>Alice parie Niv.4, Bob parie Niv.4 → <strong>Bob gagne</strong> (même niveau)</li>
            </ul>

            <h4>Gain :</h4>
            <p>Le gagnant récupère les 2 salaires dans ses salaires posés !</p>
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
            <li>Surveille le <strong>dernier flirt visible</strong> des adversaires pour le voler</li>
            <li>Utilise les <strong>malus</strong> sur les joueurs en tête</li>
            <li>Les voyages et logements sont chers mais rapportent beaucoup !</li>
            <li><strong>Marie-toi avant d'acheter un logement</strong> pour économiser 50% !</li>
            <li>Le <strong>Bandit</strong> ne peut pas être licencié mais peut aller en prison</li>
            <li>Le <strong>Policier</strong> envoie automatiquement les bandits en prison</li>
            <li>Le <strong>Militaire</strong> protège contre les attentats</li>
            <li>Au <strong>Casino</strong>, parier en 2ème position est avantageux (gagne si égalité)</li>
            <li><strong>Anniversaire</strong> est très puissant : vole 1 salaire à chaque adversaire !</li>
          </ul>
        </section>

        <section className="docs-section">
          <h3>🎯 Actions possibles</h3>
          <ul>
            <li><strong>Jouer sur soi :</strong> Améliorer sa vie (études, métier, mariage, etc.)</li>
            <li><strong>Jouer sur adversaire :</strong> Lui donner un malus ou le mettre en prison</li>
            <li><strong>Défausser :</strong> Se débarrasser d'une carte inutile (pioche immédiate)</li>
            <li><strong>Démissionner :</strong> Changer de métier (attention : certains font sauter ton tour)</li>
            <li><strong>Parier au Casino :</strong> Tenter de doubler tes salaires !</li>
          </ul>
        </section>

        <section className="docs-section tips">
          <h3>⚠️ Points importants</h3>
          <ul>
            <li>Les <strong>salaires dans ta main</strong> ne comptent PAS pour la victoire (il faut les poser)</li>
            <li>Les <strong>flirts Hôtel et Camping</strong> peuvent créer des bébés surprise !</li>
            <li>Tu ne peux avoir qu'<strong>1 seul métier à la fois</strong></li>
            <li>Certains métiers te font <strong>sauter un tour si tu démissionnes</strong></li>
            <li>Le <strong>Tsunami</strong> redistribue TOUT : use-le quand tu es en retard !</li>
            <li>Au Casino, les paris sont <strong>pris de ta main</strong>, pas de tes salaires posés</li>
            <li>Les <strong>malus avec skip de tour</strong> sont cumulables (risque de sauter plusieurs tours)</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default Documentation;
