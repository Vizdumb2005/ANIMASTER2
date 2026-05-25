import { describe, it, expect } from 'vitest';
import { SpecParser } from '../../shared/src/specParser.js';
import { SpecPrinter } from '../../shared/src/specPrinter.js';
import { isOk, isErr } from '../../shared/src/result.js';
import { SceneGraph } from '../../shared/src/scene.js';

describe('SpecPrinter', () => {
  const sampleGraph: SceneGraph = {
    id: "scene_123",
    version: 1,
    seed: 100,
    actors: [
      {
        id: "actor_1",
        label: "Stickman One",
        type: "humanoid",
        position: { x: 50, y: 150 },
        targetPosition: null,
        emotionState: "happy",
        currentAction: "idle",
        actionQueue: ["idle"],
        joints: {
          head: { x: 50, y: 100 },
          torso: { x: 50, y: 150 },
          leftArm: { x: 30, y: 150 },
          rightArm: { x: 70, y: 150 },
          leftLeg: { x: 40, y: 200 },
          rightLeg: { x: 60, y: 200 }
        },
        actionElapsed: 0
      }
    ],
    environment: {
      type: "diner",
      backgroundColor: "#000000",
      floorColor: "#111111",
      wallColor: "#222222",
      width: 1000,
      height: 800
    },
    camera: {
      x: 500,
      y: 400,
      zoom: 1.2,
      mode: "static"
    },
    sessionHistory: [
      {
        id: "session_0",
        prompt: "A diner scene",
        createdAt: 1716634800000
      }
    ],
    cinematicGrammar: {
      tone: "neutral",
      template: {
        cameraMode: "static",
        spacingMultiplier: 1.2,
        motionEnergyScale: 0.8,
        pauseFrequency: 0.1,
        contrastBoost: 1.1,
        headroom: 0.3
      }
    },
    atmosphere: {
      effects: ["flicker"],
      lightingTint: "#ffeedd",
      ambientIntensity: 0.4
    },
    relationships: [],
    rhythm: {
      tempo: "slow",
      pauseFrequencyPerMinute: 6,
      motionEnergyCurve: "ease-in"
    }
  };

  it('should serialize a SceneGraph deterministically', () => {
    const yaml1 = SpecPrinter.print(sampleGraph);
    const yaml2 = SpecPrinter.print(sampleGraph);
    expect(yaml1).toBe(yaml2);
  });

  it('should serialize to canonical order regardless of source key insertion order', () => {
    // Reordered properties in graph
    const reorderedGraph: SceneGraph = {
      version: 1,
      id: "scene_123",
      actors: [
        {
          label: "Stickman One",
          id: "actor_1",
          type: "humanoid",
          targetPosition: null,
          position: { y: 150, x: 50 },
          actionQueue: ["idle"],
          emotionState: "happy",
          currentAction: "idle",
          joints: {
            torso: { x: 50, y: 150 },
            head: { x: 50, y: 100 },
            leftArm: { x: 30, y: 150 },
            rightArm: { x: 70, y: 150 },
            leftLeg: { x: 40, y: 200 },
            rightLeg: { x: 60, y: 200 }
          },
          actionElapsed: 0
        }
      ],
      seed: 100,
      environment: {
        backgroundColor: "#000000",
        type: "diner",
        floorColor: "#111111",
        wallColor: "#222222",
        width: 1000,
        height: 800
      },
      camera: {
        zoom: 1.2,
        x: 500,
        y: 400,
        mode: "static"
      },
      sessionHistory: [
        {
          prompt: "A diner scene",
          id: "session_0",
          createdAt: 1716634800000
        }
      ],
      cinematicGrammar: {
        template: {
          spacingMultiplier: 1.2,
          cameraMode: "static",
          motionEnergyScale: 0.8,
          pauseFrequency: 0.1,
          contrastBoost: 1.1,
          headroom: 0.3
        },
        tone: "neutral"
      },
      atmosphere: {
        lightingTint: "#ffeedd",
        effects: ["flicker"],
        ambientIntensity: 0.4
      },
      relationships: [],
      rhythm: {
        tempo: "slow",
        pauseFrequencyPerMinute: 6,
        motionEnergyCurve: "ease-in"
      }
    };

    const yaml1 = SpecPrinter.print(sampleGraph);
    const yaml2 = SpecPrinter.print(reorderedGraph);
    expect(yaml1).toBe(yaml2);
  });

  it('should round-trip: print and then parse back into identical graph data structure', () => {
    const yaml = SpecPrinter.print(sampleGraph);
    const parseResult = SpecParser.parse(yaml);
    
    expect(isOk(parseResult)).toBe(true);
    if (isOk(parseResult)) {
      expect(parseResult.value.id).toBe(sampleGraph.id);
      expect(parseResult.value.version).toBe(sampleGraph.version);
      expect(parseResult.value.seed).toBe(sampleGraph.seed);
      expect(parseResult.value.environment).toEqual(sampleGraph.environment);
      expect(parseResult.value.camera).toEqual(sampleGraph.camera);
      expect(parseResult.value.actors[0].id).toBe(sampleGraph.actors[0].id);
      expect(parseResult.value.actors[0].joints).toEqual(sampleGraph.actors[0].joints);
      expect(parseResult.value.cinematicGrammar).toEqual(sampleGraph.cinematicGrammar);
      expect(parseResult.value.atmosphere).toEqual(sampleGraph.atmosphere);
      expect(parseResult.value.rhythm).toEqual(sampleGraph.rhythm);
    }
  });
});
