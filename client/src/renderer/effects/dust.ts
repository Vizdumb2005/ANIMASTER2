import { Container, Graphics } from 'pixi.js';

interface DustMote {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
}

let motes: DustMote[] = [];
let initialized = false;

function initMotes(width: number, height: number): void {
  motes = [];
  for (let i = 0; i < 20; i++) {
    motes.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.6,
      vx: (Math.random() - 0.5) * 0.15,
      vy: -0.05 + Math.random() * 0.1,
      size: 1.5 + Math.random() * 2,
      alpha: 0.08 + Math.random() * 0.15
    });
  }
  initialized = true;
}

export function drawDust(layer: Container, width: number, height: number, deltaMs: number): void {
  if (!initialized) initMotes(width, height);

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (const m of motes) {
    m.x += m.vx * dt;
    m.y += m.vy * dt;
    m.x += Math.sin(m.y * 0.02) * 0.08;
    if (m.x < -10) m.x = width + 10;
    if (m.x > width + 10) m.x = -10;
    if (m.y < -10 || m.y > height * 0.7) {
      m.y = Math.random() * height * 0.6;
      m.x = Math.random() * width;
    }
    g.circle(m.x, m.y, m.size).fill({ color: 0xeeddcc, alpha: m.alpha });
  }

  layer.addChild(g);
}

export function resetDust(): void {
  initialized = false;
  motes = [];
}
