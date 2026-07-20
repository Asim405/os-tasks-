# CPU Scheduling Simulator

A full-stack CPU scheduling simulation app with a Node.js backend and React frontend.

## Features

- **Algorithms**: FCFS, SJF, Priority Scheduling, Round Robin
- **Gantt Chart**: Color-coded timeline visualization
- **Process Statistics**: Completion, turnaround, waiting, and response times
- **Summary**: Averages and CPU utilization
- **Responsive UI**: Works on desktop and mobile

## Setup

```bash
# Install all dependencies
npm run install:all

# Run both server and client
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Server (port 5000)
npm run server

# Terminal 2 - Client (port 3000)
npm run client
```

Open http://localhost:3000 in your browser.

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/algorithms` | List available algorithms |
| GET | `/api/sample` | Get sample process data |
| POST | `/api/simulate` | Run simulation |

### Simulate Request Body

```json
{
  "algorithm": "fcfs",
  "processes": [
    { "id": "P1", "arrivalTime": 0, "burstTime": 5, "priority": 2 }
  ],
  "quantum": 2
}
```

`quantum` is required only for Round Robin. `priority` is used for Priority Scheduling (lower number = higher priority).
