class Star {
  constructor(
    canvas,
    x = null,
    y = null,
    speed = null,
    size = null,
    brightness = null
  ) {
    this.canvas = canvas;

    this.x = x !== null ? x : Math.random() * canvas.width;
    this.y = y !== null ? y : Math.random() * canvas.height;

    this.size = size !== null ? size : Math.random() * 3 + 0.5;
    this.brightness =
      brightness !== null ? brightness : Math.random() * 0.8 + 0.2;
    this.color = this.generateStarColor();

    this.baseSpeed = speed !== null ? speed : Math.random() * 2 + 0.5;
    this.speed = this.baseSpeed;
    this.direction = Math.PI / 2;

    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.05 + 0.02;
    this.alpha = this.brightness;

    this.depth = Math.random() * 0.8 + 0.2;
    this.size *= this.depth;
    this.speed *= this.depth;
  }

  generateStarColor() {
    const starColors = [
      '#ffffff',
      '#ffffcc',
      '#ccccff',
      '#ffcccc',
      '#ccffcc',
      '#ffccff',
    ];

    return starColors[Math.floor(Math.random() * starColors.length)];
  }

  update(speedMultiplier = 1, windX = 0, windY = 0) {
    this.twinklePhase += this.twinkleSpeed;
    this.alpha = this.brightness * (0.7 + 0.3 * Math.sin(this.twinklePhase));

    this.x += Math.sin(this.direction) * this.speed * speedMultiplier + windX;
    this.y += Math.cos(this.direction) * this.speed * speedMultiplier + windY;

    this.wrapAroundScreen();
  }

  wrapAroundScreen() {
    if (this.x > this.canvas.width + 10) {
      this.x = -10;
    } else if (this.x < -10) {
      this.x = this.canvas.width + 10;
    }

    if (this.y > this.canvas.height + 10) {
      this.y = -10;
    } else if (this.y < -10) {
      this.y = this.canvas.height + 10;
    }
  }

  draw(ctx, enableGlow = true) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();

    if (enableGlow && this.size > 2 && this.brightness > 0.7) {
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  reset(newX = null, newY = null) {
    this.x = newX !== null ? newX : Math.random() * this.canvas.width;
    this.y = newY !== null ? newY : Math.random() * this.canvas.height;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }
}

class StarField {
  constructor(canvas, starCount = 200) {
    this.canvas = canvas;
    this.stars = [];

    const performanceSettings = window.performanceManager
      ? window.performanceManager.getSettings()
      : null;
    this.starCount = performanceSettings
      ? performanceSettings.starCount
      : Math.min(starCount, 50);

    this.globalSpeedMultiplier = 1;
    this.windX = 0;
    this.windY = 0;

    this.currentStageTheme = 'default';
    this.colorFilter = { r: 1, g: 1, b: 1 };

    this.warpEffect = false;
    this.warpIntensity = 0;
    this.warpDirection = 0;

    this.enableGlow = performanceSettings
      ? performanceSettings.enableGlow
      : true;
    this.enableFilters = performanceSettings
      ? performanceSettings.enableFilters
      : true;

    this.frameSkipCounter = 0;

    this.generateStars();
  }

  generateStars() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push(new Star(this.canvas));
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

    this.stars.forEach((star) => {
      star.update(this.globalSpeedMultiplier, this.windX, this.windY);
    });

    if (this.warpEffect) {
      this.updateWarpEffect();
    }
  }

  draw(ctx) {
    const shouldUseFilters =
      this.enableFilters &&
      (this.colorFilter.r !== 1 ||
        this.colorFilter.g !== 1 ||
        this.colorFilter.b !== 1);

    if (shouldUseFilters) {
      ctx.save();
      ctx.filter = `sepia(100%) hue-rotate(${this.getHueRotation()}deg) saturate(200%)`;
    }

    this.stars.forEach((star) => {
      star.draw(ctx, this.enableGlow);
    });

    if (shouldUseFilters) {
      ctx.restore();
    }

    if (this.warpEffect) {
      this.drawWarpLines(ctx);
    }
  }

  setStageTheme(stage, cycle = 1) {
    this.currentStageTheme = stage;

    switch (stage) {
      case 1:
      case 2:
        this.colorFilter = { r: 0.8, g: 0.9, b: 1.2 };
        this.globalSpeedMultiplier = 1;
        break;

      case 3:
      case 4:
        this.colorFilter = { r: 1.1, g: 0.9, b: 0.8 };
        this.globalSpeedMultiplier = 1.2;
        break;

      case 5:
      case 6:
        this.colorFilter = { r: 1.2, g: 0.8, b: 1.1 };
        this.globalSpeedMultiplier = 1.5;
        break;

      case 7:
      case 8:
        this.colorFilter = { r: 1.3, g: 1.1, b: 0.7 };
        this.globalSpeedMultiplier = 1.8;
        break;

      case 9:
      case 10:
        this.colorFilter = { r: 1.5, g: 0.6, b: 0.6 };
        this.globalSpeedMultiplier = 2.0 + (cycle - 1) * 0.3;
        break;

      default:
        this.colorFilter = { r: 1, g: 1, b: 1 };
        this.globalSpeedMultiplier = 1;
    }

    this.globalSpeedMultiplier += (cycle - 1) * 0.2;
  }

  getHueRotation() {
    const { r, g, b } = this.colorFilter;
    if (r > g && r > b) return 0;
    if (g > r && g > b) return 120;
    if (b > r && b > g) return 240;
    if (r > 1 && b > 1) return 300;
    if (r > 1 && g > 1) return 60;
    return 0;
  }

  startWarpEffect(direction = Math.PI / 2, duration = 3000) {
    this.warpEffect = true;
    this.warpDirection = direction;
    this.warpIntensity = 0;

    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 0.5) {
        this.warpIntensity = progress * 2;
      } else {
        this.warpIntensity = 2 - progress * 2;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.warpEffect = false;
        this.warpIntensity = 0;
      }
    };

    requestAnimationFrame(animate);
  }

  updateWarpEffect() {
    this.stars.forEach((star) => {
      const warpSpeed = this.warpIntensity * 15;
      star.speed = star.baseSpeed + warpSpeed;
    });
  }

  drawWarpLines(ctx) {
    if (this.warpIntensity <= 0) return;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 255, ${this.warpIntensity * 0.3})`;
    ctx.lineWidth = 1;
    ctx.globalCompositeOperation = 'screen';

    this.stars.forEach((star) => {
      if (star.size > 1.5) {
        const lineLength = this.warpIntensity * 50;
        const startX = star.x - Math.sin(this.warpDirection) * lineLength;
        const startY = star.y - Math.cos(this.warpDirection) * lineLength;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(star.x, star.y);
        ctx.stroke();
      }
    });

    ctx.restore();
  }

  setWind(x, y) {
    this.windX = x;
    this.windY = y;
  }

  addTurbulence(intensity = 1) {
    this.windX += (Math.random() - 0.5) * intensity;
    this.windY += (Math.random() - 0.5) * intensity;

    this.windX *= 0.95;
    this.windY *= 0.95;
  }

  setStarCount(count) {
    if (count > this.stars.length) {
      for (let i = this.stars.length; i < count; i++) {
        this.stars.push(new Star(this.canvas));
      }
    } else if (count < this.stars.length) {
      this.stars.splice(count);
    }
    this.starCount = count;
  }

  createMeteor(startX = null, startY = null) {
    const meteorX =
      startX !== null ? startX : Math.random() * this.canvas.width;
    const meteorY = startY !== null ? startY : -50;

    const meteor = new Star(
      this.canvas,
      meteorX,
      meteorY,
      Math.random() * 8 + 4,
      Math.random() * 2 + 3,
      1
    );

    meteor.color = '#ffff88';
    meteor.direction = Math.PI / 2 + (Math.random() - 0.5) * 0.5;

    this.stars.push(meteor);

    setTimeout(() => {
      const index = this.stars.indexOf(meteor);
      if (index > -1) {
        this.stars.splice(index, 1);
      }
    }, 5000);
  }

  resize(newWidth, newHeight) {
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    this.generateStars();
  }
}
