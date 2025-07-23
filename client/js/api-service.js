/**
 * API Service for Space Shooter Game
 * Handles all backend communication including authentication and leaderboard
 */

class GameAPI {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.token = localStorage.getItem('gameToken');
    this.currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );
    this.sessionId = this.generateSessionId();
  }

  generateSessionId() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Helper method for making API requests
  async makeRequest(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `HTTP ${response.status}`);
      }

      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Authentication methods
  async register(username, email, password) {
    try {
      const response = await this.makeRequest('/users/register', {
        method: 'POST',
        body: JSON.stringify({ username, email, password }),
      });

      if (response.status === 'success') {
        this.token = response.data.token;
        this.currentUser = response.data.user;
        localStorage.setItem('gameToken', this.token);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Registration failed');
    }
  }

  async login(username, password) {
    try {
      const response = await this.makeRequest('/users/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      });

      if (response.status === 'success') {
        this.token = response.data.token;
        this.currentUser = response.data.user;
        localStorage.setItem('gameToken', this.token);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Login failed');
    }
  }

  logout() {
    this.token = null;
    this.currentUser = null;
    localStorage.removeItem('gameToken');
    localStorage.removeItem('currentUser');
  }

  isAuthenticated() {
    return !!this.token && !!this.currentUser;
  }

  getCurrentUser() {
    return this.currentUser;
  }

  // Leaderboard methods
  async getLeaderboard(
    timeFrame = 'all-time',
    difficulty = 'normal',
    page = 1,
    limit = 10
  ) {
    try {
      const params = new URLSearchParams({
        timeFrame,
        difficulty,
        page: page.toString(),
        limit: limit.toString(),
      });

      const response = await this.makeRequest(`/leaderboard?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch leaderboard');
    }
  }

  async submitScore(scoreData) {
    try {
      const payload = {
        username: this.currentUser?.username || 'Anonymous',
        sessionId: this.sessionId,
        gameVersion: '1.0.0',
        ...scoreData,
      };

      const response = await this.makeRequest('/leaderboard/submit', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to submit score');
    }
  }

  async getUserScores(username, difficulty = 'normal', limit = 10) {
    try {
      const params = new URLSearchParams({
        difficulty,
        limit: limit.toString(),
      });

      const response = await this.makeRequest(
        `/leaderboard/user/${username}?${params}`
      );
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch user scores');
    }
  }

  async getLeaderboardStats(difficulty = 'normal') {
    try {
      const params = new URLSearchParams({ difficulty });
      const response = await this.makeRequest(`/leaderboard/stats?${params}`);
      return response.data;
    } catch (error) {
      throw new Error(error.message || 'Failed to fetch leaderboard stats');
    }
  }

  // Game session methods
  async createGameSession(difficulty = 'normal') {
    try {
      const payload = {
        userId: this.currentUser?.id,
        username: this.currentUser?.username || 'Anonymous',
        difficulty,
        gameVersion: '1.0.0',
      };

      const response = await this.makeRequest('/sessions', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      if (response.status === 'success') {
        this.sessionId = response.data.sessionId;
      }

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to create game session');
    }
  }

  async endGameSession(gameData) {
    try {
      const response = await this.makeRequest(
        `/sessions/${this.sessionId}/end`,
        {
          method: 'PUT',
          body: JSON.stringify(gameData),
        }
      );

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to end game session');
    }
  }

  // User settings methods
  async updateUserSettings(settings) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    try {
      const response = await this.makeRequest(
        `/users/${this.currentUser.id}/settings`,
        {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        }
      );

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update settings');
    }
  }

  async updateUserStats(stats) {
    if (!this.isAuthenticated()) {
      throw new Error('Authentication required');
    }

    try {
      const response = await this.makeRequest(
        `/users/${this.currentUser.id}/stats`,
        {
          method: 'PUT',
          body: JSON.stringify({ stats }),
        }
      );

      return response;
    } catch (error) {
      throw new Error(error.message || 'Failed to update stats');
    }
  }
}

// Create global API instance
window.gameAPI = new GameAPI();
