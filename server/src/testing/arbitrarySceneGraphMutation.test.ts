/**
 * server/src/testing/arbitrarySceneGraphMutation.test.ts
 *
 * Tests for arbitrarySceneGraphMutation
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { arbitrarySceneGraph, arbitrarySceneGraphMutation, arbitrarySceneGraphMutationSequence } from './arbitrarySceneGraph.js';
import { applyMutation, type SceneGraphMutation } from '../../../shared/src/mutations.js';

describe('arbitrarySceneGraphMutation', () => {
  it('should generate valid mutations for a scene with actors', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitrarySceneGraph(),
        async (sceneGraph) => {
          // Skip scenes without actors for this test
          if (sceneGraph.actors.length === 0) {
            return true;
          }

          const mutationArbitrary = arbitrarySceneGraphMutation(sceneGraph);
          const mutation = await fc.sample(mutationArbitrary, { numRuns: 1 })[0];

          // Verify the mutation has a valid type
          expect(mutation).toHaveProperty('type');
          expect(typeof mutation.type).toBe('string');

          // Verify actor-referencing mutations use valid actor IDs
          if ('actorId' in mutation) {
            const actorIds = sceneGraph.actors.map(a => a.id);
            expect(actorIds).toContain(mutation.actorId);
          }

          // Apply the mutation to verify it works
          const result = applyMutation(sceneGraph, mutation);
          expect(result).toBeDefined();
          expect(result.version).toBe(sceneGraph.version + 1);

          return true;
        }
      ),
      { numRuns: 50 }
    );
  });

  it('should generate mutations even for empty scenes', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitrarySceneGraph(),
        async (sceneGraph) => {
          const mutationArbitrary = arbitrarySceneGraphMutation(sceneGraph);
          const mutation = await fc.sample(mutationArbitrary, { numRuns: 1 })[0];

          // Should always generate a valid mutation
          expect(mutation).toBeDefined();
          expect(mutation.type).toBeDefined();

          // These mutation types are always available
          const validTypes = ['SetTone', 'AddAtmosphere', 'RestageScene'];
          
          // If no actors, should only generate actor-independent mutations
          if (sceneGraph.actors.length === 0) {
            expect(validTypes).toContain(mutation.type);
          }

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should generate sequences of valid mutations', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitrarySceneGraph(),
        async (sceneGraph) => {
          const sequenceArbitrary = arbitrarySceneGraphMutationSequence(sceneGraph, 5);
          const mutations = await fc.sample(sequenceArbitrary, { numRuns: 1 })[0];

          expect(mutations).toHaveLength(5);

          // Apply all mutations sequentially
          let currentGraph = sceneGraph;
          for (const mutation of mutations) {
            expect(mutation).toHaveProperty('type');
            currentGraph = applyMutation(currentGraph, mutation);
            expect(currentGraph).toBeDefined();
          }

          expect(currentGraph.version).toBe(sceneGraph.version + 5);

          return true;
        }
      ),
      { numRuns: 30 }
    );
  });

  it('should generate FocusCameraOn with valid subject IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        arbitrarySceneGraph(),
        async (sceneGraph) => {
          if (sceneGraph.actors.length === 0) {
            return true;
          }

          // Generate multiple mutations and find a FocusCameraOn if possible
          const mutationArbitrary = arbitrarySceneGraphMutation(sceneGraph);
          const samples = await fc.sample(mutationArbitrary, { numRuns: 20 });

          const focusMutations = samples.filter(
            (m): m is Extract<SceneGraphMutation, { type: 'FocusCameraOn' }> =>
              m.type === 'FocusCameraOn'
          );

          // Verify any FocusCameraOn mutations have valid subject IDs
          const actorIds = sceneGraph.actors.map(a => a.id);
          for (const mutation of focusMutations) {
            for (const subjectId of mutation.subjectIds) {
              expect(actorIds).toContain(subjectId);
            }
          }

          return true;
        }
      ),
      { numRuns: 20 }
    );
  });
});
