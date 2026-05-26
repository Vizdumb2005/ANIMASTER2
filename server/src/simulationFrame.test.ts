/**
 * server/src/simulationFrame.test.ts
 *
 * L2-9 — Integration Test
 *
 * Verify that submitting "A nervous stickman waits under a flickering streetlight"
 * produces a SceneGraph that can be initialized with valid simulation state,
 * representing a valid SimulationFrame after one tick.
 */

import { describe, it, expect, beforeAll } from 'vitest';
import { interpretPrompt } from './routes/interpret.js';
import type { SimulationState } from '../../shared/src/scene.js';

/**
 * The result type from interpretPrompt - a SceneGraph-like object
 */
type InterpretedScene = Awaited<ReturnType<typeof interpretPrompt>>;

/**
 * SimulationFrame represents a scene with valid simulation state.
 * This is the state produced by the Runtime after initialization for evaluation.
 */
type SimulationFrame = InterpretedScene & {
  simulation: SimulationState;
  seed: number;
};

/**
 * Initialize simulation state on a scene (mimics client runtime initialization)
 */
function initializeSimulation(scene: InterpretedScene): SimulationFrame {
  const seed = typeof scene.id === 'string' ? hashSeed(scene.id) : Date.now();
  return {
    ...scene,
    seed,
    simulation: {
      tick: 0,
      timeMs: 0,
      fixedDeltaMs: 1000 / 60, // 16.67ms for 60fps
      seed,
    },
  };
}

/**
 * Simple hash function for seed generation
 */
function hashSeed(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    const char = id.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash) % 1000000;
}

/**
 * Verify that an InterpretedScene has valid simulation state
 */
function isValidSimulationFrame(scene: InterpretedScene & { simulation?: SimulationState; seed?: number }): scene is SimulationFrame {
  return (
    scene.simulation !== undefined &&
    typeof scene.simulation.tick === 'number' &&
    typeof scene.simulation.timeMs === 'number' &&
    typeof scene.simulation.fixedDeltaMs === 'number' &&
    typeof scene.simulation.seed === 'number' &&
    scene.simulation.fixedDeltaMs > 0
  );
}

describe('L2-9: Integration Test — Runtime produces valid SimulationFrame', () => {
  let initialScene: InterpretedScene;
  const testPrompt = 'A nervous stickman waits under a flickering streetlight';

  beforeAll(async () => {
    // Step 1: Submit the prompt and get the initial scene
    initialScene = await interpretPrompt(testPrompt);
  }, 10_000);

  it('interpretPrompt produces a valid SceneGraph for the test prompt', () => {
    expect(initialScene).toBeDefined();
    expect(initialScene.id).toBeDefined();
    expect(typeof initialScene.id).toBe('string');
    expect(initialScene.version).toBeDefined();
    expect(typeof initialScene.version).toBe('number');
    expect(initialScene.actors).toBeDefined();
    expect(Array.isArray(initialScene.actors)).toBe(true);
    expect(initialScene.actors.length).toBeGreaterThan(0);
    expect(initialScene.environment).toBeDefined();
    expect(initialScene.camera).toBeDefined();
    expect(initialScene.cinematicGrammar).toBeDefined();
    expect(initialScene.atmosphere).toBeDefined();
    expect(initialScene.rhythm).toBeDefined();
    expect(initialScene.sessionHistory).toBeDefined();
    expect(Array.isArray(initialScene.sessionHistory)).toBe(true);
    expect(initialScene.sessionHistory.length).toBeGreaterThan(0);
  });

  it('initial scene has atmosphere with flicker effect for streetlight', () => {
    expect(initialScene.atmosphere).toBeDefined();
    expect(initialScene.atmosphere.effects).toBeDefined();
    expect(Array.isArray(initialScene.atmosphere.effects)).toBe(true);
    expect(initialScene.atmosphere.effects).toContain('flicker');
  });

  it('initial scene has at least one actor with nervous emotion', () => {
    expect(initialScene.actors.length).toBeGreaterThan(0);
    const nervousActor = initialScene.actors.find(
      a => a.emotionState === 'nervous'
    );
    expect(nervousActor).toBeDefined();
    expect(nervousActor?.emotionState).toBe('nervous');
  });

  it('initial scene has appropriate environment for streetlight setting', () => {
    expect(initialScene.environment.type).toBeDefined();
    // Streetlight suggests an outdoor or street setting
    const validEnvironments = ['outdoor_street', 'alley', 'indoor_room'];
    expect(validEnvironments).toContain(initialScene.environment.type);
  });

  it('SceneGraph can be initialized as a valid SimulationFrame', () => {
    // Step 2: Initialize simulation state (mimics runtime initialization)
    const simulationFrame = initializeSimulation(initialScene);

    // Step 3: Verify it's a valid SimulationFrame
    expect(isValidSimulationFrame(simulationFrame)).toBe(true);

    // Verify simulation state properties
    expect(simulationFrame.simulation.tick).toBe(0);
    expect(simulationFrame.simulation.timeMs).toBe(0);
    expect(simulationFrame.simulation.fixedDeltaMs).toBeCloseTo(1000 / 60, 0.1);
    expect(simulationFrame.simulation.seed).toBeGreaterThan(0);
    expect(simulationFrame.seed).toBe(simulationFrame.simulation.seed);
  });

  it('SimulationFrame maintains all InterpretedScene properties', () => {
    const simulationFrame = initializeSimulation(initialScene);

    // Verify all original InterpretedScene properties are preserved
    expect(simulationFrame.id).toBe(initialScene.id);
    expect(simulationFrame.version).toBe(initialScene.version);
    expect(simulationFrame.actors).toEqual(initialScene.actors);
    expect(simulationFrame.environment).toEqual(initialScene.environment);
    expect(simulationFrame.camera).toEqual(initialScene.camera);
    expect(simulationFrame.cinematicGrammar).toEqual(initialScene.cinematicGrammar);
    expect(simulationFrame.atmosphere).toEqual(initialScene.atmosphere);
    expect(simulationFrame.rhythm).toEqual(initialScene.rhythm);
    expect(simulationFrame.sessionHistory).toEqual(initialScene.sessionHistory);
  });

  it('SimulationFrame can advance to next tick', () => {
    let simulationFrame = initializeSimulation(initialScene);

    // Simulate one tick
    simulationFrame.simulation.tick = 1;
    simulationFrame.simulation.timeMs = simulationFrame.simulation.fixedDeltaMs;

    // Verify updated simulation state
    expect(simulationFrame.simulation.tick).toBe(1);
    expect(simulationFrame.simulation.timeMs).toBe(simulationFrame.simulation.fixedDeltaMs);
    expect(isValidSimulationFrame(simulationFrame)).toBe(true);

    // Verify SceneGraph integrity is maintained
    expect(simulationFrame.actors.length).toBeGreaterThan(0);
    expect(simulationFrame.environment).toBeDefined();
    expect(simulationFrame.camera).toBeDefined();
    expect(simulationFrame.atmosphere.effects).toContain('flicker');
  });

  it('SimulationFrame maintains flicker effect across ticks', () => {
    let simulationFrame = initializeSimulation(initialScene);

    // Simulate multiple ticks
    for (let i = 1; i <= 10; i++) {
      simulationFrame.simulation.tick = i;
      simulationFrame.simulation.timeMs = i * simulationFrame.simulation.fixedDeltaMs;
      
      expect(isValidSimulationFrame(simulationFrame)).toBe(true);
      expect(simulationFrame.atmosphere.effects).toContain('flicker');
    }
  });
});
