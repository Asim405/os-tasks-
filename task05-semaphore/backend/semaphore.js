// semaphore.js
// A classic counting semaphore with a FIFO wait queue, wired up to drive
// a 5-process / 3-resource simulation. All timing is simulated (no real
// threads) so the whole thing is fully deterministic and inspectable.

const RESOURCE_COUNT = 3;
const PROCESS_COUNT = 5;

const STATE = {
  THINKING: "thinking",   // not interested in a resource right now
  WAITING: "waiting",     // blocked on the semaphore (queued)
  USING: "using",         // holds a resource, inside the critical section
};

function randRange(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

class CountingSemaphore {
  constructor(value) {
    this.value = value;       // free permits
    this.max = value;
    this.queue = [];          // FIFO of processIds blocked on wait()
  }

  // Returns true if the permit was granted immediately, false if queued.
  wait(processId) {
    if (this.value > 0) {
      this.value -= 1;
      return true;
    }
    this.queue.push(processId);
    return false;
  }

  // Releases a permit. If a process is waiting, hands the permit directly
  // to the head of the queue (classic semaphore hand-off) and returns that
  // processId; otherwise increments the free count and returns null.
  signal() {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      return next;
    }
    this.value = Math.min(this.max, this.value + 1);
    return null;
  }
}

class Engine {
  constructor(broadcast) {
    this.broadcast = broadcast; // fn(state) -> void, pushed to all clients
    this.semaphore = new CountingSemaphore(RESOURCE_COUNT);
    this.speed = 1; // multiplier, 0.5x - 3x
    this.running = false;
    this.tickHandle = null;

    this.resources = Array.from({ length: RESOURCE_COUNT }, (_, i) => ({
      id: i,
      ownerId: null,
    }));

    this.processes = Array.from({ length: PROCESS_COUNT }, (_, i) => ({
      id: i,
      label: `P${i + 1}`,
      state: STATE.THINKING,
      resourceId: null,
      remainingMs: randRange(1500, 3500),
      waitSince: null,
      stats: { acquires: 0, totalWaitMs: 0 },
    }));

    this.log = []; // ring buffer of recent events
    this.lastTickAt = Date.now();
  }

  pushLog(entry) {
    const stamped = { ...entry, t: Date.now() };
    this.log.push(stamped);
    if (this.log.length > 60) this.log.shift();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTickAt = Date.now();
    this.tickHandle = setInterval(() => this.tick(), 200);
    this.pushLog({ type: "system", message: "Simulation started" });
    this.emit();
  }

  pause() {
    if (!this.running) return;
    this.running = false;
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = null;
    this.pushLog({ type: "system", message: "Simulation paused" });
    this.emit();
  }

  reset() {
    if (this.tickHandle) clearInterval(this.tickHandle);
    this.tickHandle = null;
    this.running = false;
    this.semaphore = new CountingSemaphore(RESOURCE_COUNT);
    this.resources = Array.from({ length: RESOURCE_COUNT }, (_, i) => ({
      id: i,
      ownerId: null,
    }));
    this.processes = Array.from({ length: PROCESS_COUNT }, (_, i) => ({
      id: i,
      label: `P${i + 1}`,
      state: STATE.THINKING,
      resourceId: null,
      remainingMs: randRange(1500, 3500),
      waitSince: null,
      stats: { acquires: 0, totalWaitMs: 0 },
    }));
    this.log = [];
    this.pushLog({ type: "system", message: "Simulation reset" });
    this.emit();
  }

  setSpeed(speed) {
    this.speed = Math.max(0.25, Math.min(4, Number(speed) || 1));
    this.emit();
  }

  requestResource(processId) {
    const p = this.processes[processId];
    if (!p || p.state !== STATE.THINKING) return;
    const granted = this.semaphore.wait(processId);
    if (granted) {
      this.grantResource(p);
    } else {
      p.state = STATE.WAITING;
      p.waitSince = Date.now();
      this.pushLog({
        type: "wait",
        processId,
        message: `${p.label} requested a resource — none free, entered wait queue`,
      });
    }
  }

  grantResource(p) {
    const freeResource = this.resources.find((r) => r.ownerId === null);
    if (!freeResource) return; // shouldn't happen if semaphore accounting is correct
    freeResource.ownerId = p.id;
    p.resourceId = freeResource.id;
    p.state = STATE.USING;
    p.remainingMs = randRange(1800, 4200);
    p.stats.acquires += 1;
    if (p.waitSince) {
      p.stats.totalWaitMs += Date.now() - p.waitSince;
      p.waitSince = null;
    }
    this.pushLog({
      type: "acquire",
      processId: p.id,
      message: `${p.label} acquired Resource ${freeResource.id + 1}`,
    });
  }

  releaseResource(processId) {
    const p = this.processes[processId];
    if (!p || p.state !== STATE.USING) return;
    const resource = this.resources[p.resourceId];
    resource.ownerId = null;
    this.pushLog({
      type: "release",
      processId,
      message: `${p.label} released Resource ${p.resourceId + 1}`,
    });
    p.resourceId = null;
    p.state = STATE.THINKING;
    p.remainingMs = randRange(1200, 3000);

    const handedTo = this.semaphore.signal();
    if (handedTo !== null) {
      const waiter = this.processes[handedTo];
      this.grantResource(waiter);
    }
  }

  tick() {
    const now = Date.now();
    const elapsed = (now - this.lastTickAt) * this.speed;
    this.lastTickAt = now;

    for (const p of this.processes) {
      if (p.state === STATE.WAITING) continue; // waiting has no countdown, it's blocked
      p.remainingMs -= elapsed;
      if (p.remainingMs <= 0) {
        if (p.state === STATE.THINKING) {
          this.requestResource(p.id);
        } else if (p.state === STATE.USING) {
          this.releaseResource(p.id);
        }
      }
    }
    this.emit();
  }

  getState() {
    return {
      running: this.running,
      speed: this.speed,
      semaphore: {
        value: this.semaphore.value,
        max: this.semaphore.max,
        queue: [...this.semaphore.queue],
      },
      resources: this.resources.map((r) => ({ ...r })),
      processes: this.processes.map((p) => ({
        ...p,
        stats: { ...p.stats },
      })),
      log: this.log.slice(-25),
    };
  }

  emit() {
    this.broadcast(this.getState());
  }
}

module.exports = { Engine, STATE, RESOURCE_COUNT, PROCESS_COUNT };
