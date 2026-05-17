export type Vector2 = {
  x: number;
  y: number;
};

export type ActorAction = 'idle' | 'walking' | 'sitting' | 'approaching' | 'pacing';
export type ActorEmotion = 'neutral' | 'sad' | 'happy' | 'nervous' | 'excited' | 'awkward' | 'angry' | 'exhausted';

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

export type CameraMode = 'static' | 'follow' | 'close_up' | 'wide_shot' | 'over_the_shoulder' | 'dramatic_zoom' | 'tension';

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  mode: CameraMode;
}

export interface SessionEntry {
  id: string;
  prompt: string;
  createdAt: number;
}

// --- Task 34: Cinematic Grammar ---

export type SceneTone = 'neutral' | 'sad' | 'tense' | 'lonely' | 'awkward' | 'energetic' | 'romantic' | 'threatening';

export interface CinematicTemplate {
  cameraMode: CameraMode;
  spacingMultiplier: number;
  motionEnergyScale: number;
  pauseFrequency: number;
  contrastBoost: number;
  headroom: number;
}

export interface CinematicGrammar {
  tone: SceneTone;
  template: CinematicTemplate;
}

// --- Task 54: Atmosphere Profile ---

export type AtmosphereEffect = 'rain' | 'fog' | 'flicker' | 'dust' | 'none';

export interface AtmosphereProfile {
  effects: AtmosphereEffect[];
  lightingTint: string;
  ambientIntensity: number;
}

// --- Task 55: Character Relationship ---

export type RelationshipType = 'stranger' | 'approaching' | 'confronting' | 'avoiding' | 'conversing';

export interface CharacterRelationship {
  actorAId: string;
  actorBId: string;
  type: RelationshipType;
  awarenessRadius: number;
  gazeTarget: string | null;
  emotionalReaction: ActorEmotion | null;
}

// --- Task 60: Staging Rule ---

export interface RelativePosition {
  actorIndex: number;
  x: number;
  y: number;
  facing: 'left' | 'right' | 'camera' | 'away';
}

export interface StagingRule {
  id: string;
  condition: string;
  actorPositions: RelativePosition[];
}

// --- Task 74: Scene Rhythm ---

export interface SceneRhythm {
  tempo: 'slow' | 'medium' | 'fast';
  pauseFrequencyPerMinute: number;
  motionEnergyCurve: 'linear' | 'ease-in' | 'ease-out' | 'sharp';
}

// --- Scene Graph (expanded) ---

export interface SceneGraph {
  id: string;
  version: number;
  actors: Actor[];
  environment: Environment;
  camera: Camera;
  sessionHistory: SessionEntry[];
  cinematicGrammar: CinematicGrammar;
  atmosphere: AtmosphereProfile;
  relationships: CharacterRelationship[];
  rhythm: SceneRhythm;
}
