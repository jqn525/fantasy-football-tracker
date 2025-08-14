// Fantasy Football Tracker - Main Application
class FantasyTrackerApp {
  constructor() {
    this.state = {
      isAuthenticated: false,
      currentUser: null,
      currentTeam: null,
      currentWeek: 1,
      roster: [],
      news: [],
      aiInsights: [],
      theme: localStorage.getItem('theme') || 'light',
      activeTab: 'roster'
    };
    
    this.init();
  }

  async init() {
    // Apply saved theme
    this.applyTheme(this.state.theme);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Check authentication status first
    await this.checkAuth();
    
    // Load initial data if authenticated
    if (this.state.isAuthenticated) {
      console.log('User authenticated, loading dashboard...');
      await this.loadDashboard();
      this.startAutoRefresh();
    } else {
      console.log('User not authenticated, showing welcome screen...');
      this.showWelcomeScreen();
    }
  }

  setupEventListeners() {
    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Refresh button
    document.getElementById('refresh-btn')?.addEventListener('click', () => {
      this.loadDashboard();
    });

    // Tab navigation
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // AI Query submission
    document.getElementById('submit-ai-query')?.addEventListener('click', () => {
      this.submitAIQuery();
    });

    // Enter key for AI query input
    document.getElementById('ai-query-input')?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.submitAIQuery();
      }
    });

    // Ask AI button in insights bar
    document.getElementById('ask-ai-btn')?.addEventListener('click', () => {
      this.switchTab('ai-insights');
      document.getElementById('ai-query-input')?.focus();
    });

    // Settings button
    document.getElementById('settings-btn')?.addEventListener('click', () => {
      this.showSettings();
    });

    // Close settings modal
    document.getElementById('close-settings')?.addEventListener('click', () => {
      this.hideSettings();
    });

    // Theme toggle in settings
    document.getElementById('theme-toggle-settings')?.addEventListener('click', () => {
      this.toggleTheme();
    });

    // Logout button
    document.getElementById('logout-btn')?.addEventListener('click', () => {
      this.logout();
    });

    // Close settings on background click
    document.getElementById('settings-modal')?.addEventListener('click', (e) => {
      if (e.target.id === 'settings-modal') {
        this.hideSettings();
      }
    });
  }

  async checkAuth() {
    try {
      console.log('Checking authentication status...');
      const response = await fetch('/api/auth/status');
      if (response.ok) {
        const data = await response.json();
        this.state.isAuthenticated = data.authenticated || false;
        if (data.authenticated) {
          console.log('User is authenticated:', data.user);
          this.state.currentUser = data.user;
        } else {
          console.log('User is not authenticated');
        }
      } else {
        console.error('Auth status check failed with status:', response.status);
        this.state.isAuthenticated = false;
      }
      return this.state.isAuthenticated;
    } catch (error) {
      console.error('Auth check failed:', error);
      // If auth check fails, assume not authenticated
      this.state.isAuthenticated = false;
      return false;
    }
  }

  showWelcomeScreen() {
    document.getElementById('welcome-screen')?.classList.remove('hidden');
    document.getElementById('main-dashboard')?.classList.add('hidden');
  }

  showDashboard() {
    document.getElementById('welcome-screen')?.classList.add('hidden');
    document.getElementById('main-dashboard')?.classList.remove('hidden');
  }

  async loadDashboard() {
    this.showLoading(true);
    
    try {
      // Try to load real data from Yahoo API first
      await this.loadRealData();
      
      // Update UI with loaded data
      this.updateDashboardUI();
      
      // Load AI insights
      await this.loadAIInsights();
      
      this.showDashboard();
    } catch (error) {
      console.error('Dashboard load error:', error);
      this.showToast('Failed to load dashboard', 'error');
    } finally {
      this.showLoading(false);
    }
  }

  async loadRealData() {
    try {
      console.log('Loading real team data from Yahoo...');
      
      // Fetch user's team data
      const response = await fetch('/api/players/my-team');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch team data: ${response.status}`);
      }
      
      const teamData = await response.json();
      console.log('Received team data:', teamData);
      
      // Update state with real data
      this.state.currentTeam = {
        name: teamData.team.name,
        wins: teamData.team.wins,
        losses: teamData.team.losses,
        rank: teamData.team.rank,
        pointsFor: teamData.team.points_for,
        pointsAgainst: teamData.team.points_against
      };

      // Process roster data
      this.state.roster = teamData.roster.map(player => ({
        id: player.player_key,
        name: player.name?.full || 'Unknown Player',
        position: player.eligible_positions?.[0]?.position || 'N/A',
        team: player.editorial_team_abbr || 'N/A',
        status: this.getPlayerStatus(player),
        points: this.getPlayerPoints(player),
        projected: this.getPlayerProjected(player),
        photo: player.headshot?.url || null
      }));

      // Process current matchup
      if (teamData.current_matchup) {
        const userTeam = teamData.current_matchup.teams.find(team => 
          team.team_key === teamData.team.key
        );
        const opponent = teamData.current_matchup.teams.find(team => 
          team.team_key !== teamData.team.key
        );
        
        this.state.currentMatchup = {
          myScore: userTeam?.team_points?.total || 0,
          oppScore: opponent?.team_points?.total || 0,
          oppName: opponent?.name || 'Opponent'
        };
      } else {
        this.state.currentMatchup = {
          myScore: 0,
          oppScore: 0,
          oppName: 'No Matchup'
        };
      }

      this.state.currentWeek = teamData.league.current_week || 1;
      
    } catch (error) {
      console.error('Failed to load real data:', error);
      // Fall back to mock data if real data fails
      await this.loadMockData();
    }
  }

  getPlayerStatus(player) {
    if (player.status === 'IR') return 'injured';
    if (player.status === 'O') return 'out';
    if (player.status === 'Q') return 'questionable';
    if (player.status === 'D') return 'doubtful';
    return 'healthy';
  }

  getPlayerPoints(player) {
    // Get current week points if available
    if (player.player_stats?.stats) {
      const pointsStat = player.player_stats.stats.find(stat => 
        stat.stat_id === '0' // Points stat ID
      );
      return parseFloat(pointsStat?.value || 0);
    }
    return 0;
  }

  getPlayerProjected(player) {
    // Get projected points if available
    if (player.player_projected_stats?.stats) {
      const projectedStat = player.player_projected_stats.stats.find(stat => 
        stat.stat_id === '0' // Points stat ID
      );
      return parseFloat(projectedStat?.value || 0);
    }
    return 0;
  }

  async loadMockData() {
    // Fallback mock data for when real data fails
    console.log('Using mock data as fallback');
    
    this.state.currentTeam = {
      name: 'My Fantasy Team',
      wins: 5,
      losses: 2,
      rank: 2,
      pointsFor: 856.5,
      pointsAgainst: 742.3
    };

    this.state.roster = [
      { id: 1, name: 'Patrick Mahomes', position: 'QB', team: 'KC', status: 'healthy', points: 28.5, projected: 26.0, photo: null },
      { id: 2, name: 'Christian McCaffrey', position: 'RB', team: 'SF', status: 'healthy', points: 24.3, projected: 22.0, photo: null },
      { id: 3, name: 'Tyreek Hill', position: 'WR', team: 'MIA', status: 'healthy', points: 19.8, projected: 18.5, photo: null },
      { id: 4, name: 'Travis Kelce', position: 'TE', team: 'KC', status: 'questionable', points: 15.2, projected: 14.0, photo: null },
      { id: 5, name: 'Justin Jefferson', position: 'WR', team: 'MIN', status: 'healthy', points: 21.1, projected: 19.5, photo: null }
    ];

    this.state.currentMatchup = {
      myScore: 112.3,
      oppScore: 98.7,
      oppName: 'Opponent Team'
    };
  }

  updateDashboardUI() {
    // Update team stats
    document.getElementById('wins').textContent = this.state.currentTeam.wins;
    document.getElementById('losses').textContent = this.state.currentTeam.losses;
    document.getElementById('rank').textContent = `#${this.state.currentTeam.rank}`;
    document.getElementById('points-for').textContent = Math.round(this.state.currentTeam.pointsFor);
    document.getElementById('avg-points').textContent = 
      (this.state.currentTeam.pointsFor / (this.state.currentTeam.wins + this.state.currentTeam.losses)).toFixed(1);

    // Update matchup
    document.getElementById('my-score').textContent = this.state.currentMatchup.myScore;
    document.getElementById('opp-score').textContent = this.state.currentMatchup.oppScore;
    document.getElementById('opp-name').textContent = this.state.currentMatchup.oppName;

    // Render roster
    this.renderRoster();
  }

  renderRoster() {
    const grid = document.getElementById('roster-grid');
    if (!grid) return;

    grid.innerHTML = this.state.roster.map(player => `
      <div class="player-card" data-player-id="${player.id}">
        <div class="flex items-start justify-between">
          <div class="flex items-start space-x-3">
            <div class="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
              ${player.photo ? 
                `<img src="${player.photo}" alt="${player.name}" class="w-12 h-12 rounded-full">` :
                `<span class="text-xl font-bold text-gray-500">${player.position}</span>`
              }
            </div>
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white">${player.name}</h4>
              <p class="text-sm text-gray-500 dark:text-gray-400">${player.position} - ${player.team}</p>
            </div>
          </div>
          <span class="px-2 py-1 text-xs rounded-full player-status-${player.status}">
            ${player.status}
          </span>
        </div>
        <div class="mt-4 grid grid-cols-2 gap-2 text-sm">
          <div>
            <span class="text-gray-500 dark:text-gray-400">Points:</span>
            <span class="ml-2 font-semibold text-gray-900 dark:text-white">${player.points}</span>
          </div>
          <div>
            <span class="text-gray-500 dark:text-gray-400">Proj:</span>
            <span class="ml-2 font-semibold text-gray-900 dark:text-white">${player.projected}</span>
          </div>
        </div>
      </div>
    `).join('');

    // Add click handlers to player cards
    grid.querySelectorAll('.player-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const playerId = e.currentTarget.dataset.playerId;
        this.showPlayerDetail(playerId);
      });
    });
  }

  async loadAIInsights() {
    // Load latest AI insight for the insights bar
    const insightText = document.getElementById('ai-insight-text');
    if (insightText) {
      // This would normally fetch from the API
      insightText.textContent = 'Consider starting your bench WR this week - favorable matchup detected against weak secondary.';
    }

    // Set AI confidence
    const confidence = 85;
    document.getElementById('ai-confidence').textContent = confidence;
    document.getElementById('confidence-bar').style.width = `${confidence}%`;
  }

  async submitAIQuery() {
    const input = document.getElementById('ai-query-input');
    const query = input?.value.trim();
    
    if (!query) return;

    this.showLoading(true);
    
    try {
      // This would normally call the AI API
      const response = await fetch('/api/ai/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query })
      });

      if (!response.ok) throw new Error('AI query failed');

      const result = await response.json();
      this.displayAIResponse(result);
      
      // Clear input
      if (input) input.value = '';
    } catch (error) {
      console.error('AI query error:', error);
      // For now, show a mock response
      this.displayAIResponse({
        content: 'AI analysis would appear here. Please ensure your Perplexity API key is configured in the .env file.',
        confidence: 0.75
      });
    } finally {
      this.showLoading(false);
    }
  }

  displayAIResponse(response) {
    const container = document.getElementById('recent-insights');
    if (!container) return;

    const insight = document.createElement('div');
    insight.className = 'ai-insight-card mb-4 animate-slideIn';
    insight.innerHTML = `
      <div class="flex items-start justify-between mb-2">
        <span class="text-sm font-medium text-purple-600 dark:text-purple-400">AI Analysis</span>
        <span class="text-xs ${response.confidence > 0.8 ? 'confidence-high' : response.confidence > 0.6 ? 'confidence-medium' : 'confidence-low'}">
          ${Math.round(response.confidence * 100)}% confident
        </span>
      </div>
      <p class="text-sm text-gray-700 dark:text-gray-300">${response.content}</p>
      <div class="mt-2 text-xs text-gray-500 dark:text-gray-400">
        ${new Date().toLocaleTimeString()}
      </div>
    `;

    container.insertBefore(insight, container.firstChild);
  }

  switchTab(tabName) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
      if (btn.dataset.tab === tabName) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });

    // Show/hide tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
      if (pane.id === `${tabName}-tab`) {
        pane.classList.remove('hidden');
      } else {
        pane.classList.add('hidden');
      }
    });

    this.state.activeTab = tabName;

    // Load tab-specific data if needed
    if (tabName === 'analytics') {
      this.loadAnalytics();
    }
  }

  loadAnalytics() {
    // Initialize charts if not already done
    const ctx = document.getElementById('points-trend-chart');
    if (ctx && !this.pointsChart) {
      this.pointsChart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7'],
          datasets: [{
            label: 'Actual Points',
            data: [95, 112, 98, 125, 118, 132, 112],
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4
          }, {
            label: 'Projected Points',
            data: [100, 105, 102, 115, 120, 125, 118],
            borderColor: 'rgb(156, 163, 175)',
            borderDash: [5, 5],
            backgroundColor: 'rgba(156, 163, 175, 0.1)',
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
            }
          }
        }
      });
    }
  }

  showPlayerDetail(playerId) {
    const player = this.state.roster.find(p => p.id == playerId);
    if (!player) return;

    // This would normally open a modal with detailed player info
    this.showToast(`Viewing ${player.name}'s details`, 'info');
  }

  toggleTheme() {
    this.state.theme = this.state.theme === 'light' ? 'dark' : 'light';
    this.applyTheme(this.state.theme);
  }

  applyTheme(theme) {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }

  showLoading(show) {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
      if (show) {
        overlay.classList.remove('hidden');
      } else {
        overlay.classList.add('hidden');
      }
    }
  }

  showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="flex-1">
        <p class="text-sm font-medium text-gray-900 dark:text-white">${message}</p>
      </div>
      <button onclick="this.parentElement.remove()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
        </svg>
      </button>
    `;

    document.body.appendChild(toast);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      toast.remove();
    }, 5000);
  }

  startAutoRefresh() {
    // Refresh dashboard every 5 minutes
    setInterval(() => {
      this.loadDashboard();
    }, 5 * 60 * 1000);
  }

  showSettings() {
    document.getElementById('settings-modal')?.classList.remove('hidden');
  }

  hideSettings() {
    document.getElementById('settings-modal')?.classList.add('hidden');
  }

  async logout() {
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        this.state.isAuthenticated = false;
        this.hideSettings();
        this.showWelcomeScreen();
      }
    } catch (error) {
      console.error('Logout failed:', error);
    }
  }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.fantasyApp = new FantasyTrackerApp();
});