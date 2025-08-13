#!/bin/bash

echo "🏈 Fantasy Football Tracker - Deployment Setup"
echo "=============================================="
echo ""

# Check if Turso CLI is installed
if ! command -v turso &> /dev/null; then
    echo "📦 Installing Turso CLI..."
    curl -sSfL https://get.turso.tech/install.sh | bash
    export PATH="$PATH:$HOME/.turso"
else
    echo "✅ Turso CLI already installed"
fi

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm i -g vercel
else
    echo "✅ Vercel CLI already installed"
fi

echo ""
echo "🔧 Step 1: Turso Database Setup"
echo "--------------------------------"
echo "Run these commands:"
echo ""
echo "1. Sign up/login to Turso:"
echo "   turso auth signup"
echo ""
echo "2. Create database:"
echo "   turso db create fantasy-tracker"
echo ""
echo "3. Get database URL:"
echo "   turso db show fantasy-tracker --url"
echo ""
echo "4. Create auth token:"
echo "   turso db tokens create fantasy-tracker"
echo ""
echo "Save both the URL and token - you'll need them!"
echo ""
read -p "Press Enter when you've completed Turso setup..."

echo ""
echo "🔧 Step 2: Initialize Turso Database"
echo "------------------------------------"
read -p "Enter your Turso Database URL: " TURSO_URL
read -p "Enter your Turso Auth Token: " TURSO_TOKEN

export TURSO_DATABASE_URL="$TURSO_URL"
export TURSO_AUTH_TOKEN="$TURSO_TOKEN"

echo "Initializing database schema..."
npm run init-db

echo ""
echo "🔧 Step 3: Git Repository"
echo "-------------------------"
if [ ! -d .git ]; then
    echo "Initializing git repository..."
    git init
    git add .
    git commit -m "Initial commit - Fantasy Football Tracker"
else
    echo "✅ Git repository already initialized"
fi

echo ""
echo "📝 Next Steps:"
echo "--------------"
echo "1. Create a GitHub repository at: https://github.com/new"
echo "2. Push your code:"
echo "   git remote add origin https://github.com/YOUR_USERNAME/fantasy-football-tracker.git"
echo "   git push -u origin main"
echo ""
echo "3. Deploy to Vercel:"
echo "   vercel"
echo ""
echo "4. Add environment variables in Vercel Dashboard:"
echo "   - TURSO_DATABASE_URL: $TURSO_URL"
echo "   - TURSO_AUTH_TOKEN: [your token]"
echo "   - YAHOO_CLIENT_ID: [from Yahoo Developer]"
echo "   - YAHOO_CLIENT_SECRET: [from Yahoo Developer]"
echo "   - YAHOO_REDIRECT_URI: https://[your-app].vercel.app/auth/callback"
echo "   - PERPLEXITY_API_KEY: [your Perplexity key]"
echo "   - SESSION_SECRET: [generate a secure random string]"
echo ""
echo "5. Update Yahoo app redirect URI to include your Vercel URL"
echo ""
echo "Full guide available in DEPLOYMENT.md"
echo ""
echo "🎉 Setup complete! Ready to deploy to Vercel!"