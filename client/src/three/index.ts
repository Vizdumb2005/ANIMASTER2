/**
 * Animaster Three.js Integration — main export index.
 */

// Rendering
export { SceneManager, getSceneManager, resetSceneManager } from './rendering';
export { applyRendererSettings, getExposureForTone, CINEMATIC_DEFAULTS } from './rendering';
export type { SceneLayer, RendererSettings, TonePreset } from './rendering';

// Lighting
export { LightingPipeline, getLightingConfigForTone } from './lighting';
export type { LightingConfig } from './lighting';

// Post-Processing
export { getPostProcessingForTone, getDefaultPostProcessing, CinematicEffects } from './postprocessing';
export type { PostProcessingConfig } from './postprocessing';

// Atmosphere
export { AtmosphereController, getAtmosphereForTone } from './atmosphere';
export type { AtmosphereState } from './atmosphere';

// Particles
export { ParticleEmitter, createParticleSystem, PARTICLE_PRESETS, AtmosphereManager } from './particles';
export type { ParticleType } from './particles';

// Environments
export { ProceduralEnvironmentBuilder, getEnvironmentConfig, SkylineGenerator } from './environments';
export type { EnvironmentType, SkylineType } from './environments';

// Camera
export { CinematicCameraController, getCameraPresetConfig, getCameraSettingsForTone } from './camera';
export type { CameraRigType, CameraPreset } from './camera';

// Shaders
export {
  SilhouetteShader, AtmosphericFogShader, PainterlyGradientShader,
  createSilhouetteMaterial, createSkyGradientMaterial, getSkyColorsForTone,
} from './shaders';

// Assets
export { AssetLoader, getAssetLoader } from './assets';
export type { AssetType } from './assets';

// Audio
export { AmbientAudioManager } from './audio';
export type { AmbientSoundType } from './audio';

// Store (Zustand)
export { useCinematicStore } from './store';
export type { CinematicState } from './store';
