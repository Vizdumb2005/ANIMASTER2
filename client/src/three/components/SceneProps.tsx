import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Procedural prop geometries - minimal, silhouette-forward

function StreetLight({ position }: { position: [number, number, number] }) {
  const lightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!lightRef.current) return;
    const t = clock.getElapsedTime();
    lightRef.current.intensity = 0.4 + Math.sin(t * 0.5) * 0.08;
  });

  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.04, 0.06, 3, 6]} />
        <meshStandardMaterial color={0x333333} roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Arm */}
      <mesh position={[0.3, 2.9, 0]} rotation={[0, 0, -0.3]}>
        <cylinderGeometry args={[0.02, 0.02, 0.6, 4]} />
        <meshStandardMaterial color={0x333333} roughness={0.8} metalness={0.3} />
      </mesh>
      {/* Lamp */}
      <mesh position={[0.5, 3, 0]}>
        <sphereGeometry args={[0.1, 8, 6]} />
        <meshBasicMaterial color={0xffdd88} />
      </mesh>
      {/* Light */}
      <pointLight ref={lightRef} color={0xffdd88} intensity={0.5} position={[0.5, 2.8, 0]} distance={8} decay={2} />
    </group>
  );
}

function Bench({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Seat */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[1.2, 0.06, 0.35]} />
        <meshStandardMaterial color={0x3a2a1a} roughness={0.9} />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.7, -0.15]} rotation={[-0.15, 0, 0]}>
        <boxGeometry args={[1.2, 0.5, 0.04]} />
        <meshStandardMaterial color={0x3a2a1a} roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[-0.5, 0.5].map((x, i) => (
        <mesh key={i} position={[x, 0.2, 0]}>
          <boxGeometry args={[0.04, 0.4, 0.3]} />
          <meshStandardMaterial color={0x222222} roughness={0.8} metalness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

function VendingMachine({ position }: { position: [number, number, number] }) {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    glowRef.current.intensity = 0.2 + Math.sin(clock.getElapsedTime() * 0.8) * 0.05;
  });

  return (
    <group position={position}>
      {/* Body */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[0.7, 1.8, 0.5]} />
        <meshStandardMaterial color={0x2a2a35} roughness={0.7} metalness={0.2} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 1.2, 0.26]}>
        <planeGeometry args={[0.5, 0.8]} />
        <meshBasicMaterial color={0x2244aa} />
      </mesh>
      {/* Glow */}
      <pointLight ref={glowRef} color={0x3355cc} intensity={0.25} position={[0, 1.2, 0.5]} distance={4} decay={2} />
    </group>
  );
}

function NeonSign({ position, color = 0xff2255 }: { position: [number, number, number]; color?: number }) {
  const glowRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    if (!glowRef.current) return;
    const t = clock.getElapsedTime();
    const flicker = Math.random() > 0.97 ? 0.1 : 0.6 + Math.sin(t * 2) * 0.1;
    glowRef.current.intensity = flicker;
  });

  return (
    <group position={position}>
      {/* Sign frame */}
      <mesh>
        <boxGeometry args={[1.5, 0.4, 0.05]} />
        <meshBasicMaterial color={color} />
      </mesh>
      {/* Glow */}
      <pointLight ref={glowRef} color={color} intensity={0.5} position={[0, 0, 0.3]} distance={6} decay={2} />
    </group>
  );
}

function Window({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh>
        <boxGeometry args={[1, 1.2, 0.05]} />
        <meshStandardMaterial color={0x333340} roughness={0.6} metalness={0.2} />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 0, 0.03]}>
        <planeGeometry args={[0.85, 1.05]} />
        <meshStandardMaterial color={0x1a2540} roughness={0.1} metalness={0.3} transparent opacity={0.6} />
      </mesh>
      {/* Light from window */}
      <pointLight color={0x4466aa} intensity={0.15} position={[0, 0, 0.5]} distance={5} decay={2} />
    </group>
  );
}

function HospitalBed({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Frame */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.8, 0.08, 1.8]} />
        <meshStandardMaterial color={0x888890} roughness={0.5} metalness={0.4} />
      </mesh>
      {/* Mattress */}
      <mesh position={[0, 0.48, 0]}>
        <boxGeometry args={[0.7, 0.1, 1.6]} />
        <meshStandardMaterial color={0xeeeedd} roughness={0.9} />
      </mesh>
      {/* Legs */}
      {[[-0.35, -0.85], [-0.35, 0.85], [0.35, -0.85], [0.35, 0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.2, z]}>
          <cylinderGeometry args={[0.025, 0.025, 0.4, 4]} />
          <meshStandardMaterial color={0x666670} roughness={0.5} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function SubwayPillar({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={[0.15, 0.15, 5, 8]} />
      <meshStandardMaterial color={0x3a3a40} roughness={0.6} metalness={0.3} />
    </mesh>
  );
}

function TrashCan({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.15, 0.18, 0.7, 8]} />
        <meshStandardMaterial color={0x333338} roughness={0.7} metalness={0.2} />
      </mesh>
    </group>
  );
}

// Environment-specific prop placement
const ENV_PROPS: Record<string, Array<{ type: string; position: [number, number, number]; color?: number }>> = {
  outdoor_street: [
    { type: 'streetlight', position: [-4, 0, -1] },
    { type: 'streetlight', position: [5, 0, -2] },
    { type: 'neon', position: [3, 3.5, -5.5], color: 0xff2255 },
    { type: 'neon', position: [-3.5, 4, -5.5], color: 0x22aaff },
    { type: 'vending', position: [4.5, 0, -3] },
    { type: 'trash', position: [-2, 0, 1] },
  ],
  outdoor_park: [
    { type: 'bench', position: [2, 0, 0] },
    { type: 'bench', position: [-3, 0, 1] },
    { type: 'streetlight', position: [0, 0, -2] },
  ],
  rooftop: [
    { type: 'streetlight', position: [4, 0, -2] },
    { type: 'bench', position: [-2, 0, 0] },
  ],
  hospital: [
    { type: 'bed', position: [-3, 0, -2] },
    { type: 'bench', position: [3, 0, 0] },
    { type: 'window', position: [0, 2.5, -5.9] },
  ],
  hallway: [
    { type: 'window', position: [-3, 2.5, -5.9] },
    { type: 'window', position: [3, 2.5, -5.9] },
  ],
  subway: [
    { type: 'pillar', position: [-3, 2.5, 0] },
    { type: 'pillar', position: [3, 2.5, 0] },
    { type: 'bench', position: [0, 0, -3] },
    { type: 'vending', position: [5, 0, -4] },
  ],
  apartment: [
    { type: 'window', position: [0, 2.5, -5.9] },
    { type: 'bench', position: [-3, 0, -1] },
  ],
  indoor_room: [
    { type: 'window', position: [2, 2.5, -5.9] },
  ],
  staircase: [],
  outdoor_beach: [
    { type: 'bench', position: [3, 0, 0] },
  ],
  outdoor_forest: [],
};

interface ScenePropsProps {
  envType: string;
  tone?: string;
}

export default function SceneProps({ envType, tone = 'neutral' }: ScenePropsProps) {
  const props = ENV_PROPS[envType] ?? [];

  return (
    <group>
      {props.map((prop, i) => {
        switch (prop.type) {
          case 'streetlight': return <StreetLight key={i} position={prop.position} />;
          case 'bench': return <Bench key={i} position={prop.position} />;
          case 'vending': return <VendingMachine key={i} position={prop.position} />;
          case 'neon': return <NeonSign key={i} position={prop.position} color={prop.color} />;
          case 'window': return <Window key={i} position={prop.position} />;
          case 'bed': return <HospitalBed key={i} position={prop.position} />;
          case 'pillar': return <SubwayPillar key={i} position={prop.position} />;
          case 'trash': return <TrashCan key={i} position={prop.position} />;
          default: return null;
        }
      })}
    </group>
  );
}
