import { Actor, ActorEmotion, AtmosphereProfile, BeatSequence, Camera, CinematicGrammar, Environment, SceneGraph, SceneRhythm, SessionEntry, SemanticMutationOperation } from '@animaster/shared/scene';
import { initActorJoints } from '../runtime/initActorJoints';
import { resetSceneEvaluator } from '../runtime/sceneEvaluator';
import { createDefaultAnchors } from '../runtime/semanticAnchors';
import { applySemanticOperations, ensureSemanticRuntimeState } from '../runtime/semanticOperations';
import { resetPoseTransitions } from '../runtime/poses/poseResolver';
import { resetArcAtmosphereCache } from '../runtime/arcs/arcAtmosphereEffect';

type SceneListener = (scene: SceneGraph) => void;

type DirectorIntent = Record<string, number>;

type ActorOverride = {
  actorId: string;
  emotion: ActorEmotion;
  intensity?: number;
};

type DirectingContext = {
  directorIntent: DirectorIntent;
  actorOverrides: ActorOverride[];
  beatSequence?: {
    id?: string;
    label?: string;
    currentIndex?: number;
    beats: Array<{ action: string; durationMs: number }>;
  };
};

const DEFAULT_DIRECTOR_INTENT: DirectorIntent = {
  emotionalIntensity: 0.5,
  visualDensity: 0.5,
  environmentalRichness: 0.5,
  symbolicAbstraction: 0.3,
  dialogueNaturalism: 0.6,
  cinematicRealism: 0.5,
  cameraAggression: 0.3,
  atmosphereWeight: 0.5,
  directorialIntensity: 0.5
};

function clamp01(value: number) {
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

let isPaused = false;
let playbackSpeed = 1;
let directorIntent: DirectorIntent = { ...DEFAULT_DIRECTOR_INTENT };
let actorOverrides: Record<string, ActorOverride> = {};

function createDefaultScene(): SceneGraph {
  const environment: Environment = {
    type: 'indoor_room',
    backgroundColor: '#17151f',
    floorColor: '#2d221f',
    wallColor: '#211c29',
    width: 960,
    height: 540
  };

  const camera: Camera = {
    x: 0,
    y: 0,
    zoom: 1,
    mode: 'static',
    plan: null,
    shot: { x: 0, y: 0, zoom: 1, targetX: 0, targetY: 0, targetZoom: 1, transitionProgress: 1, subjectIds: [] }
  };

  const cinematicGrammar: CinematicGrammar = {
    tone: 'neutral',
    template: {
      cameraMode: 'static',
      spacingMultiplier: 1.0,
      motionEnergyScale: 1.0,
      pauseFrequency: 4,
      contrastBoost: 0.0,
      headroom: 1.0
    }
  };

  const atmosphere: AtmosphereProfile = {
    effects: ['none'],
    lightingTint: 'rgba(0,0,0,0)',
    ambientIntensity: 1.0
  };

  const rhythm: SceneRhythm = {
    tempo: 'medium',
    pauseFrequencyPerMinute: 4,
    motionEnergyCurve: 'linear'
  };

  return {
    id: 'scene_001',
    version: 0,
    seed: 1001,
    simulation: { tick: 0, timeMs: 0, fixedDeltaMs: 1000 / 60, seed: 1001 },
    actors: [],
    environment,
    anchors: createDefaultAnchors(environment),
    camera,
    sessionHistory: [],
    mutationHistory: [],
    cinematicGrammar,
    atmosphere,
    relationships: [],
    rhythm,
    continuity: { lastValidatedVersion: 0, actorSnapshots: {}, cameraSnapshot: null, violations: [] }
  };
}

function deepMerge<T>(target: T, source: Partial<T>): T {
  const result = { ...target } as Record<string, unknown>;
  const src = source as Record<string, unknown>;
  const tgt = target as Record<string, unknown>;
  for (const key of Object.keys(src)) {
    const sourceVal = src[key];
    const targetVal = tgt[key];
    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      targetVal !== undefined &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result as T;
}

let currentScene = createDefaultScene();
const listeners = new Set<SceneListener>();

function cloneScene(scene: SceneGraph): SceneGraph {
  return structuredClone(scene);
}

function notify() {
  const snapshot = cloneScene(currentScene);
  for (const listener of listeners) {
    listener(snapshot);
  }
}

function applyActorOverrides(scene: SceneGraph) {
  const overrideValues = Object.values(actorOverrides);
  if (overrideValues.length === 0) return;

  const overrideMap = new Map(overrideValues.map((override) => [override.actorId, override]));
  for (const actor of scene.actors) {
    const override = overrideMap.get(actor.id);
    if (!override) continue;
    actor.emotionState = override.emotion;
    if (override.intensity !== undefined) {
      actor.emotionIntensity = override.intensity;
    }
  }
}

function cleanupActorOverrides(scene: SceneGraph) {
  const actorIds = new Set(scene.actors.map((actor) => actor.id));
  for (const actorId of Object.keys(actorOverrides)) {
    if (!actorIds.has(actorId)) {
      delete actorOverrides[actorId];
    }
  }
}

function summarizeBeatSequence(sequence?: BeatSequence): DirectingContext['beatSequence'] | undefined {
  if (!sequence || !Array.isArray(sequence.beats)) return undefined;
  return {
    id: sequence.id,
    label: sequence.label,
    currentIndex: sequence.currentIndex,
    beats: sequence.beats.map((beat) => ({
      action: beat.action,
      durationMs: beat.durationMs
    }))
  };
}

export const sceneStore = {
  getScene(): SceneGraph {
    return cloneScene(currentScene);
  },

  getDirectorIntent(): DirectorIntent {
    return { ...directorIntent };
  },

  setDirectorIntent(key: string, value: number) {
    directorIntent = { ...directorIntent, [key]: clamp01(value) };
  },

  setActorOverride(actorId: string, emotion: ActorEmotion, intensity?: number) {
    actorOverrides = { ...actorOverrides, [actorId]: { actorId, emotion, intensity } };
  },

  getActorOverrides(): ActorOverride[] {
    return Object.values(actorOverrides);
  },

  clearActorOverrides() {
    actorOverrides = {};
  },

  getDirectingContext(): DirectingContext {
    return {
      directorIntent: { ...directorIntent },
      actorOverrides: Object.values(actorOverrides),
      beatSequence: summarizeBeatSequence(currentScene.beatSequence)
    };
  },

  setScene(scene: SceneGraph) {
    resetSceneEvaluator();
    currentScene = cloneScene(scene);
    ensureSemanticRuntimeState(currentScene);
    actorOverrides = {};
    for (const actor of currentScene.actors) {
      actor.joints = initActorJoints(actor.position);
    }
    notify();
  },

  mutateScene(mutator: (scene: SceneGraph) => void) {
    const draft = cloneScene(currentScene);
    mutator(draft);
    ensureSemanticRuntimeState(draft);
    if (draft.simulation) {
      draft.simulation.tick += 1;
      draft.simulation.timeMs += draft.simulation.fixedDeltaMs;
    }
    currentScene = draft;
    notify();
  },

  applyPatch(patch: Partial<SceneGraph>, prompt: string) {
    const draft = cloneScene(currentScene);
    ensureSemanticRuntimeState(draft);

    const operations = (patch as Partial<SceneGraph> & { semanticOperations?: SemanticMutationOperation[] }).semanticOperations;
    if (Array.isArray(operations) && operations.length > 0) {
      applySemanticOperations(draft, operations);
    }

    if (patch.environment) {
      draft.environment = deepMerge(draft.environment, patch.environment);
    }

    if (patch.camera) {
      draft.camera = deepMerge(draft.camera, patch.camera);
    }

    if (Array.isArray(patch.actors)) {
      draft.actors = patch.actors.map((patchActor) => {
        const existing = draft.actors.find((a) => a.id === patchActor.id);
        if (existing) {
          const merged = deepMerge(
            existing as unknown as Record<string, unknown>,
            patchActor as unknown as Record<string, unknown>
          ) as unknown as Actor;
          merged.joints = initActorJoints(merged.position);
          return merged;
        }
        const newActor = { ...patchActor };
        newActor.joints = initActorJoints(newActor.position);
        return newActor;
      });
    }

    if (patch.cinematicGrammar) {
      draft.cinematicGrammar = deepMerge(draft.cinematicGrammar, patch.cinematicGrammar);
    }

    if (patch.atmosphere) {
      draft.atmosphere = deepMerge(draft.atmosphere, patch.atmosphere);
    }

    if (Array.isArray(patch.relationships)) {
      draft.relationships = patch.relationships;
    }

    if (patch.rhythm) {
      draft.rhythm = deepMerge(draft.rhythm, patch.rhythm);
    }

    const hasMeaningfulChanges = !!(
      patch.environment ||
      patch.camera ||
      patch.cinematicGrammar ||
      patch.atmosphere ||
      patch.rhythm ||
      Array.isArray(patch.actors) ||
      Array.isArray(patch.relationships)
    );

    if (hasMeaningfulChanges) {
      // Phase 2.6 fields are computed at runtime — clear them so they recompute
      draft.emotionalSpatial = undefined;
      draft.dramaticBeats = undefined;
      draft.shotIntent = undefined;
      draft.attentionFocus = undefined;
      draft.compositionMetrics = undefined;
      draft.powerDynamics = undefined;
      draft.tensionState = undefined;
      draft.anticipationState = undefined;
      // Phase 2.7 fields — clear so they reinitialize from new tone
      resetPoseTransitions();
      resetArcAtmosphereCache();
      draft.beatSequence = undefined;
      draft.emotionalArc = undefined;
      draft.reactionChains = undefined;
      draft.storyAnchors = undefined;
      draft.sceneEvolution = undefined;
      draft.cinematicMomentScore = undefined;
      // Phase 3 fields — clear so they recompute from new tone
      draft.environmentReaction = undefined;
    }

    cleanupActorOverrides(draft);
    applyActorOverrides(draft);
    ensureSemanticRuntimeState(draft);
    draft.version += 1;
    if (Array.isArray(operations) && operations.length > 0) {
      draft.mutationHistory = [
        ...(draft.mutationHistory ?? []),
        { id: `mutation_${draft.version}`, prompt, createdAt: draft.simulation?.timeMs ?? draft.version, operations }
      ];
    }
    draft.sessionHistory = [
      ...draft.sessionHistory,
      {
        id: `session_entry_${draft.sessionHistory.length + 1}`,
        prompt,
        createdAt: draft.simulation?.timeMs ?? draft.version
      }
    ];

    if (draft.simulation) {
      draft.simulation.tick += 1;
      draft.simulation.timeMs += draft.simulation.fixedDeltaMs;
    }
    currentScene = draft;
    notify();
  },

  setPaused(paused: boolean) {
    isPaused = paused;
  },

  isPaused(): boolean {
    return isPaused;
  },

  setPlaybackSpeed(speed: number) {
    playbackSpeed = speed;
  },

  getPlaybackSpeed(): number {
    return playbackSpeed;
  },

  resetScene() {
    resetSceneEvaluator();
    resetPoseTransitions();
    resetArcAtmosphereCache();
    currentScene = createDefaultScene();
    isPaused = false;
    playbackSpeed = 1;
    actorOverrides = {};
    notify();
  },

  onSceneChange(listener: SceneListener) {
    listeners.add(listener);
    listener(cloneScene(currentScene));
    return () => {
      listeners.delete(listener);
    };
  }
};
