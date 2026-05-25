/**
 * specSchema.ts
 *
 * Canonical YAML grammar schema for SceneGraph.
 *
 * This file is the single source of truth for:
 *   - All valid enum values for every union/literal type that appears in the spec
 *   - Required vs. optional field classifications for every sub-object
 *   - Numeric ranges (min / max) for constrained numeric fields
 *   - Expected primitive types for every leaf field
 *
 * Both the parser (specParser.ts) and any future validator should import
 * from here instead of hard-coding their own arrays.
 *
 * IMPORTANT: Keep this file in sync with scene.ts whenever new types are added.
 */

import type {
  ActorEmotion,
  ActorAction,
  CameraMode,
  SceneTone,
  AtmosphereEffect,
  RelationshipType,
} from './scene.js';

// ---------------------------------------------------------------------------
// ParseError — canonical structured error type
// ---------------------------------------------------------------------------

/**
 * Discriminant code that identifies the category of a parse/validation error.
 *
 * | Code                | Meaning                                                        |
 * |---------------------|----------------------------------------------------------------|
 * | SYNTAX_ERROR        | The raw YAML text is malformed and cannot be parsed            |
 * | MISSING_REQUIRED    | A field marked `required: true` in the schema is absent        |
 * | OUT_OF_RANGE        | A value is outside its allowed set (enum) or numeric range     |
 * | UNDEFINED_REFERENCE | A string ID refers to an entity that does not exist in the doc |
 */
export type ParseErrorCode =
  | 'SYNTAX_ERROR'
  | 'MISSING_REQUIRED'
  | 'OUT_OF_RANGE'
  | 'UNDEFINED_REFERENCE';

/** Source position within the YAML document. Both values are 1-based. */
export interface ParseErrorLocation {
  /** 1-based line number; 0 when position could not be determined */
  line: number;
  /** 1-based column number; 0 when position could not be determined */
  column: number;
}

/**
 * A structured error produced by the parser or any schema validator.
 *
 * @example
 * ```ts
 * {
 *   code: 'MISSING_REQUIRED',
 *   location: { line: 12, column: 3 },
 *   message: "Property 'emotionState' is required",
 *   context: 'actors[0].emotionState',
 * }
 * ```
 */
export interface ParseError {
  /** Categorical error code for programmatic handling */
  code: ParseErrorCode;
  /** Source location within the YAML document */
  location: ParseErrorLocation;
  /** Human-readable description of the error */
  message: string;
  /**
   * Dot-path / bracket-path to the offending field, e.g. `actors[0].emotionState`.
   * Present for all schema errors; absent for top-level SYNTAX_ERRORs.
   */
  context?: string;
}

// ---------------------------------------------------------------------------
// Enum value arrays
// Each array mirrors the corresponding union type in scene.ts exactly.
// ---------------------------------------------------------------------------

/** Valid values for `ActorEmotion` */
export const ACTOR_EMOTIONS: readonly ActorEmotion[] = [
  'neutral',
  'sad',
  'happy',
  'nervous',
  'excited',
  'awkward',
  'angry',
  'exhausted',
] as const;

/** Valid values for `ActorAction` (the simple surface action, not `ActionType`) */
export const ACTOR_ACTIONS: readonly ActorAction[] = [
  'idle',
  'walking',
  'sitting',
  'approaching',
  'pacing',
] as const;

/** Valid values for `CameraMode` */
export const CAMERA_MODES: readonly CameraMode[] = [
  'static',
  'follow',
  'close_up',
  'wide_shot',
  'over_the_shoulder',
  'dramatic_zoom',
  'tension',
] as const;

/** Valid values for `SceneTone` */
export const SCENE_TONES: readonly SceneTone[] = [
  'neutral',
  'sad',
  'tense',
  'lonely',
  'awkward',
  'energetic',
  'romantic',
  'threatening',
] as const;

/** Valid values for `AtmosphereEffect` */
export const ATMOSPHERE_EFFECTS: readonly AtmosphereEffect[] = [
  'rain',
  'fog',
  'flicker',
  'dust',
  'snow',
  'embers',
  'none',
] as const;

/** Valid values for `RelationshipType` */
export const RELATIONSHIP_TYPES: readonly RelationshipType[] = [
  'stranger',
  'approaching',
  'confronting',
  'avoiding',
  'conversing',
] as const;

/** Valid values for `SceneRhythm.tempo` */
export const RHYTHM_TEMPOS = ['slow', 'medium', 'fast'] as const;
export type RhythmTempo = (typeof RHYTHM_TEMPOS)[number];

/** Valid values for `SceneRhythm.motionEnergyCurve` */
export const MOTION_ENERGY_CURVES = [
  'linear',
  'ease-in',
  'ease-out',
  'sharp',
] as const;
export type MotionEnergyCurve = (typeof MOTION_ENERGY_CURVES)[number];

/** Valid values for `CameraPlan.framingIntent` */
export const FRAMING_INTENTS = [
  'isolate',
  'follow',
  'observe',
  'compress',
  'reveal',
  'confront',
] as const;
export type FramingIntent = (typeof FRAMING_INTENTS)[number];

/** Valid values for `CameraPlan.transition` */
export const CAMERA_TRANSITIONS = [
  'cut',
  'ease',
  'slow_drift',
  'push_in',
  'pull_back',
] as const;
export type CameraTransition = (typeof CAMERA_TRANSITIONS)[number];

// ---------------------------------------------------------------------------
// Field-type descriptors
//
// Each FieldSpec describes how a single field should be validated.
// Validators iterate over these instead of hard-coding logic.
// ---------------------------------------------------------------------------

/** Primitive leaf types */
export type PrimitiveKind = 'string' | 'number' | 'boolean';

/** A field that holds a scalar primitive */
export interface ScalarFieldSpec {
  kind: 'scalar';
  type: PrimitiveKind;
  required: boolean;
  /** Inclusive lower bound (numbers only) */
  min?: number;
  /** Inclusive upper bound (numbers only) */
  max?: number;
}

/** A field that must be one of a fixed set of string literals */
export interface EnumFieldSpec {
  kind: 'enum';
  values: readonly string[];
  required: boolean;
  /** If true, the value may also be `null` */
  nullable?: boolean;
}

/** A field that is either `null` or an object satisfying a nested schema */
export interface NullableObjectFieldSpec {
  kind: 'nullable_object';
  required: boolean;
  schema: FieldSchemaMap;
}

/** A field that is an array of scalar/enum values */
export interface ArrayOfScalarFieldSpec {
  kind: 'array_of_scalar';
  itemType: PrimitiveKind;
  required: boolean;
}

/** A field that is an array of enum values */
export interface ArrayOfEnumFieldSpec {
  kind: 'array_of_enum';
  values: readonly string[];
  required: boolean;
}

/** A field that is an array of objects */
export interface ArrayOfObjectFieldSpec {
  kind: 'array_of_object';
  schema: FieldSchemaMap;
  required: boolean;
}

/** A field that is an inline object with its own schema */
export interface ObjectFieldSpec {
  kind: 'object';
  schema: FieldSchemaMap;
  required: boolean;
}

/** Union of all field descriptor types */
export type FieldSpec =
  | ScalarFieldSpec
  | EnumFieldSpec
  | NullableObjectFieldSpec
  | ArrayOfScalarFieldSpec
  | ArrayOfEnumFieldSpec
  | ArrayOfObjectFieldSpec
  | ObjectFieldSpec;

/** Maps field names to their specs */
export type FieldSchemaMap = Record<string, FieldSpec>;

// ---------------------------------------------------------------------------
// Helper constructors (DRY shorthands)
// ---------------------------------------------------------------------------

const req = <T extends FieldSpec>(spec: Omit<T, 'required'>): T =>
  ({ ...spec, required: true }) as T;

const opt = <T extends FieldSpec>(spec: Omit<T, 'required'>): T =>
  ({ ...spec, required: false }) as T;

// ---------------------------------------------------------------------------
// Sub-object schemas
// ---------------------------------------------------------------------------

/** Vector2 — { x: number; y: number } */
export const VECTOR2_SCHEMA: FieldSchemaMap = {
  x: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
  y: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
};

/** StickmanJoints */
export const JOINTS_SCHEMA: FieldSchemaMap = {
  head: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
  torso: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
  leftArm: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
  rightArm: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
  leftLeg: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
  rightLeg: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
};

/** Actor */
export const ACTOR_SCHEMA: FieldSchemaMap = {
  id: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  label: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  type: req<EnumFieldSpec>({ kind: 'enum', values: ['humanoid'] }),
  position: req<ObjectFieldSpec>({ kind: 'object', schema: VECTOR2_SCHEMA }),
  targetPosition: req<NullableObjectFieldSpec>({
    kind: 'nullable_object',
    schema: VECTOR2_SCHEMA,
  }),
  emotionState: req<EnumFieldSpec>({ kind: 'enum', values: ACTOR_EMOTIONS }),
  emotionIntensity: opt<ScalarFieldSpec>({
    kind: 'scalar',
    type: 'number',
    min: 0,
    max: 1,
  }),
  currentAction: req<EnumFieldSpec>({ kind: 'enum', values: ACTOR_ACTIONS }),
  actionQueue: req<ArrayOfEnumFieldSpec>({
    kind: 'array_of_enum',
    values: ACTOR_ACTIONS,
  }),
  joints: req<ObjectFieldSpec>({ kind: 'object', schema: JOINTS_SCHEMA }),
  actionElapsed: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 0 }),
};

/** Environment */
export const ENVIRONMENT_SCHEMA: FieldSchemaMap = {
  type: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  backgroundColor: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  floorColor: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  wallColor: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  width: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 1 }),
  height: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 1 }),
};

/** Camera */
export const CAMERA_SCHEMA: FieldSchemaMap = {
  x: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
  y: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
  zoom: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 0 }),
  mode: req<EnumFieldSpec>({ kind: 'enum', values: CAMERA_MODES }),
};

/** SessionEntry */
export const SESSION_ENTRY_SCHEMA: FieldSchemaMap = {
  id: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  prompt: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  createdAt: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 0 }),
};

/** CinematicTemplate */
export const CINEMATIC_TEMPLATE_SCHEMA: FieldSchemaMap = {
  cameraMode: req<EnumFieldSpec>({ kind: 'enum', values: CAMERA_MODES }),
  spacingMultiplier: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
  motionEnergyScale: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
  pauseFrequency: req<ScalarFieldSpec>({
    kind: 'scalar',
    type: 'number',
    min: 0,
  }),
  contrastBoost: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
  headroom: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),
};

/** CinematicGrammar */
export const CINEMATIC_GRAMMAR_SCHEMA: FieldSchemaMap = {
  tone: req<EnumFieldSpec>({ kind: 'enum', values: SCENE_TONES }),
  template: req<ObjectFieldSpec>({
    kind: 'object',
    schema: CINEMATIC_TEMPLATE_SCHEMA,
  }),
};

/** AtmosphereProfile */
export const ATMOSPHERE_SCHEMA: FieldSchemaMap = {
  effects: req<ArrayOfEnumFieldSpec>({
    kind: 'array_of_enum',
    values: ATMOSPHERE_EFFECTS,
  }),
  lightingTint: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  ambientIntensity: req<ScalarFieldSpec>({
    kind: 'scalar',
    type: 'number',
    min: 0,
    max: 1,
  }),
};

/** CharacterRelationship */
export const RELATIONSHIP_SCHEMA: FieldSchemaMap = {
  actorAId: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  actorBId: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  type: req<EnumFieldSpec>({ kind: 'enum', values: RELATIONSHIP_TYPES }),
  awarenessRadius: req<ScalarFieldSpec>({
    kind: 'scalar',
    type: 'number',
    min: 0,
  }),
  gazeTarget: req<EnumFieldSpec>({
    kind: 'enum',
    // gazeTarget is a free-form string or null; enum with [] signals "any string" handled specially
    values: [],
    nullable: true,
  }),
  emotionalReaction: req<EnumFieldSpec>({
    kind: 'enum',
    values: ACTOR_EMOTIONS,
    nullable: true,
  }),
  preferredDistance: opt<ScalarFieldSpec>({
    kind: 'scalar',
    type: 'number',
    min: 0,
  }),
  tension: opt<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 0, max: 1 }),
};

/** SceneRhythm */
export const RHYTHM_SCHEMA: FieldSchemaMap = {
  tempo: req<EnumFieldSpec>({ kind: 'enum', values: RHYTHM_TEMPOS }),
  pauseFrequencyPerMinute: req<ScalarFieldSpec>({
    kind: 'scalar',
    type: 'number',
    min: 0,
  }),
  motionEnergyCurve: req<EnumFieldSpec>({
    kind: 'enum',
    values: MOTION_ENERGY_CURVES,
  }),
};

// ---------------------------------------------------------------------------
// Root SceneGraph schema
// ---------------------------------------------------------------------------

/**
 * The top-level schema for a SceneGraph YAML document.
 *
 * Required fields are those that must be present for the graph to be valid.
 * Optional fields may be absent without error.
 */
export const SCENE_GRAPH_SCHEMA: FieldSchemaMap = {
  // ── Required scalars ──────────────────────────────────────────────────
  id: req<ScalarFieldSpec>({ kind: 'scalar', type: 'string' }),
  version: req<ScalarFieldSpec>({ kind: 'scalar', type: 'number', min: 0 }),

  // ── Optional scalar ───────────────────────────────────────────────────
  seed: opt<ScalarFieldSpec>({ kind: 'scalar', type: 'number' }),

  // ── Required arrays ───────────────────────────────────────────────────
  actors: req<ArrayOfObjectFieldSpec>({
    kind: 'array_of_object',
    schema: ACTOR_SCHEMA,
  }),
  sessionHistory: req<ArrayOfObjectFieldSpec>({
    kind: 'array_of_object',
    schema: SESSION_ENTRY_SCHEMA,
  }),
  relationships: req<ArrayOfObjectFieldSpec>({
    kind: 'array_of_object',
    schema: RELATIONSHIP_SCHEMA,
  }),

  // ── Required objects ──────────────────────────────────────────────────
  environment: req<ObjectFieldSpec>({
    kind: 'object',
    schema: ENVIRONMENT_SCHEMA,
  }),
  camera: req<ObjectFieldSpec>({ kind: 'object', schema: CAMERA_SCHEMA }),
  cinematicGrammar: req<ObjectFieldSpec>({
    kind: 'object',
    schema: CINEMATIC_GRAMMAR_SCHEMA,
  }),
  atmosphere: req<ObjectFieldSpec>({
    kind: 'object',
    schema: ATMOSPHERE_SCHEMA,
  }),
  rhythm: req<ObjectFieldSpec>({ kind: 'object', schema: RHYTHM_SCHEMA }),
};
