// Phase 7 — Task Group 3: Dialogue Agent

import type { CinematicIntent } from '../compiler/intentCompiler.js';

export interface DialoguePlan {
  lines: Array<{
    actorIndex: number;
    delivery: 'whisper' | 'measured' | 'sharp' | 'trembling' | 'flat' | 'urgent' | 'quiet';
    pauseAfterMs: number;
    emotionDuring: string;
  }>;
  silenceBeats: number[];
  pacing: 'slow' | 'medium' | 'fast';
  overallEnergy: number;
  reasoning: string;
}

export function planDialogue(intent: CinematicIntent, actorCount: number): DialoguePlan {
  const pacing = intent.pacingStyle === 'frantic' ? 'fast' as const
    : intent.pacingStyle === 'slow_heavy' ? 'slow' as const
    : 'medium' as const;

  const delivery = intent.threatLevel > 0.5 ? 'sharp' as const
    : intent.emotionalPressure > 0.7 ? 'trembling' as const
    : intent.intimacyLevel > 0.6 ? 'whisper' as const
    : intent.tensionLevel > 0.5 ? 'urgent' as const
    : intent.visualIsolation > 0.6 ? 'quiet' as const
    : 'measured' as const;

  const emotionDuring = intent.threatLevel > 0.5 ? 'angry'
    : intent.emotionalPressure > 0.7 ? 'sad'
    : intent.tensionLevel > 0.6 ? 'nervous'
    : 'neutral';

  const basePause = pacing === 'slow' ? 1500 : pacing === 'fast' ? 400 : 800;

  const lines = Array.from({ length: actorCount }, (_, i) => ({
    actorIndex: i,
    delivery,
    pauseAfterMs: basePause + (i % 2 === 0 ? 200 : -100),
    emotionDuring
  }));

  const silenceBeats: number[] = [];
  if (intent.emotionalPressure > 0.5) {
    silenceBeats.push(2000, 5000);
  }
  if (intent.tensionLevel > 0.6) {
    silenceBeats.push(3000);
  }

  const reasons: string[] = [];
  if (delivery === 'trembling') reasons.push('emotional pressure creates trembling delivery');
  if (delivery === 'sharp') reasons.push('threat level demands sharp delivery');
  if (silenceBeats.length > 0) reasons.push('meaningful silences for dramatic weight');
  if (pacing === 'slow') reasons.push('slow pacing for emotional scenes');

  return {
    lines,
    silenceBeats,
    pacing,
    overallEnergy: intent.dialogueEnergy,
    reasoning: reasons.join('; ') || 'standard dialogue pacing'
  };
}
