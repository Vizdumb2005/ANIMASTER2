import type { Actor } from '@animaster/shared/scene';

export function applyNervousRepetition(actor: Actor, tick: number, repetitionCount: number): Actor {
  if (repetitionCount <= 0) return actor;

  const clone = { ...actor, joints: {
    head: { ...actor.joints.head },
    torso: { ...actor.joints.torso },
    leftArm: { ...actor.joints.leftArm },
    rightArm: { ...actor.joints.rightArm },
    leftLeg: { ...actor.joints.leftLeg },
    rightLeg: { ...actor.joints.rightLeg }
  } };
  const freq = 0.012 * repetitionCount;
  const amp = 2 + repetitionCount;

  const fidget = Math.sin(tick * freq) * amp;
  clone.joints.rightArm.x += fidget;
  clone.joints.rightArm.y += fidget * 0.5;

  if (repetitionCount >= 3) {
    const shiftCycle = Math.sin(tick * 0.006) * 3;
    clone.joints.leftLeg.x += shiftCycle;
    clone.joints.rightLeg.x -= shiftCycle;
  }

  return clone;
}
