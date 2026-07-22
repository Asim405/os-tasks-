import { useState, useEffect, useCallback } from "react";
import { fetchAlgorithms, fetchSample, runSimulation } from "./api/client";
import AlgorithmSelector from "./components/AlgorithmSelector";
import ProcessForm from "./components/ProcessForm";
import GanttChart from "./components/GanttChart";
import ProcessStats from "./components/ProcessStats";
import Summary from "./components/Summary";

const defaultProcess = (n) => ({
  id: `P${n}`,
  arrivalTime: 0,
  burstTime: 1,
  priority: 0,
});

export default function App() {
  const [algorithms, setAlgorithms] = useState([]);
  const [algorithm, setAlgorithm] = useState("fcfs");
  const [processes, setProcesses] = useState([
    { id: "P1", arrivalTime: 0, burstTime: 5, priority: 2 },
    { id: "P2", arrivalTime: 1, burstTime: 3, priority: 1 },
    { id: "P3", arrivalTime: 2, burstTime: 8, priority: 3 },
    { id: "P4", arrivalTime: 3, burstTime: 6, priority: 2 },
  ]);
  const [quantum, setQuantum] = useState(2);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const selectedAlgo = algorithms.find((a) => a.id === algorithm);
  const showPriority = selectedAlgo?.needsPriority ?? false;

  
  useEffect(() => {
    fetchAlgorithms()
      .then(setAlgorithms)
      .catch(() => setError("Could not connect to server. Start the backend first."));
  }, []);

  const handleSimulate = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runSimulation(algorithm, processes, Number(quantum));
      setResult(data);
    } catch (err) {
      setError(err.message);
      setResult(null);
    } finally {
      setLoading(false);
    }
  }, [algorithm, processes, quantum]);

  const handleLoadSample = async () => {
    try {
      const sample = await fetchSample();
      setProcesses(sample.processes);
      setQuantum(sample.quantum);
      setError(null);
    } catch {
      setError("Failed to load sample data");
    }
  };

  const handleProcessChange = (index, field, value) => {
    setProcesses((prev) =>
      prev.map((p, i) =>
        i === index
          ? {
              ...p,
              [field]:
                field === "id"
                  ? value
                  : field === "arrivalTime" || field === "burstTime" || field === "priority"
                    ? Number(value)
                    : value,
            }
          : p
      )
    );
  };

  const handleAddProcess = () => {
    setProcesses((prev) => [...prev, defaultProcess(prev.length + 1)]);
  };

  const handleRemoveProcess = (index) => {
    setProcesses((prev) => prev.filter((_, i) => i !== index));
  };

  const processIds = [...new Set(processes.map((p) => p.id))];

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>CPU Scheduling Simulator</h1>
            <p>Visualize FCFS, SJF, Priority, and Round Robin scheduling algorithms</p>
          </div>
          <div className="header-actions">
            <button type="button" className="btn btn-secondary" onClick={handleLoadSample}>
              Load Sample
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleSimulate}
              disabled={loading}
            >
              {loading ? "Running..." : "Run Simulation"}
            </button>
          </div>
        </div>
      </header>

      {error && <div className="error-banner">{error}</div>}

      <main className="main">
        <section className="input-section">
          <AlgorithmSelector
            algorithms={algorithms}
            selected={algorithm}
            onSelect={setAlgorithm}
            quantum={quantum}
            onQuantumChange={setQuantum}
          />
          <ProcessForm
            processes={processes}
            onChange={handleProcessChange}
            onAdd={handleAddProcess}
            onRemove={handleRemoveProcess}
            showPriority={showPriority}
          />
        </section>

        <section className="output-section">
          <Summary summary={result?.summary} algorithm={algorithm} />
          <GanttChart ganttChart={result?.ganttChart} processIds={processIds} />
          <ProcessStats processes={result?.processes} />
        </section>
      </main>

      <footer className="footer">
        <p>OS Summer Task — CPU Scheduling Simulation</p>
      </footer>
    </div>
  );
}
