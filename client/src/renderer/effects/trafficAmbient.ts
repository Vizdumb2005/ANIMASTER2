import { Container, Graphics } from 'pixi.js';

interface TrafficLight {
  x: number;
  y: number;
  speed: number;
  alpha: number;
  color: number;
}

let lights: TrafficLight[] = [];
let initialized = false;

function initLights(width: number, height: number): void {
  lights = [];
  const horizonY = height * 0.5;
  for (let i = 0; i < 8; i++) {
    lights.push({
      x: Math.random() * width,
      y: horizonY - 20 + Math.random() * 30,
      speed: 0.3 + Math.random() * 0.6,
      alpha: 0.08 + Math.random() * 0.12,
      color: Math.random() > 0.7 ? 0xff4444 : 0xffe888
    });
  }
  initialized = true;
}

export function drawTrafficAmbient(layer: Container, width: number, height: number, deltaMs: number): void {
  if (!initialized) initLights(width, height);

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (const l of lights) {
    l.x += l.speed * dt;
    if (l.x > width + 5) {
      l.x = -5;
      l.y = height * 0.5 - 20 + Math.random() * 30;
    }
    g.circle(l.x, l.y, 2).fill({ color: l.color, alpha: l.alpha });
  }

  layer.addChild(g);
}

export function resetTrafficAmbient(): void {
  initialized = false;
  lights = [];
}
