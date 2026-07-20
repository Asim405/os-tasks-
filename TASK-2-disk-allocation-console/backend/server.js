/**
 * server.js
 * Express API for the File Allocation Simulator.
 */

const express = require('express');
const cors = require('cors');
const { Disk, createStrategy } = require('./allocation');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;

// In-memory OS state
let disk = new Disk(40);
let method = 'sequential';
let strategy = createStrategy(method, disk);

function currentState() {
  return {
    method,
    disk: disk.serialize(),
    files: strategy.listFiles(),
  };
}

// 404 Fix: Removed '/api' prefix to match frontend paths directly
app.get('/state', (req, res) => {
  res.json(currentState());
});

app.post('/init', (req, res) => {
  const size = parseInt(req.body.size, 10);
  if (!Number.isInteger(size) || size < 1 || size > 500) {
    return res.status(400).json({ ok: false, message: 'size must be an integer between 1 and 500.' });
  }
  disk.reset(size);
  strategy = createStrategy(method, disk);
  res.json({ ok: true, message: `Disk reset to ${size} blocks.`, state: currentState() });
});

app.post('/method', (req, res) => {
  const { method: newMethod } = req.body;
  if (!['sequential', 'linked', 'indexed'].includes(newMethod)) {
    return res.status(400).json({ ok: false, message: 'method must be sequential, linked, or indexed.' });
  }
  method = newMethod;
  disk.reset(disk.size);
  strategy = createStrategy(method, disk);
  res.json({ ok: true, message: `Switched to ${method} allocation. Disk cleared.`, state: currentState() });
});

app.post('/files', (req, res) => {
  const { name, blocks } = req.body;
  const numBlocks = parseInt(blocks, 10);
  if (!name || typeof name !== 'string' || !Number.isInteger(numBlocks) || numBlocks <= 0) {
    return res.status(400).json({ ok: false, message: 'name (string) and blocks (positive integer) are required.' });
  }
  const result = strategy.allocate(name.trim(), numBlocks);
  res.status(result.ok ? 200 : 409).json({ ...result, state: currentState() });
});

app.delete('/files/:name', (req, res) => {
  const result = strategy.delete(req.params.name);
  res.status(result.ok ? 200 : 404).json({ ...result, state: currentState() });
});

// Vercel serverless engine compatibility
module.exports = app;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`File Allocation Simulator API running at http://localhost:${PORT}`);
  });
}