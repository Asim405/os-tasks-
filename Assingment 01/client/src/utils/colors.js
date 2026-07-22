export const PROCESS_COLORS = [
  "#00d4ff",
  "#0284c7",
  "#00e5ff",
  "#06b6d4",
  "#0ea5e9",
  "#0284c7",
  "#00c9ff",
  "#0096d6",
  "#00b0ff",
  "#00e1ff",
];

export function getProcessColor(processId, allIds) {
  const index = allIds.indexOf(processId);
  return PROCESS_COLORS[index % PROCESS_COLORS.length];
}

export const ALGORITHM_COLORS = {
  fcfs: { bg: "#cffafe", text: "#0c4a6e", border: "#06b6d4" },
  sjf: { bg: "#e0f2fe", text: "#0369a1", border: "#0284c7" },
  priority: { bg: "#d1f5ff", text: "#0e5a84", border: "#00d4ff" },
  roundRobin: { bg: "#cffafe", text: "#0c4a6e", border: "#0ea5e9" },
};
