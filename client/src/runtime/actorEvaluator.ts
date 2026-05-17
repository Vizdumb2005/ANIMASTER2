import { Actor, SceneGraph } from '@animaster/shared/scene';
import { evaluateIdle } from './behaviors/idle';
import { evaluateWalk } from './behaviors/walk';
import { evaluateSit } from './behaviors/sit';
import { applyEmotionModifier } from './emotions/emotionModifier';

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
    default:
      nextActor = evaluateIdle(nextActor, deltaMs);
      break;
  }

  nextActor = applyEmotionModifier(nextActor, deltaMs);
  return nextActor;
}
