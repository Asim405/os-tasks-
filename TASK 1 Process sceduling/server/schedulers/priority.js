import { buildResult, cloneProcesses } from "./utils.js";

export function priorityScheduling(inputProcesses) {
  const processes = cloneProcesses(inputProcesses);
  const ganttChart = [];
  let currentTime = 0;
  let completed = 0;
  const n = processes.length;

  while (completed < n) {
    const available = processes.filter(
      (p) => p.completionTime === 0 && p.arrivalTime <= currentTime
    );

    if (available.length === 0) {
      const nextArrival = Math.min(
        ...processes.filter((p) => p.completionTime === 0).map((p) => p.arrivalTime)
      );
      currentTime = nextArrival;
      continue;
    }

    available.sort(
      (a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime
    );
    const process = available[0];

    if (process.firstStartTime === -1) {
      process.firstStartTime = currentTime;
    }

    const start = currentTime;
    currentTime += process.burstTime;
    process.completionTime = currentTime;
    completed++;

    ganttChart.push({
      processId: process.id,
      start,
      end: currentTime,
    });
  }

  const result = buildResult(processes, ganttChart);
  result.summary.algorithm = "Priority";
  return result;
}
