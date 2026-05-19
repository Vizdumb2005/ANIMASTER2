// Phase 7 — Task Group 3: Lighting Agent

import type { CinematicIntent } from '../compiler/intentCompiler.js';

export interface LightingPlan {
  lightingLanguage: string;
  shadowIntensity: number;
  contrastSeparation: number;
  colorTemperature: 'warm' | 'neutral' | 'cold';
  ambientIntensity: number;
  lightingTint: string;
  dramaticSpots: number;
  reasoning: string;
}

export function planLighting(intent: CinematicIntent): LightingPlan {
  const shadowIntensity = intent.lightingLanguage === 'oppressive' ? 0.9
    : intent.lightingLanguage === 'dramatic' ? 0.8
    : intent.lightingLanguage === 'moonlit' ? 0.6
    : intent.lightingLanguage === 'cold_clinical' ? 0.3
    : intent.lightingLanguage === 'warm_intimate' ? 0.2
    : 0.4;

  const contrastSeparation = intent.tensionLevel > 0.6 ? 0.8
    : intent.threatLevel > 0.5 ? 0.7
    : intent.emotionalPressure > 0.7 ? 0.6
    : 0.4;

  const colorTemperature = intent.lightingLanguage === 'warm_intimate' ? 'warm' as const
    : intent.lightingLanguage === 'cold_clinical' ? 'cold' as const
    : intent.lightingLanguage === 'moonlit' ? 'cold' as const
    : intent.lightingLanguage === 'neon' ? 'cold' as const
    : intent.lightingLanguage === 'oppressive' ? 'cold' as const
    : 'neutral' as const;

  const ambientIntensity = intent.lightingLanguage === 'oppressive' ? 0.3
    : intent.lightingLanguage === 'moonlit' ? 0.4
    : intent.lightingLanguage === 'cold_clinical' ? 0.8
    : intent.lightingLanguage === 'warm_intimate' ? 0.7
    : 0.6;

  const lightingTint = colorTemperature === 'warm' ? 'warm'
    : colorTemperature === 'cold' ? 'cold'
    : 'rgba(0,0,0,0)';

  const lightingLanguage = intent.lightingLanguage === 'oppressive' ? 'harsh_overhead'
    : intent.lightingLanguage === 'warm_intimate' ? 'warm_practical'
    : intent.lightingLanguage === 'cold_clinical' ? 'cold_fluorescent'
    : intent.lightingLanguage === 'neon' ? 'neon_glow'
    : intent.lightingLanguage === 'dramatic' ? 'dramatic_spot'
    : intent.lightingLanguage === 'moonlit' ? 'moonlit'
    : 'natural_soft';

  const dramaticSpots = intent.lightingLanguage === 'dramatic' ? 2
    : intent.tensionLevel > 0.6 ? 1
    : 0;

  const reasons: string[] = [];
  if (shadowIntensity > 0.7) reasons.push('oppressive shadows for emotional weight');
  if (contrastSeparation > 0.6) reasons.push('reduced contrast separation for visual tension');
  if (dramaticSpots > 0) reasons.push(`${dramaticSpots} dramatic spot light(s) for focal emphasis`);

  return {
    lightingLanguage,
    shadowIntensity,
    contrastSeparation,
    colorTemperature,
    ambientIntensity,
    lightingTint,
    dramaticSpots,
    reasoning: reasons.join('; ') || 'standard lighting setup'
  };
}
