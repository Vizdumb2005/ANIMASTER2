import type { Actor } from '@animaster/shared/scene';

export const nervousParams = {
  strideSpeed: 0.7,
  armSwing: 0.5,
  postureOffset: -6,
  breathRate: 1.8,
  pauseChancePerTick: 0.003
};

export function applyNervousModifier(actor: Actor, deltaMs: number): Actor {
  const breathPhase = actor.actionElapsed * 0.008 * nervousParams.breathRate;
  const breathOffset = Math.sin(breathPhase) * 2;

  actor.joints.head.y += nervousParams.postureOffset + breathOffset;
  actor.joints.torso.y += breathOffset * 0.5;
  actor.joints.leftArm.x -= 4;
  actor.joints.rightArm.x += 4;
  actor.joints.leftArm.y -= 3 + breathOffset * 0.3;
  actor.joints.rightArm.y -= 3 + breathOffset * 0.3;

  return actor;
}
