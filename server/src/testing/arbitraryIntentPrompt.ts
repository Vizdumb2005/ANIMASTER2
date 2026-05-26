/**
 * server/src/testing/arbitraryIntentPrompt.ts
 *
 * L2-8 — PBT — Arbitrary Intent Prompt Generator
 *
 * Generates strings from well-formed scene descriptions to empty strings to random Unicode.
 * This arbitrary provides comprehensive coverage for property-based testing of the
 * intent interpreter, ensuring it handles the full spectrum of possible inputs:
 *
 * - Well-formed scene descriptions: Valid, meaningful cinematic prompts
 * - Empty strings: The minimal edge case
 * - Random Unicode: Maximum entropy, including emoji, control chars, and non-Latin scripts
 */

import * as fc from 'fast-check';

/**
 * Generates arbitrary intent prompts covering the full spectrum:
 * 1. Well-formed scene descriptions (valid cinematic prompts)
 * 2. Empty strings (minimal case)
 * 3. Random Unicode (maximum entropy case)
 */
export function arbitraryIntentPrompt(): fc.Arbitrary<string> {
  // 1. Well-formed scene descriptions - valid cinematic prompts that the interpreter should handle gracefully
  const wellFormedSceneDescriptions = fc.oneof(
    // Single actor scenes
    fc.constant('A lonely man sits on a park bench at dusk'),
    fc.constant('A nervous woman paces in a hospital waiting room'),
    fc.constant('A happy child plays in a sunny meadow'),
    fc.constant('An angry man yells at the sky in the rain'),
    fc.constant('A sad woman stares out a window on a rainy day'),
    fc.constant('A tired man collapses onto his bed after work'),
    fc.constant('An excited couple embraces at an airport arrival gate'),
    fc.constant('An awkward teenager stands alone at a school dance'),
    // Multi-actor scenes
    fc.constant('Two friends walk and talk along a beach at sunset'),
    fc.constant('A detective questions a suspect in a dimly lit office'),
    fc.constant('A family of four sits around a dinner table arguing'),
    fc.constant('Two strangers accidentally bump into each other on a busy street'),
    fc.constant('A group of coworkers celebrates a promotion in a bar'),
    fc.constant('Two lovers share an intimate moment on a rooftop at night'),
    fc.constant('A hero confronts a villain in an abandoned warehouse'),
    fc.constant('Three children play hide and seek in a dark forest'),
    // Environmental focus
    fc.constant('A man stands alone in a foggy alley at midnight'),
    fc.constant('Two hikers rest by a stream in a mountain valley'),
    fc.constant('A woman waits under a flickering streetlight in the rain'),
    fc.constant('A crowd gathers around a street performer in a city square'),
    fc.constant('A dog chases its tail in a sunny backyard'),
    // Action sequences
    fc.constant('A man walks into a room and sits down on a chair'),
    fc.constant('A woman runs through the forest and stops to catch her breath'),
    fc.constant('Two people approach each other slowly then embrace'),
    fc.constant('A child jumps up and down with excitement'),
    // Structured with directing keywords
    fc.stringMatching(/^[A-Z][a-z]+\s[a-z]+\s[a-z]+\s[a-z]+\s[a-z]+$/).map(s => s),
  );

  // 2. Empty strings - the minimal edge case
  const emptyStrings = fc.oneof(
    fc.constant(''),
    fc.constant(' '),
    fc.constant('  '),
    fc.constant('\t'),
    fc.constant('\n'),
    fc.constant('\r'),
    fc.constant('\r\n'),
  );

  // 3. Random Unicode - maximum entropy, including:
  //    - Emoji sequences
  //    - Non-Latin scripts
  //    - Mathematical symbols
  //    - Control characters
  //    - Mixed Unicode
  const randomUnicode = fc.oneof(
    // Emoji-only strings
    fc.constant('🎭🎬🎥🍿🎟️'),
    fc.constant('😢😭😞😟😠'),
    fc.constant('🌧️☔🌩️⛈️💨'),
    fc.constant('🌆🏙️🏚️🏠🏡'),
    fc.constant('🚶‍♂️🏃‍♀️🧍‍♂️👫'),
    fc.constant('🌲🌳🌴🌵🌿'),
    // Mixed emoji and text
    fc.constant('A 🎭 man in a 🏰 castle'),
    fc.constant('😢 Sad 🎭 character 🌧️ rain'),
    fc.constant('👨‍👩‍👧‍👦 Family 🏠 home 🌳 tree'),
    fc.constant('🚶‍♂️ Walking 🌆 city 🌃 night'),
    // Non-Latin scripts
    fc.constant('こんにちは世界'), // Japanese: Hello world
    fc.constant('你好世界'), // Chinese: Hello world
    fc.constant('안녕하세요 세계'), // Korean: Hello world
    fc.constant('Привет мир'), // Russian: Hello world
    fc.constant('مرحبا بالعالم'), // Arabic: Hello world
    fc.constant('नमस्ते दुनिया'), // Hindi: Hello world
    fc.constant('Γειά σου κόσμε'), // Greek: Hello world
    // Mathematical symbols
    fc.constant('∀x∈ℝ:∃y∈ℝ:x<y'),
    fc.constant('∑∏∫√∞≈≠'),
    fc.constant('αβγδεζηθ'),
    fc.constant('𝕋𝕒𝕝𝕝 𝕊𝕒𝕝𝕝'), // Mathematical alphanumeric
    // Control characters and special Unicode
    fc.constant('\u0000\u0001\u0002\u0003'), // Null and control chars
    fc.constant('\uFFFF\uFFFE\uFFFD'), // Special Unicode code points
    fc.constant('\uD800\uDC00'), // Surrogate pair
    // Random strings that may contain Unicode characters
    fc.string({ minLength: 1, maxLength: 10 }),
    fc.string({ minLength: 1, maxLength: 50 }),
    fc.string({ minLength: 1, maxLength: 100 }),
    // Extended character sets
    fc.stringMatching(/^[\x00-\xFF]+$/).map(s => s.substring(0, 20)),
  );

  // Combine all categories with appropriate weights:
  // - Well-formed descriptions get highest weight (most common use case)
  // - Empty strings get medium weight (important edge case)
  // - Random Unicode gets medium weight (stress testing)
  return fc.oneof(
    { arbitrary: wellFormedSceneDescriptions, weight: 4 },
    { arbitrary: emptyStrings, weight: 2 },
    { arbitrary: randomUnicode, weight: 3 },
  );
}
