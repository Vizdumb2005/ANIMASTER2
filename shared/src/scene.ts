export type Vector2 = {
  x: number;
  y: number;
};

export type ActorAction = 'idle' | 'walking' | 'sitting';
export type ActorEmotion = 'neutral' | 'sad' | 'happy' | 'nervous';

export interface StickmanJoints {
  head: Vector2;
  torso: Vector2;
  leftArm: Vector2;
  rightArm: Vector2;
  leftLeg: Vector2;
  rightLeg: Vector2;
}

export interface Actor {
  id: string;
  label: string;
  type: 'humanoid';
  position: Vector2;
  targetPosition: Vector2 | null;
  emotionState: ActorEmotion;
  currentAction: ActorAction;
  actionQueue: ActorAction[];
  joints: StickmanJoints;
  actionElapsed: number;
}

export interface Environment {
  type: string;
  backgroundColor: string;
  floorColor: string;
  wallColor: string;
  width: number;
  height: number;
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  mode: 'static' | 'follow';
}

export interface SessionEntry {
  id: string;
  prompt: string;
  createdAt: number;
}

export interface SceneGraph {
  id: string;
  version: number;
  actors: Actor[];
  environment: Environment;
  camera: Camera;
  sessionHistory: SessionEntry[];
}