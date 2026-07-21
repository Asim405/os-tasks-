const TYPE_MARK = {
  acquire: "▲",
  release: "▼",
  wait: "■",
  system: "●",
};

export default function EventTicker({ log }) {
  const entries = [...log].reverse();

  return (
    <div className="ticker">
      <div className="ticker-header">
        <span>Signal log</span>
        <span className="ticker-header-dim">most recent first</span>
      </div>
      <div className="ticker-tape">
        {entries.length === 0 && (
          <div className="ticker-row ticker-empty">No events yet — press start to dispatch the trains.</div>
        )}
        {entries.map((entry, i) => (
          <div key={`${entry.t}-${i}`} className={`ticker-row ticker-${entry.type}`}>
            <span className="ticker-mark">{TYPE_MARK[entry.type] || "·"}</span>
            <span className="ticker-time">
              {new Date(entry.t).toLocaleTimeString("en-GB", { hour12: false })}
            </span>
            <span className="ticker-msg">{entry.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
