// Performance detection and configuration system
class PerformanceManager {
  constructor() {
    this.performanceLevel = 'auto';
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
      this.applyLowEndSettings();
    } else if (cpuCores <= 6 || memory <= 8) {
      this.performanceLevel = 'medium';
      this.applyMediumSettings();
    } else {
      this.performanceLevel = 'high';
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
}

// Global performance manager instance
window.performanceManager = new PerformanceManager();
