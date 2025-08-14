let YahooFantasy;

try {
  YahooFantasy = require('yahoo-fantasy');
} catch (error) {
  console.error('yahoo-fantasy package not available:', error.message);
  YahooFantasy = null;
}

class YahooClient {
  constructor() {
    this.yf = null;
    this.isAuthenticated = false;
    this.isInitialized = false;
  }

  async initialize() {
    try {
      // Check if required environment variables are present
      if (!process.env.YAHOO_CLIENT_ID || !process.env.YAHOO_CLIENT_SECRET) {
        console.warn('Yahoo API credentials not configured. Yahoo features will be disabled.');
        return false;
      }

      if (!YahooFantasy) {
        console.error('yahoo-fantasy package not available. Yahoo features will be disabled.');
        return false;
      }

      this.yf = new YahooFantasy(
        process.env.YAHOO_CLIENT_ID,
        process.env.YAHOO_CLIENT_SECRET,
        process.env.YAHOO_REDIRECT_URI || 'http://localhost:3000/api/auth/callback'
      );
      
      this.isInitialized = true;
      console.log('Yahoo Fantasy client initialized');
      return true;
    } catch (error) {
      console.error('Failed to initialize Yahoo Fantasy client:', error);
      this.isInitialized = false;
      return false;
    }
  }

  getAuthUrl() {
    if (!this.isInitialized || !this.yf) {
      throw new Error('Yahoo client not initialized');
    }
    return this.yf.auth();
  }

  async authenticate(authCode) {
    try {
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize Yahoo client');
        }
      }

      if (!this.yf) {
        throw new Error('Yahoo client not available');
      }

      const tokens = await this.yf.auth(authCode);
      
      if (tokens && tokens.access_token) {
        this.isAuthenticated = true;
        console.log('Yahoo authentication successful');
        return tokens;
      } else {
        throw new Error('No access token received');
      }
    } catch (error) {
      console.error('Yahoo authentication failed:', error);
      throw error;
    }
  }

  async setTokens(accessToken, refreshToken) {
    try {
      if (!this.yf) {
        await this.initialize();
      }

      this.yf.setUserToken(accessToken);
      if (refreshToken) {
        this.yf.setRefreshToken(refreshToken);
      }
      
      this.isAuthenticated = true;
      console.log('Yahoo tokens set successfully');
    } catch (error) {
      console.error('Failed to set Yahoo tokens:', error);
      throw error;
    }
  }

  async refreshTokens() {
    try {
      if (!this.yf) {
        throw new Error('Yahoo client not initialized');
      }

      const newTokens = await this.yf.refresh();
      console.log('Yahoo tokens refreshed successfully');
      return newTokens;
    } catch (error) {
      console.error('Failed to refresh Yahoo tokens:', error);
      throw error;
    }
  }

  async getUserLeagues(gameKey = 'nfl') {
    try {
      if (!this.isInitialized || !this.yf) {
        throw new Error('Yahoo client not initialized');
      }

      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const userGames = await this.yf.user.games();
      console.log('User games:', userGames);

      // Find the current NFL season
      const nflGame = userGames.find(game => 
        game.game_key.includes(gameKey) && 
        game.is_registration_over === '1'
      );

      if (!nflGame) {
        throw new Error('No active NFL fantasy leagues found');
      }

      const leagues = await this.yf.user.game_leagues(nflGame.game_key);
      console.log('User leagues:', leagues);
      
      return leagues;
    } catch (error) {
      console.error('Failed to get user leagues:', error);
      throw error;
    }
  }

  async getLeagueInfo(leagueKey) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const leagueInfo = await this.yf.league.meta(leagueKey);
      console.log('League info:', leagueInfo);
      return leagueInfo;
    } catch (error) {
      console.error('Failed to get league info:', error);
      throw error;
    }
  }

  async getUserTeams(leagueKey) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const teams = await this.yf.league.teams(leagueKey);
      console.log('League teams:', teams);

      // Find the user's team
      const userTeam = teams.find(team => team.is_owned_by_current_login === '1');
      
      return {
        userTeam,
        allTeams: teams
      };
    } catch (error) {
      console.error('Failed to get user teams:', error);
      throw error;
    }
  }

  async getTeamRoster(teamKey) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const roster = await this.yf.team.roster(teamKey);
      console.log('Team roster:', roster);
      return roster;
    } catch (error) {
      console.error('Failed to get team roster:', error);
      throw error;
    }
  }

  async getMatchups(leagueKey, week = null) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const matchups = week 
        ? await this.yf.league.scoreboard(leagueKey, week)
        : await this.yf.league.scoreboard(leagueKey);
      
      console.log('League matchups:', matchups);
      return matchups;
    } catch (error) {
      console.error('Failed to get matchups:', error);
      throw error;
    }
  }

  async getPlayerStats(playerKeys, statType = 'stats') {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const players = await this.yf.players.stats(playerKeys, statType);
      console.log('Player stats:', players);
      return players;
    } catch (error) {
      console.error('Failed to get player stats:', error);
      throw error;
    }
  }

  async getCurrentWeek(leagueKey) {
    try {
      if (!this.isAuthenticated) {
        throw new Error('Not authenticated with Yahoo');
      }

      const leagueInfo = await this.yf.league.meta(leagueKey);
      return leagueInfo.current_week || 1;
    } catch (error) {
      console.error('Failed to get current week:', error);
      return 1;
    }
  }
}

module.exports = new YahooClient();