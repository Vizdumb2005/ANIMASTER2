import type { Actor } from '@animaster/shared/scene';

const HESITATION_MIN = 200;
const HESITATION_MAX = 500;

const actorHesitations = new Map<string, { freezeUntil: number; lastAction: string }>();

export function clearHesitationState(actorIds: Set<string>) {
  for (const id of actorHesitations.keys()) {
    if (!actorIds.has(id)) actorHesitations.delete(id);
  }
}

export function applyHesitation(actor: Actor): { actor: Actor; frozen: boolean } {
  const state = actorHesitations.get(actor.id);

  if (state && state.lastAction !== actor.currentAction) {
    const duration = HESITATION_MIN + Math.random() * (HESITATION_MAX - HESITATION_MIN);
    actorHesitations.set(actor.id, {
      freezeUntil: actor.actionElapsed + duration,
      lastAction: actor.currentAction
    });
    return { actor, frozen: true };
  }

  if (!state) {
    actorHesitations.set(actor.id, {
      freezeUntil: 0,
      lastAction: actor.currentAction
    });
  }

  if (state && actor.actionElapsed < state.freezeUntil) {
    return { actor, frozen: true };
  }

  if (state) {
    state.lastAction = actor.currentAction;
  }

  return { actor, frozen: false };
}
