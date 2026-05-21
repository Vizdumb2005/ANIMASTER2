import fc from 'fast-check';
import type {
  SceneGraph, Actor, Environment, AtmosphereConfig, CameraState,
  EmotionState, BehaviorLayerSet, BehaviorLayer, BehaviorLayerIndex,
  LODLevel, EntityType, Vector2, Transform2D, Rig, Joint, JointConstraint,
  IdleParams, ActiveBehavior,
} from '@animaster/shared/core';

const f = Math.fround;

export const arbVector2: fc.Arbitrary<Vector2> = fc.record({
  x: fc.float({ min: f(-960), max: f(960), noNaN: true }),
  y: fc.float({ min: f(-540), max: f(540), noNaN: true }),
});

export const arbTransform2D: fc.Arbitrary<Transform2D> = fc.record({
  position: arbVector2,
  rotation: fc.float({ min: f(-3.14), max: f(3.14), noNaN: true }),
  scale: fc.record({
    x: fc.float({ min: f(0.1), max: f(3), noNaN: true }),
    y: fc.float({ min: f(0.1), max: f(3), noNaN: true }),
  }),
});

export const arbEntityType: fc.Arbitrary<EntityType> = fc.constantFrom('humanoid', 'quadruped', 'object');
export const arbLODLevel: fc.Arbitrary<LODLevel> = fc.constantFrom(0, 1, 2);

export const arbJointConstraint: fc.Arbitrary<JointConstraint> = fc.record({
  minAngle: fc.float({ min: f(-3.14), max: f(0), noNaN: true }),
  maxAngle: fc.float({ min: f(0), max: f(3.14), noNaN: true }),
});

export const arbJoint: fc.Arbitrary<Joint> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  category: fc.constantFrom('spine', 'limbs', 'extremities', 'auxiliary'),
  parentId: fc.oneof(fc.constant(null), fc.string({ minLength: 1, maxLength: 20 })),
  localTransform: arbTransform2D,
  constraints: arbJointConstraint,
});

export const arbRig: fc.Arbitrary<Rig> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  archetype: arbEntityType,
  joints: fc.array(arbJoint, { minLength: 1, maxLength: 5 }),
  constraints: fc.array(arbJointConstraint, { maxLength: 3 }),
  styleParams: fc.record({}),
});

export const arbBuiltInEmotion: fc.Arbitrary<string> = fc.constantFrom(
  'neutral', 'nervous', 'hesitant', 'energetic', 'awkward', 'aggressive', 'sad', 'happy',
);

export const arbEmotionState: fc.Arbitrary<EmotionState> = fc.record({
  name: arbBuiltInEmotion,
  isBuiltIn: fc.constant(true),
  parameterOverrides: fc.constant([]),
  blendDurationMs: fc.integer({ min: 100, max: 3000 }),
});

export const arbBuiltInSemanticTag: fc.Arbitrary<string> = fc.constantFrom(
  'nervous', 'hesitant', 'energetic', 'awkward', 'aggressive', 'tired', 'confident', 'distracted',
);

export const arbActiveBehavior: fc.Arbitrary<ActiveBehavior> = fc.record({
  behaviorId: fc.string({ minLength: 1, maxLength: 30 }),
  blendWeight: fc.float({ min: f(0), max: f(1), noNaN: true }),
  startedAt: fc.integer({ min: 0, max: 100000 }),
});

export const arbBehaviorLayer = (index: BehaviorLayerIndex): fc.Arbitrary<BehaviorLayer> =>
  fc.record({
    index: fc.constant(index),
    enabled: fc.boolean(),
    behaviors: fc.array(arbActiveBehavior, { maxLength: 3 }),
    isOverride: fc.boolean(),
  });

export const arbBehaviorLayerSet: fc.Arbitrary<BehaviorLayerSet> = fc.record({
  layer1_locomotion: arbBehaviorLayer(1),
  layer2_emotion: arbBehaviorLayer(2),
  layer3_gesture: arbBehaviorLayer(3),
  layer4_micro: arbBehaviorLayer(4),
});

export const arbIdleParams: fc.Arbitrary<IdleParams> = fc.record({
  breathRate: fc.float({ min: f(0.1), max: f(2), noNaN: true }),
  breathAmplitude: fc.float({ min: f(0.5), max: f(5), noNaN: true }),
  blinkIntervalMin: fc.integer({ min: 1000, max: 5000 }),
  blinkIntervalMax: fc.integer({ min: 5000, max: 10000 }),
  fidgetProbability: fc.float({ min: f(0), max: f(0.3), noNaN: true }),
  swayAmplitude: fc.float({ min: f(0), max: f(10), noNaN: true }),
  swayFrequency: fc.float({ min: f(0.1), max: f(2), noNaN: true }),
});

export const arbActor: fc.Arbitrary<Actor> = fc.record({
  id: fc.string({ minLength: 3, maxLength: 20 }).map(s => `actor_${s}`),
  label: fc.string({ minLength: 1, maxLength: 30 }),
  entityType: arbEntityType,
  rig: arbRig,
  emotionState: arbEmotionState,
  activeBehaviors: fc.array(arbActiveBehavior, { maxLength: 3 }),
  semanticTags: fc.constant([]),
  lodLevel: arbLODLevel,
  position: arbVector2,
  facing: fc.float({ min: f(-3.14), max: f(3.14), noNaN: true }),
  idleParams: arbIdleParams,
  secondaryJoints: fc.constant([]),
  goal: fc.constant(null),
  behaviorLayers: arbBehaviorLayerSet,
});

export const arbCinematicStyle = fc.constantFrom(
  'close_up', 'wide_shot', 'over_the_shoulder', 'lonely_framing',
  'dramatic_zoom', 'slow_pan', 'tracking_shot', 'bird_eye', 'static', 'follow', 'tension',
);

export const arbCameraState: fc.Arbitrary<CameraState> = fc.record({
  cinematicStyle: arbCinematicStyle,
  position: arbVector2,
  zoom: fc.float({ min: f(0.5), max: f(3), noNaN: true }),
  rotation: fc.float({ min: f(-0.5), max: f(0.5), noNaN: true }),
  activeRules: fc.constant([]),
  locked: fc.boolean(),
});

export const arbAtmosphereConfig: fc.Arbitrary<AtmosphereConfig> = fc.record({
  dominantPalette: fc.record({
    primary: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
    secondary: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
    accent: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
    shadow: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
  }),
  shadowIntensity: fc.float({ min: f(0), max: f(1), noNaN: true }),
  shadowDirection: arbVector2,
  ambientLightLevel: fc.float({ min: f(0), max: f(1), noNaN: true }),
  environmentalEffects: fc.constant([]),
  idleModifierHints: fc.constant({}),
  transitionDurationMs: fc.integer({ min: 100, max: 5000 }),
});

export const arbEnvironment: fc.Arbitrary<Environment> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  type: fc.constantFrom('indoor_room', 'outdoor_street', 'rooftop', 'cafe', 'park', 'office'),
  bounds: fc.record({ x: fc.integer(), y: fc.integer(), width: fc.integer({ min: 100, max: 1920 }), height: fc.integer({ min: 100, max: 1080 }) }),
  backgroundColor: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
  floorColor: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
  wallColor: fc.string({ minLength: 6, maxLength: 6 }).map(s => `#${s}`),
  width: fc.integer({ min: 100, max: 1920 }),
  height: fc.integer({ min: 100, max: 1080 }),
  surfaces: fc.constant([]),
  props: fc.constant([]),
  proceduralEffects: fc.constant([]),
  atmosphereHints: fc.constant([]),
});

export const arbSceneGraph: fc.Arbitrary<SceneGraph> = fc.record({
  id: fc.string({ minLength: 1, maxLength: 30 }),
  version: fc.integer({ min: 0, max: 1000 }),
  metadata: fc.record({
    createdAt: fc.integer({ min: 0, max: 2000000000 }),
    lastMutatedAt: fc.integer({ min: 0, max: 2000000000 }),
    editCount: fc.integer({ min: 0, max: 100 }),
    cinematicStyle: arbCinematicStyle,
    seed: fc.integer({ min: 1, max: 99999 }),
  }),
  actors: fc.array(arbActor, { maxLength: 5 }),
  environment: arbEnvironment,
  atmosphere: arbAtmosphereConfig,
  camera: arbCameraState,
  timeline: fc.constant([]),
  sessionHistory: fc.constant([]),
});

export const arbIntentPrompt = fc.oneof(
  fc.constantFrom(
    'two people arguing in a dark room',
    'a lonely figure on a rooftop at night',
    'an awkward first date at a cafe',
    'a nervous student waiting outside an office',
  ),
  fc.string({ minLength: 5, maxLength: 200 }),
);

export const arbMalformedYaml = fc.oneof(
  fc.constant(''),
  fc.constant('not yaml at all {{{{'),
  fc.constant('scene:\n  atmosphere:\n    shadow_intensity: 5.0'),
  fc.string({ minLength: 0, maxLength: 50 }),
);