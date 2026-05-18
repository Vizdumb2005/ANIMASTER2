import type { Actor, DeepActingState } from '@animaster/shared/scene';

export function applyPostureTransition(actor: Actor, deepState: DeepActingState, tick: number): Actor {
  const clone = { ...actor, joints: {
    head: { ...actor.joints.head },
    torso: { ...actor.joints.torso },
    leftArm: { ...actor.joints.leftArm },
    rightArm: { ...actor.joints.rightArm },
    leftLeg: { ...actor.joints.leftLeg },
    rightLeg: { ...actor.joints.rightLeg }
  } };
  const openness = deepState.postureOpenness;

  const transitionSpeed = 0.005;
  const targetTorsoY = openness > 0.5 ? 0 : (0.5 - openness) * -4;
  const targetArmSpread = openness > 0.5 ? openness * 3 : openness * -3;

  clone.joints.torso.y += targetTorsoY * transitionSpeed;
  clone.joints.leftArm.x += (-targetArmSpread) * transitionSpeed;
  clone.joints.rightArm.x += targetArmSpread * transitionSpeed;

  if (deepState.emotionalRecoveryTimer > 0) {
    const recoveryProgress = Math.min(1, tick * 0.0005);
    clone.joints.torso.y *= (1 - recoveryProgress * 0.1);
  }

  return clone;
}
