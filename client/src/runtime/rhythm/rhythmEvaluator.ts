import type { SceneRhythm } from '@animaster/shared/scene';

const TEMPO_MULTIPLIERS: Record<string, number> = {
  slow: 0.6,
  medium: 1.0,
  fast: 1.5
};

export function getTempoMultiplier(rhythm: SceneRhythm): number {
  return TEMPO_MULTIPLIERS[rhythm.tempo] ?? 1.0;
}

export function shouldPauseThisTick(rhythm: SceneRhythm, elapsedMs: number): boolean {
  if (rhythm.pauseFrequencyPerMinute <= 0) return false;
  const intervalMs = 60000 / rhythm.pauseFrequencyPerMinute;
  const tickInInterval = elapsedMs % intervalMs;
  return tickInInterval < 500;
}

export function applyEnergyCurve(rhythm: SceneRhythm, t: number): number {
  const clamped = Math.max(0, Math.min(1, t));
  switch (rhythm.motionEnergyCurve) {
    case 'ease-in':
      return clamped * clamped;
    case 'ease-out':
      return 1 - (1 - clamped) * (1 - clamped);
    case 'sharp':
      return clamped < 0.5 ? 0 : 1;
    case 'linear':
    default:
      return clamped;
  }
}
