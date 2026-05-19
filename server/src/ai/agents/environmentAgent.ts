// Phase 7 — Task Group 3: Environment Agent

import type { CinematicIntent } from '../compiler/intentCompiler.js';

export interface EnvironmentPlan {
  locationType: string;
  density: 'sparse' | 'moderate' | 'dense' | 'cluttered';
  mood: 'oppressive' | 'expansive' | 'intimate' | 'desolate' | 'claustrophobic' | 'neutral';
  lightingLanguage: string;
  compositionBias: string;
  clutterLevel: number;
  obstructionLevel: number;
  reasoning: string;
}

export function planEnvironment(intent: CinematicIntent, prompt: string): EnvironmentPlan {
  const density = intent.environmentDensity > 0.8 ? 'cluttered'
    : intent.environmentDensity > 0.5 ? 'dense'
    : intent.environmentDensity > 0.2 ? 'moderate'
    : 'sparse';

  const mood = intent.compositionStyle === 'claustrophobic' ? 'claustrophobic'
    : intent.emotionalPressure > 0.7 && intent.environmentDensity > 0.6 ? 'oppressive'
    : intent.visualIsolation > 0.6 ? 'desolate'
    : intent.intimacyLevel > 0.6 ? 'intimate'
    : intent.compositionStyle === 'expansive' ? 'expansive'
    : 'neutral';

  const lightingLanguage = intent.lightingLanguage === 'oppressive' ? 'harsh_overhead'
    : intent.lightingLanguage === 'warm_intimate' ? 'warm_practical'
    : intent.lightingLanguage === 'cold_clinical' ? 'cold_fluorescent'
    : intent.lightingLanguage === 'neon' ? 'neon_glow'
    : intent.lightingLanguage === 'dramatic' ? 'dramatic_spot'
    : intent.lightingLanguage === 'moonlit' ? 'moonlit'
    : 'natural_soft';

  const compositionBias = intent.compositionStyle === 'compressed' ? 'foreground_obstruction'
    : intent.compositionStyle === 'negative_space' ? 'negative_space'
    : intent.compositionStyle === 'expansive' ? 'depth_layering'
    : intent.compositionStyle === 'claustrophobic' ? 'foreground_obstruction'
    : 'depth_layering';

  const clutterLevel = intent.environmentDensity;
  const obstructionLevel = intent.compositionStyle === 'claustrophobic' ? 0.8
    : intent.blockingStyle === 'trapped' ? 0.7
    : intent.environmentDensity > 0.7 ? 0.5
    : 0.1;

  const locationType = inferLocation(prompt);

  const reasons: string[] = [];
  if (mood !== 'neutral') reasons.push(`${mood} mood from emotional context`);
  if (obstructionLevel > 0.5) reasons.push('obstructed composition for psychological weight');
  if (density === 'sparse') reasons.push('sparse environment for isolation');

  return {
    locationType,
    density,
    mood,
    lightingLanguage,
    compositionBias,
    clutterLevel,
    obstructionLevel,
    reasoning: reasons.join('; ') || 'standard environment setup'
  };
}

function inferLocation(prompt: string): string {
  const patterns: Array<[RegExp, string]> = [
    [/subway|metro|underground|station/i, 'subway'],
    [/alley|alleyway/i, 'alley'],
    [/rooftop|roof/i, 'rooftop'],
    [/forest|woods|jungle/i, 'forest'],
    [/beach|ocean|shore/i, 'beach'],
    [/apartment|flat|home/i, 'apartment'],
    [/hallway|corridor/i, 'hallway'],
    [/hospital|clinic|ward/i, 'hospital'],
    [/parking\s*garage|parking\s*lot|garage/i, 'parking_garage'],
    [/diner|restaurant|cafe/i, 'diner'],
    [/office|cubicle|workspace/i, 'office'],
    [/warehouse|factory|storage/i, 'warehouse'],
    [/park|garden|meadow/i, 'outdoor_park'],
    [/street|road|outside/i, 'outdoor_street'],
    [/staircase|stairs|stairwell/i, 'staircase'],
  ];

  for (const [pattern, type] of patterns) {
    if (pattern.test(prompt)) return type;
  }
  return 'indoor_room';
}
