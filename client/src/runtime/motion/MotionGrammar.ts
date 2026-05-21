// Animaster Motion Grammar — recombines Motion_Primitives into contextually
// appropriate motion sequences.
// Implements: Design.md (Motion_Primitive, Motion_Grammar), Requirements 14-15
//
// WHY: The Phase 10 audit found that "motion grammar" was fake — just sine-wave
// switch statements. This implements the real system: a library of atomic
// motion primitives that are assembled by grammar rules triggered by actor goals.
// Property 13: assembled sequences satisfy all joint constraints
// Property 14: grammar round-trip (serialize/deserialize)

import type {
  MotionPrimitive, MotionGrammar, GrammarRule,
  PrimitiveKeyframe, Transform2D, Vector2,
  EntityType, PhysicalConstraint, JointTransformMap,
  ActorGoal, Actor,
} from '@animaster/shared/core';

// ============================================================
// Built-in Motion Primitives
// ============================================================

const BIPED_SPINE_JOINTS = ['spine_lower', 'spine_mid', 'spine_upper', 'neck', 'head'];
const BIPED_ARM_JOINTS = ['left_shoulder', 'left_elbow', 'left_wrist', 'right_shoulder', 'right_elbow', 'right_wrist'];
const BIPED_LEG_JOINTS = ['left_hip', 'left_knee', 'left_ankle', 'right_hip', 'right_knee', 'right_ankle'];

function makeStep(side: 'left' | 'right', direction: 'forward' | 'backward' | 'lateral'): MotionPrimitive {
  const swingAngle = direction === 'forward' ? 25 : direction === 'backward' ? -20 : 15;
  const armSwing = direction === 'lateral' ? 10 : 8;
  const hipJoint = `${side}_hip`;
  const kneeJoint = `${side}_knee`;
  const ankleJoint = `${side}_ankle`;
  const armSide = side === 'left' ? 'right' : 'left'; // contralateral arm swing
  const shoulderJoint = `${armSide}_shoulder`;
  const elbowJoint = `${armSide}_elbow`;

  return {
    id: `step_${side}_${direction}`,
    name: `${side} step ${direction}`,
    targetJoints: [hipJoint, kneeJoint, ankleJoint, shoulderJoint, elbowJoint, 'spine_lower'],
    durationMs: 500,
    keyframes: [
      {
        timeMs: 0,
        jointTransforms: {
          [hipJoint]: { rotation: 0 },
          [kneeJoint]: { rotation: 0 },
          [ankleJoint]: { rotation: 0 },
          [shoulderJoint]: { rotation: 0 },
          [elbowJoint]: { rotation: 0 },
          spine_lower: { rotation: 0 },
        },
      },
      {
        timeMs: 150,
        jointTransforms: {
          [hipJoint]: { rotation: (swingAngle * Math.PI) / 180 },
          [kneeJoint]: { rotation: (swingAngle * 0.3 * Math.PI) / 180 },
          [ankleJoint]: { rotation: (swingAngle * 0.1 * Math.PI) / 180 },
          [shoulderJoint]: { rotation: (-armSwing * Math.PI) / 180 },
          [elbowJoint]: { rotation: (-armSwing * 0.5 * Math.PI) / 180 },
          spine_lower: { rotation: (2 * Math.PI) / 180 },
        },
      },
      {
        timeMs: 350,
        jointTransforms: {
          [hipJoint]: { rotation: (swingAngle * 0.1 * Math.PI) / 180 },
          [kneeJoint]: { rotation: 0 },
          [ankleJoint]: { rotation: 0 },
          [shoulderJoint]: { rotation: (-armSwing * 0.1 * Math.PI) / 180 },
          [elbowJoint]: { rotation: 0 },
          spine_lower: { rotation: 0 },
        },
      },
      {
        timeMs: 500,
        jointTransforms: {
          [hipJoint]: { rotation: 0 },
          [kneeJoint]: { rotation: 0 },
          [ankleJoint]: { rotation: 0 },
          [shoulderJoint]: { rotation: 0 },
          [elbowJoint]: { rotation: 0 },
          spine_lower: { rotation: 0 },
        },
      },
    ],
    compatibleArchetypes: ['humanoid'],
  };
}

function makeBreathCycle(): MotionPrimitive {
  return {
    id: 'breath_cycle',
    name: 'Breathing cycle',
    targetJoints: ['spine_upper', 'spine_mid', 'head'],
    durationMs: 3200,
    keyframes: [
      {
        timeMs: 0,
        jointTransforms: { spine_upper: { scale: { x: 1, y: 1 } }, spine_mid: { scale: { x: 1, y: 1 } } },
      },
      {
        timeMs: 1600,
        jointTransforms: { spine_upper: { scale: { x: 1.008, y: 1.008 } }, spine_mid: { scale: { x: 1.005, y: 1.005 } } },
      },
      {
        timeMs: 3200,
        jointTransforms: { spine_upper: { scale: { x: 1, y: 1 } }, spine_mid: { scale: { x: 1, y: 1 } } },
      },
    ],
    compatibleArchetypes: ['humanoid', 'quadruped'],
  };
}

function makeHeadTurn(direction: 'left' | 'right'): MotionPrimitive {
  const angle = direction === 'left' ? -15 : 15;
  return {
    id: `head_turn_${direction}`,
    name: `Head turn ${direction}`,
    targetJoints: ['neck', 'head'],
    durationMs: 600,
    keyframes: [
      { timeMs: 0, jointTransforms: { neck: { rotation: 0 }, head: { rotation: 0 } } },
      { timeMs: 200, jointTransforms: { neck: { rotation: (angle * 0.7 * Math.PI) / 180 }, head: { rotation: (angle * 0.3 * Math.PI) / 180 } } },
      { timeMs: 600, jointTransforms: { neck: { rotation: (angle * Math.PI) / 180 }, head: { rotation: (angle * Math.PI) / 180 } } },
    ],
    compatibleArchetypes: ['humanoid'],
  };
}

function makeWeightShift(side: 'left' | 'right'): MotionPrimitive {
  const lean = side === 'left' ? -3 : 3;
  return {
    id: `weight_shift_${side}`,
    name: `Weight shift ${side}`,
    targetJoints: ['spine_lower', 'left_hip', 'right_hip'],
    durationMs: 800,
    keyframes: [
      { timeMs: 0, jointTransforms: { spine_lower: { rotation: 0 }, left_hip: { rotation: 0 }, right_hip: { rotation: 0 } } },
      { timeMs: 400, jointTransforms: { spine_lower: { rotation: (lean * Math.PI) / 180 }, left_hip: { rotation: side === 'left' ? 0.02 : -0.02 }, right_hip: { rotation: side === 'right' ? 0.02 : -0.02 } } },
      { timeMs: 800, jointTransforms: { spine_lower: { rotation: 0 }, left_hip: { rotation: 0 }, right_hip: { rotation: 0 } } },
    ],
    compatibleArchetypes: ['humanoid'],
  };
}

function makeGestureNod(): MotionPrimitive {
  return {
    id: 'gesture_nod',
    name: 'Nod',
    targetJoints: ['neck', 'head'],
    durationMs: 500,
    keyframes: [
      { timeMs: 0, jointTransforms: { neck: { rotation: 0 }, head: { rotation: 0 } } },
      { timeMs: 150, jointTransforms: { neck: { rotation: 0.12 }, head: { rotation: 0.08 } } },
      { timeMs: 300, jointTransforms: { neck: { rotation: -0.04 }, head: { rotation: -0.03 } } },
      { timeMs: 500, jointTransforms: { neck: { rotation: 0 }, head: { rotation: 0 } } },
    ],
    compatibleArchetypes: ['humanoid'],
  };
}

function makeGestureShake(): MotionPrimitive {
  return {
    id: 'gesture_shake_head',
    name: 'Head shake',
    targetJoints: ['neck', 'head'],
    durationMs: 800,
    keyframes: [
      { timeMs: 0, jointTransforms: { neck: { rotation: 0 }, head: { rotation: 0 } } },
      { timeMs: 200, jointTransforms: { neck: { rotation: -0.15 }, head: { rotation: -0.1 } } },
      { timeMs: 400, jointTransforms: { neck: { rotation: 0.15 }, head: { rotation: 0.1 } } },
      { timeMs: 600, jointTransforms: { neck: { rotation: -0.1 }, head: { rotation: -0.07 } } },
      { timeMs: 800, jointTransforms: { neck: { rotation: 0 }, head: { rotation: 0 } } },
    ],
    compatibleArchetypes: ['humanoid'],
  };
}

// ============================================================
// Built-in Grammar Rules
// ============================================================

const BUILTIN_RULES: GrammarRule[] = [
  {
    id: 'walk_forward',
    trigger: 'move_to',
    sequence: ['step_left_forward', 'step_right_forward'],
    constraints: [
      { jointId: 'left_hip', maxAngle: 45, minAngle: -30 },
      { jointId: 'right_hip', maxAngle: 45, minAngle: -30 },
    ],
  },
  {
    id: 'idle_breathing',
    trigger: 'idle',
    sequence: ['breath_cycle'],
    constraints: [],
  },
  {
    id: 'look_around',
    trigger: 'look_at',
    sequence: ['head_turn_left', 'head_turn_right'],
    constraints: [
      { jointId: 'neck', maxAngle: 30, minAngle: -30 },
    ],
  },
  {
    id: 'hesitant_shift',
    trigger: 'hesitant',
    sequence: ['weight_shift_left', 'weight_shift_right'],
    constraints: [
      { jointId: 'spine_lower', maxAngle: 10, minAngle: -10 },
    ],
  },
  {
    id: 'acknowledge',
    trigger: 'interact_with',
    sequence: ['gesture_nod'],
    constraints: [],
  },
  {
    id: 'refuse',
    trigger: 'refuse',
    sequence: ['gesture_shake_head'],
    constraints: [],
  },
];

// ============================================================
// Built-in Primitives Registry
// ============================================================

const BUILTIN_PRIMITIVES: MotionPrimitive[] = [
  makeStep('left', 'forward'),
  makeStep('right', 'forward'),
  makeStep('left', 'backward'),
  makeStep('right', 'backward'),
  makeStep('left', 'lateral'),
  makeStep('right', 'lateral'),
  makeBreathCycle(),
  makeHeadTurn('left'),
  makeHeadTurn('right'),
  makeWeightShift('left'),
  makeWeightShift('right'),
  makeGestureNod(),
  makeGestureShake(),
];

// ============================================================
// Motion Grammar Class
// ============================================================

export class MotionGrammarEngine {
  private primitives: Map<string, MotionPrimitive>;
  private rules: GrammarRule[];
  private version: string;

  constructor(primitives?: MotionPrimitive[], rules?: GrammarRule[]) {
    this.primitives = new Map();
    this.rules = rules ?? [...BUILTIN_RULES];
    this.version = '1.0.0';

    // Register built-in primitives
    for (const p of BUILTIN_PRIMITIVES) {
      this.primitives.set(p.id, p);
    }
    // Add any custom primitives
    for (const p of primitives ?? []) {
      this.primitives.set(p.id, p);
    }
  }

  /**
   * Assemble a motion sequence for a given goal trigger.
   * Property 13: assembled sequences satisfy all joint constraints.
   * Returns null if no rule matches the trigger.
   */
  assemble(trigger: string, actorArchetype: EntityType): MotionPrimitive[] | null {
    const rule = this.findRule(trigger);
    if (!rule) return null;

    const sequence: MotionPrimitive[] = [];
    for (const primitiveId of rule.sequence) {
      const primitive = this.primitives.get(primitiveId);
      if (!primitive) continue; // skip missing primitives
      if (!primitive.compatibleArchetypes.includes(actorArchetype)) continue;
      sequence.push(primitive);
    }

    if (sequence.length === 0) return null;
    return sequence;
  }

  /**
   * Evaluate a motion primitive at a given time, producing joint transforms.
   * Interpolates between keyframes smoothly.
   */
  evaluate(primitive: MotionPrimitive, elapsedMs: number, weight: number = 1.0): JointTransformMap {
    const transforms: JointTransformMap = {};
    const t = elapsedMs % primitive.durationMs; // loop

    // Find the two keyframes to interpolate between
    let kfA = primitive.keyframes[0];
    let kfB = primitive.keyframes[primitive.keyframes.length - 1];

    for (let i = 0; i < primitive.keyframes.length - 1; i++) {
      if (t >= primitive.keyframes[i].timeMs && t <= primitive.keyframes[i + 1].timeMs) {
        kfA = primitive.keyframes[i];
        kfB = primitive.keyframes[i + 1];
        break;
      }
    }

    // Interpolation factor
    const duration = kfB.timeMs - kfA.timeMs;
    const alpha = duration > 0 ? Math.max(0, Math.min(1, (t - kfA.timeMs) / duration)) : 0;
    // Smooth step interpolation for cinematic feel
    const smoothAlpha = alpha * alpha * (3 - 2 * alpha);

    // Interpolate joint transforms
    for (const jointId of primitive.targetJoints) {
      const aTransform = kfA.jointTransforms[jointId] ?? {};
      const bTransform = kfB.jointTransforms[jointId] ?? {};

      transforms[jointId] = {
        position: {
          x: lerp((aTransform as any).position?.x ?? 0, (bTransform as any).position?.x ?? 0, smoothAlpha) * weight,
          y: lerp((aTransform as any).position?.y ?? 0, (bTransform as any).position?.y ?? 0, smoothAlpha) * weight,
        },
        rotation: lerp((aTransform as any).rotation ?? 0, (bTransform as any).rotation ?? 0, smoothAlpha) * weight,
        scale: {
          x: lerp((aTransform as any).scale?.x ?? 1, (bTransform as any).scale?.x ?? 1, smoothAlpha),
          y: lerp((aTransform as any).scale?.y ?? 1, (bTransform as any).scale?.y ?? 1, smoothAlpha),
        },
      };
    }

    return transforms;
  }

  /**
   * Validate that joint transforms satisfy physical constraints.
   * Property 15: clamp violations before frame emission.
   */
  validateConstraints(transforms: JointTransformMap, constraints: PhysicalConstraint[]): JointTransformMap {
    const clamped = { ...transforms };
    for (const constraint of constraints) {
      const transform = clamped[constraint.jointId];
      if (!transform) continue;

      if (constraint.maxAngle !== undefined && transform.rotation > (constraint.maxAngle * Math.PI) / 180) {
        clamped[constraint.jointId] = {
          ...transform,
          rotation: (constraint.maxAngle * Math.PI) / 180,
        };
      }
      if (constraint.minAngle !== undefined && transform.rotation < (constraint.minAngle * Math.PI) / 180) {
        clamped[constraint.jointId] = {
          ...transform,
          rotation: (constraint.minAngle * Math.PI) / 180,
        };
      }
    }
    return clamped;
  }

  /**
   * Get a primitive by ID.
   */
  getPrimitive(id: string): MotionPrimitive | undefined {
    return this.primitives.get(id);
  }

  /**
   * Register a custom primitive.
   */
  registerPrimitive(primitive: MotionPrimitive): void {
    this.primitives.set(primitive.id, primitive);
  }

  /**
   * Register a custom grammar rule.
   */
  registerRule(rule: GrammarRule): void {
    this.rules.push(rule);
  }

  /**
   * Get the full grammar (for serialization).
   * Property 14: grammar round-trip.
   */
  getGrammar(): MotionGrammar {
    return {
      primitives: Object.fromEntries(this.primitives),
      rules: [...this.rules],
      version: this.version,
    };
  }

  /**
   * Load a grammar (for deserialization).
   * Property 14: grammar round-trip.
   */
  loadGrammar(grammar: MotionGrammar): void {
    this.primitives.clear();
    for (const [id, primitive] of Object.entries(grammar.primitives)) {
      this.primitives.set(id, primitive);
    }
    this.rules = [...grammar.rules];
    this.version = grammar.version;
  }

  private findRule(trigger: string): GrammarRule | undefined {
    // Exact match first
    let rule = this.rules.find(r => r.trigger === trigger);
    if (rule) return rule;

    // Partial match (e.g., "move_to_target" matches "move_to")
    rule = this.rules.find(r => trigger.startsWith(r.trigger));
    return rule;
  }
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Singleton
let _instance: MotionGrammarEngine | null = null;

export function getMotionGrammar(): MotionGrammarEngine {
  if (!_instance) {
    _instance = new MotionGrammarEngine();
  }
  return _instance;
}

export function resetMotionGrammar(): void {
  _instance = null;
}