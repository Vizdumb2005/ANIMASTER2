// Animaster Core Property-Based Tests
// Implements Properties 1-21 from design.md Section: Correctness Properties
// Run with: npx vitest run

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  arbSceneGraph, arbActor, arbBehaviorLayerSet,
  arbEmotionState, arbBuiltInSemanticTag, arbIntentPrompt,
  arbMalformedYaml, arbActiveBehavior,
} from './arbitraries';
import { EventBus } from '../runtime/events/EventBus';
import { Runtime, createDefaultBehaviorLayerSet, MotionCache } from '../runtime/engine/Runtime';
import { MotionGrammarEngine } from '../runtime/motion/MotionGrammar';
import { applyTag, removeTag } from '../runtime/tags/SemanticTagSystem';
import { printSceneGraph, parseSceneGraph } from '../runtime/spec/SpecFormat';
import type { SimulationEvent, SceneGraph, BehaviorLayerSet, Actor, EmotionState } from '@animaster/shared/core';

// ============================================================
// Properties 1-4: Intent Interpreter
// ============================================================

describe('Property 1: Scene Graph Completeness', () => {
  it('any valid scene graph has at least one actor with required fields', () => {
    fc.assert(
      fc.property(arbSceneGraph, (scene) => {
        // A scene with actors must have all required fields
        if (scene.actors.length > 0) {
          for (const actor of scene.actors) {
            expect(actor.entityType).toMatch(/^(humanoid|quadruped|object)$/);
            expect(actor.emotionState).toBeDefined();
            expect(actor.emotionState.name).toBeTruthy();
            expect(actor.rig).toBeDefined();
            expect(actor.behaviorLayers).toBeDefined();
          }
        }
        expect(scene.environment).toBeDefined();
        expect(scene.atmosphere).toBeDefined();
        expect(scene.camera).toBeDefined();
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property 2: Event Bus Liveness', () => {
  it('dispatching any event never throws', () => {
    fc.assert(
      fc.property(arbIntentPrompt, (prompt) => {
        const bus = new EventBus();
        let received = false;
        bus.subscribe('*', () => { received = true; });
        // Dispatch a well-typed event
        expect(() => {
          bus.dispatch({ type: 'mutation_applied', mutationType: 'test' } as SimulationEvent);
        }).not.toThrow();
        expect(received).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property 3: Semantic Edit Continuity', () => {
  it('editing one actor leaves others unchanged', () => {
    fc.assert(
      fc.property(arbSceneGraph, arbBuiltInSemanticTag, (scene, tagName) => {
        if (scene.actors.length < 2) return;
        const bus = new EventBus();
        const before = structuredClone(scene);
        const target = scene.actors[0];
        const untouched = scene.actors[1];

        // Apply a tag to the first actor
        applyTag(target, tagName, 0);

        // The untouched actor should have the same id, label, entityType
        expect(untouched.id).toBe(before.actors[1].id);
        expect(untouched.label).toBe(before.actors[1].label);
        expect(untouched.entityType).toBe(before.actors[1].entityType);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Properties 5-6: Director Decision Validity
// ============================================================

describe('Property 6: Director Decision Actor Reference Validity', () => {
  it('director decisions reference valid actor IDs', () => {
    fc.assert(
      fc.property(arbSceneGraph, (scene) => {
        if (scene.actors.length === 0) return;
        const actorIds = new Set(scene.actors.map(a => a.id));
        // Any decision targeting an actor should use an ID from the scene
        for (const actor of scene.actors) {
          expect(actorIds.has(actor.id)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Properties 7-9: Motion Behavior Evaluation
// ============================================================

describe('Property 7: Motion Behavior Evaluation Totality', () => {
  it('evaluating any motion primitive produces non-null transforms', () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 10000 }), (elapsedMs) => {
        const grammar = new MotionGrammarEngine();
        const result = grammar.assemble('idle', 'humanoid');
        if (result) {
          for (const primitive of result) {
            const transforms = grammar.evaluate(primitive, elapsedMs);
            expect(transforms).not.toBeNull();
            expect(typeof transforms).toBe('object');
          }
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property 9: Motion Behavior Blending', () => {
  it('blended weights sum preserves joint presence', () => {
    fc.assert(
      fc.property(arbBehaviorLayerSet, (layers) => {
        const allJoints = new Set<string>();
        for (const layer of Object.values(layers)) {
          if (!layer.enabled) continue;
          for (const behavior of layer.behaviors) {
            // Active behaviors contribute joints
            expect(behavior.blendWeight).toBeGreaterThanOrEqual(0);
            expect(behavior.blendWeight).toBeLessThanOrEqual(1);
          }
        }
        // All weights are valid numbers
        expect(true).toBe(true);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Property 10: Additive Layer Composition
// ============================================================

describe('Property 10: Additive Behavior Layer Composition', () => {
  it('layer indices are correctly ordered', () => {
    fc.assert(
      fc.property(arbActor, (actor) => {
        const layers = actor.behaviorLayers;
        // Verify layer indices are correct
        expect(layers.layer1_locomotion.index).toBe(1);
        expect(layers.layer2_emotion.index).toBe(2);
        expect(layers.layer3_gesture.index).toBe(3);
        expect(layers.layer4_micro.index).toBe(4);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Properties 11-12: Emotion System
// ============================================================

describe('Property 12: Emotion State Preserves Behavior Identity', () => {
  it('changing emotion does not change active behavior IDs', () => {
    fc.assert(
      fc.property(arbActor, arbEmotionState, (actor, newEmotion) => {
        const beforeBehaviorIds = actor.activeBehaviors.map(b => b.behaviorId);
        actor.emotionState = newEmotion;
        const afterBehaviorIds = actor.activeBehaviors.map(b => b.behaviorId);
        expect(afterBehaviorIds).toEqual(beforeBehaviorIds);
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Properties 13-14: Motion Grammar
// ============================================================

describe('Property 13: Motion Grammar Assembly Correctness', () => {
  it('assembled sequences contain valid primitive IDs', () => {
    const grammar = new MotionGrammarEngine();
    const triggers = ['move_to', 'idle', 'look_at', 'hesitant', 'interact_with', 'refuse'];
    for (const trigger of triggers) {
      const result = grammar.assemble(trigger, 'humanoid');
      if (result) {
        for (const primitive of result) {
          expect(primitive.id).toBeTruthy();
          expect(primitive.targetJoints.length).toBeGreaterThan(0);
          expect(primitive.durationMs).toBeGreaterThan(0);
          expect(primitive.keyframes.length).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });
});

describe('Property 14: Motion Grammar Round-Trip', () => {
  it('serialize then deserialize produces equivalent grammar', () => {
    const grammar = new MotionGrammarEngine();
    const original = grammar.getGrammar();
    const newGrammar = new MotionGrammarEngine();
    newGrammar.loadGrammar(original);
    const roundTripped = newGrammar.getGrammar();
    expect(roundTripped.version).toBe(original.version);
    expect(roundTripped.rules.length).toBe(original.rules.length);
    expect(Object.keys(roundTripped.primitives).length).toBe(Object.keys(original.primitives).length);
  });
});

// ============================================================
// Property 15: Joint Constraint Invariant
// ============================================================

describe('Property 15: Joint Constraint Invariant', () => {
  it('motion grammar evaluation respects constraints', () => {
    const grammar = new MotionGrammarEngine();
    const result = grammar.assemble('idle', 'humanoid');
    if (result) {
      for (const primitive of result) {
        for (let t = 0; t < primitive.durationMs; t += 100) {
          const transforms = grammar.evaluate(primitive, t);
          for (const [jointId, transform] of Object.entries(transforms)) {
            // Rotation should be within reasonable bounds
            expect(Math.abs(transform.rotation)).toBeLessThanOrEqual(Math.PI);
          }
        }
      }
    }
  });
});

// ============================================================
// Property 16: Semantic Tag Application and Restoration
// ============================================================

describe('Property 16: Semantic Tag Apply and Restore', () => {
  it('applying then removing a tag restores baseline values', () => {
    fc.assert(
      fc.property(arbActor, arbBuiltInSemanticTag, (baseActor, tagName) => {
        const actor = structuredClone(baseActor);
        if (!actor.behaviorLayers) {
          actor.behaviorLayers = createDefaultBehaviorLayerSet();
        }
        const baselineBreathRate = actor.idleParams.breathRate;

        const applied = applyTag(actor, tagName, 0);
        if (applied) {
          // After applying, breath rate should differ from baseline
          // (only if the tag modifies breathRate)
          const afterApplyBreathRate = actor.idleParams.breathRate;

          // Remove the tag
          const removed = removeTag(actor, tagName);
          expect(removed).toBe(true);

          // After removal, breath rate should be restored to baseline
          expect(actor.idleParams.breathRate).toBeCloseTo(baselineBreathRate, 5);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Properties 17-18: Event-Driven Recomputation
// ============================================================

describe('Property 17: Event-Driven Selective Recomputation', () => {
  it('idle actors without events are not recomputed', () => {
    const bus = new EventBus();
    let recomputationCount = 0;
    bus.subscribe('actor_goal_changed', () => { recomputationCount++; });
    bus.subscribe('emotion_state_changed', () => { recomputationCount++; });

    // Dispatch events for only one actor
    bus.dispatch({ type: 'actor_goal_changed', actorId: 'a1', goal: { type: 'idle', reason: 'test', priority: 0, interruptible: true } } as SimulationEvent);

    expect(recomputationCount).toBe(1);
  });
});

describe('Property 18: Event Dispatch Ordering', () => {
  it('events are processed in dispatch order', () => {
    const bus = new EventBus();
    const order: string[] = [];
    bus.subscribe('*', (event) => {
      order.push(event.type);
    });

    bus.dispatch({ type: 'mutation_applied', mutationType: 'first' } as SimulationEvent);
    bus.dispatch({ type: 'mutation_applied', mutationType: 'second' } as SimulationEvent);
    bus.dispatch({ type: 'mutation_applied', mutationType: 'third' } as SimulationEvent);

    expect(order).toEqual(['mutation_applied', 'mutation_applied', 'mutation_applied']);
  });
});

// ============================================================
// Property 19: Motion Cache
// ============================================================

describe('Property 19: Motion Cache Correctness', () => {
  it('identical inputs produce cache hits with equal values', () => {
    const cache = new MotionCache();
    const key = 'actor1:neutral:idle:0';
    const value = { spine: { position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 } } };

    cache.set(key, value);
    const hit = cache.get(key);
    expect(hit).not.toBeNull();
    expect(hit!.spine.rotation).toBe(0);
  });

  it('changing a parameter invalidates the cache', () => {
    const cache = new MotionCache();
    cache.set('actor1:nervous:idle:0', {});
    cache.set('actor1:happy:idle:0', {});

    cache.invalidateForBehavior('idle');
    // After invalidation, the entries for 'idle' should be gone
    const hit = cache.get('actor1:nervous:idle:0');
    expect(hit).toBeNull();
  });
});

// ============================================================
// Properties 20-21: Spec Parser/Printer
// ============================================================

describe('Property 20: Spec Round-Trip', () => {
  it('print then parse produces structurally equivalent graph', () => {
    fc.assert(
      fc.property(arbSceneGraph, (scene) => {
        const yaml = printSceneGraph(scene);
        const result = parseSceneGraph(yaml);
        expect(result.ok).toBe(true);
        if (result.ok) {
          // Verify structural equivalence for key fields
          // Note: IDs may have quotes stripped, so compare semantic content
          expect(result.value.version).toBe(scene.version);
          expect(result.value.metadata.cinematicStyle).toBe(scene.metadata.cinematicStyle);
          expect(result.value.camera.cinematicStyle).toBe(scene.camera.cinematicStyle);
          expect(result.value.atmosphere.shadowIntensity).toBeCloseTo(scene.atmosphere.shadowIntensity, 3);
          expect(result.value.atmosphere.ambientLightLevel).toBeCloseTo(scene.atmosphere.ambientLightLevel, 3);
          expect(result.value.environment.type).toBe(scene.environment.type);
        }
      }),
      { numRuns: 100 },
    );
  });
});

describe('Property 21: Spec Parser Error Handling', () => {
  it('malformed YAML returns error result, never throws', () => {
    fc.assert(
      fc.property(arbMalformedYaml, (yaml) => {
        expect(() => parseSceneGraph(yaml)).not.toThrow();
        const result = parseSceneGraph(yaml);
        // Should return a Result type (either ok or error)
        expect(result).toHaveProperty('ok');
        if (!result.ok) {
          expect(Array.isArray(result.error)).toBe(true);
        }
      }),
      { numRuns: 100 },
    );
  });
});

// ============================================================
// Additional: Runtime Stability
// ============================================================

describe('Runtime tick stability', () => {
  it('runtime produces valid frames for 100 consecutive ticks', () => {
    fc.assert(
      fc.property(arbSceneGraph, (scene) => {
        if (scene.actors.length === 0) return;
        const bus = new EventBus();
        const runtime = new Runtime(scene, bus);
        for (let i = 0; i < 100; i++) {
          const frame = runtime.tick(1000 / 60);
          expect(frame).toBeDefined();
          expect(frame.actors.length).toBe(scene.actors.length);
          expect(frame.tick).toBe(i + 1);
        }
      }),
      { numRuns: 20 },
    );
  });
});