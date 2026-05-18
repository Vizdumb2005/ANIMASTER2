import { Container, Graphics } from 'pixi.js';

interface SilhouetteFigure {
  x: number;
  y: number;
  speed: number;
  height: number;
  direction: number;
}

let figures: SilhouetteFigure[] = [];
let initialized = false;

function initFigures(width: number, height: number): void {
  figures = [];
  const horizonY = height * 0.5;
  for (let i = 0; i < 4; i++) {
    const dir = Math.random() > 0.5 ? 1 : -1;
    figures.push({
      x: Math.random() * width,
      y: horizonY - 10 + Math.random() * 15,
      speed: (0.1 + Math.random() * 0.2) * dir,
      height: 18 + Math.random() * 12,
      direction: dir
    });
  }
  initialized = true;
}

export function drawSilhouetteMovement(layer: Container, width: number, height: number, deltaMs: number, isLonely: boolean): void {
  if (!initialized) initFigures(width, height);

  if (isLonely) return;

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (const f of figures) {
    f.x += f.speed * dt;
    if (f.x > width + 20) f.x = -20;
    if (f.x < -20) f.x = width + 20;

    // Simple stick silhouette
    const headY = f.y - f.height;
    g.circle(f.x, headY, 3).fill({ color: 0x0a0a10, alpha: 0.25 });
    g.moveTo(f.x, headY + 3);
    g.lineTo(f.x, f.y);
    g.stroke({ color: 0x0a0a10, width: 2, alpha: 0.2 });
  }

  layer.addChild(g);
}

export function resetSilhouetteMovement(): void {
  initialized = false;
  figures = [];
}
