/**
 * server/src/L3-4-session-structural-validity.pbt.test.ts
 *
 * L3-4 — PBT — Property 5 (Session Structural Validity)
 *
 * For any sequence of 20+ SceneGraphMutations applied sequentially, the resulting
 * graph remains structurally valid after each step:
 * - All required fields non-null
 * - All EntityTypes valid
 * - All EmotionState names recognized
 * - Version counter = number of mutations applied
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arbitrarySceneGraph } from './testing/arbitrarySceneGraph.js';
import {
  applyMutation,
  type SceneGraphMutation,
} from '../../shared/src/mutations.js';
import type { SceneGraph, Actor, ActorEmotion } from '../../shared/src/scene.js';

// Valid emotion states as defined in the type system
const VALID_EMOTIONS: ActorEmotion[] = [
  'neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted',
];

/**
 * Check if a value is a valid ActorEmotion
 */
function isValidEmotion(emotion: string): emotion is ActorEmotion {
  return VALID_EMOTIONS.includes(emotion as ActorEmotion);
}

/**
 * Validate that all required fields in an Actor are non-null and valid
 */
function validateActorStructure(actor: Actor, index: number): string[] {
  const errors: string[] = [];

  // Required ID
  if (!actor.id || typeof actor.id !== 'string') {
    errors.push(`Actor[${index}]: missing or invalid id`);
  }

  // Required label
  if (!actor.label || typeof actor.label !== 'string') {
    errors.push(`Actor[${index}]: missing or invalid label`);
  }

  // Required type (must be 'humanoid')
  if (actor.type !== 'humanoid') {
    errors.push(`Actor[${index}]: invalid type "${actor.type}" (expected 'humanoid')`);
  }

  // Required position
  if (!actor.position || typeof actor.position.x !== 'number' || typeof actor.position.y !== 'number') {
    errors.push(`Actor[${index}]: missing or invalid position`);
  }

  // Required emotionState
  if (!actor.emotionState || !isValidEmotion(actor.emotionState)) {
    errors.push(`Actor[${index}]: invalid emotionState "${actor.emotionState}"`);
  }

  // Required currentAction
  if (!actor.currentAction || typeof actor.currentAction !== 'string') {
    errors.push(`Actor[${index}]: missing or invalid currentAction`);
  }

  // Required actionQueue (array)
  if (!Array.isArray(actor.actionQueue)) {
    errors.push(`Actor[${index}]: actionQueue is not an array`);
  }

  // Required joints
  if (!actor.joints ||
      typeof actor.joints.head?.x !== 'number' ||
      typeof actor.joints.torso?.x !== 'number' ||
      typeof actor.joints.leftArm?.x !== 'number' ||
      typeof actor.joints.rightArm?.x !== 'number' ||
      typeof actor.joints.leftLeg?.x !== 'number' ||
      typeof actor.joints.rightLeg?.x !== 'number') {
    errors.push(`Actor[${index}]: missing or invalid joints`);
  }

  // Required actionElapsed
  if (typeof actor.actionElapsed !== 'number') {
    errors.push(`Actor[${index}]: missing or invalid actionElapsed`);
  }

  return errors;
}

/**
 * Validate the entire SceneGraph structure
 */
function validateSceneGraphStructure(graph: SceneGraph): string[] {
  const errors: string[] = [];

  // Required ID
  if (!graph.id || typeof graph.id !== 'string') {
    errors.push('SceneGraph: missing or invalid id');
  }

  // Required version (non-negative integer)
  if (typeof graph.version !== 'number' || graph.version < 0 || !Number.isInteger(graph.version)) {
    errors.push(`SceneGraph: invalid version "${graph.version}"`);
  }

  // Required actors array
  if (!Array.isArray(graph.actors)) {
    errors.push('SceneGraph: actors is not an array');
  } else {
    graph.actors.forEach((actor, i) => {
      errors.push(...validateActorStructure(actor, i));
    });
  }

  // Required environment
  if (!graph.environment) {
    errors.push('SceneGraph: missing environment');
  } else {
    const env = graph.environment;
    if (!env.type || typeof env.type !== 'string') {
      errors.push('SceneGraph: environment missing or invalid type');
    }
    if (!env.backgroundColor || typeof env.backgroundColor !== 'string') {
      errors.push('SceneGraph: environment missing or invalid backgroundColor');
    }
    if (!env.floorColor || typeof env.floorColor !== 'string') {
      errors.push('SceneGraph: environment missing or invalid floorColor');
    }
    if (!env.wallColor || typeof env.wallColor !== 'string') {
      errors.push('SceneGraph: environment missing or invalid wallColor');
    }
    if (typeof env.width !== 'number' || env.width <= 0) {
      errors.push('SceneGraph: environment missing or invalid width');
    }
    if (typeof env.height !== 'number' || env.height <= 0) {
      errors.push('SceneGraph: environment missing or invalid height');
    }
  }

  // Required camera
  if (!graph.camera) {
    errors.push('SceneGraph: missing camera');
  } else {
    const cam = graph.camera;
    if (typeof cam.x !== 'number') {
      errors.push('SceneGraph: camera missing or invalid x');
    }
    if (typeof cam.y !== 'number') {
      errors.push('SceneGraph: camera missing or invalid y');
    }
    if (typeof cam.zoom !== 'number' || cam.zoom <= 0) {
      errors.push('SceneGraph: camera missing or invalid zoom');
    }
    if (!cam.mode || typeof cam.mode !== 'string') {
      errors.push('SceneGraph: camera missing or invalid mode');
    }
  }

  // Required sessionHistory (array)
  if (!Array.isArray(graph.sessionHistory)) {
    errors.push('SceneGraph: sessionHistory is not an array');
  }

  // Required cinematicGrammar
  if (!graph.cinematicGrammar) {
    errors.push('SceneGraph: missing cinematicGrammar');
  } else {
    const cg = graph.cinematicGrammar;
    if (!cg.tone || typeof cg.tone !== 'string') {
      errors.push('SceneGraph: cinematicGrammar missing or invalid tone');
    }
    if (!cg.template) {
      errors.push('SceneGraph: cinematicGrammar missing template');
    }
  }

  // Required atmosphere
  if (!graph.atmosphere) {
    errors.push('SceneGraph: missing atmosphere');
  } else {
    const atm = graph.atmosphere;
    if (!Array.isArray(atm.effects)) {
      errors.push('SceneGraph: atmosphere.effects is not an array');
    }
    if (!atm.lightingTint || typeof atm.lightingTint !== 'string') {
      errors.push('SceneGraph: atmosphere missing or invalid lightingTint');
    }
    if (typeof atm.ambientIntensity !== 'number') {
      errors.push('SceneGraph: atmosphere missing or invalid ambientIntensity');
    }
  }

  // Required relationships (array)
  if (!Array.isArray(graph.relationships)) {
    errors.push('SceneGraph: relationships is not an array');
  }

  // Required rhythm
  if (!graph.rhythm) {
    errors.push('SceneGraph: missing rhythm');
  } else {
    const r = graph.rhythm;
    if (!r.tempo || typeof r.tempo !== 'string') {
      errors.push('SceneGraph: rhythm missing or invalid tempo');
    }
    if (typeof r.pauseFrequencyPerMinute !== 'number') {
      errors.push('SceneGraph: rhythm missing or invalid pauseFrequencyPerMinute');
    }
    if (!r.motionEnergyCurve || typeof r.motionEnergyCurve !== 'string') {
      errors.push('SceneGraph: rhythm missing or invalid motionEnergyCurve');
    }
  }

  return errors;
}

/**
 * Generate an arbitrary SceneGraphMutation
 */
function arbitraryMutation(sceneGraph: SceneGraph): fc.Arbitrary<SceneGraphMutation> {
  const hasActors = sceneGraph.actors.length > 0;
  const hasAnchors = sceneGraph.anchors && sceneGraph.anchors.length > 0;

  const mutations: fc.Arbitrary<SceneGraphMutation>[] = [
    // SetTone mutation
    fc.constantFrom('neutral', 'sad', 'tense', 'lonely', 'awkward', 'energetic', 'romantic', 'threatening' as const).map(
      (tone): SceneGraphMutation => ({
        type: 'SetTone',
        tone,
        reason: 'PBT test tone change',
      })
    ),

    // AddAtmosphere mutation
    fc.constantFrom('rain', 'fog', 'flicker', 'dust', 'snow', 'embers', 'none' as const).map(
      (effect): SceneGraphMutation => ({
        type: 'AddAtmosphere',
        effect,
        reason: 'PBT test atmosphere change',
      })
    ),
  ];

  // Actor-dependent mutations
  if (hasActors) {
    const actorIds = sceneGraph.actors.map(a => a.id);
    const targetActor = fc.constantFrom(...actorIds);

    mutations.push(
      // SetActorEmotion
      fc.tuple(targetActor, fc.constantFrom('neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted' as const)).map(
        ([actorId, emotion]): SceneGraphMutation => ({
          type: 'SetActorEmotion',
          actorId,
          emotion,
          intensity: 0.8,
          reason: 'PBT test emotion change',
        })
      ),

      // QueueActorAction
      fc.tuple(targetActor, fc.constantFrom('idle', 'walking', 'sitting', 'approaching', 'pacing' as const)).map(
        ([actorId, action]): SceneGraphMutation => ({
          type: 'QueueActorAction',
          actorId,
          action,
          reason: 'PBT test action queue',
        })
      ),

      // FocusCameraOn
      fc.tuple(fc.array(targetActor, { minLength: 1, maxLength: 2 }), fc.constantFrom('isolate', 'follow', 'observe', 'compress', 'reveal', 'confront' as const)).map(
        ([subjectIds, framingIntent]): SceneGraphMutation => ({
          type: 'FocusCameraOn',
          subjectIds,
          framingIntent,
          reason: 'PBT test camera focus',
        })
      )
    );

    // Anchor-dependent mutation
    if (hasAnchors) {
      const anchorIds = sceneGraph.anchors!.map(a => a.id);
      mutations.push(
        fc.tuple(targetActor, fc.constantFrom(...anchorIds)).map(
          ([actorId, anchorId]): SceneGraphMutation => ({
            type: 'MoveActorToAnchor',
            actorId,
            anchorId,
            reason: 'PBT test move to anchor',
          })
        )
      );
    }

    // Relationship mutations (need at least 2 actors)
    if (actorIds.length >= 2) {
      mutations.push(
        fc.tuple(
          fc.constantFrom(...actorIds),
          fc.constantFrom(...actorIds),
          fc.constantFrom('stranger', 'approaching', 'confronting', 'avoiding', 'conversing' as const)
        ).map(
          ([actorAId, actorBId, relType]): SceneGraphMutation => ({
            type: 'AdjustRelationship',
            actorAId,
            actorBId,
            patch: { type: relType },
            reason: 'PBT test relationship adjustment',
          })
        )
      );
    }
  }

  // RestageScene mutation (always available)
  mutations.push(
    fc.constantFrom('preserve_actions', 'tone_composition' as const).map(
      (strategy): SceneGraphMutation => ({
        type: 'RestageScene',
        strategy,
        reason: 'PBT test restage',
      })
    )
  );

  return fc.oneof(...mutations);
}

/**
 * Generate a sequence of N mutations
 */
function arbitraryMutationSequence(
  sceneGraph: SceneGraph,
  count: number
): fc.Arbitrary<SceneGraphMutation[]> {
  return fc.array(arbitraryMutation(sceneGraph), { minLength: count, maxLength: count });
}

describe('L3-4 — Property 5 — Session Structural Validity', () => {
  it(
    'applying 20+ mutations sequentially maintains structural validity after each step (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph(),
          async (initialGraph) => {
            // Ensure we start with a valid graph
            const initialErrors = validateSceneGraphStructure(initialGraph);
            expect(
              initialErrors,
              `Initial graph is invalid: ${initialErrors.join(', ')}`
            ).toEqual([]);

            // Generate a sequence of 20+ mutations
            const mutationsArbitrary = arbitraryMutationSequence(initialGraph, 25);
            const mutations = await fc.sample(mutationsArbitrary, { numRuns: 1 })[0];

            // Apply mutations sequentially and validate after each step
            let currentGraph = initialGraph;
            const appliedMutations: SceneGraphMutation[] = [];

            for (let i = 0; i < mutations.length; i++) {
              const mutation = mutations[i];
              appliedMutations.push(mutation);

              // Apply the mutation
              currentGraph = applyMutation(currentGraph, mutation);

              // Validate structural integrity
              const errors = validateSceneGraphStructure(currentGraph);
              expect(
                errors,
                `After mutation ${i + 1} (${mutation.type}), graph became invalid: ${errors.join(', ')}`
              ).toEqual([]);

              // Validate version counter equals number of mutations applied
              const expectedVersion = initialGraph.version + (i + 1);
              expect(
                currentGraph.version,
                `After ${i + 1} mutations, version should be ${expectedVersion} but was ${currentGraph.version}`
              ).toBe(expectedVersion);

              // Validate all emotion states are recognized
              for (const actor of currentGraph.actors) {
                expect(
                  isValidEmotion(actor.emotionState),
                  `Actor ${actor.id} has invalid emotion state: ${actor.emotionState}`
                ).toBe(true);
              }

              // Validate all entity types are valid
              for (const actor of currentGraph.actors) {
                expect(
                  actor.type,
                  `Actor ${actor.id} has invalid type: ${actor.type}`
                ).toBe('humanoid');
              }
            }

            // Final validation: exactly 25 mutations applied
            expect(appliedMutations.length).toBe(25);
            expect(currentGraph.version).toBe(initialGraph.version + 25);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    120_000
  );

  it(
    'applying varying-length mutation sequences (20-30) maintains structural validity (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph(),
          fc.integer({ min: 20, max: 30 }),
          async (initialGraph, mutationCount) => {
            // Generate a sequence of mutations
            const mutationsArbitrary = arbitraryMutationSequence(initialGraph, mutationCount);
            const mutations = await fc.sample(mutationsArbitrary, { numRuns: 1 })[0];

            // Apply mutations sequentially
            let currentGraph = initialGraph;

            for (const mutation of mutations) {
              currentGraph = applyMutation(currentGraph, mutation);

              // Quick structural check
              expect(currentGraph).toBeDefined();
              expect(Array.isArray(currentGraph.actors)).toBe(true);
              expect(currentGraph.environment).toBeDefined();
              expect(currentGraph.camera).toBeDefined();
            }

            // Final validation
            const errors = validateSceneGraphStructure(currentGraph);
            expect(errors).toEqual([]);
            expect(currentGraph.version).toBe(initialGraph.version + mutationCount);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    120_000
  );
});
