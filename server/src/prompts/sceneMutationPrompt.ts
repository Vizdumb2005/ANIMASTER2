export const sceneMutationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['actors', 'environment', 'camera'],
  properties: {
    actors: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'label', 'type', 'position', 'targetPosition', 'emotionState', 'currentAction', 'actionQueue', 'joints', 'actionElapsed'],
        properties: {
          id: { type: 'string' },
          label: { type: 'string' },
          type: { const: 'humanoid' },
          position: {
            type: 'object',
            additionalProperties: false,
            required: ['x', 'y'],
            properties: {
              x: { type: 'number' },
              y: { type: 'number' }
            }
          },
          targetPosition: {
            anyOf: [
              {
                type: 'object',
                additionalProperties: false,
                required: ['x', 'y'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' }
                }
              },
              { type: 'null' }
            ]
          },
          emotionState: { enum: ['neutral', 'sad', 'happy', 'nervous'] },
          currentAction: { enum: ['idle', 'walking', 'sitting'] },
          actionQueue: {
            type: 'array',
            items: { enum: ['idle', 'walking', 'sitting'] }
          },
          joints: {
            type: 'object',
            additionalProperties: false,
            required: ['head', 'torso', 'leftArm', 'rightArm', 'leftLeg', 'rightLeg'],
            properties: {
              head: { $ref: '#/$defs/vector2' },
              torso: { $ref: '#/$defs/vector2' },
              leftArm: { $ref: '#/$defs/vector2' },
              rightArm: { $ref: '#/$defs/vector2' },
              leftLeg: { $ref: '#/$defs/vector2' },
              rightLeg: { $ref: '#/$defs/vector2' }
            }
          },
          actionElapsed: { type: 'number' }
        }
      }
    },
    environment: {
      type: 'object',
      additionalProperties: false,
      required: ['type', 'backgroundColor', 'floorColor', 'wallColor', 'width', 'height'],
      properties: {
        type: { type: 'string' },
        backgroundColor: { type: 'string' },
        floorColor: { type: 'string' },
        wallColor: { type: 'string' },
        width: { type: 'number' },
        height: { type: 'number' }
      }
    },
    camera: {
      type: 'object',
      additionalProperties: false,
      required: ['x', 'y', 'zoom', 'mode'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' },
        zoom: { type: 'number' },
        mode: { enum: ['static', 'follow'] }
      }
    }
  },
  $defs: {
    vector2: {
      type: 'object',
      additionalProperties: false,
      required: ['x', 'y'],
      properties: {
        x: { type: 'number' },
        y: { type: 'number' }
      }
    }
  }
} as const;

export const sceneMutationSystemPrompt = `
You are Animaster's scene mutation engine.

You receive the CURRENT scene state and a user edit instruction.
Return a COMPLETE scene patch that reflects the requested change.

Rules:
- Output JSON only. No markdown wrappers.
- The response must contain actors, environment, and camera fields.
- Preserve ALL existing actors, their positions, actions, and states unless the edit explicitly changes them.
- When the user says "make the room darker" or similar lighting edits, darken the environment colors but keep all actors unchanged.
- When the user says "make him nervous" or similar emotion edits, change only the referenced actor's emotionState.
- When the user says "add another character", append a new actor to the actors array while preserving all existing actors.
- When adding a new actor, give it a unique id (e.g. "actor_2"), a descriptive label, and place it at a different position from existing actors.
- New actors should default to idle action with empty actionQueue unless the prompt specifies otherwise.
- Keep joints consistent with actor position. Head is ~58px above position.y, torso ~30px above, arms ~28px to each side and ~10px above, legs ~18px to each side and ~42px below.
- Do NOT regenerate the entire scene. Only change what the edit instruction asks for.

Schema:
${JSON.stringify(sceneMutationResponseSchema, null, 2)}

Examples:

1. Edit: "Make the room darker."
   → Darken backgroundColor, floorColor, wallColor. Keep all actors exactly as they are.

2. Edit: "Make him nervous."
   → Change actors[0].emotionState to "nervous". Keep everything else unchanged.

3. Edit: "Add another character standing in the corner."
   → Keep existing actors, append new actor with id "actor_2", position at far right (e.g. x:800), idle action.

4. Edit: "Make the lighting warmer."
   → Shift environment colors toward warm tones (#2d1d12 style). Keep actors unchanged.
`.trim();

export function buildSceneMutationUserPrompt(prompt: string, currentScene: string) {
  return `Current scene state:\n${currentScene}\n\nUser edit instruction: ${prompt}\n\nReturn the complete patched scene JSON with actors, environment, and camera.`;
}
