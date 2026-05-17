import { Actor, Camera, Environment, SceneGraph, SessionEntry } from '@animaster/shared/scene';
import { initActorJoints } from '../runtime/initActorJoints';

type SceneListener = (scene: SceneGraph) => void;

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
    mode: 'static'
  };

  return {
    id: 'scene_001',
    version: 0,
    actors: [],
    environment,
    camera,
    sessionHistory: []
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

export const sceneStore = {
  getScene(): SceneGraph {
    return cloneScene(currentScene);
  },

  setScene(scene: SceneGraph) {
    currentScene = cloneScene(scene);
    for (const actor of currentScene.actors) {
      actor.joints = initActorJoints(actor.position);
    }
    notify();
  },

  mutateScene(mutator: (scene: SceneGraph) => void) {
    const draft = cloneScene(currentScene);
    mutator(draft);
    currentScene = draft;
    notify();
  },

  applyPatch(patch: Partial<SceneGraph>, prompt: string) {
    const draft = cloneScene(currentScene);

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

    draft.version += 1;
    draft.sessionHistory = [
      ...draft.sessionHistory,
      {
        id: `session_entry_${draft.sessionHistory.length + 1}`,
        prompt,
        createdAt: Date.now()
      }
    ];

    currentScene = draft;
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
