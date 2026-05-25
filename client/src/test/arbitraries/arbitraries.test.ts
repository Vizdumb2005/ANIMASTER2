import { describe, it } from 'vitest';
import fc from 'fast-check';
import { 
  arbitraryVector2, 
  arbitraryActorEmotion, 
  arbitrarySceneTone,
  ACTOR_EMOTIONS,
  SCENE_TONES
} from './index';

describe('Fast-Check Arbitraries Validation', () => {
  it('should generate valid Vector2 objects', () => {
    fc.assert(
      fc.property(arbitraryVector2(), (vec) => {
        return typeof vec.x === 'number' && typeof vec.y === 'number';
      })
    );
  });

  it('should generate valid ActorEmotion values', () => {
    fc.assert(
      fc.property(arbitraryActorEmotion(), (emotion) => {
        return ACTOR_EMOTIONS.includes(emotion);
      })
    );
  });

  it('should generate valid SceneTone values', () => {
    fc.assert(
      fc.property(arbitrarySceneTone(), (tone) => {
        return SCENE_TONES.includes(tone);
      })
    );
  });
});
