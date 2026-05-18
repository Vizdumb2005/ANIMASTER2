import type { SceneGraph, PowerDynamic, PowerDynamicType } from '@animaster/shared/scene';

export function resolvePowerDynamics(scene: SceneGraph): PowerDynamic[] {
  const actors = scene.actors;
  if (actors.length < 2) return [];

  const dynamics: PowerDynamic[] = [];
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const relationships = scene.relationships ?? [];

  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const a = actors[i];
      const b = actors[j];

      let powerBalance = 0;
      let dynamicType: PowerDynamicType = 'balanced';

      const aWeight = getActorPowerWeight(a.emotionState, a.currentAction);
      const bWeight = getActorPowerWeight(b.emotionState, b.currentAction);
      powerBalance = aWeight - bWeight;

      const rel = relationships.find(
        (r) => (r.actorAId === a.id && r.actorBId === b.id) || (r.actorAId === b.id && r.actorBId === a.id)
      );

      if (rel) {
        if (rel.type === 'confronting') {
          dynamicType = Math.abs(powerBalance) < 0.2 ? 'balanced' : powerBalance > 0 ? 'dominance' : 'submission';
        } else if (rel.type === 'approaching') {
          dynamicType = 'pursuit';
        } else if (rel.type === 'avoiding') {
          dynamicType = 'withdrawal';
        }
      }

      if (tone === 'threatening') {
        dynamicType = powerBalance >= 0 ? 'dominance' : 'submission';
      }

      if (dynamicType === 'balanced' && Math.abs(powerBalance) > 0.3) {
        dynamicType = powerBalance > 0 ? 'dominance' : 'submission';
      }

      const dominantActorId = powerBalance >= 0 ? a.id : b.id;
      const submissiveActorId = powerBalance >= 0 ? b.id : a.id;

      dynamics.push({
        actorAId: a.id,
        actorBId: b.id,
        dominantActorId: dynamicType === 'balanced' ? null : dominantActorId,
        submissiveActorId: dynamicType === 'balanced' ? null : submissiveActorId,
        powerBalance,
        dynamicType
      });
    }
  }

  return dynamics;
}

function getActorPowerWeight(emotion: string, action: string): number {
  let weight = 0;

  switch (emotion) {
    case 'angry': weight += 0.6; break;
    case 'excited': weight += 0.3; break;
    case 'happy': weight += 0.1; break;
    case 'neutral': weight += 0; break;
    case 'nervous': weight -= 0.4; break;
    case 'sad': weight -= 0.3; break;
    case 'awkward': weight -= 0.3; break;
    case 'exhausted': weight -= 0.5; break;
  }

  switch (action) {
    case 'approach': weight += 0.2; break;
    case 'pace': weight += 0.1; break;
    case 'sit': weight -= 0.2; break;
    case 'idle': break;
  }

  return weight;
}
