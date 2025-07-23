/**
 * Simplified Authentication UI Management
 * Works with pre-existing HTML panels instead of creating them dynamically
 */

class AuthUI {
  constructor(containerId, apiService) {
    this.containerId = containerId;
    this.api = apiService;
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    this.token = localStorage.getItem('gameToken') || null;
  }

  async initialize() {
    this.bindEvents();
    this.updateUIState();
  }

  bindEvents() {
    // Login/Register button events
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');

    if (loginBtn) {
      loginBtn.addEventListener('click', () => this.showPanel('login'));
    }
    if (registerBtn) {
      registerBtn.addEventListener('click', () => this.showPanel('register'));
    }

    // Form submission events
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    // Panel switching events
    const switchToRegister = document.querySelector('.switch-to-register');
    const switchToLogin = document.querySelector('.switch-to-login');

    if (switchToRegister) {
      switchToRegister.addEventListener('click', () => {
        this.hidePanel('login');
        this.showPanel('register');
      });
    }
    if (switchToLogin) {
      switchToLogin.addEventListener('click', () => {
        this.hidePanel('register');
        this.showPanel('login');
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => this.handleLogout());
    }

    // Close panel buttons
    document.querySelectorAll('.close-panel').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        const panelType = e.target.getAttribute('data-panel');
        this.hidePanel(panelType);
      });
    });

    // View all scores button
    const viewAllScoresBtn = document.getElementById('view-all-scores');
    if (viewAllScoresBtn) {
      viewAllScoresBtn.addEventListener('click', () => {
        this.hidePanel('profile');
        // Trigger leaderboard view - assuming there's a global function
        if (window.leaderboardManager) {
          document.querySelector('.leaderboard')?.click();
        }
      });
    }
  }

  async handleLogin(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const password = formData.get('password');

    if (!username || !password) {
      this.showMessage('login', 'Please fill in all fields', 'error');
      return;
    }

    try {
      this.showMessage('login', 'Logging in...', 'info');

      const response = await this.api.login(username, password);

      if (response.success) {
        this.currentUser = response.user;
        this.token = response.token;

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        localStorage.setItem('gameToken', this.token);

        this.showMessage('login', 'Login successful!', 'success');
        this.updateUIState();

        setTimeout(() => {
          this.hidePanel('login');
        }, 1500);
      } else {
        this.showMessage('login', response.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      this.showMessage('login', 'Login failed. Please try again.', 'error');
    }
  }

  async handleRegister(e) {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);
    const username = formData.get('username');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');

    // Basic validation
    if (!username || !email || !password || !confirmPassword) {
      this.showMessage('register', 'Please fill in all fields', 'error');
      return;
    }

    if (password !== confirmPassword) {
      this.showMessage('register', 'Passwords do not match', 'error');
      return;
    }

    if (password.length < 6) {
      this.showMessage(
        'register',
        'Password must be at least 6 characters',
        'error'
      );
      return;
    }

    try {
      this.showMessage('register', 'Creating account...', 'info');

      const response = await this.api.register(username, email, password);

      if (response.success) {
        this.showMessage(
          'register',
          'Account created successfully! Please login.',
          'success'
        );

        setTimeout(() => {
          this.hidePanel('register');
          this.showPanel('login');
          // Pre-fill login form
          document.getElementById('login-username').value = username;
        }, 2000);
      } else {
        this.showMessage(
          'register',
          response.message || 'Registration failed',
          'error'
        );
      }
    } catch (error) {
      console.error('Registration error:', error);
      this.showMessage(
        'register',
        'Registration failed. Please try again.',
        'error'
      );
    }
  }

  handleLogout() {
    this.currentUser = null;
    this.token = null;

    localStorage.removeItem('currentUser');
    localStorage.removeItem('gameToken');

    this.updateUIState();
    this.hidePanel('profile');

    if (window.showNotification) {
      window.showNotification('Logged out successfully', 'info');
    }
  }

  showPanel(panelName) {
    // Hide all auth panels first
    document.querySelectorAll('.auth-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    // Show the requested panel
    const panel = document.querySelector(`.${panelName}-panel`);
    if (panel) {
      panel.classList.remove('hidden');

      // If showing profile, load user data
      if (panelName === 'profile' && this.currentUser) {
        this.loadUserProfile();
      }
    }
  }

  hidePanel(panelName) {
    const panel = document.querySelector(`.${panelName}-panel`);
    if (panel) {
      panel.classList.add('hidden');
    }

    // Clear any messages
    this.clearMessage(panelName);
  }

  async loadUserProfile() {
    if (!this.currentUser) return;

    // Update basic user info
    const usernameEl = document.getElementById('profile-username');
    const emailEl = document.getElementById('profile-email');
    const joinDateEl = document.getElementById('profile-join-date');

    if (usernameEl) usernameEl.textContent = this.currentUser.username;
    if (emailEl) emailEl.textContent = this.currentUser.email;
    if (joinDateEl) {
      const joinDate = new Date(
        this.currentUser.createdAt
      ).toLocaleDateString();
      joinDateEl.textContent = `Joined: ${joinDate}`;
    }

    try {
      // Load user statistics
      const stats = await this.api.getUserStats(this.currentUser.id);
      if (stats.success) {
        this.updateUserStats(stats.data);
      }

      // Load recent scores
      const scores = await this.api.getUserScores(this.currentUser.id, 1, 5);
      if (scores.success) {
        this.updateUserScores(scores.data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  updateUserStats(stats) {
    const totalGamesEl = document.getElementById('total-games');
    const bestScoreEl = document.getElementById('best-score');
    const totalTimeEl = document.getElementById('total-time');
    const avgScoreEl = document.getElementById('avg-score');

    if (totalGamesEl) totalGamesEl.textContent = stats.totalGames || 0;
    if (bestScoreEl)
      bestScoreEl.textContent = (stats.bestScore || 0).toLocaleString();
    if (totalTimeEl) {
      const hours = Math.floor((stats.totalPlayTime || 0) / 3600);
      totalTimeEl.textContent = `${hours}h`;
    }
    if (avgScoreEl)
      avgScoreEl.textContent = Math.round(
        stats.averageScore || 0
      ).toLocaleString();
  }

  updateUserScores(scores) {
    const container = document.getElementById('user-scores-list');
    if (!container) return;

    if (!scores.length) {
      container.innerHTML =
        '<div class="no-scores">No scores yet. Play a game to see your scores here!</div>';
      return;
    }

    container.innerHTML = scores
      .map(
        (score, index) => `
      <div class="user-score-item">
        <div class="score-rank">${index + 1}</div>
        <div class="score-details">
          <div class="score-value">${score.score.toLocaleString()}</div>
          <div class="score-meta">
            Level ${score.level || 1} • ${score.difficulty || 'Normal'} • 
            ${new Date(score.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    `
      )
      .join('');
  }

  updateUIState() {
    const authSection = document.getElementById('auth-section');
    const isAuthenticated = this.isAuthenticated();

    if (!authSection) return;

    if (isAuthenticated) {
      // Show user button
      authSection.innerHTML = `
        <button class='user-profile-btn auth-menu-button' data-action="profile">
          <span class="button-icon">👤</span>
          <span class="button-text">${this.currentUser.username.toUpperCase()}</span>
        </button>
      `;

      // Bind profile button event
      const profileBtn = authSection.querySelector('.user-profile-btn');
      if (profileBtn) {
        profileBtn.addEventListener('click', () => this.showPanel('profile'));
      }
    } else {
      // Show login/register buttons
      authSection.innerHTML = `
        <button class='login-btn' data-action="login">
          <span class="button-icon">🔐</span>
          <span class="button-text">LOGIN</span>
        </button>
        <button class='register-btn' data-action="register">
          <span class="button-icon">📝</span>
          <span class="button-text">REGISTER</span>
        </button>
      `;

      // Re-bind events for new buttons
      const loginBtn = authSection.querySelector('.login-btn');
      const registerBtn = authSection.querySelector('.register-btn');

      if (loginBtn) {
        loginBtn.addEventListener('click', () => this.showPanel('login'));
      }
      if (registerBtn) {
        registerBtn.addEventListener('click', () => this.showPanel('register'));
      }
    }
  }

  showMessage(panel, message, type = 'info') {
    const messageElement = document.getElementById(`${panel}-message`);
    if (messageElement) {
      messageElement.textContent = message;
      messageElement.className = `auth-message ${type}`;
      messageElement.classList.remove('hidden');
    }
  }

  clearMessage(panel) {
    const messageElement = document.getElementById(`${panel}-message`);
    if (messageElement) {
      messageElement.classList.add('hidden');
      messageElement.textContent = '';
    }
  }

  isAuthenticated() {
    return !!(this.currentUser && this.token);
  }

  getCurrentUser() {
    return this.currentUser;
  }

  getToken() {
    return this.token;
  }
}
