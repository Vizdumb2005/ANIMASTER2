/**
 * server/src/specParserErrors.pbt.test.ts
 *
 * Property 21 — Spec Parser Error Handling
 *
 * For any malformed YAML, out-of-range value, or undefined reference —
 * `parse()` returns `{ ok: false }` with a non-empty error array.
 * Never throws. Never returns `{ ok: true }` for invalid input.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { SpecParser } from '../../shared/src/specParser.js';
import { isErr, isOk } from '../../shared/src/result.js';
import {
  arbitraryMalformedYaml,
  arbitraryOutOfRangeOrMissingYaml,
  arbitraryUndefinedReferenceYaml,
} from './testing/arbitraryInvalidInput.js';

describe('Property 21 — Spec Parser Error Handling', () => {
  // Sub-property A: never throws for ANY string input
  it(
    'parse() never throws for any string input (100 runs)',
    () => {
      fc.assert(
        fc.property(fc.string(), input => {
          expect(() => SpecParser.parse(input)).not.toThrow();
          return true;
        }),
        { numRuns: 100 },
      );
    },
    30_000,
  );

  // Sub-property B: malformed YAML always produces error and never returns ok: true
  it(
    'malformed YAML always produces ok: false and a non-empty error array (100 runs)',
    () => {
      fc.assert(
        fc.property(arbitraryMalformedYaml(), yaml => {
          const result = SpecParser.parse(yaml);
          expect(isOk(result)).toBe(false);
          expect(isErr(result)).toBe(true);
          if (isErr(result)) {
            expect(result.error.length).toBeGreaterThan(0);
          }
          return true;
        }),
        { numRuns: 100 },
      );
    },
    30_000,
  );

  // Sub-property C: out-of-range/missing values always produce error and never returns ok: true
  it(
    'out-of-range/missing values always produce ok: false and a non-empty error array (100 runs)',
    () => {
      fc.assert(
        fc.property(arbitraryOutOfRangeOrMissingYaml(), yaml => {
          const result = SpecParser.parse(yaml);
          expect(isOk(result)).toBe(false);
          expect(isErr(result)).toBe(true);
          if (isErr(result)) {
            expect(result.error.length).toBeGreaterThan(0);
          }
          return true;
        }),
        { numRuns: 100 },
      );
    },
    30_000,
  );

  // Sub-property D: undefined references always produce error and never returns ok: true
  it(
    'undefined references always produce ok: false and a non-empty error array (100 runs)',
    () => {
      fc.assert(
        fc.property(arbitraryUndefinedReferenceYaml(), yaml => {
          const result = SpecParser.parse(yaml);
          expect(isOk(result)).toBe(false);
          expect(isErr(result)).toBe(true);
          if (isErr(result)) {
            expect(result.error.length).toBeGreaterThan(0);
            const hasUndefinedRefError = result.error.some(
              e => e.code === 'UNDEFINED_REFERENCE',
            );
            expect(hasUndefinedRefError).toBe(true);
          }
          return true;
        }),
        { numRuns: 100 },
      );
    },
    30_000,
  );

  // Sub-property E: all generated errors conform to structured ParseError shape
  it(
    'all errors have well-formed ParseError shape (100 runs)',
    () => {
      const VALID_CODES = [
        'SYNTAX_ERROR',
        'MISSING_REQUIRED',
        'OUT_OF_RANGE',
        'UNDEFINED_REFERENCE',
      ];
      fc.assert(
        fc.property(
          fc.oneof(
            arbitraryMalformedYaml(),
            arbitraryOutOfRangeOrMissingYaml(),
            arbitraryUndefinedReferenceYaml(),
          ),
          yaml => {
            const result = SpecParser.parse(yaml);
            expect(isOk(result)).toBe(false);
            if (isErr(result)) {
              for (const e of result.error) {
                expect(VALID_CODES).toContain(e.code);
                expect(e.location).toBeDefined();
                expect(typeof e.location.line).toBe('number');
                expect(typeof e.location.column).toBe('number');
                expect(typeof e.message).toBe('string');
                expect(e.message.length).toBeGreaterThan(0);
                if (e.context !== undefined) {
                  expect(typeof e.context).toBe('string');
                  expect(e.context.length).toBeGreaterThan(0);
                }
              }
            }
            return true;
          },
        ),
        { numRuns: 100 },
      );
    },
    30_000,
  );
});
