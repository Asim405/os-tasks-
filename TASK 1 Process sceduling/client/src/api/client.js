const API_BASE = "https://os-tasks.vercel.app/api";
export async function fetchAlgorithms() {
  const res = await fetch(`${API_BASE}/algorithms`);
  if (!res.ok) throw new Error("Failed to fetch algorithms");
  return res.json();
}

export async function fetchSample() {
  const res = await fetch(`${API_BASE}/sample`);
  if (!res.ok) throw new Error("Failed to fetch sample data");
  return res.json();
}

export async function runSimulation(algorithm, processes, quantum) {
  const res = await fetch(`${API_BASE}/simulate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ algorithm, processes, quantum }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Simulation failed");
  return data;
}
