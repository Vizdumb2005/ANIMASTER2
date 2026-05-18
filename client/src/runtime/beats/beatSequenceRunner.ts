import type { BeatSequence, EmotionalBeat } from '@animaster/shared/scene';

export interface BeatRunnerOutput {
  updatedSequence: BeatSequence;
  activeBeat: EmotionalBeat | null;
  beatProgress: number;
}

export function advanceBeatSequence(sequence: BeatSequence, deltaMs: number): BeatRunnerOutput {
  if (sequence.completed && !sequence.looping) {
    return { updatedSequence: sequence, activeBeat: null, beatProgress: 1 };
  }

  const updated = { ...sequence, beats: sequence.beats.map((b) => ({ ...b })) };
  updated.totalElapsedMs += deltaMs;

  if (updated.currentIndex >= updated.beats.length) {
    if (updated.looping) {
      updated.currentIndex = 0;
      for (const b of updated.beats) {
        b.elapsedMs = 0;
      }
    } else {
      updated.completed = true;
      return { updatedSequence: updated, activeBeat: null, beatProgress: 1 };
    }
  }

  const beat = updated.beats[updated.currentIndex];
  beat.elapsedMs += deltaMs;

  const progress = Math.min(beat.elapsedMs / Math.max(1, beat.durationMs), 1);

  if (beat.elapsedMs >= beat.durationMs) {
    updated.currentIndex += 1;
  }

  return { updatedSequence: updated, activeBeat: beat, beatProgress: progress };
}
