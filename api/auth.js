const router = require('express').Router();

// Mock authentication for development
// In production, this would integrate with Yahoo OAuth

// Check authentication status
router.get('/status', (req, res) => {
  res.json({
    authenticated: req.session.authenticated || false,
    user: req.session.user || null
  });
});

// Mock login endpoint
router.get('/yahoo', (req, res) => {
  // In production, this would redirect to Yahoo OAuth
  // For now, we'll simulate a successful auth
  res.redirect('/api/auth/callback?mock=true');
});

// OAuth callback
router.get('/callback', (req, res) => {
  // Mock authentication for development
  if (req.query.mock) {
    req.session.authenticated = true;
    req.session.user = {
      id: 'mock-user-123',
      name: 'Fantasy Player',
      email: 'user@example.com'
    };
    req.session.accessToken = 'mock-access-token';
    req.session.save((err) => {
      if (err) console.error('Session save error:', err);
      res.redirect('/');
    });
  } else {
    // Handle real Yahoo OAuth callback here
    res.status(501).json({ error: 'Yahoo OAuth not yet implemented' });
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