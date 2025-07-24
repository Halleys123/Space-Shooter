class PerformanceManager {
  constructor() {
    this.performanceLevel = 'auto';
    this.originalPerformanceLevel = 'auto';
    this.settings = {
      starCount: 150,
      particleQuality: 'high',
      enableGlow: true,
      enableFilters: true,
      frameSkipping: false,
      maxParticles: {
        thrust: 200,
        collision: 100,
        blast: 500,
      },
    };

    // FPS monitoring
    this.frameCount = 0;
    this.lastFpsTime = performance.now();
    this.currentFps = 60;
    this.fpsHistory = [];
    this.fpsHistorySize = 10;
    this.lowFpsThreshold = 30;
    this.recoveryFpsThreshold = 45;
    this.isInEmergencyMode = false;
    this.emergencyModeTimer = 0;
    this.emergencyModeDuration = 5000; // 5 seconds
    this.fpsCheckInterval = 1000; // Check FPS every second
    this.userManuallyChangedSettings = false; // Track if user changed settings manually

    this.detectPerformance();
  }

  detectPerformance() {
    const cpuCores = navigator.hardwareConcurrency || 4;
    const screenResolution = screen.width * screen.height;
    const memory = navigator.deviceMemory || 4; // GB

    // Detect if likely mobile/low-end device
    const isMobile =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      );
    const isLowResolution = screenResolution < 1920 * 1080;
    const isLowEndCPU = cpuCores <= 4;
    const isLowMemory = memory <= 4;

    if (isMobile || (isLowEndCPU && isLowMemory) || isLowResolution) {
      this.performanceLevel = 'low';
      this.originalPerformanceLevel = 'low';
      this.applyLowEndSettings();
    } else if (cpuCores <= 6 || memory <= 8) {
      this.performanceLevel = 'medium';
      this.originalPerformanceLevel = 'medium';
      this.applyMediumSettings();
    } else {
      this.performanceLevel = 'high';
      this.originalPerformanceLevel = 'high';
      this.applyHighEndSettings();
    }

    console.log(`Performance level detected: ${this.performanceLevel}`);
    console.log(
      `CPU cores: ${cpuCores}, Memory: ${memory}GB, Resolution: ${screen.width}x${screen.height}`
    );
  }

  applyLowEndSettings() {
    this.settings = {
      starCount: 50,
      particleQuality: 'low',
      enableGlow: false,
      enableFilters: false,
      frameSkipping: true,
      maxParticles: {
        thrust: 50,
        collision: 30,
        blast: 150,
      },
    };
  }

  applyMediumSettings() {
    this.settings = {
      starCount: 100,
      particleQuality: 'medium',
      enableGlow: true,
      enableFilters: true,
      frameSkipping: false,
      maxParticles: {
        thrust: 100,
        collision: 60,
        blast: 300,
      },
    };
  }

  applyHighEndSettings() {
    this.settings = {
      starCount: 150,
      particleQuality: 'high',
      enableGlow: true,
      enableFilters: true,
      frameSkipping: false,
      maxParticles: {
        thrust: 200,
        collision: 100,
        blast: 500,
      },
    };
  }

  getSettings() {
    return this.settings;
  }

  setPerformanceLevel(level) {
    // Mark that user manually changed settings
    this.userManuallyChangedSettings = true;

    // If user manually changes settings while in emergency mode, exit emergency mode
    if (this.isInEmergencyMode) {
      console.log(
        'User manually changed graphics settings, exiting emergency mode'
      );
      this.isInEmergencyMode = false;
      this.notifyEmergencyMode(false);
    }

    this.performanceLevel = level;

    switch (level) {
      case 'low':
        this.applyLowEndSettings();
        break;
      case 'medium':
        this.applyMediumSettings();
        break;
      case 'high':
        this.applyHighEndSettings();
        break;
    }
  }

  shouldSkipFrame() {
    if (!this.settings.frameSkipping) return false;
    return performance.now() % 2 === 0;
  }

  // FPS Monitoring Methods
  updateFPS() {
    this.frameCount++;
    const currentTime = performance.now();

    if (currentTime - this.lastFpsTime >= this.fpsCheckInterval) {
      this.currentFps =
        (this.frameCount * 1000) / (currentTime - this.lastFpsTime);
      this.frameCount = 0;
      this.lastFpsTime = currentTime;

      // Add to history
      this.fpsHistory.push(this.currentFps);
      if (this.fpsHistory.length > this.fpsHistorySize) {
        this.fpsHistory.shift();
      }

      this.checkPerformanceAdjustment();
    }
  }

  checkPerformanceAdjustment() {
    if (this.fpsHistory.length < 3) return; // Need at least 3 samples

    const averageFps =
      this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
      this.fpsHistory.length;
    const currentTime = performance.now();

    // Check if FPS drops below threshold
    if (averageFps < this.lowFpsThreshold && !this.isInEmergencyMode) {
      console.warn(
        `FPS dropped to ${averageFps.toFixed(
          1
        )}, enabling emergency low settings`
      );
      this.enableEmergencyMode();
    }
    // DON'T automatically recover from emergency mode - let user decide
    // Emergency mode will only be disabled when user manually changes settings
  }

  enableEmergencyMode() {
    if (this.isInEmergencyMode) return;

    this.isInEmergencyMode = true;
    this.emergencyModeTimer = performance.now();
    this.userManuallyChangedSettings = false; // Reset manual change flag

    // Force ultra-low settings for maximum performance
    this.settings = {
      starCount: 25,
      particleQuality: 'low',
      enableGlow: false,
      enableFilters: false,
      frameSkipping: true,
      maxParticles: {
        thrust: 25,
        collision: 15,
        blast: 75,
      },
    };

    // Notify other systems about the emergency mode
    this.notifyEmergencyMode(true);
  }

  disableEmergencyMode() {
    if (!this.isInEmergencyMode) return;

    this.isInEmergencyMode = false;

    // Restore original performance level settings
    this.setPerformanceLevel(this.originalPerformanceLevel);

    // Notify other systems that emergency mode is over
    this.notifyEmergencyMode(false);
  }

  notifyEmergencyMode(isEmergency) {
    // Dispatch custom event for other systems to listen to
    const event = new CustomEvent('performanceEmergency', {
      detail: {
        isEmergency: isEmergency,
        fps: this.currentFps,
        settings: this.settings,
      },
    });
    window.dispatchEvent(event);
  }

  getCurrentFPS() {
    return this.currentFps;
  }

  getAverageFPS() {
    if (this.fpsHistory.length === 0) return this.currentFps;
    return (
      this.fpsHistory.reduce((sum, fps) => sum + fps, 0) /
      this.fpsHistory.length
    );
  }

  isInEmergencyPerformanceMode() {
    return this.isInEmergencyMode;
  }
}

// Global performance manager instance
window.performanceManager = new PerformanceManager();
