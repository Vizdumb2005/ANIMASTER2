import type { Actor, Environment, CompositionMetrics } from '@animaster/shared/scene';
import { calculateRuleOfThirdsScore } from './ruleOfThirds';

export function calculateCompositionMetrics(actors: Actor[], env: Environment): CompositionMetrics {
  const ruleOfThirdsScore = calculateRuleOfThirdsScore(actors, env);
  const negativeSpaceBalance = calculateNegativeSpaceBalance(actors, env);
  const visualWeight = calculateVisualWeight(actors, env);
  const silhouetteClarity = calculateSilhouetteClarity(actors);
  const depthSeparation = calculateDepthSeparation(actors, env);

  return { ruleOfThirdsScore, negativeSpaceBalance, visualWeight, silhouetteClarity, depthSeparation };
}

function calculateNegativeSpaceBalance(actors: Actor[], env: Environment): number {
  if (actors.length === 0) return 1;

  const centerX = env.width / 2;
  let leftMass = 0;
  let rightMass = 0;

  for (const actor of actors) {
    if (actor.position.x < centerX) leftMass += 1;
    else rightMass += 1;
  }

  const total = leftMass + rightMass;
  if (total === 0) return 1;
  return 1 - Math.abs(leftMass - rightMass) / total;
}

function calculateVisualWeight(actors: Actor[], env: Environment): { left: number; right: number } {
  const centerX = env.width / 2;
  let left = 0;
  let right = 0;

  for (const actor of actors) {
    const weight = getActorVisualWeight(actor);
    if (actor.position.x < centerX) left += weight;
    else right += weight;
  }

  return { left, right };
}

function getActorVisualWeight(actor: Actor): number {
  let weight = 1;
  if (actor.currentAction !== 'idle') weight += 0.3;
  if (actor.emotionState === 'angry' || actor.emotionState === 'excited') weight += 0.2;
  return weight;
}

function calculateSilhouetteClarity(actors: Actor[]): number {
  if (actors.length <= 1) return 1;

  let minDist = Infinity;
  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const dx = actors[i].position.x - actors[j].position.x;
      const dy = actors[i].position.y - actors[j].position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      minDist = Math.min(minDist, dist);
    }
  }

  return Math.min(1, minDist / 60);
}

function calculateDepthSeparation(actors: Actor[], env: Environment): number {
  if (actors.length <= 1) return 0;

  let maxYDiff = 0;
  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const diff = Math.abs(actors[i].position.y - actors[j].position.y);
      maxYDiff = Math.max(maxYDiff, diff);
    }
  }

  return Math.min(1, maxYDiff / (env.height * 0.3));
}
