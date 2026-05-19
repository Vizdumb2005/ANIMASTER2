// Directorial Style Runtime Integration
// Connects DirectorialStyleSelector to runtime atmosphere/camera with smooth transitions

import { sceneStore } from '../../store/sceneStore';
import type { DirectorialStyle, DirectorialStyleName } from '@animaster/shared/directorialStyles';

interface StyleTransitionState {
  targetAtmosphere: {
    lightingTint?: string;
    ambientIntensity?: number;
    fogDensity?: number;
  };
  targetCamera: {
    mode?: string;
    motionBias?: number;
  };
  transitionDuration: number; // ms
  startTime: number;
}

let activeTransition: StyleTransitionState | null = null;
let currentStyleName: DirectorialStyleName | null = null;

// Apply style with smooth transition
export function applyStyleWithTransition(style: DirectorialStyle): void {
  currentStyleName = style.name;
  activeTransition = {
    targetAtmosphere: {
      lightingTint: style.lighting.tint,
      ambientIntensity: style.lighting.ambientIntensity,
      fogDensity: style.atmosphere.fogDensity,
    },
    targetCamera: {
      mode: style.camera.preferredMode,
      motionBias: style.camera.motionBias,
    },
    transitionDuration: 1500, // 1.5 second smooth transition
    startTime: Date.now(),
  };

  // Immediately apply to scene for responsiveness
  sceneStore.mutateScene((draft) => {
    draft.atmosphere.lightingTint = style.lighting.tint;
    draft.atmosphere.ambientIntensity = style.lighting.ambientIntensity;
    draft.rhythm.tempo = style.pacing.tempo;
    draft.rhythm.pauseFrequencyPerMinute = Math.round(style.pacing.pauseWeight * 10);
    draft.camera.mode = style.camera.preferredMode as typeof draft.camera.mode;

    if (draft.visualStyle) {
      draft.visualStyle.fogDensity = style.atmosphere.fogDensity;
      draft.visualStyle.bloomIntensity = style.atmosphere.bloomIntensity;
      draft.visualStyle.vignetteStrength = style.atmosphere.vignetteStrength;
      draft.visualStyle.grainIntensity = style.atmosphere.grainIntensity;
      draft.visualStyle.saturation = style.colorLanguage.saturation;
    }

    if (draft.cinematicGrammar?.template) {
      draft.cinematicGrammar.template.motionEnergyScale = style.movementEnergy;
    }
  });
}

// Get current active style name
export function getCurrentStyleName(): DirectorialStyleName | null {
  return currentStyleName;
}

// Check if transition is in progress
export function isTransitioning(): boolean {
  if (!activeTransition) return false;
  
  const elapsed = Date.now() - activeTransition.startTime;
  return elapsed < activeTransition.transitionDuration;
}

// Get transition progress (0-1)
export function getTransitionProgress(): number {
  if (!activeTransition) return 1;
  
  const elapsed = Date.now() - activeTransition.startTime;
  return Math.min(elapsed / activeTransition.transitionDuration, 1);
}

// Ease function for smooth transitions
export function easeInOutCubic(t: number): number {
  return t < 0.5 
    ? 4 * t * t * t 
    : 1 - Math.pow(-2 * t + 2, 3) / 2;
}