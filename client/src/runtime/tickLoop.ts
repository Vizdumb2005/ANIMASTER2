let rafId: number | null = null;
let running = false;

export function startTickLoop(onTick: (deltaMs: number) => void) {
  if (running) {
    return stopTickLoop;
  }

  running = true;
  let lastTime = performance.now();

  const step = (time: number) => {
    if (!running) {
      return;
    }

    const deltaMs = time - lastTime;
    lastTime = time;
    onTick(deltaMs);
    rafId = window.requestAnimationFrame(step);
  };

  rafId = window.requestAnimationFrame(step);
  return stopTickLoop;
}

export function stopTickLoop() {
  running = false;

  if (rafId !== null) {
    window.cancelAnimationFrame(rafId);
    rafId = null;
  }
}