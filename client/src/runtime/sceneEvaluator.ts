import type { SceneGraph } from '@animaster/shared/scene';
import { evaluateProximity } from './proximityAwareness';
import { evaluateStaging } from './staging/stagingEvaluator';
import { evaluateReactions } from './acting/reactionTiming';
import { captureSnapshot, validateContinuity } from './continuity/continuityTracker';
import { clearWeightShiftState } from './acting/weightShift';
import { clearLookAroundState } from './acting/lookAround';
import { clearHesitationState } from './acting/hesitation';
import { ensureSemanticRuntimeState } from './semanticOperations';
import { getRhythmRuntimeProfile, getToneRuntimeProfile } from './semanticProfiles';
import { evaluateCameraRuntime } from './camera/cameraRuntime';

let lastActorIds = new Set<string>();

export function evaluateScene(scene: SceneGraph): SceneGraph {
  ensureSemanticRuntimeState(scene);
  const tone = getToneRuntimeProfile(scene);
  const rhythm = getRhythmRuntimeProfile(scene);
  const currentIds = new Set(scene.actors.map((a) => a.id));

  if (currentIds.size !== lastActorIds.size || [...currentIds].some((id) => !lastActorIds.has(id))) {
    clearWeightShiftState(currentIds);
    clearLookAroundState(currentIds);
    clearHesitationState(currentIds);
    lastActorIds = currentIds;
  }

  scene.actors = evaluateStaging(scene, tone);

  if (scene.actors.length > 1) {
    scene.relationships = evaluateProximity(scene.actors, scene.relationships ?? [], tone);
  }

  scene.actors = evaluateReactions(scene.actors, scene.relationships ?? []);
  evaluateCameraRuntime(scene, scene.environment.width, scene.environment.height, tone, rhythm);

  validateContinuity(scene);
  captureSnapshot(scene);

  return scene;
}

export function resetSceneEvaluator() {
  lastActorIds = new Set<string>();
}
