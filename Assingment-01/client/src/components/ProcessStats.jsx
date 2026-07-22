export default function ProcessStats({ processes }) {
  if (!processes || processes.length === 0) {
    return (
      <div className="card stats-card">
        <h2>Process Statistics</h2>
        <p className="empty-state">No statistics available yet.</p>
      </div>
    );
  }

  return (
    <div className="card stats-card">
      <h2>Process Statistics</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Process</th>
              <th>Arrival</th>
              <th>Burst</th>
              <th>Priority</th>
              <th>Completion</th>
              <th>Turnaround</th>
              <th>Waiting</th>
              <th>Response</th>
            </tr>
          </thead>
          <tbody>
            {processes.map((p) => (
              <tr key={p.id}>
                <td className="process-id">{p.id}</td>
                <td>{p.arrivalTime}</td>
                <td>{p.burstTime}</td>
                <td>{p.priority ?? "—"}</td>
                <td>{p.completionTime}</td>
                <td>{p.turnaroundTime}</td>
                <td>{p.waitingTime}</td>
                <td>{p.responseTime}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
