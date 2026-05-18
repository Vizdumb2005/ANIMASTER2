let rafId: number | null = null;
let running = false;

export const FIXED_DELTA_MS = 1000 / 60;

export function startTickLoop(onTick: (deltaMs: number) => void) {
  if (running) {
    return stopTickLoop;
  }

  running = true;
  let lastFrameTime = 0;
  let accumulator = 0;

  const step = (time: number) => {
    if (!running) {
      return;
    }

    if (lastFrameTime === 0) lastFrameTime = time;
    const frameDelta = Math.min(100, time - lastFrameTime);
    lastFrameTime = time;
    accumulator += frameDelta;

    while (accumulator >= FIXED_DELTA_MS) {
      onTick(FIXED_DELTA_MS);
      accumulator -= FIXED_DELTA_MS;
    }

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
