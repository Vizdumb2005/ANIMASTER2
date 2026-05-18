import { Container, Graphics } from 'pixi.js';
import type { Actor, SceneTone } from '@animaster/shared/scene';

// --- Task 213: Enhanced Rim Lighting ---

const TONE_RIM_COLORS: Record<string, { color: number; alpha: number }> = {
  lonely: { color: 0x6a8abc, alpha: 0.3 },
  sad: { color: 0x7a9acc, alpha: 0.28 },
  tense: { color: 0xcc6a5a, alpha: 0.35 },
  threatening: { color: 0xdd4a3a, alpha: 0.38 },
  romantic: { color: 0xccaa6a, alpha: 0.3 },
  energetic: { color: 0xddcc7a, alpha: 0.28 },
  awkward: { color: 0x9a9a8a, alpha: 0.22 },
  neutral: { color: 0xaabbcc, alpha: 0.25 },
};

export function drawRimLighting(layer: Container, actor: Actor, tone?: SceneTone, tensionLevel?: number): void {
  const g = new Graphics();
  const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = actor.joints;
  const rimConfig = TONE_RIM_COLORS[tone ?? 'neutral'] ?? TONE_RIM_COLORS.neutral;
  const rimColor = rimConfig.color;
  const baseAlpha = rimConfig.alpha;
  const tensionBoost = (tensionLevel ?? 0) * 0.15;
  const rimAlpha = Math.min(baseAlpha + tensionBoost, 0.55);
  const offset = 3 + (tensionLevel ?? 0) * 2;

  // Head rim (right side = light source side)
  g.circle(head.x + offset, head.y, 17).stroke({ color: rimColor, width: 1.5, alpha: rimAlpha });

  // Body rim
  g.moveTo(head.x + offset, head.y + 16);
  g.lineTo(torso.x + offset, torso.y);
  g.stroke({ color: rimColor, width: 2, alpha: rimAlpha * 0.8 });

  // Arms rim
  g.moveTo(torso.x + offset, torso.y - 4);
  g.lineTo(rightArm.x + offset, rightArm.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.6 });

  g.moveTo(torso.x - offset, torso.y - 4);
  g.lineTo(leftArm.x - offset, leftArm.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.4 });

  // Legs rim
  g.moveTo(torso.x + offset, torso.y);
  g.lineTo(rightLeg.x + offset, rightLeg.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.5 });

  g.moveTo(torso.x - offset, torso.y);
  g.lineTo(leftLeg.x - offset, leftLeg.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.3 });

  layer.addChild(g);
}
