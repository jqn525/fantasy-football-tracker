const router = require('express').Router();
const yahooClient = require('../services/yahooClient');

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.session.authenticated || false,
    user: req.session.user || null
  });
});

// Yahoo OAuth login endpoint
router.get('/yahoo', async (req, res) => {
  try {
    // Initialize Yahoo client if needed
    await yahooClient.initialize();
    
    // Get Yahoo OAuth URL
    const authUrl = yahooClient.getAuthUrl();
    console.log('Redirecting to Yahoo OAuth:', authUrl);
    
    // Redirect to Yahoo OAuth
    res.redirect(authUrl);
  } catch (error) {
    console.error('Yahoo OAuth initiation failed:', error);
    res.status(500).json({ error: 'Failed to initiate Yahoo authentication' });
  }
});

// OAuth callback
router.get('/callback', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      throw new Error('No authorization code received from Yahoo');
    }

    console.log('Received auth code from Yahoo:', code);

    // Exchange code for tokens
    const tokens = await yahooClient.authenticate(code);
    
    if (!tokens || !tokens.access_token) {
      throw new Error('Failed to receive access token from Yahoo');
    }

    // Store tokens and user info in session
    req.session.authenticated = true;
    req.session.accessToken = tokens.access_token;
    req.session.refreshToken = tokens.refresh_token;
    req.session.tokenExpiry = Date.now() + (tokens.expires_in * 1000);
    
    // Get user information from Yahoo
    try {
      const leagues = await yahooClient.getUserLeagues();
      req.session.user = {
        id: tokens.yahoo_guid || 'yahoo-user',
        name: 'Yahoo Fantasy User',
        email: null,
        leagues: leagues || []
      };
    } catch (userError) {
      console.error('Failed to get user leagues:', userError);
      // Still authenticate even if we can't get leagues initially
      req.session.user = {
        id: tokens.yahoo_guid || 'yahoo-user',
        name: 'Yahoo Fantasy User',
        email: null,
        leagues: []
      };
    }

    // Save session and redirect
    req.session.save((err) => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to save session' });
      }
      
      console.log('Yahoo authentication successful, redirecting to dashboard');
      res.redirect('/');
    });

  } catch (error) {
    console.error('Yahoo OAuth callback error:', error);
    res.status(500).json({ 
      error: 'Authentication failed',
      details: error.message
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    res.json({ success: true });
  });
});

module.exports = router;