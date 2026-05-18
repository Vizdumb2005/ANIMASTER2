import type { AtmosphereProfile, ArcPhase } from '@animaster/shared/scene';

export function applyArcAtmosphereShift(atmosphere: AtmosphereProfile, phase: ArcPhase, progress: number): AtmosphereProfile {
  if (!phase.atmosphereShift) return atmosphere;

  const updated = { ...atmosphere };
  const shift = phase.atmosphereShift;

  if (shift.lightingTint && progress > 0.4) {
    updated.lightingTint = shift.lightingTint;
  }

  if (shift.ambientDelta !== undefined) {
    updated.ambientIntensity = Math.max(0.2, Math.min(1.5, updated.ambientIntensity + shift.ambientDelta * progress * 0.3));
  }

  return updated;
}
