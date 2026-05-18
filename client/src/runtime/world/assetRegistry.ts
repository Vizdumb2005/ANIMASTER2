import type { ProceduralProp } from '@animaster/shared/scene';

interface AssetEntry {
  id: string;
  type: 'prop' | 'environment' | 'character' | 'effect';
  tags: string[];
  toneAffinity: string[];
  environmentAffinity: string[];
  scale: number;
  emitsLight: boolean;
  lightColor?: number;
  lightIntensity?: number;
}

const ASSET_REGISTRY: AssetEntry[] = [
  // Urban props
  { id: 'vending_machine', type: 'prop', tags: ['urban', 'indoor', 'machine'], toneAffinity: ['lonely', 'neutral', 'tense'], environmentAffinity: ['subway', 'hallway', 'hospital', 'office'], scale: 1.0, emitsLight: true, lightColor: 0x4488ff, lightIntensity: 0.3 },
  { id: 'neon_sign', type: 'prop', tags: ['urban', 'light', 'signage'], toneAffinity: ['tense', 'lonely', 'neutral'], environmentAffinity: ['alley', 'outdoor_street', 'diner', 'subway'], scale: 1.0, emitsLight: true, lightColor: 0xff2266, lightIntensity: 0.5 },
  { id: 'streetlight', type: 'prop', tags: ['outdoor', 'light', 'urban'], toneAffinity: ['lonely', 'sad', 'tense', 'neutral'], environmentAffinity: ['outdoor_street', 'outdoor_park', 'alley', 'parking_garage'], scale: 1.2, emitsLight: true, lightColor: 0xffaa44, lightIntensity: 0.6 },
  { id: 'bench', type: 'prop', tags: ['outdoor', 'seating', 'rest'], toneAffinity: ['sad', 'lonely', 'neutral'], environmentAffinity: ['outdoor_park', 'outdoor_street', 'subway', 'hospital'], scale: 1.0, emitsLight: false },
  { id: 'trash_can', type: 'prop', tags: ['urban', 'decay', 'small'], toneAffinity: ['neutral', 'tense', 'lonely'], environmentAffinity: ['outdoor_street', 'alley', 'subway', 'parking_garage'], scale: 0.8, emitsLight: false },
  { id: 'fire_escape', type: 'prop', tags: ['urban', 'metal', 'vertical'], toneAffinity: ['tense', 'lonely'], environmentAffinity: ['alley', 'outdoor_street', 'rooftop'], scale: 1.5, emitsLight: false },
  { id: 'dumpster', type: 'prop', tags: ['urban', 'decay', 'large'], toneAffinity: ['tense', 'lonely', 'sad'], environmentAffinity: ['alley', 'parking_garage', 'warehouse'], scale: 1.2, emitsLight: false },

  // Indoor props
  { id: 'desk_lamp', type: 'prop', tags: ['indoor', 'light', 'small'], toneAffinity: ['neutral', 'sad', 'lonely'], environmentAffinity: ['office', 'apartment', 'indoor_room'], scale: 0.5, emitsLight: true, lightColor: 0xffdd88, lightIntensity: 0.3 },
  { id: 'bookshelf', type: 'prop', tags: ['indoor', 'furniture', 'large'], toneAffinity: ['neutral', 'sad'], environmentAffinity: ['apartment', 'office', 'indoor_room'], scale: 1.0, emitsLight: false },
  { id: 'coffee_cup', type: 'prop', tags: ['indoor', 'small', 'personal'], toneAffinity: ['neutral', 'sad', 'lonely', 'awkward'], environmentAffinity: ['diner', 'office', 'apartment', 'indoor_room'], scale: 0.3, emitsLight: false },
  { id: 'clock', type: 'prop', tags: ['indoor', 'time', 'wall'], toneAffinity: ['tense', 'neutral', 'lonely'], environmentAffinity: ['hospital', 'office', 'indoor_room', 'hallway'], scale: 0.6, emitsLight: false },
  { id: 'gurney', type: 'prop', tags: ['medical', 'indoor'], toneAffinity: ['tense', 'sad'], environmentAffinity: ['hospital', 'hallway'], scale: 1.0, emitsLight: false },
  { id: 'chair', type: 'prop', tags: ['indoor', 'seating', 'small'], toneAffinity: ['neutral', 'sad', 'lonely', 'awkward'], environmentAffinity: ['office', 'hospital', 'apartment', 'indoor_room', 'diner'], scale: 0.8, emitsLight: false },
  { id: 'filing_cabinet', type: 'prop', tags: ['indoor', 'furniture', 'office'], toneAffinity: ['neutral', 'tense'], environmentAffinity: ['office', 'warehouse'], scale: 1.0, emitsLight: false },

  // Natural props
  { id: 'rock', type: 'prop', tags: ['natural', 'outdoor'], toneAffinity: ['neutral', 'sad', 'lonely'], environmentAffinity: ['outdoor_park', 'outdoor_forest', 'outdoor_beach', 'rooftop'], scale: 0.7, emitsLight: false },
  { id: 'fallen_log', type: 'prop', tags: ['natural', 'outdoor', 'organic'], toneAffinity: ['sad', 'lonely', 'neutral'], environmentAffinity: ['outdoor_forest', 'outdoor_park'], scale: 1.0, emitsLight: false },
  { id: 'puddle', type: 'prop', tags: ['natural', 'water', 'ground'], toneAffinity: ['sad', 'lonely', 'tense'], environmentAffinity: ['outdoor_street', 'alley', 'parking_garage'], scale: 1.0, emitsLight: false },

  // Atmospheric props
  { id: 'candle', type: 'prop', tags: ['light', 'small', 'warm'], toneAffinity: ['romantic', 'sad', 'lonely'], environmentAffinity: ['apartment', 'indoor_room', 'diner'], scale: 0.3, emitsLight: true, lightColor: 0xff8844, lightIntensity: 0.2 },
  { id: 'cigarette', type: 'prop', tags: ['small', 'personal', 'atmosphere'], toneAffinity: ['tense', 'lonely', 'neutral'], environmentAffinity: ['alley', 'rooftop', 'diner', 'outdoor_street'], scale: 0.2, emitsLight: true, lightColor: 0xff4400, lightIntensity: 0.05 },
  { id: 'phone', type: 'prop', tags: ['small', 'personal', 'modern'], toneAffinity: ['neutral', 'lonely', 'sad', 'awkward'], environmentAffinity: ['apartment', 'office', 'indoor_room', 'diner', 'subway'], scale: 0.2, emitsLight: true, lightColor: 0x4488ff, lightIntensity: 0.1 },

  // Industrial props
  { id: 'barrel', type: 'prop', tags: ['industrial', 'large'], toneAffinity: ['tense', 'neutral'], environmentAffinity: ['warehouse', 'parking_garage', 'alley'], scale: 1.0, emitsLight: false },
  { id: 'crate', type: 'prop', tags: ['industrial', 'large', 'stackable'], toneAffinity: ['neutral', 'tense'], environmentAffinity: ['warehouse', 'alley', 'parking_garage'], scale: 0.9, emitsLight: false },
  { id: 'pallet', type: 'prop', tags: ['industrial', 'ground'], toneAffinity: ['neutral'], environmentAffinity: ['warehouse', 'parking_garage'], scale: 1.0, emitsLight: false },
];

const assetCache = new Map<string, AssetEntry[]>();

function getCacheKey(envType: string, tone: string): string {
  return `${envType}:${tone}`;
}

export function queryAssets(envType: string, tone: string, tags?: string[]): AssetEntry[] {
  const cacheKey = getCacheKey(envType, tone) + (tags ? `:${tags.join(',')}` : '');
  const cached = assetCache.get(cacheKey);
  if (cached) return cached;

  let results = ASSET_REGISTRY.filter((entry) => {
    const envMatch = entry.environmentAffinity.includes(envType);
    const toneMatch = entry.toneAffinity.includes(tone);
    return envMatch || toneMatch;
  });

  if (tags && tags.length > 0) {
    results = results.filter((entry) =>
      tags.some((tag) => entry.tags.includes(tag))
    );
  }

  results.sort((a, b) => {
    const aEnv = a.environmentAffinity.includes(envType) ? 1 : 0;
    const bEnv = b.environmentAffinity.includes(envType) ? 1 : 0;
    const aTone = a.toneAffinity.includes(tone) ? 1 : 0;
    const bTone = b.toneAffinity.includes(tone) ? 1 : 0;
    return (bEnv + bTone) - (aEnv + aTone);
  });

  assetCache.set(cacheKey, results);
  return results;
}

export function getAssetById(id: string): AssetEntry | undefined {
  return ASSET_REGISTRY.find((entry) => entry.id === id);
}

export function assetToProceduralProp(
  asset: AssetEntry,
  position: { x: number; y: number; z: number },
  seed: number
): ProceduralProp {
  return {
    id: `${asset.id}_${seed}`,
    type: asset.id,
    position,
    scale: asset.scale,
    tags: asset.tags,
    lightEmit: asset.emitsLight,
    lightColor: asset.lightColor,
    lightIntensity: asset.lightIntensity,
  };
}

export function clearAssetCache(): void {
  assetCache.clear();
}

export function getRegistryStats(): { total: number; byType: Record<string, number> } {
  const byType: Record<string, number> = {};
  for (const entry of ASSET_REGISTRY) {
    byType[entry.type] = (byType[entry.type] ?? 0) + 1;
  }
  return { total: ASSET_REGISTRY.length, byType };
}
