class SpritePreloader {
  constructor() {
    this.sprites = new Map();
    this.loadedCount = 0;
    this.totalCount = 0;
    this.isLoading = false;
    this.loadPromise = null;
    
    // Define all sprites used in the game
    this.spriteList = [
      // Player sprites
      { key: 'player', path: './assets/sprites/player.png' },
      { key: 'player_shield', path: './assets/sprites/player_shield.png' },
      { key: 'player_thrust', path: './assets/sprites/player_thrust.png' },
      
      // Enemy sprites
      { key: 'enemy_basic', path: './assets/sprites/enemy_basic.png' },
      { key: 'enemy_shooter', path: './assets/sprites/enemy_shooter.png' },
      { key: 'enemy_zigzag', path: './assets/sprites/enemy_zigzag.png' },
      { key: 'enemy_kamikaze', path: './assets/sprites/enemy_kamikaze.png' },
      { key: 'boss', path: './assets/sprites/boss.png' },
      
      // Bullet sprites
      { key: 'bullet_player', path: './assets/sprites/bullet_player.png' },
      { key: 'bullet_enemy', path: './assets/sprites/bullet_enemy.png' },
      
      // Powerup sprites
      { key: 'firerate_powerup', path: './assets/power-ups/firerate_powerup.png' },
      { key: 'health_powerup', path: './assets/power-ups/health_powerup.png' },
      { key: 'shield_powerup', path: './assets/power-ups/shield_powerup.png' },
      
      // Explosion sprites
      { key: 'explosion_1', path: './assets/sprites/explosion_sprite_1.png' },
      { key: 'explosion_2', path: './assets/sprites/explosion_sprite_2.png' },
      { key: 'explosion_3', path: './assets/sprites/explosion_sprite_3.png' },
      { key: 'explosion_4', path: './assets/sprites/explosion_sprite_4.png' },
      
      // UI sprites
      { key: 'health_bar_frame', path: './assets/ui/health_bar_frame.png' },
      { key: 'life_icon', path: './assets/ui/life_icon.png' },
      { key: 'score_background', path: './assets/sprites/score_background.png' }
    ];
  }

  async preloadAllSprites() {
    if (this.isLoading) {
      return this.loadPromise;
    }

    this.isLoading = true;
    this.loadedCount = 0;
    this.totalCount = this.spriteList.length;

    console.log(`Starting to preload ${this.totalCount} sprites...`);

    // Show loading indicator
    const loadingIndicator = document.getElementById('sprite-loading');
    if (loadingIndicator) {
      loadingIndicator.classList.remove('hidden');
    }

    this.loadPromise = new Promise((resolve, reject) => {
      let loadedSprites = 0;
      let failedSprites = 0;
      const results = [];

      // Show loading progress
      this.updateLoadingProgress(0);

      this.spriteList.forEach((spriteInfo, index) => {
        const img = new Image();
        
        img.onload = () => {
          this.sprites.set(spriteInfo.key, img);
          loadedSprites++;
          this.loadedCount = loadedSprites;
          
          results[index] = { success: true, key: spriteInfo.key };
          this.updateLoadingProgress((loadedSprites + failedSprites) / this.totalCount);
          
          if (loadedSprites + failedSprites === this.totalCount) {
            this.isLoading = false;
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('sprite-loading');
            if (loadingIndicator) {
              loadingIndicator.classList.add('hidden');
            }
            
            console.log(`Sprite preloading complete: ${loadedSprites} loaded, ${failedSprites} failed`);
            if (failedSprites > 0) {
              console.warn('Some sprites failed to load, fallbacks will be used');
            }
            resolve(results);
          }
        };

        img.onerror = () => {
          failedSprites++;
          console.error(`Failed to preload sprite: ${spriteInfo.path}`);
          results[index] = { success: false, key: spriteInfo.key, path: spriteInfo.path };
          this.updateLoadingProgress((loadedSprites + failedSprites) / this.totalCount);
          
          if (loadedSprites + failedSprites === this.totalCount) {
            this.isLoading = false;
            
            // Hide loading indicator
            const loadingIndicator = document.getElementById('sprite-loading');
            if (loadingIndicator) {
              loadingIndicator.classList.add('hidden');
            }
            
            console.log(`Sprite preloading complete: ${loadedSprites} loaded, ${failedSprites} failed`);
            if (failedSprites > 0) {
              console.warn('Some sprites failed to load, fallbacks will be used');
            }
            resolve(results);
          }
        };

        // Set a timeout for each sprite loading
        setTimeout(() => {
          img.src = spriteInfo.path;
        }, index * 10); // Stagger loading slightly to prevent overwhelming the browser
      });
    });

    return this.loadPromise;
  }

  updateLoadingProgress(progress) {
    const percentage = Math.round(progress * 100);
    console.log(`Sprite loading progress: ${percentage}% (${this.loadedCount}/${this.totalCount})`);
    
    // Update any loading screen UI if it exists
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
      loadingText.textContent = `Loading sprites... ${percentage}%`;
    }
  }

  getSprite(key) {
    return this.sprites.get(key);
  }

  hasSprite(key) {
    return this.sprites.has(key);
  }

  // Create a clone of a preloaded sprite
  cloneSprite(key) {
    const original = this.sprites.get(key);
    if (!original) return null;
    
    const clone = new Image();
    clone.src = original.src;
    return clone;
  }

  // Get sprite source path for dynamic loading
  getSpritePath(key) {
    const spriteInfo = this.spriteList.find(sprite => sprite.key === key);
    return spriteInfo ? spriteInfo.path : null;
  }

  isLoaded() {
    return !this.isLoading && this.sprites.size > 0;
  }

  getLoadingProgress() {
    return this.totalCount > 0 ? this.loadedCount / this.totalCount : 0;
  }

  // Diagnostic function to check sprite status
  diagnoseSprites() {
    console.log('\n=== SPRITE DIAGNOSTIC REPORT ===');
    console.log(`Total sprites in preloader: ${this.sprites.size}`);
    console.log(`Loading status: ${this.isLoading ? 'Loading' : 'Complete'}`);
    console.log(`Progress: ${this.loadedCount}/${this.totalCount} (${Math.round(this.getLoadingProgress() * 100)}%)`);
    
    console.log('\nLoaded sprites:');
    this.sprites.forEach((sprite, key) => {
      console.log(`  ✓ ${key}: ${sprite.complete ? 'Complete' : 'Loading...'} (${sprite.src})`);
    });
    
    console.log('\nMissing sprites:');
    this.spriteList.forEach(spriteInfo => {
      if (!this.sprites.has(spriteInfo.key)) {
        console.log(`  ✗ ${spriteInfo.key}: Not loaded (${spriteInfo.path})`);
      }
    });
    console.log('=== END DIAGNOSTIC REPORT ===\n');
  }

  // Function to manually reload failed sprites
  async reloadFailedSprites() {
    const failedSprites = this.spriteList.filter(spriteInfo => 
      !this.sprites.has(spriteInfo.key)
    );
    
    if (failedSprites.length === 0) {
      console.log('No failed sprites to reload');
      return;
    }
    
    console.log(`Attempting to reload ${failedSprites.length} failed sprites...`);
    
    for (const spriteInfo of failedSprites) {
      try {
        const img = new Image();
        await new Promise((resolve, reject) => {
          img.onload = () => {
            this.sprites.set(spriteInfo.key, img);
            console.log(`Successfully reloaded: ${spriteInfo.key}`);
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to reload: ${spriteInfo.key}`);
            reject();
          };
          img.src = spriteInfo.path;
        });
      } catch (error) {
        console.error(`Error reloading ${spriteInfo.key}:`, error);
      }
    }
  }
}

// Global sprite preloader instance
window.spritePreloader = new SpritePreloader();

// Preload sprites when the page loads
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Starting sprite preloading...');
  try {
    await window.spritePreloader.preloadAllSprites();
    console.log('All sprites preloaded successfully!');
  } catch (error) {
    console.error('Error during sprite preloading:', error);
  }
});
