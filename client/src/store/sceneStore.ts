import { Actor, ActorEmotion, AtmosphereProfile, BeatSequence, Camera, CinematicGrammar, Environment, SceneGraph, SceneRhythm, SessionEntry, SemanticMutationOperation } from '@animaster/shared/scene';
import {
  applyMutations,
  type SceneGraphMutation,
} from '@animaster/shared/mutations';
import { initActorJoints } from '../runtime/initActorJoints';
import { resetSceneEvaluator } from '../runtime/sceneEvaluator';
import { createDefaultAnchors } from '../runtime/semanticAnchors';
import { applySemanticOperations, ensureSemanticRuntimeState } from '../runtime/semanticOperations';
import { resetPoseTransitions } from '../runtime/poses/poseResolver';
import { resetArcAtmosphereCache } from '../runtime/arcs/arcAtmosphereEffect';

type SceneListener = (scene: SceneGraph) => void;

type SeriesListener = (series: SceneSeries) => void;

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

// ---- Scene Series ----
export type SceneSeries = {
  id: string;
  title: string;
  scenes: SceneGraph[];
  activeIndex: number;
};

function createDefaultSeries(): SceneSeries {
  return { id: 'series_001', title: 'Untitled Series', scenes: [], activeIndex: 0 };
}

let currentSeries: SceneSeries = createDefaultSeries();
const seriesListeners = new Set<SeriesListener>();

function notifySeries() {
  const snap = structuredClone(currentSeries);
  for (const l of seriesListeners) l(snap);
}

// ---- Scene state ----
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

    // Build an array of SceneGraphMutation objects from the patch
    // using the shared applyMutation() as the single source of truth
    const mutations: SceneGraphMutation[] = [];

    const operations = (patch as Partial<SceneGraph> & { semanticOperations?: SemanticMutationOperation[] }).semanticOperations;
    if (Array.isArray(operations) && operations.length > 0) {
      applySemanticOperations(draft, operations);
    }

    if (patch.environment) {
      mutations.push({
        type: 'UpdateEnvironment',
        environment: patch.environment,
      });
    }

    if (patch.camera) {
      mutations.push({
        type: 'UpdateCamera',
        camera: patch.camera,
      });
    }

    if (Array.isArray(patch.actors)) {
      const existingIds = new Set(draft.actors.map(a => a.id));
      for (const patchActor of patch.actors) {
        if (existingIds.has(patchActor.id)) {
          // Update existing actor
          mutations.push({
            type: 'UpdateActor',
            actorId: patchActor.id,
            patch: patchActor,
          });
        } else {
          // Add new actor
          mutations.push({
            type: 'AddActor',
            actor: patchActor as Actor,
          });
        }
      }
    }

    if (patch.cinematicGrammar) {
      mutations.push({
        type: 'UpdateCinematicGrammar',
        cinematicGrammar: patch.cinematicGrammar,
      });
    }

    if (patch.atmosphere) {
      mutations.push({
        type: 'UpdateAtmosphere',
        atmosphere: patch.atmosphere,
      });
    }

    if (Array.isArray(patch.relationships)) {
      mutations.push({
        type: 'SetRelationships',
        relationships: patch.relationships,
      });
    }

    if (patch.rhythm) {
      mutations.push({
        type: 'UpdateRhythm',
        rhythm: patch.rhythm,
      });
    }

    // Apply all mutations atomically using shared applyMutations()
    if (mutations.length > 0) {
      // We apply mutations to a plain clone first, then merge back into draft
      // to preserve the runtime state references already set up
      const result = applyMutations(draft, mutations);
      // Copy all fields from result back to draft (draft is what we'll use)
      Object.assign(draft, result);
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

    // Reinitialize joints for actors that may have been mutated
    for (const actor of draft.actors) {
      if (!actor.joints) {
        actor.joints = initActorJoints(actor.position);
      }
    }

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

  // ---- Series API ----
  getSeries(): SceneSeries {
    return structuredClone(currentSeries);
  },

  onSeriesChange(listener: SeriesListener) {
    seriesListeners.add(listener);
    listener(structuredClone(currentSeries));
    return () => { seriesListeners.delete(listener); };
  },

  setSeriesTitle(title: string) {
    currentSeries = { ...currentSeries, title };
    notifySeries();
  },

  addSceneToSeries(scene: SceneGraph, title?: string) {
    const tagged = { ...structuredClone(scene), seriesTitle: title };
    const scenes = [...currentSeries.scenes, tagged];
    currentSeries = { ...currentSeries, scenes, activeIndex: scenes.length - 1 };
    notifySeries();
  },

  navigateSeriesTo(index: number) {
    if (index < 0 || index >= currentSeries.scenes.length) return;
    currentSeries = { ...currentSeries, activeIndex: index };
    const target = structuredClone(currentSeries.scenes[index]);
    resetSceneEvaluator();
    resetPoseTransitions();
    resetArcAtmosphereCache();
    currentScene = target;
    ensureSemanticRuntimeState(currentScene);
    actorOverrides = {};
    notify();
    notifySeries();
  },

  removeSceneFromSeries(index: number) {
    const scenes = currentSeries.scenes.filter((_, i) => i !== index);
    const activeIndex = Math.min(currentSeries.activeIndex, Math.max(0, scenes.length - 1));
    currentSeries = { ...currentSeries, scenes, activeIndex };
    notifySeries();
  },

  resetSeries() {
    currentSeries = createDefaultSeries();
    notifySeries();
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