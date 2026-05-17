import { Container, Graphics } from 'pixi.js';

const TINTS: Record<string, { color: number; alpha: number }> = {
  warm: { color: 0xffc864, alpha: 0.12 },
  cold: { color: 0x648cff, alpha: 0.15 },
  night: { color: 0x141e3c, alpha: 0.4 }
};

export function drawLightingTint(layer: Container, width: number, height: number, tint: string) {
  if (tint === 'rgba(0,0,0,0)' || tint === 'none') {
    return;
  }

  const g = new Graphics();

  const preset = TINTS[tint];
  if (preset) {
    g.rect(0, 0, width, height).fill({ color: preset.color, alpha: preset.alpha });
  } else {
    g.rect(0, 0, width, height).fill({ color: 0x000000, alpha: 0.1 });
  }

  layer.addChild(g);
}
