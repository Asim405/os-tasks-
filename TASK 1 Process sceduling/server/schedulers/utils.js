export function buildResult(processes, ganttChart) {
  const processStats = processes.map((p) => {
    const turnaroundTime = p.completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = p.firstStartTime - p.arrivalTime;

    return {
      id: p.id,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority ?? null,
      completionTime: p.completionTime,
      turnaroundTime,
      waitingTime,
      responseTime,
    };
  });

  const totalTime = ganttChart.length > 0 ? ganttChart[ganttChart.length - 1].end : 0;
  const totalBurst = processes.reduce((sum, p) => sum + p.burstTime, 0);
  const count = processes.length;

  const summary = {
    algorithm: null,
    totalProcesses: count,
    totalTime,
    totalBurstTime: totalBurst,
    cpuUtilization: totalTime > 0 ? ((totalBurst / totalTime) * 100).toFixed(2) : "0.00",
    avgWaitingTime: count > 0
      ? (processStats.reduce((s, p) => s + p.waitingTime, 0) / count).toFixed(2)
      : "0.00",
    avgTurnaroundTime: count > 0
      ? (processStats.reduce((s, p) => s + p.turnaroundTime, 0) / count).toFixed(2)
      : "0.00",
    avgResponseTime: count > 0
      ? (processStats.reduce((s, p) => s + p.responseTime, 0) / count).toFixed(2)
      : "0.00",
  };

  return { ganttChart, processes: processStats, summary };
}

export function cloneProcesses(processes) {
  return processes.map((p) => ({
    id: p.id,
    arrivalTime: Number(p.arrivalTime),
    burstTime: Number(p.burstTime),
    priority: p.priority !== undefined && p.priority !== null ? Number(p.priority) : 0,
    remainingTime: Number(p.burstTime),
    completionTime: 0,
    firstStartTime: -1,
  }));
}
