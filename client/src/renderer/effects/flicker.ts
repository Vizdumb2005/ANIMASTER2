import { Container, Graphics } from 'pixi.js';

let randomOffset = Math.random() * 100;

export function drawFlicker(layer: Container, x: number, y: number, elapsed: number) {
  const base = Math.sin(elapsed * 0.012 + randomOffset) * 0.15 + 0.85;
  const fullFlicker = Math.random() < 0.005 ? 0.3 : base;
  const brightness = Math.max(0, Math.min(1, fullFlicker));

  const radius = 60;
  const g = new Graphics();
  g.circle(x, y, radius).fill({ color: 0xffdd88, alpha: brightness * 0.4 });
  g.circle(x, y, radius * 0.5).fill({ color: 0xffeeaa, alpha: brightness * 0.6 });

  const poleHeight = 80;
  g.moveTo(x, y);
  g.lineTo(x, y + poleHeight);
  g.stroke({ color: 0x888888, width: 3, alpha: 0.8 });

  layer.addChild(g);
}

export function resetFlicker() {
  randomOffset = Math.random() * 100;
}
