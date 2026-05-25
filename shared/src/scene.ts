import { CinematicShot, NarrativeState } from './cinematicShots';

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

export interface EmotionalAftermath {
  emotion: ActorEmotion;
  peakIntensity: number;
  residualIntensity: number;
  startedAtMs: number;
  lastUpdatedAtMs: number;
  recoveryHalfLifeMs: number;
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
  emotionalMomentum?: number;
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

export type AtmosphereEffect = 'rain' | 'fog' | 'flicker' | 'dust' | 'snow' | 'embers' | 'none';

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
  actorSnapshots: Record<string, { position: Vector2; emotionState: ActorEmotion; emotionIntensity: number; actionType: ActionType | ActorAction }>;
  cameraSnapshot: { x: number; y: number; zoom: number; mode: CameraMode } | null;
  violations: ContinuityViolation[];
  emotionalAftermath?: Record<string, EmotionalAftermath>;
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

// --- Phase 4: Expressive Face System ---

export type EyeShape = 'round' | 'wide' | 'narrow' | 'droopy' | 'half_closed' | 'squint';
export type MouthShape = 'neutral' | 'smile' | 'frown' | 'tight' | 'grimace' | 'open' | 'crooked';

export interface FaceExpression {
  eyeShape: EyeShape;
  browAngle: number;       // -1 (sad/worried) to 1 (angry/determined), 0 = neutral
  mouthCurve: MouthShape;
  pupilOffsetX: number;    // -1 to 1 (gaze direction)
  pupilOffsetY: number;    // -1 to 1 (look up/down)
  blinkState: number;      // 0 = open, 1 = closed
  squint: number;          // 0 to 1
  browAsymmetry: number;   // 0 = symmetric, 1 = full asymmetry (one brow up)
}

// --- Phase 2.6: Emotional Spatial Intelligence ---

export type SpatialIntent = 'intimacy' | 'isolation' | 'confrontation' | 'vulnerability' | 'avoidance' | 'dominance' | 'neutral';

export interface EmotionalSpatialState {
  spatialIntent: SpatialIntent;
  negativeSpaceRatio: number;
  frameEdgeBias: { x: number; y: number };
  compositionTension: number;
}

// --- Phase 2.6: Dramatic Timing ---

export type BeatType = 'anticipation' | 'silence' | 'reaction' | 'tension_hold' | 'release' | 'interruption';

export interface DramaticBeat {
  type: BeatType;
  durationMs: number;
  elapsedMs: number;
  intensity: number;
}

// --- Phase 2.6: Shot Intent ---

export type ShotIntentType = 'establish' | 'reveal' | 'emphasize' | 'isolate' | 'confront' | 'observe' | 'compress';

export interface ShotIntent {
  intent: ShotIntentType;
  subject?: string;
  intensity?: number;
  targetSubjectId?: string;
  transitionSpeed?: number;
}

// --- Phase 2.6: Attention Focus ---

export interface AttentionFocus {
  primaryTarget: string;
  secondaryTargets: string[];
  focusIntensity: number;
  motionContrast: number;
}

// --- Phase 2.6: Deep Acting ---

export interface DeepActingState {
  postureOpenness: number;
  gazeAversion: number;
  emotionalRecoveryTimer: number;
  nervousRepetitionCount: number;
  breathingRate: 'slow' | 'normal' | 'fast';
}

// --- Phase 2.6: Composition Metrics ---

export interface CompositionMetrics {
  ruleOfThirdsScore: number;
  negativeSpaceBalance: number;
  visualWeight: { left: number; right: number };
  silhouetteClarity: number;
  depthSeparation: number;
}

// --- Phase 2.6: Power Dynamics ---

export type PowerDynamicType = 'dominance' | 'submission' | 'avoidance' | 'pursuit' | 'withdrawal' | 'balanced';

export interface PowerDynamic {
  actorAId: string;
  actorBId: string;
  dominantActorId: string | null;
  submissiveActorId: string | null;
  powerBalance: number;
  dynamicType: PowerDynamicType;
}

// --- Phase 2.6: Tension State ---

export interface TensionState {
  currentLevel: number;
  peakLevel: number;
  escalationRate: number;
  compressionFactor: number;
  cameraIntensityBoost: number;
}

// --- Phase 2.6: Anticipation State ---

export type AnticipationPhase = 'idle' | 'building' | 'peak' | 'release';

export interface AnticipationState {
  phase: AnticipationPhase;
  buildDurationMs: number;
  elapsedMs: number;
  motionDamping: number;
  cameraTightening: number;
}

// --- Phase 2.7: Emotional Beat Runtime ---

export type EmotionalBeatAction = 'neutral' | 'pause' | 'freeze' | 'collapse' | 'recoil' | 'approach' | 'step_back' | 'look_away' | 'glance' | 'fidget' | 'stillness' | 'attempt_contact' | 'avoidance' | 'retry';

export interface EmotionalBeat {
  action: EmotionalBeatAction;
  durationMs: number;
  elapsedMs: number;
  emotionTarget: ActorEmotion | null;
  intensityTarget: number;
  cameraResponse: 'none' | 'push_in' | 'hold' | 'pull_back' | 'compress' | 'drift' | 'reframe';
  spacingDelta: number;
  motionDamping: number;
}

export interface BeatSequence {
  id: string;
  label: string;
  beats: EmotionalBeat[];
  currentIndex: number;
  startedAtMs: number;
  totalElapsedMs: number;
  completed: boolean;
  looping: boolean;
}

// --- Phase 2.7: Emotional Arcs ---

export type ArcPhaseName = 'setup' | 'rising' | 'peak' | 'falling' | 'resolution';

export interface ArcPhase {
  name: ArcPhaseName;
  targetEmotion: ActorEmotion;
  targetIntensity: number;
  durationMs: number;
  elapsedMs: number;
  atmosphereShift: { lightingTint?: string; ambientDelta?: number } | null;
}

export interface EmotionalArc {
  id: string;
  label: string;
  phases: ArcPhase[];
  currentPhaseIndex: number;
  totalElapsedMs: number;
  completed: boolean;
}

// --- Phase 2.7: Pose Language ---

export interface PoseProfile {
  torsoAngle: number;
  headTilt: number;
  armSpread: number;
  stanceWidth: number;
  centerOfGravityY: number;
  shoulderSquare: number;
}

// --- Phase 2.7: Reaction Chains ---

export type ReactionTrigger = 'approach_detected' | 'bad_news' | 'awkward_pause' | 'confrontation' | 'comfort' | 'avoidance_detected';

export interface ReactionStep {
  action: EmotionalBeatAction;
  durationMs: number;
  delayMs: number;
}

export interface ReactionChain {
  trigger: ReactionTrigger;
  steps: ReactionStep[];
  currentStepIndex: number;
  elapsedMs: number;
  completed: boolean;
}

// --- Phase 2.7: Environment Story Anchors ---

export type StoryAnchorType = 'rooftop_ledge' | 'window_silhouette' | 'bench' | 'doorway' | 'hallway' | 'corner_wall' | 'streetlight_silhouette' | 'rain_window' | 'skyline';

export interface StoryAnchor {
  id: string;
  type: StoryAnchorType;
  position: Vector2;
  width: number;
  height: number;
}

// --- Phase 2.7: Scene Evolution ---

export interface SceneEvolution {
  spacingTrajectory: number[];
  postureTrajectory: number[];
  pacingTrajectory: number[];
  cameraZoomTrajectory: number[];
  intensityTrajectory: number[];
  sampleCount: number;
  lifetimeMs: number;
}

// --- Phase 2.7: Cinematic Moment Score ---

export interface CinematicMomentScore {
  emotionalClarity: number;
  poseReadability: number;
  dramaticProgression: number;
  beatCoherence: number;
  overallScore: number;
}

// --- Phase 6: Procedural Semantic World Generation ---

export type LocationType = 'subway' | 'alley' | 'rooftop' | 'forest' | 'beach' | 'apartment' | 'hallway' | 'hospital' | 'parking_garage' | 'diner' | 'office' | 'warehouse' | 'indoor_room' | 'outdoor_street' | 'outdoor_park' | 'outdoor_beach' | 'outdoor_forest' | 'staircase';
export type TimeOfDay = 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night' | 'late_night';
export type WeatherType = 'clear' | 'rain' | 'snow' | 'fog' | 'overcast' | 'storm';
export type LayoutStyle = 'open_space' | 'long_corridor' | 'enclosed_room' | 'split_level' | 'circular' | 'asymmetric';
export type VisualDensity = 'sparse' | 'moderate' | 'dense' | 'cluttered';
export type LightingLanguage = 'warm_practical' | 'cold_fluorescent' | 'neon_glow' | 'natural_soft' | 'harsh_overhead' | 'dramatic_spot' | 'moonlit' | 'candlelit';
export type CompositionStyle = 'negative_space' | 'centered_isolation' | 'asymmetric_tension' | 'foreground_obstruction' | 'depth_layering' | 'silhouette_framing';
export type CameraLanguage = 'slow_isolation' | 'tight_tension' | 'wide_establishing' | 'handheld_anxiety' | 'steady_observe' | 'drift_melancholy';
export type VisualStyleName = 'noir' | 'soft_dream' | 'cold_realism' | 'neon_isolation' | 'warm_memory' | 'monochrome_tension' | 'default';

export interface SemanticWorldPlan {
  locationType: LocationType;
  timeOfDay: TimeOfDay;
  tone: SceneTone;
  weather: WeatherType;
  layoutStyle: LayoutStyle;
  visualDensity: VisualDensity;
  lightingLanguage: LightingLanguage;
  compositionStyle: CompositionStyle;
  cameraLanguage: CameraLanguage;
  keyProps: string[];
  visualStyle?: VisualStyleName;
  emotionalEnergy: number;
}

export interface CompositionZone {
  id: string;
  type: 'foreground' | 'midground' | 'background' | 'negative_space' | 'framing';
  bounds: { xMin: number; xMax: number; zMin: number; zMax: number };
  visualWeight: number;
  depth: number;
}

export interface ProceduralProp {
  id: string;
  type: string;
  position: { x: number; y: number; z: number };
  rotation?: number;
  scale?: number;
  tags: string[];
  lightEmit?: boolean;
  lightColor?: number;
  lightIntensity?: number;
}

export interface WorldLayout {
  zones: CompositionZone[];
  props: ProceduralProp[];
  depthLayers: number;
  groundVariation: string;
  skylineType: string;
  fogLayers: number;
}

export interface VisualStyleProfile {
  name: VisualStyleName;
  fogDensity: number;
  fogColor: number;
  bloomIntensity: number;
  bloomThreshold: number;
  vignetteStrength: number;
  contrastBoost: number;
  saturation: number;
  colorTint: number;
  grainIntensity: number;
  silhouetteEnhance: number;
}

export interface EnvironmentCinematicInfluence {
  cameraDistanceMultiplier: number;
  spacingCompression: number;
  tensionBias: number;
  pacingMultiplier: number;
  verticalFramingBias: number;
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
  explanation?: string;
  // Phase 2.6
  emotionalSpatial?: EmotionalSpatialState;
  dramaticBeats?: DramaticBeat[];
  shotIntent?: ShotIntent;
  attentionFocus?: AttentionFocus;
  compositionMetrics?: CompositionMetrics;
  powerDynamics?: PowerDynamic[];
  tensionState?: TensionState;
  anticipationState?: AnticipationState;
  // Phase 2.7
  beatSequence?: BeatSequence;
  emotionalArc?: EmotionalArc;
  reactionChains?: ReactionChain[];
  storyAnchors?: StoryAnchor[];
  sceneEvolution?: SceneEvolution;
  cinematicMomentScore?: CinematicMomentScore;
  // Phase 3
  environmentReaction?: {
    suggestedEffects: string[];
    lightingShift: string | null;
    ambientIntensityDelta: number;
    emptinessLevel: number;
  };
  // Phase 6
  worldPlan?: SemanticWorldPlan;
  worldLayout?: WorldLayout;
  visualStyle?: VisualStyleProfile;
  environmentInfluence?: EnvironmentCinematicInfluence;
  // Phase 9
  shotSequence?: CinematicShot[];
  narrativeState?: NarrativeState;
  activeShotId?: string;
  shotElapsedMs?: number;
  timelineTimeMs?: number;
  isTimelinePlaying?: boolean;
}
