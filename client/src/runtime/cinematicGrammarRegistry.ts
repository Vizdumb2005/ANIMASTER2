import type { CinematicTemplate, SceneTone } from '@animaster/shared/scene';

const templates: Record<SceneTone, CinematicTemplate> = {
  neutral: {
    cameraMode: 'static',
    spacingMultiplier: 1.0,
    motionEnergyScale: 1.0,
    pauseFrequency: 4,
    contrastBoost: 0.0,
    headroom: 1.0
  },
  sad: {
    cameraMode: 'wide_shot',
    spacingMultiplier: 1.4,
    motionEnergyScale: 0.5,
    pauseFrequency: 10,
    contrastBoost: 0.1,
    headroom: 1.2
  },
  tense: {
    cameraMode: 'close_up',
    spacingMultiplier: 0.7,
    motionEnergyScale: 1.2,
    pauseFrequency: 2,
    contrastBoost: 0.5,
    headroom: 0.7
  },
  lonely: {
    cameraMode: 'wide_shot',
    spacingMultiplier: 1.8,
    motionEnergyScale: 0.6,
    pauseFrequency: 8,
    contrastBoost: 0.2,
    headroom: 1.4
  },
  awkward: {
    cameraMode: 'over_the_shoulder',
    spacingMultiplier: 1.1,
    motionEnergyScale: 0.8,
    pauseFrequency: 6,
    contrastBoost: 0.0,
    headroom: 1.0
  },
  energetic: {
    cameraMode: 'follow',
    spacingMultiplier: 0.8,
    motionEnergyScale: 1.5,
    pauseFrequency: 1,
    contrastBoost: 0.1,
    headroom: 0.9
  },
  romantic: {
    cameraMode: 'close_up',
    spacingMultiplier: 0.6,
    motionEnergyScale: 0.7,
    pauseFrequency: 6,
    contrastBoost: 0.15,
    headroom: 1.1
  },
  threatening: {
    cameraMode: 'tension',
    spacingMultiplier: 0.5,
    motionEnergyScale: 1.3,
    pauseFrequency: 1,
    contrastBoost: 0.6,
    headroom: 0.6
  }
};

export function getTemplateForTone(tone: SceneTone): CinematicTemplate {
  return templates[tone] ?? templates.neutral;
}

export function getAllTones(): SceneTone[] {
  return Object.keys(templates) as SceneTone[];
}
