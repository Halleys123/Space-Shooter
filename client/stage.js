class Stage {
  constructor(ctx, canvas) {
    this.ctx = ctx;
    this.canvas = canvas;

    this.currentStage = 1;
    this.currentCycle = 1;
    this.totalStages = 10;
    this.isStageComplete = false;
    this.isTransitioning = false;
    this.transitionTimer = 0;
    this.transitionDuration = 180;

    this.enemies = [];
    this.enemySpawnTimer = 0;
    this.nextSpawnTime = 0;

    this.starField = new StarField(canvas, 150);
    this.starField.setStageTheme(this.currentStage, this.currentCycle);

    this.stageConfigs = {
      1: {
        name: 'Basic Assault',
        description: 'Simple enemies moving down',
        enemyTypes: [{ type: BasicEnemy, weight: 100 }],
        spawnRate: 90,
        maxEnemies: 3,
        duration: 600,
      },
      2: {
        name: 'Mixed Formation',
        description: 'Basic and zigzag enemies',
        enemyTypes: [
          { type: BasicEnemy, weight: 70 },
          { type: ZigzagEnemy, weight: 30 },
        ],
        spawnRate: 80,
        maxEnemies: 4,
        duration: 720,
      },
      3: {
        name: 'Shooter Squadron',
        description: 'Enemies that shoot back',
        enemyTypes: [
          { type: BasicEnemy, weight: 40 },
          { type: ShooterEnemy, weight: 60 },
        ],
        spawnRate: 100,
        maxEnemies: 3,
        duration: 900,
      },
      4: {
        name: 'Kamikaze Rush',
        description: 'Fast aggressive enemies',
        enemyTypes: [
          { type: BasicEnemy, weight: 30 },
          { type: KamikazeEnemy, weight: 70 },
        ],
        spawnRate: 60,
        maxEnemies: 5,
        duration: 720,
      },
      5: {
        name: 'Chaos Formation',
        description: 'All enemy types mixed',
        enemyTypes: [
          { type: BasicEnemy, weight: 25 },
          { type: ShooterEnemy, weight: 25 },
          { type: ZigzagEnemy, weight: 25 },
          { type: KamikazeEnemy, weight: 25 },
        ],
        spawnRate: 70,
        maxEnemies: 4,
        duration: 1080,
      },
      6: {
        name: 'Shooter Barrage',
        description: 'Heavy firepower incoming',
        enemyTypes: [
          { type: ShooterEnemy, weight: 80 },
          { type: BasicEnemy, weight: 20 },
        ],
        spawnRate: 90,
        maxEnemies: 3,
        duration: 900,
      },
      7: {
        name: 'Zigzag Maze',
        description: 'Unpredictable movement patterns',
        enemyTypes: [
          { type: ZigzagEnemy, weight: 70 },
          { type: KamikazeEnemy, weight: 30 },
        ],
        spawnRate: 65,
        maxEnemies: 5,
        duration: 840,
      },
      8: {
        name: 'Kamikaze Storm',
        description: 'Overwhelming aggression',
        enemyTypes: [
          { type: KamikazeEnemy, weight: 60 },
          { type: ShooterEnemy, weight: 40 },
        ],
        spawnRate: 50,
        maxEnemies: 6,
        duration: 720,
      },
      9: {
        name: 'Elite Squadron',
        description: 'Advanced enemy formations',
        enemyTypes: [
          { type: ShooterEnemy, weight: 40 },
          { type: ZigzagEnemy, weight: 35 },
          { type: KamikazeEnemy, weight: 25 },
        ],
        spawnRate: 60,
        maxEnemies: 5,
        duration: 1080,
      },
      10: {
        name: 'Final Assault',
        description: "Everything they've got",
        enemyTypes: [
          { type: BasicEnemy, weight: 20 },
          { type: ShooterEnemy, weight: 30 },
          { type: ZigzagEnemy, weight: 25 },
          { type: KamikazeEnemy, weight: 25 },
        ],
        spawnRate: 45,
        maxEnemies: 7,
        duration: 1200,
      },
    };

    this.stageTimer = 0;
    this.stageDuration = 0;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;

    this.initializeStage();
  }

  initializeStage() {
    const config = this.getScaledStageConfig();
    this.stageDuration = config.duration;
    this.stageTimer = 0;
    this.enemiesSpawned = 0;
    this.enemiesKilled = 0;
    this.isStageComplete = false;
    this.isTransitioning = false;
    this.nextSpawnTime = config.spawnRate;

    this.enemies = [];

    this.starField.setStageTheme(this.currentStage, this.currentCycle);

    if (this.currentStage > 1 || this.currentCycle > 1) {
      this.starField.startWarpEffect();

      if (this.currentStage >= 7 || this.currentCycle > 2) {
        this.createMeteorShower();
      }
    }
  }

  getScaledStageConfig() {
    const baseConfig = this.stageConfigs[this.currentStage];
    const difficultyMultiplier = 1 + (this.currentCycle - 1) * 0.3;

    return {
      ...baseConfig,
      spawnRate: Math.max(
        20,
        Math.floor(baseConfig.spawnRate / difficultyMultiplier)
      ),
      maxEnemies: Math.floor(baseConfig.maxEnemies * difficultyMultiplier),
      duration: Math.floor(
        baseConfig.duration * (1 + (this.currentCycle - 1) * 0.2)
      ),
    };
  }

  update(playerPosition) {
    this.starField.update();

    if (playerPosition && this.enemies.length > 0) {
      this.starField.addTurbulence(0.1);
    }

    if (this.isTransitioning) {
      this.updateTransition();
      return;
    }

    this.stageTimer++;
    this.enemySpawnTimer++;

    this.updateEnemySpawning(playerPosition);

    this.updateEnemies(playerPosition);

    this.checkStageCompletion();
  }

  updateTransition() {
    this.transitionTimer++;
    if (this.transitionTimer >= this.transitionDuration) {
      this.transitionTimer = 0;
      this.isTransitioning = false;
      this.initializeStage();
    }
  }

  updateEnemySpawning(playerPosition) {
    const config = this.getScaledStageConfig();

    if (
      this.enemySpawnTimer >= this.nextSpawnTime &&
      this.enemies.length < config.maxEnemies &&
      this.stageTimer < config.duration
    ) {
      this.spawnEnemy();
      this.enemySpawnTimer = 0;

      const variation = config.spawnRate * 0.3;
      this.nextSpawnTime = config.spawnRate + (Math.random() - 0.5) * variation;
    }
  }

  spawnEnemy() {
    const config = this.getScaledStageConfig();
    const enemyType = this.selectRandomEnemyType(config.enemyTypes);

    const spawnX = Math.random() * (this.canvas.width - 100) + 50;
    const spawnY = -60;

    const enemy = new enemyType(this.ctx, this.canvas, spawnX, spawnY);
    this.enemies.push(enemy);
    this.enemiesSpawned++;
  }

  selectRandomEnemyType(enemyTypes) {
    const totalWeight = enemyTypes.reduce(
      (sum, enemy) => sum + enemy.weight,
      0
    );
    let random = Math.random() * totalWeight;

    for (const enemyType of enemyTypes) {
      random -= enemyType.weight;
      if (random <= 0) {
        return enemyType.type;
      }
    }

    return enemyTypes[0].type;
  }

  updateEnemies(playerPosition) {
    this.enemies.forEach((enemy) => {
      enemy.update(playerPosition);
    });

    const initialCount = this.enemies.length;
    this.enemies = this.enemies.filter((enemy) => {
      if (enemy.shouldBeRemoved()) {
        if (!enemy.isAlive) {
          this.enemiesKilled++;
        }
        return false;
      }
      return true;
    });
  }

  checkStageCompletion() {
    const config = this.getScaledStageConfig();

    if (this.stageTimer >= config.duration && this.enemies.length === 0) {
      this.completeStage();
    }
  }

  completeStage() {
    this.isStageComplete = true;
    this.isTransitioning = true;
    this.transitionTimer = 0;

    this.currentStage++;
    if (this.currentStage > this.totalStages) {
      this.currentStage = 1;
      this.currentCycle++;
    }
  }

  draw() {
    this.starField.draw(this.ctx);

    this.enemies.forEach((enemy) => {
      enemy.draw();
    });

    this.drawStageUI();

    if (this.isTransitioning) {
      this.drawTransition();
    }
  }

  drawStageUI() {
    const config = this.stageConfigs[this.currentStage];

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(
      `Stage ${this.currentStage}-${this.currentCycle}: ${config.name}`,
      20,
      30
    );

    const progressWidth = 200;
    const progressHeight = 10;
    const progressX = 20;
    const progressY = 45;

    const scaledConfig = this.getScaledStageConfig();
    const progress = Math.min(1, this.stageTimer / scaledConfig.duration);

    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(progressX, progressY, progressWidth, progressHeight);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(
      progressX,
      progressY,
      progressWidth * progress,
      progressHeight
    );

    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(progressX, progressY, progressWidth, progressHeight);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = '16px Arial';
    this.ctx.fillText(`Enemies: ${this.enemies.length}`, 20, 80);
    this.ctx.fillText(`Killed: ${this.enemiesKilled}`, 20, 100);
  }

  drawTransition() {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    this.ctx.fillStyle = '#ffffff';
    this.ctx.font = 'bold 48px Arial';
    this.ctx.textAlign = 'center';

    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    if (this.currentStage === 1 && this.currentCycle > 1) {
      this.ctx.fillText(
        `CYCLE ${this.currentCycle} COMPLETE!`,
        centerX,
        centerY - 40
      );
      this.ctx.font = '24px Arial';
      this.ctx.fillText('Difficulty Increased!', centerX, centerY + 20);
    } else {
      this.ctx.fillText('STAGE COMPLETE!', centerX, centerY - 40);
      const config = this.stageConfigs[this.currentStage];
      this.ctx.font = '24px Arial';
      this.ctx.fillText(`Next: ${config.name}`, centerX, centerY + 20);
    }

    const transitionProgress = this.transitionTimer / this.transitionDuration;
    const barWidth = 300;
    const barHeight = 8;
    const barX = centerX - barWidth / 2;
    const barY = centerY + 60;

    this.ctx.fillStyle = '#333333';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    this.ctx.fillStyle = '#00ff00';
    this.ctx.fillRect(barX, barY, barWidth * transitionProgress, barHeight);
  }

  getCurrentStage() {
    return this.currentStage;
  }

  getCurrentCycle() {
    return this.currentCycle;
  }

  getEnemies() {
    return this.enemies;
  }

  getStageInfo() {
    const config = this.stageConfigs[this.currentStage];
    return {
      stage: this.currentStage,
      cycle: this.currentCycle,
      name: config.name,
      description: config.description,
      progress: this.stageTimer / this.getScaledStageConfig().duration,
      enemiesAlive: this.enemies.length,
      enemiesKilled: this.enemiesKilled,
    };
  }

  forceNextStage() {
    this.enemies = [];
    this.completeStage();
  }

  createMeteorShower() {
    const meteorCount = Math.random() * 3 + 2;

    for (let i = 0; i < meteorCount; i++) {
      setTimeout(() => {
        this.starField.createMeteor();
      }, i * 500 + Math.random() * 1000);
    }
  }

  getStarField() {
    return this.starField;
  }

  resize(newWidth, newHeight) {
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    this.starField.resize(newWidth, newHeight);
  }
}
