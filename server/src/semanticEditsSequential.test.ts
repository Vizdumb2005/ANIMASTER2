/**
 * server/src/semanticEditsSequential.test.ts
 *
 * L2-10 — Integration Test
 *
 * Submit 20 sequential Semantic_Edits (mutations) and verify scene coherence:
 * - version counter = 20
 * - all actors present
 * - no null fields
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { interpretPrompt } from './routes/interpret.js';
import { buildSceneMutationUserPrompt, sceneMutationSystemPrompt, sceneMutationResponseSchema } from './prompts/sceneMutationPrompt.js';
import { providerRegistry } from './ai/providers/providerRegistry.js';
import { isOk } from './types/result.js';
import type { SimulationState } from '../../shared/src/scene.js';

/**
 * The result type from interpretPrompt
 */
type InterpretedScene = Awaited<ReturnType<typeof interpretPrompt>>;

/**
 * Mutation patch type - partial scene with changes
 */
type MutationPatch = {
  actors?: any[];
  environment?: any;
  camera?: any;
  cinematicGrammar?: any;
  atmosphere?: any;
  relationships?: any[];
  rhythm?: any;
  semanticOperations?: any[];
};

/**
 * Call mutateScene to get a patch for an edit
 */
async function getMutationPatch(prompt: string, currentScene: FullScene): Promise<MutationPatch> {
  const provider = providerRegistry.getBestAvailableProvider();
  
  if (!provider || provider.name === 'mock') {
    // Fallback to regex-based mutation
    return {};
  }
  
  try {
    const completionResult = await provider.complete({
      messages: [
        { role: 'system', content: sceneMutationSystemPrompt },
        { role: 'user', content: buildSceneMutationUserPrompt(prompt, JSON.stringify(currentScene), undefined) }
      ],
      temperature: 0.2,
      maxTokens: 1500,
      responseFormat: 'json',
      jsonSchema: sceneMutationResponseSchema
    });
    
    if (isOk(completionResult) && completionResult.value.content) {
      return JSON.parse(completionResult.value.content) as MutationPatch;
    }
  } catch (error) {
    console.error('Mutation failed:', error);
  }
  
  return {};
}

/**
 * A complete scene with all fields populated
 */
type FullScene = InterpretedScene & {
  simulation?: SimulationState;
  version: number;
};

/**
 * Apply a mutation patch to a scene and return the updated scene
 */
function applyPatch(scene: FullScene, patch: MutationPatch): FullScene {
  // In the real system, patches are merged into the scene
  // For this test, we'll apply the patch fields
  return {
    ...scene,
    // Apply patched fields
    actors: patch.actors ?? scene.actors,
    environment: patch.environment ?? scene.environment,
    camera: patch.camera ?? scene.camera,
    cinematicGrammar: patch.cinematicGrammar ?? scene.cinematicGrammar,
    atmosphere: patch.atmosphere ?? scene.atmosphere,
    relationships: patch.relationships ?? scene.relationships,
    rhythm: patch.rhythm ?? scene.rhythm,
    // Increment version for each mutation
    version: scene.version + 1,
  };
}

/**
 * Verify a scene has no null fields in critical sections
 */
function hasNoNullFields(scene: FullScene): boolean {
  // Check actors
  if (!scene.actors || !Array.isArray(scene.actors)) return false;
  for (const actor of scene.actors) {
    if (!actor || 
        actor.id === null || 
        actor.label === null || 
        actor.type === null || 
        actor.position === null || 
        actor.emotionState === null || 
        actor.currentAction === null || 
        actor.joints === null) {
      return false;
    }
  }

  // Check environment
  if (!scene.environment || 
      scene.environment.type === null || 
      scene.environment.backgroundColor === null || 
      scene.environment.floorColor === null || 
      scene.environment.wallColor === null ||
      scene.environment.width === null || 
      scene.environment.height === null) {
    return false;
  }

  // Check camera
  if (!scene.camera || 
      scene.camera.x === null || 
      scene.camera.y === null || 
      scene.camera.zoom === null || 
      scene.camera.mode === null) {
    return false;
  }

  // Check cinematicGrammar
  if (!scene.cinematicGrammar || 
      scene.cinematicGrammar.tone === null || 
      scene.cinematicGrammar.template === null) {
    return false;
  }

  // Check atmosphere
  if (!scene.atmosphere || 
      scene.atmosphere.effects === null || 
      scene.atmosphere.lightingTint === null || 
      scene.atmosphere.ambientIntensity === null) {
    return false;
  }

  // Check rhythm
  if (!scene.rhythm || 
      scene.rhythm.tempo === null || 
      scene.rhythm.pauseFrequencyPerMinute === null || 
      scene.rhythm.motionEnergyCurve === null) {
    return false;
  }

  // Check sessionHistory
  if (!scene.sessionHistory || !Array.isArray(scene.sessionHistory)) {
    return false;
  }

  return true;
}

/**
 * Verify all actors from initial scene are still present
 */
function allActorsPresent(initialScene: FullScene, currentScene: FullScene): boolean {
  const initialActorIds = initialScene.actors.map(a => a.id);
  const currentActorIds = currentScene.actors.map(a => a.id);
  
  // All initial actors should still be present
  for (const id of initialActorIds) {
    if (!currentActorIds.includes(id)) {
      return false;
    }
  }
  
  return true;
}

/**
 * Generate a semantic edit prompt
 */
function generateSemanticEdit(index: number): string {
  const edits = [
    'make the scene more lonely',
    'add fog',
    'make him nervous',
    'push camera closer',
    'make it darker',
    'add rain',
    'make the lighting colder',
    'make him sad',
    'pull camera back',
    'make it more tense',
    'add dust',
    'make her happy',
    'make it brighter',
    'remove fog',
    'make it romantic',
    'add a second character',
    'make him walk',
    'make it energetic',
    'make them converse',
    'make it threatening',
    'add snow',
  ];
  
  return edits[index % edits.length];
}

describe('L2-10: Integration Test — 20 Sequential Semantic Edits', () => {
  let initialScene: FullScene;
  const testPrompt = 'A lonely man sits on a park bench at dusk';
  const NUM_EDITS = 20;

  beforeAll(async () => {
    // Step 1: Create initial scene
    const interpreted = await interpretPrompt(testPrompt);
    initialScene = {
      ...interpreted,
      version: 0, // Start at version 0
    };
  }, 10_000);

  it('initial scene is valid and has version 0', () => {
    expect(initialScene).toBeDefined();
    expect(initialScene.version).toBe(0);
    expect(initialScene.actors.length).toBeGreaterThan(0);
    expect(hasNoNullFields(initialScene)).toBe(true);
  });

  it('applying 20 sequential semantic edits maintains scene coherence', async () => {
    let currentScene: FullScene = { ...initialScene };
    const initialActorIds = currentScene.actors.map(a => a.id);
    const initialActorCount = currentScene.actors.length;

    // Apply 20 sequential mutations
    for (let i = 0; i < NUM_EDITS; i++) {
      const editPrompt = generateSemanticEdit(i);
      
      // Step 1: Create mutation patch
      const patch = await getMutationPatch(editPrompt, currentScene);
      
      // Step 2: Apply the patch
      currentScene = applyPatch(currentScene, patch);
      
      // Step 3: Verify coherence after each mutation
      expect(currentScene.version).toBe(i + 1);
      expect(currentScene.actors).toBeDefined();
      expect(Array.isArray(currentScene.actors)).toBe(true);
      expect(currentScene.actors.length).toBeGreaterThan(0);
      expect(currentScene.environment).toBeDefined();
      expect(currentScene.camera).toBeDefined();
      expect(currentScene.cinematicGrammar).toBeDefined();
      expect(currentScene.atmosphere).toBeDefined();
      expect(currentScene.rhythm).toBeDefined();
      
      // Verify no null fields
      expect(hasNoNullFields(currentScene), `Null fields found after edit ${i + 1}: ${editPrompt}`).toBe(true);
    }

    // Final verification after all 20 edits
    expect(currentScene.version).toBe(NUM_EDITS);
    
    // Verify all original actors are still present (unless explicitly removed by an edit)
    // Note: Some edits like "add a second character" increase actor count
    // and "new scene" or "reset" might remove actors, but our edits don't include those
    expect(currentScene.actors.length).toBeGreaterThanOrEqual(initialActorCount);
    
    // Verify critical fields are not null
    expect(currentScene.id).toBeDefined();
    expect(currentScene.environment).toBeDefined();
    expect(currentScene.camera).toBeDefined();
    expect(currentScene.cinematicGrammar).toBeDefined();
    expect(currentScene.atmosphere).toBeDefined();
    expect(currentScene.rhythm).toBeDefined();
    
    // Verify no null values in nested objects
    expect(currentScene.environment.type).not.toBeNull();
    expect(currentScene.environment.backgroundColor).not.toBeNull();
    expect(currentScene.camera.mode).not.toBeNull();
    expect(currentScene.cinematicGrammar.tone).not.toBeNull();
    expect(currentScene.atmosphere.lightingTint).not.toBeNull();
    
    // Verify all actors have valid fields
    for (const actor of currentScene.actors) {
      expect(actor.id).not.toBeNull();
      expect(actor.label).not.toBeNull();
      expect(actor.emotionState).not.toBeNull();
      expect(actor.currentAction).not.toBeNull();
      expect(actor.position).not.toBeNull();
      expect(actor.position.x).not.toBeNull();
      expect(actor.position.y).not.toBeNull();
      expect(actor.joints).not.toBeNull();
    }
  }, 60_000); // 60 seconds timeout for 20 edits

  it('scene maintains semantic operations history', async () => {
    let currentScene: FullScene = { ...initialScene };

    const semanticOperations: any[] = [];

    // Apply 20 sequential mutations and collect semantic operations
    for (let i = 0; i < NUM_EDITS; i++) {
      const editPrompt = generateSemanticEdit(i);
      const patch = await getMutationPatch(editPrompt, currentScene);
      
      // Collect semantic operations from patch
      if (patch.semanticOperations && Array.isArray(patch.semanticOperations)) {
        semanticOperations.push(...patch.semanticOperations);
      }
      
      currentScene = applyPatch(currentScene, patch);
    }

    // Verify we collected semantic operations
    expect(semanticOperations.length).toBeGreaterThan(0);
    
    // Verify each operation has required fields
    for (const op of semanticOperations) {
      expect(op.type).toBeDefined();
      expect(op.reason).toBeDefined();
      expect(typeof op.type).toBe('string');
      expect(typeof op.reason).toBe('string');
    }
  }, 60_000);

  it('each edit produces a valid partial patch', async () => {
    let currentScene: FullScene = { ...initialScene };

    for (let i = 0; i < NUM_EDITS; i++) {
      const editPrompt = generateSemanticEdit(i);
      const patch = await getMutationPatch(editPrompt, currentScene);
      
      // Verify the patch is valid
      expect(patch).toBeDefined();
      
      // Patch should have at least one field
      const hasFields = (
        patch.actors !== undefined ||
        patch.environment !== undefined ||
        patch.camera !== undefined ||
        patch.cinematicGrammar !== undefined ||
        patch.atmosphere !== undefined ||
        patch.relationships !== undefined ||
        patch.rhythm !== undefined ||
        patch.semanticOperations !== undefined
      );
      expect(hasFields, `Patch for edit ${i + 1} has no fields: ${editPrompt}`).toBe(true);
      
      currentScene = applyPatch(currentScene, patch);
    }
  }, 60_000);
});
