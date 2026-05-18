/**
 * Three.js Renderer configuration for Animaster.
 * Stylized cinematic rendering — NOT photorealistic.
 */
import * as THREE from 'three';

export interface RendererSettings {
  toneMapping: THREE.ToneMapping;
  toneMappingExposure: number;
  outputColorSpace: THREE.ColorSpace;
  shadowsEnabled: boolean;
  shadowMapType: THREE.ShadowMapType;
  antialias: boolean;
  pixelRatio: number;
}

const CINEMATIC_DEFAULTS: RendererSettings = {
  toneMapping: THREE.ACESFilmicToneMapping,
  toneMappingExposure: 1.0,
  outputColorSpace: THREE.SRGBColorSpace,
  shadowsEnabled: true,
  shadowMapType: THREE.PCFSoftShadowMap,
  antialias: true,
  pixelRatio: Math.min(window.devicePixelRatio, 2),
};

export function applyRendererSettings(
  renderer: THREE.WebGLRenderer,
  overrides?: Partial<RendererSettings>
): void {
  const settings = { ...CINEMATIC_DEFAULTS, ...overrides };

  renderer.toneMapping = settings.toneMapping;
  renderer.toneMappingExposure = settings.toneMappingExposure;
  renderer.outputColorSpace = settings.outputColorSpace;
  renderer.shadowMap.enabled = settings.shadowsEnabled;
  renderer.shadowMap.type = settings.shadowMapType;
  renderer.setPixelRatio(settings.pixelRatio);
}

export type TonePreset = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_EXPOSURE: Record<TonePreset, number> = {
  neutral: 1.0,
  lonely: 0.7,
  tense: 0.85,
  romantic: 1.1,
  sad: 0.65,
  threatening: 0.6,
  awkward: 0.9,
  energetic: 1.2,
};

export function getExposureForTone(tone: string): number {
  return TONE_EXPOSURE[tone as TonePreset] ?? 1.0;
}

export { CINEMATIC_DEFAULTS };
