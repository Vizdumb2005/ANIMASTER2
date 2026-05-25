import * as fc from 'fast-check';
import type { ActorEmotion } from '@animaster/shared/scene';

export const ACTOR_EMOTIONS: ActorEmotion[] = [
  'neutral',
  'sad',
  'happy',
  'nervous',
  'excited',
  'awkward',
  'angry',
  'exhausted'
];

/**
 * Creates a fast-check arbitrary for ActorEmotion values
 * @returns Fast-check arbitrary that generates ActorEmotion values
 */
export function arbitraryActorEmotion(): fc.Arbitrary<ActorEmotion> {
  return fc.constantFrom(...ACTOR_EMOTIONS);
}
