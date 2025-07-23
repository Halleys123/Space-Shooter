class HealthBar {
  constructor(maxHealth = 100, width = 150, height = 20) {
    this.maxHealth = maxHealth;
    this.currentHealth = maxHealth;
    this.previousHealth = maxHealth;
    this.width = width;
    this.height = height;
    this.displayTimer = 0;
    this.displayTime = 180; // frames to display health bar (3 seconds at 60 FPS)
    this.offsetX = 0;
    this.offsetY = -30; // Default offset above the entity

    // Load health bar frame sprite
    this.frameSprite = new Image();
    this.frameSprite.src = './assets/ui/health_bar_frame.png';
  }

  // Update health and trigger display
  setHealth(newHealth) {
    if (newHealth !== this.currentHealth) {
      this.previousHealth = this.currentHealth;
      this.currentHealth = Math.max(0, Math.min(this.maxHealth, newHealth));
      this.displayTimer = this.displayTime;
    }
  }

  // Get current health
  getHealth() {
    return this.currentHealth;
  }

  // Get health percentage
  getHealthPercentage() {
    return this.currentHealth / this.maxHealth;
  }

  // Check if health bar should be displayed
  shouldDisplay() {
    return this.displayTimer > 0;
  }

  // Update the health bar (call this every frame)
  update() {
    if (this.displayTimer > 0) {
      this.displayTimer--;
    }
  }

  // Set custom offset from entity position
  setOffset(offsetX, offsetY) {
    this.offsetX = offsetX;
    this.offsetY = offsetY;
  }

  // Draw the health bar at specified position
  draw(ctx, entityX, entityY, entityWidth = 0) {
    if (!this.shouldDisplay()) return;

    // Calculate position centered above the entity
    const x = entityX + entityWidth / 2 - this.width / 2 + this.offsetX;
    const y = entityY + this.offsetY;

    const healthPercentage = this.getHealthPercentage();

    // Draw health bar background (dark red)
    ctx.fillStyle = '#440000';
    ctx.fillRect(x, y, this.width, this.height);

    // Draw health bar fill (color based on health percentage)
    if (healthPercentage > 0.6) {
      ctx.fillStyle = '#00ff00'; // Green
    } else if (healthPercentage > 0.3) {
      ctx.fillStyle = '#ffff00'; // Yellow
    } else {
      ctx.fillStyle = '#ff0000'; // Red
    }

    ctx.fillRect(x, y, this.width * healthPercentage, this.height);

    // Draw health bar frame if sprite is loaded
    if (this.frameSprite && this.frameSprite.complete) {
      ctx.drawImage(this.frameSprite, x, y, this.width, this.height);
    } else {
      // Fallback border
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, this.width, this.height);
    }

    // Draw health text (only if health bar is wide enough)
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

  // Force display the health bar (useful for testing or when taking damage)
  forceDisplay() {
    this.displayTimer = this.displayTime;
  }

  // Check if entity is dead
  isDead() {
    return this.currentHealth <= 0;
  }

  // Heal the entity
  heal(amount) {
    this.setHealth(this.currentHealth + amount);
  }

  // Damage the entity
  damage(amount) {
    this.setHealth(this.currentHealth - amount);
  }

  // Reset health to maximum
  reset() {
    this.setHealth(this.maxHealth);
  }
}
