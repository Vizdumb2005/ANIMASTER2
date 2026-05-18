import type { Actor, Environment } from '@animaster/shared/scene';

export function calculateRuleOfThirdsScore(actors: Actor[], env: Environment): number {
  if (actors.length === 0) return 1;

  const thirdX1 = env.width / 3;
  const thirdX2 = (env.width * 2) / 3;
  const thirdY1 = env.height / 3;
  const thirdY2 = (env.height * 2) / 3;

  const intersections = [
    { x: thirdX1, y: thirdY1 },
    { x: thirdX2, y: thirdY1 },
    { x: thirdX1, y: thirdY2 },
    { x: thirdX2, y: thirdY2 }
  ];

  let totalScore = 0;

  for (const actor of actors) {
    let minDist = Infinity;
    for (const point of intersections) {
      const dx = actor.position.x - point.x;
      const dy = actor.position.y - point.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      minDist = Math.min(minDist, dist);
    }

    const maxDist = Math.sqrt(env.width * env.width + env.height * env.height) * 0.25;
    const score = Math.max(0, 1 - minDist / maxDist);
    totalScore += score;
  }

  return totalScore / actors.length;
}
