import { Container, Graphics } from 'pixi.js';
import type { Environment } from '@animaster/shared/scene';

export function drawNightEnvironment(layer: Container, environment: Environment, width: number, height: number) {
  const g = new Graphics();

  g.rect(0, 0, width, height).fill(0x0a0e1a);

  const wallHeight = Math.round(height * 0.62);
  g.rect(0, 0, width, wallHeight).fill(0x111828);

  const floorY = wallHeight;
  g.rect(0, floorY, width, height - floorY).fill(0x0d0f14);

  const trim = new Graphics();
  trim.rect(0, floorY - 4, width, 8).fill({ color: 0x000000, alpha: 0.3 });

  const moon = new Graphics();
  moon.circle(width * 0.85, height * 0.12, 18).fill({ color: 0xeeeedd, alpha: 0.7 });

  layer.addChild(g, trim, moon);
}
