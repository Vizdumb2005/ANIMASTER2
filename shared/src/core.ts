// Animaster Core Types — implements the data model from design.md
// These types define the contract between all system layers.

// ============================================================
// Primitives
// ============================================================

export type Vector2 = { x: number; y: number };

export type Rect2D = { x: number; y: number; width: number; height: number };

export interface Transform2D {
  position: Vector2;
  rotation: number; // radians
  scale: Vector2;
}

// ============================================================
// Entity types
// ============================================================

export type EntityType = 'humanoid' | 'quadruped' | 'object';
export type LODLevel = 0 | 1 | 2;

// ============================================================
// Rig system
// ============================================================

export type JointCategory = 'spine' | 'limbs' | 'extremities' | 'auxiliary';

export interface JointConstraint {
  minAngle: number;
  maxAngle: number;
  maxLength?: number;
}

export interface Joint {
  id: string;
  category: JointCategory;
  parentId: string | null;
  localTransform: Transform2D;
  constraints: JointConstraint;
}

export interface RigStyleParams {
  limbLength?: number;
  headSize?: number;
  torsoWidth?: number;
  silhouetteStyle?: string;
}

export interface Rig {
  id: string;
  archetype: EntityType;
  joints: Joint[];
  constraints: JointConstraint[];
  styleParams: RigStyleParams;
}

// ============================================================
// Motion system
// ============================================================

export type BehaviorLayerIndex = 1 | 2 | 3 | 4;

export type MotionParameter =
  | { type: 'scalar'; value: number; min: number; max: number }
  | { type: 'enum'; value: string; options: string[] }
  | { type: 'probability'; value: number }; // 0.0–1.0

export interface MotionRule {
  jointId: string;
  expression: string; // parameterized expression
  layer: BehaviorLayerIndex;
}

export interface MotionBehavior {
  id: string;
  name: string;
  targetArchetype: EntityType;
  parameters: Record<string, MotionParameter>;
  rules: MotionRule[];
  blendWeight: number; // 0.0–1.0
}

export interface ActiveBehavior {
  behaviorId: string;
  blendWeight: number;
  startedAt: number;
}

export interface BehaviorLayer {
  index: BehaviorLayerIndex;
  enabled: boolean;
  behaviors: ActiveBehavior[];
  isOverride: boolean; // if true, replaces lower layers rather than adding
}

export interface BehaviorLayerSet {
  layer1_locomotion: BehaviorLayer;
  layer2_emotion: BehaviorLayer;
  layer3_gesture: BehaviorLayer;
  layer4_micro: BehaviorLayer;
}

// ============================================================
// Motion primitives & grammar
// ============================================================

export interface PrimitiveKeyframe {
  timeMs: number;
  jointTransforms: Record<string, Partial<Transform2D>>;
}

export interface MotionPrimitive {
  id: string;
  name: string;
  targetJoints: string[];
  durationMs: number;
  keyframes: PrimitiveKeyframe[];
  compatibleArchetypes: EntityType[];
}

export interface PhysicalConstraint {
  jointId: string;
  maxAngle?: number;
  minAngle?: number;
  maxLength?: number;
}

export interface GrammarRule {
  id: string;
  trigger: string; // goal or context tag
  sequence: string[]; // ordered primitive IDs
  constraints: PhysicalConstraint[];
}

export interface MotionGrammar {
  primitives: Record<string, MotionPrimitive>;
  rules: GrammarRule[];
  version: string;
}

// ============================================================
// Emotion system
// ============================================================

export type BuiltInEmotionState =
  | 'neutral' | 'nervous' | 'hesitant' | 'energetic'
  | 'awkward' | 'aggressive' | 'sad' | 'happy';

export interface MotionParameterOverride {
  behaviorId: string;
  parameterName: string;
  targetValue: number | string;
}

export interface EmotionState {
  name: string;
  isBuiltIn: boolean;
  parameterOverrides: MotionParameterOverride[];
  blendDurationMs: number;
}

// ============================================================
// Semantic tags
// ============================================================

export type BuiltInSemanticTag =
  | 'nervous' | 'hesitant' | 'energetic' | 'awkward'
  | 'aggressive' | 'tired' | 'confident' | 'distracted';

export interface ParameterDelta {
  behaviorId: string;
  parameterName: string;
  delta: number | string;
  preTagValue: number | string;
}

export interface SemanticTag {
  name: string;
  parameterDeltas: ParameterDelta[];
  priority: number;
  appliedAt: number; // tick timestamp
}

// ============================================================
// Idle system
// ============================================================

export interface IdleParams {
  breathRate: number;     // cycles per second
  breathAmplitude: number; // vertical displacement px
  blinkIntervalMin: number; // ms
  blinkIntervalMax: number; // ms
  fidgetProbability: number; // 0–1 per tick
  swayAmplitude: number; // px
  swayFrequency: number; // Hz
}

// ============================================================
// Secondary motion
// ============================================================

export interface SecondaryJoint {
  jointId: string;
  parentJointId: string;
  springConstant: number;
  dampingFactor: number;
  enabled: boolean;
}

// ============================================================
// Actor goals
// ============================================================

export type ActorGoalType = 'move_to' | 'interact_with' | 'look_at' | 'emote' | 'wait' | 'idle';

export interface ActorGoal {
  type: ActorGoalType;
  targetId?: string;       // actor or anchor reference
  targetPosition?: Vector2;
  reason: string;
  priority: number;
  interruptible: boolean;
}

// ============================================================
// Actor
// ============================================================

export interface Actor {
  id: string;
  label: string;
  entityType: EntityType;
  rig: Rig;
  emotionState: EmotionState;
  activeBehaviors: ActiveBehavior[];
  semanticTags: SemanticTag[];
  lodLevel: LODLevel;
  position: Vector2;
  facing: number; // radians
  idleParams: IdleParams;
  secondaryJoints: SecondaryJoint[];
  goal: ActorGoal | null;
  behaviorLayers: BehaviorLayerSet;

  // Legacy compatibility fields (used by renderer until full migration)
  emotionIntensity?: number;
  currentAction?: string;
  actionElapsed?: number;
  joints?: Record<string, Vector2>;
}

// ============================================================
// Environment
// ============================================================

export interface ProceduralEffect {
  type: 'rain' | 'particles' | 'flicker' | 'sway' | 'fog' | 'snow' | 'embers' | 'dust';
  params: Record<string, number | string>;
}

export interface Surface {
  id: string;
  type: 'floor' | 'wall' | 'ceiling';
  bounds: Rect2D;
  color: string;
}

export interface Prop {
  id: string;
  type: string;
  position: Vector2;
  rotation?: number;
  scale?: number;
  tags: string[];
  lightEmit?: boolean;
  lightColor?: number;
  lightIntensity?: number;
}

export interface Environment {
  id: string;
  type: string;
  bounds: Rect2D;
  backgroundColor: string;
  floorColor: string;
  wallColor: string;
  width: number;
  height: number;
  surfaces: Surface[];
  props: Prop[];
  proceduralEffects: ProceduralEffect[];
  atmosphereHints: string[];
}

// ============================================================
// Atmosphere
// ============================================================

export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  shadow: string;
}

export interface AtmosphereConfig {
  dominantPalette: ColorPalette;
  shadowIntensity: number;    // 0.0–1.0
  shadowDirection: Vector2;
  ambientLightLevel: number;  // 0.0–1.0
  environmentalEffects: ProceduralEffect[];
  idleModifierHints: Partial<IdleParams>;
  transitionDurationMs: number;
}

// ============================================================
// Camera system
// ============================================================

export type CinematicStyle =
  | 'close_up' | 'wide_shot' | 'over_the_shoulder' | 'lonely_framing'
  | 'dramatic_zoom' | 'slow_pan' | 'tracking_shot' | 'bird_eye'
  | 'static' | 'follow' | 'tension';

export interface CameraRule {
  name: 'follow_active' | 'frame_emotion' | 'zoom_tension' | 'pan_movement';
  priority: number;
  params: Record<string, number | string>;
}

export interface CameraState {
  cinematicStyle: CinematicStyle;
  position: Vector2;
  zoom: number;
  rotation: number;
  activeRules: CameraRule[];
  locked: boolean;
}

// ============================================================
// Timeline
// ============================================================

export interface TimelineEvent {
  id: string;
  timeMs: number;
  type: string;
  payload: Record<string, unknown>;
}

// ============================================================
// Session
// ============================================================

export interface SessionEntry {
  id: string;
  prompt: string;
  createdAt: number;
  explanation?: string;
}

// ============================================================
// Scene metadata
// ============================================================

export interface SceneMetadata {
  createdAt: number;
  lastMutatedAt: number;
  editCount: number;
  cinematicStyle: CinematicStyle;
  seed: number;
}

// ============================================================
// Scene Graph — the central data structure
// ============================================================

export interface SceneGraph {
  id: string;
  version: number;
  metadata: SceneMetadata;
  actors: Actor[];
  environment: Environment;
  atmosphere: AtmosphereConfig;
  camera: CameraState;
  timeline: TimelineEvent[];
  sessionHistory: SessionEntry[];

  // Simulation state
  simulation?: SimulationState;

  // Legacy compat fields (deprecated, will be removed)
  cinematicGrammar?: { tone: string; template: Record<string, unknown> };
  relationships?: CharacterRelationship[];
  rhythm?: SceneRhythm;
  continuity?: ContinuityState;
}

// ============================================================
// Simulation state
// ============================================================

export interface SimulationState {
  tick: number;
  timeMs: number;
  fixedDeltaMs: number;
  seed: number;
}

// ============================================================
// Runtime output
// ============================================================

export type JointTransformMap = Record<string, Transform2D>;

export interface ActorSimulationResult {
  actorId: string;
  jointTransforms: JointTransformMap;
  position: Vector2;
  facing: number;
  lodLevel: LODLevel;
}

export interface SimulationFrame {
  sceneId: string;
  tick: number;
  timeMs: number;
  actors: ActorSimulationResult[];
  camera: CameraState;
  atmosphere: AtmosphereConfig;
}

// ============================================================
// Event bus types
// ============================================================

export type SimulationEvent =
  | { type: 'actor_goal_changed'; actorId: string; goal: ActorGoal }
  | { type: 'emotion_state_changed'; actorId: string; state: EmotionState }
  | { type: 'motion_behavior_activated'; actorId: string; behaviorId: string }
  | { type: 'semantic_tag_applied'; actorId: string; tag: SemanticTag }
  | { type: 'semantic_tag_removed'; actorId: string; tagName: string }
  | { type: 'lod_level_changed'; actorId: string; level: LODLevel }
  | { type: 'refinement_pass_complete'; passName: string }
  | { type: 'performance_warning'; tickDurationMs: number; slowActorIds: string[] }
  | { type: 'mutation_applied'; mutationType: string }
  | { type: 'camera_style_changed'; style: CinematicStyle };

// ============================================================
// Director system
// ============================================================

export type DirectorDecisionType =
  | 'goal_assign' | 'emotion_change' | 'camera_rule'
  | 'interaction_trigger' | 'timing_adjust';

export interface DirectorDecision {
  type: DirectorDecisionType;
  actorId?: string;
  payload: Record<string, unknown>;
  priority: number;
}

export interface DirectorEvent {
  type: string;
  payload: Record<string, unknown>;
}

// ============================================================
// Intent interpreter
// ============================================================

export interface SceneGraphMutation {
  type: string;
  path: string;
  value: unknown;
  reason: string;
}

export interface InterpretationResult {
  mutations: SceneGraphMutation[];
  directorEvents: DirectorEvent[];
  cinematicStyle?: CinematicStyle;
  atmosphere?: AtmosphereConfig;
  explanation?: string;
}

// ============================================================
// Runtime metrics
// ============================================================

export interface TickSample {
  durationMs: number;
  timestamp: number;
}

export interface RuntimeMetrics {
  tickDurationMs: number;
  activeActorCount: number;
  cacheHitRate: number;
  cacheMissRate: number;
  cacheEntryCount: number;
  lodDistribution: Record<LODLevel, number>;
  rendererFPS: number;
  droppedFrameCount: number;
  tickHistory: TickSample[];
}

// ============================================================
// Result type for error handling
// ============================================================

export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

// ============================================================
// Spec format (internal YAML representation)
// ============================================================

export interface ParseError {
  location: { line: number; column: number };
  code: 'SYNTAX_ERROR' | 'UNDEFINED_REFERENCE' | 'OUT_OF_RANGE' | 'MISSING_REQUIRED';
  message: string;
  context?: string;
}

// ============================================================
// Motion cache
// ============================================================

export interface MotionCacheEntry {
  key: string;
  value: JointTransformMap;
  lastAccessedAt: number;
}

export interface MotionCacheConfig {
  maxEntries: number;
}

// ============================================================
// Legacy types (kept for backward compatibility during migration)
// ============================================================

export type ActorEmotion = BuiltInEmotionState | 'exhausted' | 'excited';
export type SceneTone = 'neutral' | 'sad' | 'tense' | 'lonely' | 'awkward' | 'energetic' | 'romantic' | 'threatening';

export interface CharacterRelationship {
  actorAId: string;
  actorBId: string;
  type: 'stranger' | 'approaching' | 'confronting' | 'avoiding' | 'conversing';
  awarenessRadius: number;
  gazeTarget: string | null;
  emotionalReaction: ActorEmotion | null;
  preferredDistance?: number;
  tension?: number;
}

export interface ContinuityViolation {
  id: string;
  severity: 'warning' | 'error';
  field: string;
  message: string;
  repairApplied: boolean;
}

export interface EmotionalAftermath {
  emotion: ActorEmotion;
  peakIntensity: number;
  residualIntensity: number;
  startedAtMs: number;
  lastUpdatedAtMs: number;
  recoveryHalfLifeMs: number;
}

export interface ContinuityState {
  lastValidatedVersion: number;
  actorSnapshots: Record<string, { position: Vector2; emotionState: ActorEmotion; emotionIntensity: number; actionType: string }>;
  cameraSnapshot: { x: number; y: number; zoom: number; mode: string } | null;
  violations: ContinuityViolation[];
  emotionalAftermath?: Record<string, EmotionalAftermath>;
}

export interface SceneRhythm {
  tempo: 'slow' | 'medium' | 'fast';
  pauseFrequencyPerMinute: number;
  motionEnergyCurve: 'linear' | 'ease-in' | 'ease-out' | 'sharp';
}