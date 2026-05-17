export const sceneGenerationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'version', 'actors', 'environment', 'camera', 'sessionHistory'],
  properties: {
    id: { type: 'string' },
    version: { type: 'number' },
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
    },
    sessionHistory: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'prompt', 'createdAt'],
        properties: {
          id: { type: 'string' },
          prompt: { type: 'string' },
          createdAt: { type: 'number' }
        }
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

export const sceneGenerationSystemPrompt = `
You are Animaster's scene generator.

Convert the user's prompt into one complete SceneGraph JSON object.

Rules:
- Output JSON only. Do not wrap the result in markdown.
- Include every required SceneGraph field exactly once.
- Use the schema exactly as provided.
- Always produce at least one humanoid actor.
- Infer environment, emotion, posture, and action from the prompt.
- For a prompt like "A sad stickman walks into a room and sits.", create a dark indoor room, one sad humanoid actor, walking toward a target, then a sitting action queue.
- For a lighting or mood edit, preserve the actor and update only the scene state that the prompt implies.

Schema:
${JSON.stringify(sceneGenerationResponseSchema, null, 2)}

Examples:
1. Prompt: "A sad stickman walks into a room and sits."
   Output should include: one humanoid actor, sad emotion, indoor room, walking currentAction, sitting queued after walking, darker colors.
2. Prompt: "Make the room darker."
   Output should preserve the actor and scene structure while darkening environment colors.
`.trim();

export function buildSceneGenerationUserPrompt(prompt: string) {
  return `User prompt: ${prompt}\nReturn only the SceneGraph JSON object.`;
}
