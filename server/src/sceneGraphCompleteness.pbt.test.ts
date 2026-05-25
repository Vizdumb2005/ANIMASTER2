import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { interpretPrompt } from './routes/interpret.js';
import { mutateScene, normalizePatch } from './routes/mutate.js';

// A comprehensive set of interesting keywords to trigger various interpretation/mutation paths
const KEYWORDS = [
  'sad', 'dark', 'lonely', 'lonelier', 'more lonely',
  'nervous', 'anxious', 'tense', 'tenser', 'more tense',
  'happy', 'warm', 'bright', 'cheerful',
  'excited', 'thrilled',
  'angry', 'furious',
  'exhausted', 'tired', 'weary',
  'awkward', 'uncomfortable',
  'sit', 'sitting',
  'walk', 'walking', 'enter',
  'approach', 'comes', 'walks toward', 'comes closer',
  'argues with', 'confronts', 'corners', 'fights with', 'yells at',
  'comforts', 'consoles', 'hugs', 'holds hands',
  'talks to', 'speaks to', 'chats with', 'converses with',
  'watches with', 'sits with', 'stands with', 'waits with',
  'avoids', 'ignores', 'turns away', 'walks away',
  'another', 'second', 'someone', 'two',
  'park', 'garden', 'meadow',
  'beach', 'ocean', 'sea', 'shore',
  'forest', 'woods', 'jungle',
  'rooftop', 'roof',
  'hallway', 'corridor',
  'subway', 'metro',
  'hospital', 'clinic',
  'apartment', 'flat', 'home',
  'staircase', 'stairs',
  'alley', 'back alley',
  'parking garage', 'parking lot',
  'diner', 'restaurant', 'cafe',
  'office', 'cubicle',
  'warehouse', 'factory',
  'street', 'outdoor', 'outside',
  'night', 'flicker', 'streetlight',
  'rain', 'rainy', 'snow', 'snowy', 'fog', 'foggy', 'dust', 'dusty', 'wind', 'windy',
  'push camera closer', 'close up', 'zoom in', 'closer shot',
  'pull back', 'push camera farther', 'wide shot', 'zoom out',
  'over the shoulder', 'ots',
  'slow down', 'slower', 'more contemplative', 'more silence',
  'speed up', 'faster', 'more frantic', 'more urgent',
  'make them closer', 'closer together', 'bring them together',
  'add more distance', 'more distant', 'push them apart', 'farther apart',
  'add another character', 'add a new actor',
  'new scene', 'start over', 'reset'
];

export function arbitraryIntentPrompt() {
  return fc.oneof(
    // 1. Array of keywords
    fc.array(fc.constantFrom(...KEYWORDS), { minLength: 1, maxLength: 5 }).map((words: string[]) => words.join(' ')),
    // 2. Random alphanumeric strings
    fc.string({ minLength: 0, maxLength: 100 }),
    // 3. Random emojis
    fc.constantFrom('🎭', '🎭👾🔥✨🎬', '👾', '🔥', '✨', '🎬', '🎭👾🔥✨🎬'.repeat(2)),
    // 4. Extremely long prompts
    fc.string({ minLength: 1000, maxLength: 5000 })
  );
}

const emptyScene: any = {
  id: 'scene_empty',
  version: 0,
  actors: [],
  environment: null,
  camera: null,
  atmosphere: null,
  rhythm: null,
  cinematicGrammar: null,
  relationships: []
};

const VALID_EMOTIONS = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];

function assertComplete(result: any) {
  // 1. At least 1 actor
  expect(result.actors).toBeDefined();
  expect(Array.isArray(result.actors)).toBe(true);
  expect(result.actors.length).toBeGreaterThanOrEqual(1);

  // 2. Non-null environment with valid properties
  expect(result.environment).toBeDefined();
  expect(result.environment).not.toBeNull();
  expect(typeof result.environment.type).toBe('string');
  expect(typeof result.environment.backgroundColor).toBe('string');
  expect(typeof result.environment.floorColor).toBe('string');
  expect(typeof result.environment.wallColor).toBe('string');
  expect(typeof result.environment.width).toBe('number');
  expect(result.environment.width).toBeGreaterThanOrEqual(1);
  expect(typeof result.environment.height).toBe('number');
  expect(result.environment.height).toBeGreaterThanOrEqual(1);

  // 3. Non-null AtmosphereConfig/Profile with valid properties
  expect(result.atmosphere).toBeDefined();
  expect(result.atmosphere).not.toBeNull();
  expect(Array.isArray(result.atmosphere.effects)).toBe(true);
  expect(typeof result.atmosphere.lightingTint).toBe('string');
  expect(typeof result.atmosphere.ambientIntensity).toBe('number');
  expect(result.atmosphere.ambientIntensity).toBeGreaterThanOrEqual(0);
  expect(result.atmosphere.ambientIntensity).toBeLessThanOrEqual(1);

  // 4. Non-null CameraState/Camera with valid properties
  expect(result.camera).toBeDefined();
  expect(result.camera).not.toBeNull();
  expect(typeof result.camera.x).toBe('number');
  expect(typeof result.camera.y).toBe('number');
  expect(typeof result.camera.zoom).toBe('number');
  expect(result.camera.zoom).toBeGreaterThanOrEqual(0);
  expect(typeof result.camera.mode).toBe('string');

  // 5. Non-null EmotionState for every actor
  for (const actor of result.actors) {
    expect(actor.emotionState).toBeDefined();
    expect(actor.emotionState).not.toBeNull();
    expect(VALID_EMOTIONS).toContain(actor.emotionState);
  }
}

describe('Scene_Graph Completeness PBT', () => {
  it('Property 1: interpret() produces a complete graph (100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryIntentPrompt(), async (prompt: string) => {
        const result = await interpretPrompt(prompt);
        assertComplete(result);
      }),
      { numRuns: 100 }
    );
  }, 15000);

  it('Property 1: applying mutations to an empty graph produces a complete graph (100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryIntentPrompt(), async (prompt: string) => {
        const patch = await mutateScene(prompt, emptyScene);
        const mutatedScene = normalizePatch(patch as any, emptyScene);
        assertComplete(mutatedScene);
      }),
      { numRuns: 100 }
    );
  }, 15000);

  it('Property 1: mutating an already interpreted scene graph preserves completeness (100 runs)', async () => {
    await fc.assert(
      fc.asyncProperty(arbitraryIntentPrompt(), arbitraryIntentPrompt(), async (prompt1: string, prompt2: string) => {
        const initialScene = await interpretPrompt(prompt1);
        const patch = await mutateScene(prompt2, initialScene);
        const mutatedScene = normalizePatch(patch as any, initialScene as any);
        assertComplete(mutatedScene);
      }),
      { numRuns: 100 }
    );
  }, 20000);
});
