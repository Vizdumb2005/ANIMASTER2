// Phase 7 — Task Group 3: Blocking/Staging Agent

import type { CinematicIntent } from '../compiler/intentCompiler.js';

export interface BlockingPlan {
  style: string;
  spatialTension: number;
  groupDynamic: 'unified' | 'opposed' | 'scattered' | 'clustered';
  actorDirections: Array<{
    actorIndex: number;
    movement: 'constrained' | 'natural' | 'aggressive' | 'retreating' | 'frozen';
    spacing: 'close' | 'standard' | 'far';
    facingBias: number;
  }>;
  reasoning: string;
}

export function planBlocking(intent: CinematicIntent, actorCount: number): BlockingPlan {
  const style = intent.blockingStyle;

  const spatialTension = intent.tensionLevel > 0.6 ? 0.8
    : intent.blockingStyle === 'confrontational' ? 0.7
    : intent.blockingStyle === 'trapped' ? 0.9
    : intent.emotionalPressure > 0.5 ? 0.4
    : 0.2;

  const groupDynamic = actorCount <= 1 ? 'scattered'
    : intent.blockingStyle === 'confrontational' ? 'opposed'
    : intent.blockingStyle === 'intimate' ? 'clustered'
    : intent.blockingStyle === 'evasive' ? 'scattered'
    : 'unified';

  const actorDirections = Array.from({ length: actorCount }, (_, i) => {
    const movement = intent.blockingStyle === 'trapped' ? 'constrained' as const
      : intent.blockingStyle === 'confrontational' ? (i === 0 ? 'aggressive' as const : 'natural' as const)
      : intent.blockingStyle === 'evasive' ? 'retreating' as const
      : intent.tensionLevel > 0.7 ? 'frozen' as const
      : 'natural' as const;

    const spacing = intent.blockingStyle === 'intimate' ? 'close' as const
      : intent.blockingStyle === 'distant' ? 'far' as const
      : intent.compositionStyle === 'compressed' ? 'close' as const
      : 'standard' as const;

    const facingBias = intent.blockingStyle === 'confrontational' ? (i === 0 ? 1 : -1)
      : intent.blockingStyle === 'evasive' ? (i === 0 ? 0.5 : -0.5)
      : 0;

    return { actorIndex: i, movement, spacing, facingBias };
  });

  const reasons: string[] = [];
  if (style === 'trapped') reasons.push('constrained movement for psychological entrapment');
  if (style === 'confrontational') reasons.push('opposed positioning for dramatic tension');
  if (spatialTension > 0.6) reasons.push('high spatial tension compresses actor space');

  return {
    style,
    spatialTension,
    groupDynamic,
    actorDirections,
    reasoning: reasons.join('; ') || 'standard blocking'
  };
}
