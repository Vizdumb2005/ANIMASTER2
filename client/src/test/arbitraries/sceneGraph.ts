/**
 * client/src/test/arbitraries/sceneGraph.ts
 *
 * Composite fast-check arbitrary that produces valid SceneGraph objects
 * for client-side property-based testing.
 *
 * Generates valid SceneGraph objects with 1-5 actors, valid environments,
 * and camera states.
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
} from '@animaster/shared/scene';
import { SpecPrinter } from '@animaster/shared/specPrinter';

// ---------------------------------------------------------------------------
// Primitive arbitraries
// ---------------------------------------------------------------------------

const safeInt = (min = -1_000_000, max = 1_000_000): fc.Arbitrary<number> =>
  fc.integer({ min, max });

const posInt = (min = 0, max = 1_000_000): fc.Arbitrary<number> =>
  fc.integer({ min, max });

const safeFloat = (min = -1000, max = 1000): fc.Arbitrary<number> =>
  fc
    .integer({ min: Math.round(min * 10000), max: Math.round(max * 10000) })
    .map((n: number) => n / 10000);

const unitFloat = (): fc.Arbitrary<number> => safeFloat(0, 1);

const safeId = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[a-z][a-z0-9_]{3,11}$/);

const safeLabel = (): fc.Arbitrary<string> =>
  fc.stringMatching(/^[a-z]{4,20}$/);

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
// Enum values
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

/**
 * Generates a valid SceneGraph object with 1 to 5 actors, valid environments,
 * and camera states.
 */
export function arbitrarySceneGraph(): fc.Arbitrary<SceneGraph> {
  return fc.record({
    id:               safeId(),
    version:          posInt(1, 999),
    actors:           fc.array(arbitraryActor(),        { minLength: 1, maxLength: 5 }),
    environment:      arbitraryEnvironment(),
    camera:           arbitraryCamera(),
    sessionHistory:   fc.array(arbitrarySessionEntry(), { minLength: 0, maxLength: 5 }),
    cinematicGrammar: arbitraryCinematicGrammar(),
    atmosphere:       arbitraryAtmosphere(),
    rhythm:           arbitraryRhythm(),
  }).chain(base => {
    const actorIds = base.actors.map(a => a.id);
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
  }) as fc.Arbitrary<SceneGraph>;
}

/**
 * Generates syntactically broken YAML strings that are guaranteed to fail parsing.
 */
export function arbitraryMalformedYaml(): fc.Arbitrary<string> {
  return fc.oneof(
    // Unclosed double quote
    fc.stringMatching(/^[^"]*$/).map(s => `id: "unclosed_${s}`),
    // Unclosed single quote
    fc.stringMatching(/^[^']*$/).map(s => `id: 'unclosed_${s}`),
    // Unclosed bracket/flow collection
    fc.stringMatching(/^[^\]]*$/).map(s => `actors: [${s}`),
    // Unclosed brace
    fc.stringMatching(/^[^} ]*$/).map(s => `camera: {${s}`),
    // Invalid characters or formatting
    fc.constant('version: : :'),
    fc.constant('actors: [,]'),
  );
}

/**
 * Generates structurally valid YAML strings but with field values violating schema constraints.
 */
export function arbitraryOutOfRangeSpec(): fc.Arbitrary<string> {
  return arbitrarySceneGraph().chain(graph => {
    // Clone graph to avoid mutation side effects across runs
    const mutated = JSON.parse(JSON.stringify(graph));

    // List of mutation actions to choose from
    const mutations = [
      () => {
        mutated.id = 12345;
      },
      () => {
        mutated.id = { some: 'object' };
      },
      () => {
        delete mutated.id;
      },
      () => {
        delete mutated.version;
      },
      () => {
        delete mutated.actors;
      },
      () => {
        delete mutated.environment;
      },
      () => {
        mutated.version = 'v1';
      },
      () => {
        mutated.version = -5;
      },
      () => {
        mutated.environment.width = 'too_wide';
      },
      () => {
        mutated.environment.width = -10;
      },
      () => {
        mutated.environment.height = 0;
      },
      () => {
        mutated.camera.mode = 'fisheye';
      },
      () => {
        if (mutated.actors && mutated.actors.length > 0) {
          mutated.actors[0].type = 'alien';
        } else {
          mutated.actors = 'not-an-array';
        }
      },
      () => {
        if (mutated.actors && mutated.actors.length > 0) {
          mutated.actors[0].emotionState = 'super_happy';
        } else {
          mutated.actors = null;
        }
      },
      () => {
        if (mutated.actors && mutated.actors.length > 0) {
          mutated.actors[0].joints = 'broken_joints';
        } else {
          delete mutated.camera;
        }
      },
      () => {
        if (mutated.actors && mutated.actors.length > 0) {
          mutated.actors[0].actionElapsed = -100;
        } else {
          delete mutated.rhythm;
        }
      },
      () => {
        if (mutated.relationships && mutated.relationships.length > 0) {
          mutated.relationships[0].type = 'enemies';
        } else {
          mutated.relationships = 'not-an-array';
        }
      },
      () => {
        mutated.rhythm.tempo = 'andante';
      },
    ];

    return fc.constantFrom(...mutations).map(mutator => {
      mutator();
      return SpecPrinter.print(mutated as any);
    });
  });
}

