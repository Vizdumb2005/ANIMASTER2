import { Container, Graphics } from 'pixi.js';
import type { Actor, ActorEmotion, FaceExpression, Vector2 } from '@animaster/shared/scene';

// --- Task 203: Emotion-to-Face Mapping ---

const EMOTION_FACES: Record<ActorEmotion, Omit<FaceExpression, 'pupilOffsetX' | 'pupilOffsetY' | 'blinkState'>> = {
  neutral: {
    eyeShape: 'round',
    browAngle: 0,
    mouthCurve: 'neutral',
    squint: 0,
    browAsymmetry: 0,
  },
  sad: {
    eyeShape: 'droopy',
    browAngle: -0.6,
    mouthCurve: 'frown',
    squint: 0.1,
    browAsymmetry: 0,
  },
  happy: {
    eyeShape: 'round',
    browAngle: 0.2,
    mouthCurve: 'smile',
    squint: 0.2,
    browAsymmetry: 0,
  },
  nervous: {
    eyeShape: 'wide',
    browAngle: -0.3,
    mouthCurve: 'tight',
    squint: 0,
    browAsymmetry: 0.4,
  },
  angry: {
    eyeShape: 'narrow',
    browAngle: 0.8,
    mouthCurve: 'grimace',
    squint: 0.3,
    browAsymmetry: 0,
  },
  exhausted: {
    eyeShape: 'half_closed',
    browAngle: -0.2,
    mouthCurve: 'neutral',
    squint: 0.5,
    browAsymmetry: 0.2,
  },
  awkward: {
    eyeShape: 'round',
    browAngle: -0.15,
    mouthCurve: 'crooked',
    squint: 0.1,
    browAsymmetry: 0.6,
  },
  excited: {
    eyeShape: 'wide',
    browAngle: 0.4,
    mouthCurve: 'open',
    squint: 0,
    browAsymmetry: 0,
  },
};

// --- Task 204: Blink System ---

const BLINK_DURATION_MS = 150;
const BLINK_MIN_INTERVAL = 2500;
const BLINK_MAX_INTERVAL = 6000;

interface BlinkState {
  nextBlinkAt: number;
  blinkProgress: number; // 0 = not blinking, >0 = in blink
  isBlinking: boolean;
}

const actorBlinkStates = new Map<string, BlinkState>();

function getBlinkState(actorId: string, emotion: ActorEmotion): BlinkState {
  let state = actorBlinkStates.get(actorId);
  if (!state) {
    const interval = BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL);
    state = { nextBlinkAt: interval, blinkProgress: 0, isBlinking: false };
    actorBlinkStates.set(actorId, state);
  }
  return state;
}

function updateBlink(state: BlinkState, dt: number, emotion: ActorEmotion): number {
  if (state.isBlinking) {
    state.blinkProgress += dt;
    if (state.blinkProgress >= BLINK_DURATION_MS) {
      state.isBlinking = false;
      state.blinkProgress = 0;
      const nervousMultiplier = emotion === 'nervous' ? 0.5 : 1;
      state.nextBlinkAt = (BLINK_MIN_INTERVAL + Math.random() * (BLINK_MAX_INTERVAL - BLINK_MIN_INTERVAL)) * nervousMultiplier;
    }
    // Blink curve: 0→1→0 over duration
    const t = state.blinkProgress / BLINK_DURATION_MS;
    return t < 0.5 ? t * 2 : (1 - t) * 2;
  }

  state.nextBlinkAt -= dt;
  if (state.nextBlinkAt <= 0) {
    state.isBlinking = true;
    state.blinkProgress = 0;
  }
  return 0;
}

// --- Task 205: Gaze Direction System ---

function computeGazeOffset(
  actor: Actor,
  gazeTargetPos: Vector2 | null,
  emotion: ActorEmotion,
  elapsedMs: number
): { x: number; y: number } {
  // Nervous actors have jittery gaze
  if (emotion === 'nervous') {
    const jitterX = Math.sin(elapsedMs * 0.008) * 0.3 + Math.sin(elapsedMs * 0.013) * 0.15;
    const jitterY = Math.cos(elapsedMs * 0.006) * 0.15;
    return { x: jitterX, y: jitterY };
  }

  // Lonely/sad actors look down
  if (emotion === 'sad') {
    return { x: 0, y: 0.4 };
  }

  // Awkward actors avert gaze
  if (emotion === 'awkward') {
    const aversionX = Math.sin(elapsedMs * 0.002) > 0 ? -0.5 : 0.3;
    return { x: aversionX, y: 0.2 };
  }

  // Exhausted actors look down
  if (emotion === 'exhausted') {
    return { x: 0, y: 0.5 };
  }

  // If there's a gaze target, look toward it
  if (gazeTargetPos) {
    const dx = gazeTargetPos.x - actor.position.x;
    const dy = gazeTargetPos.y - actor.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy) || 1;
    return {
      x: Math.max(-1, Math.min(1, dx / dist * 1.5)),
      y: Math.max(-1, Math.min(1, dy / dist * 0.8)),
    };
  }

  return { x: 0, y: 0 };
}

// --- Task 202 + 206: Face Renderer + Integration ---

export function drawFace(
  layer: Container,
  actor: Actor,
  gazeTargetPos: Vector2 | null,
  deltaMs: number,
  elapsedMs: number
): void {
  const headPos = actor.joints.head;
  const headRadius = 16;
  const emotion = actor.emotionState;
  const faceProfile = EMOTION_FACES[emotion] ?? EMOTION_FACES.neutral;

  // Blink
  const blinkState = getBlinkState(actor.id, emotion);
  const blinkAmount = updateBlink(blinkState, deltaMs, emotion);

  // Gaze
  const gaze = computeGazeOffset(actor, gazeTargetPos, emotion, elapsedMs);

  const g = new Graphics();

  // --- Eyes ---
  const eyeSpacing = 5.5;
  const eyeY = headPos.y - 2;
  const leftEyeX = headPos.x - eyeSpacing;
  const rightEyeX = headPos.x + eyeSpacing;

  drawEye(g, leftEyeX, eyeY, faceProfile.eyeShape, faceProfile.squint, blinkAmount, gaze, false, faceProfile.browAsymmetry > 0.3);
  drawEye(g, rightEyeX, eyeY, faceProfile.eyeShape, faceProfile.squint, blinkAmount, gaze, true, false);

  // --- Eyebrows ---
  const browY = eyeY - 5;
  const browLen = 4;
  const browAngle = faceProfile.browAngle;
  const browAsym = faceProfile.browAsymmetry;

  // Left brow
  const leftBrowStartY = browY + browAngle * 2 * (1 + browAsym);
  const leftBrowEndY = browY - browAngle * 1;
  g.moveTo(leftEyeX - browLen, leftBrowStartY);
  g.lineTo(leftEyeX + browLen, leftBrowEndY);
  g.stroke({ color: 0x2a2228, width: 1.5, alpha: 0.7 });

  // Right brow (possibly asymmetric)
  const rightBrowStartY = browY - browAngle * 1;
  const rightBrowEndY = browY + browAngle * 2;
  g.moveTo(rightEyeX - browLen, rightBrowStartY);
  g.lineTo(rightEyeX + browLen, rightBrowEndY);
  g.stroke({ color: 0x2a2228, width: 1.5, alpha: 0.7 });

  // --- Mouth ---
  drawMouth(g, headPos.x, headPos.y + 5, faceProfile.mouthCurve);

  layer.addChild(g);
}

function drawEye(
  g: Graphics,
  cx: number,
  cy: number,
  shape: FaceExpression['eyeShape'],
  squint: number,
  blinkAmount: number,
  gaze: { x: number; y: number },
  isRight: boolean,
  asymmetricShrink: boolean
): void {
  // Eye dimensions based on shape
  let eyeW = 3.2;
  let eyeH = 3.2;

  switch (shape) {
    case 'wide':
      eyeW = 3.8;
      eyeH = 4;
      break;
    case 'narrow':
      eyeW = 3.5;
      eyeH = 2;
      break;
    case 'droopy':
      eyeH = 2.8;
      break;
    case 'half_closed':
      eyeH = 1.8;
      break;
    case 'squint':
      eyeH = 1.5;
      break;
  }

  if (asymmetricShrink) {
    eyeH *= 0.7;
  }

  // Apply squint
  eyeH *= (1 - squint * 0.5);

  // Apply blink (close eyes)
  const effectiveEyeH = eyeH * (1 - blinkAmount);

  if (effectiveEyeH < 0.5) {
    // Eye is closed — draw a line
    g.moveTo(cx - eyeW, cy);
    g.lineTo(cx + eyeW, cy);
    g.stroke({ color: 0x1a1520, width: 1, alpha: 0.8 });
    return;
  }

  // Eye white (slightly tinted)
  g.ellipse(cx, cy, eyeW, effectiveEyeH).fill({ color: 0xf5f0e8, alpha: 0.9 });
  g.ellipse(cx, cy, eyeW, effectiveEyeH).stroke({ color: 0x2a2228, width: 0.8, alpha: 0.5 });

  // Pupil
  const pupilR = Math.min(eyeW, effectiveEyeH) * 0.55;
  const pupilX = cx + gaze.x * (eyeW - pupilR) * 0.7;
  const pupilY = cy + gaze.y * (effectiveEyeH - pupilR) * 0.5;
  g.circle(pupilX, pupilY, pupilR).fill({ color: 0x1a1520, alpha: 0.95 });

  // Pupil highlight
  const highlightR = pupilR * 0.3;
  g.circle(pupilX - highlightR * 0.5, pupilY - highlightR * 0.5, highlightR).fill({ color: 0xffffff, alpha: 0.7 });
}

function drawMouth(
  g: Graphics,
  cx: number,
  cy: number,
  shape: FaceExpression['mouthCurve']
): void {
  const mouthW = 4;

  switch (shape) {
    case 'smile': {
      g.moveTo(cx - mouthW, cy);
      g.quadraticCurveTo(cx, cy + 3.5, cx + mouthW, cy);
      g.stroke({ color: 0x2a2228, width: 1.2, alpha: 0.6 });
      break;
    }
    case 'frown': {
      g.moveTo(cx - mouthW, cy + 1.5);
      g.quadraticCurveTo(cx, cy - 2, cx + mouthW, cy + 1.5);
      g.stroke({ color: 0x2a2228, width: 1.2, alpha: 0.6 });
      break;
    }
    case 'tight': {
      g.moveTo(cx - mouthW * 0.6, cy);
      g.lineTo(cx + mouthW * 0.6, cy);
      g.stroke({ color: 0x2a2228, width: 1.5, alpha: 0.7 });
      break;
    }
    case 'grimace': {
      g.moveTo(cx - mouthW, cy);
      g.quadraticCurveTo(cx - 2, cy + 1.5, cx, cy);
      g.quadraticCurveTo(cx + 2, cy - 1.5, cx + mouthW, cy);
      g.stroke({ color: 0x2a2228, width: 1.3, alpha: 0.65 });
      break;
    }
    case 'open': {
      g.ellipse(cx, cy + 1, mouthW * 0.6, 2.5).fill({ color: 0x2a1a18, alpha: 0.5 });
      g.ellipse(cx, cy + 1, mouthW * 0.6, 2.5).stroke({ color: 0x2a2228, width: 0.8, alpha: 0.5 });
      break;
    }
    case 'crooked': {
      g.moveTo(cx - mouthW, cy + 0.5);
      g.quadraticCurveTo(cx - 1, cy - 1.5, cx, cy);
      g.quadraticCurveTo(cx + 2, cy + 2, cx + mouthW, cy - 0.5);
      g.stroke({ color: 0x2a2228, width: 1.2, alpha: 0.6 });
      break;
    }
    default: {
      // neutral — slight line
      g.moveTo(cx - mouthW * 0.7, cy);
      g.lineTo(cx + mouthW * 0.7, cy);
      g.stroke({ color: 0x2a2228, width: 1, alpha: 0.45 });
      break;
    }
  }
}
