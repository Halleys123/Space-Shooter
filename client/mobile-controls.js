// Mobile Controls Manager
class MobileControlsManager {
  constructor() {
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // Force enable for testing (remove this later)
    this.isTouch = true;
    console.log(
      'Mobile controls initialized. Touch device detected:',
      this.isTouch
    );
    this.controls = {
      movement: { x: 0, y: 0, active: false },
      rotation: { value: 0, active: false },
      fire: false,
    };

    this.joystickBounds = { radius: 30 }; // Half of stick movement area (reduced from 35)
    this.rotationBounds = { width: 120 }; // Half of rotation slider width (reduced from 150)

    this.init();
  }

  init() {
    console.log('Initializing mobile controls, isTouch:', this.isTouch);
    if (!this.isTouch) return;

    this.setupMovementJoystick();
    this.setupRotationControl();
    this.setupFireButton();
    this.setupOrientationCheck();
    console.log('Mobile controls setup complete');
  }

  setupMovementJoystick() {
    const container = document.getElementById('movement-joystick');
    const stick = document.getElementById('movement-stick');

    console.log('Setting up movement joystick:', { container, stick });
    if (!container || !stick) {
      console.error('Movement joystick elements not found!');
      return;
    }

    let isDragging = false;
    let startPos = { x: 0, y: 0 };
    let centerPos = { x: 0, y: 0 };

    const updateCenterPos = () => {
      const rect = container.getBoundingClientRect();
      centerPos.x = rect.left + rect.width / 2;
      centerPos.y = rect.top + rect.height / 2;
    };

    const handleStart = (e) => {
      e.preventDefault();
      console.log('Joystick touch start');
      isDragging = true;
      updateCenterPos();

      const touch = e.touches ? e.touches[0] : e;
      startPos.x = touch.clientX;
      startPos.y = touch.clientY;

      this.controls.movement.active = true;
      container.style.opacity = '1';
    };

    const handleMove = (e) => {
      if (!isDragging) return;
      e.preventDefault();

      const touch = e.touches ? e.touches[0] : e;
      const deltaX = touch.clientX - centerPos.x;
      const deltaY = touch.clientY - centerPos.y;

      // Constrain to joystick bounds
      const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const maxDistance = this.joystickBounds.radius;

      let constrainedX = deltaX;
      let constrainedY = deltaY;

      if (distance > maxDistance) {
        constrainedX = (deltaX / distance) * maxDistance;
        constrainedY = (deltaY / distance) * maxDistance;
      }

      // Update stick position
      stick.style.transform = `translate(calc(-50% + ${constrainedX}px), calc(-50% + ${constrainedY}px))`;

      // Normalize to -1 to 1 range
      this.controls.movement.x = constrainedX / maxDistance;
      this.controls.movement.y = constrainedY / maxDistance;
    };

    const handleEnd = (e) => {
      e.preventDefault();
      isDragging = false;

      // Return stick to center
      stick.style.transform = 'translate(-50%, -50%)';

      // Reset movement values
      this.controls.movement.x = 0;
      this.controls.movement.y = 0;
      this.controls.movement.active = false;
      container.style.opacity = '0.7';
    };

    // Touch events
    container.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd, { passive: false });

    // Mouse events for testing
    container.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Initial opacity
    container.style.opacity = '0.7';
  }

  setupRotationControl() {
    const container = document.getElementById('rotation-control');
    const knob = document.getElementById('rotation-knob');
    const slider = document.getElementById('rotation-slider');

    if (!container || !knob || !slider) return;

    let isDragging = false;
    let sliderRect = null;

    const updateSliderRect = () => {
      sliderRect = slider.getBoundingClientRect();
    };

    const handleStart = (e) => {
      e.preventDefault();
      isDragging = true;
      updateSliderRect();

      this.controls.rotation.active = true;
      container.style.opacity = '1';
    };

    const handleMove = (e) => {
      if (!isDragging || !sliderRect) return;
      e.preventDefault();

      const touch = e.touches ? e.touches[0] : e;
      const relativeX = touch.clientX - sliderRect.left;
      const constrainedX = Math.max(0, Math.min(sliderRect.width, relativeX));

      // Update knob position
      const percentage = constrainedX / sliderRect.width;
      knob.style.left = `${percentage * 100}%`;

      // Convert to rotation value (-1 to 1, where 0 is center)
      this.controls.rotation.value = (percentage - 0.5) * 2;
    };

    const handleEnd = (e) => {
      e.preventDefault();
      isDragging = false;

      // Return knob to center
      knob.style.left = '50%';

      // Reset rotation value
      this.controls.rotation.value = 0;
      this.controls.rotation.active = false;
      container.style.opacity = '0.7';
    };

    // Touch events
    container.addEventListener('touchstart', handleStart, { passive: false });
    document.addEventListener('touchmove', handleMove, { passive: false });
    document.addEventListener('touchend', handleEnd, { passive: false });

    // Mouse events for testing
    container.addEventListener('mousedown', handleStart);
    document.addEventListener('mousemove', handleMove);
    document.addEventListener('mouseup', handleEnd);

    // Initial opacity
    container.style.opacity = '0.7';
  }

  setupFireButton() {
    const fireButton = document.getElementById('fire-button');

    console.log('Setting up fire button:', fireButton);
    if (!fireButton) {
      console.error('Fire button element not found!');
      return;
    }

    const handleStart = (e) => {
      e.preventDefault();
      console.log('Fire button pressed');
      this.controls.fire = true;
      fireButton.style.transform = 'scale(0.95)';
    };

    const handleEnd = (e) => {
      e.preventDefault();
      console.log('Fire button released');
      this.controls.fire = false;
      fireButton.style.transform = 'scale(1)';
    };

    // Touch events
    fireButton.addEventListener('touchstart', handleStart, { passive: false });
    fireButton.addEventListener('touchend', handleEnd, { passive: false });

    // Mouse events for testing
    fireButton.addEventListener('mousedown', handleStart);
    fireButton.addEventListener('mouseup', handleEnd);
  }

  setupOrientationCheck() {
    const checkOrientation = () => {
      const isPortrait = window.innerHeight > window.innerWidth;
      const isMobile = window.innerWidth <= 768;
      const landscapePrompt = document.getElementById('landscape-prompt');

      if (this.isTouch && isPortrait && isMobile && landscapePrompt) {
        landscapePrompt.style.display = 'flex';
      } else if (landscapePrompt) {
        landscapePrompt.style.display = 'none';
      }
    };

    // Check on load
    checkOrientation();

    // Check on orientation change
    window.addEventListener('orientationchange', () => {
      setTimeout(checkOrientation, 100);
    });

    // Check on resize
    window.addEventListener('resize', checkOrientation);
  }

  // Public methods to get control states
  getMovement() {
    return {
      x: this.controls.movement.x,
      y: this.controls.movement.y,
      active: this.controls.movement.active,
    };
  }

  getRotation() {
    return {
      value: this.controls.rotation.value,
      active: this.controls.rotation.active,
    };
  }

  getFire() {
    return this.controls.fire;
  }

  // Method to show/hide mobile controls based on game state
  setGameStarted(started) {
    const mobileControls = document.getElementById('mobile-controls');
    const fireButton = document.getElementById('fire-button');

    if (!mobileControls) return;

    if (started) {
      mobileControls.classList.add('game-started');
      if (fireButton) fireButton.classList.add('game-started');
    } else {
      mobileControls.classList.remove('game-started');
      if (fireButton) fireButton.classList.remove('game-started');
    }
  }

  // Method to check if mobile controls are being used
  isUsingMobileControls() {
    return (
      this.isTouch &&
      (this.controls.movement.active ||
        this.controls.rotation.active ||
        this.controls.fire)
    );
  }

  // Method to get mobile mouse position for rotation
  getMobileMouse(canvas) {
    if (!this.controls.rotation.active || !canvas) {
      return null; // Return null if not using mobile rotation
    }

    // Calculate virtual mouse position based on rotation control
    const playerCenter = {
      x: canvas.width / 2,
      y: canvas.height / 2,
    };

    // Convert rotation value (-1 to 1) to angle
    const angle = this.controls.rotation.value * Math.PI; // ±180 degrees
    const distance = 100; // Fixed distance from player

    // Calculate mouse position in front of player based on rotation
    const mouseX = playerCenter.x + Math.sin(angle) * distance;
    const mouseY = playerCenter.y - Math.cos(angle) * distance;

    return { x: mouseX, y: mouseY };
  }

  // Method to simulate keyboard input for compatibility
  getMobileKeys() {
    const keys = {};

    console.log('Getting mobile keys. Controls state:', {
      movement: this.controls.movement,
      rotation: this.controls.rotation,
      fire: this.controls.fire,
    });

    if (this.controls.movement.active) {
      // Convert joystick to WASD
      if (this.controls.movement.y < -0.3) keys['w'] = true; // Forward
      if (this.controls.movement.y > 0.3) keys['s'] = true; // Backward
      if (this.controls.movement.x < -0.3) keys['a'] = true; // Left strafe
      if (this.controls.movement.x > 0.3) keys['d'] = true; // Right strafe
    }

    if (this.controls.rotation.active) {
      // Convert rotation slider to arrow keys
      if (this.controls.rotation.value < -0.2) keys['ArrowLeft'] = true;
      if (this.controls.rotation.value > 0.2) keys['ArrowRight'] = true;
    }

    if (this.controls.fire) {
      keys[' '] = true; // Spacebar for shooting
    }

    return keys;
  }
}

// Global mobile controls instance
let mobileControls = null;

// Initialize mobile controls when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  mobileControls = new MobileControlsManager();
  window.mobileControls = mobileControls; // Make it globally accessible
  console.log('Mobile controls assigned to window.mobileControls');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MobileControlsManager;
}
