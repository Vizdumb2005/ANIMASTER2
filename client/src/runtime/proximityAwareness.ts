import type { Actor, CharacterRelationship } from '@animaster/shared/scene';
import type { ToneRuntimeProfile } from './semanticProfiles';

export function evaluateProximity(actors: Actor[], relationships: CharacterRelationship[], tone?: ToneRuntimeProfile): CharacterRelationship[] {
  const updated: CharacterRelationship[] = [];

  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const a = actors[i];
      const b = actors[j];
      const dx = b.position.x - a.position.x;
      const dy = b.position.y - a.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const existing = relationships.find(
        (r) => (r.actorAId === a.id && r.actorBId === b.id) || (r.actorAId === b.id && r.actorBId === a.id)
      );

      const preferredDistance = existing?.preferredDistance ?? tone?.preferredRelationshipDistance ?? 180;
      const awarenessRadius = existing?.awarenessRadius ?? Math.max(200, preferredDistance * 1.2);
      const isAware = dist <= awarenessRadius;
      const tension = existing?.tension ?? (dist < preferredDistance * 0.75 ? 0.75 : dist > preferredDistance * 1.5 ? 0.15 : 0.35);

      updated.push({
        actorAId: a.id,
        actorBId: b.id,
        type: existing?.type ?? (isAware ? 'approaching' : 'stranger'),
        awarenessRadius,
        gazeTarget: isAware ? b.id : (existing?.gazeTarget ?? null),
        emotionalReaction: existing?.emotionalReaction ?? null,
        preferredDistance,
        tension
      });
    }
  }

  return updated;
}

export function orientActorTowardTarget(actor: Actor, allActors: Actor[], relationships: CharacterRelationship[]): Actor {
  const rel = relationships.find(
    (r) => (r.actorAId === actor.id || r.actorBId === actor.id) && r.gazeTarget !== null
  );

  if (!rel || !rel.gazeTarget) return actor;

  const target = allActors.find((a) => a.id === rel.gazeTarget);
  if (!target) return actor;

  const dx = target.position.x - actor.position.x;
  const headOffset = dx > 0 ? 3 : -3;
  actor.joints.head.x += headOffset;

  return actor;
}
