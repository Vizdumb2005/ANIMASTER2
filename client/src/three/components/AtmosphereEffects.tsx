import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AtmosphereEffect } from '@animaster/shared/scene';

interface ParticleFieldProps {
  count: number;
  color: number;
  size: number;
  speed: number;
  spread: [number, number, number];
  direction: [number, number, number];
  opacity: number;
}

function ParticleField({ count, color, size, speed, spread, direction, opacity }: ParticleFieldProps) {
  const meshRef = useRef<THREE.Points>(null);

  const [positions, velocities] = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const vel = new Float32Array(count * 3);

    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * spread[0];
      pos[i * 3 + 1] = Math.random() * spread[1];
      pos[i * 3 + 2] = (Math.random() - 0.5) * spread[2];

      vel[i * 3] = direction[0] + (Math.random() - 0.5) * 0.2;
      vel[i * 3 + 1] = direction[1] + (Math.random() - 0.5) * 0.1;
      vel[i * 3 + 2] = direction[2] + (Math.random() - 0.5) * 0.2;
    }

    return [pos, vel];
  }, [count, spread, direction]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions.slice(), 3));
    return geo;
  }, [positions]);

  useFrame((_, delta) => {
    if (!meshRef.current) return;
    const posAttr = meshRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const arr = posAttr.array as Float32Array;

    for (let i = 0; i < count; i++) {
      arr[i * 3] += velocities[i * 3] * speed * delta;
      arr[i * 3 + 1] += velocities[i * 3 + 1] * speed * delta;
      arr[i * 3 + 2] += velocities[i * 3 + 2] * speed * delta;

      // Wrap around
      if (arr[i * 3 + 1] < -0.5) {
        arr[i * 3 + 1] = spread[1];
        arr[i * 3] = (Math.random() - 0.5) * spread[0];
        arr[i * 3 + 2] = (Math.random() - 0.5) * spread[2];
      }
      if (arr[i * 3 + 1] > spread[1] + 1) {
        arr[i * 3 + 1] = -0.5;
      }
      if (Math.abs(arr[i * 3]) > spread[0]) {
        arr[i * 3] = (Math.random() - 0.5) * spread[0];
      }
    }
    posAttr.needsUpdate = true;
  });

  return (
    <points ref={meshRef} geometry={geometry}>
      <pointsMaterial
        color={color}
        size={size}
        transparent
        opacity={opacity}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        sizeAttenuation
      />
    </points>
  );
}

// Fog bands - horizontal fog layers
function FogBands() {
  return (
    <group>
      {[0.3, 0.8, 1.5, 2.5].map((y, i) => (
        <mesh key={i} position={[0, y, -2]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[20, 12]} />
          <meshBasicMaterial
            color={0x888899}
            transparent
            opacity={0.03 + i * 0.015}
            depthWrite={false}
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

// Flicker effect - pulsing light
function FlickerLight() {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.getElapsedTime();
    const flicker = Math.random() > 0.92 ? 0.1 : (Math.sin(t * 30) * 0.5 + 0.5) * 0.4 + 0.3;
    lightRef.current.intensity = flicker;
  });

  return (
    <pointLight
      ref={lightRef}
      color={0xffaa55}
      intensity={0.5}
      position={[0, 4, 0]}
      distance={12}
      decay={2}
    />
  );
}

interface AtmosphereEffectsProps {
  effects: AtmosphereEffect[];
  lightingTint: string;
  ambientIntensity: number;
}

export default function AtmosphereEffects({ effects, lightingTint, ambientIntensity }: AtmosphereEffectsProps) {
  const hasRain = effects.includes('rain');
  const hasFog = effects.includes('fog');
  const hasFlicker = effects.includes('flicker');
  const hasDust = effects.includes('dust');
  const hasSnow = effects.includes('snow');
  const hasEmbers = effects.includes('embers');

  // Parse lighting tint to color
  const tintColor = useMemo(() => {
    if (!lightingTint || lightingTint === 'rgba(0,0,0,0)') return null;
    const match = lightingTint.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (!match) return null;
    return new THREE.Color(parseInt(match[1]) / 255, parseInt(match[2]) / 255, parseInt(match[3]) / 255);
  }, [lightingTint]);

  return (
    <group>
      {/* Rain particles */}
      {hasRain && (
        <ParticleField
          count={800}
          color={0x8899cc}
          size={0.03}
          speed={8}
          spread={[20, 12, 15]}
          direction={[0.1, -1, 0]}
          opacity={0.5}
        />
      )}

      {/* Snow particles */}
      {hasSnow && (
        <ParticleField
          count={400}
          color={0xddddee}
          size={0.06}
          speed={0.8}
          spread={[18, 10, 14]}
          direction={[0.05, -1, 0.02]}
          opacity={0.7}
        />
      )}

      {/* Dust particles */}
      {hasDust && (
        <ParticleField
          count={150}
          color={0xaa9977}
          size={0.04}
          speed={0.15}
          spread={[12, 6, 10]}
          direction={[0.3, 0.05, 0.1]}
          opacity={0.35}
        />
      )}

      {/* Embers */}
      {hasEmbers && (
        <ParticleField
          count={60}
          color={0xff6622}
          size={0.05}
          speed={0.6}
          spread={[10, 8, 8]}
          direction={[0.1, 1, 0]}
          opacity={0.7}
        />
      )}

      {/* Fog bands */}
      {hasFog && <FogBands />}

      {/* Flicker light */}
      {hasFlicker && <FlickerLight />}

      {/* Lighting tint overlay */}
      {tintColor && (
        <ambientLight color={tintColor} intensity={0.15} />
      )}
    </group>
  );
}
