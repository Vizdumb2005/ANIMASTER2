/**
 * server/src/testing/arbitrarySceneGraph.ts
 *
 * Composite fast-check arbitrary that produces SceneGraph values whose every
 * field survives a SpecPrinter → SpecParser round-trip without data loss.
 *
 * Round-trip safety constraints:
 *  - Numbers: fc.integer() or integers/10000 — avoids NaN/±Infinity/-0.
 *  - Strings: fc.stringMatching with safe patterns — no YAML-special chars.
 *  - IDs: ^[a-z][a-z0-9_]{3,11}$ — always a safe YAML plain scalar.
 *
 * Lives in server/src so it shares server's NodeNext module resolution,
 * which prevents the CJS-vs-ESM dual-module mismatch for fast-check types.
 */

import * as fc from 'fast-check';
import type {
  SceneGraph,
  Actor,
  StickmanJoints,
  Vector2,
  Environment,
  Camera,
  SessionEntry,
  CinematicGrammar,
  CinematicTemplate,
  AtmosphereProfile,
  CharacterRelationship,
  SceneRhythm,
  ActorEmotion,
  ActorAction,
  CameraMode,
  SceneTone,
  AtmosphereEffect,
  RelationshipType,
} from '../../../shared/src/scene.js';

// ---------------------------------------------------------------------------
// Primitive arbitraries
// ---------------------------------------------------------------------------

const safeInt = (min = -1_000_000, max = 1_000_000): fc.Arbitrary<number> =>
  fc.integer({ min, max });

const posInt = (min = 0, max = 1_000_000): fc.Arbitrary<number> =>
  fc.integer({ min, max });

/**
 * Finite float with ≤4 dp, synthesised from integer arithmetic.
 * Avoids all IEEE 754 edge-cases that YAML cannot losslessly represent.
 */
const safeFloat = (min = -1000, max = 1000): fc.Arbitrary<number> =>
  fc
    .integer({ min: Math.round(min * 10000), max: Math.round(max * 10000) })
    .map((n: number) => n / 10000);

const unitFloat = (): fc.Arbitrary<number> => safeFloat(0, 1);

/** ID: starts with letter, lowercase alnum + underscore, 4-12 chars. */
const safeId = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[a-z][a-z0-9_]{3,11}$/);

/** Label: lowercase letters only, 4-20 chars — no YAML-special chars. */
const safeLabel = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[a-z]{4,20}$/);

/** CSS hex colour — always safe in YAML. */
const hexColor = (): fc.Arbitrary<string> =>
  fc
    .tuple(
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
      fc.integer({ min: 0, max: 255 }),
    )
    .map(
      ([r, g, b]: [number, number, number]) =>
        `#${r.toString(16).padStart(2, '0')}` +
        `${g.toString(16).padStart(2, '0')}` +
        `${b.toString(16).padStart(2, '0')}`,
    );

// ---------------------------------------------------------------------------
// Enum arbitraries
// ---------------------------------------------------------------------------

const ACTOR_EMOTIONS_ARR: ActorEmotion[] = [
  'neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted',
];
const ACTOR_ACTIONS_ARR: ActorAction[] = [
  'idle', 'walking', 'sitting', 'approaching', 'pacing',
];
const CAMERA_MODES_ARR: CameraMode[] = [
  'static', 'follow', 'close_up', 'wide_shot', 'over_the_shoulder', 'dramatic_zoom', 'tension',
];
const SCENE_TONES_ARR: SceneTone[] = [
  'neutral', 'sad', 'tense', 'lonely', 'awkward', 'energetic', 'romantic', 'threatening',
];
const ATMOSPHERE_EFFECTS_ARR: AtmosphereEffect[] = [
  'rain', 'fog', 'flicker', 'dust', 'snow', 'embers', 'none',
];
const RELATIONSHIP_TYPES_ARR: RelationshipType[] = [
  'stranger', 'approaching', 'confronting', 'avoiding', 'conversing',
];

function enumOf<T>(values: readonly T[]): fc.Arbitrary<T> {
  return fc.constantFrom(...values);
}

// ---------------------------------------------------------------------------
// Sub-object arbitraries
// ---------------------------------------------------------------------------

function arbitraryVector2(): fc.Arbitrary<Vector2> {
  return fc.record({ x: safeInt(), y: safeInt() });
}

function arbitraryJoints(): fc.Arbitrary<StickmanJoints> {
  return fc.record({
    head:     arbitraryVector2(),
    torso:    arbitraryVector2(),
    leftArm:  arbitraryVector2(),
    rightArm: arbitraryVector2(),
    leftLeg:  arbitraryVector2(),
    rightLeg: arbitraryVector2(),
  });
}

function arbitraryActor(): fc.Arbitrary<Actor> {
  return fc.record({
    id:             safeId(),
    label:          safeLabel(),
    type:           fc.constant('humanoid' as const),
    position:       arbitraryVector2(),
    targetPosition: fc.oneof(
      { arbitrary: fc.constant(null),      weight: 1 },
      { arbitrary: arbitraryVector2(),     weight: 1 },
    ),
    emotionState:   enumOf(ACTOR_EMOTIONS_ARR),
    currentAction:  enumOf(ACTOR_ACTIONS_ARR),
    actionQueue:    fc.array(enumOf(ACTOR_ACTIONS_ARR), { minLength: 0, maxLength: 3 }),
    joints:         arbitraryJoints(),
    actionElapsed:  posInt(0, 100_000),
  }) as fc.Arbitrary<Actor>;
}

function arbitraryEnvironment(): fc.Arbitrary<Environment> {
  return fc.record({
    type:            safeLabel(),
    backgroundColor: hexColor(),
    floorColor:      hexColor(),
    wallColor:       hexColor(),
    width:           posInt(100, 2000),
    height:          posInt(100, 2000),
  }) as fc.Arbitrary<Environment>;
}

function arbitraryCamera(): fc.Arbitrary<Camera> {
  return fc.record({
    x:    safeInt(),
    y:    safeInt(),
    zoom: safeFloat(0.1, 5),
    mode: enumOf(CAMERA_MODES_ARR),
  }) as fc.Arbitrary<Camera>;
}

function arbitrarySessionEntry(): fc.Arbitrary<SessionEntry> {
  return fc.record({
    id:        safeId(),
    prompt:    safeLabel(),
    createdAt: posInt(0, 2_000_000_000),
  }) as fc.Arbitrary<SessionEntry>;
}

function arbitraryCinematicTemplate(): fc.Arbitrary<CinematicTemplate> {
  return fc.record({
    cameraMode:        enumOf(CAMERA_MODES_ARR),
    spacingMultiplier: safeFloat(0, 3),
    motionEnergyScale: safeFloat(0, 3),
    pauseFrequency:    unitFloat(),
    contrastBoost:     safeFloat(0, 3),
    headroom:          unitFloat(),
  }) as fc.Arbitrary<CinematicTemplate>;
}

function arbitraryCinematicGrammar(): fc.Arbitrary<CinematicGrammar> {
  return fc.record({
    tone:     enumOf(SCENE_TONES_ARR),
    template: arbitraryCinematicTemplate(),
  });
}

function arbitraryAtmosphere(): fc.Arbitrary<AtmosphereProfile> {
  return fc.record({
    effects:          fc.array(enumOf(ATMOSPHERE_EFFECTS_ARR), { minLength: 0, maxLength: 3 }),
    lightingTint:     hexColor(),
    ambientIntensity: unitFloat(),
  });
}

function arbitraryRelationship(): fc.Arbitrary<CharacterRelationship> {
  return fc.record({
    actorAId:          safeId(),
    actorBId:          safeId(),
    type:              enumOf(RELATIONSHIP_TYPES_ARR),
    awarenessRadius:   posInt(0, 500),
    gazeTarget:        fc.oneof(
      { arbitrary: fc.constant(null), weight: 1 },
      { arbitrary: safeId(),          weight: 1 },
    ),
    emotionalReaction: fc.oneof(
      { arbitrary: fc.constant(null),              weight: 1 },
      { arbitrary: enumOf(ACTOR_EMOTIONS_ARR),     weight: 1 },
    ),
  }) as fc.Arbitrary<CharacterRelationship>;
}

function arbitraryRhythm(): fc.Arbitrary<SceneRhythm> {
  return fc.record({
    tempo:                   enumOf(['slow', 'medium', 'fast'] as const),
    pauseFrequencyPerMinute: posInt(0, 30),
    motionEnergyCurve:       enumOf(['linear', 'ease-in', 'ease-out', 'sharp'] as const),
  });
}

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

export function arbitrarySceneGraph(): fc.Arbitrary<SceneGraph> {
  return fc.record({
    id:               safeId(),
    version:          posInt(1, 999),
    actors:           fc.array(arbitraryActor(),        { minLength: 0, maxLength: 3 }),
    environment:      arbitraryEnvironment(),
    camera:           arbitraryCamera(),
    sessionHistory:   fc.array(arbitrarySessionEntry(), { minLength: 0, maxLength: 5 }),
    cinematicGrammar: arbitraryCinematicGrammar(),
    atmosphere:       arbitraryAtmosphere(),
    rhythm:           arbitraryRhythm(),
  }).chain(base => {
    const actorIds = base.actors.map(a => a.id);
    if (actorIds.length === 0) {
      return fc.constant({ ...base, relationships: [] });
    }
    const relArbitrary = fc.array(
      fc.record({
        actorAId:          fc.constantFrom(...actorIds),
        actorBId:          fc.constantFrom(...actorIds),
        type:              enumOf(RELATIONSHIP_TYPES_ARR),
        awarenessRadius:   posInt(0, 500),
        gazeTarget:        fc.oneof(
          { arbitrary: fc.constant(null), weight: 1 },
          { arbitrary: fc.constantFrom(...actorIds), weight: 1 },
        ),
        emotionalReaction: fc.oneof(
          { arbitrary: fc.constant(null),              weight: 1 },
          { arbitrary: enumOf(ACTOR_EMOTIONS_ARR),     weight: 1 },
        ),
      }),
      { minLength: 0, maxLength: 3 }
    );
    return relArbitrary.map(rels => ({
      ...base,
      relationships: rels as CharacterRelationship[],
    }));
  });
}
