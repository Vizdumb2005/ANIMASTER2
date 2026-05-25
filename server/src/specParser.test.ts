import { describe, it, expect } from 'vitest';
import { SpecParser } from '../../shared/src/specParser.js';
import { isOk, isErr } from '../../shared/src/result.js';

describe('SpecParser', () => {
  const validYaml = `
id: "scene_001"
version: 1
seed: 42
actors:
  - id: "actor_1"
    label: "Actor One"
    type: "humanoid"
    position:
      x: 100
      y: 200
    targetPosition: null
    emotionState: "neutral"
    currentAction: "idle"
    actionQueue:
      - "idle"
    joints:
      head: { x: 100, y: 150 }
      torso: { x: 100, y: 200 }
      leftArm: { x: 80, y: 200 }
      rightArm: { x: 120, y: 200 }
      leftLeg: { x: 90, y: 250 }
      rightLeg: { x: 110, y: 250 }
    actionElapsed: 0
environment:
  type: "indoor_room"
  backgroundColor: "#ffffff"
  floorColor: "#888888"
  wallColor: "#cccccc"
  width: 800
  height: 600
camera:
  x: 400
  y: 300
  zoom: 1
  mode: "static"
sessionHistory:
  - id: "sess_1"
    prompt: "A simple scene"
    createdAt: 1716634800000
cinematicGrammar:
  tone: "neutral"
  template:
    cameraMode: "static"
    spacingMultiplier: 1.0
    motionEnergyScale: 1.0
    pauseFrequency: 0.5
    contrastBoost: 1.0
    headroom: 0.2
atmosphere:
  effects:
    - "none"
  lightingTint: "#ffffff"
  ambientIntensity: 0.5
relationships:
  - actorAId: "actor_1"
    actorBId: "actor_1"
    type: "stranger"
    awarenessRadius: 5
    gazeTarget: null
    emotionalReaction: null
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"
`;

  it('should parse valid YAML spec into a SceneGraph successfully', () => {
    const result = SpecParser.parse(validYaml);
    expect(isOk(result)).toBe(true);
    if (isOk(result)) {
      const graph = result.value;
      
      // Top-level fields
      expect(graph.id).toBe('scene_001');
      expect(graph.version).toBe(1);
      expect(graph.seed).toBe(42);
      
      // Actors
      expect(graph.actors).toHaveLength(1);
      const actor = graph.actors[0];
      expect(actor.id).toBe('actor_1');
      expect(actor.label).toBe('Actor One');
      expect(actor.type).toBe('humanoid');
      expect(actor.position).toEqual({ x: 100, y: 200 });
      expect(actor.targetPosition).toBeNull();
      expect(actor.emotionState).toBe('neutral');
      expect(actor.currentAction).toBe('idle');
      expect(actor.actionQueue).toEqual(['idle']);
      expect(actor.joints).toEqual({
        head: { x: 100, y: 150 },
        torso: { x: 100, y: 200 },
        leftArm: { x: 80, y: 200 },
        rightArm: { x: 120, y: 200 },
        leftLeg: { x: 90, y: 250 },
        rightLeg: { x: 110, y: 250 },
      });
      expect(actor.actionElapsed).toBe(0);

      // Environment
      expect(graph.environment.type).toBe('indoor_room');
      expect(graph.environment.backgroundColor).toBe('#ffffff');
      expect(graph.environment.floorColor).toBe('#888888');
      expect(graph.environment.wallColor).toBe('#cccccc');
      expect(graph.environment.width).toBe(800);
      expect(graph.environment.height).toBe(600);

      // Camera
      expect(graph.camera.x).toBe(400);
      expect(graph.camera.y).toBe(300);
      expect(graph.camera.zoom).toBe(1);
      expect(graph.camera.mode).toBe('static');

      // Session History
      expect(graph.sessionHistory).toHaveLength(1);
      const session = graph.sessionHistory[0];
      expect(session.id).toBe('sess_1');
      expect(session.prompt).toBe('A simple scene');
      expect(session.createdAt).toBe(1716634800000);

      // Cinematic Grammar
      expect(graph.cinematicGrammar.tone).toBe('neutral');
      expect(graph.cinematicGrammar.template).toEqual({
        cameraMode: 'static',
        spacingMultiplier: 1.0,
        motionEnergyScale: 1.0,
        pauseFrequency: 0.5,
        contrastBoost: 1.0,
        headroom: 0.2,
      });

      // Atmosphere
      expect(graph.atmosphere.effects).toEqual(['none']);
      expect(graph.atmosphere.lightingTint).toBe('#ffffff');
      expect(graph.atmosphere.ambientIntensity).toBe(0.5);

      // Relationships
      expect(graph.relationships).toHaveLength(1);
      const rel = graph.relationships[0];
      expect(rel.actorAId).toBe('actor_1');
      expect(rel.actorBId).toBe('actor_1');
      expect(rel.type).toBe('stranger');
      expect(rel.awarenessRadius).toBe(5);
      expect(rel.gazeTarget).toBeNull();
      expect(rel.emotionalReaction).toBeNull();

      // Rhythm
      expect(graph.rhythm.tempo).toBe('medium');
      expect(graph.rhythm.pauseFrequencyPerMinute).toBe(4);
      expect(graph.rhythm.motionEnergyCurve).toBe('linear');
    }
  });

  it('should collect syntax errors for invalid/malformed YAML', () => {
    const malformedYaml = `
id: "scene_001
version: 1
actors: [
`;
    const result = SpecParser.parse(malformedYaml);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      const errors = result.error;
      expect(errors.length).toBeGreaterThan(0);
      // All syntax errors carry SYNTAX_ERROR code
      expect(errors[0].code).toBe('SYNTAX_ERROR');
      // location is always a required object with line / column
      expect(errors[0].location).toBeDefined();
      expect(typeof errors[0].location.line).toBe('number');
      expect(typeof errors[0].location.column).toBe('number');
      // Syntax errors have a non-zero line because the YAML lib resolves them
      expect(errors[0].location.line).toBeGreaterThan(0);
    }
  });

  it('should collect schema validation errors and not stop at first error', () => {
    const invalidSchemaYaml = `
id: 12345 # Should be string
version: "v1" # Should be number
seed: "abc" # Should be number
environment:
  type: 123 # Should be string
  width: "wide" # Should be number
camera:
  mode: "dramatic_zoom" # valid
  # x, y, zoom are missing
`;
    const result = SpecParser.parse(invalidSchemaYaml);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      const errors = result.error;
      // We should have errors for: id, version, seed, actors missing,
      // environment type/width, camera x/y/zoom, sessionHistory missing, etc.
      expect(errors.length).toBeGreaterThan(3);

      const idError = errors.find(e => e.context === 'id');
      expect(idError).toBeDefined();
      expect(idError?.code).toBe('OUT_OF_RANGE');
      expect(idError?.message).toContain('must be a string');

      const versionError = errors.find(e => e.context === 'version');
      expect(versionError).toBeDefined();
      expect(versionError?.code).toBe('OUT_OF_RANGE');
      expect(versionError?.message).toContain('must be a number');

      const seedError = errors.find(e => e.context === 'seed');
      expect(seedError).toBeDefined();
      expect(seedError?.code).toBe('OUT_OF_RANGE');
      expect(seedError?.message).toContain('must be a number');

      const actorsError = errors.find(e => e.context === 'actors');
      expect(actorsError).toBeDefined();
      expect(actorsError?.code).toBe('MISSING_REQUIRED');
      expect(actorsError?.message).toContain('is required');

      const envTypeError = errors.find(e => e.context === 'environment.type');
      expect(envTypeError).toBeDefined();
      expect(envTypeError?.code).toBe('OUT_OF_RANGE');
      expect(envTypeError?.message).toContain('must be a string');

      const envWidthError = errors.find(e => e.context === 'environment.width');
      expect(envWidthError).toBeDefined();
      expect(envWidthError?.code).toBe('OUT_OF_RANGE');
      expect(envWidthError?.message).toContain('must be a number');

      const cameraXError = errors.find(e => e.context === 'camera.x');
      expect(cameraXError).toBeDefined();
      expect(cameraXError?.code).toBe('MISSING_REQUIRED');
      expect(cameraXError?.message).toContain('is required');

      // location is always a well-formed object
      expect(idError?.location).toBeDefined();
      expect(typeof idError?.location.line).toBe('number');
      expect(typeof idError?.location.column).toBe('number');
      // The `id` field is present in the doc (wrong type) — line should be resolved
      expect(idError?.location.line).toBeGreaterThan(0);
    }
  });

  it('should validate actors schema constraints', () => {
    const invalidActorsYaml = `
id: "scene_002"
version: 1
actors:
  - id: 999 # Should be string
    label: "Actor"
    type: "alien" # Should be humanoid
    position:
      x: "100" # Should be number
    # targetPosition missing
    emotionState: "super_happy" # invalid emotion
    currentAction: "flying" # invalid action
    actionQueue:
      - "flying" # invalid action queue entry
    joints:
      head: { x: 100, y: 150 }
      # torso, arms, legs missing
    actionElapsed: "none" # Should be number
environment:
  type: "indoor_room"
  backgroundColor: "#ffffff"
  floorColor: "#888888"
  wallColor: "#cccccc"
  width: 800
  height: 600
camera:
  x: 400
  y: 300
  zoom: 1
  mode: "static"
sessionHistory: []
cinematicGrammar:
  tone: "neutral"
  template:
    cameraMode: "static"
    spacingMultiplier: 1.0
    motionEnergyScale: 1.0
    pauseFrequency: 0.5
    contrastBoost: 1.0
    headroom: 0.2
atmosphere:
  effects: []
  lightingTint: "#ffffff"
  ambientIntensity: 0.5
relationships: []
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"
`;
    const result = SpecParser.parse(invalidActorsYaml);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      const errors = result.error;

      const typeError = errors.find(e => e.context === 'actors[0].type');
      expect(typeError).toBeDefined();
      expect(typeError?.code).toBe('OUT_OF_RANGE');
      expect(typeError?.message).toContain("must be 'humanoid'");

      const posXError = errors.find(e => e.context === 'actors[0].position.x');
      expect(posXError).toBeDefined();
      expect(posXError?.code).toBe('OUT_OF_RANGE');
      expect(posXError?.message).toContain('must be a number');

      const posYError = errors.find(e => e.context === 'actors[0].position.y');
      expect(posYError).toBeDefined();
      expect(posYError?.code).toBe('MISSING_REQUIRED');
      expect(posYError?.message).toContain('is required');

      const targetPosError = errors.find(
        e => e.context === 'actors[0].targetPosition',
      );
      expect(targetPosError).toBeDefined();
      expect(targetPosError?.code).toBe('MISSING_REQUIRED');
      expect(targetPosError?.message).toContain('is required');

      const emotionError = errors.find(
        e => e.context === 'actors[0].emotionState',
      );
      expect(emotionError).toBeDefined();
      expect(emotionError?.code).toBe('OUT_OF_RANGE');
      expect(emotionError?.message).toContain('must be one of');

      const actionError = errors.find(
        e => e.context === 'actors[0].currentAction',
      );
      expect(actionError).toBeDefined();
      expect(actionError?.code).toBe('OUT_OF_RANGE');
      expect(actionError?.message).toContain('must be one of');

      const queueError = errors.find(
        e => e.context === 'actors[0].actionQueue[0]',
      );
      expect(queueError).toBeDefined();
      expect(queueError?.code).toBe('OUT_OF_RANGE');
      expect(queueError?.message).toContain('must be one of');

      const jointsTorsoError = errors.find(
        e => e.context === 'actors[0].joints.torso',
      );
      expect(jointsTorsoError).toBeDefined();
      expect(jointsTorsoError?.code).toBe('MISSING_REQUIRED');
      expect(jointsTorsoError?.message).toContain('is required in joints');

      const elapsedError = errors.find(
        e => e.context === 'actors[0].actionElapsed',
      );
      expect(elapsedError).toBeDefined();
      expect(elapsedError?.code).toBe('OUT_OF_RANGE');
      expect(elapsedError?.message).toContain('must be a number');
    }
  });

  it('should validate relationship constraints', () => {
    const invalidRelationshipsYaml = `
id: "scene_003"
version: 1
actors: []
environment:
  type: "indoor_room"
  backgroundColor: "#ffffff"
  floorColor: "#888888"
  wallColor: "#cccccc"
  width: 800
  height: 600
camera:
  x: 400
  y: 300
  zoom: 1
  mode: "static"
sessionHistory: []
cinematicGrammar:
  tone: "neutral"
  template:
    cameraMode: "static"
    spacingMultiplier: 1.0
    motionEnergyScale: 1.0
    pauseFrequency: 0.5
    contrastBoost: 1.0
    headroom: 0.2
atmosphere:
  effects: []
  lightingTint: "#ffffff"
  ambientIntensity: 0.5
relationships:
  - actorAId: 100 # Should be string
    actorBId: "actor_2"
    type: "enemies" # invalid relationship type
    awarenessRadius: "large" # Should be number
    gazeTarget: 123 # Should be string or null
    emotionalReaction: "confused" # invalid emotion
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"
`;
    const result = SpecParser.parse(invalidRelationshipsYaml);
    expect(isErr(result)).toBe(true);
    if (isErr(result)) {
      const errors = result.error;

      const actorAError = errors.find(
        e => e.context === 'relationships[0].actorAId',
      );
      expect(actorAError).toBeDefined();
      expect(actorAError?.code).toBe('OUT_OF_RANGE');
      expect(actorAError?.message).toContain('must be a string');

      const typeError = errors.find(
        e => e.context === 'relationships[0].type',
      );
      expect(typeError).toBeDefined();
      expect(typeError?.code).toBe('OUT_OF_RANGE');
      expect(typeError?.message).toContain('must be one of');

      const radiusError = errors.find(
        e => e.context === 'relationships[0].awarenessRadius',
      );
      expect(radiusError).toBeDefined();
      expect(radiusError?.code).toBe('OUT_OF_RANGE');
      expect(radiusError?.message).toContain('must be a number');

      const gazeError = errors.find(
        e => e.context === 'relationships[0].gazeTarget',
      );
      expect(gazeError).toBeDefined();
      expect(gazeError?.code).toBe('OUT_OF_RANGE');
      expect(gazeError?.message).toContain('must be string or null');

      const emotionError = errors.find(
        e => e.context === 'relationships[0].emotionalReaction',
      );
      expect(emotionError).toBeDefined();
      expect(emotionError?.code).toBe('OUT_OF_RANGE');
      expect(emotionError?.message).toContain('must be null or one of');
    }
  });

  it('should collect and report 5 distinct error types correctly', () => {
    // 1. Syntax Error (parse a malformed YAML document)
    const malformedYaml = `
id: "scene_001
version: 1
`;
    const result1 = SpecParser.parse(malformedYaml);
    expect(isErr(result1)).toBe(true);
    if (isErr(result1)) {
      expect(result1.error.some(e => e.code === 'SYNTAX_ERROR')).toBe(true);
    }

    // 2. Schema Validation Errors (Missing Required, Out of Range (numeric), Out of Range (enum), Undefined Reference)
    const invalidYaml = `
version: -1                      # Out of Range (numeric: must be >= 0)
actors:
  - id: "actor_1"
    label: "Actor One"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "super_happy"  # Out of Range (enum: invalid emotion)
    currentAction: "idle"
    actionQueue: ["idle"]
    joints:
      head: { x: 100, y: 150 }
      torso: { x: 100, y: 200 }
      leftArm: { x: 80, y: 200 }
      rightArm: { x: 120, y: 200 }
      leftLeg: { x: 90, y: 250 }
      rightLeg: { x: 110, y: 250 }
    actionElapsed: 0
environment:
  type: "indoor_room"
  backgroundColor: "#ffffff"
  floorColor: "#888888"
  wallColor: "#cccccc"
  width: 800
  height: 600
camera:
  x: 400
  y: 300
  zoom: 1
  mode: "static"
sessionHistory: []
cinematicGrammar:
  tone: "neutral"
  template:
    cameraMode: "static"
    spacingMultiplier: 1.0
    motionEnergyScale: 1.0
    pauseFrequency: 0.5
    contrastBoost: 1.0
    headroom: 0.2
atmosphere:
  effects: []
  lightingTint: "#ffffff"
  ambientIntensity: 0.5
relationships:
  - actorAId: "non_existent"     # Undefined Reference
    actorBId: "actor_1"
    type: "stranger"
    awarenessRadius: 5
    gazeTarget: null
    emotionalReaction: null
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"
`;
    // Note: 'id' is missing from the above YAML (Missing Required)
    const result2 = SpecParser.parse(invalidYaml);
    expect(isErr(result2)).toBe(true);
    if (isErr(result2)) {
      const errors = result2.error;

      // Let's verify each distinct error code is reported correctly
      const missingRequired = errors.filter(e => e.code === 'MISSING_REQUIRED');
      const outOfRange = errors.filter(e => e.code === 'OUT_OF_RANGE');
      const undefinedRef = errors.filter(e => e.code === 'UNDEFINED_REFERENCE');

      // Verify MISSING_REQUIRED code
      expect(missingRequired.length).toBeGreaterThan(0);
      expect(missingRequired.some(e => e.context === 'id')).toBe(true);

      // Verify OUT_OF_RANGE code (numeric violation)
      expect(outOfRange.some(e => e.context === 'version' && e.message.includes('must be at least 0'))).toBe(true);

      // Verify OUT_OF_RANGE code (enum violation)
      expect(outOfRange.some(e => e.context === 'actors[0].emotionState' && e.message.includes('must be one of'))).toBe(true);

      // Verify UNDEFINED_REFERENCE code
      expect(undefinedRef.length).toBeGreaterThan(0);
      expect(undefinedRef.some(e => e.context === 'relationships[0].actorAId')).toBe(true);
    }
  });

  it('should always return a well-formed ParseError shape', () => {
    // Even for totally empty input the shape must be correct
    const result = SpecParser.parse('');
    // Empty YAML parses to null, triggers root-object check
    if (isErr(result)) {
      for (const e of result.error) {
        expect(typeof e.code).toBe('string');
        expect(['SYNTAX_ERROR', 'MISSING_REQUIRED', 'OUT_OF_RANGE', 'UNDEFINED_REFERENCE']).toContain(e.code);
        expect(e.location).toBeDefined();
        expect(typeof e.location.line).toBe('number');
        expect(typeof e.location.column).toBe('number');
        expect(typeof e.message).toBe('string');
      }
    }
  });
});
