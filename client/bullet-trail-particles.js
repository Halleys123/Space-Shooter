class BulletTrailParticleSystem {
  constructor() {
    this.particles = [];
    this.maxParticles = 80;
  }

  emit(x, y, rotation, bulletOwner = 'player') {
    if (bulletOwner !== 'player') return;

    const particleCount = Math.floor(Math.random() * 2) + 3;

    for (let i = 0; i < particleCount; i++) {
      const spreadAngle = (Math.random() - 0.5) * 0.3;
      const speed = Math.random() * 1 + 0.5;

      const velocityX = Math.sin(rotation + Math.PI + spreadAngle) * speed;
      const velocityY = -Math.cos(rotation + Math.PI + spreadAngle) * speed;

      const life = Math.random() * 15 + 10;
      const colors = ['#00ff88', '#00ddff', '#88ffaa', '#44ff66'];
      const color = colors[Math.floor(Math.random() * colors.length)];
      const size = Math.random() * 2 + 1;

      const particle = new Particle(
        x + (Math.random() - 0.5) * 4,
        y + (Math.random() - 0.5) * 4,
        velocityX,
        velocityY,
        life,
        color,
        size
      );
      this.particles.push(particle);
    }

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
