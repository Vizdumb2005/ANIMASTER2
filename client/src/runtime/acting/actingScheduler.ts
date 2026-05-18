import type { Actor, SceneGraph } from '@animaster/shared/scene';
import { deterministicDirection, deterministicRange } from '../deterministicRandom';
import type { RhythmRuntimeProfile, ToneRuntimeProfile } from '../semanticProfiles';

export function evaluateActingScheduler(actor: Actor, scene: SceneGraph, tone: ToneRuntimeProfile, rhythm: RhythmRuntimeProfile): Actor {
  const seed = scene.seed ?? scene.simulation?.seed ?? 1;
  const now = scene.simulation?.timeMs ?? actor.actionElapsed;
  const tick = scene.simulation?.tick ?? 0;
  const state = actor.actingState ?? {
    nextBeatAt: now + deterministicRange(seed, `${actor.id}:firstBeat`, tick, 1200, 3200) / rhythm.actingFrequencyScale,
    activePrimitive: 'none' as const,
    primitiveStartedAt: 0,
    primitiveDuration: 0,
    direction: deterministicDirection(seed, `${actor.id}:direction`, tick),
    pauseUntil: 0
  };

  const isSustained = actor.activeAction?.phase === 'sustained' || actor.currentAction === 'idle' || actor.currentAction === 'sitting';
  if (isSustained && now >= state.nextBeatAt && state.activePrimitive === 'none') {
    const selector = deterministicRange(seed, `${actor.id}:primitive`, tick, 0, 1);
    state.activePrimitive = selector < 0.28 && actor.emotionState === 'nervous'
      ? 'fidget'
      : selector < 0.52
        ? 'look_around'
        : selector < 0.78
          ? 'weight_shift'
          : 'hesitation';
    state.primitiveStartedAt = now;
    state.primitiveDuration = deterministicRange(seed, `${actor.id}:duration`, tick, 350, 900) * tone.pauseScale;
    state.direction = deterministicDirection(seed, `${actor.id}:primitiveDirection`, tick);

    if (state.activePrimitive === 'hesitation' && actor.activeAction?.interruptible !== false) {
      state.pauseUntil = now + Math.min(700, state.primitiveDuration);
    }
  }

  const elapsed = now - state.primitiveStartedAt;
  if (state.activePrimitive !== 'none') {
    const progress = Math.min(Math.max(elapsed / Math.max(1, state.primitiveDuration), 0), 1);
    const ease = Math.sin(progress * Math.PI);
    const energy = tone.gestureEnergy * rhythm.motionEnergyScale;
    switch (state.activePrimitive) {
      case 'weight_shift':
        actor.joints.torso.x += ease * 4 * state.direction * energy;
        break;
      case 'look_around':
        actor.joints.head.x += ease * 7 * state.direction * energy;
        break;
      case 'fidget':
        actor.joints.leftArm.y += Math.sin(progress * Math.PI * 4) * 4 * energy;
        actor.joints.rightArm.y -= Math.sin(progress * Math.PI * 3) * 3 * energy;
        break;
      case 'hesitation':
        actor.joints.head.y += ease * 2;
        actor.joints.leftArm.x += ease * 2 * state.direction;
        break;
    }
    if (progress >= 1) {
      state.activePrimitive = 'none';
      state.nextBeatAt = now + deterministicRange(seed, `${actor.id}:nextBeat`, tick, 1800, 7000) / Math.max(0.4, rhythm.actingFrequencyScale) * tone.pauseScale;
    }
  }

  actor.actingState = state;
  return actor;
}
