class AuthUI {
  constructor(containerId, apiService) {
    this.containerId = containerId;
    this.api = apiService;
    this.currentUser = JSON.parse(localStorage.getItem('currentUser')) || null;
    this.token = localStorage.getItem('gameToken') || null;
  }

  // Helper function to add both click and touch events for mobile compatibility
  addButtonEventListener(element, handler) {
    if (!element) return;

    element.addEventListener('click', handler);
    element.addEventListener('touchend', (e) => {
      e.preventDefault();
      handler(e);
    });
  }

  async initialize() {
    this.bindEvents();
    this.updateUIState();
  }

  bindEvents() {
    const loginBtn = document.querySelector('.login-btn');
    const registerBtn = document.querySelector('.register-btn');

    if (loginBtn) {
      this.addButtonEventListener(loginBtn, () => this.showPanel('login'));
    }
    if (registerBtn) {
      this.addButtonEventListener(registerBtn, () => this.showPanel('register'));
    }

    const profileBtn = document.querySelector('.profile-btn');
    if (profileBtn) {
      this.addButtonEventListener(profileBtn, () => this.showPanel('profile'));
    }

    const logoutBtn = document.querySelector('.logout-btn');
    if (logoutBtn) {
      this.addButtonEventListener(logoutBtn, () => this.handleLogout());
    }

    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }
    if (registerForm) {
      registerForm.addEventListener('submit', (e) => this.handleRegister(e));
    }

    const switchToRegister = document.querySelector('.switch-to-register');
    const switchToLogin = document.querySelector('.switch-to-login');

    if (switchToRegister) {
      this.addButtonEventListener(switchToRegister, () => {
        this.hidePanel('login');
        this.showPanel('register');
      });
    }
    if (switchToLogin) {
      this.addButtonEventListener(switchToLogin, () => {
        this.hidePanel('register');
        this.showPanel('login');
      });
    }

    document.querySelectorAll('.close-panel').forEach((btn) => {
      this.addButtonEventListener(btn, (e) => {
        const panelType = e.target.getAttribute('data-panel');
        this.hidePanel(panelType);
      });
    });

    const viewAllScoresBtn = document.getElementById('view-all-scores');
    if (viewAllScoresBtn) {
      this.addButtonEventListener(viewAllScoresBtn, () => {
        this.hidePanel('profile');

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

        // Update UI state first, then close panel
        this.updateUIState();

        // Clear the form
        form.reset();

        // Close panel immediately after successful login
        setTimeout(() => {
          this.hidePanel('login');
        }, 800);
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
    document.querySelectorAll('.auth-panel').forEach((panel) => {
      panel.classList.add('hidden');
    });

    const panel = document.querySelector(`.${panelName}-panel`);
    if (panel) {
      panel.classList.remove('hidden');

      if (panelName === 'profile' && this.currentUser) {
        this.loadUserProfile();
      }
    }
  }

  async loadUserProfile() {
    try {
      this.updateProfilePanel();

      if (this.api && this.api.getUserStats) {
        const stats = await this.api.getUserStats();
        this.updateUserStats(stats);
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  }

  updateUserStats(stats) {
    if (!stats) return;

    const totalGamesEl = document.getElementById('total-games');
    const bestScoreEl = document.getElementById('best-score');
    const totalTimeEl = document.getElementById('total-time');

    if (totalGamesEl) totalGamesEl.textContent = stats.totalGames || '0';
    if (bestScoreEl)
      bestScoreEl.textContent = (stats.bestScore || 0).toLocaleString();
    if (totalTimeEl) {
      const hours = Math.floor((stats.totalPlayTime || 0) / 3600);
      totalTimeEl.textContent = `${hours}h`;
    }
  }

  hidePanel(panelName) {
    const panel = document.querySelector(`.${panelName}-panel`);
    if (panel) {
      panel.classList.add('hidden');
    }

    this.clearMessage(panelName);
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
    const authButtons = document.getElementById('auth-buttons');
    const userInfoBtn = document.getElementById('user-info-btn');
    const currentUsernameSpan = document.getElementById('current-username');
    const isAuthenticated = this.isAuthenticated();

    if (!authButtons || !userInfoBtn) return;

    if (isAuthenticated) {
      authButtons.classList.add('hidden');
      userInfoBtn.classList.remove('hidden');

      if (currentUsernameSpan && this.currentUser) {
        currentUsernameSpan.textContent =
          this.currentUser.username.toUpperCase();
      }

      this.updateProfilePanel();
    } else {
      authButtons.classList.remove('hidden');
      userInfoBtn.classList.add('hidden');
    }
  }

  updateProfilePanel() {
    if (!this.currentUser) return;

    const profileUsername = document.getElementById('profile-username');
    const profileEmail = document.getElementById('profile-email');
    const profileJoinDate = document.getElementById('profile-join-date');

    if (profileUsername)
      profileUsername.textContent = this.currentUser.username;
    if (profileEmail) profileEmail.textContent = this.currentUser.email;
    if (profileJoinDate) {
      const joinDate = new Date(
        this.currentUser.createdAt
      ).toLocaleDateString();
      profileJoinDate.textContent = `Joined: ${joinDate}`;
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
