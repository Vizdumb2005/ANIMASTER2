// Phase 8 — Task Group 13: Polished Cinematic Demo Scenarios

export interface CinematicDemo {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  directorCommands: string[];
  expectedTone: string;
  expectedEnvironment: string;
}

export const CINEMATIC_DEMOS: CinematicDemo[] = [
  {
    id: 'rainy_rooftop_loneliness',
    title: 'Rainy Rooftop Loneliness',
    description: 'A lone figure on a rain-soaked rooftop at night, isolated above the city.',
    initialPrompt: 'A person stands alone on a rooftop in the rain at night',
    directorCommands: [
      'make the silence heavier',
      'push camera closer slowly',
      'make the rain feel colder',
      'add fog to the city below',
      'make the loneliness feel unbearable',
    ],
    expectedTone: 'lonely',
    expectedEnvironment: 'rooftop',
  },
  {
    id: 'subway_tension_encounter',
    title: 'Subway Tension Encounter',
    description: 'Two strangers in an empty subway car, awareness building into tension.',
    initialPrompt: 'Two people sit in an empty subway train late at night',
    directorCommands: [
      'increase tension slowly',
      'make him glance at her nervously',
      'create uncomfortable silence',
      'push the camera to over-the-shoulder',
      'make the flickering lights feel threatening',
    ],
    expectedTone: 'tense',
    expectedEnvironment: 'subway',
  },
  {
    id: 'hospital_waiting_anxiety',
    title: 'Hospital Waiting Anxiety',
    description: 'Someone waiting alone in a hospital corridor, dread building silently.',
    initialPrompt: 'A nervous person waits alone in a hospital hallway',
    directorCommands: [
      'make the waiting feel endless',
      'add uncomfortable silence',
      'make the fluorescent lights feel oppressive',
      'slow the pacing down further',
      'push camera into an intimate close-up',
    ],
    expectedTone: 'tense',
    expectedEnvironment: 'hallway',
  },
  {
    id: 'apartment_awkward_silence',
    title: 'Apartment Awkward Silence',
    description: 'Two people in an apartment after an argument, the silence between them is deafening.',
    initialPrompt: 'Two people stand in an apartment avoiding eye contact after an argument',
    directorCommands: [
      'create emotional distance between them',
      'make the silence feel painful',
      'make her emotionally withdraw',
      'hold the shot longer',
      'make the room feel colder',
    ],
    expectedTone: 'awkward',
    expectedEnvironment: 'apartment',
  },
  {
    id: 'noir_alley_confrontation',
    title: 'Noir Alley Confrontation',
    description: 'A tense confrontation in a dark alley, shadows and danger.',
    initialPrompt: 'Two people confront each other in a dark alley at night',
    directorCommands: [
      'make it feel threatening',
      'push camera into a confrontation two-shot',
      'increase tension sharply',
      'make the shadows feel menacing',
      'add flickering streetlight',
    ],
    expectedTone: 'threatening',
    expectedEnvironment: 'alley',
  },
];

export function getCinematicDemos(): CinematicDemo[] {
  return [...CINEMATIC_DEMOS];
}

export function getCinematicDemoById(id: string): CinematicDemo | undefined {
  return CINEMATIC_DEMOS.find((d) => d.id === id);
}
