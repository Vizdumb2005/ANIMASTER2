import { Container, Graphics } from 'pixi.js';

const DROP_COUNT = 100;
const ANGLE = Math.PI / 4;

interface RainDrop {
  x: number;
  y: number;
  length: number;
  opacity: number;
  speed: number;
}

let drops: RainDrop[] = [];
let initialized = false;

function initDrops(width: number, height: number) {
  drops = [];
  for (let i = 0; i < DROP_COUNT; i++) {
    drops.push({
      x: Math.random() * (width + 100) - 50,
      y: Math.random() * height,
      length: 8 + Math.random() * 7,
      opacity: 0.3 + Math.random() * 0.4,
      speed: 4 + Math.random() * 4
    });
  }
  initialized = true;
}

export function drawRain(layer: Container, width: number, height: number, deltaMs: number) {
  if (!initialized) {
    initDrops(width, height);
  }

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (const drop of drops) {
    drop.x += Math.cos(ANGLE) * drop.speed * dt;
    drop.y += Math.sin(ANGLE) * drop.speed * dt * 2;

    if (drop.y > height) {
      drop.y = -drop.length;
      drop.x = Math.random() * (width + 100) - 50;
    }

    const endX = drop.x + Math.cos(ANGLE) * drop.length;
    const endY = drop.y + Math.sin(ANGLE) * drop.length;

    g.moveTo(drop.x, drop.y);
    g.lineTo(endX, endY);
    g.stroke({ color: 0xaaccff, width: 1, alpha: drop.opacity });
  }

  layer.addChild(g);
}

export function resetRain() {
  initialized = false;
  drops = [];
}
