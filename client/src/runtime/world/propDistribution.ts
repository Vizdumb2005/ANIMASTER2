import type { CompositionZone, ProceduralProp, VisualDensity, SceneTone } from '@animaster/shared/scene';

interface PropDistributionParams {
  propPool: string[];
  zones: CompositionZone[];
  density: VisualDensity;
  tone: string;
  keyProps: string[];
  seed: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const DENSITY_COUNTS: Record<VisualDensity, { min: number; max: number }> = {
  sparse: { min: 2, max: 5 },
  moderate: { min: 5, max: 10 },
  dense: { min: 8, max: 16 },
  cluttered: { min: 12, max: 22 },
};

const TONE_PROP_WEIGHT: Record<string, Record<string, number>> = {
  lonely: { bench: 2, streetlight: 1.5, empty_space: 3 },
  tense: { crate: 1.5, pipe: 1.5, pillar: 2, barrier: 2 },
  romantic: { lamp: 2, bench: 2, plant: 1.5, candle: 2 },
  sad: { bench: 2, window: 1.5, puddle: 1.5 },
  threatening: { dumpster: 1.5, chain: 2, pipe: 1.5, barrel: 1.5 },
  energetic: { neon_sign: 2, vending_machine: 1.5, hydrant: 1 },
  awkward: { bench: 1.5, plant: 1, water_cooler: 2 },
  neutral: {},
};

const LIGHT_EMITTING_PROPS = new Set([
  'streetlight', 'neon_sign', 'lamp', 'candle', 'monitor_screen',
  'vending_machine', 'flickering_sign', 'jukebox', 'path_lamp',
]);

const PROP_LIGHT_COLORS: Record<string, number> = {
  streetlight: 0xffdd88,
  neon_sign: 0xff2255,
  lamp: 0xffcc88,
  candle: 0xffaa44,
  monitor_screen: 0x4488ff,
  vending_machine: 0x3355cc,
  flickering_sign: 0xff6622,
  jukebox: 0xff44aa,
  path_lamp: 0xffdd88,
};

export function distributeProps(params: PropDistributionParams): ProceduralProp[] {
  const rng = seededRandom(params.seed);
  const props: ProceduralProp[] = [];

  const range = DENSITY_COUNTS[params.density];
  const targetCount = Math.floor(range.min + rng() * (range.max - range.min));

  // Build weighted pool
  const toneWeights = TONE_PROP_WEIGHT[params.tone] ?? {};
  const weightedPool: Array<{ type: string; weight: number }> = [];

  // Key props get highest weight
  for (const kp of params.keyProps) {
    if (params.propPool.includes(kp)) {
      weightedPool.push({ type: kp, weight: 5 });
    }
  }

  for (const propType of params.propPool) {
    if (params.keyProps.includes(propType)) continue;
    const w = toneWeights[propType] ?? 1;
    weightedPool.push({ type: propType, weight: w });
  }

  if (weightedPool.length === 0) return props;

  const totalWeight = weightedPool.reduce((s, p) => s + p.weight, 0);

  // Place props in zones
  const placementZones = params.zones.filter(
    (z) => z.type !== 'negative_space'
  );

  for (let i = 0; i < targetCount; i++) {
    // Pick prop type by weight
    let r = rng() * totalWeight;
    let selectedType = weightedPool[0].type;
    for (const wp of weightedPool) {
      r -= wp.weight;
      if (r <= 0) {
        selectedType = wp.type;
        break;
      }
    }

    // Pick zone
    const zone = placementZones[Math.floor(rng() * placementZones.length)];
    const x = zone.bounds.xMin + rng() * (zone.bounds.xMax - zone.bounds.xMin);
    const z = zone.bounds.zMin + rng() * (zone.bounds.zMax - zone.bounds.zMin);
    const y = 0;

    const isLight = LIGHT_EMITTING_PROPS.has(selectedType);

    props.push({
      id: `prop-${i}`,
      type: selectedType,
      position: { x, y, z },
      rotation: rng() * Math.PI * 2,
      scale: 0.8 + rng() * 0.4,
      tags: [params.tone, zone.type],
      lightEmit: isLight,
      lightColor: isLight ? (PROP_LIGHT_COLORS[selectedType] ?? 0xffdd88) : undefined,
      lightIntensity: isLight ? 0.3 + rng() * 0.4 : undefined,
    });
  }

  return props;
}

export function filterPropsForTone(props: ProceduralProp[], tone: SceneTone): ProceduralProp[] {
  if (tone === 'lonely') {
    return props.filter((_, i) => i % 2 === 0);
  }
  if (tone === 'tense' || tone === 'threatening') {
    return props.map((p) => ({
      ...p,
      position: {
        ...p.position,
        x: p.position.x * 0.7,
        z: p.position.z * 0.8,
      },
    }));
  }
  return props;
}
