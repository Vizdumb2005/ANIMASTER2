import type { Actor, AnticipationState } from '@animaster/shared/scene';

export function applyPayoffRelease(actors: Actor[], anticipation: AnticipationState): Actor[] {
  if (anticipation.phase === 'idle') return actors;

  return actors.map((actor) => {
    const clone = { ...actor, position: { ...actor.position }, joints: {
      head: { ...actor.joints.head },
      torso: { ...actor.joints.torso },
      leftArm: { ...actor.joints.leftArm },
      rightArm: { ...actor.joints.rightArm },
      leftLeg: { ...actor.joints.leftLeg },
      rightLeg: { ...actor.joints.rightLeg }
    } };

    if (anticipation.phase === 'building') {
      const damping = anticipation.motionDamping;
      if (actor.currentAction === 'walking' || actor.currentAction === 'approaching') {
        clone.joints.torso.y -= (1 - damping) * 3;
      }
    }

    if (anticipation.phase === 'peak') {
      clone.joints.torso.y -= 2;
      clone.joints.leftArm.x += 2;
      clone.joints.rightArm.x -= 2;
    }

    if (anticipation.phase === 'release') {
      clone.joints.torso.y += 1;
      clone.joints.leftArm.x -= 3;
      clone.joints.rightArm.x += 3;
    }

    return clone;
  });
}
