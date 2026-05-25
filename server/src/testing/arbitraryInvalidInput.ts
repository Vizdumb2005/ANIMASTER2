/**
 * server/src/testing/arbitraryInvalidInput.ts
 *
 * Custom fast-check arbitraries that produce invalid YAML inputs for testing
 * SpecParser error handling.
 */

import * as fc from 'fast-check';
import { SpecPrinter } from '../../../shared/src/specPrinter.js';
import { arbitrarySceneGraph } from './arbitrarySceneGraph.js';

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
export function arbitraryOutOfRangeOrMissingYaml(): fc.Arbitrary<string> {
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

/**
 * Generates structurally valid YAML strings but containing actor ID references
 * in relationships that are undefined in the actors list.
 */
export function arbitraryUndefinedReferenceYaml(): fc.Arbitrary<string> {
  return arbitrarySceneGraph().chain(graph => {
    const mutated = JSON.parse(JSON.stringify(graph));
    // Clear relationships and push one with undefined actor references
    mutated.relationships = [
      {
        actorAId: 'non_existent_actor_a',
        actorBId: 'non_existent_actor_b',
        type: 'stranger',
        awarenessRadius: 100,
        gazeTarget: 'non_existent_actor_c',
        emotionalReaction: null,
      },
    ];
    return fc.constant(SpecPrinter.print(mutated as any));
  });
}
