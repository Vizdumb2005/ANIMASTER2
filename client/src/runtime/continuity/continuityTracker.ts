import type { ActorEmotion, EmotionalAftermath, SceneGraph, ContinuityViolation } from '@animaster/shared/scene';

const DEFAULT_HALF_LIFE_MS: Record<ActorEmotion, number> = {
  neutral: 1800,
  sad: 7000,
  happy: 2200,
  nervous: 5200,
  excited: 3200,
  awkward: 4600,
  angry: 3800,
  exhausted: 7600
};

function getEmotionIntensity(emotion: ActorEmotion, explicitIntensity?: number) {
  if (typeof explicitIntensity === 'number' && Number.isFinite(explicitIntensity)) {
    return Math.max(0, Math.min(1, explicitIntensity));
  }

  switch (emotion) {
    case 'sad':
      return 0.55;
    case 'nervous':
      return 0.7;
    case 'excited':
      return 0.6;
    case 'awkward':
      return 0.5;
    case 'angry':
      return 0.72;
    case 'exhausted':
      return 0.66;
    case 'happy':
      return 0.42;
    default:
      return 0.12;
  }
}

function updateAftermathRecord(
  sceneTimeMs: number,
  currentEmotion: ActorEmotion,
  currentIntensity: number,
  previous: EmotionalAftermath | undefined
): EmotionalAftermath {
  const halfLife = DEFAULT_HALF_LIFE_MS[currentEmotion] ?? DEFAULT_HALF_LIFE_MS.neutral;
  const startedAtMs = previous?.startedAtMs ?? sceneTimeMs;
  const peakIntensity = Math.max(previous?.peakIntensity ?? 0, currentIntensity);
  const baselineResidual = previous ? previous.residualIntensity : currentIntensity;
  const elapsed = Math.max(0, sceneTimeMs - (previous?.lastUpdatedAtMs ?? startedAtMs));
  const decay = Math.exp(-elapsed / Math.max(1, halfLife));
  const residualIntensity = Math.max(currentIntensity, baselineResidual * decay);

  return {
    emotion: currentEmotion,
    peakIntensity,
    residualIntensity,
    startedAtMs,
    lastUpdatedAtMs: sceneTimeMs,
    recoveryHalfLifeMs: halfLife
  };
}

export function captureSnapshot(scene: SceneGraph) {
  scene.continuity ??= { lastValidatedVersion: scene.version, actorSnapshots: {}, cameraSnapshot: null, violations: [] };
  const actorSnapshots: NonNullable<SceneGraph['continuity']>['actorSnapshots'] = {};
  const sceneTimeMs = scene.simulation?.timeMs ?? scene.version * 16.6667;
  const previousAftermath = scene.continuity.emotionalAftermath ?? {};
  const emotionalAftermath: NonNullable<SceneGraph['continuity']>['emotionalAftermath'] = {};
  for (const actor of scene.actors) {
    const currentIntensity = getEmotionIntensity(actor.emotionState, actor.emotionIntensity);
    const previous = previousAftermath[actor.id];
    actorSnapshots[actor.id] = {
      position: { ...actor.position },
      emotionState: actor.emotionState,
      emotionIntensity: currentIntensity,
      actionType: actor.activeAction?.type ?? actor.currentAction
    };
    const shiftedEmotion = !previous || previous.emotion !== actor.emotionState;
    const shouldTrack = currentIntensity >= 0.18 || shiftedEmotion;
    if (shouldTrack) {
      emotionalAftermath[actor.id] = updateAftermathRecord(sceneTimeMs, actor.emotionState, currentIntensity, previous);
    }
  }
  scene.continuity.actorSnapshots = actorSnapshots;
  scene.continuity.cameraSnapshot = { x: scene.camera.x, y: scene.camera.y, zoom: scene.camera.zoom, mode: scene.camera.mode };
  scene.continuity.lastValidatedVersion = scene.version;
  scene.continuity.emotionalAftermath = emotionalAftermath;
  return scene.continuity;
}

export function getLastSnapshot(scene?: SceneGraph) {
  return scene?.continuity ?? null;
}

export function validateContinuity(scene: SceneGraph): ContinuityViolation[] {
  scene.continuity ??= { lastValidatedVersion: scene.version, actorSnapshots: {}, cameraSnapshot: null, violations: [] };
  const previous = scene.continuity.actorSnapshots;
  const violations: ContinuityViolation[] = [];

  for (const actor of scene.actors) {
    const prev = previous[actor.id];
    if (!prev) continue;
    const dx = actor.position.x - prev.position.x;
    const dy = actor.position.y - prev.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 300) {
      violations.push({ id: `spatial_${actor.id}`, severity: 'error', field: 'position', message: `${actor.id} moved ${Math.round(dist)}px without a transition`, repairApplied: false });
    }
    if (prev.actionType !== (actor.activeAction?.type ?? actor.currentAction) && actor.activeAction?.interruptible === false && actor.activeAction.status !== 'complete') {
      violations.push({ id: `action_${actor.id}`, severity: 'warning', field: 'activeAction', message: `${actor.id} changed non-interruptible action`, repairApplied: false });
    }
  }

  const preservedViolations = scene.continuity.violations.filter(
    (violation) => !violation.id.startsWith('spatial_') && !violation.id.startsWith('action_')
  );
  scene.continuity.violations = [...preservedViolations, ...violations];
  return violations;
}
