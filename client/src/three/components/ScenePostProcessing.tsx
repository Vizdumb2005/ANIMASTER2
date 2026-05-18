import { EffectComposer, Bloom, Vignette, Noise } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import type { SceneTone } from '@animaster/shared/scene';

interface TonePostConfig {
  bloomIntensity: number;
  bloomThreshold: number;
  vignetteOffset: number;
  vignetteDarkness: number;
  noiseOpacity: number;
}

const TONE_POST: Record<string, TonePostConfig> = {
  neutral: {
    bloomIntensity: 0.3, bloomThreshold: 0.85,
    vignetteOffset: 0.3, vignetteDarkness: 0.5,
    noiseOpacity: 0.03,
  },
  lonely: {
    bloomIntensity: 0.5, bloomThreshold: 0.7,
    vignetteOffset: 0.25, vignetteDarkness: 0.75,
    noiseOpacity: 0.05,
  },
  tense: {
    bloomIntensity: 0.4, bloomThreshold: 0.8,
    vignetteOffset: 0.2, vignetteDarkness: 0.8,
    noiseOpacity: 0.06,
  },
  sad: {
    bloomIntensity: 0.45, bloomThreshold: 0.75,
    vignetteOffset: 0.2, vignetteDarkness: 0.7,
    noiseOpacity: 0.04,
  },
  romantic: {
    bloomIntensity: 0.6, bloomThreshold: 0.65,
    vignetteOffset: 0.3, vignetteDarkness: 0.55,
    noiseOpacity: 0.02,
  },
  threatening: {
    bloomIntensity: 0.35, bloomThreshold: 0.85,
    vignetteOffset: 0.15, vignetteDarkness: 0.9,
    noiseOpacity: 0.07,
  },
  awkward: {
    bloomIntensity: 0.25, bloomThreshold: 0.85,
    vignetteOffset: 0.3, vignetteDarkness: 0.5,
    noiseOpacity: 0.04,
  },
  energetic: {
    bloomIntensity: 0.5, bloomThreshold: 0.7,
    vignetteOffset: 0.35, vignetteDarkness: 0.4,
    noiseOpacity: 0.03,
  },
};

interface ScenePostProcessingProps {
  tone: SceneTone | string;
  tensionLevel?: number;
}

export default function ScenePostProcessing({ tone, tensionLevel = 0 }: ScenePostProcessingProps) {
  const config = TONE_POST[tone] ?? TONE_POST.neutral;

  // Tension boosts vignette darkness
  const vigDarkness = config.vignetteDarkness + tensionLevel * 0.2;

  return (
    <EffectComposer>
      <Bloom
        intensity={config.bloomIntensity}
        luminanceThreshold={config.bloomThreshold}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette
        offset={config.vignetteOffset}
        darkness={vigDarkness}
        blendFunction={BlendFunction.NORMAL}
      />
      <Noise
        opacity={config.noiseOpacity}
        blendFunction={BlendFunction.OVERLAY}
      />
    </EffectComposer>
  );
}
