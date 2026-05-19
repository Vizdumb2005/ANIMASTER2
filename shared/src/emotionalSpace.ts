// Phase 8 — Task Group 6: Emotional Space System

export type EmotionalDimension =
  | 'intimacy'
  | 'dominance'
  | 'emotional_distance'
  | 'social_tension'
  | 'vulnerability'
  | 'isolation';

export interface EmotionalSpaceState {
  intimacy: number;         // 0 = distant, 1 = very intimate
  dominance: number;        // -1 = submissive, 0 = balanced, 1 = dominant
  emotionalDistance: number; // 0 = close, 1 = very distant
  socialTension: number;    // 0 = relaxed, 1 = maximum tension
  vulnerability: number;    // 0 = guarded, 1 = fully exposed
  isolation: number;        // 0 = connected, 1 = completely alone
}

export interface EmotionalSpaceEffect {
  spacingMultiplier: number;
  gazeAversion: number;
  postureOpenness: number;
  cameraZoomBias: number;
  framingAsymmetry: number;
  lightingWarmth: number;
  motionEnergy: number;
}

export function createDefaultEmotionalSpace(): EmotionalSpaceState {
  return {
    intimacy: 0.3,
    dominance: 0,
    emotionalDistance: 0.5,
    socialTension: 0.2,
    vulnerability: 0.3,
    isolation: 0.3,
  };
}

export function computeEmotionalSpaceEffect(state: EmotionalSpaceState): EmotionalSpaceEffect {
  const spacingMultiplier = 0.5 + state.emotionalDistance * 1.5 + state.isolation * 0.5 - state.intimacy * 0.4;
  const gazeAversion = state.emotionalDistance * 0.6 + state.isolation * 0.3 - state.intimacy * 0.3;
  const postureOpenness = state.vulnerability * 0.5 + state.intimacy * 0.3 - state.socialTension * 0.3 - Math.abs(state.dominance) * 0.2;
  const cameraZoomBias = state.intimacy * 0.4 - state.isolation * 0.3 + state.socialTension * 0.2;
  const framingAsymmetry = state.socialTension * 0.4 + Math.abs(state.dominance) * 0.3 + state.vulnerability * 0.2;
  const lightingWarmth = state.intimacy * 0.5 - state.isolation * 0.3 - state.socialTension * 0.2;
  const motionEnergy = 0.5 - state.isolation * 0.3 + state.socialTension * 0.3 - state.vulnerability * 0.2;

  return {
    spacingMultiplier: clamp(spacingMultiplier, 0.3, 2.5),
    gazeAversion: clamp(gazeAversion, 0, 1),
    postureOpenness: clamp(postureOpenness, -1, 1),
    cameraZoomBias: clamp(cameraZoomBias, -0.5, 0.5),
    framingAsymmetry: clamp(framingAsymmetry, 0, 1),
    lightingWarmth: clamp(lightingWarmth, -1, 1),
    motionEnergy: clamp(motionEnergy, 0.1, 1.5),
  };
}

export function deriveEmotionalSpaceFromTone(tone: string): Partial<EmotionalSpaceState> {
  switch (tone) {
    case 'lonely': return { isolation: 0.9, emotionalDistance: 0.8, intimacy: 0.1, vulnerability: 0.6 };
    case 'tense': return { socialTension: 0.85, emotionalDistance: 0.3, dominance: 0.2, vulnerability: 0.2 };
    case 'sad': return { vulnerability: 0.8, emotionalDistance: 0.6, isolation: 0.5, intimacy: 0.2 };
    case 'awkward': return { socialTension: 0.6, vulnerability: 0.5, emotionalDistance: 0.5, intimacy: 0.15 };
    case 'romantic': return { intimacy: 0.9, emotionalDistance: 0.1, vulnerability: 0.7, isolation: 0.05 };
    case 'energetic': return { socialTension: 0.3, isolation: 0.1, intimacy: 0.4 };
    case 'threatening': return { dominance: 0.7, socialTension: 0.9, vulnerability: 0.1, emotionalDistance: 0.4 };
    default: return {};
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
