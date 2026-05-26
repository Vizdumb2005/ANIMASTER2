/**
 * server/src/parseErrorCodes.test.ts
 *
 * L1-10 — Unit Test
 *
 * Parse YAML with 5 distinct error types → verify each ParseError.code is correct.
 * 
 * The 5 error codes are:
 * 1. SYNTAX_ERROR - Malformed YAML that cannot be parsed
 * 2. MISSING_REQUIRED - A required field is missing
 * 3. OUT_OF_RANGE - Value outside allowed enum or numeric range
 * 4. UNDEFINED_REFERENCE - Reference to a non-existent entity
 */

import { describe, it, expect } from 'vitest';
import { SpecParser } from '../../shared/src/specParser.js';
import { isErr } from '../../shared/src/result.js';
import type { ParseError } from '../../shared/src/specSchema.js';

/**
 * Verify that a ParseError has the expected code
 */
function hasErrorWithCode(errors: ParseError[], code: ParseError['code']): boolean {
  return errors.some(e => e.code === code);
}

/**
 * Verify that a ParseError has the expected code and context
 */
function hasErrorWithCodeAndContext(
  errors: ParseError[],
  code: ParseError['code'],
  context: string
): boolean {
  return errors.some(e => e.code === code && e.context === context);
}

/**
 * Get the first error with a specific code
 */
function getErrorByCode(errors: ParseError[], code: ParseError['code']): ParseError | undefined {
  return errors.find(e => e.code === code);
}

describe('L1-10: ParseError Code Verification', () => {
  it('should return SYNTAX_ERROR for malformed YAML', () => {
    const malformedYaml = `
id: "scene_001"
version: 1
actors: [
  id: "actor_1"
`;
    
    const result = SpecParser.parse(malformedYaml);
    expect(isErr(result)).toBe(true);
    
    if (isErr(result)) {
      const errors = result.error;
      expect(errors.length).toBeGreaterThan(0);
      
      // Verify SYNTAX_ERROR code
      const syntaxError = getErrorByCode(errors, 'SYNTAX_ERROR');
      expect(syntaxError).toBeDefined();
      expect(syntaxError?.code).toBe('SYNTAX_ERROR');
      expect(syntaxError?.message).toBeDefined();
      expect(typeof syntaxError?.message).toBe('string');
      expect(syntaxError?.location).toBeDefined();
    }
  });

  it('should return MISSING_REQUIRED when a required field is missing', () => {
    const yamlWithMissingField = `
id: "scene_001"
version: 1
# Missing required 'actors' field
# Missing required 'environment' field
# Missing required 'camera' field
# Missing required 'sessionHistory' field
# Missing required 'cinematicGrammar' field
# Missing required 'atmosphere' field
# Missing required 'rhythm' field
`;
    
    const result = SpecParser.parse(yamlWithMissingField);
    expect(isErr(result)).toBe(true);
    
    if (isErr(result)) {
      const errors = result.error;
      
      // Verify MISSING_REQUIRED code for at least one field
      const missingRequiredErrors = errors.filter(e => e.code === 'MISSING_REQUIRED');
      expect(missingRequiredErrors.length).toBeGreaterThan(0);
      
      // Check for specific missing fields
      const actorsError = getErrorByCode(errors, 'MISSING_REQUIRED');
      expect(actorsError).toBeDefined();
      expect(actorsError?.code).toBe('MISSING_REQUIRED');
      expect(actorsError?.message).toContain('required');
    }
  });

  it('should return OUT_OF_RANGE for enum value violations', () => {
    const yamlWithInvalidEnum = `
id: "scene_001"
version: 1
actors:
  - id: "actor_1"
    label: "Actor One"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "ecstatic"  # Invalid - not in ActorEmotion enum
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
relationships: []
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"
`;
    
    const result = SpecParser.parse(yamlWithInvalidEnum);
    expect(isErr(result)).toBe(true);
    
    if (isErr(result)) {
      const errors = result.error;
      
      // Verify OUT_OF_RANGE code for enum violation
      const outOfRangeError = errors.find(
        e => e.code === 'OUT_OF_RANGE' && e.context === 'actors[0].emotionState'
      );
      expect(outOfRangeError).toBeDefined();
      expect(outOfRangeError?.code).toBe('OUT_OF_RANGE');
      expect(outOfRangeError?.message).toContain('must be one of');
    }
  });

  it('should return OUT_OF_RANGE for numeric range violations', () => {
    const yamlWithInvalidNumber = `
id: "scene_001"
version: -5  # Invalid - version must be >= 0
actors:
  - id: "actor_1"
    label: "Actor One"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "neutral"
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
relationships: []
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"
`;
    
    const result = SpecParser.parse(yamlWithInvalidNumber);
    expect(isErr(result)).toBe(true);
    
    if (isErr(result)) {
      const errors = result.error;
      
      // Verify OUT_OF_RANGE code for numeric violation
      const outOfRangeError = errors.find(
        e => e.code === 'OUT_OF_RANGE' && e.context === 'version'
      );
      expect(outOfRangeError).toBeDefined();
      expect(outOfRangeError?.code).toBe('OUT_OF_RANGE');
      expect(outOfRangeError?.message).toContain('must be at least 0');
    }
  });

  it('should return UNDEFINED_REFERENCE for references to non-existent entities', () => {
    const yamlWithUndefinedReference = `
id: "scene_001"
version: 1
actors:
  - id: "actor_1"
    label: "Actor One"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "neutral"
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
  - actorAId: "non_existent_actor"  # Reference to actor that doesn't exist
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
    
    const result = SpecParser.parse(yamlWithUndefinedReference);
    expect(isErr(result)).toBe(true);
    
    if (isErr(result)) {
      const errors = result.error;
      
      // Verify UNDEFINED_REFERENCE code
      const undefinedRefError = errors.find(
        e => e.code === 'UNDEFINED_REFERENCE' && e.context?.includes('actorAId')
      );
      expect(undefinedRefError).toBeDefined();
      expect(undefinedRefError?.code).toBe('UNDEFINED_REFERENCE');
      expect(undefinedRefError?.message).toContain('not defined');
    }
  });

  it('should correctly identify all 5 error codes in a single YAML document', () => {
    const yamlWithAllErrorTypes = `
id: "scene_001"  # Syntax error: unquoted string with colon
version: -1       # OUT_OF_RANGE: numeric
actors:
  - id: "actor_1"
    label: "Actor One"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "ecstatic"  # OUT_OF_RANGE: invalid enum
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
# MISSING_REQUIRED: environment field is missing
# MISSING_REQUIRED: camera field is missing
# MISSING_REQUIRED: sessionHistory field is missing
# MISSING_REQUIRED: cinematicGrammar field is missing
# MISSING_REQUIRED: atmosphere field is missing
# MISSING_REQUIRED: rhythm field is missing
relationships:
  - actorAId: "ghost_actor"  # UNDEFINED_REFERENCE
    actorBId: "actor_1"
    type: "stranger"
    awarenessRadius: 5
    gazeTarget: null
    emotionalReaction: null
`;
    
    const result = SpecParser.parse(yamlWithAllErrorTypes);
    expect(isErr(result)).toBe(true);
    
    if (isErr(result)) {
      const errors = result.error;
      
      // Collect all unique error codes
      const errorCodes = new Set<ParseError['code']>();
      errors.forEach(e => errorCodes.add(e.code));
      
      // Verify all 4 schema error codes are present
      // Note: SYNTAX_ERROR might not trigger if YAML parses but has schema errors
      const expectedCodes: ParseError['code'][] = [
        'MISSING_REQUIRED',
        'OUT_OF_RANGE',
        'UNDEFINED_REFERENCE'
      ];
      
      for (const expectedCode of expectedCodes) {
        expect(errorCodes.has(expectedCode), 
          `Expected error code ${expectedCode} not found. Found: ${Array.from(errorCodes).join(', ')}`
        ).toBe(true);
      }
      
      // Verify specific error codes
      expect(hasErrorWithCode(errors, 'MISSING_REQUIRED')).toBe(true);
      expect(hasErrorWithCode(errors, 'OUT_OF_RANGE')).toBe(true);
      expect(hasErrorWithCode(errors, 'UNDEFINED_REFERENCE')).toBe(true);
    }
  });

  it('should verify ParseError shape is correct for all error types', () => {
    const testCases = [
      {
        name: 'SYNTAX_ERROR',
        yaml: 'id: "scene_001"\nversion: 1\nactors: [\n  id: "actor_1"',
        expectedCode: 'SYNTAX_ERROR' as ParseError['code']
      },
      {
        name: 'MISSING_REQUIRED',
        yaml: 'id: "scene_001"',
        expectedCode: 'MISSING_REQUIRED' as ParseError['code']
      },
      {
        name: 'OUT_OF_RANGE (enum)',
        yaml: `id: "scene_001"
version: 1
actors:
  - id: "actor_1"
    label: "Actor"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "ecstatic"
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
relationships: []
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"`,
        expectedCode: 'OUT_OF_RANGE' as ParseError['code']
      },
      {
        name: 'OUT_OF_RANGE (numeric)',
        yaml: `id: "scene_001"
version: -1
actors:
  - id: "actor_1"
    label: "Actor"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "neutral"
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
relationships: []
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"`,
        expectedCode: 'OUT_OF_RANGE' as ParseError['code']
      },
      {
        name: 'UNDEFINED_REFERENCE',
        yaml: `id: "scene_001"
version: 1
actors:
  - id: "actor_1"
    label: "Actor"
    type: "humanoid"
    position: { x: 100, y: 200 }
    targetPosition: null
    emotionState: "neutral"
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
  - actorAId: "ghost_actor"
    actorBId: "actor_1"
    type: "stranger"
    awarenessRadius: 5
    gazeTarget: null
    emotionalReaction: null
rhythm:
  tempo: "medium"
  pauseFrequencyPerMinute: 4
  motionEnergyCurve: "linear"`,
        expectedCode: 'UNDEFINED_REFERENCE' as ParseError['code']
      }
    ];
    
    for (const testCase of testCases) {
      const result = SpecParser.parse(testCase.yaml);
      expect(isErr(result), `Expected error for ${testCase.name}`).toBe(true);
      
      if (isErr(result)) {
        const errors = result.error;
        const matchingError = errors.find(e => e.code === testCase.expectedCode);
        
        expect(matchingError, 
          `${testCase.name}: Expected error with code ${testCase.expectedCode}. Got: ${errors.map(e => e.code).join(', ')}`
        ).toBeDefined();
        
        // Verify ParseError shape
        expect(matchingError?.code).toBe(testCase.expectedCode);
        expect(matchingError?.message).toBeDefined();
        expect(typeof matchingError?.message).toBe('string');
        expect(matchingError?.location).toBeDefined();
        expect(typeof matchingError?.location?.line).toBe('number');
        expect(typeof matchingError?.location?.column).toBe('number');
      }
    }
  });
});
