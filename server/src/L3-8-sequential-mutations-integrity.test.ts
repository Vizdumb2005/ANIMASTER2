/**
 * server/src/L3-8-sequential-mutations-integrity.test.ts
 *
 * L3-8 — Unit test: 20 sequential mutations
 *
 * Applies 20 sequential mutations to a SceneGraph and verifies:
 * - version equals 20 (initial version + 20)
 * - no required field is null
 * - graph remains structurally valid
 */

import { describe, it, expect } from 'vitest';
import { applyMutation } from '../../shared/src/mutations.js';
import type { SceneGraph, Actor } from '../../shared/src/scene.js';

/**
 * Create a valid initial SceneGraph
 */
function createInitialScene(): SceneGraph {
  return {
    id: 'test_scene_001',
    version: 0,
    actors: [
      {
        id: 'actor_alpha',
        label: 'Protagonist',
        type: 'humanoid',
        position: { x: 100, y: 200 },
        targetPosition: null,
        emotionState: 'neutral',
        emotionIntensity: 0.5,
        currentAction: 'idle',
        actionQueue: [],
        joints: {
          head: { x: 100, y: 180 },
          torso: { x: 100, y: 200 },
          leftArm: { x: 80, y: 200 },
          rightArm: { x: 120, y: 200 },
          leftLeg: { x: 90, y: 240 },
          rightLeg: { x: 110, y: 240 },
        },
        actionElapsed: 0,
      },
      {
        id: 'actor_beta',
        label: 'Antagonist',
        type: 'humanoid',
        position: { x: 500, y: 200 },
        targetPosition: null,
        emotionState: 'angry',
        emotionIntensity: 0.8,
        currentAction: 'pacing',
        actionQueue: ['idle'],
        joints: {
          head: { x: 500, y: 180 },
          torso: { x: 500, y: 200 },
          leftArm: { x: 480, y: 200 },
          rightArm: { x: 520, y: 200 },
          leftLeg: { x: 490, y: 240 },
          rightLeg: { x: 510, y: 240 },
        },
        actionElapsed: 100,
      },
    ],
    environment: {
      type: 'warehouse',
      backgroundColor: '#1a1a2e',
      floorColor: '#16213e',
      wallColor: '#0f3460',
      width: 800,
      height: 600,
    },
    camera: {
      x: 400,
      y: 300,
      zoom: 1.0,
      mode: 'static',
    },
    sessionHistory: [],
    cinematicGrammar: {
      tone: 'tense',
      template: {
        cameraMode: 'static',
        spacingMultiplier: 1.0,
        motionEnergyScale: 1.0,
        pauseFrequency: 0.5,
        contrastBoost: 0,
        headroom: 0.2,
      },
    },
    atmosphere: {
      effects: ['fog'],
      lightingTint: '#ffffff',
      ambientIntensity: 0.5,
    },
    relationships: [
      {
        actorAId: 'actor_alpha',
        actorBId: 'actor_beta',
        type: 'confronting',
        awarenessRadius: 200,
        gazeTarget: 'actor_beta',
        emotionalReaction: 'nervous',
      },
    ],
    rhythm: {
      tempo: 'medium',
      pauseFrequencyPerMinute: 4,
      motionEnergyCurve: 'linear',
    },
  };
}

/**
 * Check if a value is null or undefined
 */
function isNullOrUndefined(value: unknown): boolean {
  return value === null || value === undefined;
}

/**
 * Validate that no required SceneGraph field is null/undefined
 */
function validateNoNullFields(graph: SceneGraph): string[] {
  const errors: string[] = [];

  // Check top-level required fields
  const requiredTopLevel: (keyof SceneGraph)[] = [
    'id', 'version', 'actors', 'environment', 'camera',
    'sessionHistory', 'cinematicGrammar', 'atmosphere', 'relationships', 'rhythm'
  ];

  for (const field of requiredTopLevel) {
    if (isNullOrUndefined(graph[field])) {
      errors.push(`SceneGraph.${field} is null or undefined`);
    }
  }

  // Check actors
  if (graph.actors) {
    for (let i = 0; i < graph.actors.length; i++) {
      const actor = graph.actors[i];
      const requiredActorFields: (keyof Actor)[] = [
        'id', 'label', 'type', 'position', 'emotionState',
        'currentAction', 'actionQueue', 'joints', 'actionElapsed'
      ];

      for (const field of requiredActorFields) {
        if (isNullOrUndefined(actor[field])) {
          errors.push(`Actor[${i}].${field} is null or undefined`);
        }
      }

      // Check position coordinates
      if (actor.position) {
        if (isNullOrUndefined(actor.position.x)) {
          errors.push(`Actor[${i}].position.x is null or undefined`);
        }
        if (isNullOrUndefined(actor.position.y)) {
          errors.push(`Actor[${i}].position.y is null or undefined`);
        }
      }

      // Check joints
      if (actor.joints) {
        const jointParts: (keyof Actor['joints'])[] = [
          'head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'
        ];
        for (const joint of jointParts) {
          if (isNullOrUndefined(actor.joints[joint])) {
            errors.push(`Actor[${i}].joints.${joint} is null or undefined`);
          } else {
            if (isNullOrUndefined(actor.joints[joint].x)) {
              errors.push(`Actor[${i}].joints.${joint}.x is null or undefined`);
            }
            if (isNullOrUndefined(actor.joints[joint].y)) {
              errors.push(`Actor[${i}].joints.${joint}.y is null or undefined`);
            }
          }
        }
      }
    }
  }

  // Check environment
  if (graph.environment) {
    const envFields: (keyof SceneGraph['environment'])[] = [
      'type', 'backgroundColor', 'floorColor', 'wallColor', 'width', 'height'
    ];
    for (const field of envFields) {
      if (isNullOrUndefined(graph.environment[field])) {
        errors.push(`environment.${field} is null or undefined`);
      }
    }
  }

  // Check camera
  if (graph.camera) {
    const cameraFields: (keyof SceneGraph['camera'])[] = ['x', 'y', 'zoom', 'mode'];
    for (const field of cameraFields) {
      if (isNullOrUndefined(graph.camera[field])) {
        errors.push(`camera.${field} is null or undefined`);
      }
    }
  }

  // Check atmosphere
  if (graph.atmosphere) {
    const atmFields: (keyof SceneGraph['atmosphere'])[] = ['effects', 'lightingTint', 'ambientIntensity'];
    for (const field of atmFields) {
      if (isNullOrUndefined(graph.atmosphere[field])) {
        errors.push(`atmosphere.${field} is null or undefined`);
      }
    }
  }

  // Check cinematic grammar
  if (graph.cinematicGrammar) {
    if (isNullOrUndefined(graph.cinematicGrammar.tone)) {
      errors.push('cinematicGrammar.tone is null or undefined');
    }
    if (isNullOrUndefined(graph.cinematicGrammar.template)) {
      errors.push('cinematicGrammar.template is null or undefined');
    }
  }

  // Check rhythm
  if (graph.rhythm) {
    const rhythmFields: (keyof SceneGraph['rhythm'])[] = [
      'tempo', 'pauseFrequencyPerMinute', 'motionEnergyCurve'
    ];
    for (const field of rhythmFields) {
      if (isNullOrUndefined(graph.rhythm[field])) {
        errors.push(`rhythm.${field} is null or undefined`);
      }
    }
  }

  return errors;
}

describe('L3-8 — 20 Sequential Mutations Integrity', () => {
  it('should apply 20 sequential mutations and maintain version = 20 with no null fields', () => {
    const initialScene = createInitialScene();
    
    // Define 20 distinct mutations to apply
    const mutations = [
      { type: 'SetTone' as const, tone: 'sad' as const, reason: 'Test 1' },
      { type: 'SetActorEmotion' as const, actorId: 'actor_alpha', emotion: 'sad' as const, intensity: 0.7 },
      { type: 'AddAtmosphere' as const, effect: 'rain' as const, reason: 'Test 3' },
      { type: 'QueueActorAction' as const, actorId: 'actor_beta', action: 'walkingTo' as const },
      { type: 'SetTone' as const, tone: 'lonely' as const, reason: 'Test 5' },
      { type: 'SetActorEmotion' as const, actorId: 'actor_beta', emotion: 'nervous' as const, intensity: 0.6 },
      { type: 'AddAtmosphere' as const, effect: 'fog' as const, reason: 'Test 7' },
      { type: 'SetTone' as const, tone: 'tense' as const, reason: 'Test 8' },
      { type: 'SetActorEmotion' as const, actorId: 'actor_alpha', emotion: 'angry' as const, intensity: 0.9 },
      { type: 'RestageScene' as const, strategy: 'preserve_actions' as const, reason: 'Test 10' },
      { type: 'AddAtmosphere' as const, effect: 'none' as const, reason: 'Test 11' },
      { type: 'SetTone' as const, tone: 'threatening' as const, reason: 'Test 12' },
      { type: 'QueueActorAction' as const, actorId: 'actor_alpha', action: 'approaching' as const },
      { type: 'SetActorEmotion' as const, actorId: 'actor_beta', emotion: 'exhausted' as const, intensity: 0.5 },
      { type: 'SetTone' as const, tone: 'awkward' as const, reason: 'Test 15' },
      { type: 'RestageScene' as const, strategy: 'tone_composition' as const, reason: 'Test 16' },
      { type: 'SetActorEmotion' as const, actorId: 'actor_alpha', emotion: 'awkward' as const, intensity: 0.4 },
      { type: 'AddAtmosphere' as const, effect: 'flicker' as const, reason: 'Test 18' },
      { type: 'SetTone' as const, tone: 'romantic' as const, reason: 'Test 19' },
      { type: 'SetActorEmotion' as const, actorId: 'actor_beta', emotion: 'happy' as const, intensity: 0.8 },
    ];

    // Apply mutations sequentially
    let currentScene = initialScene;
    for (let i = 0; i < mutations.length; i++) {
      currentScene = applyMutation(currentScene, mutations[i]);
      
      // Verify version after each mutation
      expect(currentScene.version).toBe(initialScene.version + (i + 1));
    }

    // FINAL VERIFICATION 1: Version equals exactly 20
    expect(currentScene.version).toBe(20);

    // FINAL VERIFICATION 2: No field is null or undefined
    const nullErrors = validateNoNullFields(currentScene);
    expect(nullErrors).toEqual([]);

    // FINAL VERIFICATION 3: Verify scene ID preserved
    expect(currentScene.id).toBe('test_scene_001');

    // FINAL VERIFICATION 4: Verify actors still exist
    expect(currentScene.actors).toHaveLength(2);
    expect(currentScene.actors.some(a => a.id === 'actor_alpha')).toBe(true);
    expect(currentScene.actors.some(a => a.id === 'actor_beta')).toBe(true);

    // FINAL VERIFICATION 5: Verify final emotions match last mutation
    const alpha = currentScene.actors.find(a => a.id === 'actor_alpha');
    const beta = currentScene.actors.find(a => a.id === 'actor_beta');
    expect(alpha?.emotionState).toBe('awkward');
    expect(beta?.emotionState).toBe('happy');

    // FINAL VERIFICATION 6: Verify final tone
    expect(currentScene.cinematicGrammar.tone).toBe('romantic');

    // FINAL VERIFICATION 7: Verify atmosphere has flicker (from mutation 18)
    expect(currentScene.atmosphere.effects).toContain('flicker');
  });

  it('should increment version correctly for each mutation', () => {
    const initialScene = createInitialScene();
    const expectedVersions: number[] = [];
    
    // Apply 5 mutations and track versions
    let currentScene = initialScene;
    for (let i = 1; i <= 5; i++) {
      currentScene = applyMutation(currentScene, {
        type: 'SetTone',
        tone: 'neutral',
        reason: `Mutation ${i}`
      });
      expectedVersions.push(currentScene.version);
    }

    expect(expectedVersions).toEqual([1, 2, 3, 4, 5]);
  });

  it('should maintain actor count and IDs through all mutations', () => {
    const initialScene = createInitialScene();
    const originalActorIds = initialScene.actors.map(a => a.id).sort();
    
    // Apply 10 mutations
    let currentScene = initialScene;
    for (let i = 0; i < 10; i++) {
      currentScene = applyMutation(currentScene, {
        type: 'SetTone',
        tone: 'energetic',
        reason: `Test ${i}`
      });
      
      // Verify actor IDs remain consistent after each mutation
      const currentActorIds = currentScene.actors.map(a => a.id).sort();
      expect(currentActorIds).toEqual(originalActorIds);
    }
  });
});
