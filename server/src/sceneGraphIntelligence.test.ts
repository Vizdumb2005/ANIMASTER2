import { describe, it, expect } from 'vitest';
import { resolveActorReference } from './ai/sceneGraph/sceneGraphIntelligence.js';
import type { SceneGraph } from '../../shared/src/scene.js';

describe('Actor Reference Resolution', () => {
  // A mock base scene graph helper
  const createMockScene = (actors: any[]): SceneGraph => {
    return {
      id: 'test_scene',
      version: 1,
      actors,
      environment: {
        type: 'indoor_room',
        backgroundColor: '#ffffff',
        floorColor: '#888888',
        wallColor: '#cccccc',
        width: 800,
        height: 600
      },
      camera: { x: 400, y: 300, zoom: 1, mode: 'static' },
      sessionHistory: [],
      cinematicGrammar: { tone: 'neutral', template: { cameraMode: 'static', spacingMultiplier: 1, motionEnergyScale: 1, pauseFrequency: 0.5, contrastBoost: 0, headroom: 0.2 } },
      atmosphere: { effects: [], lightingTint: '#ffffff', ambientIntensity: 0.5 },
      relationships: [],
      rhythm: { tempo: 'medium', pauseFrequencyPerMinute: 4, motionEnergyCurve: 'linear' }
    };
  };

  it('should return EMPTY_SCENE if graph has no actors', () => {
    const scene = createMockScene([]);
    const res = resolveActorReference('the left character', scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('EMPTY_SCENE');
    }
  });

  it('should return INVALID_CRITERIA if description is empty or whitespace', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'Stickman', emotionState: 'neutral', position: { x: 100, y: 200 } }
    ]);
    const res = resolveActorReference('  ', scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('INVALID_CRITERIA');
    }
  });

  it('should resolve direct ID or label matches exactly', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'Stickman One', emotionState: 'neutral', position: { x: 100, y: 200 } },
      { id: 'actor_2', label: 'Stickman Two', emotionState: 'sad', position: { x: 200, y: 200 } }
    ]);

    const res1 = resolveActorReference('actor_2', scene);
    expect(res1.ok).toBe(true);
    if (res1.ok) expect(res1.actorId).toBe('actor_2');

    const res2 = resolveActorReference('Stickman One', scene);
    expect(res2.ok).toBe(true);
    if (res2.ok) expect(res2.actorId).toBe('actor_1');
  });

  it('should resolve single emotion criteria successfully', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'One', emotionState: 'neutral', position: { x: 100, y: 200 } },
      { id: 'actor_2', label: 'Two', emotionState: 'nervous', position: { x: 200, y: 200 } },
      { id: 'actor_3', label: 'Three', emotionState: 'happy', position: { x: 300, y: 200 } }
    ]);

    const res = resolveActorReference('the nervous one', scene);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.actorId).toBe('actor_2');
  });

  it('should resolve single spatial position successfully', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'Left', emotionState: 'neutral', position: { x: 150, y: 200 } },
      { id: 'actor_2', label: 'Middle', emotionState: 'neutral', position: { x: 400, y: 200 } },
      { id: 'actor_3', label: 'Right', emotionState: 'neutral', position: { x: 650, y: 200 } }
    ]);

    // Leftmost
    const leftRes = resolveActorReference('the character on the left', scene);
    expect(leftRes.ok).toBe(true);
    if (leftRes.ok) expect(leftRes.actorId).toBe('actor_1');

    // Rightmost
    const rightRes = resolveActorReference('the character on the right', scene);
    expect(rightRes.ok).toBe(true);
    if (rightRes.ok) expect(rightRes.actorId).toBe('actor_3');

    // Middle
    const midRes = resolveActorReference('the actor in the middle', scene);
    expect(midRes.ok).toBe(true);
    if (midRes.ok) expect(midRes.actorId).toBe('actor_2');
  });

  it('should resolve combining emotional and spatial criteria', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'One', emotionState: 'nervous', position: { x: 150, y: 200 } },
      { id: 'actor_2', label: 'Two', emotionState: 'happy', position: { x: 400, y: 200 } },
      { id: 'actor_3', label: 'Three', emotionState: 'nervous', position: { x: 650, y: 200 } }
    ]);

    // Rightmost nervous character
    const res = resolveActorReference('the nervous character on the right', scene);
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.actorId).toBe('actor_3');
  });

  it('should return AMBIGUOUS if criteria matches more than one actor', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'One', emotionState: 'nervous', position: { x: 150, y: 200 } },
      { id: 'actor_2', label: 'Two', emotionState: 'nervous', position: { x: 400, y: 200 } }
    ]);

    const res = resolveActorReference('the nervous one', scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('AMBIGUOUS');
    }
  });

  it('should return AMBIGUOUS for middle character if actors count is even', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'One', emotionState: 'neutral', position: { x: 150, y: 200 } },
      { id: 'actor_2', label: 'Two', emotionState: 'neutral', position: { x: 400, y: 200 } }
    ]);

    const res = resolveActorReference('the middle character', scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('AMBIGUOUS');
    }
  });

  it('should return NO_MATCH if no actor matches', () => {
    const scene = createMockScene([
      { id: 'actor_1', label: 'One', emotionState: 'neutral', position: { x: 150, y: 200 } }
    ]);

    const res = resolveActorReference('the sad character', scene);
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.error.reason).toBe('NO_MATCH');
    }
  });
});
