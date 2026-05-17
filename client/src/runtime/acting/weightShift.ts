import type { Actor } from '@animaster/shared/scene';

const SHIFT_INTERVAL_MIN = 3000;
const SHIFT_INTERVAL_MAX = 8000;
const SHIFT_AMOUNT = 4;
const SHIFT_DURATION = 800;

const actorTimers = new Map<string, { nextShiftAt: number; shifting: boolean; shiftStart: number; direction: number }>();

function getTimer(actorId: string, elapsed: number) {
  let timer = actorTimers.get(actorId);
  if (!timer) {
    timer = {
      nextShiftAt: elapsed + SHIFT_INTERVAL_MIN + Math.random() * (SHIFT_INTERVAL_MAX - SHIFT_INTERVAL_MIN),
      shifting: false,
      shiftStart: 0,
      direction: Math.random() > 0.5 ? 1 : -1
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
      timer.nextShiftAt = actor.actionElapsed + SHIFT_INTERVAL_MIN + Math.random() * (SHIFT_INTERVAL_MAX - SHIFT_INTERVAL_MIN);
    } else {
      const ease = Math.sin(progress * Math.PI);
      actor.joints.torso.x += ease * SHIFT_AMOUNT * timer.direction;
    }
  }

  return actor;
}
