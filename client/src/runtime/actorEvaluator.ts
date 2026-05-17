import { Actor, SceneGraph } from '@animaster/shared/scene';
import { evaluateIdle } from './behaviors/idle';
import { evaluateWalk } from './behaviors/walk';
import { evaluateSit } from './behaviors/sit';
import { evaluateApproach } from './behaviors/approach';
import { evaluatePace } from './behaviors/pace';
import { applyEmotionModifier } from './emotions/emotionModifier';
import { applyWeightShift } from './acting/weightShift';
import { applyLookAround } from './acting/lookAround';
import { orientActorTowardTarget } from './proximityAwareness';

export function evaluateActor(actor: Actor, deltaMs: number, scene: SceneGraph): Actor {
  let nextActor = structuredClone(actor);
  nextActor.actionElapsed += deltaMs;

  switch (nextActor.currentAction) {
    case 'walking':
      nextActor = evaluateWalk(nextActor, deltaMs, scene);
      break;
    case 'sitting':
      nextActor = evaluateSit(nextActor, deltaMs);
      break;
    case 'approaching':
      nextActor = evaluateApproach(nextActor, deltaMs, scene);
      break;
    case 'pacing':
      nextActor = evaluatePace(nextActor, deltaMs);
      break;
    default:
      nextActor = evaluateIdle(nextActor, deltaMs);
      nextActor = applyWeightShift(nextActor);
      nextActor = applyLookAround(nextActor);
      break;
  }

  nextActor = applyEmotionModifier(nextActor, deltaMs);
  nextActor = orientActorTowardTarget(nextActor, scene.actors, scene.relationships ?? []);
  return nextActor;
}
