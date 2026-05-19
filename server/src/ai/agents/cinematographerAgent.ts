// Phase 7 — Task Group 3: Cinematographer Agent

import type { CinematicIntent } from '../compiler/intentCompiler.js';

export interface CinematographyPlan {
  framing: 'tight' | 'standard' | 'wide' | 'extreme_wide';
  cameraMode: string;
  movement: 'hold' | 'push_in' | 'pull_back' | 'drift' | 'orbit' | 'shake';
  spacingCompression: number;
  mobilityRestriction: number;
  fovBias: number;
  reasoning: string;
}

export function planCinematography(intent: CinematicIntent, actorCount: number): CinematographyPlan {
  const framing = intent.cameraAggression > 0.7 ? 'tight'
    : intent.visualIsolation > 0.6 ? 'extreme_wide'
    : intent.intimacyLevel > 0.6 ? 'tight'
    : 'standard';

  const cameraMode = intent.cameraAggression > 0.7 ? 'close_up'
    : intent.visualIsolation > 0.6 ? 'wide_shot'
    : intent.tensionLevel > 0.6 && actorCount > 1 ? 'tension'
    : intent.threatLevel > 0.5 ? 'dramatic_zoom'
    : actorCount > 1 && intent.intimacyLevel > 0.5 ? 'over_the_shoulder'
    : 'static';

  const movement = intent.cameraAggression > 0.7 ? 'push_in'
    : intent.emotionalPressure > 0.7 ? 'drift'
    : intent.tensionLevel > 0.5 ? 'push_in'
    : intent.pacingStyle === 'frantic' ? 'shake'
    : 'hold';

  const spacingCompression = intent.compositionStyle === 'compressed' ? 0.6
    : intent.compositionStyle === 'claustrophobic' ? 0.4
    : intent.compositionStyle === 'expansive' ? 1.8
    : intent.compositionStyle === 'negative_space' ? 2.0
    : 1.0;

  const mobilityRestriction = intent.blockingStyle === 'trapped' ? 0.8
    : intent.tensionLevel > 0.6 ? 0.5
    : 0.0;

  const fovBias = intent.cameraAggression > 0.6 ? -0.3
    : intent.visualIsolation > 0.6 ? 0.4
    : 0.0;

  const reasons: string[] = [];
  if (intent.emotionalPressure > 0.7) reasons.push('high emotional pressure demands closer framing');
  if (intent.visualIsolation > 0.6) reasons.push('isolation calls for wide framing with negative space');
  if (intent.tensionLevel > 0.5) reasons.push('tension requires compressed spacing and push-in camera');
  if (intent.threatLevel > 0.5) reasons.push('threat level drives dramatic camera behavior');

  return {
    framing,
    cameraMode,
    movement,
    spacingCompression,
    mobilityRestriction,
    fovBias,
    reasoning: reasons.join('; ') || 'standard cinematic framing'
  };
}
