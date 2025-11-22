const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

// Admin-only: Get aggregated results
router.get('/results', auth, async (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await pool.query(`
      SELECT 
        team_id,
        team_name,
        college,
        mentoring_judge_count,
        judging_judge_count,
        mentoring_avg_innovation,
        mentoring_avg_creativity,
        mentoring_avg_feasibility,
        mentoring_avg_presentation,
        mentoring_avg_score,
        judging_avg_innovation,
        judging_avg_creativity,
        judging_avg_feasibility,
        judging_avg_presentation,
        judging_avg_design,
        judging_avg_user_experience,
        judging_avg_score,
        total_score
      FROM team_results
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching results:', err);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});

// Admin-only: Get detailed scores by judge
router.get('/detailed-scores', auth, async (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const result = await pool.query(`
      SELECT 
        j.name as judge_name,
        j.expertise,
        t.name as team_name,
        s.session_type,
        s.innovation,
        s.creativity,
        s.feasibility,
        s.presentation,
        s.design,
        s.user_experience,
        s.total_score,
        s.final_score,
        s.comments,
        s.updated_at
      FROM scores s
      JOIN judges j ON s.judge_id = j.id
      JOIN teams t ON s.team_id = t.id
      ORDER BY t.name, s.session_type, j.name
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching detailed scores:', err);
    res.status(500).json({ error: 'Failed to fetch detailed scores' });
  }
});

// Admin-only: Get statistics
router.get('/stats', auth, async (req, res) => {
  if (!req.user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const stats = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM teams) as total_teams,
        (SELECT COUNT(*) FROM judges WHERE is_admin = false) as total_judges,
        (SELECT COUNT(*) FROM scores) as total_evaluations,
        (SELECT COUNT(DISTINCT team_id) FROM scores) as evaluated_teams
    `);
    
    res.json(stats.rows[0]);
  } catch (err) {
    console.error('Error fetching stats:', err);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

module.exports = router;