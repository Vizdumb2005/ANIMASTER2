// Phase 7 — Task Group 3: Emotional Arc Agent

import type { CinematicIntent } from '../compiler/intentCompiler.js';

export interface EmotionalArcPlan {
  dominantEmotion: string;
  intensity: number;
  trajectory: 'escalating' | 'de-escalating' | 'sustained' | 'oscillating' | 'building_to_peak';
  peakMoment: number;
  recoveryRate: number;
  contagionRadius: number;
  reasoning: string;
}

export function planEmotionalArc(intent: CinematicIntent, actorCount: number): EmotionalArcPlan {
  const dominantEmotion = intent.threatLevel > 0.5 ? 'angry'
    : intent.emotionalPressure > 0.7 ? 'sad'
    : intent.tensionLevel > 0.6 ? 'nervous'
    : intent.intimacyLevel > 0.6 ? 'happy'
    : intent.visualIsolation > 0.6 ? 'sad'
    : 'neutral';

  const intensity = Math.max(intent.emotionalPressure, intent.tensionLevel, intent.threatLevel);

  const trajectory = intent.tensionLevel > 0.6 ? 'escalating'
    : intent.emotionalPressure > 0.7 && intent.pacingStyle === 'slow_heavy' ? 'building_to_peak'
    : intent.intimacyLevel > 0.5 ? 'de-escalating'
    : intensity > 0.5 ? 'sustained'
    : 'sustained';

  const peakMoment = trajectory === 'escalating' ? 0.75
    : trajectory === 'building_to_peak' ? 0.85
    : trajectory === 'de-escalating' ? 0.2
    : 0.5;

  const recoveryRate = intent.emotionalPressure > 0.7 ? 0.02
    : intent.tensionLevel > 0.5 ? 0.05
    : 0.1;

  const contagionRadius = actorCount > 1
    ? (intent.intimacyLevel > 0.5 ? 200 : intent.tensionLevel > 0.5 ? 300 : 150)
    : 0;

  const reasons: string[] = [];
  if (trajectory === 'escalating') reasons.push('tension drives escalating emotional arc');
  if (intensity > 0.7) reasons.push('high emotional pressure sustains intensity');
  if (recoveryRate < 0.05) reasons.push('slow recovery for lingering emotional weight');
  if (contagionRadius > 200) reasons.push('emotional contagion between nearby actors');

  return {
    dominantEmotion,
    intensity,
    trajectory,
    peakMoment,
    recoveryRate,
    contagionRadius,
    reasoning: reasons.join('; ') || 'neutral emotional arc'
  };
}
