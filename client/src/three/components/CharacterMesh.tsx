import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Actor, ActorEmotion, StickmanJoints } from '@animaster/shared/scene';

const EMOTION_COLORS: Record<string, number> = {
  neutral: 0xb0a898,
  sad: 0x6688bb,
  happy: 0xddcc77,
  nervous: 0xddaa55,
  angry: 0xcc5544,
  exhausted: 0x7777aa,
  awkward: 0xaa9977,
  excited: 0xddbb44,
};

const EMOTION_POSTURE: Record<string, { headTilt: number; shoulderDrop: number; lean: number; armAngle: number }> = {
  neutral: { headTilt: 0, shoulderDrop: 0, lean: 0, armAngle: 0.15 },
  sad: { headTilt: -0.2, shoulderDrop: 0.12, lean: -0.05, armAngle: 0.05 },
  happy: { headTilt: 0.1, shoulderDrop: -0.05, lean: 0.03, armAngle: 0.35 },
  nervous: { headTilt: -0.08, shoulderDrop: 0.08, lean: -0.03, armAngle: 0.1 },
  angry: { headTilt: 0.15, shoulderDrop: -0.1, lean: 0.08, armAngle: 0.25 },
  exhausted: { headTilt: -0.25, shoulderDrop: 0.18, lean: -0.08, armAngle: 0.02 },
  awkward: { headTilt: -0.12, shoulderDrop: 0.05, lean: -0.02, armAngle: 0.08 },
  excited: { headTilt: 0.12, shoulderDrop: -0.08, lean: 0.05, armAngle: 0.4 },
};

interface EyeProps {
  position: [number, number, number];
  emotion: ActorEmotion;
  blinkPhase: number;
  gazeX: number;
  gazeY: number;
}

function Eye({ position, emotion, blinkPhase, gazeX, gazeY }: EyeProps) {
  const scaleY = blinkPhase > 0.8 ? 0.1 : 1;
  const eyeSize = emotion === 'nervous' || emotion === 'excited' ? 0.065 : 0.055;
  const pupilSize = emotion === 'angry' ? 0.02 : 0.03;

  return (
    <group position={position}>
      {/* Eye white */}
      <mesh scale={[1, scaleY, 1]}>
        <sphereGeometry args={[eyeSize, 8, 6]} />
        <meshStandardMaterial color={0xdddddd} roughness={0.3} />
      </mesh>
      {/* Pupil */}
      <mesh position={[gazeX * 0.025, gazeY * 0.02 * scaleY, 0.04]} scale={[1, scaleY, 1]}>
        <sphereGeometry args={[pupilSize, 6, 4]} />
        <meshStandardMaterial color={0x111111} roughness={0.5} />
      </mesh>
    </group>
  );
}

interface BrowProps {
  position: [number, number, number];
  emotion: ActorEmotion;
  side: 'left' | 'right';
}

function Brow({ position, emotion, side }: BrowProps) {
  const angle = (() => {
    switch (emotion) {
      case 'sad': return side === 'left' ? 0.25 : -0.25;
      case 'angry': return side === 'left' ? -0.3 : 0.3;
      case 'nervous': return side === 'left' ? 0.15 : -0.15;
      case 'happy': return side === 'left' ? -0.1 : 0.1;
      default: return 0;
    }
  })();

  return (
    <mesh position={position} rotation={[0, 0, angle]}>
      <boxGeometry args={[0.07, 0.015, 0.01]} />
      <meshStandardMaterial color={0x333333} roughness={0.8} />
    </mesh>
  );
}

interface MouthProps {
  emotion: ActorEmotion;
}

function Mouth({ emotion }: MouthProps) {
  const lineRef = useRef<THREE.Line>(null);

  const geometry = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    const segments = 8;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const x = (t - 0.5) * 0.06;
      let y = 0;
      switch (emotion) {
        case 'happy': case 'excited': y = -Math.sin(t * Math.PI) * 0.012; break;
        case 'sad': case 'exhausted': y = Math.sin(t * Math.PI) * 0.012; break;
        case 'angry': y = Math.sin(t * Math.PI) * 0.008; break;
        case 'nervous': y = Math.sin(t * Math.PI * 2) * 0.005; break;
        case 'awkward': y = (t < 0.5 ? -1 : 1) * 0.005; break;
        default: y = 0;
      }
      pts.push(new THREE.Vector3(x, y, 0));
    }
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [emotion]);

  const material = useMemo(() => new THREE.LineBasicMaterial({ color: 0x333333 }), []);

  return <primitive ref={lineRef} object={new THREE.Line(geometry, material)} />;
}

interface CharacterMeshProps {
  actor: Actor;
  index: number;
}

export default function CharacterMesh({ actor, index }: CharacterMeshProps) {
  const groupRef = useRef<THREE.Group>(null);
  const blinkTimer = useRef(0);
  const blinkPhase = useRef(0);
  const nextBlink = useRef(2.5 + Math.random() * 3);
  const gazeRef = useRef({ x: 0, y: 0 });
  const breathRef = useRef(0);

  const color = EMOTION_COLORS[actor.emotionState] ?? EMOTION_COLORS.neutral;
  const posture = EMOTION_POSTURE[actor.emotionState] ?? EMOTION_POSTURE.neutral;

  // Map 2D scene position to 3D world position
  const worldX = (actor.position.x - 480) / 100;
  const worldZ = (actor.position.y - 270) / 100;

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Smooth position interpolation
    const target = new THREE.Vector3(worldX, 0, worldZ);
    groupRef.current.position.lerp(target, 0.08);

    // Breathing animation
    breathRef.current += delta * (actor.emotionState === 'nervous' ? 4 : actor.emotionState === 'exhausted' ? 1.5 : 2.5);
    const breathScale = 1 + Math.sin(breathRef.current) * 0.008;
    groupRef.current.scale.setScalar(breathScale);

    // Blink system
    blinkTimer.current += delta;
    if (blinkTimer.current > nextBlink.current) {
      blinkPhase.current = 1;
      blinkTimer.current = 0;
      nextBlink.current = 2.5 + Math.random() * 3.5;
    }
    if (blinkPhase.current > 0) {
      blinkPhase.current = Math.max(0, blinkPhase.current - delta * 8);
    }

    // Gaze — nervous = jittery, sad = down, target-based
    if (actor.emotionState === 'nervous') {
      gazeRef.current.x += (Math.random() - 0.5) * 0.3;
      gazeRef.current.y += (Math.random() - 0.5) * 0.2;
      gazeRef.current.x *= 0.9;
      gazeRef.current.y *= 0.9;
    } else if (actor.emotionState === 'sad' || actor.emotionState === 'exhausted') {
      gazeRef.current.x *= 0.95;
      gazeRef.current.y += ((-0.5) - gazeRef.current.y) * 0.05;
    } else {
      gazeRef.current.x *= 0.95;
      gazeRef.current.y *= 0.95;
    }
  });

  // Walking animation
  const isWalking = actor.currentAction === 'walking' || actor.currentAction === 'approaching' || actor.currentAction === 'pacing';

  return (
    <group ref={groupRef} position={[worldX, 0, worldZ]}>
      {/* Body/Torso */}
      <mesh position={[0, 0.9 - posture.shoulderDrop, 0]} rotation={[posture.lean, 0, 0]} castShadow>
        <capsuleGeometry args={[0.12, 0.5, 4, 8]} />
        <meshStandardMaterial color={color} roughness={0.7} metalness={0.1} />
      </mesh>

      {/* Head */}
      <group position={[0, 1.55 - posture.shoulderDrop, 0]} rotation={[posture.headTilt, 0, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 12, 8]} />
          <meshStandardMaterial color={color} roughness={0.6} metalness={0.1} />
        </mesh>

        {/* Face */}
        <group position={[0, 0, 0.14]}>
          <Eye
            position={[-0.055, 0.03, 0]}
            emotion={actor.emotionState}
            blinkPhase={blinkPhase.current}
            gazeX={gazeRef.current.x}
            gazeY={gazeRef.current.y}
          />
          <Eye
            position={[0.055, 0.03, 0]}
            emotion={actor.emotionState}
            blinkPhase={blinkPhase.current}
            gazeX={gazeRef.current.x}
            gazeY={gazeRef.current.y}
          />
          <Brow position={[-0.055, 0.09, 0]} emotion={actor.emotionState} side="left" />
          <Brow position={[0.055, 0.09, 0]} emotion={actor.emotionState} side="right" />
          <group position={[0, -0.04, 0.02]}>
            <Mouth emotion={actor.emotionState} />
          </group>
        </group>
      </group>

      {/* Left Arm */}
      <mesh
        position={[-0.22, 0.85 - posture.shoulderDrop, 0]}
        rotation={[0, 0, posture.armAngle + (isWalking ? Math.sin(Date.now() * 0.005) * 0.3 : 0)]}
        castShadow
      >
        <capsuleGeometry args={[0.04, 0.35, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Right Arm */}
      <mesh
        position={[0.22, 0.85 - posture.shoulderDrop, 0]}
        rotation={[0, 0, -(posture.armAngle + (isWalking ? Math.sin(Date.now() * 0.005 + Math.PI) * 0.3 : 0))]}
        castShadow
      >
        <capsuleGeometry args={[0.04, 0.35, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>

      {/* Left Leg */}
      <mesh
        position={[-0.08, 0.3, 0]}
        rotation={[isWalking ? Math.sin(Date.now() * 0.005) * 0.4 : 0, 0, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.05, 0.35, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>

      {/* Right Leg */}
      <mesh
        position={[0.08, 0.3, 0]}
        rotation={[isWalking ? Math.sin(Date.now() * 0.005 + Math.PI) * 0.4 : 0, 0, 0]}
        castShadow
      >
        <capsuleGeometry args={[0.05, 0.35, 4, 6]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>

      {/* Label */}
      {actor.label && (
        <group position={[0, 2.0, 0]}>
          <mesh>
            <planeGeometry args={[0.8, 0.18]} />
            <meshBasicMaterial color={0x000000} transparent opacity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
}
