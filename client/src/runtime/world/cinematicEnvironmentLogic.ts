import type { EnvironmentCinematicInfluence, LayoutStyle, SceneTone } from '@animaster/shared/scene';

interface EnvironmentInfluenceConfig {
  cameraDistanceMultiplier: number;
  spacingCompression: number;
  tensionBias: number;
  pacingMultiplier: number;
  verticalFramingBias: number;
}

const LOCATION_INFLUENCE: Record<string, EnvironmentInfluenceConfig> = {
  subway: {
    cameraDistanceMultiplier: 0.8,
    spacingCompression: 1.3,
    tensionBias: 0.2,
    pacingMultiplier: 0.9,
    verticalFramingBias: -0.1,
  },
  alley: {
    cameraDistanceMultiplier: 0.75,
    spacingCompression: 1.4,
    tensionBias: 0.3,
    pacingMultiplier: 0.85,
    verticalFramingBias: 0.1,
  },
  rooftop: {
    cameraDistanceMultiplier: 1.4,
    spacingCompression: 0.6,
    tensionBias: 0.1,
    pacingMultiplier: 0.8,
    verticalFramingBias: 0.3,
  },
  forest: {
    cameraDistanceMultiplier: 1.0,
    spacingCompression: 0.9,
    tensionBias: 0.1,
    pacingMultiplier: 0.7,
    verticalFramingBias: 0.2,
  },
  beach: {
    cameraDistanceMultiplier: 1.5,
    spacingCompression: 0.5,
    tensionBias: 0.0,
    pacingMultiplier: 0.6,
    verticalFramingBias: -0.1,
  },
  apartment: {
    cameraDistanceMultiplier: 0.85,
    spacingCompression: 1.1,
    tensionBias: 0.05,
    pacingMultiplier: 1.0,
    verticalFramingBias: 0.0,
  },
  hallway: {
    cameraDistanceMultiplier: 0.7,
    spacingCompression: 1.5,
    tensionBias: 0.25,
    pacingMultiplier: 0.9,
    verticalFramingBias: 0.0,
  },
  hospital: {
    cameraDistanceMultiplier: 0.9,
    spacingCompression: 1.2,
    tensionBias: 0.15,
    pacingMultiplier: 0.85,
    verticalFramingBias: 0.0,
  },
  parking_garage: {
    cameraDistanceMultiplier: 0.85,
    spacingCompression: 1.3,
    tensionBias: 0.3,
    pacingMultiplier: 0.8,
    verticalFramingBias: -0.1,
  },
  diner: {
    cameraDistanceMultiplier: 0.8,
    spacingCompression: 1.2,
    tensionBias: 0.05,
    pacingMultiplier: 1.0,
    verticalFramingBias: 0.0,
  },
  office: {
    cameraDistanceMultiplier: 0.9,
    spacingCompression: 1.1,
    tensionBias: 0.1,
    pacingMultiplier: 1.0,
    verticalFramingBias: 0.0,
  },
  warehouse: {
    cameraDistanceMultiplier: 1.2,
    spacingCompression: 0.8,
    tensionBias: 0.2,
    pacingMultiplier: 0.75,
    verticalFramingBias: 0.15,
  },
  indoor_room: {
    cameraDistanceMultiplier: 0.9,
    spacingCompression: 1.0,
    tensionBias: 0.0,
    pacingMultiplier: 1.0,
    verticalFramingBias: 0.0,
  },
  outdoor_street: {
    cameraDistanceMultiplier: 1.1,
    spacingCompression: 0.8,
    tensionBias: 0.1,
    pacingMultiplier: 1.0,
    verticalFramingBias: 0.0,
  },
  outdoor_park: {
    cameraDistanceMultiplier: 1.3,
    spacingCompression: 0.6,
    tensionBias: 0.0,
    pacingMultiplier: 0.8,
    verticalFramingBias: 0.1,
  },
  outdoor_beach: {
    cameraDistanceMultiplier: 1.5,
    spacingCompression: 0.5,
    tensionBias: 0.0,
    pacingMultiplier: 0.6,
    verticalFramingBias: -0.1,
  },
  outdoor_forest: {
    cameraDistanceMultiplier: 1.0,
    spacingCompression: 0.9,
    tensionBias: 0.1,
    pacingMultiplier: 0.7,
    verticalFramingBias: 0.2,
  },
  staircase: {
    cameraDistanceMultiplier: 0.75,
    spacingCompression: 1.4,
    tensionBias: 0.2,
    pacingMultiplier: 0.85,
    verticalFramingBias: 0.3,
  },
};

const TONE_INFLUENCE_MODIFIERS: Record<string, Partial<EnvironmentInfluenceConfig>> = {
  lonely: { cameraDistanceMultiplier: 1.2, spacingCompression: 0.7 },
  tense: { cameraDistanceMultiplier: 0.85, spacingCompression: 1.3, tensionBias: 0.2 },
  sad: { pacingMultiplier: 0.7 },
  romantic: { cameraDistanceMultiplier: 0.8, spacingCompression: 1.1 },
  threatening: { cameraDistanceMultiplier: 0.8, tensionBias: 0.3, spacingCompression: 1.2 },
  energetic: { pacingMultiplier: 1.3 },
  awkward: { pacingMultiplier: 0.9 },
};

const LAYOUT_MODIFIERS: Record<string, Partial<EnvironmentInfluenceConfig>> = {
  long_corridor: { cameraDistanceMultiplier: 0.85, spacingCompression: 1.3 },
  open_space: { cameraDistanceMultiplier: 1.2, spacingCompression: 0.7 },
  enclosed_room: { cameraDistanceMultiplier: 0.9, spacingCompression: 1.1 },
  split_level: { verticalFramingBias: 0.2 },
  circular: { cameraDistanceMultiplier: 1.0 },
  asymmetric: { spacingCompression: 1.1 },
};

export function resolveEnvironmentInfluence(
  locationType: string,
  tone: SceneTone,
  layoutStyle: LayoutStyle,
): EnvironmentCinematicInfluence {
  const base = LOCATION_INFLUENCE[locationType] ?? LOCATION_INFLUENCE.indoor_room;
  const toneModifiers = TONE_INFLUENCE_MODIFIERS[tone] ?? {};
  const layoutModifiers = LAYOUT_MODIFIERS[layoutStyle] ?? {};

  return {
    cameraDistanceMultiplier:
      base.cameraDistanceMultiplier *
      (toneModifiers.cameraDistanceMultiplier ?? 1) *
      (layoutModifiers.cameraDistanceMultiplier ?? 1),
    spacingCompression:
      base.spacingCompression *
      (toneModifiers.spacingCompression ?? 1) *
      (layoutModifiers.spacingCompression ?? 1),
    tensionBias:
      Math.min(1, base.tensionBias + (toneModifiers.tensionBias ?? 0)),
    pacingMultiplier:
      base.pacingMultiplier * (toneModifiers.pacingMultiplier ?? 1),
    verticalFramingBias:
      base.verticalFramingBias + (layoutModifiers.verticalFramingBias ?? 0),
  };
}
