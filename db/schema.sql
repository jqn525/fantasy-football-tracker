-- Leagues table
CREATE TABLE IF NOT EXISTS leagues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  yahoo_league_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  season INTEGER NOT NULL,
  current_week INTEGER DEFAULT 1,
  settings_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  yahoo_team_id VARCHAR(50) UNIQUE NOT NULL,
  league_id INTEGER NOT NULL,
  name VARCHAR(100) NOT NULL,
  owner_name VARCHAR(100),
  logo_url TEXT,
  standings_rank INTEGER,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points_for DECIMAL(10,2),
  points_against DECIMAL(10,2),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (league_id) REFERENCES leagues(id)
);

-- Players table
CREATE TABLE IF NOT EXISTS players (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  yahoo_player_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  position VARCHAR(10),
  nfl_team VARCHAR(10),
  photo_url TEXT,
  status VARCHAR(20) DEFAULT 'healthy',
  bye_week INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Roster table (many-to-many relationship)
CREATE TABLE IF NOT EXISTS roster (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  player_id INTEGER NOT NULL,
  position_type VARCHAR(20) NOT NULL, -- 'starter', 'bench', 'ir'
  roster_position VARCHAR(10), -- 'QB', 'RB1', 'RB2', etc.
  acquired_date DATE,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(team_id, player_id)
);

-- Player stats table
CREATE TABLE IF NOT EXISTS player_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER NOT NULL,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  points DECIMAL(10,2),
  projected_points DECIMAL(10,2),
  stats_json TEXT, -- Store detailed stats as JSON
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id),
  UNIQUE(player_id, week, season)
);

-- News table
CREATE TABLE IF NOT EXISTS news (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  player_id INTEGER,
  headline VARCHAR(500) NOT NULL,
  body TEXT,
  source VARCHAR(100),
  url TEXT,
  importance VARCHAR(20) DEFAULT 'normal', -- 'urgent', 'high', 'normal', 'low'
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  team_id INTEGER NOT NULL,
  transaction_type VARCHAR(20) NOT NULL, -- 'add', 'drop', 'trade'
  player_id INTEGER NOT NULL,
  related_player_id INTEGER, -- For trades/add-drops
  transaction_date DATETIME,
  notes TEXT,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (player_id) REFERENCES players(id)
);

-- User preferences table
CREATE TABLE IF NOT EXISTS user_preferences (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id VARCHAR(100) UNIQUE NOT NULL,
  theme VARCHAR(20) DEFAULT 'light',
  notifications_enabled BOOLEAN DEFAULT 1,
  email_notifications BOOLEAN DEFAULT 0,
  favorite_team_id INTEGER,
  settings_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (favorite_team_id) REFERENCES teams(id)
);

-- AI insights table for Perplexity integration
CREATE TABLE IF NOT EXISTS ai_insights (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  query_type VARCHAR(50), -- 'start_sit', 'trade', 'waiver', 'injury', 'matchup'
  query_text TEXT,
  response TEXT,
  confidence_score DECIMAL(3,2),
  affected_players TEXT, -- JSON array of player IDs
  action_items TEXT, -- JSON array of recommended actions
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  week INTEGER,
  is_actionable BOOLEAN DEFAULT 0,
  was_accurate BOOLEAN -- For tracking prediction accuracy
);

-- Research schedule table
CREATE TABLE IF NOT EXISTS research_schedule (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  research_type VARCHAR(50),
  scheduled_time TIME,
  day_of_week VARCHAR(20),
  is_active BOOLEAN DEFAULT 1,
  last_run DATETIME,
  next_run DATETIME
);

-- Matchups table
CREATE TABLE IF NOT EXISTS matchups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  week INTEGER NOT NULL,
  season INTEGER NOT NULL,
  team_id INTEGER NOT NULL,
  opponent_team_id INTEGER NOT NULL,
  team_score DECIMAL(10,2),
  opponent_score DECIMAL(10,2),
  is_winner BOOLEAN,
  is_complete BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (team_id) REFERENCES teams(id),
  FOREIGN KEY (opponent_team_id) REFERENCES teams(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roster_team ON roster(team_id);
CREATE INDEX IF NOT EXISTS idx_roster_player ON roster(player_id);
CREATE INDEX IF NOT EXISTS idx_stats_player_week ON player_stats(player_id, week);
CREATE INDEX IF NOT EXISTS idx_news_player ON news(player_id);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(published_at);
CREATE INDEX IF NOT EXISTS idx_transactions_team ON transactions(team_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_week ON ai_insights(week);
CREATE INDEX IF NOT EXISTS idx_ai_insights_type ON ai_insights(query_type);
CREATE INDEX IF NOT EXISTS idx_matchups_team_week ON matchups(team_id, week);