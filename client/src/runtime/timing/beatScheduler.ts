import type { SceneGraph, DramaticBeat, BeatType } from '@animaster/shared/scene';

export function scheduleBeats(scene: SceneGraph): DramaticBeat[] {
  const beats: DramaticBeat[] = [];
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actors = scene.actors;

  if (tone === 'tense' || tone === 'threatening') {
    beats.push({ type: 'tension_hold', durationMs: 1200, elapsedMs: 0, intensity: 0.7 });
  }

  if (tone === 'sad' || tone === 'lonely') {
    beats.push({ type: 'silence', durationMs: 800, elapsedMs: 0, intensity: 0.5 });
  }

  for (const actor of actors) {
    if (actor.currentAction === 'approaching') {
      beats.push({ type: 'anticipation', durationMs: 600, elapsedMs: 0, intensity: 0.6 });
    }

    if (actor.emotionState === 'nervous' || actor.emotionState === 'awkward') {
      beats.push({ type: 'reaction', durationMs: 400, elapsedMs: 0, intensity: 0.4 });
    }
  }

  const hasRelationshipChange = (scene.relationships ?? []).some(
    (r) => r.type === 'confronting' || r.type === 'approaching'
  );
  if (hasRelationshipChange) {
    beats.push({ type: 'anticipation', durationMs: 500, elapsedMs: 0, intensity: 0.5 });
  }

  return beats;
}
