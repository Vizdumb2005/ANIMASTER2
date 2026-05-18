import { Container, Graphics } from 'pixi.js';
import type { Actor, Vector2 } from '@animaster/shared/scene';
import { drawFace } from './FaceRenderer';

const EMOTION_BODY_COLORS: Record<string, { joint: number; line: number }> = {
  sad: { joint: 0x8aa0c8, line: 0x93a9d0 },
  nervous: { joint: 0xf2c879, line: 0xf7e9d8 },
  angry: { joint: 0xd98a7a, line: 0xe8a090 },
  exhausted: { joint: 0x9a9ab0, line: 0xb0b0c0 },
  awkward: { joint: 0xc8b8a0, line: 0xd8c8b0 },
  excited: { joint: 0xf0d080, line: 0xf8e0a0 },
  happy: { joint: 0xf0d898, line: 0xf8e8c0 },
};

const DEFAULT_COLORS = { joint: 0xf2e9dc, line: 0xf7e9d8 };

export function drawStickman(
  layer: Container,
  actor: Actor,
  gazeTargetPos?: Vector2 | null,
  deltaMs?: number,
  elapsedMs?: number
) {
  const colors = EMOTION_BODY_COLORS[actor.emotionState] ?? DEFAULT_COLORS;
  const graphics = new Graphics();
  const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = actor.joints;

  graphics.circle(head.x, head.y, 16).fill({ color: colors.joint });
  graphics.moveTo(head.x, head.y + 16);
  graphics.lineTo(torso.x, torso.y);
  graphics.lineTo(leftLeg.x, leftLeg.y);
  graphics.moveTo(torso.x, torso.y);
  graphics.lineTo(rightLeg.x, rightLeg.y);
  graphics.moveTo(torso.x, torso.y - 4);
  graphics.lineTo(leftArm.x, leftArm.y);
  graphics.moveTo(torso.x, torso.y - 4);
  graphics.lineTo(rightArm.x, rightArm.y);
  graphics.stroke({ color: colors.line, width: 5, alpha: 0.96 });

  const core = new Graphics();
  core.circle(torso.x, torso.y, 5).fill({ color: colors.line });
  core.circle(leftArm.x, leftArm.y, 3).fill({ color: colors.line });
  core.circle(rightArm.x, rightArm.y, 3).fill({ color: colors.line });
  core.circle(leftLeg.x, leftLeg.y, 3).fill({ color: colors.line });
  core.circle(rightLeg.x, rightLeg.y, 3).fill({ color: colors.line });

  layer.addChild(graphics, core);

  // Phase 4: Draw expressive face
  drawFace(layer, actor, gazeTargetPos ?? null, deltaMs ?? 16, elapsedMs ?? 0);
}
