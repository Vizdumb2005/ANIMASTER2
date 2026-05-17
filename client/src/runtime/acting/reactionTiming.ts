import type { Actor, CharacterRelationship } from '@animaster/shared/scene';

const DEFAULT_REACTION_DELAY_MS = 300;

const pendingReactions = new Map<string, { triggerAt: number; reaction: string }>();

export function scheduleReaction(actorId: string, reaction: string, currentElapsed: number, delayMs: number = DEFAULT_REACTION_DELAY_MS) {
  pendingReactions.set(actorId, {
    triggerAt: currentElapsed + delayMs,
    reaction
  });
}

export function evaluateReactions(actors: Actor[], relationships: CharacterRelationship[]): Actor[] {
  return actors.map((actor) => {
    const pending = pendingReactions.get(actor.id);
    if (!pending) return actor;

    if (actor.actionElapsed >= pending.triggerAt) {
      pendingReactions.delete(actor.id);
      const rel = relationships.find(
        (r) => (r.actorAId === actor.id || r.actorBId === actor.id) && r.emotionalReaction !== null
      );
      if (rel && rel.emotionalReaction) {
        return {
          ...actor,
          emotionState: rel.emotionalReaction as Actor['emotionState']
        };
      }
    }

    return actor;
  });
}
