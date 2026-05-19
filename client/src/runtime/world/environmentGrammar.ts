import type {
  LocationType, SceneTone, LayoutStyle, LightingLanguage,
  VisualDensity, CompositionStyle, AtmosphereEffect,
} from '@animaster/shared/scene';

export interface EnvironmentGrammar {
  layoutPatterns: LayoutStyle[];
  lightingStyles: LightingLanguage[];
  atmosphereDefaults: AtmosphereEffect[];
  propPools: string[];
  compositionBias: CompositionStyle[];
  isIndoor: boolean;
  hasSkyline: boolean;
  defaultDensity: VisualDensity;
  depthLayers: number;
  groundVariation: string;
  skylineType: string;
  fogLayers: number;
}

export const ENVIRONMENT_GRAMMARS: Record<string, EnvironmentGrammar> = {
  subway: {
    layoutPatterns: ['long_corridor', 'enclosed_room'],
    lightingStyles: ['cold_fluorescent', 'harsh_overhead'],
    atmosphereDefaults: ['flicker', 'dust'],
    propPools: ['bench', 'pillar', 'vending_machine', 'flickering_sign', 'trash_can', 'wet_floor', 'ticket_machine', 'map_board'],
    compositionBias: ['depth_layering', 'foreground_obstruction'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'moderate',
    depthLayers: 4, groundVariation: 'tile_grid', skylineType: 'none', fogLayers: 2,
  },
  alley: {
    layoutPatterns: ['long_corridor', 'asymmetric'],
    lightingStyles: ['neon_glow', 'dramatic_spot', 'moonlit'],
    atmosphereDefaults: ['fog', 'dust'],
    propPools: ['dumpster', 'fire_escape', 'puddle', 'trash_bag', 'graffiti_wall', 'pipe', 'crate', 'neon_sign'],
    compositionBias: ['foreground_obstruction', 'asymmetric_tension', 'silhouette_framing'],
    isIndoor: false, hasSkyline: true,
    defaultDensity: 'dense',
    depthLayers: 3, groundVariation: 'wet_concrete', skylineType: 'narrow_buildings', fogLayers: 2,
  },
  rooftop: {
    layoutPatterns: ['open_space', 'asymmetric'],
    lightingStyles: ['moonlit', 'natural_soft', 'dramatic_spot'],
    atmosphereDefaults: ['dust'],
    propPools: ['vent_unit', 'water_tank', 'antenna', 'ledge', 'pipe', 'bench'],
    compositionBias: ['negative_space', 'silhouette_framing', 'depth_layering'],
    isIndoor: false, hasSkyline: true,
    defaultDensity: 'sparse',
    depthLayers: 4, groundVariation: 'flat_concrete', skylineType: 'city_panorama', fogLayers: 3,
  },
  forest: {
    layoutPatterns: ['open_space', 'asymmetric'],
    lightingStyles: ['natural_soft', 'moonlit', 'candlelit'],
    atmosphereDefaults: ['fog', 'dust'],
    propPools: ['tree', 'rock', 'fallen_log', 'bush', 'mushroom', 'stump', 'moss_patch'],
    compositionBias: ['silhouette_framing', 'foreground_obstruction', 'depth_layering'],
    isIndoor: false, hasSkyline: false,
    defaultDensity: 'dense',
    depthLayers: 5, groundVariation: 'earth_moss', skylineType: 'treeline', fogLayers: 3,
  },
  beach: {
    layoutPatterns: ['open_space'],
    lightingStyles: ['natural_soft', 'warm_practical', 'moonlit'],
    atmosphereDefaults: ['dust'],
    propPools: ['driftwood', 'rock', 'beach_chair', 'umbrella', 'boat', 'pier_post'],
    compositionBias: ['negative_space', 'centered_isolation', 'depth_layering'],
    isIndoor: false, hasSkyline: false,
    defaultDensity: 'sparse',
    depthLayers: 4, groundVariation: 'sand_waves', skylineType: 'horizon_water', fogLayers: 2,
  },
  apartment: {
    layoutPatterns: ['enclosed_room', 'split_level'],
    lightingStyles: ['warm_practical', 'candlelit', 'natural_soft'],
    atmosphereDefaults: ['dust'],
    propPools: ['couch', 'table', 'lamp', 'bookshelf', 'window', 'plant', 'rug', 'picture_frame'],
    compositionBias: ['centered_isolation', 'foreground_obstruction'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'moderate',
    depthLayers: 3, groundVariation: 'wood_floor', skylineType: 'none', fogLayers: 1,
  },
  hallway: {
    layoutPatterns: ['long_corridor'],
    lightingStyles: ['cold_fluorescent', 'harsh_overhead', 'dramatic_spot'],
    atmosphereDefaults: ['flicker'],
    propPools: ['door', 'window', 'fire_extinguisher', 'number_sign', 'pipe', 'light_panel'],
    compositionBias: ['depth_layering', 'foreground_obstruction', 'silhouette_framing'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'sparse',
    depthLayers: 4, groundVariation: 'tile_grid', skylineType: 'none', fogLayers: 2,
  },
  hospital: {
    layoutPatterns: ['long_corridor', 'enclosed_room'],
    lightingStyles: ['cold_fluorescent', 'harsh_overhead'],
    atmosphereDefaults: ['flicker'],
    propPools: ['bed', 'curtain', 'monitor', 'iv_stand', 'bench', 'window', 'cart', 'door'],
    compositionBias: ['centered_isolation', 'depth_layering'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'moderate',
    depthLayers: 3, groundVariation: 'tile_grid', skylineType: 'none', fogLayers: 1,
  },
  parking_garage: {
    layoutPatterns: ['open_space', 'long_corridor'],
    lightingStyles: ['cold_fluorescent', 'harsh_overhead', 'dramatic_spot'],
    atmosphereDefaults: ['dust', 'fog'],
    propPools: ['pillar', 'car_silhouette', 'barrier', 'sign', 'pipe', 'oil_stain', 'ramp_wall'],
    compositionBias: ['foreground_obstruction', 'depth_layering', 'asymmetric_tension'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'moderate',
    depthLayers: 4, groundVariation: 'concrete_stained', skylineType: 'none', fogLayers: 2,
  },
  diner: {
    layoutPatterns: ['enclosed_room', 'asymmetric'],
    lightingStyles: ['warm_practical', 'neon_glow'],
    atmosphereDefaults: ['dust'],
    propPools: ['booth', 'counter', 'stool', 'jukebox', 'neon_sign', 'window', 'clock', 'coffee_machine'],
    compositionBias: ['foreground_obstruction', 'centered_isolation'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'dense',
    depthLayers: 3, groundVariation: 'checkered_tile', skylineType: 'none', fogLayers: 1,
  },
  office: {
    layoutPatterns: ['enclosed_room', 'open_space'],
    lightingStyles: ['cold_fluorescent', 'harsh_overhead'],
    atmosphereDefaults: ['dust'],
    propPools: ['desk', 'chair', 'monitor_screen', 'plant', 'water_cooler', 'blinds', 'whiteboard', 'filing_cabinet'],
    compositionBias: ['centered_isolation', 'asymmetric_tension'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'moderate',
    depthLayers: 3, groundVariation: 'carpet_flat', skylineType: 'none', fogLayers: 1,
  },
  warehouse: {
    layoutPatterns: ['open_space', 'long_corridor'],
    lightingStyles: ['harsh_overhead', 'dramatic_spot', 'cold_fluorescent'],
    atmosphereDefaults: ['dust', 'fog'],
    propPools: ['crate', 'shelf_unit', 'barrel', 'chain', 'forklift_silhouette', 'pipe', 'loading_door', 'pallet'],
    compositionBias: ['silhouette_framing', 'depth_layering', 'foreground_obstruction'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'moderate',
    depthLayers: 4, groundVariation: 'concrete_stained', skylineType: 'none', fogLayers: 2,
  },
  indoor_room: {
    layoutPatterns: ['enclosed_room'],
    lightingStyles: ['warm_practical', 'natural_soft'],
    atmosphereDefaults: ['dust'],
    propPools: ['window', 'lamp', 'table', 'chair', 'plant'],
    compositionBias: ['centered_isolation'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'sparse',
    depthLayers: 2, groundVariation: 'wood_floor', skylineType: 'none', fogLayers: 1,
  },
  outdoor_street: {
    layoutPatterns: ['open_space', 'long_corridor'],
    lightingStyles: ['neon_glow', 'moonlit', 'warm_practical'],
    atmosphereDefaults: ['fog'],
    propPools: ['streetlight', 'neon_sign', 'vending_machine', 'trash_can', 'bench', 'hydrant', 'mailbox'],
    compositionBias: ['depth_layering', 'silhouette_framing'],
    isIndoor: false, hasSkyline: true,
    defaultDensity: 'moderate',
    depthLayers: 4, groundVariation: 'asphalt', skylineType: 'city_skyline', fogLayers: 2,
  },
  outdoor_park: {
    layoutPatterns: ['open_space', 'circular'],
    lightingStyles: ['natural_soft', 'moonlit'],
    atmosphereDefaults: ['dust'],
    propPools: ['bench', 'streetlight', 'tree', 'fountain', 'path_lamp', 'bush', 'fence_post'],
    compositionBias: ['negative_space', 'centered_isolation'],
    isIndoor: false, hasSkyline: true,
    defaultDensity: 'sparse',
    depthLayers: 4, groundVariation: 'grass', skylineType: 'treeline', fogLayers: 2,
  },
  outdoor_beach: {
    layoutPatterns: ['open_space'],
    lightingStyles: ['natural_soft', 'warm_practical', 'moonlit'],
    atmosphereDefaults: ['dust'],
    propPools: ['driftwood', 'rock', 'beach_chair', 'pier_post'],
    compositionBias: ['negative_space', 'centered_isolation', 'depth_layering'],
    isIndoor: false, hasSkyline: false,
    defaultDensity: 'sparse',
    depthLayers: 4, groundVariation: 'sand_waves', skylineType: 'horizon_water', fogLayers: 2,
  },
  outdoor_forest: {
    layoutPatterns: ['open_space', 'asymmetric'],
    lightingStyles: ['natural_soft', 'moonlit'],
    atmosphereDefaults: ['fog', 'dust'],
    propPools: ['tree', 'rock', 'fallen_log', 'bush', 'stump', 'mushroom'],
    compositionBias: ['silhouette_framing', 'foreground_obstruction', 'depth_layering'],
    isIndoor: false, hasSkyline: false,
    defaultDensity: 'dense',
    depthLayers: 5, groundVariation: 'earth_moss', skylineType: 'treeline', fogLayers: 3,
  },
  staircase: {
    layoutPatterns: ['split_level', 'long_corridor'],
    lightingStyles: ['cold_fluorescent', 'dramatic_spot'],
    atmosphereDefaults: ['dust'],
    propPools: ['railing', 'pipe', 'window', 'number_sign'],
    compositionBias: ['depth_layering', 'asymmetric_tension'],
    isIndoor: true, hasSkyline: false,
    defaultDensity: 'sparse',
    depthLayers: 3, groundVariation: 'concrete', skylineType: 'none', fogLayers: 1,
  },
};

export function getEnvironmentGrammar(locationType: string): EnvironmentGrammar {
  return ENVIRONMENT_GRAMMARS[locationType] ?? ENVIRONMENT_GRAMMARS.indoor_room;
}

const TONE_LIGHTING_MAP: Record<string, LightingLanguage> = {
  neutral: 'natural_soft',
  lonely: 'cold_fluorescent',
  tense: 'dramatic_spot',
  sad: 'cold_fluorescent',
  romantic: 'warm_practical',
  threatening: 'dramatic_spot',
  awkward: 'harsh_overhead',
  energetic: 'warm_practical',
};

export function resolveLightingForTone(tone: SceneTone, grammar: EnvironmentGrammar): LightingLanguage {
  const tonePreferred = TONE_LIGHTING_MAP[tone];
  if (tonePreferred && grammar.lightingStyles.includes(tonePreferred)) {
    return tonePreferred;
  }
  return grammar.lightingStyles[0];
}

const TONE_COMPOSITION_MAP: Record<string, CompositionStyle> = {
  neutral: 'centered_isolation',
  lonely: 'negative_space',
  tense: 'asymmetric_tension',
  sad: 'centered_isolation',
  romantic: 'centered_isolation',
  threatening: 'foreground_obstruction',
  awkward: 'asymmetric_tension',
  energetic: 'depth_layering',
};

export function resolveCompositionForTone(tone: SceneTone, grammar: EnvironmentGrammar): CompositionStyle {
  const tonePreferred = TONE_COMPOSITION_MAP[tone];
  if (tonePreferred && grammar.compositionBias.includes(tonePreferred)) {
    return tonePreferred;
  }
  return grammar.compositionBias[0];
}
