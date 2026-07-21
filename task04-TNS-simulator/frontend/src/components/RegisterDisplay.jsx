export default function RegisterDisplay({ locked, algorithmInfo }) {
  return (
    <div className="hero">
      <div className="register-card">
        <div className="register-label">Shared Lock Register</div>
        <div className={`register-bit ${locked ? 'held' : 'free'}`}>{locked ? '1' : '0'}</div>
        <div className={`register-status ${locked ? 'held' : 'free'}`}>
          {locked ? 'LOCK HELD' : 'LOCK FREE'}
        </div>
      </div>

      <div className="hero-copy">
        <p>
          <code>Test-and-Set</code> is a hardware instruction that reads a memory location and sets
          it to <code>true</code> in one indivisible bus-locked cycle, then hands back whatever was
          there before. 
        </p>
        {algorithmInfo && (
          <pre className="pseudocode">{algorithmInfo.pseudocode.join('\n')}</pre>
        )}
      </div>
    </div>
  );
}
