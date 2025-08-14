const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const path = require('path');
const morgan = require('morgan');
require('dotenv').config();

const app = express();

// Validate critical environment variables
const requiredEnvVars = ['SESSION_SECRET'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  console.warn(`Missing environment variables: ${missingEnvVars.join(', ')}`);
  console.warn('Some features may not work correctly.');
}

// Set default values for missing environment variables
if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = 'fallback-session-secret-change-in-production';
  console.warn('Using fallback session secret. Please set SESSION_SECRET environment variable.');
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.tailwindcss.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https://api.perplexity.ai"],
    }
  }
}));

// Middleware
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Static files
app.use(express.static('public'));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }
}));

// Token refresh middleware
app.use(async (req, res, next) => {
  // Check if tokens need refresh for authenticated sessions
  if (req.session.authenticated && req.session.tokenExpiry) {
    const timeUntilExpiry = req.session.tokenExpiry - Date.now();
    
    // Refresh if token expires in less than 1 hour
    if (timeUntilExpiry < 60 * 60 * 1000) {
      try {
        const yahooClient = require('./services/yahooClient');
        await yahooClient.setTokens(req.session.accessToken, req.session.refreshToken);
        const newTokens = await yahooClient.refreshTokens();
        
        req.session.accessToken = newTokens.access_token;
        req.session.refreshToken = newTokens.refresh_token;
        req.session.tokenExpiry = Date.now() + (newTokens.expires_in * 1000);
        
        console.log('Yahoo tokens refreshed automatically');
      } catch (error) {
        console.error('Auto token refresh failed:', error);
        // Don't fail the request, just log the error
      }
    }
  }
  next();
});

// Error handling for missing database initialization
app.use((req, res, next) => {
  // Skip database check for static files and health check
  if (req.path.startsWith('/api/') && req.path !== '/api/health') {
    try {
      const db = require('./db/database');
      // Database is available
      next();
    } catch (error) {
      console.error('Database connection error:', error);
      // Continue anyway - some features may work without database
      next();
    }
  } else {
    next();
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/ai', require('./api/ai'));
app.use('/api/league', require('./api/league'));
app.use('/api/players', require('./api/players'));
// app.use('/api/news', require('./api/news'));

// Serve index.html for all other routes (SPA support)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({ 
    error: process.env.NODE_ENV === 'production' 
      ? 'Something went wrong!' 
      : err.message 
  });
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🏈 Fantasy Football Tracker running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
  
  if (!process.env.YAHOO_CLIENT_ID || process.env.YAHOO_CLIENT_ID === 'your-yahoo-client-id') {
    console.log('⚠️  Warning: Yahoo API credentials not configured. Update .env file.');
  }
  
  if (!process.env.PERPLEXITY_API_KEY || process.env.PERPLEXITY_API_KEY === 'your-perplexity-api-key') {
    console.log('⚠️  Warning: Perplexity API key not configured. AI features will be disabled.');
  }
});

module.exports = app;