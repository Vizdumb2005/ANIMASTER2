import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import { 
  arbitraryVector2, 
  arbitraryActorEmotion, 
  arbitrarySceneTone,
  arbitrarySceneGraph,
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

  it('should generate valid SceneGraph objects with 1 to 5 actors', () => {
    fc.assert(
      fc.property(arbitrarySceneGraph(), (graph) => {
        expect(graph.id).toBeDefined();
        expect(typeof graph.id).toBe('string');
        expect(graph.version).toBeGreaterThanOrEqual(1);
        expect(graph.actors.length).toBeGreaterThanOrEqual(1);
        expect(graph.actors.length).toBeLessThanOrEqual(5);
        expect(graph.environment).toBeDefined();
        expect(typeof graph.environment.width).toBe('number');
        expect(graph.camera).toBeDefined();
        expect(typeof graph.camera.zoom).toBe('number');
        return true;
      })
    );
  });
});
