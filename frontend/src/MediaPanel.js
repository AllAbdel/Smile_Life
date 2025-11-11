import React, { useState } from 'react';
import './MediaPanel.css';

const MediaPanel = ({ onClose, socket }) => {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [embedUrl, setEmbedUrl] = useState('');
  const [currentMusic, setCurrentMusic] = useState(null);

  const musics = [
    { name: 'Lofi Chill', url: 'https://www.youtube.com/embed/jfKfPfyJRdk?autoplay=1', emoji: '🎵' },
    { name: 'Epic Music', url: 'https://www.youtube.com/embed/9CzcOcBb_ms?autoplay=1', emoji: '⚔️' },
    { name: 'Jazz', url: 'https://www.youtube.com/embed/Dx5qFachd3A?autoplay=1', emoji: '🎷' },
    { name: 'Nature Sounds', url: 'https://www.youtube.com/embed/n7bW7bcYGb0?autoplay=1', emoji: '🌿' },
  ];

  const sounds = [
    { name: 'Bravo !', emoji: '👏', file: 'https://www.myinstants.com/media/sounds/applause-3.mp3' },
    { name: 'Fail', emoji: '💀', file: 'https://www.myinstants.com/media/sounds/sad-trombone.mp3' },
    { name: 'Victoire', emoji: '🏆', file: 'https://www.myinstants.com/media/sounds/victory_1.mp3' },
    { name: 'Nope', emoji: '🚫', file: 'https://www.myinstants.com/media/sounds/wrong-answer-sound-effect.mp3' },
    { name: 'Air Horn', emoji: '📢', file: 'https://www.myinstants.com/media/sounds/mlg-airhorn.mp3' },
    { name: 'Bruh', emoji: '🤦', file: 'https://www.myinstants.com/media/sounds/movie_1.mp3' },
  ];

  const extractYouTubeId = (url) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handleYouTubeSubmit = (e) => {
    e.preventDefault();
    const videoId = extractYouTubeId(youtubeUrl);
    if (videoId) {
      setEmbedUrl(`https://www.youtube.com/embed/${videoId}?autoplay=1`);
      setCurrentMusic(null);
    } else {
      alert('URL YouTube invalide');
    }
  };

  const playMusic = (music) => {
    setEmbedUrl(music.url);
    setCurrentMusic(music.name);
  };

  const playSound = (sound) => {
    // Jouer localement
    const audio = new Audio(sound.file);
    audio.play().catch(err => console.log('Erreur lecture son:', err));
    
    // Émettre aux autres joueurs aussi
    if (socket) {
      socket.emit('play-sound', { soundFile: sound.file, soundName: sound.name });
    }
  };

  const stopAll = () => {
    setEmbedUrl('');
    setCurrentMusic(null);
    setYoutubeUrl('');
  };

  return (
    <div className="media-panel">
      <div className="media-header">
        <h2>🎬 Média & Sons</h2>
        <button className="media-close" onClick={onClose}>✕</button>
      </div>
      
      <div className="media-content">
        {/* Section YouTube custom */}
        <section className="media-section">
          <h3>📺 Vidéo YouTube</h3>
          <form onSubmit={handleYouTubeSubmit} className="youtube-form">
            <input
              type="text"
              placeholder="Colle un lien YouTube..."
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              className="youtube-input"
            />
            <button type="submit" className="youtube-btn">▶️ Lire</button>
          </form>
        </section>

        {/* Section musiques d'ambiance */}
        <section className="media-section">
          <h3>🎵 Musiques d'ambiance</h3>
          <div className="music-grid">
            {musics.map((music, index) => (
              <button
                key={index}
                className={`music-btn ${currentMusic === music.name ? 'active' : ''}`}
                onClick={() => playMusic(music)}
              >
                <span className="music-emoji">{music.emoji}</span>
                <span className="music-name">{music.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Section soundboard */}
        <section className="media-section">
          <h3>🔊 Soundboard</h3>
          <div className="sound-grid">
            {sounds.map((sound, index) => (
              <button
                key={index}
                className="sound-btn"
                onClick={() => playSound(sound)}
                title={sound.name}
              >
                <span className="sound-emoji">{sound.emoji}</span>
                <span className="sound-name">{sound.name}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Lecteur vidéo */}
        {embedUrl && (
          <section className="media-section">
            <div className="video-controls">
              <span>🎬 {currentMusic || 'Lecture en cours...'}</span>
              <button onClick={stopAll} className="stop-btn">⏹️ Arrêter</button>
            </div>
            <div className="video-container">
              <iframe
                src={embedUrl}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="YouTube video player"
              ></iframe>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MediaPanel;
