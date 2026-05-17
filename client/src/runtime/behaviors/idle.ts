import { Actor } from '@animaster/shared/scene';
import { initActorJoints } from '../initActorJoints';

export function evaluateIdle(actor: Actor, deltaMs: number): Actor {
  if (actor.actionQueue.length > 0) {
    actor.currentAction = actor.actionQueue.shift()!;
    actor.actionElapsed = 0;
    return actor;
  }

  const baseJoints = initActorJoints(actor.position);
  const elapsed = actor.actionElapsed;
  const idleOscillation = Math.sin(elapsed * 0.002) * 2;
  const armSway = Math.sin(elapsed * 0.0025) * 3;

  actor.joints = {
    head: { ...baseJoints.head },
    torso: { ...baseJoints.torso },
    leftArm: { ...baseJoints.leftArm },
    rightArm: { ...baseJoints.rightArm },
    leftLeg: { ...baseJoints.leftLeg },
    rightLeg: { ...baseJoints.rightLeg }
  };

  actor.joints.torso.y += idleOscillation;
  actor.joints.leftArm.y += idleOscillation * 0.25;
  actor.joints.rightArm.y += idleOscillation * 0.25;
  actor.joints.leftArm.x -= armSway;
  actor.joints.rightArm.x += armSway;

  return actor;
}
