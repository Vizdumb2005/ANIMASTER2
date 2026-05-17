import type { Actor } from '@animaster/shared/scene';

export const excitedParams = {
  strideSpeed: 1.4,
  armSwing: 1.6,
  postureOffset: 4,
  breathRate: 1.3,
  pauseChancePerTick: 0.0
};

export function applyExcitedModifier(actor: Actor, deltaMs: number): Actor {
  const bouncePhase = actor.actionElapsed * 0.012;
  const bounce = Math.abs(Math.sin(bouncePhase)) * 3;

  actor.joints.head.y -= excitedParams.postureOffset + bounce;
  actor.joints.torso.y -= 2 + bounce * 0.6;
  actor.joints.leftArm.y -= 4 + bounce * 0.4;
  actor.joints.rightArm.y -= 4 + bounce * 0.4;
  actor.joints.leftLeg.y -= 1;
  actor.joints.rightLeg.y -= 1;

  return actor;
}
