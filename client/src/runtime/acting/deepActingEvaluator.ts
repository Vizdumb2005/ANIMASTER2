import type { Actor, DeepActingState } from '@animaster/shared/scene';

export function evaluateDeepActing(actor: Actor, deltaMs: number): DeepActingState {
  const emotion = actor.emotionState;
  const action = actor.currentAction;

  let postureOpenness = 0.5;
  let gazeAversion = 0;
  let emotionalRecoveryTimer = 0;
  let nervousRepetitionCount = 0;
  let breathingRate: 'slow' | 'normal' | 'fast' = 'normal';

  switch (emotion) {
    case 'happy':
    case 'excited':
      postureOpenness = 0.8;
      breathingRate = emotion === 'excited' ? 'fast' : 'normal';
      break;
    case 'sad':
      postureOpenness = 0.2;
      gazeAversion = 0.6;
      breathingRate = 'slow';
      emotionalRecoveryTimer = 2000;
      break;
    case 'nervous':
      postureOpenness = 0.3;
      gazeAversion = 0.5;
      breathingRate = 'fast';
      nervousRepetitionCount = 3;
      break;
    case 'angry':
      postureOpenness = 0.4;
      gazeAversion = 0.1;
      breathingRate = 'fast';
      break;
    case 'awkward':
      postureOpenness = 0.35;
      gazeAversion = 0.7;
      nervousRepetitionCount = 2;
      break;
    case 'exhausted':
      postureOpenness = 0.15;
      gazeAversion = 0.4;
      breathingRate = 'slow';
      emotionalRecoveryTimer = 3000;
      break;
  }

  if (action === 'sitting') {
    postureOpenness *= 0.8;
  }

  return { postureOpenness, gazeAversion, emotionalRecoveryTimer, nervousRepetitionCount, breathingRate };
}

export function applyDeepActing(actor: Actor, state: DeepActingState, tick: number): Actor {
  const clone = { ...actor, joints: {
    head: { ...actor.joints.head },
    torso: { ...actor.joints.torso },
    leftArm: { ...actor.joints.leftArm },
    rightArm: { ...actor.joints.rightArm },
    leftLeg: { ...actor.joints.leftLeg },
    rightLeg: { ...actor.joints.rightLeg }
  } };

  if (state.gazeAversion > 0.3) {
    const aversionOffset = Math.sin(tick * 0.002) * state.gazeAversion * 4;
    clone.joints.head.x += aversionOffset;
  }

  if (state.postureOpenness < 0.3) {
    const closedAmount = (1 - state.postureOpenness) * 6;
    clone.joints.leftArm.x += closedAmount;
    clone.joints.rightArm.x -= closedAmount;
  }

  if (state.breathingRate === 'fast') {
    const breathCycle = Math.sin(tick * 0.008) * 1.5;
    clone.joints.torso.y += breathCycle;
  } else if (state.breathingRate === 'slow') {
    const breathCycle = Math.sin(tick * 0.002) * 1;
    clone.joints.torso.y += breathCycle;
  }

  return clone;
}
