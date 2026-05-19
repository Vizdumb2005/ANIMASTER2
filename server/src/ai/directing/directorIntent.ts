export type DirectorIntentKey =
  | 'emotionalIntensity'
  | 'visualDensity'
  | 'environmentalRichness'
  | 'symbolicAbstraction'
  | 'dialogueNaturalism'
  | 'cinematicRealism'
  | 'cameraAggression'
  | 'atmosphereWeight'
  | 'directorialIntensity';

export type DirectorIntent = Partial<Record<DirectorIntentKey, number>>;

export type DirectorIntentAdjustments = {
  motionEnergyScale: number;
  pauseFrequency: number;
  spacingMultiplier: number;
  contrastBoost: number;
  headroom: number;
  cameraZoom: number;
  ambientIntensity: number;
  lightingTint: string;
};

const DIRECTOR_INTENT_KEYS: DirectorIntentKey[] = [
  'emotionalIntensity',
  'visualDensity',
  'environmentalRichness',
  'symbolicAbstraction',
  'dialogueNaturalism',
  'cinematicRealism',
  'cameraAggression',
  'atmosphereWeight',
  'directorialIntensity'
];

const DEFAULT_DIRECTOR_INTENT: Record<DirectorIntentKey, number> = {
  emotionalIntensity: 0.5,
  visualDensity: 0.5,
  environmentalRichness: 0.5,
  symbolicAbstraction: 0.3,
  dialogueNaturalism: 0.6,
  cinematicRealism: 0.5,
  cameraAggression: 0.3,
  atmosphereWeight: 0.5,
  directorialIntensity: 0.5
};

function clampNumber(value: number, min: number, max: number) {
  if (Number.isNaN(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function normalizeDirectorIntent(intent?: DirectorIntent) {
  const normalized = { ...DEFAULT_DIRECTOR_INTENT };
  if (!intent) return normalized;

  for (const key of DIRECTOR_INTENT_KEYS) {
    const raw = intent[key];
    if (typeof raw === 'number') {
      normalized[key] = clampNumber(raw, 0, 1);
    }
  }

  return normalized;
}

function hasMeaningfulOverrides(intent?: DirectorIntent) {
  if (!intent) return false;
  return DIRECTOR_INTENT_KEYS.some((key) => {
    const raw = intent[key];
    if (typeof raw !== 'number') return false;
    return Math.abs(raw - DEFAULT_DIRECTOR_INTENT[key]) > 0.02;
  });
}

export function getDirectorIntentAdjustments(intent?: DirectorIntent): DirectorIntentAdjustments | null {
  if (!hasMeaningfulOverrides(intent)) return null;

  const normalized = normalizeDirectorIntent(intent);
  const emotionalIntensity = normalized.emotionalIntensity;
  const visualDensity = normalized.visualDensity;
  const environmentalRichness = normalized.environmentalRichness;
  const cameraAggression = normalized.cameraAggression;
  const atmosphereWeight = normalized.atmosphereWeight;
  const directorialIntensity = normalized.directorialIntensity;

  const motionFromEmotion = 0.3 + emotionalIntensity * 1.2;
  const motionFromDirector = 0.4 + directorialIntensity * 1.1;
  const motionEnergyScale = clampNumber((motionFromEmotion + motionFromDirector) / 2, 0.2, 2.0);
  const pauseFrequency = Math.round(clampNumber(12 - emotionalIntensity * 10, 2, 12));
  const spacingMultiplier = clampNumber(1.2 - cameraAggression * 0.6, 0.4, 2.0);
  const contrastBoost = clampNumber(environmentalRichness * 0.8, 0, 1);
  const headroom = clampNumber(1.4 - directorialIntensity * 0.8, 0.4, 2.0);
  const cameraZoom = clampNumber(0.8 + cameraAggression * 0.6, 0.6, 1.6);

  const densityIntensity = 0.3 + (1 - visualDensity) * 0.7;
  const atmosphereIntensity = 1.0 - atmosphereWeight * 0.6;
  const ambientIntensity = clampNumber((densityIntensity + atmosphereIntensity) / 2, 0.2, 1.2);

  const lightingTint = atmosphereWeight > 0.6
    ? 'cold'
    : atmosphereWeight < 0.3
      ? 'warm'
      : 'rgba(0,0,0,0)';

  return {
    motionEnergyScale,
    pauseFrequency,
    spacingMultiplier,
    contrastBoost,
    headroom,
    cameraZoom,
    ambientIntensity,
    lightingTint
  };
}
