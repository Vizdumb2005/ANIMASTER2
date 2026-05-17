import type { Actor, StagingRule, Environment } from '@animaster/shared/scene';

export function getTwoActorStagingRule(env: Environment): StagingRule {
  const centerX = env.width / 2;
  const floorY = env.height * 0.67;
  const spacing = env.width * 0.25;

  return {
    id: 'two_actor_conversation',
    condition: 'actorCount === 2',
    actorPositions: [
      { actorIndex: 0, x: centerX - spacing, y: floorY, facing: 'right' },
      { actorIndex: 1, x: centerX + spacing, y: floorY, facing: 'left' }
    ]
  };
}

export function getSolitaryStagingRule(env: Environment): StagingRule {
  const centerX = env.width / 2;
  const floorY = env.height * 0.67;

  return {
    id: 'solitary_center',
    condition: 'actorCount === 1',
    actorPositions: [
      { actorIndex: 0, x: centerX, y: floorY, facing: 'camera' }
    ]
  };
}

export function getBuiltInStagingRules(env: Environment): StagingRule[] {
  return [
    getSolitaryStagingRule(env),
    getTwoActorStagingRule(env)
  ];
}

export function applyStagingRule(actors: Actor[], rule: StagingRule): Actor[] {
  return actors.map((actor, index) => {
    const pos = rule.actorPositions.find((p) => p.actorIndex === index);
    if (!pos) return actor;

    return {
      ...actor,
      position: { x: pos.x, y: pos.y },
      targetPosition: actor.targetPosition
    };
  });
}
