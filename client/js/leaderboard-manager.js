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

  async refresh() {
    await this.loadLeaderboard();
  }

  init() {
    this.bindEvents();
    this.loadLeaderboard();
  }

  bindEvents() {
    document.querySelectorAll('.tab-button').forEach((button) => {
      button.addEventListener('click', (e) => {
        const timeFrame = e.target.dataset.tab;
        this.switchTimeFrame(timeFrame);
      });
    });

    const difficultyFilter = document.getElementById('difficulty-filter');
    if (difficultyFilter) {
      difficultyFilter.addEventListener('change', (e) => {
        this.currentDifficulty = e.target.value.toLowerCase();
        this.loadLeaderboard();
      });
    }

    const refreshButton = document.querySelector('.refresh-leaderboard');
    if (refreshButton) {
      refreshButton.addEventListener('click', () => {
        this.refresh();
      });
    }
  }

  async loadLeaderboard() {
    if (this.isLoading) return;

    this.isLoading = true;
    this.showLoadingState();

    try {
      const leaderboardData = await this.api.getLeaderboard(
        this.currentTimeFrame,
        this.currentDifficulty,
        this.currentPage,
        10
      );

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

    // Add header row
    const headerDiv = document.createElement('div');
    headerDiv.className = 'leaderboard-header';
    headerDiv.innerHTML = `
      <div>Rank</div>
      <div>Player</div>
      <div>Score</div>
      <div>Level</div>
      <div>Accuracy</div>
      <div>Kills</div>
      <div>Date</div>
    `;
    entriesContainer.appendChild(headerDiv);

    data.entries.forEach((entry) => {
      const entryElement = this.createLeaderboardEntry(entry);
      entriesContainer.appendChild(entryElement);
    });
  }

  createLeaderboardEntry(entry) {
    const entryDiv = document.createElement('div');
    entryDiv.className = 'leaderboard-entry';

    const currentUser = this.api.getCurrentUser();
    if (currentUser && entry.username === currentUser.username) {
      entryDiv.classList.add('current-user');
    }

    const date = new Date(entry.date).toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
    });
    const accuracy = entry.accuracy
      ? `${(entry.accuracy * 100).toFixed(1)}%`
      : 'N/A';

    entryDiv.innerHTML = `
      <div class="column-rank">
        <span class="rank ${this.getRankClass(entry.rank)}">${entry.rank}</span>
      </div>
      <div class="column-player">${entry.username}</div>
      <div class="column-score">${entry.score.toLocaleString()}</div>
      <div class="column-level">${entry.stage || 'N/A'}</div>
      <div class="column-accuracy">${accuracy}</div>
      <div class="column-kills">${entry.enemiesKilled || 0}</div>
      <div class="column-date">${date}</div>
    `;

    return entryDiv;
  }

  getRankClass(rank) {
    if (rank === 1) return 'rank-1';
    if (rank === 2) return 'rank-2';
    if (rank === 3) return 'rank-3';
    if (rank <= 10) return 'rank-top10';
    return '';
  }

  formatPlayTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  displayStats(statsData) {
    if (!statsData.stats) return;

    const stats = statsData.stats;

    const totalPlayersEl = document.getElementById('total-players');
    const highestScoreEl = document.getElementById('highest-score');
    const averageScoreEl = document.getElementById('average-score');
    const averageAccuracyEl = document.getElementById('average-accuracy');

    if (totalPlayersEl) totalPlayersEl.textContent = stats.totalEntries || '0';
    if (highestScoreEl)
      highestScoreEl.textContent = (stats.highestScore || 0).toLocaleString();
    if (averageScoreEl)
      averageScoreEl.textContent = Math.round(
        stats.averageScore || 0
      ).toLocaleString();
    if (averageAccuracyEl)
      averageAccuracyEl.textContent = `${Math.round(
        stats.averageAccuracy || 0
      )}%`;
  }

  updatePagination(pagination) {
    const paginationContainer = document.querySelector('.pagination-controls');

    if (!paginationContainer) {
      console.warn('Pagination container not found');
      return;
    }

    if (!pagination || pagination.totalPages <= 1) {
      paginationContainer.innerHTML = '';
      return;
    }

    paginationContainer.innerHTML = `
      <button class="btn-small" ${!pagination.hasPrevPage ? 'disabled' : ''} 
              onclick="window.leaderboardManager.previousPage()">
        ← Previous
      </button>
      <span class="page-info">
        Page ${pagination.currentPage} of ${pagination.totalPages}
      </span>
      <button class="btn-small" ${!pagination.hasNextPage ? 'disabled' : ''} 
              onclick="window.leaderboardManager.nextPage()">
        Next →
      </button>
    `;
  }

  switchTimeFrame(timeFrame) {
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
        <button class="btn-primary" onclick="window.leaderboardManager.refreshLeaderboard()">
          Try Again
        </button>
      </div>
    `;
  }

  showNotification(message, type = 'info') {
    if (window.authUI) {
      window.authUI.showNotification(message, type);
    }
  }

  async submitScore(scoreData) {
    try {
      const response = await this.api.submitScore(scoreData);

      if (response.status === 'success') {
        const entry = response.data.entry;
        this.showNotification(
          `Score submitted! You ranked #${entry.rank}`,
          'success'
        );

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

document.addEventListener('DOMContentLoaded', () => {
  if (window.apiService && window.authUI) {
    window.leaderboardManager = new LeaderboardManager(
      '.leaderboard-panel',
      window.apiService,
      window.authUI
    );
    window.leaderboardManager.initialize();
  } else {
    setTimeout(() => {
      if (window.apiService && window.authUI) {
        window.leaderboardManager = new LeaderboardManager(
          '.leaderboard-panel',
          window.apiService,
          window.authUI
        );
        window.leaderboardManager.initialize();
      } else {
        console.warn(
          'LeaderboardManager: Required dependencies (apiService, authUI) not found'
        );
      }
    }, 100);
  }
});
