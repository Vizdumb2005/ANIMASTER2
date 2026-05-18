import { useMemo } from 'react';
import * as THREE from 'three';
import type { WorldLayout, VisualStyleProfile } from '@animaster/shared/scene';

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
  alley: {
    groundColor: 0x151515, wallColor: 0x1a1a20, ceilingColor: 0x080810,
    skyColor: 0x060610, fogColor: 0x0a0a12, fogNear: 5, fogFar: 18,
    hasWalls: true, hasCeiling: false, hasSkyline: true, groundY: 0,
  },
  parking_garage: {
    groundColor: 0x1a1a1a, wallColor: 0x222228, ceilingColor: 0x151518,
    skyColor: 0x080808, fogColor: 0x101012, fogNear: 6, fogFar: 20,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  diner: {
    groundColor: 0x2a2018, wallColor: 0x352a20, ceilingColor: 0x251a15,
    skyColor: 0x0a0a12, fogColor: 0x1a1510, fogNear: 8, fogFar: 22,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  office: {
    groundColor: 0x2a2a30, wallColor: 0x353540, ceilingColor: 0x2a2a35,
    skyColor: 0x0a0a15, fogColor: 0x1a1a22, fogNear: 8, fogFar: 25,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
  warehouse: {
    groundColor: 0x1a1a18, wallColor: 0x222220, ceilingColor: 0x151515,
    skyColor: 0x080808, fogColor: 0x101010, fogNear: 8, fogFar: 30,
    hasWalls: true, hasCeiling: true, hasSkyline: false, groundY: 0,
  },
};

function getConfig(envType: string): EnvConfig {
  return ENV_CONFIGS[envType] ?? ENV_CONFIGS.indoor_room;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

function SkylineBuildings({ count, seed, style }: { count: number; seed: number; style: string }) {
  const buildings = useMemo(() => {
    const result: Array<{ x: number; width: number; height: number; depth: number; color: number }> = [];
    const rng = seededRandom(seed);
    const isCityPanorama = style === 'city_panorama' || style === 'city_skyline';
    const isNarrow = style === 'narrow_buildings';
    const buildingCount = isCityPanorama ? Math.floor(count * 1.5) : count;
    for (let i = 0; i < buildingCount; i++) {
      const spacing = isNarrow ? 1.5 : 2.5;
      const x = (i - buildingCount / 2) * spacing + rng() * 1.5 - 0.75;
      const baseWidth = isNarrow ? 0.6 : 0.8;
      const width = baseWidth + rng() * (isNarrow ? 1.0 : 1.8);
      const baseHeight = isCityPanorama ? 3 : 2;
      const height = baseHeight + rng() * (isCityPanorama ? 12 : 8);
      const depth = 0.5 + rng() * 1;
      const shade = 0x08 + Math.floor(rng() * 0x12);
      const color = (shade << 16) | (shade << 8) | (shade + 5);
      result.push({ x, width, height, depth, color });
    }
    return result;
  }, [count, seed, style]);

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

function Trees({ count, seed, spread }: { count: number; seed: number; spread: number }) {
  const trees = useMemo(() => {
    const result: Array<{ x: number; z: number; trunkH: number; canopyR: number; lean: number }> = [];
    const rng = seededRandom(seed + 42);
    for (let i = 0; i < count; i++) {
      result.push({
        x: (rng() - 0.5) * spread,
        z: -3 - rng() * 12,
        trunkH: 0.8 + rng() * 1.2,
        canopyR: 0.6 + rng() * 1.0,
        lean: (rng() - 0.5) * 0.15,
      });
    }
    return result;
  }, [count, seed, spread]);

  return (
    <group>
      {trees.map((t, i) => (
        <group key={i} position={[t.x, 0, t.z]} rotation={[0, 0, t.lean]}>
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

function WallPanels({ config, width, variation }: { config: EnvConfig; width: number; variation: string }) {
  const panelDetails = useMemo(() => {
    const isHallway = variation === 'tile_grid' && width <= 10;
    const wallWidth = isHallway ? 8 : width;
    const wallHeight = isHallway ? 4 : 5;
    return { wallWidth, wallHeight };
  }, [width, variation]);

  return (
    <group>
      <mesh position={[0, panelDetails.wallHeight / 2, -6]} receiveShadow>
        <planeGeometry args={[panelDetails.wallWidth, panelDetails.wallHeight]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[-panelDetails.wallWidth / 2, panelDetails.wallHeight / 2, -3]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, panelDetails.wallHeight]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[panelDetails.wallWidth / 2, panelDetails.wallHeight / 2, -3]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[6, panelDetails.wallHeight]} />
        <meshStandardMaterial color={config.wallColor} roughness={0.85} metalness={0.05} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

function DepthFogLayers({ count, fogColor, baseOpacity }: { count: number; fogColor: number; baseOpacity: number }) {
  const layers = useMemo(() => {
    const result: Array<{ z: number; opacity: number; height: number }> = [];
    for (let i = 0; i < count; i++) {
      result.push({
        z: -(4 + i * 4),
        opacity: baseOpacity * (0.3 + (i / (count || 1)) * 0.4),
        height: 3 + i * 2,
      });
    }
    return result;
  }, [count, fogColor, baseOpacity]);

  return (
    <group>
      {layers.map((layer, i) => (
        <mesh key={i} position={[0, layer.height / 2, layer.z]}>
          <planeGeometry args={[30, layer.height]} />
          <meshBasicMaterial color={fogColor} transparent opacity={layer.opacity} side={THREE.DoubleSide} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function ParallaxLayers({ envType, seed }: { envType: string; seed: number }) {
  const layers = useMemo(() => {
    const rng = seededRandom(seed + 99);
    const result: Array<{ z: number; color: number; opacity: number; elements: Array<{ x: number; w: number; h: number }> }> = [];
    const baseColor = getConfig(envType).wallColor;
    for (let i = 0; i < 3; i++) {
      const darken = Math.max(0, 1 - i * 0.3);
      const r = ((baseColor >> 16) & 0xff) * darken;
      const g = ((baseColor >> 8) & 0xff) * darken;
      const b = (baseColor & 0xff) * darken;
      const color = (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b);
      const elements: Array<{ x: number; w: number; h: number }> = [];
      const elCount = 3 + Math.floor(rng() * 4);
      for (let j = 0; j < elCount; j++) {
        elements.push({ x: (rng() - 0.5) * 20, w: 0.5 + rng() * 3, h: 1 + rng() * 6 });
      }
      result.push({ z: -(8 + i * 5), color, opacity: 0.4 - i * 0.1, elements });
    }
    return result;
  }, [envType, seed]);

  return (
    <group>
      {layers.map((layer, li) => (
        <group key={li}>
          {layer.elements.map((el, ei) => (
            <mesh key={ei} position={[el.x, el.h / 2, layer.z]}>
              <boxGeometry args={[el.w, el.h, 0.1]} />
              <meshBasicMaterial color={layer.color} transparent opacity={layer.opacity} />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}

function GroundVariation({ variation, groundColor }: { variation: string; groundColor: number }) {
  if (variation === 'tile_grid') {
    return (
      <group position={[0, 0.005, 0]}>
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`h-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (i - 6) * 1.2]}>
            <planeGeometry args={[14, 0.02]} />
            <meshStandardMaterial color={groundColor + 0x111111} roughness={0.8} />
          </mesh>
        ))}
        {Array.from({ length: 12 }).map((_, i) => (
          <mesh key={`v-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 6) * 1.2, 0, 0]}>
            <planeGeometry args={[0.02, 14]} />
            <meshStandardMaterial color={groundColor + 0x111111} roughness={0.8} />
          </mesh>
        ))}
      </group>
    );
  }
  if (variation === 'checkered_tile') {
    return (
      <group position={[0, 0.003, 0]}>
        {Array.from({ length: 10 }).map((_, i) =>
          Array.from({ length: 10 }).map((_, j) => (
            (i + j) % 2 === 0 ? (
              <mesh key={`${i}-${j}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 5) * 1.2, 0, (j - 5) * 1.2]}>
                <planeGeometry args={[1.18, 1.18]} />
                <meshStandardMaterial color={groundColor + 0x0a0a0a} roughness={0.7} />
              </mesh>
            ) : null
          ))
        )}
      </group>
    );
  }
  if (variation === 'sand_waves') {
    return (
      <group position={[0, 0.01, 0]}>
        {Array.from({ length: 8 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, (i - 4) * 2 + 0.5]}>
            <planeGeometry args={[20, 0.3]} />
            <meshStandardMaterial color={groundColor + 0x050505} roughness={0.95} />
          </mesh>
        ))}
      </group>
    );
  }
  if (variation === 'concrete_stained') {
    return (
      <group position={[0, 0.003, 0]}>
        {Array.from({ length: 5 }).map((_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 2) * 3, 0, (i % 3) * 2 - 2]}>
            <circleGeometry args={[0.5 + i * 0.2, 8]} />
            <meshStandardMaterial color={0x0a0a08} roughness={0.95} transparent opacity={0.3} />
          </mesh>
        ))}
      </group>
    );
  }
  return null;
}

function StructuralDetails({ envType, seed }: { envType: string; seed: number }) {
  const rng = seededRandom(seed + 200);
  if (envType === 'subway') {
    return (
      <group>
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
        <mesh position={[0, 0.15, 0.5]}>
          <boxGeometry args={[12, 0.3, 0.3]} />
          <meshStandardMaterial color={0x333335} roughness={0.7} metalness={0.2} />
        </mesh>
        <mesh position={[0, 2.5, -8]}>
          <torusGeometry args={[2.5, 0.2, 6, 12, Math.PI]} />
          <meshStandardMaterial color={0x1a1a1a} roughness={0.9} />
        </mesh>
      </group>
    );
  }
  if (envType === 'rooftop') {
    return (
      <group>
        <mesh position={[0, 0.4, -4]}><boxGeometry args={[12, 0.8, 0.4]} /><meshStandardMaterial color={0x353535} roughness={0.9} /></mesh>
        <mesh position={[-4, 0.6, -2]}><boxGeometry args={[0.8, 1.2, 0.6]} /><meshStandardMaterial color={0x404040} roughness={0.8} metalness={0.2} /></mesh>
        <mesh position={[5, 0.45, -3]}><boxGeometry args={[0.6, 0.9, 0.5]} /><meshStandardMaterial color={0x383838} roughness={0.8} metalness={0.2} /></mesh>
        <mesh position={[3, 1.5, -3.5]}><cylinderGeometry args={[0.02, 0.02, 3, 4]} /><meshStandardMaterial color={0x444444} roughness={0.5} metalness={0.4} /></mesh>
      </group>
    );
  }
  if (envType === 'outdoor_beach') {
    return (
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 5]}>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color={0x0a2040} roughness={0.1} metalness={0.2} transparent opacity={0.7} />
      </mesh>
    );
  }
  if (envType === 'alley') {
    return (
      <group>
        <mesh position={[-3.5, 3, -3]} receiveShadow><boxGeometry args={[0.3, 6, 10]} /><meshStandardMaterial color={0x1a1a20} roughness={0.9} /></mesh>
        <mesh position={[3.5, 3.5, -3]} receiveShadow><boxGeometry args={[0.3, 7, 10]} /><meshStandardMaterial color={0x181820} roughness={0.9} /></mesh>
        <mesh position={[-3.2, 2.5, -1]}><boxGeometry args={[0.8, 0.05, 0.6]} /><meshStandardMaterial color={0x333338} roughness={0.6} metalness={0.4} /></mesh>
        <mesh position={[-3.2, 4, -2]}><boxGeometry args={[0.8, 0.05, 0.6]} /><meshStandardMaterial color={0x333338} roughness={0.6} metalness={0.4} /></mesh>
      </group>
    );
  }
  if (envType === 'parking_garage') {
    const pillars: Array<[number, number]> = [];
    for (let i = 0; i < 4; i++) { pillars.push([-4 + i * 3, -2 - rng() * 2]); }
    return (
      <group>
        {pillars.map(([x, z], i) => (
          <mesh key={i} position={[x, 2.5, z]}>
            <cylinderGeometry args={[0.2, 0.2, 5, 8]} />
            <meshStandardMaterial color={0x2a2a30} roughness={0.7} metalness={0.2} />
          </mesh>
        ))}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, -1]}>
          <planeGeometry args={[0.1, 8]} />
          <meshStandardMaterial color={0x888820} roughness={0.8} />
        </mesh>
      </group>
    );
  }
  if (envType === 'diner') {
    return (
      <group>
        <mesh position={[0, 0.5, -3]}><boxGeometry args={[6, 1, 0.4]} /><meshStandardMaterial color={0x3a2a1a} roughness={0.7} /></mesh>
        {[-2, -1, 0, 1, 2].map((x, i) => (
          <group key={i} position={[x, 0, -2.5]}>
            <mesh position={[0, 0.35, 0]}><cylinderGeometry args={[0.15, 0.15, 0.7, 8]} /><meshStandardMaterial color={0x444448} roughness={0.5} metalness={0.3} /></mesh>
            <mesh position={[0, 0.75, 0]}><cylinderGeometry args={[0.2, 0.2, 0.08, 12]} /><meshStandardMaterial color={0x882222} roughness={0.8} /></mesh>
          </group>
        ))}
      </group>
    );
  }
  if (envType === 'warehouse') {
    return (
      <group>
        {[-4, 4].map((x, i) => (
          <group key={i} position={[x, 0, -3]}>
            {[1, 2, 3].map((y) => (
              <mesh key={y} position={[0, y, 0]}>
                <boxGeometry args={[2, 0.05, 0.8]} />
                <meshStandardMaterial color={0x333338} roughness={0.6} metalness={0.3} />
              </mesh>
            ))}
            {[-0.9, 0.9].map((sx, si) => (
              <mesh key={si} position={[sx, 2, 0]}>
                <boxGeometry args={[0.05, 4, 0.05]} />
                <meshStandardMaterial color={0x333338} roughness={0.6} metalness={0.3} />
              </mesh>
            ))}
          </group>
        ))}
      </group>
    );
  }
  if (envType === 'office') {
    return (
      <group>
        <mesh position={[-2, 0.4, -2]}><boxGeometry args={[1.5, 0.05, 0.8]} /><meshStandardMaterial color={0x3a3530} roughness={0.7} /></mesh>
        {[[-2.7, -2.35], [-2.7, -1.65], [-1.3, -2.35], [-1.3, -1.65]].map(([x, z], i) => (
          <mesh key={i} position={[x, 0.2, z]}>
            <cylinderGeometry args={[0.02, 0.02, 0.4, 4]} />
            <meshStandardMaterial color={0x333338} roughness={0.5} metalness={0.3} />
          </mesh>
        ))}
        <mesh position={[3, 2.5, -5.8]}>
          <planeGeometry args={[2, 2]} />
          <meshStandardMaterial color={0x2a2a35} roughness={0.6} transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </group>
    );
  }
  if (envType === 'staircase') {
    return (
      <group>
        {Array.from({ length: 6 }).map((_, i) => (
          <mesh key={i} position={[(i - 3) * 0.4, i * 0.3, -2 + i * 0.3]}>
            <boxGeometry args={[2, 0.15, 0.4]} />
            <meshStandardMaterial color={0x2a2520} roughness={0.9} />
          </mesh>
        ))}
        <mesh position={[1.2, 1.5, -1]}>
          <cylinderGeometry args={[0.02, 0.02, 3, 4]} />
          <meshStandardMaterial color={0x444448} roughness={0.5} metalness={0.4} />
        </mesh>
      </group>
    );
  }
  return null;
}

function ForegroundSilhouettes({ envType, seed }: { envType: string; seed: number }) {
  const isOutdoor = envType.startsWith('outdoor_') || envType === 'rooftop' || envType === 'alley';
  const elements = useMemo(() => {
    if (!isOutdoor) return [];
    const rng = seededRandom(seed + 500);
    const result: Array<{ x: number; width: number; height: number; color: number }> = [];
    const side = rng() > 0.5 ? -1 : 1;
    result.push({ x: side * 8, width: 1.5 + rng() * 2, height: 3 + rng() * 4, color: 0x050505 });
    if (rng() > 0.4) {
      result.push({ x: -side * 9, width: 1 + rng() * 1.5, height: 2 + rng() * 3, color: 0x060608 });
    }
    return result;
  }, [envType, seed, isOutdoor]);
  if (!isOutdoor) return null;
  return (
    <group>
      {elements.map((el, i) => (
        <mesh key={i} position={[el.x, el.height / 2, 2]}>
          <boxGeometry args={[el.width, el.height, 0.3]} />
          <meshBasicMaterial color={el.color} />
        </mesh>
      ))}
    </group>
  );
}

interface EnvironmentMeshProps {
  envType: string;
  tone?: string;
  worldLayout?: WorldLayout;
  visualStyle?: VisualStyleProfile;
}

export default function EnvironmentMesh({ envType, tone = 'neutral', worldLayout, visualStyle }: EnvironmentMeshProps) {
  const config = getConfig(envType);
  const seed = envType.length * 1337;
  const groundMaterial = useMemo(() => {
    return new THREE.MeshStandardMaterial({ color: config.groundColor, roughness: 0.92, metalness: 0.05 });
  }, [config.groundColor]);
  const isOutdoor = envType.startsWith('outdoor_') || envType === 'rooftop' || envType === 'alley';
  const groundVariation = worldLayout?.groundVariation ?? 'flat';
  const skylineType = worldLayout?.skylineType ?? (config.hasSkyline ? 'city_skyline' : 'none');
  const fogLayers = worldLayout?.fogLayers ?? (isOutdoor ? 2 : 1);

  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, config.groundY, 0]} receiveShadow material={groundMaterial}>
        <planeGeometry args={[30, 30]} />
      </mesh>
      <GroundVariation variation={groundVariation} groundColor={config.groundColor} />
      {config.hasWalls && <WallPanels config={config} width={14} variation={groundVariation} />}
      {config.hasCeiling && (
        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5, -3]}>
          <planeGeometry args={[14, 6]} />
          <meshStandardMaterial color={config.ceilingColor} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
      )}
      {skylineType !== 'none' && <SkylineBuildings count={20} seed={seed} style={skylineType} />}
      {(envType === 'outdoor_park' || envType === 'outdoor_forest' || envType === 'forest') && (
        <Trees count={envType === 'outdoor_forest' || envType === 'forest' ? 15 : 6} seed={777} spread={envType === 'outdoor_forest' || envType === 'forest' ? 16 : 12} />
      )}
      {skylineType === 'treeline' && <Trees count={20} seed={seed + 100} spread={25} />}
      {skylineType === 'horizon_water' && (
        <mesh position={[0, 0.5, -18]}>
          <planeGeometry args={[40, 8]} />
          <meshStandardMaterial color={0x0a2040} roughness={0.1} metalness={0.15} transparent opacity={0.5} />
        </mesh>
      )}
      <StructuralDetails envType={envType} seed={seed} />
      <DepthFogLayers count={fogLayers} fogColor={visualStyle?.fogColor ?? config.fogColor} baseOpacity={visualStyle?.fogDensity ?? 0.25} />
      {isOutdoor && <ParallaxLayers envType={envType} seed={seed} />}
      <ForegroundSilhouettes envType={envType} seed={seed} />
      <mesh position={[0, 8, -20]}>
        <planeGeometry args={[60, 25]} />
        <meshBasicMaterial color={visualStyle?.colorTint ?? config.skyColor} />
      </mesh>
    </group>
  );
}
