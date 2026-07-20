import { ALGORITHM_COLORS } from "../utils/colors";

export default function Summary({ summary, algorithm }) {
  if (!summary) {
    return (
      <div className="card summary-card">
        <h2>Summary</h2>
        <p className="empty-state">Run a simulation to see the summary.</p>
      </div>
    );
  }

  const colors = ALGORITHM_COLORS[algorithm] || ALGORITHM_COLORS.fcfs;

  const items = [
    { label: "Algorithm", value: summary.algorithm },
    { label: "Total Processes", value: summary.totalProcesses },
    { label: "Total Time", value: summary.totalTime },
    { label: "CPU Utilization", value: `${summary.cpuUtilization}%` },
    { label: "Avg Waiting Time", value: summary.avgWaitingTime },
    { label: "Avg Turnaround Time", value: summary.avgTurnaroundTime },
    { label: "Avg Response Time", value: summary.avgResponseTime },
  ];

  if (summary.quantum) {
    items.splice(2, 0, { label: "Time Quantum", value: summary.quantum });
  }

  return (
    <div className="card summary-card">
      <h2>Summary</h2>
      <div
        className="algorithm-badge"
        style={{
          backgroundColor: colors.bg,
          color: colors.text,
          borderColor: colors.border,
        }}
      >
        {summary.algorithm}
      </div>
      <div className="summary-grid">
        {items.map((item) => (
          <div key={item.label} className="summary-item">
            <span className="summary-label">{item.label}</span>
            <span className="summary-value">{item.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
