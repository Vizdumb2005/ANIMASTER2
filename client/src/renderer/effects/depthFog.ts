import { Container, Graphics } from 'pixi.js';

// --- Task 216: Enhanced Fog with Depth ---

export function drawDepthFog(
  layer: Container,
  width: number,
  height: number,
  elapsedMs: number,
  intensity: number = 0.5
): void {
  const g = new Graphics();
  const bandCount = 4;

  for (let i = 0; i < bandCount; i++) {
    const t = i / bandCount;
    const bandY = height * (0.35 + t * 0.5);
    const bandH = height * (0.08 + t * 0.06);
    const drift = Math.sin(elapsedMs * 0.0001 * (i + 1) + i * 1.5) * 30;
    const alpha = intensity * (0.04 + t * 0.06);

    g.rect(-20 + drift, bandY, width + 40, bandH)
      .fill({ color: 0x8a9aaa, alpha });
  }

  // Ground haze — thicker near bottom
  const hazeY = height * 0.75;
  const hazeH = height * 0.25;
  g.rect(0, hazeY, width, hazeH)
    .fill({ color: 0x6a7a8a, alpha: intensity * 0.06 });

  layer.addChild(g);
}
