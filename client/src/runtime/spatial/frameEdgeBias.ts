import type { Actor, EmotionalSpatialState, Environment } from '@animaster/shared/scene';

export function applyFrameEdgeBias(actors: Actor[], spatial: EmotionalSpatialState, env: Environment): Actor[] {
  const bias = spatial.frameEdgeBias;
  if (bias.x === 0 && bias.y === 0) return actors;

  const centerX = env.width * 0.5;
  const centerY = env.height * 0.5;

  return actors.map((actor) => {
    const clone = { ...actor, position: { ...actor.position } };
    const offsetX = bias.x * env.width * 0.15;
    const offsetY = bias.y * env.height * 0.15;

    const targetX = clone.position.x + offsetX;
    const targetY = clone.position.y + offsetY;

    clone.position.x += (targetX - clone.position.x) * 0.015;
    clone.position.y += (targetY - clone.position.y) * 0.015;

    clone.position.x = Math.max(20, Math.min(env.width - 20, clone.position.x));
    clone.position.y = Math.max(20, Math.min(env.height - 20, clone.position.y));

    return clone;
  });
}
