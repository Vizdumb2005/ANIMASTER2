import type { Actor, CharacterRelationship } from '@animaster/shared/scene';

export function evaluateProximity(actors: Actor[], relationships: CharacterRelationship[]): CharacterRelationship[] {
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

      const awarenessRadius = existing?.awarenessRadius ?? 200;
      const isAware = dist <= awarenessRadius;

      updated.push({
        actorAId: a.id,
        actorBId: b.id,
        type: existing?.type ?? (isAware ? 'approaching' : 'stranger'),
        awarenessRadius,
        gazeTarget: isAware ? b.id : (existing?.gazeTarget ?? null),
        emotionalReaction: existing?.emotionalReaction ?? null
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
