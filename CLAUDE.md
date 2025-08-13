# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Yahoo Fantasy Football tracker application with AI-powered insights via Perplexity API integration. The app uses a Node.js/Express backend with SQLite database and a vanilla JavaScript frontend with Tailwind CSS.

## Essential Commands

```bash
# Install dependencies
npm install

# Initialize/reset database
npm run init-db

# Start production server
npm start

# Development with auto-reload
npm run dev

# Run test suite (if tests exist)
npm test

# Start background scheduler for automated tasks
npm run scheduler
```

## Architecture Overview

### Tech Stack
- **Backend**: Express.js with session-based authentication
- **Database**: SQLite3 with promise-based wrapper
- **Frontend**: Vanilla JavaScript with Tailwind CSS (CDN) and Chart.js
- **AI Integration**: Perplexity API for fantasy football analysis

### Core Services Architecture

1. **Authentication Flow**: 
   - Currently uses mock authentication at `/api/auth/yahoo` for development
   - Real Yahoo OAuth2 flow is stubbed but not implemented
   - Session-based auth stored in Express sessions

2. **Perplexity AI Integration** (`services/perplexityAgent.js`):
   - Central AI service that handles all Perplexity API calls
   - Key methods: `performResearch()`, `analyzeStartSit()`, `evaluateTrade()`, `generateWaiverRecommendations()`
   - Automatically saves insights to database for historical tracking
   - Confidence scoring system for recommendations

3. **Database Layer** (`db/database.js`):
   - SQLite with promise wrappers (`runAsync`, `getAsync`, `allAsync`)
   - Schema includes tables for: leagues, teams, players, roster, player_stats, news, ai_insights, research_schedule
   - WAL mode enabled for better concurrency

4. **Frontend State Management** (`public/js/app.js`):
   - Single `FantasyTrackerApp` class manages all state
   - Mock data currently used when Yahoo API not configured
   - Real-time updates via polling (5-minute intervals)

## API Structure

- `/api/auth/*` - Authentication endpoints (mock implementation)
- `/api/ai/*` - AI query endpoints (Perplexity integration)
- `/api/league/*` - League data (not implemented)
- `/api/players/*` - Player/roster data (not implemented)
- `/api/news/*` - News aggregation (not implemented)

## Environment Configuration

Required in `.env`:
```
YAHOO_CLIENT_ID=<required for Yahoo API>
YAHOO_CLIENT_SECRET=<required for Yahoo API>
PERPLEXITY_API_KEY=<required for AI features>
```

## Current Implementation Status

### Completed
- Full Express server setup with security middleware
- SQLite database schema and initialization
- Perplexity AI service integration
- Frontend UI with dark mode and responsive design
- Mock authentication flow for testing
- AI query system with confidence scoring

### Not Yet Implemented
- Yahoo Fantasy API integration (`services/yahooClient.js` missing)
- Real OAuth2 authentication flow
- News aggregation service
- Automated scheduling system
- Trade analyzer feature
- Waiver wire recommendations
- Live data fetching from Yahoo

## Development Notes

1. **Mock Mode**: The app runs in mock mode when Yahoo credentials are not configured, using hardcoded sample data in `app.js`

2. **AI Features**: Perplexity integration is complete but requires API key. Without it, AI endpoints return 503 errors.

3. **Database**: Run `npm run init-db` to reset database. Schema includes all tables but most are unused until Yahoo integration is complete.

4. **Frontend**: Uses CDN versions of Tailwind CSS and Chart.js. No build process required.

5. **Session Secret**: Default session secret should be changed in production.

## Key Files to Modify

- `services/yahooClient.js` - Needs creation for Yahoo API integration
- `api/league.js`, `api/players.js`, `api/news.js` - Need implementation
- `services/scheduler.js` - Needs creation for automated tasks
- `services/newsAggregator.js` - Needs creation for news fetching

## Testing

Run `node test-server.js` while server is running to verify basic functionality. This tests health endpoint, auth status, and static file serving.