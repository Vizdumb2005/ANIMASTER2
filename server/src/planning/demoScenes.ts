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
}

export const DEMO_SCENES: DemoScene[] = [
  {
    id: 'demo_lonely_subway',
    name: 'Lonely Subway',
    prompt: 'A lonely figure stands alone on an empty subway platform at night, flickering fluorescent lights overhead',
    description: 'Sparse subway environment with cold fluorescent lighting, isolation composition, slow camera',
  },
  {
    id: 'demo_rainy_alley',
    name: 'Rainy Alley',
    prompt: 'Rain falls in a dark narrow alley at night, a nervous person stands near a neon sign',
    description: 'Dense alley with rain, neon glow lighting, tight tension camera, foreground obstruction',
  },
  {
    id: 'demo_rooftop_confrontation',
    name: 'Rooftop Confrontation',
    prompt: 'Two people confront each other on a rooftop at night, tense and threatening atmosphere',
    description: 'Open rooftop with dramatic spot lighting, asymmetric tension composition, 2 actors',
  },
  {
    id: 'demo_hospital_waiting',
    name: 'Hospital Waiting Room',
    prompt: 'A sad exhausted person sits alone in an empty hospital hallway late at night',
    description: 'Enclosed hospital with cold fluorescent lights, negative space composition, drift camera',
  },
  {
    id: 'demo_beach_sunset',
    name: 'Beach at Sunset',
    prompt: 'A person walks slowly along the beach at evening, warm golden light, peaceful and lonely',
    description: 'Sparse beach with warm natural lighting, slow isolation camera, horizon water skyline',
  },
  {
    id: 'demo_abandoned_warehouse',
    name: 'Abandoned Warehouse',
    prompt: 'A nervous person stands in a dark abandoned warehouse at night, shadows everywhere',
    description: 'Dense warehouse with dramatic spot lighting, foreground obstruction, handheld camera',
  },
  {
    id: 'demo_diner_breakup',
    name: 'Diner Breakup',
    prompt: 'Two people sit awkwardly across from each other in a quiet diner at night, uncomfortable silence',
    description: 'Enclosed diner with warm practical lighting, steady observe camera, 2 actors',
  },
  {
    id: 'demo_office_tension',
    name: 'Office Tension',
    prompt: 'A tense confrontation in a dimly lit office, two people arguing with each other',
    description: 'Enclosed office with harsh overhead lighting, tight tension camera, 2 actors confronting',
  },
  {
    id: 'demo_snowy_forest',
    name: 'Snowy Forest',
    prompt: 'A lonely figure walks through a snowy forest at night, snow falling gently',
    description: 'Dense forest with moonlit lighting, slow isolation camera, snow weather',
  },
  {
    id: 'demo_parking_encounter',
    name: 'Parking Garage Encounter',
    prompt: 'Two people approach each other cautiously in a dark parking garage, tense and nervous',
    description: 'Open parking garage with harsh overhead lighting, tight tension camera, 2 actors approaching',
  },
];

export function getDemoScene(id: string): DemoScene | undefined {
  return DEMO_SCENES.find((s) => s.id === id);
}

export function getRandomDemoPrompt(seed: number): string {
  const index = Math.abs(seed) % DEMO_SCENES.length;
  return DEMO_SCENES[index].prompt;
}
