import { Actor } from '@animaster/shared/scene';
import { initActorJoints } from '../initActorJoints';

export function evaluateSit(actor: Actor, deltaMs: number): Actor {
  const progress = Math.min(actor.actionElapsed / 1000, 1);
  const standingPose = initActorJoints(actor.position);
  const sittingPose = {
    head: { x: actor.position.x, y: actor.position.y - 54 },
    torso: { x: actor.position.x, y: actor.position.y - 22 },
    leftArm: { x: actor.position.x - 30, y: actor.position.y - 6 },
    rightArm: { x: actor.position.x + 30, y: actor.position.y - 6 },
    leftLeg: { x: actor.position.x - 20, y: actor.position.y + 20 },
    rightLeg: { x: actor.position.x + 20, y: actor.position.y + 20 }
  };

  actor.joints = {
    head: lerpVector(standingPose.head, sittingPose.head, progress),
    torso: lerpVector(standingPose.torso, sittingPose.torso, progress),
    leftArm: lerpVector(standingPose.leftArm, sittingPose.leftArm, progress),
    rightArm: lerpVector(standingPose.rightArm, sittingPose.rightArm, progress),
    leftLeg: lerpVector(standingPose.leftLeg, sittingPose.leftLeg, progress),
    rightLeg: lerpVector(standingPose.rightLeg, sittingPose.rightLeg, progress)
  };

  if (progress >= 1 && actor.actionQueue.length > 0) {
    actor.currentAction = actor.actionQueue.shift() ?? 'idle';
    actor.actionElapsed = 0;
  }

  return actor;
}

function lerpVector(from: { x: number; y: number }, to: { x: number; y: number }, amount: number) {
  return {
    x: from.x + (to.x - from.x) * amount,
    y: from.y + (to.y - from.y) * amount
  };
}