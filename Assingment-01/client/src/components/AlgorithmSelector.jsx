import { ALGORITHM_COLORS } from "../utils/colors";

export default function AlgorithmSelector({
  algorithms,
  selected,
  onSelect,
  quantum,
  onQuantumChange,
}) {
  const selectedAlgo = algorithms.find((a) => a.id === selected);

  return (
    <div className="card algorithm-card">
      <h2>Scheduling Algorithm</h2>
      <div className="algorithm-grid">
        {algorithms.map((algo) => {
          const colors = ALGORITHM_COLORS[algo.id] || ALGORITHM_COLORS.fcfs;
          const isActive = selected === algo.id;

          return (
            <button
              key={algo.id}
              type="button"
              className={`algorithm-btn ${isActive ? "active" : ""}`}
              style={
                isActive
                  ? {
                      backgroundColor: colors.bg,
                      color: colors.text,
                      borderColor: colors.border,
                    }
                  : {}
              }
              onClick={() => onSelect(algo.id)}
            >
              <span className="algo-short">{algo.id.toUpperCase()}</span>
              <span className="algo-name">{algo.name}</span>
            </button>
          );
        })}
      </div>

      {selectedAlgo?.needsQuantum && (
        <div className="quantum-input">
          <label htmlFor="quantum">Time Quantum</label>
          <input
            id="quantum"
            type="number"
            min="1"
            value={quantum}
            onChange={(e) => onQuantumChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
}
