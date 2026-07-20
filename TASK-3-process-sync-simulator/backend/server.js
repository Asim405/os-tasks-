const express = require('express');
const cors = require('cors');
const { runSimulation } = require('./sync');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4100;

// 404 Fix: Removed '/api' prefix for clean standalone routing
app.post('/simulate', (req, res) => {
  const { mode = 'race', iterations = 5, scheduling = 'alternate' } = req.body;

  if (!['race', 'peterson', 'mutex', 'spinlock'].includes(mode)) {
    return res.status(400).json({ ok: false, message: 'mode must be race, peterson, mutex, or spinlock.' });
  }
  if (!['alternate', 'random'].includes(scheduling)) {
    return res.status(400).json({ ok: false, message: 'scheduling must be alternate or random.' });
  }
  const iters = parseInt(iterations, 10);
  if (!Number.isInteger(iters) || iters < 1 || iters > 30) {
    return res.status(400).json({ ok: false, message: 'iterations must be an integer between 1 and 30.' });
  }

  const result = runSimulation({ mode, iterations: iters, scheduling });
  res.json({ ok: true, ...result });
});

// Vercel serverless engine compatibility
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Process Sync Simulator API running at http://localhost:${PORT}`);
  });
}