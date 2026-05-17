import type { Actor } from '@animaster/shared/scene';
import { initActorJoints } from '../initActorJoints';

const PACE_STEPS = 4;
const STEP_DISTANCE = 30;
const IDLE_THRESHOLD = 4000;

export function evaluatePace(actor: Actor, deltaMs: number): Actor {
  if (actor.actionElapsed < IDLE_THRESHOLD) {
    return actor;
  }

  const paceElapsed = actor.actionElapsed - IDLE_THRESHOLD;
  const totalDistance = STEP_DISTANCE * PACE_STEPS;
  const cycleLength = totalDistance * 2;
  const posInCycle = paceElapsed * 0.08 % cycleLength;

  const direction = posInCycle < totalDistance ? 1 : -1;
  const distInHalf = posInCycle < totalDistance ? posInCycle : cycleLength - posInCycle;

  const baseX = actor.position.x;
  const offsetX = (distInHalf / totalDistance) * totalDistance * direction * 0.5;

  actor.position.x = baseX + offsetX * 0.02;
  actor.joints = initActorJoints(actor.position);

  const phase = paceElapsed * 0.008;
  actor.joints.leftLeg.y += Math.sin(phase) * 12;
  actor.joints.rightLeg.y += Math.sin(phase + Math.PI) * 12;
  actor.joints.leftArm.y += Math.sin(phase + Math.PI) * 8 * 0.3;
  actor.joints.rightArm.y += Math.sin(phase) * 8 * 0.3;

  return actor;
}
