import type { EmotionalArc, ArcPhase } from '@animaster/shared/scene';

export interface ArcEvaluatorOutput {
  updatedArc: EmotionalArc;
  activePhase: ArcPhase | null;
  phaseProgress: number;
}

export function advanceEmotionalArc(arc: EmotionalArc, deltaMs: number): ArcEvaluatorOutput {
  if (arc.completed) {
    return { updatedArc: arc, activePhase: null, phaseProgress: 1 };
  }

  const updated: EmotionalArc = {
    ...arc,
    phases: arc.phases.map((p) => ({ ...p })),
    totalElapsedMs: arc.totalElapsedMs + deltaMs,
  };

  if (updated.currentPhaseIndex >= updated.phases.length) {
    updated.completed = true;
    return { updatedArc: updated, activePhase: null, phaseProgress: 1 };
  }

  const phase = updated.phases[updated.currentPhaseIndex];
  phase.elapsedMs += deltaMs;

  const progress = Math.min(phase.elapsedMs / Math.max(1, phase.durationMs), 1);

  if (phase.elapsedMs >= phase.durationMs) {
    updated.currentPhaseIndex += 1;
  }

  return { updatedArc: updated, activePhase: phase, phaseProgress: progress };
}
