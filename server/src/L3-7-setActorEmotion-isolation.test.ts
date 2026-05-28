/**
 * server/src/L3-7-setActorEmotion-isolation.test.ts
 *
 * L3-7 — Unit test: SetActorEmotion mutation isolation
 *
 * Verifies that applying a SetActorEmotion mutation changes only the target
 * actor's emotionState, leaving all other fields (including other actors)
 * completely unchanged.
 */

import { describe, it, expect } from 'vitest';
import { applyMutation } from '../../shared/src/mutations.js';
import type { SceneGraph, Actor } from '../../shared/src/scene.js';

/**
 * Create a test SceneGraph with multiple actors
 */
function createTestScene(): SceneGraph {
  return {
    id: 'test_scene',
    version: 1,
    actors: [
      {
        id: 'actor_1',
        label: 'Hero',
        type: 'humanoid',
        position: { x: 100, y: 200 },
        targetPosition: { x: 150, y: 200 },
        emotionState: 'neutral',
        emotionIntensity: 0.5,
        currentAction: 'idle',
        actionQueue: ['walking', 'sitting'],
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
        id: 'actor_2',
        label: 'Villain',
        type: 'humanoid',
        position: { x: 300, y: 200 },
        targetPosition: null,
        emotionState: 'angry',
        emotionIntensity: 0.8,
        currentAction: 'pacing',
        actionQueue: [],
        joints: {
          head: { x: 300, y: 180 },
          torso: { x: 300, y: 200 },
          leftArm: { x: 280, y: 200 },
          rightArm: { x: 320, y: 200 },
          leftLeg: { x: 290, y: 240 },
          rightLeg: { x: 310, y: 240 },
        },
        actionElapsed: 500,
      },
      {
        id: 'actor_3',
        label: 'Sidekick',
        type: 'humanoid',
        position: { x: 200, y: 250 },
        targetPosition: { x: 200, y: 250 },
        emotionState: 'happy',
        emotionIntensity: 0.6,
        currentAction: 'idle',
        actionQueue: ['idle'],
        joints: {
          head: { x: 200, y: 230 },
          torso: { x: 200, y: 250 },
          leftArm: { x: 180, y: 250 },
          rightArm: { x: 220, y: 250 },
          leftLeg: { x: 190, y: 290 },
          rightLeg: { x: 210, y: 290 },
        },
        actionElapsed: 100,
      },
    ],
    environment: {
      type: 'indoor_room',
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
    relationships: [],
    rhythm: {
      tempo: 'medium',
      pauseFrequencyPerMinute: 4,
      motionEnergyCurve: 'linear',
    },
  };
}

/**
 * Deep equality check for actors
 */
function actorsAreIdentical(a: Actor, b: Actor): boolean {
  return (
    a.id === b.id &&
    a.label === b.label &&
    a.type === b.type &&
    a.position.x === b.position.x &&
    a.position.y === b.position.y &&
    a.targetPosition?.x === b.targetPosition?.x &&
    a.targetPosition?.y === b.targetPosition?.y &&
    a.emotionState === b.emotionState &&
    a.emotionIntensity === b.emotionIntensity &&
    a.currentAction === b.currentAction &&
    JSON.stringify(a.actionQueue) === JSON.stringify(b.actionQueue) &&
    a.joints.head.x === b.joints.head.x &&
    a.joints.head.y === b.joints.head.y &&
    a.joints.torso.x === b.joints.torso.x &&
    a.joints.torso.y === b.joints.torso.y &&
    a.actionElapsed === b.actionElapsed
  );
}

describe('L3-7 — SetActorEmotion Isolation', () => {
  it('should change only the target actor emotionState, leaving all other fields identical', () => {
    const originalScene = createTestScene();
    const targetActorId = 'actor_2'; // The villain
    const newEmotion = 'nervous';
    const newIntensity = 0.9;

    // Store original state for comparison
    const originalActors = new Map(originalScene.actors.map(a => [a.id, a]));
    const originalEnvironment = { ...originalScene.environment };
    const originalCamera = { ...originalScene.camera };
    const originalAtmosphere = { ...originalScene.atmosphere };
    const originalRhythm = { ...originalScene.rhythm };

    // Apply the mutation
    const mutation = {
      type: 'SetActorEmotion' as const,
      actorId: targetActorId,
      emotion: newEmotion,
      intensity: newIntensity,
      reason: 'Test emotion change',
    };

    const mutatedScene = applyMutation(originalScene, mutation);

    // VERIFICATION 1: Target actor's emotionState changed
    const targetActorAfter = mutatedScene.actors.find(a => a.id === targetActorId);
    expect(targetActorAfter).toBeDefined();
    expect(targetActorAfter!.emotionState).toBe(newEmotion);
    expect(targetActorAfter!.emotionIntensity).toBe(newIntensity);

    // VERIFICATION 2: Target actor's other fields unchanged
    const targetActorBefore = originalActors.get(targetActorId)!;
    expect(targetActorAfter!.id).toBe(targetActorBefore.id);
    expect(targetActorAfter!.label).toBe(targetActorBefore.label);
    expect(targetActorAfter!.type).toBe(targetActorBefore.type);
    expect(targetActorAfter!.position).toEqual(targetActorBefore.position);
    expect(targetActorAfter!.targetPosition).toEqual(targetActorBefore.targetPosition);
    expect(targetActorAfter!.currentAction).toBe(targetActorBefore.currentAction);
    expect(targetActorAfter!.actionQueue).toEqual(targetActorBefore.actionQueue);
    expect(targetActorAfter!.joints).toEqual(targetActorBefore.joints);
    expect(targetActorAfter!.actionElapsed).toBe(targetActorBefore.actionElapsed);

    // VERIFICATION 3: Other actors completely unchanged
    for (const actor of mutatedScene.actors) {
      if (actor.id !== targetActorId) {
        const originalActor = originalActors.get(actor.id)!;
        expect(
          actorsAreIdentical(actor, originalActor),
          `Actor ${actor.id} was modified when targeting ${targetActorId}`
        ).toBe(true);
      }
    }

    // VERIFICATION 4: Environment unchanged
    expect(mutatedScene.environment).toEqual(originalEnvironment);

    // VERIFICATION 5: Camera unchanged
    expect(mutatedScene.camera.x).toBe(originalCamera.x);
    expect(mutatedScene.camera.y).toBe(originalCamera.y);
    expect(mutatedScene.camera.zoom).toBe(originalCamera.zoom);
    expect(mutatedScene.camera.mode).toBe(originalCamera.mode);

    // VERIFICATION 6: Atmosphere unchanged
    expect(mutatedScene.atmosphere).toEqual(originalAtmosphere);

    // VERIFICATION 7: Rhythm unchanged
    expect(mutatedScene.rhythm).toEqual(originalRhythm);

    // VERIFICATION 8: Cinematic grammar unchanged
    expect(mutatedScene.cinematicGrammar).toEqual(originalScene.cinematicGrammar);

    // VERIFICATION 9: Version incremented
    expect(mutatedScene.version).toBe(originalScene.version + 1);

    // VERIFICATION 10: Original scene not mutated
    expect(originalScene.actors.find(a => a.id === targetActorId)!.emotionState).toBe('angry');
    expect(originalScene.version).toBe(1);
  });

  it('should handle emotion change without intensity parameter', () => {
    const originalScene = createTestScene();
    const targetActorId = 'actor_1';

    const mutation = {
      type: 'SetActorEmotion' as const,
      actorId: targetActorId,
      emotion: 'excited',
      // No intensity provided
    };

    const mutatedScene = applyMutation(originalScene, mutation);

    // Emotion should change
    const targetActor = mutatedScene.actors.find(a => a.id === targetActorId);
    expect(targetActor!.emotionState).toBe('excited');

    // Other actors should be untouched
    expect(mutatedScene.actors.filter(a => a.id !== targetActorId).every(
      a => originalScene.actors.find(orig => orig.id === a.id)?.emotionState === a.emotionState
    )).toBe(true);
  });

  it('should work when target actor is first in the array', () => {
    const originalScene = createTestScene();
    const targetActorId = 'actor_1';

    const mutation = {
      type: 'SetActorEmotion' as const,
      actorId: targetActorId,
      emotion: 'sad',
      intensity: 0.3,
    };

    const mutatedScene = applyMutation(originalScene, mutation);

    expect(mutatedScene.actors[0].emotionState).toBe('sad');
    expect(mutatedScene.actors[1].emotionState).toBe('angry'); // unchanged
    expect(mutatedScene.actors[2].emotionState).toBe('happy'); // unchanged
  });

  it('should work when target actor is last in the array', () => {
    const originalScene = createTestScene();
    const targetActorId = 'actor_3';

    const mutation = {
      type: 'SetActorEmotion' as const,
      actorId: targetActorId,
      emotion: 'awkward',
      intensity: 0.7,
    };

    const mutatedScene = applyMutation(originalScene, mutation);

    expect(mutatedScene.actors[2].emotionState).toBe('awkward');
    expect(mutatedScene.actors[0].emotionState).toBe('neutral'); // unchanged
    expect(mutatedScene.actors[1].emotionState).toBe('angry'); // unchanged
  });
});
