/**
 * server/src/testing/arbitraryIntentPrompt.ts
 *
 * Custom fast-check arbitrary that generates a wide variety of intent prompts
 * including edge cases for property-based testing of interpret() liveness.
 */

import * as fc from 'fast-check';

/**
 * Generates arbitrary intent prompts including:
 * - Normal prompts
 * - Empty strings
 * - Whitespace-only strings
 * - Very long strings
 * - Unicode/emoji strings
 * - Special characters
 * - Nonsense strings
 * - Edge case strings
 */
export function arbitraryIntentPrompt(): fc.Arbitrary<string> {
  // Normal prompts - typical user input
  const normalPrompts = fc.oneof(
    fc.constant('A character sits alone in a dark room'),
    fc.constant('Two people argue in a park'),
    fc.constant('A happy couple walks along the beach'),
    fc.constant('A nervous man waits for news'),
    fc.constant('An angry confrontation at the office'),
    fc.constant('Children play in a sunny meadow'),
    fc.constant('A detective examines a crime scene'),
    fc.constant('A romantic dinner by candlelight'),
    fc.constant('A tense standoff in an alley'),
    fc.constant('A group of friends laughs together'),
  );

  // Emoji and unicode prompts
  const emojiPrompts = fc.oneof(
    fc.constant('🎭👾🔥✨🎬'),
    fc.constant('😢😠😊😨😓'),
    fc.constant('🏖️🌳🏙️🏡🚗'),
    fc.constant('A 🎭 sad character in a 🏰 castle'),
    fc.constant('👨‍👩‍👧‍👦 family 🏠 home'),
  );

  // Structured prompts with directing context
  const structuredPrompts = fc.oneof(
    fc.stringMatching(/^[a-zA-Z\s]{10,100}$/).map(s => `Scene: ${s}`),
    fc.stringMatching(/^[a-zA-Z\s]+\sand\s[a-zA-Z\s]+$/).map(s => `Create: ${s}`),
    fc.stringMatching(/^[a-zA-Z\s]+\sin\s[a-zA-Z\s]+$/).map(s => `Show: ${s}`),
  );

  // Edge case strings
  const edgeCases = fc.oneof(
    // Empty and whitespace
    fc.constant(''),
    fc.constant('   '),
    fc.constant('\n'),
    fc.constant('\t'),
    fc.constant('\r\n'),
    // Very long strings
    fc.stringMatching(/^[a-z\s]+$/).map(s => s.repeat(100)),
    fc.string({ minLength: 2000, maxLength: 2000 }),
    // Special characters
    fc.stringMatching(/^[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+$/),
    fc.stringMatching(/^[\x00-\x1F\x7F]+$/), // Control characters
    // Nonsense/garbled
    fc.stringMatching(/^[asdfghjkl]+$/).map(s => s.repeat(50)),
    fc.string({ minLength: 50, maxLength: 50 }),
    // Mixed case
    fc.stringMatching(/^[A-Z\s]+$/).map(s => s.substring(0, 50)),
    fc.stringMatching(/^[0-9\s]+$/).map(s => s.substring(0, 50)),
    // Repeated characters
    fc.constant('aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'),
    fc.constant('bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb'),
    // Strings with only punctuation
    fc.constant('!!!!!!!!!!!!'),
    fc.constant('????????????'),
    fc.constant('..........'),
    // Unicode edge cases
    fc.constant('\u0000\u0001\u0002'), // Null characters
    fc.constant('\uFFFF\uFFFE\uFFFD'), // Special unicode
    fc.constant('𝕳𝖊𝖑𝖑𝖔 𝕲𝖔𝖗𝖑𝖉'), // Mathematical alphanumeric
    // Real-world edge cases
    fc.constant('A'),
    fc.constant('x'),
    fc.constant('The'),
    fc.constant('end'),
  );

  // Combine all categories with weights to ensure good coverage
  return fc.oneof(
    { arbitrary: normalPrompts, weight: 3 },
    { arbitrary: emojiPrompts, weight: 2 },
    { arbitrary: structuredPrompts, weight: 2 },
    { arbitrary: edgeCases, weight: 3 },
  );
}
