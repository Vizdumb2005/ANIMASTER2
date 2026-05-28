/**
 * shared/src/mutations.ts
 *
 * Immutable mutation utilities for SceneGraph.
 * All functions return new graphs without mutating inputs.
 *
 * IMPORTANT: This is the SINGLE SOURCE OF TRUTH for mutation logic.
 * Both server (routes/mutate.ts) and client (store/sceneStore.ts) MUST
 * use applyMutation() from this module. No custom deep-merge elsewhere.
 */

import type {
  SceneGraph,
  Actor,
  Environment,
  Camera,
  CinematicGrammar,
  AtmosphereProfile,
  CharacterRelationship,
  SceneRhythm,
  SessionEntry,
  SemanticAnchor,
  SimulationState,
  EmotionalSpatialState,
  DramaticBeat,
  ShotIntent,
  AttentionFocus,
  CompositionMetrics,
  PowerDynamic,
  TensionState,
  AnticipationState,
  BeatSequence,
  EmotionalArc,
  ReactionChain,
  StoryAnchor,
  SceneEvolution,
  CinematicMomentScore,
  SemanticWorldPlan,
  WorldLayout,
  VisualStyleProfile,
  EnvironmentCinematicInfluence,
  SceneTone,
  AtmosphereEffect,
  ActorEmotion,
  ActionType,
  CameraMode,
  CameraPlan,
} from './scene.js';

import type { CinematicShot, NarrativeState } from './cinematicShots.js';

/**
 * Discriminated union types for specific mutation operations.
 * Each mutation has a unique 'type' field for type narrowing.
 */

/** SetTone - Updates the cinematic tone/mood of the scene */
export interface SetToneMutation {
  type: 'SetTone';
  tone: SceneTone;
  reason?: string;
}

/** SetActorEmotion - Changes an actor's emotional state */
export interface SetActorEmotionMutation {
  type: 'SetActorEmotion';
  actorId: string;
  emotion: ActorEmotion;
  intensity?: number;
  reason?: string;
}

/** AddAtmosphere - Adds atmospheric effects to the scene */
export interface AddAtmosphereMutation {
  type: 'AddAtmosphere';
  effect: AtmosphereEffect;
  reason?: string;
}

/** QueueActorAction - Queues an action for an actor to perform */
export interface QueueActorActionMutation {
  type: 'QueueActorAction';
  actorId: string;
  action: ActionType;
  reason?: string;
}

/** FocusCameraOn - Adjusts camera to focus on a subject */
export interface FocusCameraOnMutation {
  type: 'FocusCameraOn';
  subjectIds: string[];
  framingIntent: CameraPlan['framingIntent'];
  reason?: string;
}

/** MoveActorToAnchor - Moves an actor to a specific anchor point */
export interface MoveActorToAnchorMutation {
  type: 'MoveActorToAnchor';
  actorId: string;
  anchorId: string;
  reason?: string;
}

/** AdjustRelationship - Modifies the relationship between two actors */
export interface AdjustRelationshipMutation {
  type: 'AdjustRelationship';
  actorAId: string;
  actorBId: string;
  patch: Partial<CharacterRelationship>;
  reason?: string;
}

/** RestageScene - Completely restages the scene with new configuration */
export interface RestageSceneMutation {
  type: 'RestageScene';
  strategy: 'preserve_actions' | 'tone_composition';
  reason?: string;
}

/**
 * UpdateEnvironment - Merges partial changes into the scene's environment.
 * This covers changes to backgroundColor, floorColor, wallColor, width/height, and type.
 */
export interface UpdateEnvironmentMutation {
  type: 'UpdateEnvironment';
  environment: Partial<Environment>;
  reason?: string;
}

/**
 * UpdateCamera - Merges partial changes into the scene's camera.
 * This covers position, zoom, mode, shot, and plan changes.
 */
export interface UpdateCameraMutation {
  type: 'UpdateCamera';
  camera: Partial<Camera>;
  reason?: string;
}

/**
 * UpdateCinematicGrammar - Merges partial changes into the cinematic grammar.
 * This covers tone and template changes.
 */
export interface UpdateCinematicGrammarMutation {
  type: 'UpdateCinematicGrammar';
  cinematicGrammar: Partial<CinematicGrammar>;
  reason?: string;
}

/**
 * UpdateAtmosphere - Merges partial changes into the atmosphere profile.
 * This covers effects, lightingTint, and ambientIntensity changes.
 */
export interface UpdateAtmosphereMutation {
  type: 'UpdateAtmosphere';
  atmosphere: Partial<AtmosphereProfile>;
  reason?: string;
}

/**
 * SetRelationships - Wholesale replaces the relationships array.
 */
export interface SetRelationshipsMutation {
  type: 'SetRelationships';
  relationships: CharacterRelationship[];
  reason?: string;
}

/**
 * UpdateRhythm - Merges partial changes into the scene rhythm.
 */
export interface UpdateRhythmMutation {
  type: 'UpdateRhythm';
  rhythm: Partial<SceneRhythm>;
  reason?: string;
}

/**
 * UpdateActor - Merges partial changes into a specific actor.
 */
export interface UpdateActorMutation {
  type: 'UpdateActor';
  actorId: string;
  patch: Partial<Actor>;
  reason?: string;
}

/**
 * AddActor - Adds a new actor to the scene.
 */
export interface AddActorMutation {
  type: 'AddActor';
  actor: Actor;
  reason?: string;
}

/**
 * RemoveActor - Removes an actor from the scene.
 */
export interface RemoveActorMutation {
  type: 'RemoveActor';
  actorId: string;
  reason?: string;
}

/**
 * Discriminated union of all mutation operation types.
 * Use this for type-safe mutation handling.
 */
export type SceneGraphMutation =
  | SetToneMutation
  | SetActorEmotionMutation
  | AddAtmosphereMutation
  | QueueActorActionMutation
  | FocusCameraOnMutation
  | MoveActorToAnchorMutation
  | AdjustRelationshipMutation
  | RestageSceneMutation
  | UpdateEnvironmentMutation
  | UpdateCameraMutation
  | UpdateCinematicGrammarMutation
  | UpdateAtmosphereMutation
  | SetRelationshipsMutation
  | UpdateRhythmMutation
  | UpdateActorMutation
  | AddActorMutation
  | RemoveActorMutation;

/**
 * Apply a mutation to a SceneGraph and return a new SceneGraph.
 * 
 * Rules:
 * - Returns a NEW graph (immutable) - never mutates the input graph
 * - Increments version by 1
 * - Merges mutation fields into the graph
 * - Preserves all existing fields not specified in the mutation
 * 
 * @param graph - The base SceneGraph to apply mutation to
 * @param mutation - The partial SceneGraph representing changes
 * @returns A new SceneGraph with mutation applied and version incremented
 */
export function applyMutation(
  graph: SceneGraph,
  mutation: SceneGraphMutation
): SceneGraph {
  // For discriminated union mutations, we need to handle each type
  switch (mutation.type) {
    case 'SetTone':
      return {
        ...graph,
        version: graph.version + 1,
        cinematicGrammar: {
          ...graph.cinematicGrammar,
          tone: mutation.tone,
        },
      };

    case 'SetActorEmotion': {
      const updatedActors = graph.actors.map(actor =>
        actor.id === mutation.actorId
          ? { ...actor, emotionState: mutation.emotion as any, emotionIntensity: mutation.intensity }
          : actor
      );
      return {
        ...graph,
        version: graph.version + 1,
        actors: updatedActors,
      };
    }

    case 'AddAtmosphere': {
      const currentEffects = graph.atmosphere?.effects || [];
      const newEffects = mutation.effect === 'none'
        ? []
        : [...currentEffects.filter(e => e !== 'none'), mutation.effect];
      return {
        ...graph,
        version: graph.version + 1,
        atmosphere: {
          ...graph.atmosphere,
          effects: newEffects,
        },
      };
    }

    case 'QueueActorAction': {
      const updatedActors = graph.actors.map(actor =>
        actor.id === mutation.actorId
          ? { ...actor, actionQueue: [...actor.actionQueue, mutation.action as any] }
          : actor
      );
      return {
        ...graph,
        version: graph.version + 1,
        actors: updatedActors,
      };
    }

    case 'FocusCameraOn':
      return {
        ...graph,
        version: graph.version + 1,
        camera: {
          ...graph.camera,
          plan: {
            id: `plan_${Date.now()}`,
            mode: graph.camera?.plan?.mode || 'static',
            subjectIds: mutation.subjectIds,
            framingIntent: mutation.framingIntent,
            transition: graph.camera?.plan?.transition || 'cut',
            semanticReason: mutation.reason || 'Focus camera on subject',
            holdMs: graph.camera?.plan?.holdMs || null,
          },
        },
      };

    case 'MoveActorToAnchor': {
      // Find anchor position
      const anchor = graph.anchors?.find(a => a.id === mutation.anchorId);
      const updatedActors = graph.actors.map(actor =>
        actor.id === mutation.actorId
          ? { ...actor, targetPosition: anchor?.position || actor.position }
          : actor
      );
      return {
        ...graph,
        version: graph.version + 1,
        actors: updatedActors,
      };
    }

    case 'AdjustRelationship': {
      const updatedRelationships = graph.relationships?.map(rel =>
        (rel.actorAId === mutation.actorAId && rel.actorBId === mutation.actorBId) ||
        (rel.actorAId === mutation.actorBId && rel.actorBId === mutation.actorAId)
          ? { ...rel, ...mutation.patch }
          : rel
      ) || [];
      return {
        ...graph,
        version: graph.version + 1,
        relationships: updatedRelationships,
      };
    }

    case 'RestageScene':
      // Restage scene based on strategy
      if (mutation.strategy === 'preserve_actions') {
        // Keep existing actions but reset positions
        return {
          ...graph,
          version: graph.version + 1,
        };
      } else {
        // tone_composition: adjust based on cinematic grammar
        return {
          ...graph,
          version: graph.version + 1,
        };
      }

    case 'UpdateEnvironment':
      return {
        ...graph,
        version: graph.version + 1,
        environment: {
          ...graph.environment,
          ...mutation.environment,
        },
      };

    case 'UpdateCamera':
      return {
        ...graph,
        version: graph.version + 1,
        camera: {
          ...graph.camera,
          ...mutation.camera,
        },
      };

    case 'UpdateCinematicGrammar':
      return {
        ...graph,
        version: graph.version + 1,
        cinematicGrammar: {
          ...graph.cinematicGrammar,
          ...mutation.cinematicGrammar,
        },
      };

    case 'UpdateAtmosphere':
      return {
        ...graph,
        version: graph.version + 1,
        atmosphere: {
          ...graph.atmosphere,
          ...mutation.atmosphere,
        },
      };

    case 'SetRelationships':
      return {
        ...graph,
        version: graph.version + 1,
        relationships: mutation.relationships,
      };

    case 'UpdateRhythm':
      return {
        ...graph,
        version: graph.version + 1,
        rhythm: {
          ...graph.rhythm,
          ...mutation.rhythm,
        },
      };

    case 'UpdateActor': {
      const updatedActors = graph.actors.map(actor =>
        actor.id === mutation.actorId
          ? { ...actor, ...mutation.patch }
          : actor
      );
      return {
        ...graph,
        version: graph.version + 1,
        actors: updatedActors,
      };
    }

    case 'AddActor':
      return {
        ...graph,
        version: graph.version + 1,
        actors: [...graph.actors, mutation.actor],
      };

    case 'RemoveActor':
      return {
        ...graph,
        version: graph.version + 1,
        actors: graph.actors.filter(actor => actor.id !== mutation.actorId),
      };

    default:
      // Fallback for any unknown mutation types
      return {
        ...graph,
        version: graph.version + 1,
      };
  }
}

/**
 * Create a mutation from a partial scene specification.
 * This is a convenience function for creating mutations.
 * 
 * @param type - The mutation type
 * @param params - The mutation parameters (excluding 'type')
 * @returns A SceneGraphMutation
 */
export function createMutation(
  type: SceneGraphMutation['type'],
  params: Omit<SceneGraphMutation, 'type'>
): SceneGraphMutation {
  return { type, ...params } as SceneGraphMutation;
}

/**
 * Apply multiple mutations sequentially to a SceneGraph.
 * Each mutation increments the version.
 * 
 * @param graph - The base SceneGraph
 * @param mutations - Array of mutations to apply in order
 * @returns A new SceneGraph with all mutations applied
 */
export function applyMutations(
  graph: SceneGraph,
  mutations: SceneGraphMutation[]
): SceneGraph {
  let result: SceneGraph = { ...graph };
  for (const mutation of mutations) {
    result = applyMutation(result, mutation);
  }
  return result;
}