const axios = require('axios');
const db = require('../db/database');

class PerplexityAgent {
  constructor() {
    this.apiKey = process.env.PERPLEXITY_API_KEY;
    this.model = process.env.PERPLEXITY_MODEL || 'pplx-70b-online';
    this.maxTokens = parseInt(process.env.PERPLEXITY_MAX_TOKENS) || 1000;
    this.temperature = parseFloat(process.env.PERPLEXITY_TEMPERATURE) || 0.2;
    this.baseURL = 'https://api.perplexity.ai';
    this.enabled = process.env.AI_RESEARCH_ENABLED === 'true' && this.apiKey && this.apiKey !== 'your-perplexity-api-key';
  }

  async performResearch(query, context = {}) {
    if (!this.enabled) {
      console.log('Perplexity AI is not enabled or configured');
      return null;
    }

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        {
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are a fantasy football expert analyst. Provide detailed, actionable insights based on current data and trends. Be specific with recommendations and confidence levels.'
            },
            {
              role: 'user',
              content: query
            }
          ],
          max_tokens: this.maxTokens,
          temperature: this.temperature,
          top_p: 0.9,
          return_citations: true,
          search_domain_filter: ['espn.com', 'nfl.com', 'yahoo.com', 'fantasypros.com', 'rotoworld.com'],
          search_recency_filter: 'week'
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return {
        content: response.data.choices[0].message.content,
        citations: response.data.citations || [],
        confidence: this.calculateConfidence(response.data.choices[0].message.content)
      };
    } catch (error) {
      console.error('Perplexity API error:', error.response?.data || error.message);
      return null;
    }
  }

  async generateContextualQueries(roster, matchups, league) {
    const queries = [];
    const currentWeek = league.current_week || 1;

    // Injury-related queries for questionable players
    const injuredPlayers = roster.filter(p => 
      p.status && !['healthy', 'active'].includes(p.status.toLowerCase())
    );
    
    for (const player of injuredPlayers) {
      queries.push({
        type: 'injury',
        playerId: player.id,
        query: `What is the latest injury update for ${player.name} of the ${player.nfl_team}? Include practice participation, expected playing time, and fantasy impact for Week ${currentWeek}. Provide a confidence score (0-100) for them playing.`
      });
    }

    // Matchup analysis for key players
    const keyPlayers = roster.filter(p => p.position_type === 'starter');
    for (const player of keyPlayers.slice(0, 5)) { // Top 5 starters
      if (matchups[player.nfl_team]) {
        queries.push({
          type: 'matchup',
          playerId: player.id,
          query: `Analyze ${player.name} (${player.position}) vs ${matchups[player.nfl_team].opponent} defense in Week ${currentWeek}. Consider: 1) Defense ranking vs ${player.position}, 2) Recent performance trends, 3) Weather conditions, 4) Historical performance in similar matchups. Provide specific point projection and start/sit recommendation.`
        });
      }
    }

    // Start/Sit decisions for flex positions
    const flexCandidates = roster.filter(p => 
      ['RB', 'WR', 'TE'].includes(p.position) && p.position_type === 'bench'
    );
    
    if (flexCandidates.length > 0) {
      const flexOptions = flexCandidates.slice(0, 3).map(p => p.name).join(', ');
      queries.push({
        type: 'start_sit',
        query: `Compare these flex options for Week ${currentWeek}: ${flexOptions}. Consider matchups, recent usage, and scoring upside. Rank them and provide confidence scores.`
      });
    }

    return queries;
  }

  async analyzeStartSit(starters, bench, matchups) {
    if (!this.enabled) return null;

    const starterNames = starters.map(p => `${p.name} (${p.position})`).join(', ');
    const benchNames = bench.map(p => `${p.name} (${p.position})`).join(', ');

    const query = `
      Analyze my lineup for this week:
      STARTERS: ${starterNames}
      BENCH: ${benchNames}
      
      Provide:
      1. Any recommended lineup changes with reasoning
      2. Confidence score for current lineup (0-100)
      3. Top 3 risky starts and safe alternatives
      4. Ceiling play vs floor play recommendations
      5. Weather or game script concerns
    `;

    const result = await this.performResearch(query);
    if (result) {
      await this.saveInsight('start_sit', query, result);
    }
    return result;
  }

  async evaluateTrade(givingPlayers, receivingPlayers, teamNeeds) {
    if (!this.enabled) return null;

    const giving = givingPlayers.map(p => p.name).join(', ');
    const receiving = receivingPlayers.map(p => p.name).join(', ');

    const query = `
      Evaluate this trade proposal:
      GIVING: ${giving}
      RECEIVING: ${receiving}
      
      My team needs: ${teamNeeds.join(', ')}
      
      Consider:
      1. Rest of season value and schedule
      2. Injury history and current health
      3. Team situation and usage trends
      4. Impact on my roster construction
      5. Fair market value assessment
      
      Provide:
      - Trade grade (A-F)
      - Win probability impact
      - Alternative counter-offers if declining
      - Long-term vs short-term value
    `;

    const result = await this.performResearch(query);
    if (result) {
      await this.saveInsight('trade', query, result);
    }
    return result;
  }

  async getBreakingNewsContext(newsItem) {
    if (!this.enabled) return null;

    const query = `
      Provide context and fantasy impact for this news:
      "${newsItem.headline}"
      
      Include:
      1. Immediate fantasy impact (this week)
      2. Rest of season implications
      3. Beneficiaries of this news
      4. Required roster moves
      5. Waiver wire priorities
    `;

    return await this.performResearch(query);
  }

  async generateWaiverRecommendations(roster, availablePlayers, faabBudget = null) {
    if (!this.enabled) return null;

    const available = availablePlayers.slice(0, 10).map(p => p.name).join(', ');
    const rosterNeeds = this.identifyRosterNeeds(roster);

    const query = `
      Recommend waiver wire pickups from these available players:
      ${available}
      
      My roster needs: ${rosterNeeds.join(', ')}
      ${faabBudget ? `FAAB Budget remaining: $${faabBudget}` : ''}
      
      Provide:
      1. Top 3 priority adds with reasoning
      2. Sleeper picks with upside
      3. Suggested drops from my roster
      4. FAAB bid recommendations (if applicable)
      5. Stash candidates for playoffs
    `;

    const result = await this.performResearch(query);
    if (result) {
      await this.saveInsight('waiver', query, result);
    }
    return result;
  }

  identifyRosterNeeds(roster) {
    const positionCounts = {};
    roster.forEach(player => {
      positionCounts[player.position] = (positionCounts[player.position] || 0) + 1;
    });

    const needs = [];
    if (positionCounts['RB'] < 5) needs.push('RB depth');
    if (positionCounts['WR'] < 5) needs.push('WR depth');
    if (positionCounts['TE'] < 2) needs.push('TE backup');
    if (positionCounts['QB'] < 2) needs.push('QB backup');

    return needs.length > 0 ? needs : ['Best player available'];
  }

  calculateConfidence(content) {
    // Simple confidence calculation based on response certainty indicators
    const highConfidenceWords = ['definitely', 'certainly', 'strongly', 'clear', 'obvious'];
    const lowConfidenceWords = ['might', 'could', 'possibly', 'perhaps', 'uncertain'];
    
    let confidence = 0.7; // Base confidence
    
    const lowerContent = content.toLowerCase();
    highConfidenceWords.forEach(word => {
      if (lowerContent.includes(word)) confidence += 0.05;
    });
    
    lowConfidenceWords.forEach(word => {
      if (lowerContent.includes(word)) confidence -= 0.05;
    });
    
    return Math.max(0.3, Math.min(1.0, confidence));
  }

  async saveInsight(type, query, result) {
    if (!result) return;

    const stmt = db.prepare(`
      INSERT INTO ai_insights (query_type, query_text, response, confidence_score, week, is_actionable)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const currentWeek = await this.getCurrentWeek();
    
    stmt.run(
      type,
      query,
      JSON.stringify(result),
      result.confidence,
      currentWeek,
      result.confidence > 0.7 ? 1 : 0
    );

    stmt.finalize();
  }

  async getCurrentWeek() {
    return new Promise((resolve) => {
      db.get('SELECT current_week FROM leagues LIMIT 1', (err, row) => {
        resolve(row?.current_week || 1);
      });
    });
  }

  async getRecentInsights(type = null, limit = 10) {
    let query = 'SELECT * FROM ai_insights';
    const params = [];
    
    if (type) {
      query += ' WHERE query_type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ?';
    params.push(limit);

    return new Promise((resolve, reject) => {
      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = new PerplexityAgent();