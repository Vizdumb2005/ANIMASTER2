import { Actor, SceneGraph } from '@animaster/shared/scene';
import { evaluateIdle } from './behaviors/idle';
import { applyEmotionModifier } from './emotions/emotionModifier';
import { orientActorTowardTarget } from './proximityAwareness';
import { getRhythmRuntimeProfile, getToneRuntimeProfile } from './semanticProfiles';
import { evaluateActionRuntime } from './actionRuntime';
import { evaluateActingScheduler } from './acting/actingScheduler';

export function evaluateActor(actor: Actor, deltaMs: number, scene: SceneGraph): Actor {
  let nextActor = structuredClone(actor);
  nextActor.actionElapsed += deltaMs;

  const tone = getToneRuntimeProfile(scene);
  const rhythm = getRhythmRuntimeProfile(scene);
  nextActor = evaluateActionRuntime(nextActor, scene, deltaMs, tone, rhythm);

  if (nextActor.currentAction === 'idle' || nextActor.activeAction?.type === 'waiting') {
    nextActor = evaluateIdle(nextActor, deltaMs);
  }

  nextActor = applyEmotionModifier(nextActor, deltaMs);
  nextActor = evaluateActingScheduler(nextActor, scene, tone, rhythm);
  nextActor = orientActorTowardTarget(nextActor, scene.actors, scene.relationships ?? []);
  return nextActor;
}
