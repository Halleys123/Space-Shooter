// Object Pool System for better memory management
class ObjectPool {
  constructor(createFn, resetFn, initialSize = 50) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    this.pool = [];
    this.active = [];

    // Pre-allocate objects
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createFn());
    }
  }

  get() {
    let obj = this.pool.pop();
    if (!obj) {
      obj = this.createFn();
    }
    this.active.push(obj);
    return obj;
  }

  release(obj) {
    const index = this.active.indexOf(obj);
    if (index !== -1) {
      this.active.splice(index, 1);
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  releaseAll() {
    this.active.forEach((obj) => {
      this.resetFn(obj);
      this.pool.push(obj);
    });
    this.active.length = 0;
  }

  getActiveCount() {
    return this.active.length;
  }

  getPoolSize() {
    return this.pool.length;
  }
}

// Particle Pool for better particle management
class ParticlePool extends ObjectPool {
  constructor(particleClass, initialSize = 100) {
    super(
      () => new particleClass(0, 0, 0, 0, 0, '#ffffff', 1),
      (particle) => {
        particle.life = 0;
        particle.position.x = 0;
        particle.position.y = 0;
        particle.velocity.x = 0;
        particle.velocity.y = 0;
        particle.alpha = 1;
      },
      initialSize
    );
  }

  createParticle(x, y, velocityX, velocityY, life, color, size) {
    const particle = this.get();
    particle.position.x = x;
    particle.position.y = y;
    particle.velocity.x = velocityX;
    particle.velocity.y = velocityY;
    particle.life = life;
    particle.maxLife = life;
    particle.color = color;
    particle.size = size;
    particle.alpha = 1;
    return particle;
  }
}

// Expose to global scope
if (typeof window !== 'undefined') {
  window.ObjectPool = ObjectPool;
  window.ParticlePool = ParticlePool;
}
