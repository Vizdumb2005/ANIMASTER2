import type { SceneGraph } from '@animaster/shared/scene';
import { evaluateProximity } from './proximityAwareness';
import { evaluateStaging } from './staging/stagingEvaluator';
import { evaluateReactions } from './acting/reactionTiming';
import { autoSelectCameraMode } from './camera/cameraAutoSelect';
import { captureSnapshot, validateContinuity } from './continuity/continuityTracker';
import { getTempoMultiplier } from './rhythm/rhythmEvaluator';

let initialized = false;

export function evaluateScene(scene: SceneGraph): SceneGraph {
  if (!initialized && scene.actors.length > 0) {
    const stagedActors = evaluateStaging(scene);
    scene.actors = stagedActors;
    initialized = true;
  }

  if (scene.actors.length > 1) {
    scene.relationships = evaluateProximity(scene.actors, scene.relationships ?? []);
  }

  scene.actors = evaluateReactions(scene.actors, scene.relationships ?? []);

  if (scene.cinematicGrammar) {
    const autoMode = autoSelectCameraMode(scene);
    if (scene.camera.mode === 'static') {
      scene.camera.mode = autoMode;
    }
  }

  const violations = validateContinuity(scene);
  if (violations.length > 0) {
    console.warn('[Continuity]', violations);
  }
  captureSnapshot(scene);

  return scene;
}

export function resetSceneEvaluator() {
  initialized = false;
}
