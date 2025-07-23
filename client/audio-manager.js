class AudioManager {
  constructor() {
    this.sounds = {};
    this.musicTracks = {};
    this.currentMusic = null;

    // Initialize with safe default values
    this.masterVolume = 50;
    this.musicVolume = 30;
    this.sfxVolume = 70;

    // Initialize sound effects
    this.initializeSounds();
  }

  // Call this method after game settings are loaded
  initialize() {
    this.loadSettings();
    this.updateAllVolumes();
  }

  initializeSounds() {
    // Define all available sound effects
    const soundFiles = {
      playerShoot: './assets/audio/sfx/player_shoot.wav',
      enemyShoot: './assets/audio/sfx/enemy_shoot.wav',
      playerHit: './assets/audio/sfx/player_hit.mp3',
      enemyHit: './assets/audio/sfx/enemy_hit.mp3',
      explosion: './assets/audio/sfx/explosion.mp3',
      powerup: './assets/audio/sfx/powerup.ogg',
    };

    // Load all sound effects
    Object.keys(soundFiles).forEach((soundName) => {
      this.sounds[soundName] = new Audio(soundFiles[soundName]);
      this.sounds[soundName].preload = 'auto';

      // Set default volume to 0.5 initially, will be updated later
      this.sounds[soundName].volume = 0.5;

      // Handle loading errors gracefully
      this.sounds[soundName].addEventListener('error', (e) => {
        console.warn(`Failed to load sound: ${soundName}`, e);
      });
    });

    // Load music tracks
    const musicFiles = {
      menu: './assets/audio/music/menu_bg.mp3',
      game: './assets/audio/music/game_bg.mp3',
      boss: './assets/audio/music/boss_bg.mp3',
    };

    Object.keys(musicFiles).forEach((trackName) => {
      this.musicTracks[trackName] = new Audio(musicFiles[trackName]);
      this.musicTracks[trackName].preload = 'auto';
      this.musicTracks[trackName].loop = true;
      this.musicTracks[trackName].volume = 0.3; // Set default volume initially

      this.musicTracks[trackName].addEventListener('error', (e) => {
        console.warn(`Failed to load music: ${trackName}`, e);
      });
    });
  }

  loadSettings() {
    // Load settings from the global gameSettings if available
    if (typeof window.gameSettings !== 'undefined') {
      this.masterVolume = window.gameSettings.audio.masterVolume;
      this.musicVolume = window.gameSettings.audio.musicVolume;
      this.sfxVolume = window.gameSettings.audio.sfxVolume;
    }
  }

  updateSettings() {
    this.loadSettings();
    this.updateAllVolumes();
  }

  calculateMasterVolume() {
    const volume = this.masterVolume / 100;
    return isNaN(volume) ? 0.5 : Math.max(0, Math.min(1, volume));
  }

  calculateMusicVolume() {
    const masterVol = this.masterVolume / 100;
    const musicVol = this.musicVolume / 100;
    const volume = masterVol * musicVol;
    return isNaN(volume) ? 0.3 : Math.max(0, Math.min(1, volume));
  }

  calculateSfxVolume() {
    const masterVol = this.masterVolume / 100;
    const sfxVol = this.sfxVolume / 100;
    const volume = masterVol * sfxVol;
    return isNaN(volume) ? 0.7 : Math.max(0, Math.min(1, volume));
  }

  updateAllVolumes() {
    // Update all sound effects volumes
    Object.values(this.sounds).forEach((sound) => {
      const volume = this.calculateSfxVolume();
      sound.volume = Math.max(0, Math.min(1, volume));
    });

    // Update all music track volumes
    Object.values(this.musicTracks).forEach((track) => {
      const volume = this.calculateMusicVolume();
      track.volume = Math.max(0, Math.min(1, volume));
    });
  }

  playSfx(soundName, options = {}) {
    if (!this.sounds[soundName]) {
      console.warn(`Sound effect not found: ${soundName}`);
      return;
    }

    const sound = this.sounds[soundName];

    // Reset the sound to beginning if it's already playing
    sound.currentTime = 0;

    // Apply volume modifier if provided
    const volumeModifier = options.volume || 1;
    const baseVolume = this.calculateSfxVolume();
    const finalVolume = baseVolume * volumeModifier;

    // Ensure volume is within valid range
    sound.volume = Math.max(0, Math.min(1, finalVolume));

    // Apply pitch variation if provided
    if (options.pitch) {
      sound.playbackRate = Math.max(0.25, Math.min(4, options.pitch));
    } else {
      sound.playbackRate = 1;
    }

    // Play the sound
    const playPromise = sound.play();

    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn(`Failed to play sound: ${soundName}`, error);
      });
    }
  }

  playMusic(trackName, fade = false) {
    if (!this.musicTracks[trackName]) {
      console.warn(`Music track not found: ${trackName}`);
      return;
    }

    // Stop current music if playing
    if (this.currentMusic && !this.currentMusic.paused) {
      if (fade) {
        this.fadeOutMusic(this.currentMusic, () => {
          this.startMusic(trackName);
        });
      } else {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
        this.startMusic(trackName);
      }
    } else {
      this.startMusic(trackName);
    }
  }

  startMusic(trackName) {
    const track = this.musicTracks[trackName];
    this.currentMusic = track;

    const volume = this.calculateMusicVolume();
    track.volume = Math.max(0, Math.min(1, volume));
    track.currentTime = 0;

    const playPromise = track.play();
    if (playPromise !== undefined) {
      playPromise.catch((error) => {
        console.warn(`Failed to play music: ${trackName}`, error);
      });
    }
  }

  stopMusic(fade = false) {
    if (this.currentMusic && !this.currentMusic.paused) {
      if (fade) {
        this.fadeOutMusic(this.currentMusic);
      } else {
        this.currentMusic.pause();
        this.currentMusic.currentTime = 0;
      }
    }
  }

  pauseMusic() {
    if (this.currentMusic && !this.currentMusic.paused) {
      this.currentMusic.pause();
    }
  }

  resumeMusic() {
    if (this.currentMusic && this.currentMusic.paused) {
      const playPromise = this.currentMusic.play();
      if (playPromise !== undefined) {
        playPromise.catch((error) => {
          console.warn('Failed to resume music', error);
        });
      }
    }
  }

  fadeOutMusic(track, callback = null, duration = 1000) {
    const startVolume = track.volume;
    const fadeStep = startVolume / (duration / 50);

    const fadeInterval = setInterval(() => {
      track.volume = Math.max(0, track.volume - fadeStep);

      if (track.volume <= 0) {
        clearInterval(fadeInterval);
        track.pause();
        track.currentTime = 0;
        track.volume = startVolume; // Reset volume for next play

        if (callback) {
          callback();
        }
      }
    }, 50);
  }

  // Convenient methods for specific game events
  playPlayerShoot(options = {}) {
    this.playSfx('playerShoot', { ...options, volume: 0.7 });
  }

  playEnemyShoot(options = {}) {
    this.playSfx('enemyShoot', { ...options, volume: 0.6 });
  }

  playPlayerHit(options = {}) {
    this.playSfx('playerHit', { ...options, volume: 0.8 });
  }

  playEnemyHit(options = {}) {
    this.playSfx('enemyHit', { ...options, volume: 0.6 });
  }

  playExplosion(size = 'normal', options = {}) {
    let volumeModifier = 0.8;
    let pitchModifier = 1;

    switch (size) {
      case 'small':
        volumeModifier = 0.5;
        pitchModifier = 1.2;
        break;
      case 'large':
        volumeModifier = 1.2;
        pitchModifier = 0.8;
        break;
      case 'boss':
        volumeModifier = 1.5;
        pitchModifier = 0.7;
        break;
    }

    this.playSfx('explosion', {
      ...options,
      volume: volumeModifier,
      pitch: pitchModifier,
    });
  }

  playPowerup(options = {}) {
    this.playSfx('powerup', { ...options, volume: 0.9, pitch: 1.1 });
  }

  // Music control methods
  playMenuMusic() {
    this.playMusic('menu', true);
  }

  playGameMusic() {
    this.playMusic('game', true);
  }

  playBossMusic() {
    this.playMusic('boss', true);
  }

  // Utility methods
  muteAll() {
    Object.values(this.sounds).forEach((sound) => {
      sound.volume = 0;
    });
    Object.values(this.musicTracks).forEach((track) => {
      track.volume = 0;
    });
  }

  unmuteAll() {
    this.updateAllVolumes();
  }

  setMasterVolume(volume) {
    this.masterVolume = Math.max(0, Math.min(100, volume));
    this.updateAllVolumes();
  }

  setMusicVolume(volume) {
    this.musicVolume = Math.max(0, Math.min(100, volume));
    this.updateAllVolumes();
  }

  setSfxVolume(volume) {
    this.sfxVolume = Math.max(0, Math.min(100, volume));
    this.updateAllVolumes();
  }
}

// Create global audio manager instance
window.audioManager = new AudioManager();
