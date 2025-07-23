class CollisionShape {
  constructor(type, x, y, width, height, radius = null) {
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.radius = radius;
  }

  updatePosition(x, y) {
    this.x = x;
    this.y = y;
  }

  getCenter() {
    if (this.type === 'circle') {
      return { x: this.x, y: this.y };
    }
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  drawDebug(ctx, color = 'red') {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.5;

    if (this.type === 'circle') {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(this.x, this.y, this.width, this.height);
    }

    ctx.restore();
  }
}

class CollisionComponent {
  constructor(
    gameObject,
    shape,
    layer = 'default',
    canDamage = true,
    canReceiveDamage = true
  ) {
    this.gameObject = gameObject;
    this.shape = shape;
    this.layer = layer;
    this.canDamage = canDamage;
    this.canReceiveDamage = canReceiveDamage;
    this.isActive = true;
    this.damageAmount = 0;
    this.lastCollisionTime = 0;
    this.collisionCooldown = 30;

    this.onCollisionEnter = null;
    this.onCollisionStay = null;
    this.onCollisionExit = null;
    this.onDamageDealt = null;
    this.onDamageReceived = null;
  }

  setDamage(amount) {
    this.damageAmount = amount;
    return this;
  }

  setCallbacks(callbacks) {
    if (callbacks.onCollisionEnter)
      this.onCollisionEnter = callbacks.onCollisionEnter;
    if (callbacks.onCollisionStay)
      this.onCollisionStay = callbacks.onCollisionStay;
    if (callbacks.onCollisionExit)
      this.onCollisionExit = callbacks.onCollisionExit;
    if (callbacks.onDamageDealt) this.onDamageDealt = callbacks.onDamageDealt;
    if (callbacks.onDamageReceived)
      this.onDamageReceived = callbacks.onDamageReceived;
    return this;
  }

  updatePosition() {
    if (this.gameObject.position) {
      this.shape.updatePosition(
        this.gameObject.position.x,
        this.gameObject.position.y
      );
    } else if (this.gameObject.control && this.gameObject.control.position) {
      this.shape.updatePosition(
        this.gameObject.control.position.x,
        this.gameObject.control.position.y
      );
    }
  }

  canCollide() {
    return (
      this.isActive &&
      Date.now() - this.lastCollisionTime > this.collisionCooldown * 16.67
    );
  }

  triggerCollision(other, collisionData) {
    this.lastCollisionTime = Date.now();

    if (this.onCollisionEnter) {
      this.onCollisionEnter(other, collisionData);
    }
  }

  dealDamage(other) {
    if (!this.canDamage || this.damageAmount <= 0) return false;

    if (other.canReceiveDamage && other.gameObject.takeDamage) {
      other.gameObject.takeDamage(this.damageAmount);

      if (this.onDamageDealt) {
        this.onDamageDealt(other, this.damageAmount);
      }

      if (other.onDamageReceived) {
        other.onDamageReceived(this, this.damageAmount);
      }

      return true;
    }

    return false;
  }
}

class CollisionManager {
  constructor(blastManager = null) {
    this.collisionComponents = [];
    this.collisionPairs = new Map();
    this.debugMode = false;
    this.blastManager = blastManager;

    this.collisionMatrix = {
      player: ['enemy', 'enemyBullet', 'powerup', 'obstacle'],
      enemy: ['player', 'playerBullet', 'obstacle'],
      playerBullet: ['enemy', 'obstacle'],
      enemyBullet: ['player', 'obstacle'],
      powerup: ['player'],
      obstacle: ['player', 'enemy', 'playerBullet', 'enemyBullet'],
    };
  }

  addComponent(component) {
    this.collisionComponents.push(component);
    return component;
  }

  removeComponent(component) {
    const index = this.collisionComponents.indexOf(component);
    if (index > -1) {
      this.collisionComponents.splice(index, 1);
    }
  }

  cleanup() {
    this.collisionComponents = this.collisionComponents.filter((component) => {
      if (
        component.gameObject.markedForRemoval ||
        (component.gameObject.isAlive !== undefined &&
          !component.gameObject.isAlive) ||
        (component.gameObject.shouldBeRemoved &&
          component.gameObject.shouldBeRemoved())
      ) {
        return false;
      }
      return component.isActive;
    });
  }

  canLayersCollide(layer1, layer2) {
    return (
      this.collisionMatrix[layer1] &&
      this.collisionMatrix[layer1].includes(layer2)
    );
  }

  checkCircleCircle(shape1, shape2) {
    const dx = shape1.x - shape2.x;
    const dy = shape1.y - shape2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const minDistance = shape1.radius + shape2.radius;

    if (distance < minDistance) {
      return {
        collision: true,
        overlap: minDistance - distance,
        normal: { x: dx / distance, y: dy / distance },
        point: {
          x: shape1.x - (dx / distance) * shape1.radius,
          y: shape1.y - (dy / distance) * shape1.radius,
        },
      };
    }

    return { collision: false };
  }

  checkRectRect(shape1, shape2) {
    const overlap = !(
      shape1.x > shape2.x + shape2.width ||
      shape1.x + shape1.width < shape2.x ||
      shape1.y > shape2.y + shape2.height ||
      shape1.y + shape1.height < shape2.y
    );

    if (overlap) {
      const overlapX = Math.min(
        shape1.x + shape1.width - shape2.x,
        shape2.x + shape2.width - shape1.x
      );
      const overlapY = Math.min(
        shape1.y + shape1.height - shape2.y,
        shape2.y + shape2.height - shape1.y
      );

      return {
        collision: true,
        overlap: Math.min(overlapX, overlapY),
        normal:
          overlapX < overlapY
            ? { x: shape1.x < shape2.x ? -1 : 1, y: 0 }
            : { x: 0, y: shape1.y < shape2.y ? -1 : 1 },
        point: {
          x:
            Math.max(shape1.x, shape2.x) +
            Math.min(shape1.width, shape2.width) / 2,
          y:
            Math.max(shape1.y, shape2.y) +
            Math.min(shape1.height, shape2.height) / 2,
        },
      };
    }

    return { collision: false };
  }

  checkCircleRect(circle, rect) {
    const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
    const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));

    const dx = circle.x - closestX;
    const dy = circle.y - closestY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (distance < circle.radius) {
      const normal =
        distance > 0 ? { x: dx / distance, y: dy / distance } : { x: 1, y: 0 };

      return {
        collision: true,
        overlap: circle.radius - distance,
        normal: normal,
        point: { x: closestX, y: closestY },
      };
    }

    return { collision: false };
  }

  checkCollision(comp1, comp2) {
    const shape1 = comp1.shape;
    const shape2 = comp2.shape;

    if (shape1.type === 'circle' && shape2.type === 'circle') {
      return this.checkCircleCircle(shape1, shape2);
    } else if (shape1.type === 'rectangle' && shape2.type === 'rectangle') {
      return this.checkRectRect(shape1, shape2);
    } else if (shape1.type === 'circle' && shape2.type === 'rectangle') {
      return this.checkCircleRect(shape1, shape2);
    } else if (shape1.type === 'rectangle' && shape2.type === 'circle') {
      const result = this.checkCircleRect(shape2, shape1);
      if (result.collision) {
        result.normal.x *= -1;
        result.normal.y *= -1;
      }
      return result;
    }

    return { collision: false };
  }

  update() {
    this.collisionComponents.forEach((comp) => comp.updatePosition());

    for (let i = 0; i < this.collisionComponents.length; i++) {
      const comp1 = this.collisionComponents[i];
      if (!comp1.isActive || !comp1.canCollide()) continue;

      for (let j = i + 1; j < this.collisionComponents.length; j++) {
        const comp2 = this.collisionComponents[j];
        if (!comp2.isActive || !comp2.canCollide()) continue;

        if (
          !this.canLayersCollide(comp1.layer, comp2.layer) &&
          !this.canLayersCollide(comp2.layer, comp1.layer)
        ) {
          continue;
        }

        const collisionResult = this.checkCollision(comp1, comp2);

        if (collisionResult.collision) {
          this.handleCollision(comp1, comp2, collisionResult);
        }
      }
    }

    this.cleanup();
  }

  handleCollision(comp1, comp2, collisionData) {
    comp1.triggerCollision(comp2, collisionData);
    comp2.triggerCollision(comp1, collisionData);

    const damage1Dealt = comp1.dealDamage(comp2);
    const damage2Dealt = comp2.dealDamage(comp1);

    if (this.blastManager && (damage1Dealt || damage2Dealt)) {
      let explosionType = 'normal';
      let explosionSize = 0.8;

      if (comp1.layer === 'enemy' || comp2.layer === 'enemy') {
        const enemy =
          comp1.layer === 'enemy' ? comp1.gameObject : comp2.gameObject;
        if (enemy.constructor.name === 'KamikazeEnemy') {
          explosionType = 'large';
          explosionSize = 1.2;
        } else if (enemy.constructor.name === 'BasicEnemy') {
          explosionSize = 0.6;
        }
      }

      if (
        comp1.layer === 'playerBullet' ||
        comp2.layer === 'playerBullet' ||
        comp1.layer === 'enemyBullet' ||
        comp2.layer === 'enemyBullet'
      ) {
        explosionSize = 0.4;
        explosionType = 'small';
      }

      this.blastManager.createExplosion(
        collisionData.point.x,
        collisionData.point.y,
        explosionType,
        explosionSize
      );
    }

    if (comp1.gameObject.getHealth && comp1.gameObject.getHealth() <= 0) {
      this.handleObjectDestruction(comp1);
    }

    if (comp2.gameObject.getHealth && comp2.gameObject.getHealth() <= 0) {
      this.handleObjectDestruction(comp2);
    }
  }

  handleObjectDestruction(component) {
    if (component.layer === 'enemy' && this.blastManager) {
      const enemy = component.gameObject;
      const center = component.shape.getCenter();

      this.blastManager.createEnemyExplosion(
        center.x,
        center.y,
        enemy.constructor.name.replace('Enemy', '').toLowerCase()
      );
    }

    if (component.gameObject.markedForRemoval !== undefined) {
      component.gameObject.markedForRemoval = true;
    }
    if (component.gameObject.isAlive !== undefined) {
      component.gameObject.isAlive = false;
    }
  }

  setDebugMode(enabled) {
    this.debugMode = enabled;
  }

  drawDebug(ctx) {
    if (!this.debugMode) return;

    this.collisionComponents.forEach((comp) => {
      if (comp.isActive) {
        let color = 'lime';
        switch (comp.layer) {
          case 'player':
            color = 'blue';
            break;
          case 'enemy':
            color = 'red';
            break;
          case 'playerBullet':
            color = 'cyan';
            break;
          case 'enemyBullet':
            color = 'orange';
            break;
          case 'powerup':
            color = 'yellow';
            break;
          case 'obstacle':
            color = 'gray';
            break;
        }
        comp.shape.drawDebug(ctx, color);
      }
    });

    ctx.fillStyle = 'white';
    ctx.font = '14px Arial';
    ctx.fillText(
      `Collision Components: ${this.collisionComponents.length}`,
      10,
      30
    );
    ctx.fillText(`Debug Mode: ON (Press X to toggle)`, 10, 50);
  }

  static createForGameObject(gameObject, layer, options = {}) {
    let shape;

    if (options.radius) {
      const center = gameObject.position ||
        gameObject.control?.position || { x: 0, y: 0 };
      shape = new CollisionShape(
        'circle',
        center.x,
        center.y,
        0,
        0,
        options.radius
      );
    } else {
      const pos = gameObject.position ||
        gameObject.control?.position || { x: 0, y: 0 };
      const width =
        gameObject.width || gameObject.visuals?.width || options.width || 32;
      const height =
        gameObject.height || gameObject.visuals?.height || options.height || 32;
      shape = new CollisionShape('rectangle', pos.x, pos.y, width, height);
    }

    const component = new CollisionComponent(
      gameObject,
      shape,
      layer,
      options.canDamage !== false,
      options.canReceiveDamage !== false
    );

    if (options.damage) {
      component.setDamage(options.damage);
    }

    if (options.callbacks) {
      component.setCallbacks(options.callbacks);
    }

    return component;
  }
}
