// 🎵 Gestionnaire de sons pour le drag & drop
class SoundManager {
  constructor() {
    this.sounds = {};
    this.enabled = true;
    this.volume = 0.3;
    
    // Créer les sons avec Web Audio API (pas besoin de fichiers)
    this.initSounds();
  }

  initSounds() {
    // On va créer les sons de façon procédurale pour ne pas avoir besoin de fichiers
    this.createWhooshSound();
    this.createDingSound();
    this.createErrorSound();
    this.createBravoSound();
  }

  // Son "whoosh" au début du drag
  createWhooshSound() {
    this.sounds.whoosh = () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(200, audioContext.currentTime + 0.2);
      
      gainNode.gain.setValueAtTime(this.volume * 0.5, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    };
  }

  // Son "ding" au drop réussi
  createDingSound() {
    this.sounds.ding = () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(this.volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);
    };
  }

  // Son d'erreur au drop invalide
  createErrorSound() {
    this.sounds.error = () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(300, audioContext.currentTime);
      oscillator.frequency.setValueAtTime(200, audioContext.currentTime + 0.1);
      
      gainNode.gain.setValueAtTime(this.volume * 0.4, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.2);
    };
  }

  // Son "Bravo!" avec des notes joyeuses
  createBravoSound() {
    this.sounds.bravo = () => {
      if (!this.enabled) return;
      
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Créer une mélodie de victoire (Do-Mi-Sol-Do)
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      const duration = 0.15;
      
      notes.forEach((freq, index) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        oscillator.type = 'triangle';
        oscillator.frequency.setValueAtTime(freq, audioContext.currentTime + index * duration);
        
        const startTime = audioContext.currentTime + index * duration;
        gainNode.gain.setValueAtTime(this.volume * 0.6, startTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
        
        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      });
    };
  }

  // Jouer un fichier audio externe (MP3/WAV)
  playFile(filePath) {
    if (!this.enabled) return;
    
    const audio = new Audio(filePath);
    audio.volume = this.volume;
    audio.play().catch(error => {
      console.warn('Could not play audio file:', error);
    });
  }

  play(soundName) {
    if (this.sounds[soundName]) {
      try {
        this.sounds[soundName]();
      } catch (error) {
        console.warn('Could not play sound:', error);
      }
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  setEnabled(enabled) {
    this.enabled = enabled;
  }
}

const soundManager = new SoundManager();
export default soundManager;
