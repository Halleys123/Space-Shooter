class BlastParticle {
  constructor(x, y, velocityX, velocityY, life, color, size, type = 'spark') {
    this.position = { x, y };
    this.velocity = { x: velocityX, y: velocityY };
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.alpha = 1;
    this.type = type;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.2;

    if (type === 'debris') {
      this.gravity = 0.1;
      this.friction = 0.99;
    } else if (type === 'smoke') {
      this.friction = 0.95;
      this.expansionRate = 1.02;
    } else {
      this.friction = 0.98;
    }
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.life--;
    this.alpha = this.life / this.maxLife;
    this.rotation += this.rotationSpeed;

    if (this.type === 'debris') {
      this.velocity.y += this.gravity;
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
    } else if (this.type === 'smoke') {
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
      this.size *= this.expansionRate;
    } else {
      this.velocity.x *= this.friction;
      this.velocity.y *= this.friction;
    }
  }

  draw(ctx) {
    if (this.life <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.position.x, this.position.y);
    ctx.rotate(this.rotation);

    if (this.type === 'debris') {
      ctx.fillStyle = this.color;
      ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size / 2);
    } else if (this.type === 'smoke') {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = this.color;
      ctx.beginPath();
      ctx.arc(0, 0, this.size, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class BlastParticleSystem {
  constructor() {
    this.particles = [];

    const performanceSettings = window.performanceManager
      ? window.performanceManager.getSettings()
      : null;
    this.maxParticles = performanceSettings
      ? performanceSettings.maxParticles.blast
      : 150;

    this.frameSkipCounter = 0;
  }

  createExplosion(x, y, intensity = 1, type = 'normal') {
    const performanceLevel = window.performanceManager
      ? window.performanceManager.performanceLevel
      : 'high';
    let particleMultiplier = 1;

    if (performanceLevel === 'low') {
      particleMultiplier = 0.3;
    } else if (performanceLevel === 'medium') {
      particleMultiplier = 0.6;
    }

    const particleCount = Math.floor(
      (20 + intensity * 30) * particleMultiplier
    );

    for (let i = 0; i < particleCount; i++) {
      if (i < particleCount * 0.6) {
        this.createSpark(x, y, intensity);
      } else if (i < particleCount * 0.8) {
        this.createDebris(x, y, intensity);
      } else {
        this.createSmoke(x, y, intensity);
      }
    }

    this.createShockwave(x, y, intensity * particleMultiplier);
  }

  createSpark(x, y, intensity) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 8 + 2) * intensity;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed;

    const life = Math.random() * 20 + 15;
    const colors = ['#ffff00', '#ff8800', '#ff4400', '#ff0000', '#ffffff'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 3 + 1;

    const particle = new BlastParticle(
      x + (Math.random() - 0.5) * 10,
      y + (Math.random() - 0.5) * 10,
      velocityX,
      velocityY,
      life,
      color,
      size,
      'spark'
    );

    this.particles.push(particle);
  }

  createDebris(x, y, intensity) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 6 + 1) * intensity;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed - Math.random() * 2;

    const life = Math.random() * 40 + 30;
    const colors = ['#666666', '#888888', '#444444', '#ff4400'];
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 6 + 2;

    const particle = new BlastParticle(
      x + (Math.random() - 0.5) * 15,
      y + (Math.random() - 0.5) * 15,
      velocityX,
      velocityY,
      life,
      color,
      size,
      'debris'
    );

    this.particles.push(particle);
  }

  createSmoke(x, y, intensity) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (Math.random() * 2 + 0.5) * intensity;
    const velocityX = Math.cos(angle) * speed;
    const velocityY = Math.sin(angle) * speed - 1;

    const life = Math.random() * 60 + 40;
    const smokeColors = ['#333333', '#555555', '#777777', '#999999'];
    const color = smokeColors[Math.floor(Math.random() * smokeColors.length)];
    const size = Math.random() * 8 + 4;

    const particle = new BlastParticle(
      x + (Math.random() - 0.5) * 20,
      y + (Math.random() - 0.5) * 20,
      velocityX,
      velocityY,
      life,
      color,
      size,
      'smoke'
    );

    this.particles.push(particle);
  }

  createShockwave(x, y, intensity) {
    const shockwaveParticles = Math.floor(8 * intensity);

    for (let i = 0; i < shockwaveParticles; i++) {
      const angle = (i / shockwaveParticles) * Math.PI * 2;
      const speed = 8 + intensity * 4;
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      const life = 15;
      const color = '#ffffff';
      const size = 2;

      const particle = new BlastParticle(
        x,
        y,
        velocityX,
        velocityY,
        life,
        color,
        size,
        'spark'
      );

      this.particles.push(particle);
    }
  }

  update() {
    if (
      window.performanceManager &&
      window.performanceManager.shouldSkipFrame()
    ) {
      this.frameSkipCounter++;
      if (this.frameSkipCounter % 2 !== 0) return;
    }

    this.particles.forEach((particle) => particle.update());
    this.particles = this.particles.filter((particle) => !particle.isDead());

    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  draw(ctx) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }

  getParticleCount() {
    return this.particles.length;
  }
}

class Blast {
  constructor(ctx, x, y, size = 1, type = 'normal') {
    this.ctx = ctx;
    this.position = { x, y };
    this.size = size;
    this.type = type;
    this.isActive = true;
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.frameDelay = 4;
    this.rotation = Math.random() * Math.PI * 2;

    this.sprites = [];
    this.loadSprites();

    this.width = 64 * size;
    this.height = 64 * size;

    if (type === 'large') {
      this.frameDelay = 6;
      this.width = 96 * size;
      this.height = 96 * size;
    } else if (type === 'small') {
      this.frameDelay = 3;
      this.width = 32 * size;
      this.height = 32 * size;
    }
  }

  loadSprites() {
    // Try to use preloaded sprites first
    for (let i = 1; i <= 4; i++) {
      const spriteKey = `explosion_${i}`;
      if (
        window.spritePreloader &&
        window.spritePreloader.hasSprite(spriteKey)
      ) {
        this.sprites.push(window.spritePreloader.cloneSprite(spriteKey));
      } else {
        const sprite = new Image();
        sprite.src = `./assets/sprites/explosion_sprite_${i}.png`;
        this.sprites.push(sprite);
      }
    }
  }

  update() {
    if (!this.isActive) return;

    this.frameTimer++;
    if (this.frameTimer >= this.frameDelay) {
      this.currentFrame++;
      this.frameTimer = 0;

      if (this.currentFrame >= this.sprites.length) {
        this.isActive = false;
      }
    }
  }

  draw() {
    if (!this.isActive || this.currentFrame >= this.sprites.length) return;

    const sprite = this.sprites[this.currentFrame];
    if (!sprite.complete) return;

    this.ctx.save();
    this.ctx.translate(this.position.x, this.position.y);
    this.ctx.rotate(this.rotation);
    this.ctx.drawImage(
      sprite,
      -this.width / 2,
      -this.height / 2,
      this.width,
      this.height
    );
    this.ctx.restore();
  }

  isFinished() {
    return !this.isActive;
  }

  static createExplosion(ctx, x, y, type = 'normal', size = 1) {
    return new Blast(ctx, x, y, size, type);
  }
}

class BlastManager {
  constructor(ctx) {
    this.ctx = ctx;
    this.blasts = [];
    this.particleSystem = new BlastParticleSystem();
  }

  createExplosion(x, y, type = 'normal', size = 1) {
    const blast = Blast.createExplosion(this.ctx, x, y, type, size);
    this.blasts.push(blast);

    let intensity = size;
    if (type === 'large') intensity *= 1.5;
    if (type === 'small') intensity *= 0.7;

    this.particleSystem.createExplosion(x, y, intensity, type);
  }

  createEnemyExplosion(x, y, enemyType = 'basic') {
    let size = 1;
    let type = 'normal';

    switch (enemyType) {
      case 'basic':
        size = 0.8;
        type = 'normal';
        break;
      case 'shooter':
        size = 1;
        type = 'normal';
        break;
      case 'zigzag':
        size = 0.9;
        type = 'normal';
        break;
      case 'kamikaze':
        size = 1.2;
        type = 'large';
        break;
      case 'boss':
        size = 2;
        type = 'large';
        break;
    }

    this.createExplosion(x, y, type, size);
  }

  update() {
    this.blasts.forEach((blast) => blast.update());
    this.blasts = this.blasts.filter((blast) => !blast.isFinished());

    this.particleSystem.update();
  }

  draw() {
    this.particleSystem.draw(this.ctx);

    this.blasts.forEach((blast) => blast.draw());
  }

  getActiveBlasts() {
    return this.blasts.length;
  }

  getActiveParticles() {
    return this.particleSystem.getParticleCount();
  }

  clear() {
    this.blasts = [];
    this.particleSystem.particles = [];
  }
}
