import type { SceneGraph, CinematicMomentScore } from '@animaster/shared/scene';
import { scoreSilhouetteReadability } from '../poses/silhouetteScoring';
import { getEvolutionTrend } from './sceneEvolutionEvaluator';

export function detectCinematicMoment(scene: SceneGraph): CinematicMomentScore {
  let emotionalClarity = 0.5;
  if (scene.actors.length > 0) {
    const hasEmotion = scene.actors.some((a) => a.emotionState !== 'neutral');
    const hasIntensity = scene.actors.some((a) => (a.emotionIntensity ?? 0) > 0.3);
    emotionalClarity = (hasEmotion ? 0.4 : 0) + (hasIntensity ? 0.3 : 0) + 0.3;
  }

  let poseReadability = 0.5;
  if (scene.actors.length > 0) {
    const scores = scene.actors.map(scoreSilhouetteReadability);
    poseReadability = scores.reduce((s, v) => s + v, 0) / scores.length;
  }

  let dramaticProgression = 0.3;
  if (scene.sceneEvolution && scene.sceneEvolution.intensityTrajectory.length > 2) {
    const trend = Math.abs(getEvolutionTrend(scene.sceneEvolution.intensityTrajectory));
    dramaticProgression = Math.min(0.3 + trend * 5, 1);
  }

  let beatCoherence = 0.5;
  if (scene.beatSequence && !scene.beatSequence.completed) {
    const totalBeats = scene.beatSequence.beats.length;
    const currentBeat = scene.beatSequence.currentIndex;
    beatCoherence = totalBeats > 0 ? 0.3 + (currentBeat / totalBeats) * 0.7 : 0.5;
  }

  const overallScore = emotionalClarity * 0.3 + poseReadability * 0.2 + dramaticProgression * 0.3 + beatCoherence * 0.2;

  return { emotionalClarity, poseReadability, dramaticProgression, beatCoherence, overallScore };
}
