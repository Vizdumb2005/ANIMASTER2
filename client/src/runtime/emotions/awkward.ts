import type { Actor } from '@animaster/shared/scene';

export const awkwardParams = {
  strideSpeed: 0.85,
  armSwing: 0.3,
  postureOffset: 3,
  breathRate: 1.0,
  pauseChancePerTick: 0.005
};

export function applyAwkwardModifier(actor: Actor): Actor {
  actor.joints.torso.y += awkwardParams.postureOffset;
  actor.joints.leftArm.x += 2;
  actor.joints.rightArm.x -= 2;
  actor.joints.leftArm.y += 2;
  actor.joints.rightArm.y += 2;
  actor.joints.head.y += 1;

  return actor;
}
