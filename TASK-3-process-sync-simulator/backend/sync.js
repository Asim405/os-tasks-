

function snapshot(shared) {
  return { counter: shared.counter, flag: [...shared.flag], turn: shared.turn, lock: shared.lock };
}

function* processRoutine(id, otherId, iterations, mode, shared, log) {
  for (let i = 0; i < iterations; i++) {
    // ---------------- Entry section ----------------
    if (mode === 'peterson') {
      shared.flag[id] = true;
      shared.turn = otherId;
      log({ proc: id, type: 'entry', text: `flag[${id}] = true;  turn = ${otherId}`, state: snapshot(shared) });
      while (shared.flag[otherId] && shared.turn === otherId) {
        log({ proc: id, type: 'wait', text: `busy-wait: flag[${otherId}]=true AND turn=${otherId}`, state: snapshot(shared) });
        yield;
      }
    } else if (mode === 'mutex' || mode === 'spinlock') {
      while (shared.lock) {
        log({ proc: id, type: 'wait', text: `blocked — lock is held`, state: snapshot(shared) });
        yield;
      }
      shared.lock = true;
      log({ proc: id, type: 'entry', text: `acquire(lock) succeeded`, state: snapshot(shared) });
    } else {
      log({ proc: id, type: 'entry', text: `no entry protocol (unsafe!)`, state: snapshot(shared) });
    }

    // ---------------- Critical section ----------------
    // Split into READ then WRITE with a yield between them, so a context
    // switch can land in the gap — this is the actual race window.
    const temp = shared.counter;
    log({ proc: id, type: 'cs', text: `iter ${i + 1}: read counter (=${temp}) into local temp`, state: snapshot(shared) });
    yield; // <-- context switch can happen here
    shared.counter = temp + 1;
    log({ proc: id, type: 'cs', text: `iter ${i + 1}: write counter = temp+1 = ${shared.counter}`, state: snapshot(shared) });

    // ---------------- Exit section ----------------
    if (mode === 'peterson') {
      shared.flag[id] = false;
      log({ proc: id, type: 'exit', text: `flag[${id}] = false`, state: snapshot(shared) });
    } else if (mode === 'mutex' || mode === 'spinlock') {
      shared.lock = false;
      log({ proc: id, type: 'exit', text: `release(lock)`, state: snapshot(shared) });
    }
    yield;
  }
}


function runSimulation({ mode = 'race', iterations = 5, scheduling = 'alternate' } = {}) {
  const shared = { counter: 0, flag: [false, false], turn: 0, lock: false };
  const logs = [];
  const log = (entry) => logs.push(entry);

  const p0 = processRoutine(0, 1, iterations, mode, shared, log); 
  const p1 = processRoutine(1, 0, iterations, mode, shared, log);

  let done0 = false;
  let done1 = false;
  let turnPicker = 0;
  let steps = 0;
  const MAX_STEPS = 20000; // safety valve against runaway loops
  let truncated = false;

  while (!done0 || !done1) {
    if (steps++ > MAX_STEPS) {
      truncated = true;
      break;
    }
    let pick;
    if (done0) pick = 1;
    else if (done1) pick = 0;
    else if (scheduling === 'random') pick = Math.random() < 0.5 ? 0 : 1;
    else { pick = turnPicker % 2; turnPicker++; }

    if (pick === 0) {
      const r = p0.next();
      done0 = r.done;
    } else {
      const r = p1.next();
      done1 = r.done;
    }
  }

  const expected = iterations * 2;
  return {
    mode,
    iterations,
    scheduling,
    finalCounter: shared.counter,
    expectedCounter: expected,
    lostUpdates: expected - shared.counter,
    correct: shared.counter === expected,
    truncated,
    logs,
  };
}

module.exports = { runSimulation };
