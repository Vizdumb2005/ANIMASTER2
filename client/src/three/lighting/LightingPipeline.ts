/**
 * Cinematic Lighting Pipeline — manages key, fill, rim, and ambient lights
 * driven by Animaster's semantic tone system.
 */
import * as THREE from 'three';

export interface LightingConfig {
  keyColor: number;
  keyIntensity: number;
  keyPosition: [number, number, number];
  fillColor: number;
  fillIntensity: number;
  rimColor: number;
  rimIntensity: number;
  ambientColor: number;
  ambientIntensity: number;
}

type ToneKey = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_LIGHTING: Record<ToneKey, LightingConfig> = {
  neutral: {
    keyColor: 0xfff5e6, keyIntensity: 1.2, keyPosition: [5, 8, 5],
    fillColor: 0x8899bb, fillIntensity: 0.3,
    rimColor: 0xccddff, rimIntensity: 0.5,
    ambientColor: 0x334455, ambientIntensity: 0.4,
  },
  lonely: {
    keyColor: 0x6688cc, keyIntensity: 0.6, keyPosition: [3, 10, 2],
    fillColor: 0x334466, fillIntensity: 0.15,
    rimColor: 0x4466aa, rimIntensity: 0.3,
    ambientColor: 0x1a2233, ambientIntensity: 0.25,
  },
  tense: {
    keyColor: 0xff6633, keyIntensity: 1.5, keyPosition: [-3, 6, 4],
    fillColor: 0x220011, fillIntensity: 0.1,
    rimColor: 0xff4400, rimIntensity: 0.8,
    ambientColor: 0x110808, ambientIntensity: 0.15,
  },
  romantic: {
    keyColor: 0xffcc88, keyIntensity: 1.0, keyPosition: [4, 7, 3],
    fillColor: 0xffaa66, fillIntensity: 0.35,
    rimColor: 0xffddaa, rimIntensity: 0.6,
    ambientColor: 0x332211, ambientIntensity: 0.3,
  },
  sad: {
    keyColor: 0x5577aa, keyIntensity: 0.5, keyPosition: [2, 12, 1],
    fillColor: 0x223344, fillIntensity: 0.1,
    rimColor: 0x3355aa, rimIntensity: 0.2,
    ambientColor: 0x111828, ambientIntensity: 0.2,
  },
  threatening: {
    keyColor: 0xcc2200, keyIntensity: 1.8, keyPosition: [0, 3, 6],
    fillColor: 0x110000, fillIntensity: 0.05,
    rimColor: 0xff0000, rimIntensity: 1.0,
    ambientColor: 0x0a0000, ambientIntensity: 0.1,
  },
  awkward: {
    keyColor: 0xeedd99, keyIntensity: 0.9, keyPosition: [6, 5, 4],
    fillColor: 0x998866, fillIntensity: 0.25,
    rimColor: 0xddcc88, rimIntensity: 0.4,
    ambientColor: 0x222211, ambientIntensity: 0.35,
  },
  energetic: {
    keyColor: 0xffee44, keyIntensity: 1.6, keyPosition: [0, 10, 5],
    fillColor: 0xff8800, fillIntensity: 0.4,
    rimColor: 0xffcc00, rimIntensity: 0.7,
    ambientColor: 0x332200, ambientIntensity: 0.3,
  },
};

export class LightingPipeline {
  private keyLight: THREE.DirectionalLight;
  private fillLight: THREE.DirectionalLight;
  private rimLight: THREE.SpotLight;
  private ambientLight: THREE.AmbientLight;
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();

    this.keyLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.set(1024, 1024);
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 50;

    this.fillLight = new THREE.DirectionalLight(0x8899bb, 0.3);

    this.rimLight = new THREE.SpotLight(0xccddff, 0.5, 30, Math.PI / 4, 0.5);
    this.rimLight.position.set(-5, 5, -5);

    this.ambientLight = new THREE.AmbientLight(0x334455, 0.4);

    this.group.add(this.keyLight, this.fillLight, this.rimLight, this.ambientLight);
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  applyTone(tone: string): void {
    const config = TONE_LIGHTING[tone as ToneKey] ?? TONE_LIGHTING.neutral;

    this.keyLight.color.setHex(config.keyColor);
    this.keyLight.intensity = config.keyIntensity;
    this.keyLight.position.set(...config.keyPosition);

    this.fillLight.color.setHex(config.fillColor);
    this.fillLight.intensity = config.fillIntensity;

    this.rimLight.color.setHex(config.rimColor);
    this.rimLight.intensity = config.rimIntensity;

    this.ambientLight.color.setHex(config.ambientColor);
    this.ambientLight.intensity = config.ambientIntensity;
  }

  setKeyIntensity(intensity: number): void {
    this.keyLight.intensity = intensity;
  }

  setAmbientIntensity(intensity: number): void {
    this.ambientLight.intensity = intensity;
  }

  dispose(): void {
    this.keyLight.shadow.map?.dispose();
    this.group.clear();
  }
}

export function getLightingConfigForTone(tone: string): LightingConfig {
  return TONE_LIGHTING[tone as ToneKey] ?? TONE_LIGHTING.neutral;
}
