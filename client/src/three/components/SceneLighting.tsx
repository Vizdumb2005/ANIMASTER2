import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { SceneTone } from '@animaster/shared/scene';

interface ToneLightingConfig {
  keyColor: number;
  keyIntensity: number;
  keyPosition: [number, number, number];
  fillColor: number;
  fillIntensity: number;
  rimColor: number;
  rimIntensity: number;
  rimPosition: [number, number, number];
  ambientColor: number;
  ambientIntensity: number;
}

const TONE_LIGHTING: Record<string, ToneLightingConfig> = {
  neutral: {
    keyColor: 0xddd8cc, keyIntensity: 0.8, keyPosition: [3, 5, 4],
    fillColor: 0x8899aa, fillIntensity: 0.3,
    rimColor: 0xaabbcc, rimIntensity: 0.4, rimPosition: [-3, 3, -2],
    ambientColor: 0x222233, ambientIntensity: 0.35,
  },
  lonely: {
    keyColor: 0x6688cc, keyIntensity: 0.5, keyPosition: [4, 6, 3],
    fillColor: 0x334466, fillIntensity: 0.12,
    rimColor: 0x4466aa, rimIntensity: 0.35, rimPosition: [-4, 2, -3],
    ambientColor: 0x0a0f1a, ambientIntensity: 0.2,
  },
  tense: {
    keyColor: 0xcc6644, keyIntensity: 0.7, keyPosition: [2, 4, 5],
    fillColor: 0x442222, fillIntensity: 0.15,
    rimColor: 0xff4422, rimIntensity: 0.5, rimPosition: [-2, 1, -4],
    ambientColor: 0x1a0808, ambientIntensity: 0.15,
  },
  sad: {
    keyColor: 0x5577aa, keyIntensity: 0.45, keyPosition: [3, 7, 3],
    fillColor: 0x223344, fillIntensity: 0.1,
    rimColor: 0x3355aa, rimIntensity: 0.25, rimPosition: [-3, 4, -2],
    ambientColor: 0x0a0a15, ambientIntensity: 0.18,
  },
  romantic: {
    keyColor: 0xffaa77, keyIntensity: 0.7, keyPosition: [3, 4, 4],
    fillColor: 0x663333, fillIntensity: 0.25,
    rimColor: 0xff8855, rimIntensity: 0.45, rimPosition: [-3, 3, -2],
    ambientColor: 0x1a0a08, ambientIntensity: 0.25,
  },
  threatening: {
    keyColor: 0xaa3322, keyIntensity: 0.6, keyPosition: [1, 3, 5],
    fillColor: 0x220808, fillIntensity: 0.08,
    rimColor: 0xff2200, rimIntensity: 0.6, rimPosition: [-1, 0.5, -5],
    ambientColor: 0x0a0505, ambientIntensity: 0.1,
  },
  awkward: {
    keyColor: 0xccbb88, keyIntensity: 0.6, keyPosition: [3, 5, 4],
    fillColor: 0x665544, fillIntensity: 0.2,
    rimColor: 0x998866, rimIntensity: 0.3, rimPosition: [-3, 3, -2],
    ambientColor: 0x151210, ambientIntensity: 0.28,
  },
  energetic: {
    keyColor: 0xffdd44, keyIntensity: 0.9, keyPosition: [2, 5, 3],
    fillColor: 0x886622, fillIntensity: 0.3,
    rimColor: 0xffcc00, rimIntensity: 0.5, rimPosition: [-2, 3, -3],
    ambientColor: 0x1a1508, ambientIntensity: 0.3,
  },
};

interface SceneLightingProps {
  tone: SceneTone | string;
  tensionLevel?: number;
}

export default function SceneLighting({ tone, tensionLevel = 0 }: SceneLightingProps) {
  const keyRef = useRef<THREE.DirectionalLight>(null);
  const rimRef = useRef<THREE.PointLight>(null);
  const pulseRef = useRef<THREE.PointLight>(null);

  const config = TONE_LIGHTING[tone] ?? TONE_LIGHTING.neutral;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Subtle key light sway
    if (keyRef.current) {
      keyRef.current.position.x = config.keyPosition[0] + Math.sin(t * 0.3) * 0.3;
      keyRef.current.position.y = config.keyPosition[1] + Math.cos(t * 0.2) * 0.15;
    }

    // Tension-based pulse light
    if (pulseRef.current && tensionLevel > 0.2) {
      const pulse = Math.sin(t * 2 + tensionLevel * 4) * 0.5 + 0.5;
      pulseRef.current.intensity = tensionLevel * pulse * 0.8;
    }
  });

  return (
    <>
      {/* Key light */}
      <directionalLight
        ref={keyRef}
        color={config.keyColor}
        intensity={config.keyIntensity}
        position={config.keyPosition}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-near={0.5}
        shadow-camera-far={30}
        shadow-camera-left={-8}
        shadow-camera-right={8}
        shadow-camera-top={8}
        shadow-camera-bottom={-4}
      />

      {/* Fill light */}
      <hemisphereLight
        color={config.fillColor}
        groundColor={config.ambientColor}
        intensity={config.fillIntensity}
      />

      {/* Rim / back light */}
      <pointLight
        ref={rimRef}
        color={config.rimColor}
        intensity={config.rimIntensity}
        position={config.rimPosition}
        distance={20}
        decay={2}
      />

      {/* Ambient base */}
      <ambientLight color={config.ambientColor} intensity={config.ambientIntensity} />

      {/* Tension pulse light */}
      {tensionLevel > 0.2 && (
        <pointLight
          ref={pulseRef}
          color={0xff3300}
          intensity={0}
          position={[0, 2, 3]}
          distance={15}
          decay={2}
        />
      )}
    </>
  );
}
