import { useMemo } from 'react';
import * as THREE from 'three';

type EnvType = string;

interface EnvConfig {
  groundColor: number;
  wallColor: number;
  ceilingColor: number;
  skyColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
  hasWalls: boolean;
  hasCeiling: boolean;
  hasSkyline: boolean;
  groundY: number;
}

const ENV_CONFIGS: Record<string, EnvConfig> = {
  indoor_room: {
    groundColor: 0x2a2520, wallColor: 0x3a3530, ceilingColor: 0x252020,
    skyColor: 0x0a0a12, fogColor: 0x1a1520, fogNear: 8, fogFar: 25,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  apartment: {
    groundColor: 0x3a3025, wallColor: 0x453828, ceilingColor: 0x302520,
    skyColor: 0x0a0a12, fogColor: 0x201a15, fogNear: 8, fogFar: 25,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  hallway: {
    groundColor: 0x252218, wallColor: 0x302820, ceilingColor: 0x201a15,
    skyColor: 0x080810, fogColor: 0x151210, fogNear: 5, fogFar: 18,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  hospital: {
    groundColor: 0x354045, wallColor: 0x405055, ceilingColor: 0x3a4548,
    skyColor: 0x101520, fogColor: 0x253035, fogNear: 6, fogFar: 20,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  subway: {
    groundColor: 0x1a1818, wallColor: 0x252220, ceilingColor: 0x151212,
    skyColor: 0x080808, fogColor: 0x121010, fogNear: 4, fogFar: 15,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  outdoor_street: {
    groundColor: 0x1a1a1a, wallColor: 0x252525, ceilingColor: 0x0a0a15,
    skyColor: 0x0a0a18, fogColor: 0x101018, fogNear: 10, fogFar: 40,
    hasWalls: false, hasCeiling: false, hasSkyline: true, groundY: 0,
  },
  outdoor_park: {
    groundColor: 0x1a2a15, wallColor: 0x0a1508, ceilingColor: 0x0a0a15,
    skyColor: 0x0a1020, fogColor: 0x0a1510, fogNear: 12, fogFar: 45,
    hasWalls: false, hasCeiling: false, hasSkyline: true, groundY: 0,
  },
  outdoor_beach: {
    groundColor: 0x3a3520, wallColor: 0x1a2030, ceilingColor: 0x152030,
    skyColor: 0x102040, fogColor: 0x152535, fogNear: 15, fogFar: 50,
    hasWalls: false, hasCeiling: false, hasSkyline: false, groundY: 0,
  },
  outdoor_forest: {
    groundColor: 0x15200a, wallColor: 0x0a1505, ceilingColor: 0x0a0a10,
    skyColor: 0x050a15, fogColor: 0x0a1008, fogNear: 6, fogFar: 20,
    hasWalls: false, hasCeiling: false, hasSkyline: false, groundY: 0,
  },
  rooftop: {
    groundColor: 0x252525, wallColor: 0x1a1a22, ceilingColor: 0x080815,
    skyColor: 0x080a18, fogColor: 0x0a0a15, fogNear: 15, fogFar: 50,
    hasWalls: false, hasCeiling: false, hasSkyline: true, groundY: 0,
  },
  staircase: {
    groundColor: 0x201a18, wallColor: 0x2a2520, ceilingColor: 0x1a1515,
    skyColor: 0x0a0810, fogColor: 0x151210, fogNear: 5, fogFar: 15,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
};

function getConfig(envType: string): EnvConfig {
  return ENV_CONFIGS[envType] ?? ENV_CONFIGS.indoor_room;
}

// Procedural building silhouettes for skylines
function SkylineBuildings({ count, seed }: { count: number; seed: number }) {
  const buildings = useMemo(() => {
    const result: Array<{ x: number; width: number; height: number; depth: number; color: number }> = [];
    let rng = seed;
    const next = () => { rng = (rng * 16807) % 2147483647; return (rng - 1) / 2147483646; };

    for (let i = 0; i < count; i++) {
      const x = (i - count / 2) * 2.5 + next() * 1.5 - 0.75;
      const width = 0.8 + next() * 1.8;
      const height = 2 + next() * 8;
      const depth = 0.5 + next() * 1;
      const shade = 0x08 + Math.floor(next() * 0x12);
      const color = (shade << 16) | (shade << 8) | (shade + 5);
      result.push({ x, width, height, depth, color });
    }
    return result;
  }, [count, seed]);

  return (
    <group position={[0, 0, -15]}>
      {buildings.map((b, i) => (
        <mesh key={i} position={[b.x, b.height / 2, -b.depth * i * 0.3]} castShadow>
          <boxGeometry args={[b.width, b.height, b.depth]} />
          <meshStandardMaterial color={b.color} roughness={0.9} metalness={0.1} />
        </mesh>
      ))}
    </group>
  );
}

// Procedural trees for parks/forests
function Trees({ count, seed, spread }: { count: number; seed: number; spread: number }) {
  const trees = useMemo(() => {
    const result: Array<{ x: number; z: number; trunkH: number; canopyR: number }> = [];
    let rng = seed + 42;
    const next = () => { rng = (rng * 16807) % 2147483647; return (rng - 1) / 2147483646; };

    for (let i = 0; i < count; i++) {
      result.push({
        x: (next() - 0.5) * spread,
        z: -3 - next() * 12,
        trunkH: 0.8 + next() * 1.2,
        canopyR: 0.6 + next() * 1.0,
      });
    }
    return result;
  }, [count, seed, spread]);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]}>
          <mesh position={[0, t.trunkH / 2, 0]}>
            <cylinderGeometry args={[0.06, 0.1, t.trunkH, 6]} />
            <meshStandardMaterial color={0x2a1a0a} roughness={1} />
          </mesh>
          <mesh position={[0, t.trunkH + t.canopyR * 0.5, 0]}>
            <sphereGeometry args={[t.canopyR, 8, 6]} />
            <meshStandardMaterial color={0x0a2008} roughness={0.9} transparent opacity={0.85} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// Indoor wall panels
function WallPanels({ config, width }: { config: EnvConfig; width: number }) {
  return (
    <group>
      {/* Back wall */}
      <mesh position={[0, 2.5, -6]} receiveShadow>
        <planeGeometry args={[width, 5]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>

      {/* Left wall */}
      <mesh position={[-width / 2, 2.5, -3]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>

      {/* Right wall */}
      <mesh position={[width / 2, 2.5, -3]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, 5]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

interface EnvironmentMeshProps {
  envType: string;
  tone?: string;
}

export default function EnvironmentMesh({ envType, tone = 'neutral' }: EnvironmentMeshProps) {
  const config = getConfig(envType);

  const groundMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: config.groundColor,
      roughness: 0.92,
      metalness: 0.05,
    });
  }, [config.groundColor]);

  const isOutdoor = envType.startsWith('outdoor_') || envType === 'rooftop';

  return (
    <group>
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, config.groundY, 0]} receiveShadow material={groundMaterial}>
        <planeGeometry args={[30, 30]} />
      </mesh>

      {/* Indoor walls */}
      {config.hasWalls && <WallPanels config={config} width={14} />}

      {/* Ceiling */}
      {config.hasCeiling && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -3]}>
          <planeGeometry args={[14, 6]} />
          <meshStandardMaterial color={config.ceilingColor} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Skyline for outdoor scenes */}
      {config.hasSkyline && <SkylineBuildings count={20} seed={envType.length * 1337} />}

      {/* Trees for parks/forests */}
      {(envType === 'outdoor_park' || envType === 'outdoor_forest') && (
        <Trees count={envType === 'outdoor_forest' ? 15 : 6} seed={777} spread={envType === 'outdoor_forest' ? 16 : 12} />
      )}

      {/* Subway tracks */}
      {envType === 'subway' && (
        <group position={[0, 0.01, 2]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[3, 20]} />
            <meshStandardMaterial color={0x0a0a0a} roughness={0.5} metalness={0.3} />
          </mesh>
          {[-0.8, 0.8].map((x, i) => (
            <mesh key={i} position={[x, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[0.08, 20]} />
              <meshStandardMaterial color={0x555555} roughness={0.3} metalness={0.7} />
            </mesh>
          ))}
        </group>
      )}

      {/* Hospital floor tiles pattern */}
      {envType === 'hospital' && (
        <group position={[0, 0.005, 0]}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (i - 5) * 1.2]}>
              <planeGeometry args={[14, 0.02]} />
              <meshStandardMaterial color={0x4a5560} roughness={0.8} />
            </mesh>
          ))}
        </group>
      )}

      {/* Rooftop ledge */}
      {envType === 'rooftop' && (
        <group>
          <mesh position={[0, 0.4, -4]}>
            <boxGeometry args={[12, 0.8, 0.4]} />
            <meshStandardMaterial color={0x353535} roughness={0.9} />
          </mesh>
          {/* Rooftop vent */}
          <mesh position={[-4, 0.6, -2]}>
            <boxGeometry args={[0.8, 1.2, 0.6]} />
            <meshStandardMaterial color={0x404040} roughness={0.8} metalness={0.2} />
          </mesh>
        </group>
      )}

      {/* Beach water plane */}
      {envType === 'outdoor_beach' && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 5]}>
          <planeGeometry args={[30, 20]} />
          <meshStandardMaterial color={0x0a2040} roughness={0.1} metalness={0.2} transparent opacity={0.7} />
        </mesh>
      )}

      {/* Sky backdrop */}
      <mesh position={[0, 8, -20]}>
        <planeGeometry args={[60, 25]} />
        <meshBasicMaterial color={config.skyColor} />
      </mesh>
    </group>
  );
}
