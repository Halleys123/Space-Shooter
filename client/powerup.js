class PowerUp {
  constructor(ctx, canvas, x, y) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.position = { x, y };
    this.velocity = { x: 0, y: 2 }; // Slow downward movement
    this.isActive = true;
    this.markedForRemoval = false;

    this.width = 60;
    this.height = 60;

    // Determine powerup type based on weighted random selection
    // Firerate: 50%, Health: 30%, Shield: 20%
    this.type = this.getRandomPowerUpType();

    // Set sprite based on type
    const spriteKey = this.type + '_powerup';
    if (window.spritePreloader && window.spritePreloader.hasSprite(spriteKey)) {
      this.sprite = window.spritePreloader.cloneSprite(spriteKey);
      this.spriteLoaded = true;
      this.spriteError = false;
    } else {
      this.sprite = new Image();
      this.spriteLoaded = false;
      this.spriteError = false;
      
      this.sprite.onload = () => {
        this.spriteLoaded = true;
      };
      
      this.sprite.onerror = () => {
        console.error(`Failed to load powerup sprite: ${this.getSpriteSource()}`);
        this.spriteError = true;
      };
      
      this.sprite.src = this.getSpriteSource();
    }

    // Visual effects
    this.glowIntensity = 0;
    this.glowDirection = 1;
    this.rotationAngle = 0;
    this.floatOffset = 0;
    this.floatSpeed = 0.08;

    // Collision
    this.collisionRadius = Math.min(this.width, this.height) / 2;
    this.collisionComponent = null;

    // Powerup effects
    this.effects = this.getPowerUpEffects();
  }

  getRandomPowerUpType() {
    const random = Math.random() * 100;

    if (random < 50) {
      return 'firerate'; // 50% chance
    } else if (random < 80) {
      return 'health'; // 30% chance
    } else {
      return 'shield'; // 20% chance
    }
  }

  getSpriteSource() {
    switch (this.type) {
      case 'firerate':
        return './assets/power-ups/firerate_powerup.png';
      case 'health':
        return './assets/power-ups/health_powerup.png';
      case 'shield':
        return './assets/power-ups/shield_powerup.png';
      default:
        return './assets/power-ups/firerate_powerup.png';
    }
  }

  getPowerUpEffects() {
    switch (this.type) {
      case 'firerate':
        return {
          name: 'Fire Rate Boost',
          description: 'Increases firing speed for 8 seconds',
          duration: 480, // 8 seconds at 60fps
          effect: (player) => {
            // Reduce fire rate cooldown by 50%
            const originalFireRate = player.shooting.fireRate;
            player.shooting.fireRate = Math.max(3, originalFireRate * 0.5);

            // Store original value for restoration
            if (!player.powerupEffects) player.powerupEffects = {};
            player.powerupEffects.firerate = {
              originalValue: originalFireRate,
              timer: this.effects.duration,
            };
          },
        };
      case 'health':
        return {
          name: 'Health Restoration',
          description: 'Restores 30 health points',
          duration: 0, // Instant effect
          effect: (player) => {
            player.heal(30);
          },
        };
      case 'shield':
        return {
          name: 'Shield Boost',
          description:
            'Increases max health and restores to full for 8 seconds',
          duration: 480, // 8 seconds at 60fps
          effect: (player) => {
            // Increase max health temporarily and heal to full
            if (!player.powerupEffects) player.powerupEffects = {};

            const currentMaxHealth = player.healthBar.maxHealth;
            const newMaxHealth = currentMaxHealth + 50;

            player.healthBar.maxHealth = newMaxHealth;
            player.healthBar.setHealth(newMaxHealth); // Heal to full

            player.powerupEffects.shield = {
              originalMaxHealth: currentMaxHealth,
              timer: this.effects.duration,
            };
          },
        };
      default:
        return {
          name: 'Unknown',
          description: 'Unknown effect',
          duration: 0,
          effect: () => {},
        };
    }
  }

  update() {
    if (!this.isActive) return;

    // Move downward
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    // Visual effects
    this.glowIntensity += this.glowDirection * 0.05;
    if (this.glowIntensity >= 1) {
      this.glowIntensity = 1;
      this.glowDirection = -1;
    } else if (this.glowIntensity <= 0) {
      this.glowIntensity = 0;
      this.glowDirection = 1;
    }

    this.rotationAngle += 0.02;
    this.floatOffset = Math.sin(Date.now() * this.floatSpeed) * 3;

    // Check boundaries
    this.checkBoundaries();
  }

  checkBoundaries() {
    if (
      this.position.x < -this.width - 50 ||
      this.position.x > this.canvas.width + 50 ||
      this.position.y < -this.height - 50 ||
      this.position.y > this.canvas.height + 50
    ) {
      this.markedForRemoval = true;
    }
  }

  draw() {
    if (!this.isActive) return;

    this.ctx.save();

    // Position with floating effect
    const drawX = this.position.x + this.width / 2;
    const drawY = this.position.y + this.height / 2 + this.floatOffset;

    if (this.spriteLoaded && !this.spriteError) {
      // Glow effect
      this.ctx.shadowColor = this.getGlowColor();
      this.ctx.shadowBlur = 15 + this.glowIntensity * 10;

      // Translate and rotate
      this.ctx.translate(drawX, drawY);
      this.ctx.rotate(this.rotationAngle);

      // Draw powerup sprite
      this.ctx.drawImage(
        this.sprite,
        -this.width / 2,
        -this.height / 2,
        this.width,
        this.height
      );
    } else {
      // Fallback colored circle if sprite isn't loaded
      this.ctx.translate(drawX, drawY);
      this.ctx.fillStyle = this.getGlowColor();
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.width / 3, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Draw type letter
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 16px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.type.charAt(0).toUpperCase(), 0, 5);
    }

    this.ctx.restore();

    // Draw powerup name (optional debug info)
    if (
      window.gameSettings &&
      window.gameSettings.debug &&
      window.gameSettings.debug.showPowerupNames
    ) {
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = '12px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(this.effects.name, drawX, drawY + this.height / 2 + 15);
    }
  }

  getGlowColor() {
    switch (this.type) {
      case 'firerate':
        return '#ffaa00'; // Orange glow
      case 'health':
        return '#00ff00'; // Green glow
      case 'shield':
        return '#0099ff'; // Blue glow
      default:
        return '#ffffff'; // White glow
    }
  }

  applyEffect(player) {
    if (!this.isActive) return;

    this.effects.effect(player);

    // Increment powerups collected counter
    if (window.gameState) {
      window.gameState.powerUpsCollected++;
    }

    // Play powerup sound
    if (window.audioManager) {
      window.audioManager.playPowerup();
    }

    // Mark for removal
    this.isActive = false;
    this.markedForRemoval = true;

    console.log(
      `PowerUp collected: ${this.effects.name} - ${this.effects.description}`
    );
  }

  shouldBeRemoved() {
    return this.markedForRemoval;
  }

  getCollisionBounds() {
    return {
      x: this.position.x + this.width * 0.1,
      y: this.position.y + this.height * 0.1,
      width: this.width * 0.8,
      height: this.height * 0.8,
    };
  }

  setCollisionComponent(component) {
    this.collisionComponent = component;
  }
}

// PowerUp Manager to handle spawning and managing powerups
class PowerUpManager {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;
    this.powerups = [];
    this.spawnTimer = 0;
    this.spawnInterval = 900; // Spawn every 15 seconds at 60fps (reduced frequency)
    this.maxPowerups = 3; // Maximum powerups on screen at once
  }

  update() {
    // Update spawn timer
    this.spawnTimer++;

    // Spawn new powerup if conditions are met
    if (this.shouldSpawnPowerup()) {
      this.spawnRandomPowerup();
      this.spawnTimer = 0;
    }

    // Update existing powerups
    this.powerups.forEach((powerup) => {
      powerup.update();
    });

    // Remove expired powerups
    this.powerups = this.powerups.filter(
      (powerup) => !powerup.shouldBeRemoved()
    );
  }

  shouldSpawnPowerup() {
    return (
      this.spawnTimer >= this.spawnInterval &&
      this.powerups.length < this.maxPowerups &&
      window.gameState &&
      window.gameState.isGameStarted &&
      !window.gameState.isPaused &&
      !window.gameState.isGameOver
    );
  }

  spawnRandomPowerup() {
    // Random spawn position at top of screen
    const x = Math.random() * (this.canvas.width - 60) + 30;
    const y = -50;

    const powerup = new PowerUp(this.ctx, this.canvas, x, y);
    this.powerups.push(powerup);

    console.log(`PowerUp spawned: ${powerup.type} at (${x}, ${y})`);
  }

  // Method to spawn specific powerup type (for testing or special events)
  spawnPowerup(type, x, y) {
    const powerup = new PowerUp(this.ctx, this.canvas, x, y);
    // Override the random type selection
    powerup.type = type;
    
    // Try to use preloaded sprite first
    const spriteKey = type + '_powerup';
    if (window.spritePreloader && window.spritePreloader.hasSprite(spriteKey)) {
      powerup.sprite = window.spritePreloader.cloneSprite(spriteKey);
      powerup.spriteLoaded = true;
      powerup.spriteError = false;
    } else {
      // Reload sprite with correct source
      powerup.sprite.onload = () => {
        powerup.spriteLoaded = true;
      };
      
      powerup.sprite.onerror = () => {
        console.error(`Failed to load specific powerup sprite: ${powerup.getSpriteSource()}`);
        powerup.spriteError = true;
      };
      
      powerup.sprite.src = powerup.getSpriteSource();
    }
    
    powerup.effects = powerup.getPowerUpEffects();

    this.powerups.push(powerup);
    console.log(`Specific PowerUp spawned: ${type} at (${x}, ${y})`);
  }

  draw() {
    this.powerups.forEach((powerup) => {
      powerup.draw();
    });
  }

  getPowerups() {
    return this.powerups;
  }

  // Method to handle collision with player
  checkPlayerCollision(player) {
    this.powerups.forEach((powerup) => {
      if (powerup.isActive && this.isColliding(powerup, player)) {
        powerup.applyEffect(player);
      }
    });
  }

  isColliding(powerup, player) {
    const powerupBounds = powerup.getCollisionBounds();
    const playerBounds = player.getCollisionBounds();

    return (
      powerupBounds.x < playerBounds.x + playerBounds.width &&
      powerupBounds.x + powerupBounds.width > playerBounds.x &&
      powerupBounds.y < playerBounds.y + playerBounds.height &&
      powerupBounds.y + powerupBounds.height > playerBounds.y
    );
  }

  // Clear all powerups (useful for stage transitions)
  clearAll() {
    this.powerups = [];
  }

  // Adjust spawn rate (for different difficulty levels)
  setSpawnRate(interval) {
    this.spawnInterval = Math.max(300, interval); // Minimum 5 seconds
  }
}
