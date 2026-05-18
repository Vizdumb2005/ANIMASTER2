import type { SceneGraph, EmotionalBeat } from '@animaster/shared/scene';
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
// Phase 2.7 imports
import { createBeatSequence } from './beats/beatSequenceTemplates';
import { advanceBeatSequence } from './beats/beatSequenceRunner';
import { applyBeatActingEffects } from './beats/beatActingEffects';
import { applyBeatCameraEffects } from './beats/beatCameraEffects';
import { applyBeatSpacingEffects } from './beats/beatSpacingEffects';
import { applyPsychologicalCameraResponse } from './beats/psychologicalCamera';
import { motivateBeatTiming } from './beats/motivatedTiming';
import { createEmotionalArc } from './arcs/arcTemplates';
import { advanceEmotionalArc } from './arcs/arcEvaluator';
import { applyArcEmotionTransition } from './arcs/arcEmotionTransition';
import { applyArcAtmosphereShift } from './arcs/arcAtmosphereEffect';
import { detectReactionTriggers } from './reactions/reactionTriggerDetector';
import { advanceReactionChain } from './reactions/reactionRunner';
import { applyReactionCameraEffect } from './reactions/reactionCameraEffects';
import { selectStoryAnchors } from './anchors/storyAnchorRegistry';
import { evaluateSceneEvolution } from './evolution/sceneEvolutionEvaluator';
import { applySpacingEvolution } from './evolution/spacingEvolution';
import { evolvePacing } from './evolution/pacingEvolution';
import { evolveCameraIntensity } from './evolution/cameraEvolution';
import { detectCinematicMoment } from './evolution/cinematicMomentDetector';

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

  // Phase 2.7: Beat Sequence Runtime
  if (!scene.beatSequence) {
    scene.beatSequence = createBeatSequence(scene.cinematicGrammar.tone, scene.simulation?.timeMs ?? 0);
  }
  const { updatedSequence, activeBeat, beatProgress } = advanceBeatSequence(scene.beatSequence, TICK_DELTA_MS);
  scene.beatSequence = updatedSequence;
  if (activeBeat) {
    const motivatedBeat = motivateBeatTiming(activeBeat, scene);
    scene.actors = scene.actors.map((a) => applyBeatActingEffects(a, motivatedBeat, beatProgress));
    scene.camera = applyBeatCameraEffects(scene.camera, motivatedBeat, beatProgress);
    scene.actors = applyBeatSpacingEffects(scene.actors, motivatedBeat, beatProgress);
    scene.camera = applyPsychologicalCameraResponse(scene.camera, scene.beatSequence, motivatedBeat, beatProgress);
  }

  // Phase 2.7: Emotional Arc
  if (!scene.emotionalArc) {
    scene.emotionalArc = createEmotionalArc(scene.cinematicGrammar.tone);
  }
  const { updatedArc, activePhase, phaseProgress } = advanceEmotionalArc(scene.emotionalArc, TICK_DELTA_MS);
  scene.emotionalArc = updatedArc;
  if (activePhase) {
    scene.actors = scene.actors.map((a) => applyArcEmotionTransition(a, activePhase, phaseProgress));
    scene.atmosphere = applyArcAtmosphereShift(scene.atmosphere, activePhase, phaseProgress);
  }

  // Phase 2.7: Reaction Chains
  const newChains = detectReactionTriggers(scene);
  scene.reactionChains = [...(scene.reactionChains ?? []), ...newChains];
  scene.reactionChains = scene.reactionChains.map((chain) => {
    if (chain.completed) return chain;
    const { updatedChain, activeStep, stepProgress } = advanceReactionChain(chain, TICK_DELTA_MS);
    if (activeStep) {
      const stepAsBeat: EmotionalBeat = { action: activeStep.action, durationMs: activeStep.durationMs, elapsedMs: 0, emotionTarget: null, intensityTarget: 0.5, cameraResponse: 'none', spacingDelta: 0, motionDamping: 0 };
      scene.actors = scene.actors.map((a) => applyBeatActingEffects(a, stepAsBeat, stepProgress));
      scene.camera = applyReactionCameraEffect(scene.camera, activeStep, stepProgress);
    }
    return updatedChain;
  });
  scene.reactionChains = scene.reactionChains.filter((c) => !c.completed);

  // Phase 2.7: Story Anchors
  if (!scene.storyAnchors || scene.storyAnchors.length === 0) {
    scene.storyAnchors = selectStoryAnchors(scene.cinematicGrammar.tone, scene.environment);
  }

  // Phase 2.7: Scene Evolution
  scene.sceneEvolution = evaluateSceneEvolution(scene, TICK_DELTA_MS);
  scene.actors = applySpacingEvolution(scene.actors, scene);
  scene.rhythm = evolvePacing(scene);
  scene.camera = evolveCameraIntensity(scene.camera, scene);

  // Phase 2.7: Cinematic Moment Detection
  scene.cinematicMomentScore = detectCinematicMoment(scene);

  validateContinuity(scene);
  captureSnapshot(scene);

  return scene;
}

export function resetSceneEvaluator() {
  lastActorIds = new Set<string>();
}
