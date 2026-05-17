import type { Actor } from '@animaster/shared/scene';

const LOOK_INTERVAL_MIN = 5000;
const LOOK_INTERVAL_MAX = 12000;
const TURN_DURATION = 400;
const HOLD_DURATION = 600;
const TURN_AMOUNT = 8;

const actorTimers = new Map<string, { nextLookAt: number; looking: boolean; lookStart: number; direction: number }>();

function getTimer(actorId: string, elapsed: number) {
  let timer = actorTimers.get(actorId);
  if (!timer) {
    timer = {
      nextLookAt: elapsed + LOOK_INTERVAL_MIN + Math.random() * (LOOK_INTERVAL_MAX - LOOK_INTERVAL_MIN),
      looking: false,
      lookStart: 0,
      direction: Math.random() > 0.5 ? 1 : -1
    };
    actorTimers.set(actorId, timer);
  }
  return timer;
}

export function clearLookAroundState(actorIds: Set<string>) {
  for (const id of actorTimers.keys()) {
    if (!actorIds.has(id)) actorTimers.delete(id);
  }
}

export function applyLookAround(actor: Actor): Actor {
  const timer = getTimer(actor.id, actor.actionElapsed);

  if (!timer.looking && actor.actionElapsed >= timer.nextLookAt) {
    timer.looking = true;
    timer.lookStart = actor.actionElapsed;
    timer.direction *= -1;
  }

  if (timer.looking) {
    const elapsed = actor.actionElapsed - timer.lookStart;
    const totalDuration = TURN_DURATION * 2 + HOLD_DURATION;

    if (elapsed >= totalDuration) {
      timer.looking = false;
      timer.nextLookAt = actor.actionElapsed + LOOK_INTERVAL_MIN + Math.random() * (LOOK_INTERVAL_MAX - LOOK_INTERVAL_MIN);
    } else if (elapsed < TURN_DURATION) {
      const progress = elapsed / TURN_DURATION;
      actor.joints.head.x += Math.sin(progress * Math.PI * 0.5) * TURN_AMOUNT * timer.direction;
    } else if (elapsed < TURN_DURATION + HOLD_DURATION) {
      actor.joints.head.x += TURN_AMOUNT * timer.direction;
    } else {
      const returnProgress = (elapsed - TURN_DURATION - HOLD_DURATION) / TURN_DURATION;
      actor.joints.head.x += Math.cos(returnProgress * Math.PI * 0.5) * TURN_AMOUNT * timer.direction;
    }
  }

  return actor;
}
