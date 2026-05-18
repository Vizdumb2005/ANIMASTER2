import type { SceneGraph, ReactionTrigger, ReactionChain } from '@animaster/shared/scene';
import { createReactionChain } from './reactionTemplates';

const lastProximities = new Map<string, number>();

export function detectReactionTriggers(scene: SceneGraph): ReactionChain[] {
  const newChains: ReactionChain[] = [];
  const existingTriggers = new Set((scene.reactionChains ?? []).filter((c) => !c.completed).map((c) => c.trigger));

  if (scene.actors.length >= 2) {
    const a = scene.actors[0];
    const b = scene.actors[1];
    const dx = a.position.x - b.position.x;
    const dy = a.position.y - b.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const pairKey = `${a.id}_${b.id}`;
    const lastDist = lastProximities.get(pairKey) ?? dist;
    lastProximities.set(pairKey, dist);

    if (lastDist > 150 && dist <= 150 && !existingTriggers.has('approach_detected')) {
      newChains.push(createReactionChain('approach_detected'));
    }

    const rel = scene.relationships.find(
      (r) => (r.actorAId === a.id && r.actorBId === b.id) || (r.actorAId === b.id && r.actorBId === a.id)
    );
    if (rel) {
      if (rel.type === 'confronting' && !existingTriggers.has('confrontation')) {
        newChains.push(createReactionChain('confrontation'));
      }
      if (rel.type === 'avoiding' && !existingTriggers.has('avoidance_detected')) {
        newChains.push(createReactionChain('avoidance_detected'));
      }
    }
  }

  const tone = scene.cinematicGrammar.tone;
  if (tone === 'awkward' && !existingTriggers.has('awkward_pause')) {
    newChains.push(createReactionChain('awkward_pause'));
  }

  return newChains;
}
