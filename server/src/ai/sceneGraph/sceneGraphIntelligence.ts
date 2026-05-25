// Phase 7 — Task Group 9: Scene Graph Intelligence
// LLMs manipulate semantic graphs, NOT rendering primitives
// Example: "increase emotional distance" → spacing, framing, gaze avoidance, composition

import type { CinematicIntent } from '../compiler/intentCompiler.js';
import type { SceneGraph } from '../../../../shared/src/scene.js';

export interface SemanticGraphOperation {
  type: string;
  target: string;
  semanticMeaning: string;
  runtimeEffects: Array<{
    field: string;
    operation: 'set' | 'adjust' | 'multiply';
    value: number | string;
  }>;
  reasoning: string;
}

export interface SemanticGraphPlan {
  operations: SemanticGraphOperation[];
  overallIntent: string;
  reasoning: string;
}

const SEMANTIC_PATTERNS: Array<{
  pattern: RegExp;
  createOperations: (intent: CinematicIntent, match: RegExpMatchArray) => SemanticGraphOperation[];
}> = [
  {
    pattern: /(?:increase|add|more|create)\s+(?:emotional\s+)?distance/i,
    createOperations: (intent) => [
      {
        type: 'spatial_relationship',
        target: 'actor_spacing',
        semanticMeaning: 'increase emotional distance between actors',
        runtimeEffects: [
          { field: 'actors.*.spacing', operation: 'multiply', value: 1.5 },
          { field: 'camera.framing', operation: 'set', value: 'wide_shot' },
          { field: 'actors.*.gazeAvoidance', operation: 'set', value: 0.7 },
          { field: 'composition.negativeSpace', operation: 'multiply', value: 1.3 }
        ],
        reasoning: 'Emotional distance → wider spacing, wider framing, gaze avoidance, more negative space'
      }
    ]
  },
  {
    pattern: /(?:decrease|reduce|less)\s+(?:emotional\s+)?distance/i,
    createOperations: () => [
      {
        type: 'spatial_relationship',
        target: 'actor_spacing',
        semanticMeaning: 'decrease emotional distance between actors',
        runtimeEffects: [
          { field: 'actors.*.spacing', operation: 'multiply', value: 0.6 },
          { field: 'camera.framing', operation: 'set', value: 'close_up' },
          { field: 'actors.*.gazeAvoidance', operation: 'set', value: 0.1 },
          { field: 'composition.negativeSpace', operation: 'multiply', value: 0.7 }
        ],
        reasoning: 'Reduced distance → closer spacing, tighter framing, direct gaze, less negative space'
      }
    ]
  },
  {
    pattern: /(?:isolate|isolation|alone|lonely|loneliness)/i,
    createOperations: (intent) => [
      {
        type: 'emotional_composition',
        target: 'visual_isolation',
        semanticMeaning: 'create visual isolation for character',
        runtimeEffects: [
          { field: 'composition.negativeSpace', operation: 'set', value: 0.8 },
          { field: 'camera.framing', operation: 'set', value: 'extreme_wide' },
          { field: 'lighting.spotlightFocus', operation: 'set', value: 0.9 },
          { field: 'environment.density', operation: 'multiply', value: 0.5 }
        ],
        reasoning: 'Isolation → vast negative space, wide framing, spotlight focus, sparse environment'
      }
    ]
  },
  {
    pattern: /(?:trap|trapped|claustrophobic|suffocating|closing\s+in)/i,
    createOperations: () => [
      {
        type: 'spatial_pressure',
        target: 'environment_compression',
        semanticMeaning: 'create claustrophobic spatial pressure',
        runtimeEffects: [
          { field: 'composition.negativeSpace', operation: 'set', value: 0.2 },
          { field: 'camera.framing', operation: 'set', value: 'tight' },
          { field: 'environment.density', operation: 'multiply', value: 1.5 },
          { field: 'actors.*.mobilityRestriction', operation: 'set', value: 0.8 },
          { field: 'lighting.shadowIntensity', operation: 'set', value: 0.8 }
        ],
        reasoning: 'Entrapment → minimal negative space, tight framing, dense environment, restricted movement'
      }
    ]
  },
  {
    pattern: /(?:tension|tense|confrontation|standoff)/i,
    createOperations: () => [
      {
        type: 'dramatic_staging',
        target: 'tension_composition',
        semanticMeaning: 'establish dramatic tension through staging',
        runtimeEffects: [
          { field: 'actors.*.facingBias', operation: 'set', value: 1.0 },
          { field: 'camera.mode', operation: 'set', value: 'tension' },
          { field: 'actors.*.spacing', operation: 'multiply', value: 0.8 },
          { field: 'lighting.contrastSeparation', operation: 'set', value: 0.8 }
        ],
        reasoning: 'Tension → direct facing, tension camera mode, compressed spacing, high contrast'
      }
    ]
  },
  {
    pattern: /(?:intimacy|intimate|close|tender|gentle)/i,
    createOperations: () => [
      {
        type: 'emotional_proximity',
        target: 'intimacy_staging',
        semanticMeaning: 'create intimate staging between characters',
        runtimeEffects: [
          { field: 'actors.*.spacing', operation: 'multiply', value: 0.4 },
          { field: 'camera.framing', operation: 'set', value: 'close_up' },
          { field: 'camera.mode', operation: 'set', value: 'over_the_shoulder' },
          { field: 'lighting.colorTemperature', operation: 'set', value: 'warm' },
          { field: 'lighting.ambientIntensity', operation: 'set', value: 0.4 }
        ],
        reasoning: 'Intimacy → very close spacing, close-up framing, warm lighting, soft ambient'
      }
    ]
  },
  {
    pattern: /(?:power|dominant|domination|authority|intimidat)/i,
    createOperations: () => [
      {
        type: 'power_dynamics',
        target: 'dominance_staging',
        semanticMeaning: 'establish power imbalance through staging',
        runtimeEffects: [
          { field: 'camera.angle', operation: 'set', value: 'low_angle' },
          { field: 'actors.0.scale', operation: 'multiply', value: 1.1 },
          { field: 'lighting.dramaticSpots', operation: 'set', value: 2 },
          { field: 'actors.0.postureBias', operation: 'set', value: 'upright' }
        ],
        reasoning: 'Power → low camera angle, scale emphasis, dramatic lighting, upright posture'
      }
    ]
  },
  {
    pattern: /(?:vulnerability|vulnerable|exposed|fragile|delicate)/i,
    createOperations: () => [
      {
        type: 'emotional_exposure',
        target: 'vulnerability_staging',
        semanticMeaning: 'expose character vulnerability through staging',
        runtimeEffects: [
          { field: 'camera.angle', operation: 'set', value: 'high_angle' },
          { field: 'composition.negativeSpace', operation: 'set', value: 0.7 },
          { field: 'lighting.ambientIntensity', operation: 'set', value: 0.8 },
          { field: 'actors.*.postureBias', operation: 'set', value: 'hunched' }
        ],
        reasoning: 'Vulnerability → high angle, exposed negative space, bright ambient, hunched posture'
      }
    ]
  }
];

export function buildSemanticGraphPlan(prompt: string, intent: CinematicIntent): SemanticGraphPlan {
  const operations: SemanticGraphOperation[] = [];

  for (const { pattern, createOperations } of SEMANTIC_PATTERNS) {
    const match = prompt.match(pattern);
    if (match) {
      operations.push(...createOperations(intent, match));
    }
  }

  // If no explicit patterns matched, infer from intent values
  if (operations.length === 0) {
    if (intent.visualIsolation > 0.6) {
      operations.push({
        type: 'inferred_composition',
        target: 'isolation_from_intent',
        semanticMeaning: 'intent-inferred isolation',
        runtimeEffects: [
          { field: 'composition.negativeSpace', operation: 'set', value: intent.visualIsolation },
          { field: 'camera.framing', operation: 'set', value: 'wide_shot' }
        ],
        reasoning: `High visual isolation (${intent.visualIsolation.toFixed(2)}) inferred from prompt`
      });
    }
    if (intent.tensionLevel > 0.6) {
      operations.push({
        type: 'inferred_tension',
        target: 'tension_from_intent',
        semanticMeaning: 'intent-inferred tension',
        runtimeEffects: [
          { field: 'camera.mode', operation: 'set', value: 'tension' },
          { field: 'lighting.contrastSeparation', operation: 'set', value: intent.tensionLevel }
        ],
        reasoning: `High tension (${intent.tensionLevel.toFixed(2)}) inferred from prompt`
      });
    }
  }

  return {
    operations,
    overallIntent: summarizeOperations(operations),
    reasoning: operations.map(o => o.reasoning).join('; ') || 'no semantic graph operations applied'
  };
}

function summarizeOperations(ops: SemanticGraphOperation[]): string {
  if (ops.length === 0) return 'no semantic modifications';
  const types = [...new Set(ops.map(o => o.type))];
  return types.join(' + ');
}

export type ResolutionFailureReason =
  | 'NO_MATCH'
  | 'AMBIGUOUS'
  | 'EMPTY_SCENE'
  | 'INVALID_CRITERIA';

export interface ResolutionFailure {
  reason: ResolutionFailureReason;
  message: string;
}

export type ActorIDResolutionResult =
  | { ok: true; actorId: string }
  | { ok: false; error: ResolutionFailure };

const VALID_EMOTIONS = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];

/**
 * Resolves a natural language description to exactly one Actor ID in the current SceneGraph.
 */
export function resolveActorReference(
  description: string,
  sceneGraph: SceneGraph
): ActorIDResolutionResult {
  if (!sceneGraph || !sceneGraph.actors || sceneGraph.actors.length === 0) {
    return {
      ok: false,
      error: {
        reason: 'EMPTY_SCENE',
        message: 'The scene graph has no actors'
      }
    };
  }

  if (!description || !description.trim()) {
    return {
      ok: false,
      error: {
        reason: 'INVALID_CRITERIA',
        message: 'The description is empty or invalid'
      }
    };
  }

  const descLower = description.toLowerCase().trim();
  let candidateActors = [...sceneGraph.actors];

  // 1. Check for exact match on ID or Label
  const directMatch = sceneGraph.actors.find(
    actor =>
      actor.id.toLowerCase() === descLower ||
      actor.label.toLowerCase() === descLower
  );
  if (directMatch) {
    return { ok: true, actorId: directMatch.id };
  }

  // 2. Filter by emotion if present in description
  const matchedEmotions = VALID_EMOTIONS.filter(emotion => descLower.includes(emotion));
  if (matchedEmotions.length > 0) {
    candidateActors = candidateActors.filter(actor => matchedEmotions.includes(actor.emotionState));
  }

  // 3. Apply spatial logic
  if (descLower.includes('left') || descLower.includes('leftmost')) {
    if (candidateActors.length > 1) {
      candidateActors.sort((a, b) => a.position.x - b.position.x);
      if (candidateActors[0].position.x === candidateActors[1].position.x) {
        return {
          ok: false,
          error: {
            reason: 'AMBIGUOUS',
            message: `Multiple characters are at the leftmost position for description "${description}"`
          }
        };
      }
    }
    if (candidateActors.length > 0) {
      return { ok: true, actorId: candidateActors[0].id };
    }
  }

  if (descLower.includes('right') || descLower.includes('rightmost')) {
    if (candidateActors.length > 1) {
      candidateActors.sort((a, b) => b.position.x - a.position.x);
      if (candidateActors[0].position.x === candidateActors[1].position.x) {
        return {
          ok: false,
          error: {
            reason: 'AMBIGUOUS',
            message: `Multiple characters are at the rightmost position for description "${description}"`
          }
        };
      }
    }
    if (candidateActors.length > 0) {
      return { ok: true, actorId: candidateActors[0].id };
    }
  }

  if (descLower.includes('middle') || descLower.includes('center')) {
    if (candidateActors.length > 1) {
      candidateActors.sort((a, b) => a.position.x - b.position.x);
      if (candidateActors.length % 2 === 0) {
        return {
          ok: false,
          error: {
            reason: 'AMBIGUOUS',
            message: `Staging is even-numbered, middle is ambiguous for description "${description}"`
          }
        };
      }
      const midIdx = Math.floor(candidateActors.length / 2);
      return { ok: true, actorId: candidateActors[midIdx].id };
    }
    if (candidateActors.length > 0) {
      return { ok: true, actorId: candidateActors[0].id };
    }
  }

  // If we applied emotion filtering and have candidates:
  if (matchedEmotions.length > 0) {
    if (candidateActors.length === 1) {
      return { ok: true, actorId: candidateActors[0].id };
    }
    if (candidateActors.length > 1) {
      return {
        ok: false,
        error: {
          reason: 'AMBIGUOUS',
          message: `Multiple characters match the emotion criteria in description "${description}"`
        }
      };
    }
    return {
      ok: false,
      error: {
        reason: 'NO_MATCH',
        message: `No characters match the emotion criteria in description "${description}"`
      }
    };
  }

  // 4. Fallback: partial match on ID or Label
  const partialMatches = sceneGraph.actors.filter(
    actor =>
      descLower.includes(actor.id.toLowerCase()) ||
      descLower.includes(actor.label.toLowerCase())
  );
  if (partialMatches.length === 1) {
    return { ok: true, actorId: partialMatches[0].id };
  } else if (partialMatches.length > 1) {
    return {
      ok: false,
      error: {
        reason: 'AMBIGUOUS',
        message: `Multiple characters partially match the name/ID in description "${description}"`
      }
    };
  }

  return {
    ok: false,
    error: {
      reason: 'NO_MATCH',
      message: `Could not resolve actor reference for description: "${description}"`
    }
  };
}
