import type { SceneGraph, AnticipationState, AnticipationPhase } from '@animaster/shared/scene';

export function buildAnticipation(scene: SceneGraph, existing: AnticipationState | undefined, deltaMs: number): AnticipationState {
  const current = existing ?? {
    phase: 'idle' as AnticipationPhase,
    buildDurationMs: 0,
    elapsedMs: 0,
    motionDamping: 1,
    cameraTightening: 0
  };

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actors = scene.actors;
  const tension = scene.tensionState;

  let shouldBuild = false;
  let buildDuration = 2000;

  if (tension && tension.currentLevel > 0.6) {
    shouldBuild = true;
    buildDuration = 3000;
  }

  if (actors.length >= 2) {
    const dx = Math.abs(actors[0].position.x - actors[1].position.x);
    const envWidth = scene.environment.width;
    if (dx / envWidth < 0.12) {
      shouldBuild = true;
      buildDuration = 1500;
    }
  }

  const hasApproaching = actors.some((a) => a.currentAction === 'approaching');
  if (hasApproaching && (tone === 'tense' || tone === 'threatening' || tone === 'romantic')) {
    shouldBuild = true;
    buildDuration = 2000;
  }

  if (current.phase === 'idle' && shouldBuild) {
    return {
      phase: 'building',
      buildDurationMs: buildDuration,
      elapsedMs: 0,
      motionDamping: 0.9,
      cameraTightening: 0.05
    };
  }

  if (current.phase === 'building') {
    const elapsed = current.elapsedMs + deltaMs;
    const progress = Math.min(1, elapsed / current.buildDurationMs);

    if (progress >= 1) {
      return {
        phase: 'peak',
        buildDurationMs: current.buildDurationMs,
        elapsedMs: elapsed,
        motionDamping: 0.2,
        cameraTightening: 0.5
      };
    }

    return {
      phase: 'building',
      buildDurationMs: current.buildDurationMs,
      elapsedMs: elapsed,
      motionDamping: 1 - progress * 0.7,
      cameraTightening: progress * 0.4
    };
  }

  if (current.phase === 'peak') {
    const peakHold = current.elapsedMs + deltaMs;
    if (peakHold > current.buildDurationMs + 800) {
      return {
        phase: 'release',
        buildDurationMs: current.buildDurationMs,
        elapsedMs: peakHold,
        motionDamping: 1.3,
        cameraTightening: -0.1
      };
    }
    return { ...current, elapsedMs: peakHold };
  }

  if (current.phase === 'release') {
    const releaseElapsed = current.elapsedMs + deltaMs;
    if (releaseElapsed > current.buildDurationMs + 1600) {
      return { phase: 'idle', buildDurationMs: 0, elapsedMs: 0, motionDamping: 1, cameraTightening: 0 };
    }
    const decay = Math.max(0, 1 - (releaseElapsed - current.buildDurationMs - 800) / 800);
    return {
      phase: 'release',
      buildDurationMs: current.buildDurationMs,
      elapsedMs: releaseElapsed,
      motionDamping: 1 + decay * 0.3,
      cameraTightening: -0.1 * decay
    };
  }

  return current;
}
