import type { Actor } from '@animaster/shared/scene';

export const exhaustedParams = {
  strideSpeed: 0.5,
  armSwing: 0.4,
  postureOffset: -10,
  breathRate: 0.6,
  pauseChancePerTick: 0.008
};

export function applyExhaustedModifier(actor: Actor, deltaMs: number): Actor {
  const heavyBreathPhase = actor.actionElapsed * 0.003 * exhaustedParams.breathRate;
  const breathSway = Math.sin(heavyBreathPhase) * 3;

  actor.joints.head.y += exhaustedParams.postureOffset + breathSway;
  actor.joints.torso.y += 5 + breathSway * 0.7;
  actor.joints.leftArm.y += 10 + breathSway * 0.5;
  actor.joints.rightArm.y += 10 + breathSway * 0.5;
  actor.joints.leftLeg.y += 2;
  actor.joints.rightLeg.y += 2;

  return actor;
}
