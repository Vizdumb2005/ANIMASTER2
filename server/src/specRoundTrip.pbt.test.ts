/**
 * specRoundTrip.pbt.test.ts
 *
 * Property 20 — Spec Round-Trip
 *
 * For any valid SceneGraph `g`:
 *   parse(print(g)).ok === true  AND  deepEqual(parse(print(g)).value, g)
 *
 * This property pins the contract between SpecPrinter and SpecParser:
 * whatever the printer emits the parser must accept and reconstruct exactly.
 *
 * 100 random graphs are tested per run (numRuns: 100).
 */
import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { SpecParser } from '../../shared/src/specParser.js';
import { SpecPrinter } from '../../shared/src/specPrinter.js';
import { isOk } from '../../shared/src/result.js';
import { arbitrarySceneGraph } from './testing/arbitrarySceneGraph.js';

// ---------------------------------------------------------------------------
// Deep equality helper
//
// We use a hand-rolled deepEqual rather than JSON.stringify comparison so that
// we can give an actionable failure message that identifies the exact field
// that diverged, and because JSON.stringify's key ordering is insertion-order
// dependent whereas the printer sorts keys canonically.
// ---------------------------------------------------------------------------

function deepEqual(a: unknown, b: unknown, path = ''): true | string {
  if (a === b) return true;

  if (a === null || b === null) {
    return `${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`;
  }

  if (typeof a !== typeof b) {
    return `${path}: type mismatch (${typeof a} vs ${typeof b})`;
  }

  if (typeof a === 'number' && typeof b === 'number') {
    // Treat -0 === 0 (YAML doesn't preserve -0)
    if (Object.is(a, -0) && Object.is(b, 0)) return true;
    if (Object.is(a, 0) && Object.is(b, -0)) return true;
    if (a !== b) return `${path}: ${a} !== ${b}`;
    return true;
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) {
      return `${path}: array length ${a.length} !== ${b.length}`;
    }
    for (let i = 0; i < a.length; i++) {
      const r = deepEqual(a[i], b[i], `${path}[${i}]`);
      if (r !== true) return r;
    }
    return true;
  }

  if (Array.isArray(a) !== Array.isArray(b)) {
    return `${path}: one is array, other is not`;
  }

  if (typeof a === 'object' && typeof b === 'object') {
    const aObj = a as Record<string, unknown>;
    const bObj = b as Record<string, unknown>;
    const aKeys = Object.keys(aObj).sort();
    const bKeys = Object.keys(bObj).sort();

    // Only compare keys that are present in `a` (the original graph).
    // The parser may add undefined optional fields that were absent in `a`.
    for (const key of aKeys) {
      if (!(key in bObj)) {
        return `${path}.${key}: missing in parsed result`;
      }
      const r = deepEqual(aObj[key], bObj[key], `${path}.${key}`);
      if (r !== true) return r;
    }

    // Check for keys in parsed result that were not in original graph
    // (parser should not invent new required-field data).
    for (const key of bKeys) {
      if (!(key in aObj) && bObj[key] !== undefined) {
        return `${path}.${key}: unexpected key in parsed result`;
      }
    }

    return true;
  }

  return `${path}: ${JSON.stringify(a)} !== ${JSON.stringify(b)}`;
}

// ---------------------------------------------------------------------------
// Property 20: round-trip
// ---------------------------------------------------------------------------

describe('Property 20 — Spec Round-Trip', () => {
  it(
    'print(graph) → parse → deep-equal original (100 runs)',
    () => {
      fc.assert(
        fc.property(arbitrarySceneGraph(), graph => {
          // Step 1: serialize
          const yaml = SpecPrinter.print(graph);

          // Step 2: parse
          const r = SpecParser.parse(yaml);

          // Step 3: parse must succeed
          if (!isOk(r)) {
            const errors = r.error
              .map(e => `[${e.code}] ${e.context ?? ''}: ${e.message}`)
              .join('\n  ');
            throw new Error(
              `Parser rejected output from SpecPrinter:\n  ${errors}\n\nYAML was:\n${yaml}`,
            );
          }

          // Step 4: deep-equal
          const eqResult = deepEqual(graph, r.value, 'root');
          if (eqResult !== true) {
            throw new Error(
              `Round-trip produced inequal graph at ${eqResult}\n\nOriginal:\n${JSON.stringify(graph, null, 2)}\n\nParsed:\n${JSON.stringify(r.value, null, 2)}\n\nYAML:\n${yaml}`,
            );
          }

          return true;
        }),
        {
          numRuns: 100,
          verbose: true,
        },
      );
    },
    30_000, // ms — generous budget for 100 runs through the YAML parse/print cycle
  );
});
