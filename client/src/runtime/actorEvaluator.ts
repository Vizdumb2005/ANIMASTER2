import { Actor, SceneGraph } from '@animaster/shared/scene';
import { evaluateIdle } from './behaviors/idle';
import { applyEmotionModifier } from './emotions/emotionModifier';
import { orientActorTowardTarget } from './proximityAwareness';
import { getRhythmRuntimeProfile, getToneRuntimeProfile } from './semanticProfiles';
import { evaluateActionRuntime } from './actionRuntime';
import { evaluateActingScheduler } from './acting/actingScheduler';
// Phase 2.6 deep acting
import { evaluateDeepActing, applyDeepActing } from './acting/deepActingEvaluator';
import { applyPostureTransition } from './acting/postureTransition';
import { applyNervousRepetition } from './acting/nervousRepetition';

let actorTickCounters = new Map<string, number>();

export function evaluateActor(actor: Actor, deltaMs: number, scene: SceneGraph): Actor {
  let nextActor = structuredClone(actor);
  nextActor.actionElapsed += deltaMs;

  const tick = (actorTickCounters.get(actor.id) ?? 0) + deltaMs;
  actorTickCounters.set(actor.id, tick);

  const tone = getToneRuntimeProfile(scene);
  const rhythm = getRhythmRuntimeProfile(scene);
  nextActor = evaluateActionRuntime(nextActor, scene, deltaMs, tone, rhythm);

  if (nextActor.currentAction === 'idle' || nextActor.activeAction?.type === 'waiting') {
    nextActor = evaluateIdle(nextActor, deltaMs);
  }

  nextActor = applyEmotionModifier(nextActor, deltaMs);
  nextActor = evaluateActingScheduler(nextActor, scene, tone, rhythm);
  nextActor = orientActorTowardTarget(nextActor, scene.actors, scene.relationships ?? []);

  // Phase 2.6: Deep Acting
  const deepState = evaluateDeepActing(nextActor, deltaMs);
  nextActor = applyDeepActing(nextActor, deepState, tick);
  nextActor = applyPostureTransition(nextActor, deepState, tick);
  if (deepState.nervousRepetitionCount > 0) {
    nextActor = applyNervousRepetition(nextActor, tick, deepState.nervousRepetitionCount);
  }

  return nextActor;
}
