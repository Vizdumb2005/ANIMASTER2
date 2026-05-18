import { Container, Graphics } from 'pixi.js';

let grainSeed = 0;

export function drawFilmGrain(layer: Container, width: number, height: number, _elapsedMs: number): void {
  grainSeed++;
  const g = new Graphics();
  const step = 12;
  const rng = mulberry32(grainSeed);

  for (let x = 0; x < width; x += step) {
    for (let y = 0; y < height; y += step) {
      const v = rng();
      if (v > 0.6) {
        const brightness = v > 0.85 ? 0xffffff : 0x000000;
        const alpha = 0.015 + (v - 0.6) * 0.04;
        g.rect(x, y, step, step).fill({ color: brightness, alpha });
      }
    }
  }

  layer.addChild(g);
}

function mulberry32(seed: number): () => number {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
