# Signal Box — Semaphore Simulation (5 processes, 3 resources)

A visual simulation of a **counting semaphore** synchronizing 5 processes
competing for 3 shared resources. Framed as a railway signal box: 3
resources are "platforms," 5 processes are "trains," and the semaphore is
the signal that decides who gets a platform and who waits.

```
semaphore-sim/
├── backend/     Node.js + Express + WebSocket — the simulation engine
└── frontend/    React (Vite) — the live visualization
```

## What it demonstrates

- A **counting semaphore** initialized to 3 (`wait()` / `signal()`), the
  classic primitive for controlling access to a pool of N interchangeable
  resources — see `backend/semaphore.js`.
- **Mutual exclusion**: at most 3 processes hold a resource at once; the
  rest block.
- **FIFO blocking**: processes that call `wait()` while the semaphore is
  at 0 join a queue. On `signal()`, the permit is handed directly to the
  head of that queue rather than returned to the free pool first — this
  is what keeps the simulation starvation-free.
- Each process independently cycles: idle → request → (wait if none
  free) → use resource for a random interval → release → repeat.

## Running it

Requires Node.js 18+.

**1. Start the backend** (simulation engine + WebSocket server, port 4000):

```bash
cd backend
npm install
npm start
```

**2. Start the frontend** (Vite dev server, port 5173):

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). Press **Start**
to dispatch the trains. The `frontend/.env` file points the UI at
`ws://localhost:4000/ws` — change it if you run the backend elsewhere.

## How the UI maps to the concept

| Signal Box term | OS term |
|---|---|
| Platform (1–3) | Resource instance |
| Train (P1–P5) | Process |
| Signal blade green / diagonal | Platform free |
| Signal blade red / horizontal | Platform occupied |
| "En route" | Process not currently requesting a resource |
| "Held at signal" | Process blocked in `wait()`, queued |
| "On platform" | Process inside the critical section |
| Semaphore readout | Live value of the counting semaphore (0–3) |

The event log on the bottom-left is a live feed of every `wait()`,
`signal()`, acquire, and release, so you can trace exactly how the
semaphore's internal count and queue evolve over time.
