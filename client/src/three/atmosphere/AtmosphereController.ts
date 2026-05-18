/**
 * Atmosphere Controller — unified atmosphere system that coordinates
 * fog, particles, lighting tint, and environmental mood.
 */
import * as THREE from 'three';

export interface AtmosphereState {
  fogColor: number;
  fogDensity: number;
  ambientColor: number;
  ambientIntensity: number;
  particleEffects: string[];
  lightingTint: 'warm' | 'cold' | 'neutral' | 'night';
  emptinessLevel: number;
  weatherIntensity: number;
}

type ToneKey = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_ATMOSPHERE: Record<ToneKey, AtmosphereState> = {
  neutral: {
    fogColor: 0x1a1a22, fogDensity: 0.02,
    ambientColor: 0x334455, ambientIntensity: 0.4,
    particleEffects: [], lightingTint: 'neutral',
    emptinessLevel: 0, weatherIntensity: 0,
  },
  lonely: {
    fogColor: 0x15182a, fogDensity: 0.05,
    ambientColor: 0x1a2233, ambientIntensity: 0.2,
    particleEffects: ['dust'], lightingTint: 'cold',
    emptinessLevel: 0.8, weatherIntensity: 0,
  },
  tense: {
    fogColor: 0x1a0a0a, fogDensity: 0.04,
    ambientColor: 0x110808, ambientIntensity: 0.15,
    particleEffects: [], lightingTint: 'warm',
    emptinessLevel: 0.3, weatherIntensity: 0,
  },
  romantic: {
    fogColor: 0x1a1520, fogDensity: 0.03,
    ambientColor: 0x332211, ambientIntensity: 0.35,
    particleEffects: ['dust'], lightingTint: 'warm',
    emptinessLevel: 0.2, weatherIntensity: 0,
  },
  sad: {
    fogColor: 0x12152a, fogDensity: 0.06,
    ambientColor: 0x111828, ambientIntensity: 0.15,
    particleEffects: ['rain'], lightingTint: 'cold',
    emptinessLevel: 0.6, weatherIntensity: 0.5,
  },
  threatening: {
    fogColor: 0x0a0000, fogDensity: 0.07,
    ambientColor: 0x0a0000, ambientIntensity: 0.1,
    particleEffects: ['smoke'], lightingTint: 'warm',
    emptinessLevel: 0.4, weatherIntensity: 0,
  },
  awkward: {
    fogColor: 0x1a1a18, fogDensity: 0.02,
    ambientColor: 0x222211, ambientIntensity: 0.35,
    particleEffects: [], lightingTint: 'neutral',
    emptinessLevel: 0.1, weatherIntensity: 0,
  },
  energetic: {
    fogColor: 0x1a1a0a, fogDensity: 0.01,
    ambientColor: 0x332200, ambientIntensity: 0.4,
    particleEffects: [], lightingTint: 'warm',
    emptinessLevel: 0, weatherIntensity: 0,
  },
};

export class AtmosphereController {
  private currentState: AtmosphereState;
  private targetState: AtmosphereState;
  private transitionSpeed: number = 0.02;

  constructor() {
    this.currentState = { ...TONE_ATMOSPHERE.neutral };
    this.targetState = { ...TONE_ATMOSPHERE.neutral };
  }

  applyTone(tone: string): void {
    const config = TONE_ATMOSPHERE[tone as ToneKey] ?? TONE_ATMOSPHERE.neutral;
    this.targetState = { ...config };
  }

  addWeather(type: string, intensity: number = 0.5): void {
    if (!this.targetState.particleEffects.includes(type)) {
      this.targetState.particleEffects = [...this.targetState.particleEffects, type];
    }
    this.targetState.weatherIntensity = intensity;
  }

  removeWeather(type: string): void {
    this.targetState.particleEffects = this.targetState.particleEffects.filter(e => e !== type);
    if (this.targetState.particleEffects.length === 0) {
      this.targetState.weatherIntensity = 0;
    }
  }

  update(deltaSeconds: number): void {
    const t = this.transitionSpeed;
    this.currentState.fogDensity = THREE.MathUtils.lerp(this.currentState.fogDensity, this.targetState.fogDensity, t);
    this.currentState.ambientIntensity = THREE.MathUtils.lerp(this.currentState.ambientIntensity, this.targetState.ambientIntensity, t);
    this.currentState.emptinessLevel = THREE.MathUtils.lerp(this.currentState.emptinessLevel, this.targetState.emptinessLevel, t);
    this.currentState.weatherIntensity = THREE.MathUtils.lerp(this.currentState.weatherIntensity, this.targetState.weatherIntensity, t);
    this.currentState.fogColor = this.targetState.fogColor;
    this.currentState.ambientColor = this.targetState.ambientColor;
    this.currentState.lightingTint = this.targetState.lightingTint;
    this.currentState.particleEffects = [...this.targetState.particleEffects];
  }

  getState(): AtmosphereState {
    return { ...this.currentState };
  }

  setTransitionSpeed(speed: number): void {
    this.transitionSpeed = THREE.MathUtils.clamp(speed, 0.001, 1.0);
  }
}

export function getAtmosphereForTone(tone: string): AtmosphereState {
  return { ...(TONE_ATMOSPHERE[tone as ToneKey] ?? TONE_ATMOSPHERE.neutral) };
}
