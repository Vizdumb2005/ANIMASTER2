import { Container, Graphics } from 'pixi.js';
import type { SceneTone } from '@animaster/shared/scene';

// --- Task 223: Enhanced Vignette (emotion-aware) ---

interface VignetteProfile {
  cornerAlpha: number;
  topAlpha: number;
  bottomAlpha: number;
  sideAlpha: number;
  topHeight: number;    // normalized 0-1
  bottomHeight: number; // normalized 0-1
  sideWidth: number;    // normalized 0-1
}

const TONE_VIGNETTE: Record<string, Partial<VignetteProfile>> = {
  lonely: { cornerAlpha: 1.5, topAlpha: 1.0, bottomAlpha: 1.2, sideAlpha: 0.9, topHeight: 0.2, bottomHeight: 0.2 },
  tense: { cornerAlpha: 1.0, topAlpha: 1.3, bottomAlpha: 1.3, topHeight: 0.22, bottomHeight: 0.22, sideWidth: 0.08 },
  threatening: { cornerAlpha: 1.6, topAlpha: 1.4, bottomAlpha: 1.4, sideAlpha: 1.0, topHeight: 0.25, bottomHeight: 0.25, sideWidth: 0.12 },
  romantic: { cornerAlpha: 0.8, topAlpha: 0.6, bottomAlpha: 0.7, sideAlpha: 0.5 },
  sad: { cornerAlpha: 1.3, topAlpha: 0.9, bottomAlpha: 1.1 },
};

export function drawVignette(layer: Container, width: number, height: number, intensity: number, tone?: SceneTone): void {
  const g = new Graphics();
  const profile = TONE_VIGNETTE[tone ?? 'neutral'] ?? {};
  const edgeAlpha = 0.15 + intensity * 0.25;

  const topH = height * (profile.topHeight ?? 0.15);
  const bottomH = height * (profile.bottomHeight ?? 0.15);
  const sideW = width * (profile.sideWidth ?? 0.1);
  const cornerW = width * 0.15;
  const cornerH = height * 0.15;

  // Top edge
  g.rect(0, 0, width, topH).fill({ color: 0x000000, alpha: edgeAlpha * (profile.topAlpha ?? 0.8) });
  // Bottom edge
  g.rect(0, height - bottomH, width, bottomH).fill({ color: 0x000000, alpha: edgeAlpha * (profile.bottomAlpha ?? 1.0) });
  // Left edge
  g.rect(0, 0, sideW, height).fill({ color: 0x000000, alpha: edgeAlpha * (profile.sideAlpha ?? 0.6) });
  // Right edge
  g.rect(width - sideW, 0, sideW, height).fill({ color: 0x000000, alpha: edgeAlpha * (profile.sideAlpha ?? 0.6) });
  // Corners (darker)
  const ca = edgeAlpha * (profile.cornerAlpha ?? 1.2);
  g.rect(0, 0, cornerW, cornerH).fill({ color: 0x000000, alpha: ca });
  g.rect(width - cornerW, 0, cornerW, cornerH).fill({ color: 0x000000, alpha: ca });
  g.rect(0, height - cornerH, cornerW, cornerH).fill({ color: 0x000000, alpha: ca });
  g.rect(width - cornerW, height - cornerH, cornerW, cornerH).fill({ color: 0x000000, alpha: ca });

  layer.addChild(g);
}
