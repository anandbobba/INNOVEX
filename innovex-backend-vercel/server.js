// server.js — Local server for migration and testing
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { pool } = require('./api/db');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Mount the bundled API (matches Vercel server setup)
const apiApp = require('./api');
app.use('/api', apiApp);

// Health
app.get("/", (req, res) => {
  res.json({ status: "OK", message: "Local INNOVEX API running" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log("Local server running on", PORT));
