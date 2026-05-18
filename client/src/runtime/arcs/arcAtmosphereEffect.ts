import type { AtmosphereProfile, ArcPhase } from '@animaster/shared/scene';

const baseAmbientCache = new Map<string, number>();

export function applyArcAtmosphereShift(atmosphere: AtmosphereProfile, phase: ArcPhase, progress: number): AtmosphereProfile {
  if (!phase.atmosphereShift) return atmosphere;

  const updated = { ...atmosphere };
  const shift = phase.atmosphereShift;

  if (shift.lightingTint && progress > 0.4) {
    updated.lightingTint = shift.lightingTint;
  }

  if (shift.ambientDelta !== undefined) {
    const cacheKey = phase.name;
    if (!baseAmbientCache.has(cacheKey)) {
      baseAmbientCache.set(cacheKey, atmosphere.ambientIntensity);
    }
    const baseIntensity = baseAmbientCache.get(cacheKey)!;
    updated.ambientIntensity = Math.max(0.2, Math.min(1.5, baseIntensity + shift.ambientDelta * progress * 0.3));
  }

  return updated;
}

export function resetArcAtmosphereCache(): void {
  baseAmbientCache.clear();
}
