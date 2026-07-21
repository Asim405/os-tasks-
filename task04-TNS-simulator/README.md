# Test-and-Set Hardware Lock Simulator

An interactive simulation of the **Test-and-Set (TAS)** hardware instruction — the
primitive most spinlocks are built on — for an OS coursework project on process
synchronization.

The backend actually runs the concurrency: multiple async "processes" race to
acquire a shared lock using either the real atomic instruction or a **naive**
non-atomic version that reopens the race window TAS exists to close. The frontend
plays back the resulting event trace as a live register readout, a logic-analyzer
style "bus timeline," and a color-coded event log.

```
tas-simulator/
├── backend/    Node/Express simulation engine  → deploy to Vercel
└── frontend/   React (Vite) visualizer         → deploy to Netlify
```

## How it works

- **Atomic mode** — `TestAndSet()` is a single synchronous function with no
  `await` inside it, so nothing in the JS event loop can interleave inside it.
  This mirrors the bus-locked, indivisible nature of the real instruction.
  Mutual exclusion holds every time.
- **Naive mode** — the read and write of the lock are split across an `await`,
  giving other processes a window to slip through. Run it a few times and
  you'll see `mutualExclusionViolations > 0`.

## Running locally

**Backend**
```bash
cd backend
npm install
npm run dev        # http://localhost:4000
```

**Frontend**
```bash
cd frontend
cp .env.example .env       # VITE_API_URL=http://localhost:4000
npm install
npm run dev                 # http://localhost:5173
```

## Deploying

### Backend → Vercel

1. Push the `backend/` folder to its own GitHub repo (or point Vercel at the
   `backend` subdirectory of a monorepo via the project's Root Directory
   setting).
2. Import the repo in Vercel. It already includes `vercel.json`, which routes
   all requests to `server.js` as a serverless function — no extra config
   needed.
3. Note the deployed URL, e.g. `https://tas-backend.vercel.app`.

### Frontend → Netlify

1. Push the `frontend/` folder to its own GitHub repo (or point Netlify at the
   `frontend` subdirectory via **Base directory**).
2. Build command: `npm run build` · Publish directory: `dist` (already set in
   `netlify.toml`).
3. Add an environment variable in **Site settings → Environment variables**:
   - `VITE_API_URL` = your Vercel backend URL from above (no trailing slash).
4. Redeploy. The frontend will call the live backend for every simulation run.

### CORS

The backend has `cors()` enabled with no origin restriction, so it will accept
requests from your Netlify domain out of the box. If you want to lock it down
later, restrict `cors()` to your Netlify origin in `backend/server.js`.
