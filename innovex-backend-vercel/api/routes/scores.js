const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { pool } = require('../db');

// Get all teams
router.get('/teams', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, college, lead_name FROM teams ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching teams:', err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get judge's submitted scores
router.get('/my-scores', auth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT s.*, t.name as team_name 
       FROM scores s 
       JOIN teams t ON s.team_id = t.id 
       WHERE s.judge_id = $1 
       ORDER BY s.session_type, s.updated_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching scores:', err);
    res.status(500).json({ error: 'Failed to fetch scores' });
  }
});

// Submit or update score
router.post('/submit', auth, async (req, res) => {
  const { team_id, session_type, innovation, creativity, feasibility, presentation, design, user_experience, comments } = req.body;
  const judge_id = req.user.id;
  
  // Validate session type
  if (!session_type || !['mentoring', 'judging'].includes(session_type)) {
    return res.status(400).json({ error: 'Invalid session type. Must be "mentoring" or "judging"' });
  }
  
  // Validate required scores
  if (
    !Number.isInteger(innovation) || innovation < 0 || innovation > 10 ||
    !Number.isInteger(creativity) || creativity < 0 || creativity > 10 ||
    !Number.isInteger(feasibility) || feasibility < 0 || feasibility > 10 ||
    !Number.isInteger(presentation) || presentation < 0 || presentation > 10
  ) {
    return res.status(400).json({ error: 'Innovation, Creativity, Feasibility, and Presentation must be integers between 0 and 10' });
  }
  
  // Validate judging-specific scores
  if (session_type === 'judging') {
    if (
      !Number.isInteger(design) || design < 0 || design > 10 ||
      !Number.isInteger(user_experience) || user_experience < 0 || user_experience > 10
    ) {
      return res.status(400).json({ error: 'Design and User Experience must be integers between 0 and 10 for judging sessions' });
    }
  }
  
  try {
    const upsertQuery = `
      INSERT INTO scores (judge_id, team_id, session_type, innovation, creativity, feasibility, presentation, design, user_experience, comments, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
      ON CONFLICT (judge_id, team_id, session_type) 
      DO UPDATE SET
        innovation = EXCLUDED.innovation,
        creativity = EXCLUDED.creativity,
        feasibility = EXCLUDED.feasibility,
        presentation = EXCLUDED.presentation,
        design = EXCLUDED.design,
        user_experience = EXCLUDED.user_experience,
        comments = EXCLUDED.comments,
        updated_at = CURRENT_TIMESTAMP
      RETURNING *;
    `;
    
    const result = await pool.query(upsertQuery, [
      judge_id,
      team_id,
      session_type,
      innovation,
      creativity,
      feasibility,
      presentation,
      session_type === 'judging' ? design : null,
      session_type === 'judging' ? user_experience : null,
      comments || null
    ]);
    
    res.json({ 
      success: true, 
      message: 'Score submitted successfully',
      score: result.rows[0] 
    });
    
  } catch (err) {
    console.error('Error submitting score:', err);
    res.status(500).json({ error: 'Failed to submit score' });
  }
});

module.exports = router;