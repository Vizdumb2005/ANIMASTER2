import type { Actor, ArcPhase } from '@animaster/shared/scene';

export function applyArcEmotionTransition(actor: Actor, phase: ArcPhase, progress: number): Actor {
  if (progress > 0.3 && actor.emotionState !== phase.targetEmotion) {
    actor.emotionState = phase.targetEmotion;
  }
  const baseIntensity = actor.emotionIntensity ?? 0.5;
  actor.emotionIntensity = baseIntensity + (phase.targetIntensity - baseIntensity) * Math.min(progress * 1.5, 1);
  return actor;
}
