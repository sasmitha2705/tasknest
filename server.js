require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const rateLimit = require('express-rate-limit');

if (!process.env.MONGODB_URI || !process.env.JWT_SECRET) {
  console.error('Set MONGODB_URI and JWT_SECRET in your .env file or hosting dashboard.');
  process.exit(1);
}
const app = express();
   app.set('trust proxy', 1);
app.use(cors());
app.use(express.json());
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, max: 50 }));   // slows brute-force logins
app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api', require('./routes'));
app.use(express.static(path.join(__dirname, 'public')));                  // serves the frontend

app.use((err, req, res, next) => {
  if (err.name === 'ValidationError' || err.name === 'CastError')
    return res.status(400).json({ error: 'Invalid input.' });
  console.error(err);
  res.status(500).json({ error: 'Server error. Try again.' });
});

mongoose.connect(process.env.MONGODB_URI)
  .then(() => app.listen(process.env.PORT || 3000, () => console.log('TaskNest running')))
  .catch(e => { console.error('MongoDB connection failed:', e.message); process.exit(1); });
