const router = require('express').Router();
const perplexityAgent = require('../services/perplexityAgent');
const db = require('../db/database');

// Submit AI query
router.post('/query', async (req, res) => {
  try {
    const { query } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Query is required' });
    }

    const result = await perplexityAgent.performResearch(query);
    
    if (!result) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        message: 'Please check your Perplexity API configuration'
      });
    }

    res.json(result);
  } catch (error) {
    console.error('AI query error:', error);
    res.status(500).json({ error: 'Failed to process AI query' });
  }
});

// Get recent AI insights
router.get('/insights', async (req, res) => {
  try {
    const { type, limit = 10 } = req.query;
    const insights = await perplexityAgent.getRecentInsights(type, parseInt(limit));
    res.json(insights);
  } catch (error) {
    console.error('Error fetching insights:', error);
    res.status(500).json({ error: 'Failed to fetch insights' });
  }
});

// Analyze start/sit decisions
router.post('/analyze/start-sit', async (req, res) => {
  try {
    const { starters, bench, matchups } = req.body;
    
    if (!starters || !bench) {
      return res.status(400).json({ error: 'Starters and bench players required' });
    }

    const analysis = await perplexityAgent.analyzeStartSit(starters, bench, matchups);
    res.json(analysis || { error: 'Analysis unavailable' });
  } catch (error) {
    console.error('Start/sit analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze lineup' });
  }
});

// Evaluate trade
router.post('/analyze/trade', async (req, res) => {
  try {
    const { giving, receiving, teamNeeds } = req.body;
    
    if (!giving || !receiving) {
      return res.status(400).json({ error: 'Trade details required' });
    }

    const evaluation = await perplexityAgent.evaluateTrade(giving, receiving, teamNeeds || []);
    res.json(evaluation || { error: 'Evaluation unavailable' });
  } catch (error) {
    console.error('Trade evaluation error:', error);
    res.status(500).json({ error: 'Failed to evaluate trade' });
  }
});

// Get waiver wire recommendations
router.post('/analyze/waivers', async (req, res) => {
  try {
    const { roster, available, faabBudget } = req.body;
    
    if (!roster || !available) {
      return res.status(400).json({ error: 'Roster and available players required' });
    }

    const recommendations = await perplexityAgent.generateWaiverRecommendations(
      roster, 
      available, 
      faabBudget
    );
    
    res.json(recommendations || { error: 'Recommendations unavailable' });
  } catch (error) {
    console.error('Waiver recommendations error:', error);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// Get breaking news context
router.post('/news-context', async (req, res) => {
  try {
    const { newsItem } = req.body;
    
    if (!newsItem) {
      return res.status(400).json({ error: 'News item required' });
    }

    const context = await perplexityAgent.getBreakingNewsContext(newsItem);
    res.json(context || { error: 'Context unavailable' });
  } catch (error) {
    console.error('News context error:', error);
    res.status(500).json({ error: 'Failed to get news context' });
  }
});

module.exports = router;