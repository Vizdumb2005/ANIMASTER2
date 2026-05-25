/**
 * server/src/interpretLiveness.pbt.test.ts
 *
 * Property 2 (Intent Interpreter Liveness): For any string input,
 * `interpretPrompt()` resolves (never rejects) and returns a SceneGraphResponse
 * (never throws).
 * 
 * This is L2-6 in the test matrix.
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import { interpretPrompt } from './routes/interpret.js';
import { arbitraryIntentPrompt } from './testing/arbitraryIntentPrompt.js';

describe('L2-6: Property 2 — Intent Interpreter Liveness', () => {
  // Main property: interpretPrompt never throws for any string input
  it(
    'interpretPrompt() resolves and returns SceneGraphResponse for any string input (100 iterations)',
    async () => {
      await fc.assert(
        fc.asyncProperty(arbitraryIntentPrompt(), async (prompt) => {
          // This should never throw or reject
          const result = await interpretPrompt(prompt);
          
          // Verify basic structure exists
          if (result === undefined || result === null) {
            throw new Error(`Result is undefined/null for prompt: ${JSON.stringify(prompt)}`);
          }
          
          if (!result.id || !result.version || !result.actors || !result.environment || !result.camera ||
              !result.sessionHistory || !result.cinematicGrammar || !result.atmosphere || !result.rhythm) {
            throw new Error(`Missing required fields for prompt: ${JSON.stringify(prompt)}`);
          }
          
          // Verify actors array is not empty
          if (!Array.isArray(result.actors)) {
            throw new Error(`actors is not an array for prompt: ${JSON.stringify(prompt)}`);
          }
          
          if (result.actors.length < 1) {
            throw new Error(`actors is empty for prompt: ${JSON.stringify(prompt)}`);
          }
          
          // Verify environment and camera are present
          if (typeof result.environment !== 'object') {
            throw new Error(`environment is not an object for prompt: ${JSON.stringify(prompt)}`);
          }
          
          if (typeof result.camera !== 'object') {
            throw new Error(`camera is not an object for prompt: ${JSON.stringify(prompt)}`);
          }
          
          return true;
        }),
        { numRuns: 100 },
      );
    },
    120_000, // 2 minutes timeout for 100 iterations
  );

  // Additional property: verify with fc.string() directly for maximum coverage
  it(
    'interpretPrompt() never throws for any arbitrary string (100 runs)',
    async () => {
      await fc.assert(
        fc.asyncProperty(fc.string(), async (prompt) => {
          const result = await interpretPrompt(prompt);
          
          if (result === undefined || result === null) {
            throw new Error(`Result is undefined/null for prompt: ${JSON.stringify(prompt)}`);
          }
          
          if (!Array.isArray(result.actors) || result.actors.length < 1) {
            throw new Error(`Invalid actors for prompt: ${JSON.stringify(prompt)}`);
          }
          
          if (typeof result.environment !== 'object') {
            throw new Error(`environment is not an object for prompt: ${JSON.stringify(prompt)}`);
          }
          
          return true;
        }),
        { numRuns: 100 },
      );
    },
    120_000,
  );
});
