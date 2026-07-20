# Disk Allocation Console

A full-stack simulator of the three classic OS file allocation strategies —
**Sequential (Contiguous)**, **Linked**, and **Indexed** — with a Node.js/Express
backend and a browser frontend.

```
project/
├── backend/          Express API + allocation logic
│   ├── allocation.js  Disk + strategy classes
│   ├── server.js      REST endpoints
│   └── package.json
└── frontend/          Static site (no build step needed)
    ├── index.html
    ├── style.css
    └── script.js
```

## Run the backend

```bash
cd backend
npm install
npm start
```

This starts the API at `http://localhost:4000`.

## Run the frontend

The frontend is plain HTML/CSS/JS — no build step. Just open it:

```bash
cd frontend
# Easiest: use any static file server, e.g.
npx serve .
```

Then open the printed URL (or just double-click `index.html`) in your browser.
If your backend runs on a different host/port, update the "API base" field
at the top right of the page.

## What it demonstrates

- **Sequential allocation** — a file must find one unbroken run of free
  blocks. Try deleting a file from the middle of the disk, then creating a
  new file bigger than any single remaining gap — it will fail even though
  total free space is enough. That's external fragmentation.
- **Linked allocation** — blocks can be scattered anywhere; each block
  stores a pointer to the next one in the file's chain. No fragmentation
  problem, but you can't jump straight to block 10 of a file — you must
  follow the chain from the start.
- **Indexed allocation** — one dedicated index block stores pointers to
  every data block of a file, shown with a hatched pattern in the disk map.
  Costs one extra block per file but gives direct access to any block.

## API reference

| Method | Path              | Body                        | Description                          |
|--------|-------------------|------------------------------|---------------------------------------|
| GET    | `/api/state`      | –                            | Current disk map, files, method       |
| POST   | `/api/init`       | `{ "size": 40 }`              | Rebuild disk with N blocks            |
| POST   | `/api/method`     | `{ "method": "linked" }`      | Switch strategy (clears disk)         |
| POST   | `/api/files`      | `{ "name": "a.txt", "blocks": 5 }` | Allocate a file                  |
| DELETE | `/api/files/:name`| –                            | Free a file's blocks                  |
