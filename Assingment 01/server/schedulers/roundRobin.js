import { buildResult, cloneProcesses } from "./utils.js";

export function roundRobin(inputProcesses, quantum = 2) {
  const processes = cloneProcesses(inputProcesses);
  const ganttChart = [];
  const queue = [];
  let currentTime = 0;
  let completed = 0;
  const n = processes.length;

  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let arrivalIndex = 0;
  const added = new Set();

  const enqueueArrivals = () => {
    while (arrivalIndex < n && sorted[arrivalIndex].arrivalTime <= currentTime) {
      const p = sorted[arrivalIndex];
      if (!added.has(p.id)) {
        queue.push(p);
        added.add(p.id);
      }
      arrivalIndex++;
    }
  };

  enqueueArrivals();

  while (completed < n) {
    if (queue.length === 0) {
      currentTime = sorted[arrivalIndex].arrivalTime;
      enqueueArrivals();
      continue;
    }

    const process = queue.shift();

    if (process.firstStartTime === -1) {
      process.firstStartTime = currentTime;
    }

    const execTime = Math.min(quantum, process.remainingTime);
    const start = currentTime;
    currentTime += execTime;
    process.remainingTime -= execTime;

    ganttChart.push({
      processId: process.id,
      start,
      end: currentTime,
    });

    enqueueArrivals();

    if (process.remainingTime === 0) {
      process.completionTime = currentTime;
      completed++;
    } else {
      queue.push(process);
    }
  }

  const result = buildResult(processes, ganttChart);
  result.summary.algorithm = "Round Robin";
  result.summary.quantum = quantum;
  return result;
}
