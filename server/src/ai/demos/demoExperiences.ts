// Phase 7 — Task Group 15: Demo Experiences
// Each demo proves: semantic planning, orchestration, emotional reasoning,
// cinematic interpretation, provider abstraction, runtime integration

export interface DemoExperience {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  mutations: Array<{
    prompt: string;
    expectedEffect: string;
  }>;
  provesCapabilities: string[];
}

export const DEMO_EXPERIENCES: DemoExperience[] = [
  {
    id: 'lonely-subway',
    title: 'Lonely Subway at Midnight',
    description: 'A solitary figure waits on an empty subway platform. The scene evolves through isolation, memory, and quiet resignation.',
    initialPrompt: 'A lonely person standing on an empty subway platform at midnight. The fluorescent lights flicker overhead. Everything feels distant and hollow.',
    mutations: [
      {
        prompt: 'Make the silence feel painful',
        expectedEffect: 'Increased emotional pressure, slower pacing, wider negative space'
      },
      {
        prompt: 'A distant train rumbles but never arrives',
        expectedEffect: 'Anticipation without resolution, sustained tension, environmental audio suggestion'
      },
      {
        prompt: 'Turn this into a memory — warm and faded',
        expectedEffect: 'Warm lighting shift, softer composition, nostalgic tone'
      }
    ],
    provesCapabilities: [
      'semantic_planning',
      'emotional_reasoning',
      'lighting_intelligence',
      'pacing_control',
      'memory_system',
      'tone_mutation'
    ]
  },
  {
    id: 'apartment-tension',
    title: 'Apartment Emotional Tension',
    description: 'Two people in a small apartment. Unspoken words create suffocating tension that transforms the space itself.',
    initialPrompt: 'Two people standing in a small apartment. They are not speaking. The room feels heavy with unspoken words.',
    mutations: [
      {
        prompt: 'Make the room feel emotionally trapped',
        expectedEffect: 'Claustrophobic composition, restricted blocking, oppressive lighting'
      },
      {
        prompt: 'One of them almost speaks but stops',
        expectedEffect: 'Anticipation pause, emotional arc peak, tension camera'
      },
      {
        prompt: 'Create emotional distance between them',
        expectedEffect: 'Wider spacing, gaze avoidance, visual isolation within shared space'
      }
    ],
    provesCapabilities: [
      'multi_agent_reasoning',
      'blocking_intelligence',
      'scene_graph_manipulation',
      'continuity_preservation',
      'spatial_reasoning',
      'relationship_dynamics'
    ]
  },
  {
    id: 'rainy-rooftop',
    title: 'Rainy Rooftop Confrontation',
    description: 'A confrontation on a rain-soaked rooftop. Restrained anger, dramatic lighting, and cinematic staging.',
    initialPrompt: 'Two people facing each other on a rainy rooftop at night. Rain pours around them. There is anger but neither wants to show it.',
    mutations: [
      {
        prompt: 'Make the confrontation feel restrained',
        expectedEffect: 'Controlled tension, measured pacing, no aggressive camera'
      },
      {
        prompt: 'Create tension without aggression',
        expectedEffect: 'Elevated tension with low threat, no frantic pacing'
      },
      {
        prompt: 'One of them turns away — the argument is over',
        expectedEffect: 'De-escalation, emotional arc falling, blocking shift'
      }
    ],
    provesCapabilities: [
      'orchestration',
      'emotional_arc_tracking',
      'weather_effects',
      'cinematic_staging',
      'provider_fallback',
      'context_compression'
    ]
  },
  {
    id: 'nostalgic-diner',
    title: 'Nostalgic Diner Memory',
    description: 'A diner scene that shifts between present and memory. Warm nostalgia versus cold reality.',
    initialPrompt: 'A person sitting alone in a late-night diner. The neon sign buzzes outside. Coffee grows cold. This place used to mean something.',
    mutations: [
      {
        prompt: 'Turn this into a nostalgic memory',
        expectedEffect: 'Warm color grading, soft focus, gentle pacing'
      },
      {
        prompt: 'Now snap back to cold reality',
        expectedEffect: 'Cold lighting, harsh composition, sharp contrast'
      },
      {
        prompt: 'Make the emptiness feel like a character',
        expectedEffect: 'Environmental density reduction, isolation emphasis, negative space as subject'
      }
    ],
    provesCapabilities: [
      'tone_switching',
      'lighting_intelligence',
      'environment_grammar',
      'emotional_memory',
      'visual_style_shifting',
      'semantic_graph_reasoning'
    ]
  },
  {
    id: 'hospital-anxiety',
    title: 'Hospital Waiting Room Anxiety',
    description: 'A person waiting in a hospital. Time stretches. Anxiety builds without any event occurring.',
    initialPrompt: 'A person sitting in a hospital waiting room. The fluorescent lights hum. A clock ticks. They are waiting for news that might change everything.',
    mutations: [
      {
        prompt: 'Make the waiting feel unbearable',
        expectedEffect: 'Slow pacing to near-static, high emotional pressure, compressed time perception'
      },
      {
        prompt: 'The clock seems to slow down',
        expectedEffect: 'Pacing deceleration, sustained tension, anticipation without resolution'
      },
      {
        prompt: 'Someone enters the room — everything freezes',
        expectedEffect: 'Dramatic pause, all movement stops, focus shift, tension peak'
      }
    ],
    provesCapabilities: [
      'pacing_intelligence',
      'anticipation_systems',
      'emotional_escalation',
      'environmental_mood',
      'dramatic_timing',
      'runtime_integration'
    ]
  }
];

export function getDemoExperience(id: string): DemoExperience | undefined {
  return DEMO_EXPERIENCES.find(d => d.id === id);
}

export function getAllDemoExperiences(): DemoExperience[] {
  return [...DEMO_EXPERIENCES];
}
