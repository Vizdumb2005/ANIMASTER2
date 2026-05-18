import type { SceneGraph, SceneRhythm } from '@animaster/shared/scene';
import { getEvolutionTrend } from './sceneEvolutionEvaluator';

export function evolvePacing(scene: SceneGraph): SceneRhythm {
  const rhythm = { ...scene.rhythm };
  if (!scene.sceneEvolution || !scene.emotionalArc) return rhythm;

  const intensityTrend = getEvolutionTrend(scene.sceneEvolution.intensityTrajectory);
  const arcPhaseIndex = scene.emotionalArc.currentPhaseIndex;
  const totalPhases = scene.emotionalArc.phases.length;
  const arcProgress = totalPhases > 0 ? arcPhaseIndex / totalPhases : 0;

  if (arcProgress > 0.6 && intensityTrend > 0.05) {
    if (rhythm.tempo === 'slow') rhythm.tempo = 'medium';
    rhythm.pauseFrequencyPerMinute = Math.max(1, rhythm.pauseFrequencyPerMinute - 1);
  } else if (arcProgress > 0.8 && intensityTrend < -0.03) {
    if (rhythm.tempo === 'fast') rhythm.tempo = 'medium';
    rhythm.pauseFrequencyPerMinute = Math.min(12, rhythm.pauseFrequencyPerMinute + 1);
  }

  return rhythm;
}
