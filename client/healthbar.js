class HealthBar {
  constructor(maxHealth = 100, width = 150, height = 20) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.previousHealth = maxHealth;
    this.width = width;
    this.height = height;
    this.displayTimer = 0;
    this.displayTime = 180;
    this.offsetX = 0;
    this.offsetY = -30;

    this.frameSprite = new Image();
    this.frameSprite.src = './assets/ui/health_bar_frame.png';
  }

  setHealth(newHealth) {
    if (newHealth !== this.currentHealth) {
      this.previousHealth = this.currentHealth;
      this.currentHealth = Math.max(0, Math.min(this.maxHealth, newHealth));
      this.displayTimer = this.displayTime;
    }
  }

  getHealth() {
    return this.currentHealth;
  }

  getHealthPercentage() {
    return this.currentHealth / this.maxHealth;
  }

  shouldDisplay() {
    return this.displayTimer > 0;
  }

  update() {
    if (this.displayTimer > 0) {
      this.displayTimer--;
    }
  }

  setOffset(offsetX, offsetY) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  draw(ctx, entityX, entityY, entityWidth = 0) {
    if (!this.shouldDisplay()) return;

    const x = entityX + entityWidth / 2 - this.width / 2 + this.offsetX;
    const y = entityY + this.offsetY;

    const healthPercentage = this.getHealthPercentage();

    ctx.fillStyle = '#440000';
    ctx.fillRect(x, y, this.width, this.height);

    if (healthPercentage > 0.6) {
      ctx.fillStyle = '#00ff00';
    } else if (healthPercentage > 0.3) {
      ctx.fillStyle = '#ffff00';
    } else {
      ctx.fillStyle = '#ff0000';
    }

    ctx.fillRect(x, y, this.width * healthPercentage, this.height);

    if (this.frameSprite && this.frameSprite.complete) {
      ctx.drawImage(this.frameSprite, x, y, this.width, this.height);
    } else {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, this.width, this.height);
    }

    if (this.width >= 80) {
      ctx.fillStyle = '#ffffff';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        `${this.currentHealth}/${this.maxHealth}`,
        x + this.width / 2,
        y + this.height / 2 - 10
      );
    }
  }

  forceDisplay() {
    this.displayTimer = this.displayTime;
  }

  isDead() {
    return this.currentHealth <= 0;
  }

  heal(amount) {
    this.setHealth(this.currentHealth + amount);
  }

  damage(amount) {
    this.setHealth(this.currentHealth - amount);
  }

  reset() {
    this.setHealth(this.maxHealth);
  }
}
