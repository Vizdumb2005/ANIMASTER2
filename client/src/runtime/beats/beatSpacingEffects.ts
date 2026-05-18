import type { Actor, EmotionalBeat } from '@animaster/shared/scene';

export function applyBeatSpacingEffects(actors: Actor[], beat: EmotionalBeat, progress: number): Actor[] {
  if (actors.length < 2 || beat.spacingDelta === 0) return actors;

  const ease = Math.sin(progress * Math.PI);
  const delta = beat.spacingDelta * ease * 0.5;

  const midX = actors.reduce((s, a) => s + a.position.x, 0) / actors.length;

  return actors.map((actor) => {
    const dir = actor.position.x < midX ? -1 : 1;
    return { ...actor, position: { ...actor.position, x: actor.position.x + dir * delta } };
  });
}
