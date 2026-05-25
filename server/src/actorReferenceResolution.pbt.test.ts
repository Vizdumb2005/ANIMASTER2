/**
 * server/src/actorReferenceResolution.pbt.test.ts
 *
 * L2-7 — PBT — Property 4 (Actor Reference Resolution)
 *
 * For any SceneGraph with N actors and any reference string,
 * the resolver returns exactly one ID present in the graph, or a typed
 * failure — never an ID not in the graph.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { resolveActorReference, type ActorIDResolutionResult } from './ai/sceneGraph/sceneGraphIntelligence.js';
import { arbitrarySceneGraph } from './testing/arbitrarySceneGraph.js';
import { arbitraryActorReference } from './testing/arbitraryActorReference.js';

describe('L2-7 — Property 4 — Actor Reference Resolution', () => {
  // Sub-property A: For any SceneGraph with actors and any reference string,
  // the resolver returns exactly one ID present in the graph, or a typed failure
  it(
    'resolveActorReference() returns valid actorId or typed failure, never an ID not in the graph (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            arbitrarySceneGraph(),
            arbitraryActorReference()
          ),
          async ([sceneGraph, description]) => {
            // Run the resolver
            const result = resolveActorReference(description, sceneGraph);
            
            // Extract actor IDs from the scene graph for verification
            const actorIds = sceneGraph.actors ? sceneGraph.actors.map(a => a.id) : [];
            
            // Property: result must be valid ActorIDResolutionResult
            // Check if result has ok: true
            if (result.ok === true) {
              // When ok is true, actorId must be defined and must be in the graph
              expect(result.actorId).toBeDefined();
              expect(typeof result.actorId).toBe('string');
              expect(result.actorId.length).toBeGreaterThan(0);
              
              // THE KEY PROPERTY: actorId MUST be present in the graph
              expect(actorIds).toContain(result.actorId);
            } else {
              // When ok is false, must have typed error
              expect(result.ok).toBe(false);
              expect(result.error).toBeDefined();
              expect(typeof result.error).toBe('object');
              expect(result.error.reason).toBeDefined();
              expect(typeof result.error.reason).toBe('string');
              expect(result.error.message).toBeDefined();
              expect(typeof result.error.message).toBe('string');
              
              // Verify it's a known error reason
              const validReasons = ['NO_MATCH', 'AMBIGUOUS', 'EMPTY_SCENE', 'INVALID_CRITERIA'];
              expect(validReasons).toContain(result.error.reason);
            }
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    120_000,
  );

  // Sub-property B: For empty scene graphs, always returns typed failure
  it(
    'resolveActorReference() with empty scene graph always returns EMPTY_SCENE error (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitraryActorReference(),
          async (description) => {
            const emptySceneGraph = {
              id: 'test',
              version: 1,
              actors: [],
              environment: { type: 'room', backgroundColor: '#000000', floorColor: '#000000', wallColor: '#000000', width: 100, height: 100 },
              camera: { x: 0, y: 0, zoom: 1, mode: 'static' },
              sessionHistory: [],
              cinematicGrammar: { tone: 'neutral', template: { cameraMode: 'static', spacingMultiplier: 1, motionEnergyScale: 1, pauseFrequency: 0.5, contrastBoost: 1, headroom: 0.5 } },
              atmosphere: { effects: [], lightingTint: '#000000', ambientIntensity: 0.5 },
              rhythm: { tempo: 'medium', pauseFrequencyPerMinute: 10, motionEnergyCurve: 'linear' }
            };
            
            const result = resolveActorReference(description, emptySceneGraph);
            
            expect(result.ok).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error.reason).toBe('EMPTY_SCENE');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000,
  );

  // Sub-property C: For valid references to existing actors, returns ok: true with correct ID
  it(
    'resolveActorReference() with valid actor ID returns ok: true and correct actorId (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph().filter(sg => sg.actors.length > 0),
          async (sceneGraph) => {
            // Pick a random actor from the graph
            const actorIndex = Math.floor(Math.random() * sceneGraph.actors.length);
            const targetActor = sceneGraph.actors[actorIndex];
            
            // Use the actor's ID as the reference
            const result = resolveActorReference(targetActor.id, sceneGraph);
            
            expect(result.ok).toBe(true);
            expect(result.actorId).toBe(targetActor.id);
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000,
  );

  // Sub-property D: For invalid/empty descriptions with non-empty graph, returns typed failure
  it(
    'resolveActorReference() with empty description returns INVALID_CRITERIA error (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          arbitrarySceneGraph().filter(sg => sg.actors.length > 0),
          async (sceneGraph) => {
            const result = resolveActorReference('', sceneGraph);
            
            expect(result.ok).toBe(false);
            expect(result.error).toBeDefined();
            expect(result.error.reason).toBe('INVALID_CRITERIA');
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000,
  );

  // Sub-property E: Never throws for any input
  it(
    'resolveActorReference() never throws for any input (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.tuple(
            arbitrarySceneGraph(),
            arbitraryActorReference()
          ),
          async ([sceneGraph, description]) => {
            expect(() => resolveActorReference(description, sceneGraph)).not.toThrow();
            return true;
          }
        ),
        { numRuns: 100 }
      );
    },
    60_000,
  );
});
