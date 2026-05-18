import { Container, Graphics } from 'pixi.js';

export function drawVignette(layer: Container, width: number, height: number, intensity: number): void {
  const g = new Graphics();
  const edgeAlpha = 0.15 + intensity * 0.25;

  // Top edge
  g.rect(0, 0, width, height * 0.15).fill({ color: 0x000000, alpha: edgeAlpha * 0.8 });
  // Bottom edge
  g.rect(0, height * 0.85, width, height * 0.15).fill({ color: 0x000000, alpha: edgeAlpha });
  // Left edge
  g.rect(0, 0, width * 0.1, height).fill({ color: 0x000000, alpha: edgeAlpha * 0.6 });
  // Right edge
  g.rect(width * 0.9, 0, width * 0.1, height).fill({ color: 0x000000, alpha: edgeAlpha * 0.6 });
  // Corners (darker)
  g.rect(0, 0, width * 0.15, height * 0.15).fill({ color: 0x000000, alpha: edgeAlpha * 1.2 });
  g.rect(width * 0.85, 0, width * 0.15, height * 0.15).fill({ color: 0x000000, alpha: edgeAlpha * 1.2 });
  g.rect(0, height * 0.85, width * 0.15, height * 0.15).fill({ color: 0x000000, alpha: edgeAlpha * 1.2 });
  g.rect(width * 0.85, height * 0.85, width * 0.15, height * 0.15).fill({ color: 0x000000, alpha: edgeAlpha * 1.2 });

  layer.addChild(g);
}
