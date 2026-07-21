const STATE_META = {
  thinking: { label: "En route", className: "state-thinking" },
  waiting: { label: "Held at signal", className: "state-waiting" },
  using: { label: "On platform", className: "state-using" },
};

export default function TrainCar({ process, queuePosition }) {
  const meta = STATE_META[process.state] || STATE_META.thinking;
  const avgWait =
    process.stats.acquires > 0
      ? Math.round(process.stats.totalWaitMs / process.stats.acquires)
      : 0;

  return (
    <div className={`train ${meta.className}`}>
      <div className="train-id">{process.label}</div>
      <div className="train-body">
        <svg viewBox="0 0 64 34" className="train-svg" aria-hidden="true">
          <rect x="2" y="4" width="60" height="22" rx="6" fill="currentColor" opacity="0.9" />
          <rect x="8" y="9" width="12" height="9" rx="1.5" fill="var(--void)" opacity="0.55" />
          <rect x="24" y="9" width="12" height="9" rx="1.5" fill="var(--void)" opacity="0.55" />
          <rect x="40" y="9" width="12" height="9" rx="1.5" fill="var(--void)" opacity="0.55" />
          <circle cx="14" cy="29" r="4" fill="var(--rail)" />
          <circle cx="50" cy="29" r="4" fill="var(--rail)" />
        </svg>
        <div className="train-info">
          <span className="train-state">{meta.label}</span>
          {process.state === "using" && (
            <span className="train-detail">Platform {process.resourceId + 1}</span>
          )}
          {process.state === "waiting" && queuePosition !== undefined && (
            <span className="train-detail">Queue position {queuePosition + 1}</span>
          )}
          {process.state === "thinking" && process.stats.acquires > 0 && (
            <span className="train-detail">Avg wait {avgWait}ms</span>
          )}
        </div>
      </div>
      <div className="train-stat">
        <span className="train-stat-num">{process.stats.acquires}</span>
        <span className="train-stat-label">runs</span>
      </div>
    </div>
  );
}
