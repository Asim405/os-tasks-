import express from 'express';
import cors from 'cors';
import { runSimulation } from './simulate.js';

const app = express();
app.use(cors());
app.use(express.json());

const clamp = (value, fallback, min, max) => {
  const n = parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(Math.max(n, min), max);
};

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Test-and-Set simulation backend running' });
});

app.get('/api/algorithm-info', (_req, res) => {
  res.json({
    name: 'Test-and-Set (TAS)',
    summary:
      'A hardware instruction that atomically reads a memory location and sets it to true in a single bus-locked cycle, returning the previous value. It is the primitive most spinlocks are built on.',
    pseudocode: [
      'function TestAndSet(lock):',
      '  atomic {',
      '    old = lock',
      '    lock = true',
      '    return old',
      '  }',
      '',
      'function acquire(lock):',
      '  while TestAndSet(lock) == true:',
      '    // spin (busy-wait)',
      '',
      'function release(lock):',
      '  lock = false',
    ],
  });
});

app.post('/api/simulate', async (req, res) => {
  try {
    const body = req.body || {};

    const processCount = clamp(body.processCount, 4, 2, 8);
    const minDelay = clamp(body.minDelay, 50, 0, 1000);
    const maxDelay = clamp(body.maxDelay, 300, minDelay, 2000);
    const criticalSectionTime = clamp(body.criticalSectionTime, 200, 50, 1000);
    const attemptsPerProcess = clamp(body.attemptsPerProcess, 1, 1, 3);
    const mode = body.mode === 'naive' ? 'naive' : 'atomic';

    const result = await runSimulation({
      processCount,
      mode,
      minDelay,
      maxDelay,
      criticalSectionTime,
      attemptsPerProcess,
    });

    res.json(result);
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Simulation failed', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`TAS simulation backend listening on port ${PORT}`);
  });
}

export default app;
