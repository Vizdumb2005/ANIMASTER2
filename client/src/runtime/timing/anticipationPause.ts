import type { SceneGraph, DramaticBeat } from '@animaster/shared/scene';

export function detectAnticipationPause(scene: SceneGraph): DramaticBeat | null {
  const actors = scene.actors;
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';

  for (const actor of actors) {
    if (actor.currentAction === 'approaching') {
      const target = actors.find((a) => a.id !== actor.id);
      if (target) {
        const dist = Math.abs(actor.position.x - target.position.x);
        if (dist < 80 && dist > 40) {
          return { type: 'anticipation', durationMs: 700, elapsedMs: 0, intensity: 0.65 };
        }
      }
    }
  }

  if (tone === 'tense' || tone === 'threatening') {
    const hasMoving = actors.some((a) => a.currentAction === 'walking' || a.currentAction === 'pacing');
    if (hasMoving) {
      return { type: 'anticipation', durationMs: 500, elapsedMs: 0, intensity: 0.5 };
    }
  }

  return null;
}
