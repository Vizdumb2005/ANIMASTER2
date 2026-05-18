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
// Phase 2.6 imports
import { resolveSpatialIntent } from './spatial/spatialIntentResolver';
import { applyNegativeSpace } from './spatial/negativeSpaceController';
import { applyFrameEdgeBias } from './spatial/frameEdgeBias';
import { scheduleBeats } from './timing/beatScheduler';
import { evaluateBeats } from './timing/beatEvaluator';
import { detectAnticipationPause } from './timing/anticipationPause';
import { detectSilenceBeat } from './timing/silenceBeat';
import { resolveShotIntent } from './camera/shotIntentResolver';
import { applyShotIntentToCamera } from './camera/intentDrivenCamera';
import { resolveAttentionFocus } from './attention/attentionResolver';
import { applyAttentionCameraBias } from './attention/cameraBias';
import { calculateCompositionMetrics } from './composition/visualWeightBalancer';
import { resolvePowerDynamics } from './dynamics/powerDynamicResolver';
import { applyPowerAwareStaging } from './dynamics/powerAwareStaging';
import { accumulateTension } from './tension/tensionAccumulator';
import { applyTensionCompression } from './tension/tensionCompression';
import { buildAnticipation } from './anticipation/anticipationBuilder';
import { applyPayoffRelease } from './anticipation/payoffRelease';
import { validateReadability } from './validation/readabilityValidator';

let lastActorIds = new Set<string>();
const TICK_DELTA_MS = 16;

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

  // Phase 2.6: Emotional Spatial Intelligence
  scene.emotionalSpatial = resolveSpatialIntent(scene);
  scene.actors = applyNegativeSpace(scene.actors, scene.emotionalSpatial, scene.environment);
  scene.actors = applyFrameEdgeBias(scene.actors, scene.emotionalSpatial, scene.environment);

  // Phase 2.6: Dramatic Timing Engine
  if (!scene.dramaticBeats || scene.dramaticBeats.length === 0) {
    scene.dramaticBeats = scheduleBeats(scene);
  }
  const anticipationBeat = detectAnticipationPause(scene);
  if (anticipationBeat) scene.dramaticBeats.push(anticipationBeat);
  const silenceBeat = detectSilenceBeat(scene);
  if (silenceBeat) scene.dramaticBeats.push(silenceBeat);
  const { updatedBeats } = evaluateBeats(scene.dramaticBeats, TICK_DELTA_MS);
  scene.dramaticBeats = updatedBeats;

  // Phase 2.6: Power Dynamics
  scene.powerDynamics = resolvePowerDynamics(scene);
  scene.actors = applyPowerAwareStaging(scene.actors, scene.powerDynamics, scene.environment);

  // Phase 2.6: Tension Escalation
  scene.tensionState = accumulateTension(scene, scene.tensionState, TICK_DELTA_MS);
  scene.actors = applyTensionCompression(scene.actors, scene.tensionState, scene.environment);

  // Phase 2.6: Anticipation & Payoff
  scene.anticipationState = buildAnticipation(scene, scene.anticipationState, TICK_DELTA_MS);
  scene.actors = applyPayoffRelease(scene.actors, scene.anticipationState);

  // Phase 2.6: Composition Metrics
  scene.compositionMetrics = calculateCompositionMetrics(scene.actors, scene.environment);

  // Phase 2.6: Shot Intent + Attention Direction + Camera
  scene.shotIntent = resolveShotIntent(scene);
  scene.attentionFocus = resolveAttentionFocus(scene);
  evaluateCameraRuntime(scene, scene.environment.width, scene.environment.height, tone, rhythm);
  scene.camera = applyShotIntentToCamera(scene.camera, scene.shotIntent);
  scene.camera = applyAttentionCameraBias(scene.camera, scene.attentionFocus, scene.actors);

  // Phase 2.6: Readability Validation (non-mutating, diagnostic only)
  validateReadability(scene);

  validateContinuity(scene);
  captureSnapshot(scene);

  return scene;
}

export function resetSceneEvaluator() {
  lastActorIds = new Set<string>();
}
