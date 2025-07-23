class Particle {
  constructor(x, y, velocityX, velocityY, life, color, size) {
    this.position = { x, y };
    this.velocity = { x: velocityX, y: velocityY };
    this.life = life;
    this.maxLife = life;
    this.color = color;
    this.size = size;
    this.alpha = 1;
  }

  update() {
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
    this.life--;
    this.alpha = this.life / this.maxLife;

    // Add some friction to particles
    this.velocity.x *= 0.98;
    this.velocity.y *= 0.98;
  }

  draw(ctx) {
    if (this.life <= 0) return;

    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.position.x, this.position.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() {
    return this.life <= 0;
  }
}

class ThrustParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 200;
  }

  emit(x, y, rotation, isAccelerating) {
    if (!isAccelerating) return;

    // Emit particles from the back of the ship
    const particleCount = Math.random() * 3 + 2; // 2-5 particles per frame

    for (let i = 0; i < particleCount; i++) {
      // Calculate emission point at the back of the ship
      const emitDistance = 60; // Distance behind the ship center
      const emitX = x - Math.sin(rotation) * emitDistance;
      const emitY = y + Math.cos(rotation) * emitDistance;

      // Add some spread to the emission
      const spread = 0.5;
      const angle = rotation + Math.PI + (Math.random() - 0.5) * spread;

      const speed = Math.random() * 2 + 1;
      const velocityX = Math.sin(angle) * speed;
      const velocityY = -Math.cos(angle) * speed;

      const life = Math.random() * 20 + 10; // 10-30 frames
      const colors = ['#00ffff', '#00ff88', '#ffff00', '#44ff44'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 3 + 1;

      const particle = new Particle(
        emitX,
        emitY,
        velocityX,
        velocityY,
        life,
        color,
        size
      );
      this.particles.push(particle);
    }

    // Remove excess particles
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  update() {
    this.particles.forEach((particle) => particle.update());
    this.particles = this.particles.filter((particle) => !particle.isDead());
  }

  draw(ctx) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }
}

class CollisionParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 100;
  }

  emit(x, y, collisionSide) {
    // Emit particles from collision point
    const particleCount = Math.random() * 8 + 5; // 5-13 particles per collision

    for (let i = 0; i < particleCount; i++) {
      // Determine particle direction based on collision side
      let angle;
      switch (collisionSide) {
        case 'left':
          angle = (Math.random() - 0.5) * Math.PI; // -90° to +90° from right
          break;
        case 'right':
          angle = Math.PI + (Math.random() - 0.5) * Math.PI; // -90° to +90° from left
          break;
        case 'top':
          angle = Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // -90° to +90° from down
          break;
        case 'bottom':
          angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI; // -90° to +90° from up
          break;
        default:
          angle = Math.random() * Math.PI * 2; // Random direction
      }

      const speed = Math.random() * 4 + 2;
      const velocityX = Math.cos(angle) * speed;
      const velocityY = Math.sin(angle) * speed;

      const life = Math.random() * 30 + 15; // 15-45 frames
      const colors = ['#ff4500', '#ff6b35', '#ff8800', '#cc3300'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 4 + 2;

      const particle = new Particle(
        x + (Math.random() - 0.5) * 20, // Add some spread around collision point
        y + (Math.random() - 0.5) * 20,
        velocityX,
        velocityY,
        life,
        color,
        size
      );
      this.particles.push(particle);
    }

    // Remove excess particles
    if (this.particles.length > this.maxParticles) {
      this.particles.splice(0, this.particles.length - this.maxParticles);
    }
  }

  update() {
    this.particles.forEach((particle) => particle.update());
    this.particles = this.particles.filter((particle) => !particle.isDead());
  }

  draw(ctx) {
    this.particles.forEach((particle) => particle.draw(ctx));
  }
}
