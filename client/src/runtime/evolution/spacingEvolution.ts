import type { Actor, SceneGraph } from '@animaster/shared/scene';
import { getEvolutionTrend } from './sceneEvolutionEvaluator';

export function applySpacingEvolution(actors: Actor[], scene: SceneGraph): Actor[] {
  if (actors.length < 2 || !scene.sceneEvolution) return actors;

  const spacingTrend = getEvolutionTrend(scene.sceneEvolution.spacingTrajectory);
  const intensityTrend = getEvolutionTrend(scene.sceneEvolution.intensityTrajectory);

  if (Math.abs(spacingTrend) < 5 && Math.abs(intensityTrend) < 0.05) return actors;

  const midX = actors.reduce((s, a) => s + a.position.x, 0) / actors.length;
  const compressionFactor = intensityTrend > 0 ? -0.3 : 0.2;

  return actors.map((actor) => {
    const dir = actor.position.x < midX ? -1 : 1;
    const shift = dir * compressionFactor;
    return { ...actor, position: { ...actor.position, x: actor.position.x + shift } };
  });
}
