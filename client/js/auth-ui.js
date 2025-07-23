/**
 * Authentication UI Management
 * Handles login/register forms and user authentication flows
 */

class AuthUI {
  constructor(containerId, apiService) {
    this.containerId = containerId;
    this.api = apiService;
    this.currentPanel = null;
  }

  async initialize() {
    this.createAuthPanels();
    this.bindEvents();
    this.updateUIState();
  }

  createAuthPanels() {
    // Create login panel
    this.createLoginPanel();
    // Create register panel
    this.createRegisterPanel();
    // Create user profile panel
    this.createUserProfilePanel();
  }

  createLoginPanel() {
    const loginPanel = document.createElement('div');
    loginPanel.className = 'auth-panel login-panel hidden';
    loginPanel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">LOGIN</h2>
        <button class="close-panel" data-panel="login">✕</button>
      </div>
      
      <div class="auth-content">
        <form class="auth-form" id="login-form">
          <div class="form-group">
            <label for="login-username">Username or Email</label>
            <input type="text" id="login-username" name="username" required>
          </div>
          
          <div class="form-group">
            <label for="login-password">Password</label>
            <input type="password" id="login-password" name="password" required>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">Login</button>
            <button type="button" class="btn-secondary switch-to-register">Register Instead</button>
          </div>
        </form>
        
        <div class="auth-message" id="login-message"></div>
      </div>
    `;

    document.body.appendChild(loginPanel);
  }

  createRegisterPanel() {
    const registerPanel = document.createElement('div');
    registerPanel.className = 'auth-panel register-panel hidden';
    registerPanel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">REGISTER</h2>
        <button class="close-panel" data-panel="register">✕</button>
      </div>
      
      <div class="auth-content">
        <form class="auth-form" id="register-form">
          <div class="form-group">
            <label for="register-username">Username</label>
            <input type="text" id="register-username" name="username" required 
                   pattern="[a-zA-Z0-9_-]{3,30}" 
                   title="3-30 characters, letters, numbers, underscore, hyphen only">
          </div>
          
          <div class="form-group">
            <label for="register-email">Email</label>
            <input type="email" id="register-email" name="email" required>
          </div>
          
          <div class="form-group">
            <label for="register-password">Password</label>
            <input type="password" id="register-password" name="password" required 
                   minlength="8" 
                   title="At least 8 characters with uppercase, lowercase, and number">
          </div>
          
          <div class="form-group">
            <label for="register-confirm-password">Confirm Password</label>
            <input type="password" id="register-confirm-password" name="confirmPassword" required>
          </div>
          
          <div class="form-actions">
            <button type="submit" class="btn-primary">Register</button>
            <button type="button" class="btn-secondary switch-to-login">Login Instead</button>
          </div>
        </form>
        
        <div class="auth-message" id="register-message"></div>
      </div>
    `;

    document.body.appendChild(registerPanel);
  }

  createUserProfilePanel() {
    const profilePanel = document.createElement('div');
    profilePanel.className = 'auth-panel profile-panel hidden';
    profilePanel.innerHTML = `
      <div class="panel-header">
        <h2 class="panel-title">PROFILE</h2>
        <button class="close-panel" data-panel="profile">✕</button>
      </div>
      
      <div class="profile-content">
        <div class="user-info">
          <div class="user-avatar">👤</div>
          <div class="user-details">
            <h3 class="username" id="profile-username">Username</h3>
            <p class="user-email" id="profile-email">email@example.com</p>
            <p class="join-date" id="profile-join-date">Joined: Date</p>
          </div>
        </div>
        
        <div class="user-stats">
          <h4>Your Statistics</h4>
          <div class="stats-grid">
            <div class="stat-item">
              <span class="stat-label">Games Played:</span>
              <span class="stat-value" id="stat-games-played">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total Play Time:</span>
              <span class="stat-value" id="stat-play-time">0h 0m</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Highest Score:</span>
              <span class="stat-value" id="stat-highest-score">0</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Best Accuracy:</span>
              <span class="stat-value" id="stat-best-accuracy">0%</span>
            </div>
          </div>
        </div>
        
        <div class="user-scores">
          <h4>Your Recent Scores</h4>
          <div class="user-scores-list" id="user-scores-list">
            <!-- User scores will be populated here -->
          </div>
        </div>
        
        <div class="profile-actions">
          <button class="btn-secondary" id="view-all-scores">View All My Scores</button>
          <button class="btn-danger" id="logout-btn">Logout</button>
        </div>
      </div>
    `;

    document.body.appendChild(profilePanel);
  }

  bindEvents() {
    // Login form
    document.getElementById('login-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleLogin();
    });

    // Register form
    document.getElementById('register-form').addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleRegister();
    });

    // Switch between forms
    document
      .querySelector('.switch-to-register')
      .addEventListener('click', () => {
        this.showPanel('register');
      });

    document.querySelector('.switch-to-login').addEventListener('click', () => {
      this.showPanel('login');
    });

    // Logout
    document.getElementById('logout-btn').addEventListener('click', () => {
      this.handleLogout();
    });

    // Close panels
    document.querySelectorAll('.close-panel').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const panel = e.target.dataset.panel;
        this.hidePanel(panel);
      });
    });

    // View all scores
    document.getElementById('view-all-scores').addEventListener('click', () => {
      this.showUserScores();
    });
  }

  async handleLogin() {
    const form = document.getElementById('login-form');
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');

    try {
      this.showMessage('login', 'Logging in...', 'info');

      const response = await this.api.login(username, password);

      if (response.status === 'success') {
        this.showMessage('login', 'Login successful!', 'success');
        this.hidePanel('login');
        this.updateUIState();

        // Show welcome message
        this.showNotification(
          `Welcome back, ${response.data.user.username}!`,
          'success'
        );
      }
    } catch (error) {
      this.showMessage('login', error.message, 'error');
    }
  }

  async handleRegister() {
    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Validate passwords match
    if (password !== confirmPassword) {
      this.showMessage('register', 'Passwords do not match', 'error');
      return;
    }

    try {
      this.showMessage('register', 'Creating account...', 'info');

      const response = await this.api.register(username, email, password);

      if (response.status === 'success') {
        this.showMessage(
          'register',
          'Account created successfully!',
          'success'
        );
        this.hidePanel('register');
        this.updateUIState();

        // Show welcome message
        this.showNotification(
          `Welcome to Space Shooter, ${response.data.user.username}!`,
          'success'
        );
      }
    } catch (error) {
      this.showMessage('register', error.message, 'error');
    }
  }

  handleLogout() {
    this.api.logout();
    this.updateUIState();
    this.hidePanel('profile');
    this.showNotification('Logged out successfully', 'info');
  }

  showPanel(panelName) {
    // Hide all auth panels
    document.querySelectorAll('.auth-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    // Show requested panel
    const panel = document.querySelector(`.${panelName}-panel`);
    if (panel) {
      panel.classList.remove('hidden');
      this.currentPanel = panelName;

      // Load profile data if showing profile
      if (panelName === 'profile') {
        this.loadProfileData();
      }
    }
  }

  hidePanel(panelName) {
    const panel = document.querySelector(`.${panelName}-panel`);
    if (panel) {
      panel.classList.add('hidden');
      this.currentPanel = null;
    }
  }

  async loadProfileData() {
    const user = this.api.getCurrentUser();
    if (!user) return;

    // Update user info
    document.getElementById('profile-username').textContent = user.username;
    document.getElementById('profile-email').textContent = user.email;
    document.getElementById(
      'profile-join-date'
    ).textContent = `Joined: ${new Date(
      user.registrationDate
    ).toLocaleDateString()}`;

    // Load user stats and scores
    try {
      const userScores = await this.api.getUserScores(user.username);
      this.displayUserScores(userScores.entries);
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  }

  displayUserScores(scores) {
    const container = document.getElementById('user-scores-list');
    container.innerHTML = '';

    if (scores.length === 0) {
      container.innerHTML =
        '<p class="no-scores">No scores yet. Play a game to get started!</p>';
      return;
    }

    scores.slice(0, 5).forEach((score, index) => {
      const scoreElement = document.createElement('div');
      scoreElement.className = 'user-score-item';
      scoreElement.innerHTML = `
        <div class="score-rank">#${index + 1}</div>
        <div class="score-details">
          <div class="score-value">${score.score.toLocaleString()}</div>
          <div class="score-meta">
            Stage ${score.stage} • ${
        score.accuracy
      }% accuracy • ${this.formatDate(score.date)}
          </div>
        </div>
      `;
      container.appendChild(scoreElement);
    });
  }

  updateUIState() {
    const isAuthenticated = this.api.isAuthenticated();
    const user = this.api.getCurrentUser();

    // Update menu buttons
    this.updateMenuButtons(isAuthenticated, user);
  }

  updateMenuButtons(isAuthenticated, user) {
    // Add or update user/auth button in menu
    let authButton = document.querySelector('.auth-menu-button');

    if (!authButton) {
      authButton = document.createElement('button');
      authButton.className = 'auth-menu-button';

      const container = document.getElementById(this.containerId);
      if (container) {
        container.appendChild(authButton);
      } else {
        // Fallback to adding to menu buttons
        const menuButtons = document.querySelector('.menu-buttons');
        const settingsButton = document.querySelector('.settings');
        menuButtons.insertBefore(authButton, settingsButton);
      }
    }

    if (isAuthenticated) {
      authButton.innerHTML = `
        <span class="button-icon">👤</span>
        <span class="button-text">${user.username.toUpperCase()}</span>
      `;
      authButton.onclick = () => this.showPanel('profile');
    } else {
      authButton.innerHTML = `
        <span class="button-icon">🔐</span>
        <span class="button-text">LOGIN</span>
      `;
      authButton.onclick = () => this.showPanel('login');
    }
  }

  showMessage(panel, message, type = 'info') {
    const messageElement = document.getElementById(`${panel}-message`);
    messageElement.textContent = message;
    messageElement.className = `auth-message ${type}`;
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    document.body.appendChild(notification);

    // Show notification
    setTimeout(() => notification.classList.add('show'), 100);

    // Hide notification after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  formatDate(dateString) {
    return new Date(dateString).toLocaleDateString();
  }

  async showUserScores() {
    const user = this.api.getCurrentUser();
    if (!user) return;

    try {
      const userData = await this.api.getUserScores(
        user.username,
        'normal',
        20
      );

      // Create a modal or new panel to show all scores
      this.createUserScoresModal(userData.entries);
    } catch (error) {
      this.showNotification('Failed to load scores', 'error');
    }
  }

  createUserScoresModal(scores) {
    // Implementation for showing all user scores in a modal
    console.log('User scores:', scores);
    // This could be expanded to show a detailed scores modal
  }
}

// Initialize auth UI when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.authUI = new AuthUI();
});
