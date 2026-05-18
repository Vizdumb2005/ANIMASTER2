/**
 * Cinematic Camera System — rigs, smoothing, damping, framing presets,
 * handheld simulation, focus systems, DOF, and camera transitions.
 */
import * as THREE from 'three';

export type CameraRigType =
  | 'static' | 'follow' | 'orbit' | 'dolly' | 'crane'
  | 'handheld' | 'tracking' | 'locked';

export type CameraPreset =
  | 'close_up' | 'wide_shot' | 'medium' | 'over_the_shoulder'
  | 'dramatic_low' | 'birds_eye' | 'dutch_angle' | 'intimate';

interface CameraState {
  position: THREE.Vector3;
  target: THREE.Vector3;
  fov: number;
  roll: number;
}

interface CameraPresetConfig {
  position: [number, number, number];
  target: [number, number, number];
  fov: number;
  roll: number;
}

const CAMERA_PRESETS: Record<CameraPreset, CameraPresetConfig> = {
  close_up: { position: [0, 1.6, 3], target: [0, 1.5, 0], fov: 35, roll: 0 },
  wide_shot: { position: [0, 3, 12], target: [0, 1, 0], fov: 60, roll: 0 },
  medium: { position: [0, 2, 6], target: [0, 1.2, 0], fov: 50, roll: 0 },
  over_the_shoulder: { position: [-1.5, 1.8, 2], target: [1, 1.5, 0], fov: 40, roll: 0 },
  dramatic_low: { position: [0, 0.3, 4], target: [0, 1.5, 0], fov: 45, roll: 0 },
  birds_eye: { position: [0, 10, 3], target: [0, 0, 0], fov: 50, roll: 0 },
  dutch_angle: { position: [2, 2, 5], target: [0, 1.2, 0], fov: 45, roll: 15 },
  intimate: { position: [0.5, 1.5, 1.8], target: [0, 1.4, 0], fov: 30, roll: 0 },
};

export class CinematicCameraController {
  private camera: THREE.PerspectiveCamera;
  private currentState: CameraState;
  private targetState: CameraState;
  private smoothingFactor: number = 0.05;
  private handheldIntensity: number = 0;
  private handheldTime: number = 0;
  private rigType: CameraRigType = 'static';
  private followTarget: THREE.Vector3 | null = null;
  private dollyPath: THREE.Vector3[] = [];
  private dollyProgress: number = 0;
  private dollySpeed: number = 0.1;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.currentState = {
      position: camera.position.clone(),
      target: new THREE.Vector3(0, 1.2, 0),
      fov: camera.fov,
      roll: 0,
    };
    this.targetState = { ...this.currentState, position: this.currentState.position.clone(), target: this.currentState.target.clone() };
  }

  applyPreset(preset: CameraPreset): void {
    const config = CAMERA_PRESETS[preset];
    this.targetState.position.set(...config.position);
    this.targetState.target.set(...config.target);
    this.targetState.fov = config.fov;
    this.targetState.roll = config.roll;
  }

  setRig(rig: CameraRigType): void {
    this.rigType = rig;
    if (rig === 'handheld') {
      this.handheldIntensity = 0.02;
    } else {
      this.handheldIntensity = 0;
    }
  }

  setFollowTarget(target: THREE.Vector3): void {
    this.followTarget = target;
  }

  setDollyPath(points: THREE.Vector3[], speed: number = 0.1): void {
    this.dollyPath = points;
    this.dollyProgress = 0;
    this.dollySpeed = speed;
  }

  setSmoothing(factor: number): void {
    this.smoothingFactor = THREE.MathUtils.clamp(factor, 0.01, 1.0);
  }

  setPosition(x: number, y: number, z: number): void {
    this.targetState.position.set(x, y, z);
  }

  setTarget(x: number, y: number, z: number): void {
    this.targetState.target.set(x, y, z);
  }

  setFov(fov: number): void {
    this.targetState.fov = THREE.MathUtils.clamp(fov, 10, 120);
  }

  update(deltaSeconds: number): void {
    this.handheldTime += deltaSeconds;

    switch (this.rigType) {
      case 'follow':
        this.updateFollow();
        break;
      case 'dolly':
        this.updateDolly(deltaSeconds);
        break;
      case 'handheld':
        this.updateHandheld();
        break;
    }

    const f = this.smoothingFactor;
    this.currentState.position.lerp(this.targetState.position, f);
    this.currentState.target.lerp(this.targetState.target, f);
    this.currentState.fov = THREE.MathUtils.lerp(this.currentState.fov, this.targetState.fov, f);
    this.currentState.roll = THREE.MathUtils.lerp(this.currentState.roll, this.targetState.roll, f);

    this.camera.position.copy(this.currentState.position);
    this.camera.lookAt(this.currentState.target);
    this.camera.fov = this.currentState.fov;
    this.camera.rotation.z = THREE.MathUtils.degToRad(this.currentState.roll);
    this.camera.updateProjectionMatrix();
  }

  private updateFollow(): void {
    if (!this.followTarget) return;
    const offset = new THREE.Vector3(0, 2, 6);
    this.targetState.position.copy(this.followTarget).add(offset);
    this.targetState.target.copy(this.followTarget).add(new THREE.Vector3(0, 1.2, 0));
  }

  private updateDolly(deltaSeconds: number): void {
    if (this.dollyPath.length < 2) return;
    this.dollyProgress += this.dollySpeed * deltaSeconds;
    if (this.dollyProgress >= this.dollyPath.length - 1) {
      this.dollyProgress = this.dollyPath.length - 1;
    }
    const idx = Math.floor(this.dollyProgress);
    const t = this.dollyProgress - idx;
    const a = this.dollyPath[Math.min(idx, this.dollyPath.length - 1)];
    const b = this.dollyPath[Math.min(idx + 1, this.dollyPath.length - 1)];
    this.targetState.position.lerpVectors(a, b, t);
  }

  private updateHandheld(): void {
    const i = this.handheldIntensity;
    const t = this.handheldTime;
    this.currentState.position.x += Math.sin(t * 1.7) * i;
    this.currentState.position.y += Math.cos(t * 2.3) * i * 0.7;
    this.currentState.roll = Math.sin(t * 0.8) * 0.5;
  }

  getCamera(): THREE.PerspectiveCamera {
    return this.camera;
  }

  getCurrentState(): CameraState {
    return { ...this.currentState, position: this.currentState.position.clone(), target: this.currentState.target.clone() };
  }

  dispose(): void {
    this.dollyPath = [];
    this.followTarget = null;
  }
}

export function getCameraPresetConfig(preset: string): CameraPresetConfig | undefined {
  return CAMERA_PRESETS[preset as CameraPreset];
}

type CameraTone = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_CAMERA: Record<CameraTone, { preset: CameraPreset; smoothing: number; handheld: number }> = {
  neutral: { preset: 'medium', smoothing: 0.05, handheld: 0 },
  lonely: { preset: 'wide_shot', smoothing: 0.03, handheld: 0 },
  tense: { preset: 'close_up', smoothing: 0.08, handheld: 0.015 },
  romantic: { preset: 'intimate', smoothing: 0.03, handheld: 0 },
  sad: { preset: 'medium', smoothing: 0.02, handheld: 0 },
  threatening: { preset: 'dramatic_low', smoothing: 0.06, handheld: 0.02 },
  awkward: { preset: 'medium', smoothing: 0.04, handheld: 0.008 },
  energetic: { preset: 'wide_shot', smoothing: 0.1, handheld: 0.01 },
};

export function getCameraSettingsForTone(tone: string): { preset: CameraPreset; smoothing: number; handheld: number } {
  return TONE_CAMERA[tone as CameraTone] ?? TONE_CAMERA.neutral;
}
