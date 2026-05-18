import { Container, Graphics } from 'pixi.js';

export function drawLightPulse(layer: Container, width: number, height: number, elapsedMs: number, intensity: number): void {
  const freq = 0.0008 + intensity * 0.001;
  const pulse = Math.sin(elapsedMs * freq) * 0.5 + 0.5;
  const alpha = 0.02 + pulse * 0.06 * intensity;

  const g = new Graphics();
  g.rect(0, 0, width, height).fill({ color: 0xffeedd, alpha });
  layer.addChild(g);
}
