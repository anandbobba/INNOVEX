// api/index.js
const express = require('express');
const serverless = require('serverless-http');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const scoresRoutes = require('./routes/scores');
const adminRoutes = require('./routes/admin');

const app = express();

app.use(express.json());
app.use(cors({ origin: '*' }));

// Health / base route
app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    message: 'INNOVEX API running on Vercel',
    time: new Date().toISOString()
  });
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/scores', scoresRoutes);
app.use('/admin', adminRoutes);

// Export the serverless handler for Vercel
module.exports = app;
module.exports.handler = serverless(app);