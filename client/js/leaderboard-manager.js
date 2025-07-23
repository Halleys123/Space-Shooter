/**
 * Enhanced Leaderboard Manager
 * Handles leaderboard display, filtering, and backend integration
 */

class LeaderboardManager {
  constructor(panelSelector, apiService, authUI) {
    this.panelSelector = panelSelector;
    this.api = apiService;
    this.authUI = authUI;
    this.currentTimeFrame = 'all-time';
    this.currentDifficulty = 'normal';
    this.currentPage = 1;
    this.isLoading = false;
    this.stats = null;
  }

  async initialize() {
    this.init();
  }

  init() {
    this.bindEvents();
    this.loadLeaderboard();
  }

  bindEvents() {
    // Tab switching
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const timeFrame = e.target.dataset.tab;
        this.switchTimeFrame(timeFrame);
      });
    });

    // Add difficulty selector if not exists
    this.createDifficultySelector();

    // Add refresh button
    this.createRefreshButton();

    // Add pagination controls
    this.createPaginationControls();

    // Add stats display
    this.createStatsDisplay();
  }

  createDifficultySelector() {
    const leaderboardContent = document.querySelector('.leaderboard-content');

    let difficultySelector = document.querySelector('.difficulty-selector');
    if (!difficultySelector) {
      difficultySelector = document.createElement('div');
      difficultySelector.className = 'difficulty-selector';
      difficultySelector.innerHTML = `
        <label for="difficulty-select">Difficulty:</label>
        <select id="difficulty-select">
          <option value="easy">Easy</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Hard</option>
          <option value="expert">Expert</option>
        </select>
      `;

      const tabs = document.querySelector('.leaderboard-tabs');
      leaderboardContent.insertBefore(difficultySelector, tabs.nextSibling);
    }

    document
      .getElementById('difficulty-select')
      .addEventListener('change', (e) => {
        this.currentDifficulty = e.target.value;
        this.currentPage = 1;
        this.loadLeaderboard();
      });
  }

  createRefreshButton() {
    const header = document.querySelector('.leaderboard-header');

    let refreshButton = document.querySelector('.refresh-leaderboard');
    if (!refreshButton) {
      refreshButton = document.createElement('button');
      refreshButton.className = 'refresh-leaderboard btn-small';
      refreshButton.innerHTML = '🔄 Refresh';
      refreshButton.onclick = () => this.refreshLeaderboard();

      header.appendChild(refreshButton);
    }
  }

  createPaginationControls() {
    let paginationContainer = document.querySelector('.pagination-controls');
    if (!paginationContainer) {
      paginationContainer = document.createElement('div');
      paginationContainer.className = 'pagination-controls';

      const leaderboardList = document.querySelector('.leaderboard-list');
      leaderboardList.appendChild(paginationContainer);
    }
  }

  createStatsDisplay() {
    let statsContainer = document.querySelector('.leaderboard-stats');
    if (!statsContainer) {
      statsContainer = document.createElement('div');
      statsContainer.className = 'leaderboard-stats';

      const leaderboardContent = document.querySelector('.leaderboard-content');
      leaderboardContent.appendChild(statsContainer);
    }
  }

  async loadLeaderboard() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      // Load leaderboard data
      const leaderboardData = await this.api.getLeaderboard(
        this.currentTimeFrame,
        this.currentDifficulty,
        this.currentPage,
        10
      );

      // Load stats data
      const statsData = await this.api.getLeaderboardStats(
        this.currentDifficulty
      );

      this.displayLeaderboard(leaderboardData);
      this.displayStats(statsData);
      this.updatePagination(leaderboardData.pagination);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      this.showErrorState(error.message);
    } finally {
      this.isLoading = false;
    }
  }

  displayLeaderboard(data) {
    const entriesContainer = document.getElementById('leaderboard-entries');
    entriesContainer.innerHTML = '';

    if (!data.entries || data.entries.length === 0) {
      entriesContainer.innerHTML = `
        <div class="no-entries">
          <p>No scores yet for ${this.currentDifficulty} difficulty.</p>
          <p>Be the first to set a record!</p>
        </div>
      `;
      return;
    }

    data.entries.forEach((entry) => {
      const entryElement = this.createLeaderboardEntry(entry);
      entriesContainer.appendChild(entryElement);
    });
  }

  createLeaderboardEntry(entry) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'leaderboard-entry';

    // Highlight current user's entry
    const currentUser = this.api.getCurrentUser();
    if (currentUser && entry.username === currentUser.username) {
      entryDiv.classList.add('current-user');
    }

    // Format date
    const date = new Date(entry.date).toLocaleDateString();

    // Calculate additional metrics
    const timeText = this.formatPlayTime(entry.playTime);

    entryDiv.innerHTML = `
      <span class="rank ${this.getRankClass(entry.rank)}">${entry.rank}</span>
      <span class="player-name">${entry.username}</span>
      <span class="score">${entry.score.toLocaleString()}</span>
      <span class="additional-info">
        <div class="score-details">
          <small>Stage ${entry.stage} • Cycle ${entry.cycle}</small>
          <small>${entry.accuracy}% accuracy • ${
      entry.enemiesKilled
    } kills</small>
          <small>${timeText} • ${entry.powerupsCollected} powerups</small>
        </div>
      </span>
      <span class="date">${date}</span>
    `;

    return entryDiv;
  }

  getRankClass(rank) {
    if (rank === 1) return 'rank-gold';
    if (rank === 2) return 'rank-silver';
    if (rank === 3) return 'rank-bronze';
    if (rank <= 10) return 'rank-top10';
    return '';
  }

  formatPlayTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  displayStats(statsData) {
    const statsContainer = document.querySelector('.leaderboard-stats');

    if (!statsData.stats) return;

    const stats = statsData.stats;

    statsContainer.innerHTML = `
      <h4>Leaderboard Statistics (${this.currentDifficulty})</h4>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${stats.totalEntries || 0}</div>
          <div class="stat-label">Total Players</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(
            stats.highestScore || 0
          ).toLocaleString()}</div>
          <div class="stat-label">Highest Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(
            stats.averageScore || 0
          ).toLocaleString()}</div>
          <div class="stat-label">Average Score</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${Math.round(
            stats.averageAccuracy || 0
          )}%</div>
          <div class="stat-label">Average Accuracy</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${(
            stats.totalEnemiesKilled || 0
          ).toLocaleString()}</div>
          <div class="stat-label">Total Enemies Defeated</div>
        </div>
      </div>
    `;
  }

  updatePagination(pagination) {
    const paginationContainer = document.querySelector('.pagination-controls');

    if (!pagination || pagination.totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    paginationContainer.innerHTML = `
      <button class="btn-small" ${!pagination.hasPrevPage ? 'disabled' : ''} 
              onclick="leaderboardManager.previousPage()">
        ← Previous
      </button>
      <span class="page-info">
        Page ${pagination.currentPage} of ${pagination.totalPages}
      </span>
      <button class="btn-small" ${!pagination.hasNextPage ? 'disabled' : ''} 
              onclick="leaderboardManager.nextPage()">
        Next →
      </button>
    `;
  }

  switchTimeFrame(timeFrame) {
    // Update active tab
    document.querySelectorAll('.tab-button').forEach((btn) => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-tab="${timeFrame}"]`).classList.add('active');

    this.currentTimeFrame = timeFrame;
    this.currentPage = 1;
    this.loadLeaderboard();
  }

  async refreshLeaderboard() {
    await this.loadLeaderboard();
    this.showNotification('Leaderboard refreshed!', 'success');
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadLeaderboard();
    }
  }

  nextPage() {
    this.currentPage++;
    this.loadLeaderboard();
  }

  showLoadingState() {
    const entriesContainer = document.getElementById('leaderboard-entries');
    entriesContainer.innerHTML = `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading leaderboard...</p>
      </div>
    `;
  }

  showErrorState(message) {
    const entriesContainer = document.getElementById('leaderboard-entries');
    entriesContainer.innerHTML = `
      <div class="error-state">
        <p>Failed to load leaderboard: ${message}</p>
        <button class="btn-primary" onclick="leaderboardManager.refreshLeaderboard()">
          Try Again
        </button>
      </div>
    `;
  }

  showNotification(message, type = 'info') {
    // Reuse the notification system from AuthUI
    if (window.authUI) {
      window.authUI.showNotification(message, type);
    }
  }

  // Method to submit score (called from game)
  async submitScore(scoreData) {
    try {
      const response = await this.api.submitScore(scoreData);

      if (response.status === 'success') {
        const entry = response.data.entry;
        this.showNotification(
          `Score submitted! You ranked #${entry.rank}`,
          'success'
        );

        // Refresh leaderboard to show new score
        setTimeout(() => this.refreshLeaderboard(), 1000);
      }

      return response;
    } catch (error) {
      this.showNotification(
        `Failed to submit score: ${error.message}`,
        'error'
      );
      throw error;
    }
  }
}

// Initialize leaderboard manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.leaderboardManager = new LeaderboardManager();
});
