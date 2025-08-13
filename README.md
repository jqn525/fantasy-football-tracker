# Fantasy Football Tracker Pro 🏈

An AI-powered Yahoo Fantasy Football tracker with real-time insights, automated research, and beautiful visualizations.

## Features

### Core Functionality
- 📊 **Real-time Dashboard** - Track your team's performance with live updates
- 🤖 **AI-Powered Insights** - Perplexity AI integration for intelligent analysis
- 📈 **Advanced Analytics** - Visualize trends and patterns with Chart.js
- 🔄 **Automated Updates** - Scheduled data fetching and news aggregation
- 🎨 **Beautiful UI** - Modern, responsive design with dark/light modes

### AI Features (Powered by Perplexity)
- **Start/Sit Recommendations** - AI analyzes matchups and provides confidence scores
- **Trade Evaluator** - Get detailed trade analysis with market values
- **Injury Impact Analysis** - Understand how injuries affect your lineup
- **Waiver Wire Intelligence** - Discover hidden gems before your league
- **Custom Queries** - Ask anything about your team and get expert analysis

## Quick Start

### Prerequisites
- Node.js v18+ and npm
- Yahoo Fantasy account
- Perplexity API key (optional but recommended for AI features)

### Installation

1. **Clone or download the project**
   ```bash
   cd fantasy-football-tracker
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Edit the `.env` file with your credentials:
   ```env
   # Yahoo API (required)
   YAHOO_CLIENT_ID=your-yahoo-client-id
   YAHOO_CLIENT_SECRET=your-yahoo-client-secret
   
   # Perplexity AI (optional but recommended)
   PERPLEXITY_API_KEY=your-perplexity-api-key
   ```

4. **Initialize the database**
   ```bash
   npm run init-db
   ```

5. **Start the application**
   ```bash
   npm start
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

## Setting Up Yahoo API Access

1. Go to [Yahoo Developer Network](https://developer.yahoo.com)
2. Click "My Apps" → "Create New App"
3. Configure your app:
   - **Application Name**: Fantasy Tracker Pro
   - **Application Type**: Web Application
   - **Redirect URI**: `http://localhost:3000/auth/callback`
   - **API Permissions**: Fantasy Sports Read/Write
4. Copy the Client ID and Client Secret to your `.env` file

## Setting Up Perplexity AI (Recommended)

1. Get your API key from [Perplexity AI](https://www.perplexity.ai)
2. Add it to your `.env` file:
   ```env
   PERPLEXITY_API_KEY=pplx-xxxxxxxxxxxxx
   ```

## Usage Guide

### First Time Setup
1. Click "Connect with Yahoo Fantasy" on the welcome screen
2. Authorize the app to access your Yahoo Fantasy data
3. Your dashboard will automatically load with your team data

### Dashboard Features

#### AI Assistant
- Click the "Ask AI" button to get custom analysis
- Examples of questions to ask:
  - "Should I start Player A or Player B this week?"
  - "Is this trade fair: giving X for Y?"
  - "Who should I pick up from waivers?"
  - "What's the weather impact for outdoor games?"

#### Roster Management
- View all your players with status indicators
- Click any player for detailed stats and projections
- Drag and drop to reorder (coming soon)

#### Analytics
- View point trends over the season
- Compare actual vs projected performance
- Position-based scoring breakdowns

### Automated Features

The app automatically:
- Refreshes data every 30 minutes
- Fetches news every hour
- Updates live scores during games (Sundays)
- Generates AI insights at key times:
  - 8 AM: Daily brief
  - Thursday 6 PM: TNF analysis
  - Sunday 11 AM: Final lineup recommendations
  - Tuesday 10 AM: Waiver wire research

## Development

### Run in development mode
```bash
npm run dev
```

### Project Structure
```
fantasy-football-tracker/
├── api/              # Express API routes
├── services/         # Business logic (Yahoo API, Perplexity, etc.)
├── db/               # SQLite database files
├── public/           # Frontend files (HTML, CSS, JS)
├── server.js         # Main Express server
└── .env              # Configuration (don't commit!)
```

## Troubleshooting

### "AI service unavailable"
- Check that your Perplexity API key is correctly set in `.env`
- Ensure you have API credits available

### "Yahoo authentication failed"
- Verify your Yahoo Client ID and Secret
- Make sure the redirect URI matches exactly

### Database errors
- Run `npm run init-db` to reinitialize
- Check that the `db` folder has write permissions

## Customization

### Changing the AI Model
In `.env`, adjust:
```env
PERPLEXITY_MODEL=pplx-7b-online  # Faster, cheaper
# or
PERPLEXITY_MODEL=pplx-70b-online  # More accurate (default)
```

### Adjusting Refresh Intervals
```env
REFRESH_INTERVAL_MINUTES=30  # Dashboard refresh
AI_RESEARCH_INTERVAL_HOURS=6  # AI analysis frequency
```

## Security Notes

- Never commit your `.env` file
- Keep your API keys secret
- Use strong session secrets in production
- Enable HTTPS in production environments

## Future Enhancements

- [ ] Mobile app (React Native)
- [ ] League chat integration
- [ ] Trade negotiation system
- [ ] Draft assistant
- [ ] Dynasty league features
- [ ] DFS integration
- [ ] Discord bot

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review your `.env` configuration
3. Ensure all dependencies are installed
4. Check browser console for errors

## License

MIT - Feel free to customize for your personal use!

---

Built with ❤️ for fantasy football enthusiasts who want an edge with AI-powered insights.