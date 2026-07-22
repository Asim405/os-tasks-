export const PROCESS_COLORS = [
  "#6366f1",
  "#781245",
  "#166c62",
  "#69460a",
  "#4f09f3",
  "#f31414",
  "#7cc6d3",
  "#84cc16",
  "#f0a672",
  "#00deee",
];

export function getProcessColor(processId, allIds) {
  const index = allIds.indexOf(processId);
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

export const ALGORITHM_COLORS = {
  fcfs: { bg: "#dbeafe", text: "#1d4ed8", border: "#93c5fd" },
  sjf: { bg: "#dcfce7", text: "#15803d", border: "#86efac" },
  priority: { bg: "#fce7f3", text: "#be185d", border: "#f9a8d4" },
  roundRobin: { bg: "#fef3c7", text: "#b45309", border: "#fcd34d" },
};
