const els = {
  apiUrl: document.getElementById('apiUrl'),
  modeSwitch: document.getElementById('modeSwitch'),
  modeHint: document.getElementById('modeHint'),
  schedSwitch: document.getElementById('schedSwitch'),
  iterations: document.getElementById('iterations'),
  speed: document.getElementById('speed'),
  runBtn: document.getElementById('runBtn'),
  pseudocode: document.getElementById('pseudocode'),
  p0card: document.getElementById('p0card'),
  p1card: document.getElementById('p1card'),
  p0status: document.getElementById('p0status'),
  p1status: document.getElementById('p1status'),
  counterVal: document.getElementById('counterVal'),
  flag0Val: document.getElementById('flag0Val'),
  flag1Val: document.getElementById('flag1Val'),
  turnVal: document.getElementById('turnVal'),
  lockVal: document.getElementById('lockVal'),
  resultBar: document.getElementById('resultBar'),
  traceLog: document.getElementById('traceLog'),
};

let currentMode = 'race';
let currentSched = 'alternate';

const HINTS = {
  race: 'No entry/exit protocol at all. Both processes read-modify-write the counter directly — updates can be lost.',
  peterson: "Peterson's algorithm: each process sets its own flag, then yields turn to the other. It waits only if the other wants in AND it is the other's turn.",
  mutex: 'A single shared lock. A process must acquire() the lock before entering, and release() it on exit. Only one holder at a time.',
  spinlock: 'A spin lock is a simple lock that busy-waits until the lock becomes available, then grabs it and enters the critical section.',
};

const PSEUDOCODE = {
  race: `// Process i (NO synchronization)
repeat:
    temp = counter      // read
    counter = temp + 1  // write
forever`,
  peterson: `// Process i, other process j
flag[i] = true
turn = j
while (flag[j] && turn == j)
    ;  // busy-wait

    // critical section
    temp = counter
    counter = temp + 1

flag[i] = false`,
  mutex: `// Process i
acquire(lock):
    while (lock)
        ;  // busy-wait
    lock = true

    // critical section
    temp = counter
    counter = temp + 1

release(lock):
    lock = false`,
  spinlock: `// Process i
acquire(lock):
    while (lock)
        ;  // busy-wait
    lock = true

    // critical section
    temp = counter
    counter = temp + 1

release(lock):
    lock = false`,
};

function apiBase() {
  return els.apiUrl.value.trim().replace(/\/$/, '');
}

function updateHintAndCode() {
  els.modeHint.textContent = HINTS[currentMode];
  els.pseudocode.textContent = PSEUDOCODE[currentMode];
}

[...els.modeSwitch.children].forEach((btn) => {
  btn.addEventListener('click', () => {
    currentMode = btn.dataset.mode;
    [...els.modeSwitch.children].forEach((b) => b.classList.toggle('active', b === btn));
    updateHintAndCode();
  });
});

[...els.schedSwitch.children].forEach((btn) => {
  btn.addEventListener('click', () => {
    currentSched = btn.dataset.sched;
    [...els.schedSwitch.children].forEach((b) => b.classList.toggle('active', b === btn));
  });
});

function resetVisual() {
  els.counterVal.textContent = '0';
  els.flag0Val.textContent = 'false';
  els.flag1Val.textContent = 'false';
  els.turnVal.textContent = '–';
  els.lockVal.textContent = 'false';
  els.p0status.textContent = 'idle';
  els.p1status.textContent = 'idle';
  els.p0card.className = 'process-card';
  els.p1card.className = 'process-card';
  els.resultBar.className = 'result-bar';
  els.traceLog.innerHTML = '';
}

function applyEntry(entry) {
  const { proc, type, text, state } = entry;
  els.counterVal.textContent = state.counter;
  els.flag0Val.textContent = state.flag[0];
  els.flag1Val.textContent = state.flag[1];
  els.turnVal.textContent = state.turn;
  els.lockVal.textContent = state.lock;

  const card = proc === 0 ? els.p0card : els.p1card;
  const status = proc === 0 ? els.p0status : els.p1status;
  const otherCard = proc === 0 ? els.p1card : els.p0card;

  card.className = 'process-card ' + (type === 'wait' ? 'active-wait' : type === 'cs' ? 'active-cs' : 'active-entry');
  otherCard.classList.remove('active-cs', 'active-wait', 'active-entry');
  status.textContent = text;

  const row = document.createElement('div');
  row.className = `trace-row p${proc} ${type === 'wait' ? 'wait' : ''} ${type === 'cs' ? 'cs' : ''}`;
  row.innerHTML = `<span class="trace-tag">P${proc}</span><span>${text}</span>`;
  els.traceLog.appendChild(row);
  els.traceLog.scrollTop = els.traceLog.scrollHeight;
}

function playLog(logs, onDone) {
  const speed = parseInt(els.speed.value, 10);
  let i = 0;
  function step() {
    if (i >= logs.length) return onDone();
    applyEntry(logs[i]);
    i++;
    setTimeout(step, speed);
  }
  step();
}

async function runSimulation() {
  const iterations = parseInt(els.iterations.value, 10);
  resetVisual();
  els.runBtn.disabled = true;
  els.runBtn.textContent = 'Running…';

  try {
    const res = await fetch(`${apiBase()}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: currentMode, iterations, scheduling: currentSched }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Request failed');

    playLog(data.logs, () => {
      els.resultBar.classList.add('show', data.correct ? 'ok' : 'bad');
      els.resultBar.textContent = data.correct
        ? `✓ Final counter = ${data.finalCounter} (expected ${data.expectedCounter}). No updates lost — ${modeName(currentMode)} kept the critical section safe.`
        : `✗ Final counter = ${data.finalCounter} (expected ${data.expectedCounter}). ${data.lostUpdates} update(s) lost to the race condition.`;
      els.runBtn.disabled = false;
      els.runBtn.textContent = 'Run simulation';
    });
  } catch (err) {
    els.resultBar.classList.add('show', 'bad');
    els.resultBar.textContent = `Error: ${err.message}`;
    els.runBtn.disabled = false;
    els.runBtn.textContent = 'Run simulation';
  }
}

function modeName(m) {
  return m === 'peterson'
    ? "Peterson's algorithm"
    : m === 'mutex'
    ? 'the mutex lock'
    : m === 'spinlock'
    ? 'the spin lock'
    : 'no synchronization';
}

els.runBtn.addEventListener('click', runSimulation);
updateHintAndCode();
