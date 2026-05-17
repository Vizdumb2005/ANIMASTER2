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

  const actor: Actor = {
    id: 'actor_stickman',
    label: 'Stickman',
    type: 'humanoid',
    position: { x: 400, y: 360 },
    targetPosition: { x: 660, y: 360 },
    emotionState: 'sad',
    currentAction: 'walking',
    actionQueue: ['sitting'],
    joints: initActorJoints({ x: 400, y: 360 }),
    actionElapsed: 0
  };

  const sessionHistory: SessionEntry[] = [];

  return {
    id: 'scene_001',
    version: 1,
    actors: [actor],
    environment,
    camera,
    sessionHistory
  };
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
    notify();
  },

  mutateScene(mutator: (scene: SceneGraph) => void) {
    const draft = cloneScene(currentScene);
    mutator(draft);
    draft.version += 1;
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