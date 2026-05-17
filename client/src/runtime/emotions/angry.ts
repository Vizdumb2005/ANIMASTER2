import type { Actor } from '@animaster/shared/scene';

export const angryParams = {
  strideSpeed: 1.1,
  armSwing: 0.8,
  postureOffset: 0,
  breathRate: 1.4,
  pauseChancePerTick: 0.001
};

export function applyAngryModifier(actor: Actor, deltaMs: number): Actor {
  const tensionPhase = actor.actionElapsed * 0.006 * angryParams.breathRate;
  const tensionPulse = Math.sin(tensionPhase) * 1.5;

  actor.joints.torso.x += 3;
  actor.joints.head.x += 2;
  actor.joints.leftArm.y += 4 + tensionPulse;
  actor.joints.rightArm.y += 4 + tensionPulse;
  actor.joints.leftArm.x -= 6;
  actor.joints.rightArm.x += 6;

  return actor;
}
