// api/routes/auth.js
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db');  // Note: ../db (go up one level)
require('dotenv').config();

const router = express.Router();

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const result = await pool.query(
      'SELECT id, name, email, password_hash, is_admin, expertise FROM judges WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rowCount === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const judge = result.rows[0];
    const isPasswordValid = await bcrypt.compare(password, judge.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: judge.id, name: judge.name, email: judge.email, is_admin: judge.is_admin },
      process.env.JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({ 
      token, 
      name: judge.name, 
      email: judge.email, 
      expertise: judge.expertise, 
      is_admin: judge.is_admin 
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error during login' });
  }
});

module.exports = router;