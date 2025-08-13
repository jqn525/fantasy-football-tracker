# Deployment Guide - Vercel + Turso

This guide walks you through deploying your Fantasy Football Tracker to Vercel with Turso database.

## Prerequisites

- GitHub account
- Node.js installed locally
- Your Yahoo API credentials ready
- Your Perplexity API key (optional but recommended)

## Step 1: Set Up Turso Database

### 1.1 Install Turso CLI

```bash
# macOS/Linux
curl -sSfL https://get.turso.tech/install.sh | bash

# Windows (use WSL or Git Bash)
curl -sSfL https://get.turso.tech/install.sh | bash
```

### 1.2 Create Turso Account

```bash
turso auth signup
# Follow the prompts to create account
```

### 1.3 Create Database

```bash
# Create database
turso db create fantasy-tracker

# Get connection URL (save this!)
turso db show fantasy-tracker --url
# Output: libsql://fantasy-tracker-[username].turso.io

# Create auth token (save this!)
turso db tokens create fantasy-tracker
# Output: eyJhbGc...long-token-string
```

### 1.4 Initialize Database Schema

```bash
# Set environment variables temporarily
export TURSO_DATABASE_URL="libsql://fantasy-tracker-[username].turso.io"
export TURSO_AUTH_TOKEN="your-token-from-above"

# Run initialization
npm run init-db
```

You should see: "✅ Turso database initialized successfully"

## Step 2: Prepare GitHub Repository

### 2.1 Initialize Git (if needed)

```bash
git init
git add .
git commit -m "Initial commit - Fantasy Football Tracker"
```

### 2.2 Create GitHub Repository

1. Go to [github.com/new](https://github.com/new)
2. Name: `fantasy-football-tracker`
3. Keep it public or private (your choice)
4. DON'T initialize with README (you have one)
5. Create repository

### 2.3 Push to GitHub

```bash
git remote add origin https://github.com/YOUR_USERNAME/fantasy-football-tracker.git
git branch -M main
git push -u origin main
```

## Step 3: Deploy to Vercel

### 3.1 Install Vercel CLI

```bash
npm i -g vercel
```

### 3.2 Deploy

```bash
vercel
```

Follow the prompts:
- Login/signup to Vercel
- Link to existing project? **No**
- What's your project name? **fantasy-football-tracker**
- Which directory? **./** (current)
- Want to override settings? **No**

### 3.3 Add Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

| Variable | Value | Notes |
|----------|-------|-------|
| `NODE_ENV` | `production` | |
| `SESSION_SECRET` | Generate a 32+ character random string | Use a password generator |
| `YAHOO_CLIENT_ID` | Your Yahoo Client ID | From Yahoo Developer |
| `YAHOO_CLIENT_SECRET` | Your Yahoo Client Secret | Keep this secret! |
| `YAHOO_REDIRECT_URI` | `https://[your-app].vercel.app/auth/callback` | Use your Vercel URL |
| `TURSO_DATABASE_URL` | `libsql://fantasy-tracker-[username].turso.io` | From Step 1.3 |
| `TURSO_AUTH_TOKEN` | Your Turso token | From Step 1.3 |
| `PERPLEXITY_API_KEY` | `pplx-...` | Your Perplexity key |
| `PERPLEXITY_MODEL` | `pplx-70b-online` | |
| `AI_RESEARCH_ENABLED` | `true` | |

### 3.4 Redeploy with Environment Variables

```bash
vercel --prod
```

Your app is now live at: `https://fantasy-football-tracker.vercel.app`

## Step 4: Update Yahoo App

1. Go to [developer.yahoo.com](https://developer.yahoo.com)
2. Click **My Apps** → Select your app
3. Click **Update App**
4. Add to Redirect URI(s):
   - Keep: `http://localhost:3000/auth/callback`
   - Add: `https://fantasy-football-tracker.vercel.app/auth/callback`
5. Save changes

## Step 5: Test Your Deployment

1. Visit your Vercel URL: `https://fantasy-football-tracker.vercel.app`
2. Click "Connect with Yahoo Fantasy"
3. Authorize the app
4. Your dashboard should load with your fantasy data!

## Troubleshooting

### "Yahoo authentication failed"
- Check that YAHOO_REDIRECT_URI in Vercel matches exactly what's in Yahoo app
- Ensure both CLIENT_ID and SECRET are correct in Vercel env vars

### "Database error"
- Verify TURSO_DATABASE_URL and TURSO_AUTH_TOKEN are set correctly
- Try running `turso db shell fantasy-tracker` to test connection

### "AI service unavailable"
- Check PERPLEXITY_API_KEY is set and valid
- Ensure you have credits in your Perplexity account

### "Application error" on Vercel
- Check Vercel function logs: Dashboard → Functions → View logs
- Common issue: Missing environment variables

## Custom Domain (Optional)

1. Buy domain (e.g., from Namecheap, GoDaddy)
2. In Vercel: Settings → Domains → Add
3. Follow DNS configuration instructions
4. Update Yahoo redirect URI to use custom domain

## Monitoring

### Vercel Dashboard
- View deployments and logs
- Monitor function execution
- Check error rates

### Turso Dashboard
- Monitor database usage at [turso.tech](https://turso.tech)
- View query performance
- Check storage usage

## Updating Your App

```bash
# Make changes locally
git add .
git commit -m "Update description"
git push

# Vercel auto-deploys from GitHub
# Or manually:
vercel --prod
```

## Free Tier Limits

### Vercel
- 100GB bandwidth/month
- Unlimited deployments
- Automatic HTTPS

### Turso
- 8GB total storage
- 1 billion row reads/month
- 25 million row writes/month

### Perplexity
- Pay as you go
- ~$0.001 per request

## Security Checklist

✅ Never commit `.env` file  
✅ Use strong SESSION_SECRET  
✅ Keep Yahoo CLIENT_SECRET secure  
✅ Enable 2FA on GitHub  
✅ Enable 2FA on Vercel  
✅ Rotate API keys regularly  

## Support

- Vercel: [vercel.com/docs](https://vercel.com/docs)
- Turso: [docs.turso.tech](https://docs.turso.tech)
- Yahoo Fantasy API: [developer.yahoo.com/fantasysports](https://developer.yahoo.com/fantasysports)

## Next Steps

1. Test all features in production
2. Set up error monitoring (e.g., Sentry)
3. Add custom domain
4. Share with your league!

---

Congratulations! Your Fantasy Football Tracker is now live and ready to help you dominate your league! 🏈🎉