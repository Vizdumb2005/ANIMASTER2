import * as fc from 'fast-check';
import type { SceneTone } from '@animaster/shared/scene';

export const SCENE_TONES: SceneTone[] = [
  'neutral',
  'sad',
  'tense',
  'lonely',
  'awkward',
  'energetic',
  'romantic',
  'threatening'
];

/**
 * Creates a fast-check arbitrary for SceneTone values
 * @returns Fast-check arbitrary that generates SceneTone values
 */
export function arbitrarySceneTone(): fc.Arbitrary<SceneTone> {
  return fc.constantFrom(...SCENE_TONES);
}
