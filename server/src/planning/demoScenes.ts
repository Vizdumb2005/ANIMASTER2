/**
 * Phase 6: 10 Procedural Demo Scenes
 * 
 * Each scene is a prompt that exercises the procedural world generation pipeline.
 * These can be used as fallback demos or test cases.
 */

export interface DemoScene {
  id: string;
  name: string;
  prompt: string;
  description: string;
  // Phase 8 enhancements
  directingSuggestions?: string[];
  emotionalSpace?: {
    intimacy: number;
    dominance: number;
    emotional_distance: number;
    social_tension: number;
    vulnerability: number;
    isolation: number;
  };
  directorialStyle?: string;
  initialBeat?: string;
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: 'demo_lonely_subway',
    name: 'Lonely Subway',
    prompt: 'A lonely figure stands alone on an empty subway platform at night, flickering fluorescent lights overhead',
    description: 'Sparse subway environment with cold fluorescent lighting, isolation composition, slow camera',
    directingSuggestions: [
      'Make it lonelier',
      'Add flickering lights',
      'Make the silence heavier',
      'Increase isolation'
    ],
    emotionalSpace: {
      intimacy: 0.1,
      dominance: -0.2,
      emotional_distance: 0.8,
      social_tension: 0.2,
      vulnerability: 0.4,
      isolation: 0.9
    },
    directorialStyle: 'subway_isolation',
    initialBeat: 'stillness'
  },
  {
    id: 'demo_rainy_alley',
    name: 'Rainy Alley',
    prompt: 'Rain falls in a dark narrow alley at night, a nervous person stands near a neon sign',
    description: 'Dense alley with rain, neon glow lighting, tight tension camera, foreground obstruction',
    directingSuggestions: [
      'Add rain',
      'Make it more threatening',
      'Add neon reflections',
      'Increase nervous energy'
    ],
    emotionalSpace: {
      intimacy: 0.2,
      dominance: 0.3,
      emotional_distance: 0.6,
      social_tension: 0.7,
      vulnerability: 0.5,
      isolation: 0.3
    },
    directorialStyle: 'noir_isolation',
    initialBeat: 'fidget'
  },
  {
    id: 'demo_rooftop_confrontation',
    name: 'Rooftop Confrontation',
    prompt: 'Two people confront each other on a rooftop at night, tense and threatening atmosphere',
    description: 'Open rooftop with dramatic spot lighting, asymmetric tension composition, 2 actors',
    directingSuggestions: [
      'Increase tension',
      'Add wind',
      'Make it more threatening',
      'Build to confrontation'
    ],
    emotionalSpace: {
      intimacy: 0.3,
      dominance: 0.7,
      emotional_distance: 0.4,
      social_tension: 0.9,
      vulnerability: 0.3,
      isolation: 0.2
    },
    directorialStyle: 'confrontation_tension',
    initialBeat: 'approach'
  },
  {
    id: 'demo_hospital_waiting',
    name: 'Hospital Waiting Room',
    prompt: 'A sad exhausted person sits alone in an empty hospital hallway late at night',
    description: 'Enclosed hospital with cold fluorescent lights, negative space composition, drift camera',
    directingSuggestions: [
      'Make it sadder',
      'Add cold lighting',
      'Increase loneliness',
      'Make the silence heavier'
    ],
    emotionalSpace: {
      intimacy: 0.1,
      dominance: -0.5,
      emotional_distance: 0.7,
      social_tension: 0.1,
      vulnerability: 0.9,
      isolation: 0.8
    },
    directorialStyle: 'isolation_drift',
    initialBeat: 'pause'
  },
  {
    id: 'demo_beach_sunset',
    name: 'Beach at Sunset',
    prompt: 'A person walks slowly along the beach at evening, warm golden light, peaceful and lonely',
    description: 'Sparse beach with warm natural lighting, slow isolation camera, horizon water skyline',
    directingSuggestions: [
      'Make it more peaceful',
      'Add warm light',
      'Increase isolation',
      'Slow the pace'
    ],
    emotionalSpace: {
      intimacy: 0.2,
      dominance: 0.0,
      emotional_distance: 0.5,
      social_tension: 0.1,
      vulnerability: 0.3,
      isolation: 0.6
    },
    directorialStyle: 'ambient_drift',
    initialBeat: 'stillness'
  },
  {
    id: 'demo_abandoned_warehouse',
    name: 'Abandoned Warehouse',
    prompt: 'A nervous person stands in a dark abandoned warehouse at night, shadows everywhere',
    description: 'Dense warehouse with dramatic spot lighting, foreground obstruction, handheld camera',
    directingSuggestions: [
      'Add shadows',
      'Make more nervous',
      'Add spotlight',
      'Increase tension'
    ],
    emotionalSpace: {
      intimacy: 0.1,
      dominance: 0.0,
      emotional_distance: 0.7,
      social_tension: 0.6,
      vulnerability: 0.7,
      isolation: 0.5
    },
    directorialStyle: 'noir_isolation',
    initialBeat: 'fidget'
  },
  {
    id: 'demo_diner_breakup',
    name: 'Diner Breakup',
    prompt: 'Two people sit awkwardly across from each other in a quiet diner at night, uncomfortable silence',
    description: 'Enclosed diner with warm practical lighting, steady observe camera, 2 actors',
    directingSuggestions: [
      'Make it more awkward',
      'Add uncomfortable silence',
      'Increase emotional distance',
      'Slow the pace'
    ],
    emotionalSpace: {
      intimacy: 0.4,
      dominance: 0.0,
      emotional_distance: 0.9,
      social_tension: 0.5,
      vulnerability: 0.6,
      isolation: 0.1
    },
    directorialStyle: 'observe_still',
    initialBeat: 'look_away'
  },
  {
    id: 'demo_office_tension',
    name: 'Office Tension',
    prompt: 'A tense confrontation in a dimly lit office, two people arguing with each other',
    description: 'Enclosed office with harsh overhead lighting, tight tension camera, 2 actors confronting',
    directingSuggestions: [
      'Increase tension',
      'Add aggressive energy',
      'Build to argument',
      'Make it more intense'
    ],
    emotionalSpace: {
      intimacy: 0.2,
      dominance: 0.8,
      emotional_distance: 0.3,
      social_tension: 0.9,
      vulnerability: 0.2,
      isolation: 0.1
    },
    directorialStyle: 'confrontation_tension',
    initialBeat: 'recoil'
  },
  {
    id: 'demo_snowy_forest',
    name: 'Snowy Forest',
    prompt: 'A lonely figure walks through a snowy forest at night, snow falling gently',
    description: 'Dense forest with moonlit lighting, slow isolation camera, snow weather',
    directingSuggestions: [
      'Add snow',
      'Make it lonelier',
      'Add gentle snow',
      'Increase isolation'
    ],
    emotionalSpace: {
      intimacy: 0.1,
      dominance: -0.1,
      emotional_distance: 0.6,
      social_tension: 0.1,
      vulnerability: 0.4,
      isolation: 0.9
    },
    directorialStyle: 'isolation_drift',
    initialBeat: 'stillness'
  },
  {
    id: 'demo_parking_encounter',
    name: 'Parking Garage Encounter',
    prompt: 'Two people approach each other cautiously in a dark parking garage, tense and nervous',
    description: 'Open parking garage with harsh overhead lighting, tight tension camera, 2 actors approaching',
    directingSuggestions: [
      'Increase caution',
      'Add tension',
      'Make them approach slowly',
      'Build tension'
    ],
    emotionalSpace: {
      intimacy: 0.3,
      dominance: 0.2,
      emotional_distance: 0.5,
      social_tension: 0.8,
      vulnerability: 0.4,
      isolation: 0.2
    },
    directorialStyle: 'approach_tension',
    initialBeat: 'approach'
  },
];

export function getDemoScene(id: string): DemoScene | undefined {
  return DEMO_SCENES.find((s) => s.id === id);
}

export function getRandomDemoPrompt(seed: number): string {
  const index = Math.abs(seed) % DEMO_SCENES.length;
  return DEMO_SCENES[index].prompt;
}
