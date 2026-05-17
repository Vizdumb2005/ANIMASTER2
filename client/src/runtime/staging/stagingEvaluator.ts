import type { Actor, SceneGraph, StagingRule } from '@animaster/shared/scene';
import { getBuiltInStagingRules, applyStagingRule } from './stagingRules';

export function evaluateStaging(scene: SceneGraph): Actor[] {
  const rules = getBuiltInStagingRules(scene.environment);
  const actorCount = scene.actors.length;

  const matchingRule = rules.find((rule) => {
    if (rule.condition === 'actorCount === 1' && actorCount === 1) return true;
    if (rule.condition === 'actorCount === 2' && actorCount === 2) return true;
    return false;
  });

  if (!matchingRule) return scene.actors;

  const hasTargets = scene.actors.some((a) => a.targetPosition !== null);
  if (hasTargets) return scene.actors;

  return applyStagingRule(scene.actors, matchingRule);
}
