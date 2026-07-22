import { buildResult, cloneProcesses } from "./utils.js";

export function fcfs(inputProcesses) {
  const processes = cloneProcesses(inputProcesses);
  const ganttChart = [];
  let currentTime = 0;

  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);

  for (const process of sorted) {
    if (currentTime < process.arrivalTime) {
      currentTime = process.arrivalTime;
    }

    if (process.firstStartTime === -1) {
      process.firstStartTime = currentTime;
    }

    const start = currentTime;
    currentTime += process.burstTime;
    process.completionTime = currentTime;

    ganttChart.push({
      processId: process.id,
      start,
      end: currentTime,
    });
  }

  const result = buildResult(sorted, ganttChart);
  result.summary.algorithm = "FCFS";
  return result;
}
