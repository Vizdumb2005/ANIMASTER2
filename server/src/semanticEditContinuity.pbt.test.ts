/**
 * server/src/semanticEditContinuity.pbt.test.ts
 *
 * L3-3 — PBT — Property 3 (Semantic Edit Continuity)
 *
 * For any SceneGraph with N actors and a mutation targeting exactly one actor,
 * applying the mutation leaves all other actors, the Environment, and CameraState
 * structurally unchanged.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arbitrarySceneGraph } from './testing/arbitrarySceneGraph.js';
import {
  applyMutation,
  type SetActorEmotionMutation,
  type QueueActorActionMutation,
  type MoveActorToAnchorMutation,
  type SceneGraphMutation,
} from '../../shared/src/mutations.js';
import type { SceneGraph, Actor, Environment, Camera } from '../../shared/src/scene.js';

/**
 * Deep equality check for objects
 */
function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  const aObj = a as Record<string, unknown>;
  const bObj = b as Record<string, unknown>;
  const aKeys = Object.keys(aObj);
  const bKeys = Object.keys(bObj);

  if (aKeys.length !== bKeys.length) return false;

  for (const key of aKeys) {
    if (!bKeys.includes(key)) return false;
    if (!deepEqual(aObj[key], bObj[key])) return false;
  }

  return true;
}

/**
 * Check if two actors are structurally equal (excluding the target actor's mutable fields)
 */
function actorsEqual(a: Actor, b: Actor): boolean {
  return (
    a.id === b.id &&
    a.label === b.label &&
    a.type === b.type &&
    deepEqual(a.position, b.position) &&
    deepEqual(a.targetPosition, b.targetPosition) &&
    a.emotionState === b.emotionState &&
    a.currentAction === b.currentAction &&
    deepEqual(a.actionQueue, b.actionQueue) &&
    deepEqual(a.joints, b.joints)
  );
}

/**
 * Check if environment is structurally unchanged
 */
function environmentEqual(a: Environment, b: Environment): boolean {
  return (
    a.type === b.type &&
    a.backgroundColor === b.backgroundColor &&
    a.floorColor === b.floorColor &&
    a.wallColor === b.wallColor &&
    a.width === b.width &&
    a.height === b.height
  );
}

/**
 * Check if camera is structurally unchanged
 */
function cameraEqual(a: Camera, b: Camera): boolean {
  return (
    a.x === b.x &&
    a.y === b.y &&
    a.zoom === b.zoom &&
    a.mode === b.mode
  );
}

/**
 * Generate a mutation targeting exactly one actor
 */
function arbitrarySingleActorMutation(
  sceneGraph: SceneGraph
): fc.Arbitrary<SceneGraphMutation> {
  if (sceneGraph.actors.length === 0) {
    // No actors to target - return SetTone mutation instead
    return fc.constant({
      type: 'SetTone' as const,
      tone: 'tense',
      reason: 'PBT test mutation',
    });
  }

  const targetActor = fc.constantFrom(...sceneGraph.actors);

  return fc.oneof(
    // SetActorEmotion mutation
    fc.tuple(targetActor, fc.constantFrom('happy', 'sad', 'angry', 'nervous' as const)).map(
      ([actor, emotion]): SetActorEmotionMutation => ({
        type: 'SetActorEmotion',
        actorId: actor.id,
        emotion,
        intensity: 0.8,
        reason: 'PBT test emotion change',
      })
    ),
    // QueueActorAction mutation
    fc.tuple(targetActor, fc.constantFrom('idle', 'walking', 'sitting' as const)).map(
      ([actor, action]): QueueActorActionMutation => ({
        type: 'QueueActorAction',
        actorId: actor.id,
        action,
        reason: 'PBT test action queue',
      })
    )
  );
}

describe('L3-3 — Property 3 — Semantic Edit Continuity', () => {
  it(
    'mutation targeting one actor leaves other actors, Environment, and Camera unchanged (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph(),
          async (sceneGraph) => {
            // Skip scenes with no actors for this specific test
            if (sceneGraph.actors.length === 0) {
              return true;
            }

            // Generate a mutation targeting exactly one actor
            const mutationArbitrary = arbitrarySingleActorMutation(sceneGraph);
            const mutation = await fc.sample(mutationArbitrary, { numRuns: 1 })[0];

            // Skip non-actor-targeting mutations for this test
            if (mutation.type !== 'SetActorEmotion' && mutation.type !== 'QueueActorAction') {
              return true;
            }

            // Get the target actor ID
            const targetActorId =
              mutation.type === 'SetActorEmotion' || mutation.type === 'QueueActorAction'
                ? mutation.actorId
                : null;

            if (!targetActorId) {
              return true;
            }

            // Store original state
            const originalActors = new Map(sceneGraph.actors.map(a => [a.id, a]));
            const originalEnvironment = { ...sceneGraph.environment };
            const originalCamera = { ...sceneGraph.camera };

            // Apply mutation
            const mutatedGraph = applyMutation(sceneGraph, mutation);

            // PROPERTY 1: All non-target actors must be unchanged
            for (const actor of mutatedGraph.actors) {
              if (actor.id !== targetActorId) {
                const originalActor = originalActors.get(actor.id);
                expect(
                  actorsEqual(actor, originalActor!),
                  `Non-target actor ${actor.id} was modified by mutation targeting ${targetActorId}`
                ).toBe(true);
              }
            }

            // PROPERTY 2: Environment must be unchanged
            expect(
              environmentEqual(mutatedGraph.environment, originalEnvironment),
              'Environment was modified by actor-targeting mutation'
            ).toBe(true);

            // PROPERTY 3: Camera must be unchanged (for actor-targeting mutations)
            expect(
              cameraEqual(mutatedGraph.camera, originalCamera),
              'Camera was modified by actor-targeting mutation'
            ).toBe(true);

            // PROPERTY 4: Version must be incremented
            expect(mutatedGraph.version).toBe(sceneGraph.version + 1);

            // PROPERTY 5: Target actor must be modified
            const targetActorBefore = originalActors.get(targetActorId);
            const targetActorAfter = mutatedGraph.actors.find(a => a.id === targetActorId);
            expect(targetActorAfter).toBeDefined();

            // Target actor should be different after mutation
            if (mutation.type === 'SetActorEmotion') {
              expect(targetActorAfter!.emotionState).toBe(mutation.emotion);
            } else if (mutation.type === 'QueueActorAction') {
              expect(targetActorAfter!.actionQueue).toContain(mutation.action);
            }

            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000
  );

  it(
    'SetTone mutation changes only cinematic grammar, not actors/environment/camera (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph(),
          fc.constantFrom('neutral', 'sad', 'tense', 'lonely', 'romantic' as const),
          async (sceneGraph, newTone) => {
            // Store original state
            const originalActors = sceneGraph.actors.map(a => ({ ...a }));
            const originalEnvironment = { ...sceneGraph.environment };
            const originalCamera = { ...sceneGraph.camera };

            // Apply SetTone mutation
            const mutation: SceneGraphMutation = {
              type: 'SetTone',
              tone: newTone,
              reason: 'PBT test tone change',
            };

            const mutatedGraph = applyMutation(sceneGraph, mutation);

            // PROPERTY 1: All actors must be unchanged
            expect(mutatedGraph.actors.length).toBe(originalActors.length);
            for (let i = 0; i < mutatedGraph.actors.length; i++) {
              expect(
                actorsEqual(mutatedGraph.actors[i], originalActors[i]),
                `Actor ${mutatedGraph.actors[i].id} was modified by SetTone mutation`
              ).toBe(true);
            }

            // PROPERTY 2: Environment must be unchanged
            expect(
              environmentEqual(mutatedGraph.environment, originalEnvironment),
              'Environment was modified by SetTone mutation'
            ).toBe(true);

            // PROPERTY 3: Camera must be unchanged
            expect(
              cameraEqual(mutatedGraph.camera, originalCamera),
              'Camera was modified by SetTone mutation'
            ).toBe(true);

            // PROPERTY 4: Tone must be updated
            expect(mutatedGraph.cinematicGrammar.tone).toBe(newTone);

            // PROPERTY 5: Version must be incremented
            expect(mutatedGraph.version).toBe(sceneGraph.version + 1);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000
  );

  it(
    'AddAtmosphere mutation changes only atmosphere, not actors/environment/camera (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph(),
          fc.constantFrom('rain', 'fog', 'snow', 'dust' as const),
          async (sceneGraph, effect) => {
            // Store original state
            const originalActors = sceneGraph.actors.map(a => ({ ...a }));
            const originalEnvironment = { ...sceneGraph.environment };
            const originalCamera = { ...sceneGraph.camera };
            const originalEffects = [...(sceneGraph.atmosphere?.effects || [])];

            // Apply AddAtmosphere mutation
            const mutation: SceneGraphMutation = {
              type: 'AddAtmosphere',
              effect,
              reason: 'PBT test atmosphere change',
            };

            const mutatedGraph = applyMutation(sceneGraph, mutation);

            // PROPERTY 1: All actors must be unchanged
            expect(mutatedGraph.actors.length).toBe(originalActors.length);
            for (let i = 0; i < mutatedGraph.actors.length; i++) {
              expect(
                actorsEqual(mutatedGraph.actors[i], originalActors[i]),
                `Actor ${mutatedGraph.actors[i].id} was modified by AddAtmosphere mutation`
              ).toBe(true);
            }

            // PROPERTY 2: Environment must be unchanged
            expect(
              environmentEqual(mutatedGraph.environment, originalEnvironment),
              'Environment was modified by AddAtmosphere mutation'
            ).toBe(true);

            // PROPERTY 3: Camera must be unchanged
            expect(
              cameraEqual(mutatedGraph.camera, originalCamera),
              'Camera was modified by AddAtmosphere mutation'
            ).toBe(true);

            // PROPERTY 4: Effect must be added
            expect(mutatedGraph.atmosphere.effects).toContain(effect);

            // PROPERTY 5: Version must be incremented
            expect(mutatedGraph.version).toBe(sceneGraph.version + 1);

            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000
  );
});
