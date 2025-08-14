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

// Get user's leagues
router.get('/', ensureAuth, async (req, res) => {
  try {
    const leagues = await yahooClient.getUserLeagues();
    res.json(leagues);
  } catch (error) {
    console.error('Failed to get leagues:', error);
    res.status(500).json({ error: 'Failed to fetch leagues' });
  }
});

// Get specific league info
router.get('/:leagueKey', ensureAuth, async (req, res) => {
  try {
    const { leagueKey } = req.params;
    const leagueInfo = await yahooClient.getLeagueInfo(leagueKey);
    res.json(leagueInfo);
  } catch (error) {
    console.error('Failed to get league info:', error);
    res.status(500).json({ error: 'Failed to fetch league information' });
  }
});

// Get teams in a league
router.get('/:leagueKey/teams', ensureAuth, async (req, res) => {
  try {
    const { leagueKey } = req.params;
    const teams = await yahooClient.getUserTeams(leagueKey);
    res.json(teams);
  } catch (error) {
    console.error('Failed to get teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get matchups for a league
router.get('/:leagueKey/matchups/:week?', ensureAuth, async (req, res) => {
  try {
    const { leagueKey, week } = req.params;
    const matchups = await yahooClient.getMatchups(leagueKey, week);
    res.json(matchups);
  } catch (error) {
    console.error('Failed to get matchups:', error);
    res.status(500).json({ error: 'Failed to fetch matchups' });
  }
});

// Get current week for a league
router.get('/:leagueKey/current-week', ensureAuth, async (req, res) => {
  try {
    const { leagueKey } = req.params;
    const currentWeek = await yahooClient.getCurrentWeek(leagueKey);
    res.json({ current_week: currentWeek });
  } catch (error) {
    console.error('Failed to get current week:', error);
    res.status(500).json({ error: 'Failed to fetch current week' });
  }
});

module.exports = router;