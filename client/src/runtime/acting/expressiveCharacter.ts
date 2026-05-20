// Phase 8 — Task Group 9: Character Expressiveness Upgrade

import type { Actor, ActorEmotion, FaceExpression } from '@animaster/shared/scene';

export interface ExpressiveState {
  headTilt: number;        // -0.3 to 0.3 radians
  breathingPhase: number;  // 0 to 2*PI
  breathingRate: number;   // multiplier
  idleMotion: number;      // 0 to 1 intensity
  stanceVariation: number; // -1 to 1
  gazeWander: { x: number; y: number };
  blinkTimer: number;
  nextBlinkAt: number;
  // Phase 8 enhancements
  emotionPeakIntensity: number;    // Track peak intensity for recovery
  lastEmotionChange: number;
  hesitationPhase: number;  // For "looking away then back" pattern
  weightShift: number;      // For nervous weight shifting
  swayOffset: number;       // For sad/gentle swaying
  recoveryTimer: number;   // For post-intensity recovery
}

const expressiveStates = new Map<string, ExpressiveState>();

export function getExpressiveState(actorId: string): ExpressiveState {
  let state = expressiveStates.get(actorId);
  if (!state) {
    state = {
      headTilt: 0,
      breathingPhase: Math.random() * Math.PI * 2,
      breathingRate: 1,
      idleMotion: 0.3,
      stanceVariation: 0,
      gazeWander: { x: 0, y: 0 },
      blinkTimer: 0,
      nextBlinkAt: 2000 + Math.random() * 3000,
      // Phase 8 enhancements
      emotionPeakIntensity: 0,
      lastEmotionChange: 0,
      hesitationPhase: 0,
      weightShift: 0,
      swayOffset: 0,
      recoveryTimer: 0,
    };
    expressiveStates.set(actorId, state);
  }
  return state;
}

export function updateExpressiveState(actor: Actor, deltaMs: number): ExpressiveState {
  const state = getExpressiveState(actor.id);
  const emotion = actor.emotionState;
  const intensity = actor.emotionIntensity ?? 0.5;

  // Track emotion changes for recovery animation
  if (intensity > state.emotionPeakIntensity) {
    state.emotionPeakIntensity = intensity;
    state.lastEmotionChange = Date.now();
    state.recoveryTimer = 0;
  }

  // Recovery timer - decreases after emotion intensity peaks
  if (state.recoveryTimer < 1) {
    state.recoveryTimer += deltaMs / 3000; // ~3 seconds to full recovery
  }

  // Breathing - more variation based on emotion
  const targetRate = getBreathingRate(emotion, intensity);
  state.breathingRate += (targetRate - state.breathingRate) * 0.05;
  state.breathingPhase += (deltaMs / 1000) * state.breathingRate * Math.PI;
  if (state.breathingPhase > Math.PI * 2) state.breathingPhase -= Math.PI * 2;

  // Head tilt
  const targetTilt = getTargetHeadTilt(emotion, intensity);
  state.headTilt += (targetTilt - state.headTilt) * 0.03;

  // Idle motion with emotional variation
  const targetIdle = getIdleMotionIntensity(emotion, intensity);
  state.idleMotion += (targetIdle - state.idleMotion) * 0.04;

  // Stance variation with emotional nuance 
  const targetStance = getStanceVariation(emotion);
  state.stanceVariation += (targetStance - state.stanceVariation) * 0.02;

  // Weight shift for nervous emotions
  if (emotion === 'nervous' || emotion === 'awkward') {
    state.weightShift += (Math.random() - 0.5) * 0.15 * (1 + intensity);
    state.weightShift = clamp(state.weightShift, -0.3, 0.3);
  } else {
    state.weightShift *= 0.95; // decay
  }

  // Sad sway
  if (emotion === 'sad' || emotion === 'exhausted') {
    state.swayOffset += (deltaMs / 1000) * 0.5; // gentle sway
    state.swayOffset = state.swayOffset % (Math.PI * 2);
  } else {
    state.swayOffset *= 0.98;
  }

  // Gaze behavior: add "looking away then looking back" hesitation pattern for tense emotions
  if (emotion === 'nervous' || emotion === 'awkward' || (emotion as string) === 'tense') {
    state.hesitationPhase += deltaMs / 2000; // ~2 second cycle
    const hesitationCycle = Math.sin(state.hesitationPhase * Math.PI);
    if (hesitationCycle > 0.7) {
      // Looking away
      state.gazeWander.x += 0.05;
    } else if (hesitationCycle < -0.5) {
      // Looking back 
      state.gazeWander.x -= 0.03;
    }
  }

  const wanderSpeed = emotion === 'nervous' ? 0.08 : emotion === 'sad' ? 0.02 : 0.04;
  state.gazeWander.x += (Math.random() - 0.5) * wanderSpeed;
  state.gazeWander.y += (Math.random() - 0.5) * wanderSpeed * 0.5;
  state.gazeWander.x = clamp(state.gazeWander.x, -0.4, 0.4);
  state.gazeWander.y = clamp(state.gazeWander.y, -0.2, 0.2);

  // Blink - emotion affects blink rate
  state.blinkTimer += deltaMs;
  if (state.blinkTimer >= state.nextBlinkAt) {
    state.blinkTimer = 0;
    const blinkInterval = emotion === 'nervous' ? 1500 : emotion === 'exhausted' ? 4000 : 3000;
    state.nextBlinkAt = blinkInterval + Math.random() * 2000;
  }

  expressiveStates.set(actor.id, state);
  return state;
}

export function computeExpressiveFace(actor: Actor, expressiveState: ExpressiveState): FaceExpression {
  const emotion = actor.emotionState;
  const intensity = actor.emotionIntensity ?? 0.5;
  const base = getBaseFaceForEmotion(emotion, intensity);

  // Apply gaze wander
  base.pupilOffsetX += expressiveState.gazeWander.x;
  base.pupilOffsetY += expressiveState.gazeWander.y;
  base.pupilOffsetX = clamp(base.pupilOffsetX, -1, 1);
  base.pupilOffsetY = clamp(base.pupilOffsetY, -1, 1);

  // Apply blink
  const blinkProgress = expressiveState.blinkTimer / expressiveState.nextBlinkAt;
  if (blinkProgress > 0.95 && blinkProgress < 1.0) {
    base.blinkState = 1;
  }

  return base;
}

function getBaseFaceForEmotion(emotion: ActorEmotion, intensity: number): FaceExpression {
  switch (emotion) {
    case 'sad': return { eyeShape: 'droopy', browAngle: -0.6 * intensity, mouthCurve: 'frown', pupilOffsetX: 0, pupilOffsetY: 0.2, blinkState: 0, squint: 0, browAsymmetry: 0.1 };
    case 'happy': return { eyeShape: 'round', browAngle: 0.3 * intensity, mouthCurve: 'smile', pupilOffsetX: 0, pupilOffsetY: 0, blinkState: 0, squint: 0.1, browAsymmetry: 0 };
    case 'nervous': return { eyeShape: 'wide', browAngle: -0.3, mouthCurve: 'tight', pupilOffsetX: 0, pupilOffsetY: 0, blinkState: 0, squint: 0, browAsymmetry: 0.3 };
    case 'angry': return { eyeShape: 'narrow', browAngle: 0.8 * intensity, mouthCurve: 'grimace', pupilOffsetX: 0, pupilOffsetY: -0.1, blinkState: 0, squint: 0.4 * intensity, browAsymmetry: 0 };
    case 'exhausted': return { eyeShape: 'half_closed', browAngle: -0.2, mouthCurve: 'neutral', pupilOffsetX: 0, pupilOffsetY: 0.15, blinkState: 0, squint: 0.3, browAsymmetry: 0.15 };
    case 'excited': return { eyeShape: 'wide', browAngle: 0.5 * intensity, mouthCurve: 'open', pupilOffsetX: 0, pupilOffsetY: 0, blinkState: 0, squint: 0, browAsymmetry: 0 };
    case 'awkward': return { eyeShape: 'round', browAngle: -0.2, mouthCurve: 'crooked', pupilOffsetX: 0.2, pupilOffsetY: 0, blinkState: 0, squint: 0.1, browAsymmetry: 0.4 };
    default: return { eyeShape: 'round', browAngle: 0, mouthCurve: 'neutral', pupilOffsetX: 0, pupilOffsetY: 0, blinkState: 0, squint: 0, browAsymmetry: 0 };
  }
}

function getBreathingRate(emotion: ActorEmotion, intensity: number): number {
  switch (emotion) {
    case 'nervous': return 1.5 + intensity * 0.5;
    case 'angry': return 1.3 + intensity * 0.4;
    case 'excited': return 1.4 + intensity * 0.3;
    case 'exhausted': return 0.6;
    case 'sad': return 0.7;
    default: return 1.0;
  }
}

function getTargetHeadTilt(emotion: ActorEmotion, intensity: number): number {
  switch (emotion) {
    case 'sad': return -0.15 * intensity;
    case 'nervous': return 0.05;
    case 'awkward': return 0.1;
    case 'exhausted': return -0.2;
    default: return 0;
  }
}

function getIdleMotionIntensity(emotion: ActorEmotion, intensity: number): number {
  switch (emotion) {
    case 'nervous': return 0.6 + intensity * 0.3;
    case 'excited': return 0.5 + intensity * 0.2;
    case 'exhausted': return 0.1;
    case 'sad': return 0.15;
    default: return 0.3;
  }
}

function getStanceVariation(emotion: ActorEmotion): number {
  switch (emotion) {
    case 'nervous': return 0.3;
    case 'sad': return -0.4;
    case 'angry': return 0.5;
    case 'exhausted': return -0.6;
    case 'awkward': return 0.2;
    default: return 0;
  }
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max);
}

export function clearExpressiveStates(): void {
  expressiveStates.clear();
}
