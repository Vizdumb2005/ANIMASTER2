import { describe, it, expect } from 'vitest';
import { interpretPrompt, normalizeSceneGraph } from './routes/interpret.js';

describe('interpretPrompt Error Resilience and Explanation', () => {
  it('should handle empty string without throwing and populate explanation', async () => {
    await expect(interpretPrompt('')).resolves.toBeDefined();
    const result = await interpretPrompt('');
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.explanation).toContain('LLM');
  });

  it('should handle emoji-only prompt without throwing and populate explanation', async () => {
    const emojiPrompt = '🎭👾🔥✨🎬';
    await expect(interpretPrompt(emojiPrompt)).resolves.toBeDefined();
    const result = await interpretPrompt(emojiPrompt);
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.explanation).toContain('LLM');
  });

  it('should handle extremely long (10,000-character) prompt without throwing and populate explanation', async () => {
    const longPrompt = 'a'.repeat(10000);
    await expect(interpretPrompt(longPrompt)).resolves.toBeDefined();
    const result = await interpretPrompt(longPrompt);
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.explanation).toContain('LLM');
  });

  it('should handle pure nonsense prompt without throwing and populate explanation', async () => {
    const nonsensePrompt = 'asdfkjsahfdlkjas dhfskajlhfdskajlhfdskajlh dfsakjlh';
    await expect(interpretPrompt(nonsensePrompt)).resolves.toBeDefined();
    const result = await interpretPrompt(nonsensePrompt);
    expect(result.actors.length).toBeGreaterThanOrEqual(1);
    expect(result.environment).toBeDefined();
    expect(result.explanation).toBeDefined();
    expect(result.explanation).toContain('LLM');
  });

  describe('normalizeSceneGraph Partial Fallback Explanation', () => {
    it('should populate explanation when properties are missing or invalid', () => {
      // Create a partially invalid scene graph (missing camera, environment, and invalid actor emotion)
      const partialScene: any = {
        id: 'scene_partial_001',
        version: 1,
        actors: [
          {
            id: 'actor_1',
            label: 'Stickman',
            type: 'humanoid',
            position: { x: 200, y: 200 },
            emotionState: 'super_happy', // Invalid emotionState
            currentAction: 'idle',
            actionQueue: [] // Empty actionQueue
          }
        ]
        // Missing camera, environment, cinematicGrammar, atmosphere, rhythm, etc.
      };

      const normalized = normalizeSceneGraph(partialScene, 'a sad stickman walking');

      // The returned scene should be complete
      expect(normalized.id).toBe('scene_partial_001');
      expect(normalized.camera).toBeDefined();
      expect(normalized.environment).toBeDefined();
      expect(normalized.actors[0].emotionState).toBe('neutral'); // Inferred 'neutral' due to invalid 'super_happy'
      expect(normalized.actors[0].actionQueue).toEqual(['idle']); // Inferred 'idle' in actionQueue

      // It must populate the explanation field
      expect(normalized.explanation).toBeDefined();
      expect(typeof normalized.explanation).toBe('string');
      
      // Explanation should describe what was skipped and what was inferred
      const explanation = normalized.explanation!;
      expect(explanation).toContain('Skipped:');
      expect(explanation).toContain('Inferred:');

      // Validate specific skipped/inferred items are listed
      expect(explanation).toContain('invalid emotionState');
      expect(explanation).toContain('environment configuration');
      expect(explanation).toContain('camera configuration');
    });

    it('should not populate explanation when scene graph is fully complete and valid', () => {
      const validScene: any = {
        id: 'scene_valid_002',
        version: 2,
        actors: [
          {
            id: 'actor_valid_1',
            label: 'Valid Actor',
            type: 'humanoid',
            position: { x: 100, y: 150 },
            targetPosition: null,
            emotionState: 'excited',
            currentAction: 'walking',
            actionQueue: ['walking', 'idle'],
            joints: {
              head: { x: 100, y: 92 },
              torso: { x: 100, y: 120 },
              leftArm: { x: 72, y: 140 },
              rightArm: { x: 128, y: 140 },
              leftLeg: { x: 82, y: 192 },
              rightLeg: { x: 118, y: 192 }
            },
            actionElapsed: 5
          }
        ],
        environment: {
          type: 'diner',
          backgroundColor: '#1a1510',
          floorColor: '#2a2018',
          wallColor: '#352a20',
          width: 960,
          height: 540
        },
        camera: {
          x: 0,
          y: 0,
          zoom: 1,
          mode: 'static'
        },
        sessionHistory: [
          { id: 'session_1', prompt: 'test', createdAt: Date.now() }
        ],
        cinematicGrammar: {
          tone: 'neutral',
          template: {
            cameraMode: 'static',
            spacingMultiplier: 1,
            motionEnergyScale: 1,
            pauseFrequency: 4,
            contrastBoost: 0,
            headroom: 1
          }
        },
        atmosphere: {
          effects: ['none'],
          lightingTint: 'rgba(0,0,0,0)',
          ambientIntensity: 1
        },
        relationships: [],
        rhythm: {
          tempo: 'medium',
          pauseFrequencyPerMinute: 4,
          motionEnergyCurve: 'linear'
        },
        shotSequence: [
          { id: 'shot_1', mode: 'static', subjectIds: ['actor_valid_1'], framingIntent: 'observe', transition: 'cut', semanticReason: 'test', holdMs: 1000 }
        ]
      };

      const normalized = normalizeSceneGraph(validScene, 'test');
      expect(normalized.explanation).toBeUndefined();
    });
  });
});
