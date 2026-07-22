export default function ProcessForm({
  processes,
  onChange,
  onAdd,
  onRemove,
  showPriority,
}) {
  return (
    <div className="card process-form-card">
      <div className="card-header">
        <h2>Processes</h2>
        <button type="button" className="btn btn-secondary" onClick={onAdd}>
          + Add Process
        </button>
      </div>

      <div className="process-list">
        {processes.map((process, index) => (
          <div key={index} className="process-row">
            <div className="form-group">
              <label>ID</label>
              <input
                type="text"
                value={process.id}
                onChange={(e) => onChange(index, "id", e.target.value)}
                placeholder="P1"
              />
            </div>
            <div className="form-group">
              <label>Arrival</label>
              <input
                type="number"
                min="0"
                value={process.arrivalTime}
                onChange={(e) => onChange(index, "arrivalTime", e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Burst</label>
              <input
                type="number"
                min="1"
                value={process.burstTime}
                onChange={(e) => onChange(index, "burstTime", e.target.value)}
              />
            </div>
            {showPriority && (
              <div className="form-group">
                <label>Priority</label>
                <input
                  type="number"
                  min="0"
                  value={process.priority}
                  onChange={(e) => onChange(index, "priority", e.target.value)}
                />
              </div>
            )}
            {processes.length > 1 && (
              <button
                type="button"
                className="btn btn-danger btn-icon"
                onClick={() => onRemove(index)}
                title="Remove process"
              >
                ×
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
