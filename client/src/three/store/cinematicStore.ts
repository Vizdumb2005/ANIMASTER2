/**
 * Zustand store for Three.js cinematic state — bridges Animaster's
 * semantic runtime with the 3D rendering pipeline.
 */
import { create } from 'zustand';
import type { CameraPreset, CameraRigType } from '../camera';
import type { AtmosphereState } from '../atmosphere';

export interface CinematicState {
  // Rendering
  rendererReady: boolean;
  setRendererReady: (ready: boolean) => void;

  // Camera
  cameraPreset: CameraPreset;
  cameraRig: CameraRigType;
  cameraSmoothing: number;
  setCameraPreset: (preset: CameraPreset) => void;
  setCameraRig: (rig: CameraRigType) => void;
  setCameraSmoothing: (factor: number) => void;

  // Tone
  currentTone: string;
  setTone: (tone: string) => void;

  // Environment
  environmentType: string;
  setEnvironmentType: (type: string) => void;

  // Atmosphere
  atmosphere: AtmosphereState;
  setAtmosphere: (state: AtmosphereState) => void;

  // Post-processing
  bloomIntensity: number;
  vignetteStrength: number;
  filmGrain: number;
  setBloomIntensity: (v: number) => void;
  setVignetteStrength: (v: number) => void;
  setFilmGrain: (v: number) => void;

  // Audio
  masterVolume: number;
  audioMuted: boolean;
  setMasterVolume: (v: number) => void;
  setAudioMuted: (muted: boolean) => void;

  // Assets
  loadingProgress: number;
  setLoadingProgress: (v: number) => void;

  // Debug
  debugMode: boolean;
  toggleDebugMode: () => void;
}

export const useCinematicStore = create<CinematicState>((set) => ({
  rendererReady: false,
  setRendererReady: (ready) => set({ rendererReady: ready }),

  cameraPreset: 'medium',
  cameraRig: 'static',
  cameraSmoothing: 0.05,
  setCameraPreset: (preset) => set({ cameraPreset: preset }),
  setCameraRig: (rig) => set({ cameraRig: rig }),
  setCameraSmoothing: (factor) => set({ cameraSmoothing: factor }),

  currentTone: 'neutral',
  setTone: (tone) => set({ currentTone: tone }),

  environmentType: 'indoor_room',
  setEnvironmentType: (type) => set({ environmentType: type }),

  atmosphere: {
    fogColor: 0x1a1a22,
    fogDensity: 0.02,
    ambientColor: 0x334455,
    ambientIntensity: 0.4,
    particleEffects: [],
    lightingTint: 'neutral',
    emptinessLevel: 0,
    weatherIntensity: 0,
  },
  setAtmosphere: (state) => set({ atmosphere: state }),

  bloomIntensity: 0.3,
  vignetteStrength: 0.5,
  filmGrain: 0.02,
  setBloomIntensity: (v) => set({ bloomIntensity: v }),
  setVignetteStrength: (v) => set({ vignetteStrength: v }),
  setFilmGrain: (v) => set({ filmGrain: v }),

  masterVolume: 0.5,
  audioMuted: false,
  setMasterVolume: (v) => set({ masterVolume: v }),
  setAudioMuted: (muted) => set({ audioMuted: muted }),

  loadingProgress: 0,
  setLoadingProgress: (v) => set({ loadingProgress: v }),

  debugMode: false,
  toggleDebugMode: () => set((s) => ({ debugMode: !s.debugMode })),
}));
