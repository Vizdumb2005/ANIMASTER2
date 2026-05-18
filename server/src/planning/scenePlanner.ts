/**
 * Phase 6: Semantic Scene Planner
 * 
 * Converts natural language prompts into semantic cinematic plans.
 * The planner describes INTENT, not visuals — the runtime handles rendering.
 */

export interface SemanticScenePlan {
  locationType: string;
  timeOfDay: string;
  tone: string;
  weather: string;
  layoutStyle: string;
  visualDensity: string;
  lightingLanguage: string;
  compositionStyle: string;
  cameraLanguage: string;
  keyProps: string[];
  visualStyle: string;
  emotionalEnergy: number;
}

// Location detection patterns
const LOCATION_PATTERNS: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /subway|metro|underground\s+station|train\s+station/i, type: 'subway' },
  { pattern: /alley|alleyway|back\s+alley/i, type: 'alley' },
  { pattern: /rooftop|roof\s+top|on\s+the\s+roof/i, type: 'rooftop' },
  { pattern: /forest|woods|woodland|jungle/i, type: 'outdoor_forest' },
  { pattern: /beach|shore|seaside|ocean|coast/i, type: 'outdoor_beach' },
  { pattern: /apartment|flat|living\s+room|bedroom/i, type: 'apartment' },
  { pattern: /hallway|corridor|passage/i, type: 'hallway' },
  { pattern: /hospital|clinic|ward|emergency\s+room/i, type: 'hospital' },
  { pattern: /parking\s+garage|parking\s+lot|garage/i, type: 'parking_garage' },
  { pattern: /diner|restaurant|cafe|cafeteria|coffee\s+shop/i, type: 'diner' },
  { pattern: /office|cubicle|workspace|boardroom/i, type: 'office' },
  { pattern: /warehouse|factory|storage|loading\s+dock/i, type: 'warehouse' },
  { pattern: /park|garden|meadow|field/i, type: 'outdoor_park' },
  { pattern: /staircase|stairs|stairwell/i, type: 'staircase' },
  { pattern: /street|road|sidewalk|crosswalk/i, type: 'outdoor_street' },
];

// Time of day detection
const TIME_PATTERNS: Array<{ pattern: RegExp; time: string }> = [
  { pattern: /dawn|sunrise|early\s+morning/i, time: 'dawn' },
  { pattern: /morning|daytime/i, time: 'morning' },
  { pattern: /afternoon|midday/i, time: 'afternoon' },
  { pattern: /evening|sunset|dusk/i, time: 'evening' },
  { pattern: /night|midnight|dark/i, time: 'night' },
  { pattern: /2\s*am|3\s*am|late\s+night|after\s+hours/i, time: 'late_night' },
];

// Weather detection
const WEATHER_PATTERNS: Array<{ pattern: RegExp; weather: string }> = [
  { pattern: /rain|raining|rainy|downpour|drizzle/i, weather: 'rain' },
  { pattern: /snow|snowing|snowy|blizzard/i, weather: 'snow' },
  { pattern: /fog|foggy|mist|misty|hazy/i, weather: 'fog' },
  { pattern: /storm|thunder|lightning/i, weather: 'storm' },
  { pattern: /overcast|cloudy|grey\s+sky|gray\s+sky/i, weather: 'overcast' },
];

// Tone detection
const TONE_PATTERNS: Array<{ pattern: RegExp; tone: string }> = [
  { pattern: /lonely|alone|isolated|solitary|desolate/i, tone: 'lonely' },
  { pattern: /tense|suspense|nervous|anxious|uneasy/i, tone: 'tense' },
  { pattern: /sad|melancholy|depressed|grief|mourning/i, tone: 'sad' },
  { pattern: /romantic|love|intimate|tender|passionate/i, tone: 'romantic' },
  { pattern: /threatening|danger|menacing|ominous|sinister/i, tone: 'threatening' },
  { pattern: /energetic|exciting|thrilling|dynamic|chaotic/i, tone: 'energetic' },
  { pattern: /awkward|uncomfortable|cringe|hesitant/i, tone: 'awkward' },
];

// Prop detection from prompt
const PROP_KEYWORDS: Record<string, string[]> = {
  bench: ['bench', 'seat', 'sitting area'],
  flickering_sign: ['flickering', 'sign', 'neon sign', 'broken sign'],
  wet_floor: ['wet', 'puddle', 'wet floor', 'water on floor'],
  vending_machine: ['vending machine', 'soda machine'],
  streetlight: ['streetlight', 'lamp post', 'street lamp', 'light post'],
  dumpster: ['dumpster', 'trash', 'garbage'],
  fire_escape: ['fire escape', 'ladder', 'escape ladder'],
  puddle: ['puddle', 'water', 'reflection on ground'],
  trash_bag: ['trash bag', 'garbage bag'],
  neon_sign: ['neon', 'neon sign', 'neon light', 'glowing sign'],
  window: ['window', 'glass pane'],
  door: ['door', 'doorway', 'entrance'],
  tree: ['tree', 'trees', 'pine', 'oak'],
  rock: ['rock', 'boulder', 'stone'],
  driftwood: ['driftwood', 'log', 'wood'],
  car_silhouette: ['car', 'vehicle', 'parked car'],
  booth: ['booth', 'table'],
  stool: ['stool', 'bar stool'],
  jukebox: ['jukebox', 'music box'],
  desk: ['desk', 'workstation'],
  chair: ['chair', 'office chair'],
  monitor_screen: ['monitor', 'screen', 'computer'],
  crate: ['crate', 'box', 'wooden box'],
  barrel: ['barrel', 'drum'],
  chain: ['chain', 'chains'],
};

// Lighting language from tone/time
function resolveLightingLanguage(tone: string, timeOfDay: string, locationType: string): string {
  if (locationType === 'subway' || locationType === 'hospital' || locationType === 'hallway') {
    return 'cold_fluorescent';
  }
  if (locationType === 'alley' && (timeOfDay === 'night' || timeOfDay === 'late_night')) {
    return 'neon_glow';
  }
  if (timeOfDay === 'night' || timeOfDay === 'late_night') return 'moonlit';
  if (tone === 'romantic') return 'warm_practical';
  if (tone === 'tense' || tone === 'threatening') return 'dramatic_spot';
  if (timeOfDay === 'dawn' || timeOfDay === 'evening') return 'natural_soft';
  return 'natural_soft';
}

// Composition style from tone
function resolveCompositionStyle(tone: string, actorCount: number): string {
  if (tone === 'lonely') return 'negative_space';
  if (tone === 'tense' || tone === 'threatening') return actorCount >= 2 ? 'asymmetric_tension' : 'foreground_obstruction';
  if (tone === 'romantic') return 'centered_isolation';
  return 'depth_layering';
}

// Camera language from tone
function resolveCameraLanguage(tone: string): string {
  const map: Record<string, string> = {
    lonely: 'slow_isolation',
    tense: 'tight_tension',
    sad: 'drift_melancholy',
    romantic: 'steady_observe',
    threatening: 'handheld_anxiety',
    energetic: 'wide_establishing',
    awkward: 'steady_observe',
    neutral: 'steady_observe',
  };
  return map[tone] ?? 'steady_observe';
}

// Visual style from tone
function resolveVisualStyle(tone: string, locationType: string): string {
  if (locationType === 'alley' && (tone === 'threatening' || tone === 'tense')) return 'noir';
  if (tone === 'romantic') return 'warm_memory';
  if (tone === 'lonely' || tone === 'sad') return 'cold_realism';
  if (tone === 'tense' || tone === 'threatening') return 'monochrome_tension';
  if (tone === 'energetic') return 'neon_isolation';
  return 'default';
}

// Visual density
function resolveVisualDensity(locationType: string, tone: string): string {
  if (tone === 'lonely') return 'sparse';
  if (locationType === 'alley' || locationType === 'diner' || locationType === 'outdoor_forest') return 'dense';
  if (locationType === 'beach' || locationType === 'outdoor_beach' || locationType === 'rooftop') return 'sparse';
  if (tone === 'tense' || tone === 'threatening') return 'moderate';
  return 'moderate';
}

// Layout style
function resolveLayoutStyle(locationType: string): string {
  const corridorTypes = new Set(['subway', 'hallway', 'alley']);
  if (corridorTypes.has(locationType)) return 'long_corridor';
  const roomTypes = new Set(['apartment', 'diner', 'office', 'hospital', 'indoor_room']);
  if (roomTypes.has(locationType)) return 'enclosed_room';
  return 'open_space';
}

// Emotional energy from tone
function resolveEmotionalEnergy(tone: string): number {
  const map: Record<string, number> = {
    neutral: 0.5, lonely: 0.2, tense: 0.8, sad: 0.3,
    romantic: 0.5, threatening: 0.9, awkward: 0.4, energetic: 0.9,
  };
  return map[tone] ?? 0.5;
}

export function planScene(prompt: string, actorCount: number = 1): SemanticScenePlan {
  // Detect location
  let locationType = 'indoor_room';
  for (const lp of LOCATION_PATTERNS) {
    if (lp.pattern.test(prompt)) {
      locationType = lp.type;
      break;
    }
  }

  // Detect time of day
  let timeOfDay = 'evening';
  for (const tp of TIME_PATTERNS) {
    if (tp.pattern.test(prompt)) {
      timeOfDay = tp.time;
      break;
    }
  }

  // Detect weather
  let weather = 'clear';
  for (const wp of WEATHER_PATTERNS) {
    if (wp.pattern.test(prompt)) {
      weather = wp.weather;
      break;
    }
  }

  // Detect tone
  let tone = 'neutral';
  for (const tp of TONE_PATTERNS) {
    if (tp.pattern.test(prompt)) {
      tone = tp.tone;
      break;
    }
  }

  // Detect key props from prompt
  const keyProps: string[] = [];
  const lowerPrompt = prompt.toLowerCase();
  for (const [propType, keywords] of Object.entries(PROP_KEYWORDS)) {
    for (const kw of keywords) {
      if (lowerPrompt.includes(kw)) {
        if (!keyProps.includes(propType)) keyProps.push(propType);
        break;
      }
    }
  }

  const lightingLanguage = resolveLightingLanguage(tone, timeOfDay, locationType);
  const compositionStyle = resolveCompositionStyle(tone, actorCount);
  const cameraLanguage = resolveCameraLanguage(tone);
  const visualStyle = resolveVisualStyle(tone, locationType);
  const visualDensity = resolveVisualDensity(locationType, tone);
  const layoutStyle = resolveLayoutStyle(locationType);
  const emotionalEnergy = resolveEmotionalEnergy(tone);

  return {
    locationType,
    timeOfDay,
    tone,
    weather,
    layoutStyle,
    visualDensity,
    lightingLanguage,
    compositionStyle,
    cameraLanguage,
    keyProps,
    visualStyle,
    emotionalEnergy,
  };
}
