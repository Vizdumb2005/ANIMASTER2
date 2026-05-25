/**
 * server/src/testing/arbitraryActorReference.ts
 *
 * Custom fast-check arbitrary for generating diverse actor reference strings
 * for property-based testing of resolveActorReference().
 *
 * Includes:
 * - Normal actor descriptions (by ID, label, emotion)
 * - Spatial references (left, right, middle, center)
 * - Edge cases (empty, whitespace, special chars, unicode, very long)
 * - Partial matches and ambiguous references
 */

import * as fc from 'fast-check';

/**
 * Generates diverse actor reference strings for PBT.
 * Categories:
 * 1. Valid actor IDs (matching safeId pattern)
 * 2. Valid actor labels (matching safeLabel pattern)
 * 3. Spatial references (left, right, middle/center)
 * 4. Emotion-based references
 * 5. Partial/fuzzy matches
 * 6. Combined descriptors
 * 7. Edge cases: empty, whitespace, special characters, unicode, very long strings
 */
export function arbitraryActorReference(): fc.Arbitrary<string> {
  const VALID_EMOTIONS = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];
  
  // Category 1: Normal actor IDs (matching safeId pattern)
  const actorIds = fc.stringMatching(/^[a-z][a-z0-9_]{3,11}$/);
  
  // Category 2: Normal actor labels (matching safeLabel pattern)
  const actorLabels = fc.stringMatching(/^[a-z]{4,20}$/);
  
  // Category 3: Spatial references
  const spatialReferences = fc.constantFrom(
    'left',
    'right', 
    'leftmost',
    'rightmost',
    'middle',
    'center',
    'the left character',
    'the right character',
    'middle character',
    'center character'
  );
  
  // Category 4: Emotion-based references
  const emotionReferences = fc.constantFrom(
    ...VALID_EMOTIONS.flatMap(e => [
      `the ${e} one`,
      `${e} character`,
      `actor with ${e}`
    ])
  );
  
  // Category 5: Partial/fuzzy matches
  const partialMatches = fc.stringMatching(/^[a-z0-9_]{2,8}$/).map(s => 
    `actor ${s}`
  );
  
  // Category 6: Combined descriptors
  const combinedDescriptors = fc.tuple(
    fc.constantFrom('the', 'a', 'an', ''),
    fc.constantFrom('left', 'right', 'middle', 'center'),
    fc.constantFrom('actor', 'character', 'person', 'figure')
  ).map(([article, position, noun]) => {
    const parts = [article, position, noun].filter(p => p !== '');
    return parts.join(' ');
  });
  
  // Category 7: Edge cases
  const edgeCases = fc.oneof(
    // Empty and whitespace
    fc.constant(''),
    fc.constant(' '),
    fc.constant('  '),
    fc.constant('\t'),
    fc.constant('\n'),
    
    // Special characters
    fc.stringMatching(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]+$/),
    
    // Unicode/emoji
    fc.stringMatching(/^[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}]+$/u),
    
    // Very long strings
    fc.string({ minLength: 1000, maxLength: 2000 }),
    
    // Nonsense strings
    fc.stringMatching(/^[asdfghjklASDFGHJKL]{20,50}$/),
    
    // Repeated characters
    fc.constantFrom('aaaaaaaaaa', 'bbbbbbbbbb', 'cccccccccc', '1111111111', '__________'),
    
    // Single characters
    fc.constantFrom('a', 'b', 'c', '1', '2', '3', '_', '-'),
    
    // Numbers only
    fc.stringMatching(/^\d{5,20}$/)
  );
  
  // Combine all categories with appropriate weights
  return fc.oneof(
    { arbitrary: actorIds, weight: 20 },
    { arbitrary: actorLabels, weight: 20 },
    { arbitrary: spatialReferences, weight: 15 },
    { arbitrary: emotionReferences, weight: 15 },
    { arbitrary: partialMatches, weight: 10 },
    { arbitrary: combinedDescriptors, weight: 10 },
    { arbitrary: edgeCases, weight: 10 }
  );
}
