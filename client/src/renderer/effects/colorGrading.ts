import { Container, Graphics } from 'pixi.js';
import type { SceneTone } from '@animaster/shared/scene';

// --- Task 222: Color Grading by Tone ---

const TONE_COLOR_GRADES: Record<string, { color: number; alpha: number }> = {
  lonely: { color: 0x2a4a7a, alpha: 0.08 },
  sad: { color: 0x3a4a6a, alpha: 0.07 },
  tense: { color: 0x2a3a2a, alpha: 0.06 },
  threatening: { color: 0x4a1a1a, alpha: 0.09 },
  romantic: { color: 0x5a3a1a, alpha: 0.06 },
  energetic: { color: 0x4a4a1a, alpha: 0.04 },
  awkward: { color: 0x3a3a2a, alpha: 0.05 },
  neutral: { color: 0x2a2a3a, alpha: 0.03 },
};

export function drawColorGrading(
  layer: Container,
  width: number,
  height: number,
  tone: SceneTone
): void {
  const grade = TONE_COLOR_GRADES[tone] ?? TONE_COLOR_GRADES.neutral;
  const g = new Graphics();
  g.rect(0, 0, width, height).fill({ color: grade.color, alpha: grade.alpha });
  layer.addChild(g);
}
