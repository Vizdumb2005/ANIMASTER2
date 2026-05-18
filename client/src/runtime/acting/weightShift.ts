import type { Actor } from '@animaster/shared/scene';

const SHIFT_INTERVAL = 5000;
const SHIFT_AMOUNT = 4;
const SHIFT_DURATION = 800;

const actorTimers = new Map<string, { nextShiftAt: number; shifting: boolean; shiftStart: number; direction: number }>();

function actorHash(actorId: string) {
  return [...actorId].reduce((acc, char) => acc + char.charCodeAt(0), 0);
}

function getTimer(actorId: string, elapsed: number) {
  let timer = actorTimers.get(actorId);
  if (!timer) {
    const offset = actorHash(actorId) % 1800;
    timer = {
      nextShiftAt: elapsed + SHIFT_INTERVAL + offset,
      shifting: false,
      shiftStart: 0,
      direction: actorHash(actorId) % 2 === 0 ? 1 : -1
    };
    actorTimers.set(actorId, timer);
  }
  return timer;
}

export function clearWeightShiftState(actorIds: Set<string>) {
  for (const id of actorTimers.keys()) {
    if (!actorIds.has(id)) actorTimers.delete(id);
  }
}

export function applyWeightShift(actor: Actor): Actor {
  const timer = getTimer(actor.id, actor.actionElapsed);

  if (!timer.shifting && actor.actionElapsed >= timer.nextShiftAt) {
    timer.shifting = true;
    timer.shiftStart = actor.actionElapsed;
    timer.direction *= -1;
  }

  if (timer.shifting) {
    const progress = (actor.actionElapsed - timer.shiftStart) / SHIFT_DURATION;
    if (progress >= 1) {
      timer.shifting = false;
      timer.nextShiftAt = actor.actionElapsed + SHIFT_INTERVAL + (actorHash(actor.id) % 1800);
    } else {
      const ease = Math.sin(progress * Math.PI);
      actor.joints.torso.x += ease * SHIFT_AMOUNT * timer.direction;
    }
  }

  return actor;
}
