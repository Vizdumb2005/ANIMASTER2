import type { DramaticBeat } from '@animaster/shared/scene';

export interface BeatEffect {
  motionMultiplier: number;
  pauseActive: boolean;
  intensityBoost: number;
}

export function evaluateBeats(beats: DramaticBeat[], deltaMs: number): { updatedBeats: DramaticBeat[]; effect: BeatEffect } {
  let motionMultiplier = 1;
  let pauseActive = false;
  let intensityBoost = 0;

  const updatedBeats: DramaticBeat[] = [];

  for (const beat of beats) {
    const updated = { ...beat, elapsedMs: beat.elapsedMs + deltaMs };

    if (updated.elapsedMs < updated.durationMs) {
      const progress = updated.elapsedMs / updated.durationMs;

      switch (updated.type) {
        case 'anticipation':
          motionMultiplier *= 0.3 + 0.7 * progress;
          intensityBoost += updated.intensity * (1 - progress);
          break;
        case 'silence':
          pauseActive = true;
          motionMultiplier *= 0.1;
          break;
        case 'tension_hold':
          motionMultiplier *= 0.5;
          intensityBoost += updated.intensity;
          break;
        case 'reaction':
          motionMultiplier *= 0.6;
          break;
        case 'release':
          motionMultiplier *= 1.2;
          break;
        case 'interruption':
          motionMultiplier *= 0.0;
          pauseActive = true;
          break;
      }

      updatedBeats.push(updated);
    }
  }

  return { updatedBeats, effect: { motionMultiplier, pauseActive, intensityBoost } };
}
