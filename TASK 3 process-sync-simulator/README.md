# Critical Section Simulator

A visual demo of process synchronization concepts: **critical section**,
**race condition**, **Peterson's solution**, and a **mutex lock** — built
two ways, per the assignment:

1. **Full-stack version** (`backend/` + `frontend/`) — separate Node/Express
   backend and browser frontend.
2. **Single-file version** (`single-file/process-sync-demo.html`) — the
   entire thing (simulation logic + UI) in one HTML file. Just double-click
   it, no server needed.

Both versions run the *exact same simulation logic*.

## How the simulation works

Two "processes," P0 and P1, both try to increment a shared `counter` some
number of times. `counter++` is deliberately split into two steps —
**read** then **write** — with a possible context switch in between, because
that's exactly the gap where real race conditions happen.

- **No sync (`race`)** — neither process protects the critical section.
  Both can read the same value before either writes back, so an increment
  gets silently lost.
- **Peterson's solution (`peterson`)** — each process sets its own
  `flag[i] = true`, hands `turn` to the other process, then busy-waits only
  while the other process *both* wants in *and* it's the other's turn.
  Works correctly for exactly 2 processes.
- **Mutex lock (`mutex`)** — a single shared `lock` boolean. A process
  spins until the lock is free, then sets it before entering, and clears it
  on exit. Simple, general, but the process is blocked (busy-waiting) while
  it spins.

You can pick **alternate** scheduling (P0/P1 strictly take turns one step
at a time — this reliably exposes the race) or **random** (closer to a
real, unpredictable OS scheduler).

At the end, the demo compares the actual final counter to the expected
value (`iterations x 2`). Under `race` mode this is very likely to be
wrong; under `peterson` and `mutex` it will always be exactly right.

## Full-stack version

```bash
cd backend
npm install
npm start        # API on http://localhost:4100
```

Then open `frontend/index.html` in a browser (or `npx serve frontend`).
If your backend runs elsewhere, update the "API base" field top-right.

### API

| Method | Path            | Body                                                      |
|--------|-----------------|-------------------------------------------------------------|
| POST   | `/api/simulate` | `{ "mode": "peterson", "iterations": 8, "scheduling": "alternate" }` |

Returns the full step-by-step trace plus `finalCounter`, `expectedCounter`,
`lostUpdates`, and `correct`.

## Single-file version

Just open `single-file/process-sync-demo.html` directly in any browser.
Everything — simulation, UI, styling — is in that one file.
