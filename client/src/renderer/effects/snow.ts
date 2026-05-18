import { Container, Graphics } from 'pixi.js';

// --- Task 214: Snow Particle System ---

const FLAKE_COUNT = 60;

interface Snowflake {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedY: number;
  wobblePhase: number;
  wobbleSpeed: number;
}

let flakes: Snowflake[] = [];
let initialized = false;

function seededUnit(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function initFlakes(width: number, height: number): void {
  flakes = [];
  for (let i = 0; i < FLAKE_COUNT; i++) {
    flakes.push({
      x: seededUnit(i, 1) * width,
      y: seededUnit(i, 2) * height,
      radius: 1.5 + seededUnit(i, 3) * 2.5,
      opacity: 0.3 + seededUnit(i, 4) * 0.4,
      speedY: 0.5 + seededUnit(i, 5) * 1.2,
      wobblePhase: seededUnit(i, 6) * Math.PI * 2,
      wobbleSpeed: 0.002 + seededUnit(i, 7) * 0.003,
    });
  }
  initialized = true;
}

export function drawSnow(layer: Container, width: number, height: number, deltaMs: number): void {
  if (!initialized) {
    initFlakes(width, height);
  }

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (let i = 0; i < flakes.length; i++) {
    const flake = flakes[i];
    flake.y += flake.speedY * dt;
    flake.wobblePhase += flake.wobbleSpeed * deltaMs;
    flake.x += Math.sin(flake.wobblePhase) * 0.4 * dt;

    if (flake.y > height + flake.radius) {
      flake.y = -flake.radius * 2;
      flake.x = seededUnit(i, Math.floor(flake.y + flake.x) + 10) * width;
    }

    g.circle(flake.x, flake.y, flake.radius)
      .fill({ color: 0xe8e8f0, alpha: flake.opacity });
  }

  layer.addChild(g);
}

export function resetSnow(): void {
  initialized = false;
  flakes = [];
}
