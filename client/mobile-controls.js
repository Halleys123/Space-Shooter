// Mobile Controls Manager
class MobileControlsManager {
  constructor() {
    this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    console.log('Mobile controls initialized. Touch support:', this.isTouch);
    this.controls = {
      movement: { x: 0, y: 0, active: false },
      rotation: { value: 0, active: false },
      fire: false,
    };
    this.gyroBaseline = { gamma: 0, beta: 0 };
    this.gyroCalibrated = false;
    this.init();
  }

  init() {
    if (!this.isTouch) return;
    this.setupMovementJoystick();
    this.setupFireButton();
    this.setupGyroControl();
    this.setupOrientationCheck();
    console.log('Mobile controls setup complete');
  }

  setupMovementJoystick() {
    const container = document.getElementById('movement-joystick');
    const stick = document.getElementById('movement-stick');
    if (!container || !stick) return;

    let dragging = false;
    let center = { x: 0, y: 0 };
    const radius = container.offsetWidth / 2;

    const updateCenter = () => {
      const rect = container.getBoundingClientRect();
      center = {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      };
    };

    const onStart = (e) => {
      e.preventDefault();
      dragging = true;
      updateCenter();
      this.controls.movement.active = true;
      container.style.opacity = '1';
    };
    const onMove = (e) => {
      if (!dragging) return;
      e.preventDefault();
      const touch = e.touches ? e.touches[0] : e;
      let dx = touch.clientX - center.x,
        dy = touch.clientY - center.y;
      const dist = Math.hypot(dx, dy);
      if (dist > radius) {
        dx = (dx / dist) * radius;
        dy = (dy / dist) * radius;
      }
      stick.style.transform = `translate(${dx}px, ${dy}px)`;
      this.controls.movement.x = dx / radius;
      this.controls.movement.y = dy / radius;
    };
    const onEnd = (e) => {
      e.preventDefault();
      dragging = false;
      stick.style.transform = 'translate(0,0)';
      this.controls.movement = { x: 0, y: 0, active: false };
      container.style.opacity = '0.7';
    };

    container.addEventListener('touchstart', onStart, { passive: false });
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd, { passive: false });
    container.addEventListener('mousedown', onStart);
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onEnd);
    container.style.opacity = '0.7';
  }

  setupFireButton() {
    const fire = document.getElementById('fire-button');
    if (!fire) return;
    const down = (e) => {
      e.preventDefault();
      this.controls.fire = true;
      fire.style.transform = 'scale(0.9)';
    };
    const up = (e) => {
      e.preventDefault();
      this.controls.fire = false;
      fire.style.transform = 'scale(1)';
    };
    fire.addEventListener('touchstart', down, { passive: false });
    fire.addEventListener('touchend', up, { passive: false });
    fire.addEventListener('mousedown', down);
    fire.addEventListener('mouseup', up);
  }

  setupGyroControl() {
    if (!window.DeviceOrientationEvent) return;
    window.addEventListener('deviceorientation', (e) => {
      const g = e.gamma || 0;
      const v = Math.max(-1, Math.min(1, g / 45));
      this.controls.rotation.value = v;
      this.controls.rotation.active = Math.abs(v) > 0.1;
    });
    console.log('Gyro control active');
  }

  setupOrientationCheck() {
    const prompt = document.getElementById('landscape-prompt');
    const check = () => {
      if (this.isTouch && window.innerHeight > window.innerWidth && prompt)
        prompt.style.display = 'flex';
      else if (prompt) prompt.style.display = 'none';
    };
    window.addEventListener('orientationchange', check);
    window.addEventListener('resize', check);
    check();
  }

  // Simulate keyboard for movement/fire
  getMobileKeys() {
    const keys = {};
    if (this.controls.movement.active) {
      if (this.controls.movement.y < -0.3) keys['w'] = true;
      if (this.controls.movement.y > 0.3) keys['s'] = true;
      if (this.controls.movement.x < -0.3) keys['a'] = true;
      if (this.controls.movement.x > 0.3) keys['d'] = true;
    }
    if (this.controls.fire) keys[' '] = true;
    return keys;
  }

  // Provide virtual mouse for rotation
  getMobileMouse(canvas) {
    if (!this.controls.rotation.active || !canvas) return null;
    const cx = canvas.width / 2,
      cy = canvas.height / 2;
    const angle = this.controls.rotation.value * Math.PI;
    return {
      x: cx + Math.sin(angle) * 100,
      y: cy - Math.cos(angle) * 100,
    };
  }

  setGameStarted(started) {
    const m = document.getElementById('mobile-controls'),
      f = document.getElementById('fire-button');
    if (!m) return;
    m.classList[started ? 'add' : 'remove']('game-started');
    if (f) f.classList[started ? 'add' : 'remove']('game-started');
  }
}

// Initialize global instance
let mobileControls;
document.addEventListener('DOMContentLoaded', () => {
  mobileControls = new MobileControlsManager();
  window.mobileControls = mobileControls;
});

// Export for modules
if (typeof module !== 'undefined' && module.exports)
  module.exports = MobileControlsManager;
