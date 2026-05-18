import type { SceneGraph, DramaticBeat } from '@animaster/shared/scene';

export function detectSilenceBeat(scene: SceneGraph): DramaticBeat | null {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actors = scene.actors;

  if (tone === 'sad' || tone === 'lonely') {
    const allIdle = actors.every((a) => a.currentAction === 'idle');
    if (allIdle) {
      return { type: 'silence', durationMs: 1000, elapsedMs: 0, intensity: 0.6 };
    }
  }

  if (tone === 'romantic') {
    const allIdle = actors.every((a) => a.currentAction === 'idle');
    if (allIdle && actors.length >= 2) {
      return { type: 'silence', durationMs: 600, elapsedMs: 0, intensity: 0.4 };
    }
  }

  const hasExhausted = actors.some((a) => a.emotionState === 'exhausted');
  if (hasExhausted) {
    return { type: 'silence', durationMs: 800, elapsedMs: 0, intensity: 0.5 };
  }

  return null;
}
