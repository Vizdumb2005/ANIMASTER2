import type { Actor, EmotionalSpatialState, Environment } from '@animaster/shared/scene';

export function applyNegativeSpace(actors: Actor[], spatial: EmotionalSpatialState, env: Environment): Actor[] {
  if (actors.length === 0) return actors;

  const centerX = env.width * 0.5;
  const centerY = env.height * 0.67;
  const intent = spatial.spatialIntent;

  return actors.map((actor, idx) => {
    const clone = { ...actor, position: { ...actor.position } };

    if (actors.length === 1) {
      switch (intent) {
        case 'isolation': {
          const edgeX = env.width * 0.15;
          const targetX = clone.position.x + (edgeX - clone.position.x) * 0.03;
          clone.position.x = targetX;
          break;
        }
        case 'vulnerability': {
          const lowerRight = { x: env.width * 0.65, y: centerY + 20 };
          clone.position.x += (lowerRight.x - clone.position.x) * 0.02;
          clone.position.y += (lowerRight.y - clone.position.y) * 0.02;
          break;
        }
        default:
          break;
      }
    }

    if (actors.length >= 2) {
      const other = actors[idx === 0 ? 1 : 0];
      const dx = clone.position.x - other.position.x;
      const spacingMult = spatial.negativeSpaceRatio;

      switch (intent) {
        case 'confrontation': {
          const targetDist = env.width * 0.15;
          const currentDist = Math.abs(dx);
          if (currentDist > targetDist) {
            const pull = (currentDist - targetDist) * 0.02;
            clone.position.x -= Math.sign(dx) * pull;
          }
          break;
        }
        case 'intimacy': {
          const targetDist = env.width * 0.08;
          const currentDist = Math.abs(dx);
          if (currentDist > targetDist) {
            const pull = (currentDist - targetDist) * 0.015;
            clone.position.x -= Math.sign(dx) * pull;
          }
          break;
        }
        case 'avoidance': {
          const targetDist = env.width * spacingMult;
          const currentDist = Math.abs(dx);
          if (currentDist < targetDist) {
            const push = (targetDist - currentDist) * 0.02;
            clone.position.x += Math.sign(dx) * push;
          }
          break;
        }
        default:
          break;
      }
    }

    return clone;
  });
}
