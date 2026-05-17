import { Actor, SceneGraph } from '@animaster/shared/scene';
import { initActorJoints } from '../initActorJoints';

export function evaluateWalk(actor: Actor, deltaMs: number, scene: SceneGraph): Actor {
  const nextX = actor.targetPosition ? Math.min(actor.position.x + 1.5, actor.targetPosition.x) : actor.position.x + 1.5;
  const phase = actor.actionElapsed * 0.005;
  const leftLegSwing = Math.sin(phase) * 20;
  const rightLegSwing = Math.sin(phase + Math.PI) * 20;
  const leftArmSwing = Math.sin(phase + Math.PI) * 20;
  const rightArmSwing = Math.sin(phase) * 20;

  actor.position.x = nextX;
  actor.joints = initActorJoints(actor.position);
  actor.joints.leftLeg.y += leftLegSwing;
  actor.joints.rightLeg.y += rightLegSwing;
  actor.joints.leftArm.y += leftArmSwing * 0.55;
  actor.joints.rightArm.y += rightArmSwing * 0.55;

  if (actor.targetPosition && actor.position.x >= actor.targetPosition.x) {
    actor.position.x = actor.targetPosition.x;
    actor.currentAction = actor.actionQueue.shift() ?? 'idle';
    actor.actionElapsed = 0;
    actor.joints = initActorJoints(actor.position);
  }

  if (scene.environment.type === 'indoor_room') {
    actor.joints.torso.y += 0.5;
  }

  return actor;
}