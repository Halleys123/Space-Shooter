// DOM Elements
const text = document.querySelector('.game-text');
const startButton = document.querySelector('.start-game');
const settingsButton = document.querySelector('.settings');
const exitButton = document.querySelector('.exit-game');
const gameMenu = document.querySelector('.game-menu');
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Asset Loading
const ASSETS = {
  sprites: {},
  audio: {},
  backgrounds: {}
};

// Load Images
function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

// Load Audio
function loadAudio(src) {
  return new Promise((resolve, reject) => {
    const audio = new Audio();
    audio.oncanplaythrough = () => resolve(audio);
    audio.onerror = reject;
    audio.src = src;
    audio.load();
  });
}

// Initialize all assets
async function loadAssets() {
  try {
    // Load sprite images
    ASSETS.sprites.player = await loadImage('./assets/sprites/player.png');
    ASSETS.sprites.playerThrust = await loadImage('./assets/sprites/player_thrust.png');
    ASSETS.sprites.playerShield = await loadImage('./assets/sprites/player_shield.png');
    ASSETS.sprites.enemyBasic = await loadImage('./assets/sprites/enemy_basic.png');
    ASSETS.sprites.enemyKamikaze = await loadImage('./assets/sprites/enemy_kamikaze.png');
    ASSETS.sprites.enemyShooter = await loadImage('./assets/sprites/enemy_shooter.png');
    ASSETS.sprites.enemyZigzag = await loadImage('./assets/sprites/enemy_zigzag.png');
    ASSETS.sprites.boss = await loadImage('./assets/sprites/boss.png');
    ASSETS.sprites.bulletPlayer = await loadImage('./assets/sprites/bullet_player.png');
    ASSETS.sprites.bulletEnemy = await loadImage('./assets/sprites/bullet_enemy.png');
    ASSETS.sprites.explosion1 = await loadImage('./assets/sprites/explosion_sprite_1.png');
    ASSETS.sprites.explosion2 = await loadImage('./assets/sprites/explosion_sprite_2.png');
    ASSETS.sprites.explosion3 = await loadImage('./assets/sprites/explosion_sprite_3.png');
    ASSETS.sprites.explosion4 = await loadImage('./assets/sprites/explosion_sprite_4.png');
    
    // Load power-up images
    ASSETS.sprites.shieldPowerup = await loadImage('./assets/power-ups/shield_powerup.png');
    ASSETS.sprites.fireratePowerup = await loadImage('./assets/power-ups/firerate_powerup.png');
    ASSETS.sprites.healthPowerup = await loadImage('./assets/power-ups/health_powerup.png');
    
    // Load UI images
    ASSETS.sprites.healthBarFrame = await loadImage('./assets/ui/health_bar_frame.png');
    ASSETS.sprites.lifeIcon = await loadImage('./assets/ui/life_icon.png');
    ASSETS.sprites.gameLogo = await loadImage('./assets/ui/game_logo.png');
    
    // Load background images
    ASSETS.backgrounds.starfield = await loadImage('./assets/backgrounds/starfield.png');
    ASSETS.backgrounds.nebula = await loadImage('./assets/backgrounds/nebula.png');
    
    // Load audio files
    ASSETS.audio.playerShoot = await loadAudio('./assets/audio/sfx/player_shoot.wav');
    ASSETS.audio.enemyShoot = await loadAudio('./assets/audio/sfx/enemy_shoot.wav');
    ASSETS.audio.explosion = await loadAudio('./assets/audio/sfx/explosion.mp3');
    ASSETS.audio.playerHit = await loadAudio('./assets/audio/sfx/player_hit.mp3');
    ASSETS.audio.enemyHit = await loadAudio('./assets/audio/sfx/enemy_hit.mp3');
    ASSETS.audio.powerup = await loadAudio('./assets/audio/sfx/powerup.ogg');
    
    // Load background music
    ASSETS.audio.menuMusic = await loadAudio('./assets/audio/music/menu_bg.mp3');
    ASSETS.audio.gameMusic = await loadAudio('./assets/audio/music/game_bg.mp3');
    ASSETS.audio.bossMusic = await loadAudio('./assets/audio/music/boss_bg.mp3');
    
    // Configure audio settings
    Object.values(ASSETS.audio).forEach(audio => {
      audio.volume = 0.5; // Set default volume
    });
    
    // Configure music to loop
    ASSETS.audio.menuMusic.loop = true;
    ASSETS.audio.gameMusic.loop = true;
    ASSETS.audio.bossMusic.loop = true;
    
    console.log('All assets loaded successfully!');
    return true;
  } catch (error) {
    console.error('Error loading assets:', error);
    return false;
  }
}

// Audio management
let currentMusic = null;

function playSound(audioAsset, volume = 0.5) {
  if (audioAsset) {
    audioAsset.volume = volume;
    audioAsset.currentTime = 0;
    audioAsset.play().catch(e => console.warn('Audio play failed:', e));
  }
}

function playMusic(musicAsset, volume = 0.3) {
  if (currentMusic && currentMusic !== musicAsset) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
  }
  
  if (musicAsset) {
    musicAsset.volume = volume;
    musicAsset.currentTime = 0;
    musicAsset.play().catch(e => console.warn('Music play failed:', e));
    currentMusic = musicAsset;
  }
}

function stopMusic() {
  if (currentMusic) {
    currentMusic.pause();
    currentMusic.currentTime = 0;
    currentMusic = null;
  }
}

// Game Configuration
const GAME_CONFIG = {
  CANVAS_WIDTH: 800,
  CANVAS_HEIGHT: 600,
  PLAYER_SPEED: 5,
  BULLET_SPEED: 8,
  ENEMY_BULLET_SPEED: 4,
  POWERUP_DURATION: 5000,
  ENEMY_SPAWN_INTERVAL: 2000,
  BOSS_WAVE_INTERVAL: 5,
  ENEMY_TYPES: ['basic', 'kamikaze', 'shooter', 'zigzag'],
  POWERUP_TYPES: ['shield', 'fire-rate', 'health'],
};

// Game State
let gameState = {
  isGameOver: false,
  isGameStarted: false,
  isPaused: false,
  score: 0,
  wave: 1,
  lives: 3,
  highScore: localStorage.getItem('spaceShooterHighScore') || 0,
  lastTime: 0,
  deltaTime: 0,
};

// Game Objects Arrays
let player = null;
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerUps = [];
let explosions = [];
let stars = [];

// Input handling
const keys = {};

// Initialize canvas size
function initializeCanvas() {
  canvas.width = GAME_CONFIG.CANVAS_WIDTH;
  canvas.height = GAME_CONFIG.CANVAS_HEIGHT;
}

// Player Class
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 40;
    this.height = 40;
    this.speed = GAME_CONFIG.PLAYER_SPEED;
    this.health = 100;
    this.maxHealth = 100;
    this.fireRate = 250; // milliseconds
    this.lastShot = 0;
    this.hasShield = false;
    this.shieldTimer = 0;
    this.fireRateBoost = false;
    this.fireRateTimer = 0;
  }

  update(deltaTime) {
    // Movement
    if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
      this.x = Math.max(0, this.x - this.speed);
    }
    if (keys['ArrowRight'] || keys['d'] || keys['D']) {
      this.x = Math.min(canvas.width - this.width, this.x + this.speed);
    }
    if (keys['ArrowUp'] || keys['w'] || keys['W']) {
      this.y = Math.max(0, this.y - this.speed);
    }
    if (keys['ArrowDown'] || keys['s'] || keys['S']) {
      this.y = Math.min(canvas.height - this.height, this.y + this.speed);
    }

    // Shooting
    if (keys[' '] && Date.now() - this.lastShot > this.fireRate) {
      this.shoot();
      this.lastShot = Date.now();
    }

    // Update power-up timers
    if (this.hasShield) {
      this.shieldTimer -= deltaTime;
      if (this.shieldTimer <= 0) {
        this.hasShield = false;
      }
    }

    if (this.fireRateBoost) {
      this.fireRateTimer -= deltaTime;
      if (this.fireRateTimer <= 0) {
        this.fireRateBoost = false;
        this.fireRate = 250; // Reset to normal fire rate
      }
    }
  }

  shoot() {
    const bulletX = this.x + this.width / 2 - 2;
    const bulletY = this.y;
    bullets.push(
      new Bullet(bulletX, bulletY, 0, -GAME_CONFIG.BULLET_SPEED, 'player')
    );
    
    // Play shooting sound
    playSound(ASSETS.audio.playerShoot, 0.3);
  }

  takeDamage(amount) {
    if (this.hasShield) return false;

    this.health -= amount;
    playSound(ASSETS.audio.playerHit, 0.5);
    
    if (this.health <= 0) {
      gameState.lives--;
      this.health = this.maxHealth;
      explosions.push(
        new Explosion(this.x + this.width / 2, this.y + this.height / 2)
      );
      return true;
    }
    return false;
  }

  draw() {
    // Check if moving to show thrust effect
    const isMoving = keys['ArrowLeft'] || keys['a'] || keys['A'] || 
                    keys['ArrowRight'] || keys['d'] || keys['D'] ||
                    keys['ArrowUp'] || keys['w'] || keys['W'] ||
                    keys['ArrowDown'] || keys['s'] || keys['S'];
    
    // Draw player sprite
    let playerSprite = ASSETS.sprites.player;
    if (this.hasShield && ASSETS.sprites.playerShield) {
      playerSprite = ASSETS.sprites.playerShield;
    } else if (isMoving && ASSETS.sprites.playerThrust) {
      playerSprite = ASSETS.sprites.playerThrust;
    }
    
    if (playerSprite) {
      ctx.drawImage(playerSprite, this.x, this.y, this.width, this.height);
    } else {
      // Fallback to original triangle drawing
      ctx.fillStyle = this.hasShield ? '#00ffff' : '#00ff00';
      ctx.beginPath();
      ctx.moveTo(this.x + this.width / 2, this.y);
      ctx.lineTo(this.x, this.y + this.height);
      ctx.lineTo(this.x + this.width, this.y + this.height);
      ctx.closePath();
      ctx.fill();
    }

    // Health bar using sprite frame if available
    if (ASSETS.sprites.healthBarFrame) {
      const healthBarWidth = 60;
      const healthBarHeight = 8;
      const healthBarX = this.x - (healthBarWidth - this.width) / 2;
      const healthBarY = this.y - 15;
      
      // Draw health bar frame
      ctx.drawImage(ASSETS.sprites.healthBarFrame, healthBarX, healthBarY, healthBarWidth, healthBarHeight);
      
      // Draw health fill
      const currentHealthWidth = (this.health / this.maxHealth) * (healthBarWidth - 4);
      ctx.fillStyle = this.health > 60 ? '#00ff00' : this.health > 30 ? '#ffff00' : '#ff0000';
      ctx.fillRect(healthBarX + 2, healthBarY + 2, currentHealthWidth, healthBarHeight - 4);
    } else {
      // Fallback to original health bar
      const healthBarWidth = 60;
      const healthBarHeight = 6;
      const healthBarX = this.x - (healthBarWidth - this.width) / 2;
      const healthBarY = this.y - 15;

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);

      ctx.fillStyle = '#00ff00';
      const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
      ctx.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
    }
  }
}

// Bullet Class
class Bullet {
  constructor(x, y, velX, velY, owner) {
    this.x = x;
    this.y = y;
    this.velX = velX;
    this.velY = velY;
    this.width = 4;
    this.height = 8;
    this.owner = owner;
    this.damage = 25;
  }

  update() {
    this.x += this.velX;
    this.y += this.velY;
  }

  draw() {
    const bulletSprite = this.owner === 'player' ? ASSETS.sprites.bulletPlayer : ASSETS.sprites.bulletEnemy;
    
    if (bulletSprite) {
      ctx.drawImage(bulletSprite, this.x, this.y, this.width, this.height);
    } else {
      // Fallback to original rectangle drawing
      ctx.fillStyle = this.owner === 'player' ? '#ffff00' : '#ff0000';
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }
  }

  isOffScreen() {
    return (
      this.y < -this.height ||
      this.y > canvas.height ||
      this.x < -this.width ||
      this.x > canvas.width
    );
  }
}

// Enemy Class
class Enemy {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 30;
    this.height = 30;
    this.health = this.getHealthByType();
    this.maxHealth = this.health;
    this.speed = this.getSpeedByType();
    this.lastShot = 0;
    this.fireRate = 2000;
    this.direction = 1;
    this.zigzagTimer = 0;
    this.movementPattern = this.getMovementPattern();
  }

  getHealthByType() {
    switch (this.type) {
      case 'basic':
        return 25;
      case 'kamikaze':
        return 15;
      case 'shooter':
        return 40;
      case 'zigzag':
        return 30;
      default:
        return 25;
    }
  }

  getSpeedByType() {
    const baseSpeed = 1 + gameState.wave * 0.2;
    switch (this.type) {
      case 'basic':
        return baseSpeed;
      case 'kamikaze':
        return baseSpeed * 1.5;
      case 'shooter':
        return baseSpeed * 0.7;
      case 'zigzag':
        return baseSpeed * 0.8;
      default:
        return baseSpeed;
    }
  }

  getMovementPattern() {
    switch (this.type) {
      case 'kamikaze':
        return 'straight';
      case 'zigzag':
        return 'zigzag';
      default:
        return 'normal';
    }
  }

  update(deltaTime) {
    // Movement based on type
    switch (this.movementPattern) {
      case 'straight':
        this.y += this.speed * 1.5;
        break;
      case 'zigzag':
        this.zigzagTimer += deltaTime;
        this.y += this.speed;
        this.x += Math.sin(this.zigzagTimer * 0.005) * 2;
        break;
      default:
        this.y += this.speed;
        break;
    }

    // Shooting (only for shooter type)
    if (this.type === 'shooter' && Date.now() - this.lastShot > this.fireRate) {
      this.shoot();
      this.lastShot = Date.now();
    }
  }

  shoot() {
    const bulletX = this.x + this.width / 2 - 2;
    const bulletY = this.y + this.height;
    enemyBullets.push(
      new Bullet(bulletX, bulletY, 0, GAME_CONFIG.ENEMY_BULLET_SPEED, 'enemy')
    );
    
    // Play enemy shooting sound
    playSound(ASSETS.audio.enemyShoot, 0.2);
  }

  takeDamage(amount) {
    this.health -= amount;
    playSound(ASSETS.audio.enemyHit, 0.3);
    return this.health <= 0;
  }

  draw() {
    // Get appropriate enemy sprite based on type
    let enemySprite = null;
    switch (this.type) {
      case 'basic':
        enemySprite = ASSETS.sprites.enemyBasic;
        break;
      case 'kamikaze':
        enemySprite = ASSETS.sprites.enemyKamikaze;
        break;
      case 'shooter':
        enemySprite = ASSETS.sprites.enemyShooter;
        break;
      case 'zigzag':
        enemySprite = ASSETS.sprites.enemyZigzag;
        break;
    }

    if (enemySprite) {
      ctx.drawImage(enemySprite, this.x, this.y, this.width, this.height);
    } else {
      // Fallback to original colored rectangles
      let color = '#ff0000';
      switch (this.type) {
        case 'kamikaze':
          color = '#ff8800';
          break;
        case 'shooter':
          color = '#8800ff';
          break;
        case 'zigzag':
          color = '#00ff88';
          break;
      }
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Health bar for stronger enemies
    if (this.maxHealth > 25) {
      const healthBarWidth = this.width;
      const healthBarHeight = 3;
      const healthBarY = this.y - 5;

      ctx.fillStyle = '#ff0000';
      ctx.fillRect(this.x, healthBarY, healthBarWidth, healthBarHeight);

      ctx.fillStyle = '#00ff00';
      const currentHealthWidth =
        (this.health / this.maxHealth) * healthBarWidth;
      ctx.fillRect(this.x, healthBarY, currentHealthWidth, healthBarHeight);
    }
  }

  isOffScreen() {
    return this.y > canvas.height + this.height;
  }
}

// Boss Class
class Boss extends Enemy {
  constructor(x, y) {
    super(x, y, 'boss');
    this.width = 80;
    this.height = 60;
    this.health = 200 + gameState.wave * 50;
    this.maxHealth = this.health;
    this.speed = 0.5;
    this.fireRate = 800;
    this.phase = 1;
    this.moveDirection = 1;
  }

  update(deltaTime) {
    // Boss movement pattern
    this.x += this.moveDirection * this.speed;
    if (this.x <= 0 || this.x >= canvas.width - this.width) {
      this.moveDirection *= -1;
      this.y += 20;
    }

    // Multi-shot pattern
    if (Date.now() - this.lastShot > this.fireRate) {
      this.shootPattern();
      this.lastShot = Date.now();
    }

    // Phase changes based on health
    if (this.health < this.maxHealth * 0.5 && this.phase === 1) {
      this.phase = 2;
      this.fireRate = 600;
    }
  }

  shootPattern() {
    const centerX = this.x + this.width / 2;
    const shootY = this.y + this.height;

    if (this.phase === 1) {
      // Triple shot
      for (let i = -1; i <= 1; i++) {
        enemyBullets.push(
          new Bullet(
            centerX + i * 10,
            shootY,
            i * 2,
            GAME_CONFIG.ENEMY_BULLET_SPEED,
            'enemy'
          )
        );
      }
    } else {
      // Spread shot
      for (let i = -2; i <= 2; i++) {
        enemyBullets.push(
          new Bullet(
            centerX + i * 8,
            shootY,
            i * 1.5,
            GAME_CONFIG.ENEMY_BULLET_SPEED,
            'enemy'
          )
        );
      }
    }
  }

  draw() {
    if (ASSETS.sprites.boss) {
      ctx.drawImage(ASSETS.sprites.boss, this.x, this.y, this.width, this.height);
    } else {
      // Fallback to original boss drawing
      ctx.fillStyle = '#ff0044';
      ctx.fillRect(this.x, this.y, this.width, this.height);

      // Boss details
      ctx.fillStyle = '#ffff00';
      ctx.fillRect(this.x + 10, this.y + 10, this.width - 20, this.height - 20);
    }

    // Health bar
    const healthBarWidth = this.width;
    const healthBarHeight = 8;
    const healthBarY = this.y - 15;

    ctx.fillStyle = '#ff0000';
    ctx.fillRect(this.x, healthBarY, healthBarWidth, healthBarHeight);

    ctx.fillStyle = '#00ff00';
    const currentHealthWidth = (this.health / this.maxHealth) * healthBarWidth;
    ctx.fillRect(this.x, healthBarY, currentHealthWidth, healthBarHeight);
  }
}

// PowerUp Class
class PowerUp {
  constructor(x, y, type) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.width = 20;
    this.height = 20;
    this.speed = 2;
    this.bob = 0;
  }

  update(deltaTime) {
    this.y += this.speed;
    this.bob += deltaTime * 0.005;
  }

  draw() {
    const bobOffset = Math.sin(this.bob) * 3;
    
    // Get appropriate power-up sprite
    let powerupSprite = null;
    let color = '#ffffff';
    
    switch (this.type) {
      case 'shield':
        powerupSprite = ASSETS.sprites.shieldPowerup;
        color = '#00ffff';
        break;
      case 'fire-rate':
        powerupSprite = ASSETS.sprites.fireratePowerup;
        color = '#ff8800';
        break;
      case 'health':
        powerupSprite = ASSETS.sprites.healthPowerup;
        color = '#00ff00';
        break;
    }

    if (powerupSprite) {
      ctx.drawImage(powerupSprite, this.x, this.y + bobOffset, this.width, this.height);
    } else {
      // Fallback to original colored rectangle
      ctx.fillStyle = color;
      ctx.fillRect(this.x, this.y + bobOffset, this.width, this.height);
    }

    // Glow effect
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(
      this.x - 2,
      this.y + bobOffset - 2,
      this.width + 4,
      this.height + 4
    );
  }

  isOffScreen() {
    return this.y > canvas.height + this.height;
  }
}

// Explosion Class
class Explosion {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.width = 32;
    this.height = 32;
    this.duration = 500;
    this.startTime = Date.now();
    this.currentFrame = 0;
    this.frameTime = this.duration / 4; // 4 frames of animation
    this.explosionSprites = [
      ASSETS.sprites.explosion1,
      ASSETS.sprites.explosion2,
      ASSETS.sprites.explosion3,
      ASSETS.sprites.explosion4
    ];
    
    // Play explosion sound
    playSound(ASSETS.audio.explosion, 0.4);
    
    // Fallback particles if no sprites
    this.particles = [];
    for (let i = 0; i < 8; i++) {
      this.particles.push({
        x: x,
        y: y,
        velX: (Math.random() - 0.5) * 8,
        velY: (Math.random() - 0.5) * 8,
        life: 1.0,
      });
    }
  }

  update(deltaTime) {
    const elapsed = Date.now() - this.startTime;
    const progress = elapsed / this.duration;
    
    // Update animation frame
    this.currentFrame = Math.floor((elapsed / this.frameTime));
    
    // Update fallback particles
    this.particles.forEach((particle) => {
      particle.x += particle.velX;
      particle.y += particle.velY;
      particle.life = 1.0 - progress;
    });
  }

  draw() {
    // Use sprite animation if available
    if (this.explosionSprites[0] && this.currentFrame < this.explosionSprites.length) {
      const sprite = this.explosionSprites[this.currentFrame];
      if (sprite) {
        ctx.drawImage(sprite, this.x - this.width/2, this.y - this.height/2, this.width, this.height);
        return;
      }
    }
    
    // Fallback to particle animation
    this.particles.forEach((particle) => {
      if (particle.life > 0) {
        ctx.fillStyle = `rgba(255, ${Math.floor(255 * particle.life)}, 0, ${
          particle.life
        })`;
        ctx.fillRect(particle.x - 2, particle.y - 2, 4, 4);
      }
    });
  }

  isDead() {
    return Date.now() - this.startTime >= this.duration;
  }
}

// Star Field
class Star {
  constructor() {
    this.x = Math.random() * canvas.width;
    this.y = Math.random() * canvas.height;
    this.speed = Math.random() * 2 + 1;
    this.brightness = Math.random();
  }

  update() {
    this.y += this.speed;
    if (this.y > canvas.height) {
      this.y = 0;
      this.x = Math.random() * canvas.width;
    }
  }

  draw() {
    ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
    ctx.fillRect(this.x, this.y, 1, 1);
  }
}

// Stage Manager
class StageManager {
  constructor() {
    this.lastSpawn = 0;
    this.spawnInterval = GAME_CONFIG.ENEMY_SPAWN_INTERVAL;
    this.enemiesThisWave = 0;
    this.maxEnemiesPerWave = 5;
    this.waveStartTime = Date.now();
    this.bossSpawned = false;
  }

  update() {
    const now = Date.now();

    // Check if it's time for a boss
    if (
      gameState.wave % GAME_CONFIG.BOSS_WAVE_INTERVAL === 0 &&
      !this.bossSpawned &&
      enemies.length === 0
    ) {
      this.spawnBoss();
      this.bossSpawned = true;
      return;
    }

    // Normal enemy spawning
    if (
      now - this.lastSpawn > this.spawnInterval &&
      this.enemiesThisWave < this.maxEnemiesPerWave
    ) {
      this.spawnEnemy();
      this.lastSpawn = now;
      this.enemiesThisWave++;
    }

    // Check for wave completion
    if (
      this.enemiesThisWave >= this.maxEnemiesPerWave &&
      enemies.length === 0
    ) {
      this.nextWave();
    }
  }

  spawnEnemy() {
    const x = Math.random() * (canvas.width - 30);
    const type =
      GAME_CONFIG.ENEMY_TYPES[
        Math.floor(Math.random() * GAME_CONFIG.ENEMY_TYPES.length)
      ];
    enemies.push(new Enemy(x, -30, type));
  }

  spawnBoss() {
    const x = canvas.width / 2 - 40;
    enemies.push(new Boss(x, -60));
  }

  nextWave() {
    gameState.wave++;
    this.enemiesThisWave = 0;
    this.maxEnemiesPerWave = Math.min(10, 5 + Math.floor(gameState.wave / 2));
    this.spawnInterval = Math.max(
      500,
      GAME_CONFIG.ENEMY_SPAWN_INTERVAL - gameState.wave * 100
    );
    this.bossSpawned = false;

    // Spawn power-up occasionally
    if (Math.random() < 0.3) {
      this.spawnPowerUp();
    }
  }

  spawnPowerUp() {
    const x = Math.random() * (canvas.width - 20);
    const type =
      GAME_CONFIG.POWERUP_TYPES[
        Math.floor(Math.random() * GAME_CONFIG.POWERUP_TYPES.length)
      ];
    powerUps.push(new PowerUp(x, -20, type));
  }
}

// Collision Detection
function checkCollision(rect1, rect2) {
  return (
    rect1.x < rect2.x + rect2.width &&
    rect1.x + rect1.width > rect2.x &&
    rect1.y < rect2.y + rect2.height &&
    rect1.y + rect1.height > rect2.y
  );
}

// Game Logic Functions
function initializeGame() {
  // Initialize canvas
  initializeCanvas();

  // Create player
  player = new Player(canvas.width / 2 - 20, canvas.height - 60);

  // Create star field
  stars = [];
  for (let i = 0; i < 50; i++) {
    stars.push(new Star());
  }

  // Initialize stage manager
  stageManager = new StageManager();

  // Reset game state
  gameState.score = 0;
  gameState.wave = 1;
  gameState.lives = 3;
  gameState.isGameOver = false;
  gameState.isPaused = false;

  // Clear arrays
  bullets = [];
  enemies = [];
  enemyBullets = [];
  powerUps = [];
  explosions = [];
}

function updateGame(deltaTime) {
  if (gameState.isPaused || gameState.isGameOver) return;

  // Update stars
  stars.forEach((star) => star.update());

  // Update player
  player.update(deltaTime);

  // Update bullets
  bullets.forEach((bullet) => bullet.update());
  bullets = bullets.filter((bullet) => !bullet.isOffScreen());

  // Update enemy bullets
  enemyBullets.forEach((bullet) => bullet.update());
  enemyBullets = enemyBullets.filter((bullet) => !bullet.isOffScreen());

  // Update enemies
  enemies.forEach((enemy) => enemy.update(deltaTime));
  enemies = enemies.filter((enemy) => !enemy.isOffScreen());

  // Update power-ups
  powerUps.forEach((powerUp) => powerUp.update(deltaTime));
  powerUps = powerUps.filter((powerUp) => !powerUp.isOffScreen());

  // Update explosions
  explosions.forEach((explosion) => explosion.update(deltaTime));
  explosions = explosions.filter((explosion) => !explosion.isDead());

  // Update stage manager
  stageManager.update();

  // Check collisions
  checkCollisions();

  // Check game over
  if (gameState.lives <= 0) {
    gameOver();
  }
}

function checkCollisions() {
  // Player bullets vs enemies
  bullets.forEach((bullet, bulletIndex) => {
    enemies.forEach((enemy, enemyIndex) => {
      if (checkCollision(bullet, enemy)) {
        explosions.push(
          new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
        );

        if (enemy.takeDamage(bullet.damage)) {
          enemies.splice(enemyIndex, 1);
          gameState.score += enemy instanceof Boss ? 500 : 100;

          // Chance to drop power-up
          if (Math.random() < 0.1) {
            const type =
              GAME_CONFIG.POWERUP_TYPES[
                Math.floor(Math.random() * GAME_CONFIG.POWERUP_TYPES.length)
              ];
            powerUps.push(new PowerUp(enemy.x, enemy.y, type));
          }
        }

        bullets.splice(bulletIndex, 1);
      }
    });
  });

  // Enemy bullets vs player
  enemyBullets.forEach((bullet, bulletIndex) => {
    if (checkCollision(bullet, player)) {
      player.takeDamage(bullet.damage);
      enemyBullets.splice(bulletIndex, 1);
    }
  });

  // Enemies vs player
  enemies.forEach((enemy, enemyIndex) => {
    if (checkCollision(enemy, player)) {
      if (player.takeDamage(50)) {
        // Player took fatal damage
      }
      enemies.splice(enemyIndex, 1);
      explosions.push(
        new Explosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2)
      );
    }
  });

  // Power-ups vs player
  powerUps.forEach((powerUp, powerUpIndex) => {
    if (checkCollision(powerUp, player)) {
      applyPowerUp(powerUp.type);
      powerUps.splice(powerUpIndex, 1);
    }
  });
}

function applyPowerUp(type) {
  switch (type) {
    case 'shield':
      player.hasShield = true;
      player.shieldTimer = GAME_CONFIG.POWERUP_DURATION;
      break;
    case 'fire-rate':
      player.fireRateBoost = true;
      player.fireRateTimer = GAME_CONFIG.POWERUP_DURATION;
      player.fireRate = 100;
      break;
    case 'health':
      player.health = Math.min(player.maxHealth, player.health + 50);
      break;
  }
}

function drawGame() {
  // Clear canvas with space background
  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw background images if available
  if (ASSETS.backgrounds.starfield) {
    // Tile the starfield background
    const pattern = ctx.createPattern(ASSETS.backgrounds.starfield, 'repeat');
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
  
  if (ASSETS.backgrounds.nebula) {
    // Draw nebula as atmospheric background
    ctx.globalAlpha = 0.3;
    ctx.drawImage(ASSETS.backgrounds.nebula, 0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1.0;
  }

  // Draw animated stars (for additional movement)
  stars.forEach((star) => star.draw());

  // Draw game objects
  player.draw();
  bullets.forEach((bullet) => bullet.draw());
  enemyBullets.forEach((bullet) => bullet.draw());
  enemies.forEach((enemy) => enemy.draw());
  powerUps.forEach((powerUp) => powerUp.draw());
  explosions.forEach((explosion) => explosion.draw());

  // Draw UI
  drawUI();
}

function drawUI() {
  ctx.fillStyle = '#ffffff';
  ctx.font = '20px Orbitron';

  // Score
  ctx.fillText(`Score: ${gameState.score}`, 10, 30);

  // Wave
  ctx.fillText(`Wave: ${gameState.wave}`, 10, 60);

  // Lives display with life icons
  ctx.fillText(`Lives:`, 10, 90);
  if (ASSETS.sprites.lifeIcon) {
    for (let i = 0; i < gameState.lives; i++) {
      ctx.drawImage(ASSETS.sprites.lifeIcon, 80 + (i * 20), 75, 16, 16);
    }
  } else {
    ctx.fillText(`${gameState.lives}`, 80, 90);
  }

  // High Score
  ctx.fillText(`High Score: ${gameState.highScore}`, canvas.width - 200, 30);

  // Pause indicator
  if (gameState.isPaused) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#ffffff';
    ctx.font = '40px Orbitron';
    ctx.textAlign = 'center';
    ctx.fillText('PAUSED', canvas.width / 2, canvas.height / 2);
    ctx.fillText('Press P to Resume', canvas.width / 2, canvas.height / 2 + 50);
    ctx.textAlign = 'left';
  }
}

function gameOver() {
  gameState.isGameOver = true;

  // Update high score
  if (gameState.score > gameState.highScore) {
    gameState.highScore = gameState.score;
    localStorage.setItem('spaceShooterHighScore', gameState.highScore);
  }

  // Show game over screen
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#ff0000';
  ctx.font = '48px Orbitron';
  ctx.textAlign = 'center';
  ctx.fillText('GAME OVER', canvas.width / 2, canvas.height / 2 - 50);

  ctx.fillStyle = '#ffffff';
  ctx.font = '24px Orbitron';
  ctx.fillText(
    `Final Score: ${gameState.score}`,
    canvas.width / 2,
    canvas.height / 2
  );
  ctx.fillText(
    `High Score: ${gameState.highScore}`,
    canvas.width / 2,
    canvas.height / 2 + 30
  );
  ctx.fillText(
    'Press ESC to return to menu',
    canvas.width / 2,
    canvas.height / 2 + 80
  );
  ctx.textAlign = 'left';
}

// Game Loop
function gameLoop(currentTime) {
  gameState.deltaTime = currentTime - gameState.lastTime;
  gameState.lastTime = currentTime;

  if (gameState.isGameStarted && !gameState.isGameOver) {
    updateGame(gameState.deltaTime);
    drawGame();
  }

  requestAnimationFrame(gameLoop);
}

// Event Listeners
function setupEventListeners() {
  // Keyboard events
  document.addEventListener('keydown', (e) => {
    keys[e.key] = true;

    if (e.key === 'p' || e.key === 'P') {
      if (gameState.isGameStarted && !gameState.isGameOver) {
        gameState.isPaused = !gameState.isPaused;
      }
    }

    if (e.key === 'Escape') {
      if (gameState.isGameOver) {
        exitGame();
      }
    }
  });

  document.addEventListener('keyup', (e) => {
    keys[e.key] = false;
  });

  // Menu button events
  startButton.addEventListener('click', startGame);
  settingsButton.addEventListener('click', openSettings);
  exitButton.addEventListener('click', exitGame);
}

// Menu Functions
function startGame() {
  gameState.isGameStarted = true;
  gameMenu.classList.add('hidden');
  canvas.classList.remove('hidden-canvas');
  initializeGame();
}

function openSettings() {
  // Settings functionality can be expanded later
  alert('Settings menu - Coming soon!');
}

function exitGame() {
  gameState.isGameOver = true;
  gameState.isGameStarted = false;
  gameMenu.classList.remove('hidden');
  canvas.classList.add('hidden-canvas');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
}

// Initialize everything
setTimeout(() => {
  canvas.classList.remove('hidden-canvas');
  text.classList.add('hidden-text');
  initializeCanvas();
  setupEventListeners();
  gameLoop(0);
}, 400);
