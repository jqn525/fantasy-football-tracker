const router = require('express').Router();
const yahooClient = require('../services/yahooClient');

// Middleware to ensure authentication and set up Yahoo client
const ensureAuth = async (req, res, next) => {
  if (!req.session.authenticated || !req.session.accessToken) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    await yahooClient.setTokens(req.session.accessToken, req.session.refreshToken);
    next();
  } catch (error) {
    console.error('Failed to set Yahoo tokens:', error);
    return res.status(401).json({ error: 'Invalid authentication tokens' });
  }
};

// Get team roster
router.get('/roster/:teamKey', ensureAuth, async (req, res) => {
  try {
    const { teamKey } = req.params;
    const roster = await yahooClient.getTeamRoster(teamKey);
    res.json(roster);
  } catch (error) {
    console.error('Failed to get roster:', error);
    res.status(500).json({ error: 'Failed to fetch roster' });
  }
});

// Get player stats
router.get('/stats', ensureAuth, async (req, res) => {
  try {
    const { player_keys, stat_type = 'stats' } = req.query;
    
    if (!player_keys) {
      return res.status(400).json({ error: 'player_keys parameter required' });
    }

    const playerKeys = Array.isArray(player_keys) ? player_keys : [player_keys];
    const stats = await yahooClient.getPlayerStats(playerKeys, stat_type);
    
    res.json(stats);
  } catch (error) {
    console.error('Failed to get player stats:', error);
    res.status(500).json({ error: 'Failed to fetch player stats' });
  }
});

// Get user's primary team data (simplified endpoint)
router.get('/my-team', ensureAuth, async (req, res) => {
  try {
    // Get user's leagues
    const leagues = await yahooClient.getUserLeagues();
    
    if (!leagues || leagues.length === 0) {
      return res.status(404).json({ error: 'No leagues found' });
    }

    // Use the first league (or could be made configurable)
    const primaryLeague = leagues[0];
    const leagueKey = primaryLeague.league_key;

    // Get user's team in this league
    const { userTeam, allTeams } = await yahooClient.getUserTeams(leagueKey);
    
    if (!userTeam) {
      return res.status(404).json({ error: 'User team not found in league' });
    }

    // Get roster
    const roster = await yahooClient.getTeamRoster(userTeam.team_key);

    // Get current week and matchups
    const currentWeek = await yahooClient.getCurrentWeek(leagueKey);
    const matchups = await yahooClient.getMatchups(leagueKey, currentWeek);

    // Find user's current matchup
    const userMatchup = matchups.find(matchup => 
      matchup.teams.some(team => team.team_key === userTeam.team_key)
    );

    const response = {
      league: {
        key: leagueKey,
        name: primaryLeague.name,
        current_week: currentWeek
      },
      team: {
        key: userTeam.team_key,
        name: userTeam.name,
        wins: userTeam.team_standings?.wins || 0,
        losses: userTeam.team_standings?.losses || 0,
        ties: userTeam.team_standings?.ties || 0,
        points_for: userTeam.team_points?.total || 0,
        points_against: userTeam.team_standings?.points_against || 0,
        rank: userTeam.team_standings?.rank || 0
      },
      roster: roster || [],
      current_matchup: userMatchup || null,
      all_teams: allTeams || []
    };

    res.json(response);
  } catch (error) {
    console.error('Failed to get user team data:', error);
    res.status(500).json({ 
      error: 'Failed to fetch team data',
      details: error.message
    });
  }
});

module.exports = router;