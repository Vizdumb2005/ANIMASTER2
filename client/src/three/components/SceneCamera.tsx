import { useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import type { Camera as SceneCamera, SceneTone } from '@animaster/shared/scene';

const TONE_CAMERA_DEFAULTS: Record<string, { fov: number; height: number; distance: number; drift: number }> = {
  neutral: { fov: 50, height: 3, distance: 8, drift: 0 },
  lonely: { fov: 55, height: 3.5, distance: 10, drift: 0.003 },
  tense: { fov: 42, height: 2.5, distance: 6, drift: 0.01 },
  sad: { fov: 52, height: 3.2, distance: 9, drift: 0.002 },
  romantic: { fov: 45, height: 2.8, distance: 7, drift: 0.004 },
  threatening: { fov: 38, height: 2, distance: 5.5, drift: 0.015 },
  awkward: { fov: 48, height: 3, distance: 7.5, drift: 0.005 },
  energetic: { fov: 55, height: 3, distance: 8, drift: 0.008 },
};

interface SceneCameraControllerProps {
  camera: SceneCamera;
  tone: SceneTone | string;
  tensionLevel?: number;
  actorPositions?: Array<{ x: number; z: number }>;
}

export default function SceneCameraController({ camera, tone, tensionLevel = 0, actorPositions = [] }: SceneCameraControllerProps) {
  const { camera: threeCamera } = useThree();
  const targetPos = useRef(new THREE.Vector3(0, 3, 8));
  const targetLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const smoothLookAt = useRef(new THREE.Vector3(0, 1, 0));
  const handheldOffset = useRef(new THREE.Vector3());
  const lerpTarget = useRef(new THREE.Vector3());

  const config = TONE_CAMERA_DEFAULTS[tone] ?? TONE_CAMERA_DEFAULTS.neutral;

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    const perspCam = threeCamera as THREE.PerspectiveCamera;

    // Calculate center of actors
    let centerX = 0;
    let centerZ = 0;
    if (actorPositions.length > 0) {
      centerX = actorPositions.reduce((s, a) => s + a.x, 0) / actorPositions.length;
      centerZ = actorPositions.reduce((s, a) => s + a.z, 0) / actorPositions.length;
    }

    // Camera mode logic
    const zoom = camera.zoom || 1;
    const cameraX = (camera.x - 480) / 100;
    const cameraZ = (camera.y - 270) / 100;

    let desiredDistance = config.distance / zoom;
    let desiredHeight = config.height;
    let desiredFov = config.fov;

    // Camera mode adjustments
    switch (camera.mode) {
      case 'close_up':
        desiredDistance *= 0.5;
        desiredHeight *= 0.7;
        desiredFov = 35;
        break;
      case 'wide_shot':
        desiredDistance *= 1.4;
        desiredHeight *= 1.2;
        desiredFov = 60;
        break;
      case 'dramatic_zoom':
        desiredDistance *= 0.4;
        desiredFov = 30;
        break;
      case 'tension':
        desiredDistance *= 0.7;
        desiredFov -= tensionLevel * 10;
        break;
      case 'over_the_shoulder':
        desiredDistance *= 0.6;
        desiredHeight *= 0.85;
        break;
    }

    // Target position
    const followX = camera.mode === 'follow' ? centerX : cameraX;
    const followZ = camera.mode === 'follow' ? centerZ : cameraZ;

    targetPos.current.set(
      followX,
      desiredHeight,
      followZ + desiredDistance
    );

    targetLookAt.current.set(
      camera.mode === 'follow' ? centerX : 0,
      1,
      camera.mode === 'follow' ? centerZ : 0,
    );

    // Handheld shake (for tense/threatening tones)
    if (config.drift > 0) {
      handheldOffset.current.set(
        Math.sin(t * 3.7) * config.drift * 2 + Math.sin(t * 7.3) * config.drift,
        Math.cos(t * 2.9) * config.drift * 1.5,
        Math.sin(t * 5.1) * config.drift
      );
    } else {
      handheldOffset.current.set(0, 0, 0);
    }

    // Smooth interpolation
    const lerpSpeed = 0.04;
    lerpTarget.current.copy(targetPos.current).add(handheldOffset.current);
    perspCam.position.lerp(lerpTarget.current, lerpSpeed);

    // Smooth look-at
    smoothLookAt.current.lerp(targetLookAt.current, lerpSpeed);
    perspCam.lookAt(smoothLookAt.current);

    // Smooth FOV
    if (Math.abs(perspCam.fov - desiredFov) > 0.1) {
      perspCam.fov += (desiredFov - perspCam.fov) * 0.05;
      perspCam.updateProjectionMatrix();
    }
  });

  return null;
}
