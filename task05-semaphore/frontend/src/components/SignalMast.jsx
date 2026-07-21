// A physical railway semaphore, rendered in SVG. The blade rests at 45°
// (clear) when the platform is free, and swings to horizontal (danger)
// the instant a train occupies it — the same mechanical language real
// signal boxes use, repurposed here as the resource indicator.

export default function SignalMast({ index, occupantLabel }) {
  const occupied = Boolean(occupantLabel);
  const bladeAngle = occupied ? 0 : -50;
  const bladeColor = occupied ? "var(--red)" : "var(--green)";
  const lampColor = occupied ? "var(--red)" : "var(--green)";

  return (
    <div className="mast">
      <svg viewBox="0 0 120 200" className="mast-svg" aria-hidden="true">
        <line x1="60" y1="10" x2="60" y2="170" stroke="var(--rail)" strokeWidth="6" />
        <circle cx="60" cy="170" r="10" fill="var(--panel-raised)" stroke="var(--rail)" strokeWidth="3" />

        <g transform="translate(60 34)">
          <circle r="12" fill="var(--panel-raised)" stroke="var(--rail)" strokeWidth="2" />
          <circle
            r="6"
            fill={lampColor}
            className={occupied ? "lamp lamp-danger" : "lamp lamp-clear"}
          />
        </g>

        <g
          transform={`translate(60 34) rotate(${bladeAngle})`}
          className="blade-group"
        >
          <rect x="0" y="-5" width="46" height="10" rx="1.5" fill={bladeColor} />
          <rect x="40" y="-5" width="6" height="10" fill="var(--void)" opacity="0.35" />
        </g>
      </svg>

      <div className="mast-label">
        <span className="mast-eyebrow">Platform {index + 1}</span>
        <span className={`mast-status ${occupied ? "status-occupied" : "status-clear"}`}>
          {occupied ? occupantLabel : "Clear"}
        </span>
      </div>
    </div>
  );
}
