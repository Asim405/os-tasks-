import express from "express";
import cors from "cors";
import { fcfs } from "./schedulers/fcfs.js";
import { sjf } from "./schedulers/sjf.js";
import { priorityScheduling } from "./schedulers/priority.js";
import { roundRobin } from "./schedulers/roundRobin.js";

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

const algorithms = {
  fcfs: { name: "First Come First Serve", fn: fcfs, needsPriority: false, needsQuantum: false },
  sjf: { name: "Shortest Job First", fn: sjf, needsPriority: false, needsQuantum: false },
  priority: { name: "Priority Scheduling", fn: priorityScheduling, needsPriority: true, needsQuantum: false },
  roundRobin: { name: "Round Robin", fn: roundRobin, needsPriority: false, needsQuantum: true },
};

app.get("/api/algorithms", (_req, res) => {
  res.json(
    Object.entries(algorithms).map(([key, value]) => ({
      id: key,
      name: value.name,
      needsPriority: value.needsPriority,
      needsQuantum: value.needsQuantum,
    }))
  );
});

app.get("/api/sample", (_req, res) => {
  res.json({
    processes: [
      { id: "P1", arrivalTime: 0, burstTime: 5, priority: 2 },
      { id: "P2", arrivalTime: 1, burstTime: 6, priority: 1 },
      { id: "P5", arrivalTime: 5, burstTime: 8, priority: 3 },
      { id: "P4", arrivalTime: 3, burstTime: 6, priority: 2 },
    ],
    quantum: 2,
  });
});

app.post("/api/simulate", (req, res) => {
  try {
    const { algorithm, processes, quantum } = req.body;

    if (!algorithm || !algorithms[algorithm]) {
      return res.status(400).json({ error: "Invalid algorithm" });
    }

    if (!processes || !Array.isArray(processes) || processes.length === 0) {
      return res.status(400).json({ error: "At least one process is required" });
    }

    for (const p of processes) {
      if (!p.id || p.arrivalTime < 0 || p.burstTime <= 0) {
        return res.status(400).json({
          error: "Each process needs id, arrivalTime >= 0, and burstTime > 0",
        });
      }
    }

    const algo = algorithms[algorithm];
    let result;

    if (algo.needsQuantum) {
      const q = Number(quantum);
      if (!q || q <= 0) {
        return res.status(400).json({ error: "Round Robin requires quantum > 0" });
      }
      result = algo.fn(processes, q);
    } else {
      result = algo.fn(processes);
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Simulation failed" });
  }
});

app.listen(PORT, () => {
  console.log(`CPU Scheduling Server running on http://localhost:${PORT}`);
});

// Vercel serverless functions ke liye app export kar di hai
export default app;