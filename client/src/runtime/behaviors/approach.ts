import type { Actor, SceneGraph } from '@animaster/shared/scene';
import { initActorJoints } from '../initActorJoints';

const APPROACH_SPEED = 0.8;

export function evaluateApproach(actor: Actor, deltaMs: number, scene: SceneGraph): Actor {
  if (!actor.targetPosition) {
    actor.currentAction = actor.actionQueue.shift() ?? 'idle';
    actor.actionElapsed = 0;
    return actor;
  }

  const dx = actor.targetPosition.x - actor.position.x;
  const dy = actor.targetPosition.y - actor.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);

  if (dist < 2) {
    actor.position.x = actor.targetPosition.x;
    actor.position.y = actor.targetPosition.y;
    actor.currentAction = actor.actionQueue.shift() ?? 'idle';
    actor.actionElapsed = 0;
    actor.joints = initActorJoints(actor.position);
    return actor;
  }

  const step = APPROACH_SPEED * (deltaMs / 16);
  const ratio = step / dist;
  actor.position.x += dx * ratio;
  actor.position.y += dy * ratio;
  actor.joints = initActorJoints(actor.position);

  const phase = actor.actionElapsed * 0.004;
  actor.joints.leftLeg.y += Math.sin(phase) * 10;
  actor.joints.rightLeg.y += Math.sin(phase + Math.PI) * 10;
  actor.joints.leftArm.y += Math.sin(phase + Math.PI) * 5 * 0.3;
  actor.joints.rightArm.y += Math.sin(phase) * 5 * 0.3;

  return actor;
}
