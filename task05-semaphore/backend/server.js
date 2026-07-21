// server.js
// Express serves a couple of REST endpoints for convenience; the live
// simulation stream and controls run over a WebSocket so every connected
// client sees the same state update at the same time.

const express = require("express");
const cors = require("cors");
const http = require("http");
const WebSocket = require("ws");
const { Engine } = require("./semaphore");

const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocket.Server({ server, path: "/ws" });

function broadcast(state) {
  const payload = JSON.stringify({ type: "state", data: state });
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) client.send(payload);
  });
}

const engine = new Engine(broadcast);

wss.on("connection", (ws) => {
  ws.send(JSON.stringify({ type: "state", data: engine.getState() }));

  ws.on("message", (raw) => {
    let msg;
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }
    switch (msg.type) {
      case "start":
        engine.start();
        break;
      case "pause":
        engine.pause();
        break;
      case "reset":
        engine.reset();
        break;
      case "speed":
        engine.setSpeed(msg.value);
        break;
      default:
        break;
    }
  });
});

app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.get("/api/state", (_req, res) => res.json(engine.getState()));

server.listen(PORT, () => {
  console.log(`Semaphore simulation backend listening on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/ws`);
});
