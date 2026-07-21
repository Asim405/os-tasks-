// simulate.js
//
// Models the hardware Test-and-Set (TAS) instruction used to build spinlocks.
//
//   TAS(lock):
//     atomic {
//       old   = lock
//       lock  = true
//       return old
//     }
//
// On real hardware this is a single bus-locked cycle: nothing can observe
// the register between the read and the write. We reproduce that here with
// a plain synchronous JS function — since it contains no `await`, nothing
// in the event loop can interleave inside it, which is exactly the
// atomicity guarantee the instruction provides.
//
// To make the payoff of that atomicity visible, `mode: "naive"` runs a
// version that reads the flag, yields to the event loop, and only then
// writes it — reopening the window TAS is designed to close. Multiple
// processes can slip through that window and believe they both hold the
// lock, which is the exact bug mutual exclusion primitives exist to
// prevent.

function randDelay(min, max) {
  if (max <= min) return min;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function runSimulation({
  processCount,
  mode,
  minDelay,
  maxDelay,
  criticalSectionTime,
  attemptsPerProcess,
}) {
  const startTime = Date.now();
  const log = [];

  let lock = false; // the shared hardware lock register
  let holders = 0; // how many processes currently believe they hold the lock
  let violations = 0;
  let maxConcurrentHolders = 0;

  const timestamp = () => Date.now() - startTime;

  function record(processId, event, extra = {}) {
    log.push({ time: timestamp(), process: processId, event, lockValue: lock, ...extra });
  }

  // Atomic instruction: fully synchronous, cannot be interleaved.
  function testAndSet() {
    const old = lock;
    lock = true;
    return old;
  }

  // Non-atomic version: the await between read and write is the bug.
  async function naiveTestAndSet() {
    const old = lock;
    await sleep(0);
    lock = true;
    return old;
  }

  async function runProcess(id) {
    for (let attempt = 0; attempt < attemptsPerProcess; attempt++) {
      await sleep(randDelay(0, minDelay));
      record(id, 'ATTEMPT');

      let spins = 0;
      // Busy-wait ("spin") until the lock is observed free and claimed.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const wasLocked = mode === 'naive' ? await naiveTestAndSet() : testAndSet();
        if (!wasLocked) break;
        spins += 1;
        record(id, 'SPIN', { spins });
        await sleep(randDelay(5, 25));
      }

      holders += 1;
      maxConcurrentHolders = Math.max(maxConcurrentHolders, holders);
      record(id, 'ACQUIRED', { spins });

      if (holders > 1) {
        violations += 1;
        record(id, 'RACE_VIOLATION', { concurrentHolders: holders });
      }

      record(id, 'IN_CRITICAL_SECTION');
      await sleep(randDelay(Math.round(criticalSectionTime * 0.7), Math.round(criticalSectionTime * 1.3)));

      holders -= 1;
      lock = false;
      record(id, 'RELEASED');

      await sleep(randDelay(minDelay, maxDelay));
    }
  }

  const processes = Array.from({ length: processCount }, (_, i) => runProcess(i + 1));
  await Promise.all(processes);

  log.sort((a, b) => a.time - b.time);

  return {
    mode,
    processCount,
    log,
    summary: {
      totalEvents: log.length,
      mutualExclusionViolations: violations,
      maxConcurrentHolders,
      durationMs: timestamp(),
    },
  };
}
