import { Container, Graphics } from 'pixi.js';

export function drawFog(layer: Container, width: number, height: number, intensity: number = 0.25) {
  const g = new Graphics();
  const bands = 6;
  const bandHeight = height / bands;

  for (let i = 0; i < bands; i++) {
    const y = i * bandHeight;
    const alpha = intensity * (1 - i / bands);
    g.rect(0, y, width, bandHeight).fill({ color: 0xffffff, alpha });
  }

  layer.addChild(g);
}
