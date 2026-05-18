export type Vector2 = {
  x: number;
  y: number;
};

export type ActorAction = 'idle' | 'walking' | 'sitting' | 'approaching' | 'pacing';
export type ActionType = 'idle' | 'waiting' | 'walkingTo' | 'approaching' | 'sittingDown' | 'seated' | 'lookingAt' | 'hesitating' | 'pacing';
export type ActionPhase = 'queued' | 'starting' | 'executing' | 'settling' | 'sustained' | 'completed' | 'interrupted' | 'failed';
export type ActionStatus = 'queued' | 'active' | 'blocked' | 'complete' | 'cancelled';
export type ActorEmotion = 'neutral' | 'sad' | 'happy' | 'nervous' | 'excited' | 'awkward' | 'angry' | 'exhausted';

export interface StickmanJoints {
  head: Vector2;
  torso: Vector2;
  leftArm: Vector2;
  rightArm: Vector2;
  leftLeg: Vector2;
  rightLeg: Vector2;
}

export type ActionTarget =
  | { kind: 'position'; position: Vector2 }
  | { kind: 'anchor'; anchorId: string }
  | { kind: 'actor'; actorId: string }
  | { kind: 'none' };

export interface ActionInstance {
  id: string;
  type: ActionType;
  target: ActionTarget | null;
  semanticReason: string;
  phase: ActionPhase;
  startedAt: number;
  duration: number | null;
  priority: number;
  interruptible: boolean;
  status: ActionStatus;
}

export interface ActingState {
  nextBeatAt: number;
  activePrimitive: 'none' | 'weight_shift' | 'look_around' | 'hesitation' | 'fidget' | 'gaze';
  primitiveStartedAt: number;
  primitiveDuration: number;
  direction: number;
  pauseUntil: number;
}

export interface Actor {
  id: string;
  label: string;
  type: 'humanoid';
  position: Vector2;
  targetPosition: Vector2 | null;
  emotionState: ActorEmotion;
  emotionIntensity?: number;
  currentAction: ActorAction;
  actionQueue: ActorAction[];
  activeAction?: ActionInstance | null;
  actionPlan?: ActionInstance[];
  joints: StickmanJoints;
  actingState?: ActingState;
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

export interface CameraPlan {
  id: string;
  mode: CameraMode;
  subjectIds: string[];
  framingIntent: 'isolate' | 'follow' | 'observe' | 'compress' | 'reveal' | 'confront';
  transition: 'cut' | 'ease' | 'slow_drift' | 'push_in' | 'pull_back';
  semanticReason: string;
  holdMs: number | null;
}

export interface ShotState {
  x: number;
  y: number;
  zoom: number;
  targetX: number;
  targetY: number;
  targetZoom: number;
  transitionProgress: number;
  subjectIds: string[];
}

export interface Camera {
  x: number;
  y: number;
  zoom: number;
  mode: CameraMode;
  plan?: CameraPlan | null;
  shot?: ShotState;
}

export interface SessionEntry {
  id: string;
  prompt: string;
  createdAt: number;
}

export type AnchorType = 'door' | 'chair' | 'streetlight' | 'window' | 'foreground' | 'background' | 'center' | 'edge' | 'entrance';
export type AnchorAffordance = 'enter' | 'sit' | 'stand_under' | 'look_out' | 'wait' | 'approach_from' | 'frame_subject';

export interface SemanticAnchor {
  id: string;
  type: AnchorType;
  label: string;
  position: Vector2;
  radius: number;
  affordances: AnchorAffordance[];
}

export interface SimulationState {
  tick: number;
  timeMs: number;
  fixedDeltaMs: number;
  seed: number;
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
  preferredDistance?: number;
  tension?: number;
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

export interface ContinuityViolation {
  id: string;
  severity: 'warning' | 'error';
  field: string;
  message: string;
  repairApplied: boolean;
}

export interface ContinuityState {
  lastValidatedVersion: number;
  actorSnapshots: Record<string, { position: Vector2; emotionState: ActorEmotion; actionType: ActionType | ActorAction }>;
  cameraSnapshot: { x: number; y: number; zoom: number; mode: CameraMode } | null;
  violations: ContinuityViolation[];
}

export type SemanticMutationOperation =
  | { type: 'SetTone'; tone: SceneTone; reason: string }
  | { type: 'AdjustLighting'; tint?: string; ambientIntensity?: number; reason: string }
  | { type: 'AddAtmosphere'; effect: AtmosphereEffect; reason: string }
  | { type: 'QueueActorAction'; actorId: string; action: ActionInstance; reason: string }
  | { type: 'SetActorEmotion'; actorId: string; emotion: ActorEmotion; intensity?: number; reason: string }
  | { type: 'RestageScene'; strategy: 'preserve_actions' | 'tone_composition'; reason: string }
  | { type: 'MoveActorToAnchor'; actorId: string; anchorId: string; reason: string }
  | { type: 'AdjustRelationship'; actorAId: string; actorBId: string; patch: Partial<CharacterRelationship>; reason: string }
  | { type: 'FocusCameraOn'; subjectIds: string[]; framingIntent: CameraPlan['framingIntent']; reason: string };

export interface SemanticMutationRecord {
  id: string;
  prompt: string;
  createdAt: number;
  operations: SemanticMutationOperation[];
}

// --- Scene Graph (expanded) ---

export interface SceneGraph {
  id: string;
  version: number;
  seed?: number;
  simulation?: SimulationState;
  actors: Actor[];
  environment: Environment;
  anchors?: SemanticAnchor[];
  camera: Camera;
  sessionHistory: SessionEntry[];
  mutationHistory?: SemanticMutationRecord[];
  cinematicGrammar: CinematicGrammar;
  atmosphere: AtmosphereProfile;
  relationships: CharacterRelationship[];
  rhythm: SceneRhythm;
  continuity?: ContinuityState;
}
