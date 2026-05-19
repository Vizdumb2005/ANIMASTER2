// Phase 7 — Task Group 4: Prompt → Cinematic Intent Compiler

export interface CinematicIntent {
  emotionalPressure: number;
  pacingStyle: 'slow_heavy' | 'measured' | 'brisk' | 'frantic';
  compositionStyle: 'compressed' | 'expansive' | 'balanced' | 'negative_space' | 'claustrophobic';
  visualIsolation: number;
  cameraAggression: number;
  environmentDensity: number;
  dialogueEnergy: number;
  lightingLanguage: 'oppressive' | 'warm_intimate' | 'cold_clinical' | 'natural' | 'dramatic' | 'neon' | 'moonlit';
  blockingStyle: 'natural' | 'trapped' | 'confrontational' | 'intimate' | 'distant' | 'evasive';
  tensionLevel: number;
  intimacyLevel: number;
  threatLevel: number;
}

interface KeywordWeight {
  pattern: RegExp;
  weights: Partial<CinematicIntent>;
}

const KEYWORD_RULES: KeywordWeight[] = [
  // Emotional pressure
  { pattern: /suffocating|crushing|overwhelming|unbearable/i, weights: { emotionalPressure: 0.9, compositionStyle: 'compressed', lightingLanguage: 'oppressive' } },
  { pattern: /painful|agonizing|devastating/i, weights: { emotionalPressure: 0.85, pacingStyle: 'slow_heavy' } },
  { pattern: /lonely|isolated|alone|abandoned/i, weights: { emotionalPressure: 0.6, visualIsolation: 0.8, compositionStyle: 'negative_space', pacingStyle: 'slow_heavy' } },
  { pattern: /awkward|uncomfortable|uneasy/i, weights: { emotionalPressure: 0.5, pacingStyle: 'measured', cameraAggression: 0.3 } },
  { pattern: /calm|peaceful|serene/i, weights: { emotionalPressure: 0.1, pacingStyle: 'slow_heavy', cameraAggression: 0.1 } },

  // Tension & threat
  { pattern: /tense|tension|strained/i, weights: { tensionLevel: 0.7, cameraAggression: 0.6, compositionStyle: 'compressed' } },
  { pattern: /confrontation|confronting|face.?off/i, weights: { tensionLevel: 0.8, blockingStyle: 'confrontational', cameraAggression: 0.7 } },
  { pattern: /threatening|menacing|danger/i, weights: { threatLevel: 0.8, tensionLevel: 0.7, lightingLanguage: 'dramatic', cameraAggression: 0.7 } },
  { pattern: /restrained|controlled|suppressed/i, weights: { tensionLevel: 0.6, cameraAggression: 0.3, pacingStyle: 'measured' } },

  // Intimacy
  { pattern: /intimate|close|tender/i, weights: { intimacyLevel: 0.8, blockingStyle: 'intimate', compositionStyle: 'compressed', cameraAggression: 0.2 } },
  { pattern: /distant|apart|separated/i, weights: { intimacyLevel: 0.1, visualIsolation: 0.7, compositionStyle: 'expansive' } },
  { pattern: /emotional\s+distance/i, weights: { intimacyLevel: 0.1, visualIsolation: 0.7, compositionStyle: 'expansive', cameraAggression: 0.2 } },
  { pattern: /nostalgic|memory|remember/i, weights: { emotionalPressure: 0.5, lightingLanguage: 'warm_intimate', pacingStyle: 'slow_heavy' } },

  // Environment density
  { pattern: /cluttered|cramped|crowded/i, weights: { environmentDensity: 0.9, compositionStyle: 'claustrophobic' } },
  { pattern: /empty|barren|desolate|sparse/i, weights: { environmentDensity: 0.1, compositionStyle: 'negative_space' } },
  { pattern: /trapped|enclosed|confined/i, weights: { blockingStyle: 'trapped', environmentDensity: 0.8, compositionStyle: 'claustrophobic' } },
  { pattern: /endless|vast|infinite/i, weights: { environmentDensity: 0.1, compositionStyle: 'expansive', visualIsolation: 0.7 } },

  // Pacing
  { pattern: /slow|deliberate|heavy/i, weights: { pacingStyle: 'slow_heavy' } },
  { pattern: /frantic|chaotic|rushed/i, weights: { pacingStyle: 'frantic', cameraAggression: 0.8 } },
  { pattern: /silence|silent|quiet|still/i, weights: { pacingStyle: 'slow_heavy', dialogueEnergy: 0.1 } },

  // Camera
  { pattern: /close.?up|zoom\s+in|tight/i, weights: { cameraAggression: 0.8 } },
  { pattern: /wide|distant|far/i, weights: { cameraAggression: 0.1, visualIsolation: 0.6 } },

  // Lighting
  { pattern: /dark|shadow|dim/i, weights: { lightingLanguage: 'oppressive' } },
  { pattern: /neon|glow|electric/i, weights: { lightingLanguage: 'neon' } },
  { pattern: /warm|golden|sunset/i, weights: { lightingLanguage: 'warm_intimate' } },
  { pattern: /cold|harsh|fluorescent/i, weights: { lightingLanguage: 'cold_clinical' } },
  { pattern: /moonlight|moonlit/i, weights: { lightingLanguage: 'moonlit' } },

  // Dialogue
  { pattern: /argument|yelling|shouting/i, weights: { dialogueEnergy: 0.9, tensionLevel: 0.7 } },
  { pattern: /whisper|murmur|soft/i, weights: { dialogueEnergy: 0.2, intimacyLevel: 0.6 } },
];

const DEFAULT_INTENT: CinematicIntent = {
  emotionalPressure: 0.3,
  pacingStyle: 'measured',
  compositionStyle: 'balanced',
  visualIsolation: 0.3,
  cameraAggression: 0.3,
  environmentDensity: 0.5,
  dialogueEnergy: 0.5,
  lightingLanguage: 'natural',
  blockingStyle: 'natural',
  tensionLevel: 0.2,
  intimacyLevel: 0.3,
  threatLevel: 0.0
};

export function compileIntent(prompt: string): CinematicIntent {
  const intent: CinematicIntent = { ...DEFAULT_INTENT };
  let matchCount = 0;
  const hasRestraint = /restrained|controlled|suppressed/i.test(prompt);

  for (const rule of KEYWORD_RULES) {
    if (rule.pattern.test(prompt)) {
      matchCount++;
      for (const [key, value] of Object.entries(rule.weights)) {
        const k = key as keyof CinematicIntent;
        if (typeof value === 'number' && typeof intent[k] === 'number') {
          (intent as unknown as Record<string, number>)[k] = Math.max(intent[k] as number, value);
        } else if (typeof value === 'string') {
          (intent as unknown as Record<string, string>)[k] = value;
        }
      }
    }
  }

  if (matchCount === 0) {
    return intent;
  }

  // Cross-field influence
  if (intent.emotionalPressure > 0.7) {
    intent.cameraAggression = Math.max(intent.cameraAggression, 0.5);
    intent.pacingStyle = intent.pacingStyle === 'measured' ? 'slow_heavy' : intent.pacingStyle;
  }

  if (intent.tensionLevel > 0.6 && intent.intimacyLevel < 0.3) {
    intent.compositionStyle = intent.compositionStyle === 'balanced' ? 'compressed' : intent.compositionStyle;
  }

  if (intent.visualIsolation > 0.6) {
    intent.environmentDensity = Math.min(intent.environmentDensity, 0.3);
  }

  if (intent.threatLevel > 0.5) {
    intent.lightingLanguage = intent.lightingLanguage === 'natural' ? 'dramatic' : intent.lightingLanguage;
  }

  if (hasRestraint) {
    intent.cameraAggression = Math.min(intent.cameraAggression, 0.5);
  }

  return intent;
}

export function intentToSemanticControls(intent: CinematicIntent): Record<string, number> {
  return {
    emotionalIntensity: intent.emotionalPressure,
    visualDensity: intent.environmentDensity,
    environmentalRichness: intent.environmentDensity * 0.8 + intent.visualIsolation * 0.2,
    symbolicAbstraction: intent.visualIsolation * 0.6,
    dialogueNaturalism: intent.dialogueEnergy,
    cinematicRealism: 1 - intent.cameraAggression * 0.5,
    cameraAggression: intent.cameraAggression,
    pacing: intent.pacingStyle === 'frantic' ? 0.9 : intent.pacingStyle === 'brisk' ? 0.7 : intent.pacingStyle === 'measured' ? 0.5 : 0.2,
    atmosphereWeight: intent.emotionalPressure * 0.7 + intent.tensionLevel * 0.3,
    directorialIntensity: (intent.emotionalPressure + intent.cameraAggression + intent.tensionLevel) / 3
  };
}
