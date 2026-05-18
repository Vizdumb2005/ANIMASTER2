import type { VisualStyleProfile, VisualStyleName, SceneTone } from '@animaster/shared/scene';

const VISUAL_STYLES: Record<VisualStyleName, VisualStyleProfile> = {
  noir: {
    name: 'noir',
    fogDensity: 0.06,
    fogColor: 0x080808,
    bloomIntensity: 0.3,
    bloomThreshold: 0.9,
    vignetteStrength: 0.85,
    contrastBoost: 1.4,
    saturation: 0.2,
    colorTint: 0x111122,
    grainIntensity: 0.08,
    silhouetteEnhance: 0.9,
  },
  soft_dream: {
    name: 'soft_dream',
    fogDensity: 0.03,
    fogColor: 0x1a1520,
    bloomIntensity: 0.7,
    bloomThreshold: 0.5,
    vignetteStrength: 0.4,
    contrastBoost: 0.8,
    saturation: 0.7,
    colorTint: 0x2a1a30,
    grainIntensity: 0.02,
    silhouetteEnhance: 0.3,
  },
  cold_realism: {
    name: 'cold_realism',
    fogDensity: 0.04,
    fogColor: 0x0a1520,
    bloomIntensity: 0.2,
    bloomThreshold: 0.85,
    vignetteStrength: 0.5,
    contrastBoost: 1.1,
    saturation: 0.5,
    colorTint: 0x0a1525,
    grainIntensity: 0.04,
    silhouetteEnhance: 0.5,
  },
  neon_isolation: {
    name: 'neon_isolation',
    fogDensity: 0.05,
    fogColor: 0x0a0515,
    bloomIntensity: 0.8,
    bloomThreshold: 0.4,
    vignetteStrength: 0.7,
    contrastBoost: 1.3,
    saturation: 1.2,
    colorTint: 0x150520,
    grainIntensity: 0.03,
    silhouetteEnhance: 0.7,
  },
  warm_memory: {
    name: 'warm_memory',
    fogDensity: 0.03,
    fogColor: 0x201510,
    bloomIntensity: 0.6,
    bloomThreshold: 0.55,
    vignetteStrength: 0.5,
    contrastBoost: 0.9,
    saturation: 0.8,
    colorTint: 0x251a10,
    grainIntensity: 0.05,
    silhouetteEnhance: 0.3,
  },
  monochrome_tension: {
    name: 'monochrome_tension',
    fogDensity: 0.05,
    fogColor: 0x0a0a0a,
    bloomIntensity: 0.25,
    bloomThreshold: 0.9,
    vignetteStrength: 0.9,
    contrastBoost: 1.6,
    saturation: 0.1,
    colorTint: 0x0a0a0a,
    grainIntensity: 0.07,
    silhouetteEnhance: 1.0,
  },
  default: {
    name: 'default',
    fogDensity: 0.04,
    fogColor: 0x1a1520,
    bloomIntensity: 0.35,
    bloomThreshold: 0.8,
    vignetteStrength: 0.5,
    contrastBoost: 1.0,
    saturation: 0.6,
    colorTint: 0x151015,
    grainIntensity: 0.03,
    silhouetteEnhance: 0.5,
  },
};

const TONE_STYLE_MAP: Record<string, VisualStyleName> = {
  lonely: 'cold_realism',
  tense: 'monochrome_tension',
  sad: 'cold_realism',
  romantic: 'warm_memory',
  threatening: 'noir',
  energetic: 'neon_isolation',
  awkward: 'default',
  neutral: 'default',
};

export function getVisualStyleProfile(styleName: VisualStyleName, tone: SceneTone): VisualStyleProfile {
  if (styleName !== 'default') {
    return { ...VISUAL_STYLES[styleName] };
  }

  const toneStyle = TONE_STYLE_MAP[tone] ?? 'default';
  return { ...VISUAL_STYLES[toneStyle] };
}

export function getAllVisualStyles(): VisualStyleProfile[] {
  return Object.values(VISUAL_STYLES);
}
