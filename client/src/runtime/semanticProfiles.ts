import type { CameraMode, SceneGraph, SceneTone } from '@animaster/shared/scene';
import { getTempoMultiplier } from './rhythm/rhythmEvaluator';

export interface ToneRuntimeProfile {
  tone: SceneTone;
  cameraMode: CameraMode;
  spacingMultiplier: number;
  motionEnergyScale: number;
  pauseScale: number;
  gestureEnergy: number;
  preferredRelationshipDistance: number;
  lightingTint: string | null;
  negativeSpace: number;
}

export interface RhythmRuntimeProfile {
  tempoMultiplier: number;
  pauseFrequencyPerMinute: number;
  cameraSmoothing: number;
  actingFrequencyScale: number;
  motionEnergyScale: number;
}

const toneDefaults: Record<SceneTone, Omit<ToneRuntimeProfile, 'tone'>> = {
  neutral: { cameraMode: 'static', spacingMultiplier: 1, motionEnergyScale: 1, pauseScale: 1, gestureEnergy: 1, preferredRelationshipDistance: 180, lightingTint: null, negativeSpace: 1 },
  sad: { cameraMode: 'wide_shot', spacingMultiplier: 1.45, motionEnergyScale: 0.55, pauseScale: 1.55, gestureEnergy: 0.65, preferredRelationshipDistance: 230, lightingTint: 'cold', negativeSpace: 1.35 },
  tense: { cameraMode: 'tension', spacingMultiplier: 0.72, motionEnergyScale: 1.15, pauseScale: 0.75, gestureEnergy: 0.85, preferredRelationshipDistance: 130, lightingTint: 'cold', negativeSpace: 0.7 },
  lonely: { cameraMode: 'wide_shot', spacingMultiplier: 1.9, motionEnergyScale: 0.5, pauseScale: 1.8, gestureEnergy: 0.45, preferredRelationshipDistance: 320, lightingTint: 'cold', negativeSpace: 1.8 },
  awkward: { cameraMode: 'over_the_shoulder', spacingMultiplier: 1.15, motionEnergyScale: 0.75, pauseScale: 1.35, gestureEnergy: 0.55, preferredRelationshipDistance: 210, lightingTint: null, negativeSpace: 1.15 },
  energetic: { cameraMode: 'follow', spacingMultiplier: 0.85, motionEnergyScale: 1.55, pauseScale: 0.45, gestureEnergy: 1.5, preferredRelationshipDistance: 150, lightingTint: 'warm', negativeSpace: 0.8 },
  romantic: { cameraMode: 'close_up', spacingMultiplier: 0.65, motionEnergyScale: 0.7, pauseScale: 1.25, gestureEnergy: 0.75, preferredRelationshipDistance: 110, lightingTint: 'warm', negativeSpace: 0.75 },
  threatening: { cameraMode: 'dramatic_zoom', spacingMultiplier: 0.55, motionEnergyScale: 0.9, pauseScale: 0.9, gestureEnergy: 0.7, preferredRelationshipDistance: 95, lightingTint: 'cold', negativeSpace: 0.6 }
};

export function getToneRuntimeProfile(scene: SceneGraph): ToneRuntimeProfile {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const base = toneDefaults[tone] ?? toneDefaults.neutral;
  const template = scene.cinematicGrammar?.template;
  return {
    tone,
    ...base,
    cameraMode: template?.cameraMode ?? base.cameraMode,
    spacingMultiplier: template?.spacingMultiplier ?? base.spacingMultiplier,
    motionEnergyScale: template?.motionEnergyScale ?? base.motionEnergyScale
  };
}

export function getRhythmRuntimeProfile(scene: SceneGraph): RhythmRuntimeProfile {
  const rhythm = scene.rhythm ?? { tempo: 'medium', pauseFrequencyPerMinute: 4, motionEnergyCurve: 'linear' as const };
  const tempoMultiplier = getTempoMultiplier(rhythm);
  return {
    tempoMultiplier,
    pauseFrequencyPerMinute: rhythm.pauseFrequencyPerMinute,
    cameraSmoothing: rhythm.tempo === 'slow' ? 0.035 : rhythm.tempo === 'fast' ? 0.12 : 0.07,
    actingFrequencyScale: rhythm.tempo === 'slow' ? 0.65 : rhythm.tempo === 'fast' ? 1.4 : 1,
    motionEnergyScale: tempoMultiplier
  };
}
