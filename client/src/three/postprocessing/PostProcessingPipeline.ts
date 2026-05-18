/**
 * Post-Processing Pipeline — cinematic effects using @react-three/postprocessing.
 * Bloom, vignette, depth-of-field, color grading, film grain.
 */
import {
  BlendFunction,
  KernelSize,
} from 'postprocessing';

export interface PostProcessingConfig {
  bloom: {
    enabled: boolean;
    intensity: number;
    luminanceThreshold: number;
    luminanceSmoothing: number;
    kernelSize: KernelSize;
  };
  vignette: {
    enabled: boolean;
    offset: number;
    darkness: number;
    blendFunction: BlendFunction;
  };
  depthOfField: {
    enabled: boolean;
    focusDistance: number;
    focalLength: number;
    bokehScale: number;
  };
  colorGrading: {
    enabled: boolean;
    hue: number;
    saturation: number;
    brightness: number;
  };
  noise: {
    enabled: boolean;
    opacity: number;
    blendFunction: BlendFunction;
  };
}

type ToneKey = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_POSTPROCESSING: Record<ToneKey, Partial<PostProcessingConfig>> = {
  neutral: {
    bloom: { enabled: true, intensity: 0.3, luminanceThreshold: 0.8, luminanceSmoothing: 0.3, kernelSize: KernelSize.MEDIUM },
    vignette: { enabled: true, offset: 0.3, darkness: 0.5, blendFunction: BlendFunction.NORMAL },
    noise: { enabled: true, opacity: 0.02, blendFunction: BlendFunction.OVERLAY },
  },
  lonely: {
    bloom: { enabled: true, intensity: 0.5, luminanceThreshold: 0.6, luminanceSmoothing: 0.5, kernelSize: KernelSize.LARGE },
    vignette: { enabled: true, offset: 0.2, darkness: 0.8, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.6, saturation: -0.3, brightness: -0.15 },
    noise: { enabled: true, opacity: 0.04, blendFunction: BlendFunction.OVERLAY },
  },
  tense: {
    bloom: { enabled: true, intensity: 0.8, luminanceThreshold: 0.5, luminanceSmoothing: 0.2, kernelSize: KernelSize.LARGE },
    vignette: { enabled: true, offset: 0.15, darkness: 0.9, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.0, saturation: 0.1, brightness: -0.1 },
    noise: { enabled: true, opacity: 0.06, blendFunction: BlendFunction.OVERLAY },
  },
  romantic: {
    bloom: { enabled: true, intensity: 0.6, luminanceThreshold: 0.5, luminanceSmoothing: 0.6, kernelSize: KernelSize.VERY_LARGE },
    vignette: { enabled: true, offset: 0.25, darkness: 0.4, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.05, saturation: 0.15, brightness: 0.05 },
    noise: { enabled: true, opacity: 0.015, blendFunction: BlendFunction.OVERLAY },
  },
  sad: {
    bloom: { enabled: true, intensity: 0.4, luminanceThreshold: 0.7, luminanceSmoothing: 0.5, kernelSize: KernelSize.LARGE },
    vignette: { enabled: true, offset: 0.2, darkness: 0.85, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.6, saturation: -0.4, brightness: -0.2 },
    noise: { enabled: true, opacity: 0.03, blendFunction: BlendFunction.OVERLAY },
  },
  threatening: {
    bloom: { enabled: true, intensity: 1.0, luminanceThreshold: 0.4, luminanceSmoothing: 0.15, kernelSize: KernelSize.HUGE },
    vignette: { enabled: true, offset: 0.1, darkness: 1.0, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.0, saturation: 0.2, brightness: -0.25 },
    noise: { enabled: true, opacity: 0.08, blendFunction: BlendFunction.OVERLAY },
  },
  awkward: {
    bloom: { enabled: true, intensity: 0.25, luminanceThreshold: 0.75, luminanceSmoothing: 0.3, kernelSize: KernelSize.MEDIUM },
    vignette: { enabled: true, offset: 0.35, darkness: 0.45, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.1, saturation: -0.1, brightness: 0.0 },
    noise: { enabled: true, opacity: 0.025, blendFunction: BlendFunction.OVERLAY },
  },
  energetic: {
    bloom: { enabled: true, intensity: 0.7, luminanceThreshold: 0.55, luminanceSmoothing: 0.25, kernelSize: KernelSize.LARGE },
    vignette: { enabled: true, offset: 0.4, darkness: 0.3, blendFunction: BlendFunction.NORMAL },
    colorGrading: { enabled: true, hue: 0.05, saturation: 0.2, brightness: 0.1 },
    noise: { enabled: true, opacity: 0.02, blendFunction: BlendFunction.OVERLAY },
  },
};

export function getPostProcessingForTone(tone: string): Partial<PostProcessingConfig> {
  return TONE_POSTPROCESSING[tone as ToneKey] ?? TONE_POSTPROCESSING.neutral;
}

export function getDefaultPostProcessing(): PostProcessingConfig {
  return {
    bloom: { enabled: true, intensity: 0.3, luminanceThreshold: 0.8, luminanceSmoothing: 0.3, kernelSize: KernelSize.MEDIUM },
    vignette: { enabled: true, offset: 0.3, darkness: 0.5, blendFunction: BlendFunction.NORMAL },
    depthOfField: { enabled: false, focusDistance: 0.01, focalLength: 0.05, bokehScale: 3 },
    colorGrading: { enabled: false, hue: 0, saturation: 0, brightness: 0 },
    noise: { enabled: true, opacity: 0.02, blendFunction: BlendFunction.OVERLAY },
  };
}
