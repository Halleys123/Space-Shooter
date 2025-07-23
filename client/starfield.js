// Individual star class
class Star {
  constructor(canvas, x = null, y = null, speed = null, size = null, brightness = null) {
    this.canvas = canvas;
    
    // Position - random if not specified
    this.x = x !== null ? x : Math.random() * canvas.width;
    this.y = y !== null ? y : Math.random() * canvas.height;
    
    // Visual properties
    this.size = size !== null ? size : Math.random() * 3 + 0.5; // 0.5 to 3.5
    this.brightness = brightness !== null ? brightness : Math.random() * 0.8 + 0.2; // 0.2 to 1.0
    this.color = this.generateStarColor();
    
    // Movement properties
    this.baseSpeed = speed !== null ? speed : Math.random() * 2 + 0.5; // 0.5 to 2.5
    this.speed = this.baseSpeed;
    this.direction = Math.PI / 2; // Default downward movement
    
    // Animation properties
    this.twinklePhase = Math.random() * Math.PI * 2;
    this.twinkleSpeed = Math.random() * 0.05 + 0.02; // 0.02 to 0.07
    this.alpha = this.brightness;
    
    // Parallax depth (affects speed and size)
    this.depth = Math.random() * 0.8 + 0.2; // 0.2 to 1.0 (closer = larger/faster)
    this.size *= this.depth;
    this.speed *= this.depth;
  }
  
  generateStarColor() {
    const starColors = [
      '#ffffff', // White
      '#ffffcc', // Warm white
      '#ccccff', // Cool white/blue
      '#ffcccc', // Warm white/red
      '#ccffcc', // Green tint
      '#ffccff', // Magenta tint
    ];
    
    return starColors[Math.floor(Math.random() * starColors.length)];
  }
  
  update(speedMultiplier = 1, windX = 0, windY = 0) {
    // Update twinkling
    this.twinklePhase += this.twinkleSpeed;
    this.alpha = this.brightness * (0.7 + 0.3 * Math.sin(this.twinklePhase));
    
    // Apply movement with wind effects
    this.x += (Math.sin(this.direction) * this.speed * speedMultiplier) + windX;
    this.y += (Math.cos(this.direction) * this.speed * speedMultiplier) + windY;
    
    // Wrap around screen boundaries
    this.wrapAroundScreen();
  }
  
  wrapAroundScreen() {
    // Horizontal wrapping
    if (this.x > this.canvas.width + 10) {
      this.x = -10;
    } else if (this.x < -10) {
      this.x = this.canvas.width + 10;
    }
    
    // Vertical wrapping
    if (this.y > this.canvas.height + 10) {
      this.y = -10;
    } else if (this.y < -10) {
      this.y = this.canvas.height + 10;
    }
  }
  
  draw(ctx) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    
    // Draw star as a small circle
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    
    // Add glow effect for larger/brighter stars
    if (this.size > 2 && this.brightness > 0.7) {
      ctx.globalAlpha = this.alpha * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.size * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    ctx.restore();
  }
  
  // Reset star position (useful for recycling)
  reset(newX = null, newY = null) {
    this.x = newX !== null ? newX : Math.random() * this.canvas.width;
    this.y = newY !== null ? newY : Math.random() * this.canvas.height;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }
}

// Star field background manager
class StarField {
  constructor(canvas, starCount = 200) {
    this.canvas = canvas;
    this.stars = [];
    this.starCount = starCount;
    
    // Movement properties
    this.globalSpeedMultiplier = 1;
    this.windX = 0;
    this.windY = 0;
    
    // Stage-based properties
    this.currentStageTheme = 'default';
    this.colorFilter = { r: 1, g: 1, b: 1 }; // RGB multipliers
    
    // Animation properties
    this.warpEffect = false;
    this.warpIntensity = 0;
    this.warpDirection = 0;
    
    // Initialize stars
    this.generateStars();
  }
  
  generateStars() {
    this.stars = [];
    for (let i = 0; i < this.starCount; i++) {
      this.stars.push(new Star(this.canvas));
    }
  }
  
  // Update all stars
  update() {
    this.stars.forEach(star => {
      star.update(this.globalSpeedMultiplier, this.windX, this.windY);
    });
    
    // Update warp effect
    if (this.warpEffect) {
      this.updateWarpEffect();
    }
  }
  
  // Draw all stars
  draw(ctx) {
    // Apply color filter if active
    if (this.colorFilter.r !== 1 || this.colorFilter.g !== 1 || this.colorFilter.b !== 1) {
      ctx.save();
      ctx.filter = `sepia(100%) hue-rotate(${this.getHueRotation()}deg) saturate(200%)`;
    }
    
    this.stars.forEach(star => {
      star.draw(ctx);
    });
    
    if (this.colorFilter.r !== 1 || this.colorFilter.g !== 1 || this.colorFilter.b !== 1) {
      ctx.restore();
    }
    
    // Draw warp lines if active
    if (this.warpEffect) {
      this.drawWarpLines(ctx);
    }
  }
  
  // Set stage theme that affects star appearance
  setStageTheme(stage, cycle = 1) {
    this.currentStageTheme = stage;
    
    switch (stage) {
      case 1:
      case 2:
        // Early stages - normal blue-white stars
        this.colorFilter = { r: 0.8, g: 0.9, b: 1.2 };
        this.globalSpeedMultiplier = 1;
        break;
        
      case 3:
      case 4:
        // Combat stages - slightly red tint
        this.colorFilter = { r: 1.1, g: 0.9, b: 0.8 };
        this.globalSpeedMultiplier = 1.2;
        break;
        
      case 5:
      case 6:
        // Chaos stages - purple/magenta tint
        this.colorFilter = { r: 1.2, g: 0.8, b: 1.1 };
        this.globalSpeedMultiplier = 1.5;
        break;
        
      case 7:
      case 8:
        // Intense stages - orange/yellow tint
        this.colorFilter = { r: 1.3, g: 1.1, b: 0.7 };
        this.globalSpeedMultiplier = 1.8;
        break;
        
      case 9:
      case 10:
        // Final stages - dramatic red tint, fast movement
        this.colorFilter = { r: 1.5, g: 0.6, b: 0.6 };
        this.globalSpeedMultiplier = 2.0 + (cycle - 1) * 0.3;
        break;
        
      default:
        this.colorFilter = { r: 1, g: 1, b: 1 };
        this.globalSpeedMultiplier = 1;
    }
    
    // Add cycle-based intensity
    this.globalSpeedMultiplier += (cycle - 1) * 0.2;
  }
  
  getHueRotation() {
    const { r, g, b } = this.colorFilter;
    if (r > g && r > b) return 0;     // Red
    if (g > r && g > b) return 120;   // Green
    if (b > r && b > g) return 240;   // Blue
    if (r > 1 && b > 1) return 300;   // Magenta
    if (r > 1 && g > 1) return 60;    // Yellow
    return 0;
  }
  
  // Trigger warp effect for stage transitions
  startWarpEffect(direction = Math.PI / 2, duration = 3000) {
    this.warpEffect = true;
    this.warpDirection = direction;
    this.warpIntensity = 0;
    
    // Animate warp effect
    const startTime = Date.now();
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 0.5) {
        // Ramp up
        this.warpIntensity = progress * 2;
      } else {
        // Ramp down
        this.warpIntensity = 2 - (progress * 2);
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
    // Increase star speed dramatically during warp
    this.stars.forEach(star => {
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
    
    // Draw speed lines
    this.stars.forEach(star => {
      if (star.size > 1.5) { // Only for larger stars
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
  
  // Set wind effects for dynamic movement
  setWind(x, y) {
    this.windX = x;
    this.windY = y;
  }
  
  // Add wind turbulence
  addTurbulence(intensity = 1) {
    this.windX += (Math.random() - 0.5) * intensity;
    this.windY += (Math.random() - 0.5) * intensity;
    
    // Decay wind over time
    this.windX *= 0.95;
    this.windY *= 0.95;
  }
  
  // Adjust star density
  setStarCount(count) {
    if (count > this.stars.length) {
      // Add more stars
      for (let i = this.stars.length; i < count; i++) {
        this.stars.push(new Star(this.canvas));
      }
    } else if (count < this.stars.length) {
      // Remove stars
      this.stars.splice(count);
    }
    this.starCount = count;
  }
  
  // Create meteor effect
  createMeteor(startX = null, startY = null) {
    const meteorX = startX !== null ? startX : Math.random() * this.canvas.width;
    const meteorY = startY !== null ? startY : -50;
    
    const meteor = new Star(
      this.canvas,
      meteorX,
      meteorY,
      Math.random() * 8 + 4, // Fast speed
      Math.random() * 2 + 3, // Large size
      1 // Full brightness
    );
    
    meteor.color = '#ffff88'; // Yellow-white
    meteor.direction = Math.PI / 2 + (Math.random() - 0.5) * 0.5; // Slightly angled
    
    this.stars.push(meteor);
    
    // Remove meteor after it crosses screen
    setTimeout(() => {
      const index = this.stars.indexOf(meteor);
      if (index > -1) {
        this.stars.splice(index, 1);
      }
    }, 5000);
  }
  
  // Resize canvas
  resize(newWidth, newHeight) {
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    
    // Regenerate stars for new size
    this.generateStars();
  }
}
