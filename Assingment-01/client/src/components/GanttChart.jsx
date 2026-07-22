import { getProcessColor } from "../utils/colors";

export default function GanttChart({ ganttChart, processIds }) {
  if (!ganttChart || ganttChart.length === 0) {
    return (
      <div className="card gantt-card">
        <h2>Gantt Chart</h2>
        <p className="empty-state">Run a simulation to see the Gantt chart.</p>
      </div>
    );
  }

  const totalTime = ganttChart[ganttChart.length - 1].end;
  const timeMarkers = Array.from({ length: totalTime + 1 }, (_, i) => i);

  return (
    <div className="card gantt-card">
      <h2>Gantt Chart</h2>
      <div className="gantt-wrapper">
        <div className="gantt-chart">
          {ganttChart.map((block, index) => {
            const width = ((block.end - block.start) / totalTime) * 100;
            const color = getProcessColor(block.processId, processIds);

            return (
              <div
                key={`${block.processId}-${block.start}-${index}`}
                className="gantt-block"
                style={{
                  width: `${width}%`,
                  backgroundColor: color,
                }}
                title={`${block.processId}: ${block.start} - ${block.end}`}
              >
                <span className="gantt-label">{block.processId}</span>
              </div>
            );
          })}
        </div>
        <div className="gantt-timeline">
          {timeMarkers.map((t) => (
            <span
              key={t}
              className="timeline-marker"
              style={{ left: `${(t / totalTime) * 100}%` }}
            >
              {t}
            </span>
          ))}
        </div>
      </div>
      <div className="gantt-legend">
        {processIds.map((id) => (
          <span key={id} className="legend-item">
            <span
              className="legend-color"
              style={{ backgroundColor: getProcessColor(id, processIds) }}
            />
            {id}
          </span>
        ))}
      </div>
    </div>
  );
}
