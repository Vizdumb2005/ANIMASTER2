// Phase 8 — Task Group 7: Directorial Style System

export type DirectorialStyleName =
  | 'noir_isolation'
  | 'quiet_intimacy'
  | 'neon_loneliness'
  | 'restrained_realism'
  | 'dreamlike_memory'
  | 'psychological_pressure'
  | 'melancholic_distance'
  | 'documentary_observer';

export interface DirectorialStyle {
  name: DirectorialStyleName;
  label: string;
  description: string;
  lighting: { tint: string; ambientIntensity: number; contrastBoost: number };
  pacing: { tempo: 'slow' | 'medium' | 'fast'; pauseWeight: number; motionEnergy: number };
  atmosphere: { fogDensity: number; bloomIntensity: number; vignetteStrength: number; grainIntensity: number };
  camera: { preferredMode: string; zoomBias: number; transitionSpeed: number; shakeFactor: number };
  composition: { negativeSpaceBias: number; framingAsymmetry: number; silhouetteEnhance: number };
  colorLanguage: { saturation: number; warmth: number; primaryTint: number };
  movementEnergy: number;
}

export const DIRECTORIAL_STYLES: DirectorialStyle[] = [
  {
    name: 'noir_isolation',
    label: 'Noir Isolation',
    description: 'High contrast, deep shadows, characters dwarfed by empty space',
    lighting: { tint: 'cold', ambientIntensity: 0.4, contrastBoost: 0.8 },
    pacing: { tempo: 'slow', pauseWeight: 0.8, motionEnergy: 0.3 },
    atmosphere: { fogDensity: 0.3, bloomIntensity: 0.2, vignetteStrength: 0.7, grainIntensity: 0.4 },
    camera: { preferredMode: 'wide_shot', zoomBias: -0.2, transitionSpeed: 0.2, shakeFactor: 0 },
    composition: { negativeSpaceBias: 0.8, framingAsymmetry: 0.6, silhouetteEnhance: 0.9 },
    colorLanguage: { saturation: 0.2, warmth: -0.6, primaryTint: 0x1a2a3a },
    movementEnergy: 0.25,
  },
  {
    name: 'quiet_intimacy',
    label: 'Quiet Intimacy',
    description: 'Warm, soft, close framing with gentle pacing',
    lighting: { tint: 'warm', ambientIntensity: 0.8, contrastBoost: 0.2 },
    pacing: { tempo: 'slow', pauseWeight: 0.6, motionEnergy: 0.4 },
    atmosphere: { fogDensity: 0.1, bloomIntensity: 0.5, vignetteStrength: 0.3, grainIntensity: 0.1 },
    camera: { preferredMode: 'close_up', zoomBias: 0.3, transitionSpeed: 0.3, shakeFactor: 0 },
    composition: { negativeSpaceBias: 0.2, framingAsymmetry: 0.2, silhouetteEnhance: 0.3 },
    colorLanguage: { saturation: 0.6, warmth: 0.7, primaryTint: 0x3a2a1a },
    movementEnergy: 0.35,
  },
  {
    name: 'neon_loneliness',
    label: 'Neon Loneliness',
    description: 'Saturated color pools in dark void, urban isolation',
    lighting: { tint: 'cold', ambientIntensity: 0.35, contrastBoost: 0.7 },
    pacing: { tempo: 'slow', pauseWeight: 0.75, motionEnergy: 0.3 },
    atmosphere: { fogDensity: 0.4, bloomIntensity: 0.8, vignetteStrength: 0.5, grainIntensity: 0.3 },
    camera: { preferredMode: 'wide_shot', zoomBias: -0.15, transitionSpeed: 0.15, shakeFactor: 0 },
    composition: { negativeSpaceBias: 0.7, framingAsymmetry: 0.5, silhouetteEnhance: 0.7 },
    colorLanguage: { saturation: 0.9, warmth: -0.3, primaryTint: 0x2a1a3a },
    movementEnergy: 0.2,
  },
  {
    name: 'restrained_realism',
    label: 'Restrained Realism',
    description: 'Neutral observation, minimal camera movement, unflinching gaze',
    lighting: { tint: 'rgba(0,0,0,0)', ambientIntensity: 0.7, contrastBoost: 0.3 },
    pacing: { tempo: 'medium', pauseWeight: 0.4, motionEnergy: 0.5 },
    atmosphere: { fogDensity: 0, bloomIntensity: 0.1, vignetteStrength: 0.15, grainIntensity: 0.2 },
    camera: { preferredMode: 'static', zoomBias: 0, transitionSpeed: 0.1, shakeFactor: 0 },
    composition: { negativeSpaceBias: 0.4, framingAsymmetry: 0.3, silhouetteEnhance: 0.2 },
    colorLanguage: { saturation: 0.45, warmth: 0, primaryTint: 0x2a2a2a },
    movementEnergy: 0.45,
  },
  {
    name: 'dreamlike_memory',
    label: 'Dreamlike Memory',
    description: 'Soft focus, desaturated warmth, floating camera, nostalgic haze',
    lighting: { tint: 'warm', ambientIntensity: 0.6, contrastBoost: 0.15 },
    pacing: { tempo: 'slow', pauseWeight: 0.7, motionEnergy: 0.25 },
    atmosphere: { fogDensity: 0.5, bloomIntensity: 0.7, vignetteStrength: 0.4, grainIntensity: 0.35 },
    camera: { preferredMode: 'follow', zoomBias: 0.1, transitionSpeed: 0.15, shakeFactor: 0 },
    composition: { negativeSpaceBias: 0.5, framingAsymmetry: 0.3, silhouetteEnhance: 0.4 },
    colorLanguage: { saturation: 0.35, warmth: 0.5, primaryTint: 0x3a3020 },
    movementEnergy: 0.2,
  },
  {
    name: 'psychological_pressure',
    label: 'Psychological Pressure',
    description: 'Tight framing, low headroom, compressed space, rising tension',
    lighting: { tint: 'cold', ambientIntensity: 0.5, contrastBoost: 0.6 },
    pacing: { tempo: 'medium', pauseWeight: 0.3, motionEnergy: 0.7 },
    atmosphere: { fogDensity: 0.15, bloomIntensity: 0.15, vignetteStrength: 0.6, grainIntensity: 0.25 },
    camera: { preferredMode: 'close_up', zoomBias: 0.4, transitionSpeed: 0.5, shakeFactor: 0.15 },
    composition: { negativeSpaceBias: 0.1, framingAsymmetry: 0.7, silhouetteEnhance: 0.5 },
    colorLanguage: { saturation: 0.3, warmth: -0.4, primaryTint: 0x1a1a2a },
    movementEnergy: 0.6,
  },
  {
    name: 'melancholic_distance',
    label: 'Melancholic Distance',
    description: 'Camera held far back, slow drifts, emotional detachment',
    lighting: { tint: 'cold', ambientIntensity: 0.55, contrastBoost: 0.25 },
    pacing: { tempo: 'slow', pauseWeight: 0.65, motionEnergy: 0.3 },
    atmosphere: { fogDensity: 0.25, bloomIntensity: 0.3, vignetteStrength: 0.35, grainIntensity: 0.2 },
    camera: { preferredMode: 'wide_shot', zoomBias: -0.25, transitionSpeed: 0.12, shakeFactor: 0 },
    composition: { negativeSpaceBias: 0.7, framingAsymmetry: 0.4, silhouetteEnhance: 0.6 },
    colorLanguage: { saturation: 0.3, warmth: -0.2, primaryTint: 0x2a2a30 },
    movementEnergy: 0.2,
  },
  {
    name: 'documentary_observer',
    label: 'Documentary Observer',
    description: 'Fly-on-the-wall perspective, reactive framing, handheld feel',
    lighting: { tint: 'rgba(0,0,0,0)', ambientIntensity: 0.75, contrastBoost: 0.2 },
    pacing: { tempo: 'medium', pauseWeight: 0.35, motionEnergy: 0.55 },
    atmosphere: { fogDensity: 0, bloomIntensity: 0.05, vignetteStrength: 0.1, grainIntensity: 0.3 },
    camera: { preferredMode: 'follow', zoomBias: 0.05, transitionSpeed: 0.6, shakeFactor: 0.2 },
    composition: { negativeSpaceBias: 0.35, framingAsymmetry: 0.45, silhouetteEnhance: 0.15 },
    colorLanguage: { saturation: 0.5, warmth: 0.1, primaryTint: 0x2a2a2a },
    movementEnergy: 0.5,
  },
];

export function getDirectorialStyle(name: DirectorialStyleName): DirectorialStyle | undefined {
  return DIRECTORIAL_STYLES.find((s) => s.name === name);
}

export function getStyleForTone(tone: string): DirectorialStyle {
  const toneStyleMap: Record<string, DirectorialStyleName> = {
    lonely: 'melancholic_distance',
    tense: 'psychological_pressure',
    sad: 'quiet_intimacy',
    awkward: 'restrained_realism',
    romantic: 'quiet_intimacy',
    energetic: 'documentary_observer',
    threatening: 'noir_isolation',
    neutral: 'restrained_realism',
  };
  const styleName = toneStyleMap[tone] ?? 'restrained_realism';
  return DIRECTORIAL_STYLES.find((s) => s.name === styleName) ?? DIRECTORIAL_STYLES[3];
}

export function getAllDirectorialStyles(): DirectorialStyle[] {
  return [...DIRECTORIAL_STYLES];
}
