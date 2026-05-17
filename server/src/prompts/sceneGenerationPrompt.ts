export const sceneGenerationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['id', 'version', 'actors', 'environment', 'camera', 'cinematicGrammar', 'atmosphere', 'relationships', 'rhythm', 'sessionHistory'],
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
          emotionState: { enum: ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'] },
          currentAction: { enum: ['idle', 'walking', 'sitting', 'approaching', 'pacing'] },
          actionQueue: {
            type: 'array',
            items: { enum: ['idle', 'walking', 'sitting', 'approaching', 'pacing'] }
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
        mode: { enum: ['static', 'follow', 'close_up', 'wide_shot', 'over_the_shoulder', 'dramatic_zoom', 'tension'] }
      }
    },
    cinematicGrammar: {
      type: 'object',
      additionalProperties: false,
      required: ['tone', 'template'],
      properties: {
        tone: { enum: ['neutral', 'sad', 'tense', 'lonely', 'awkward', 'energetic', 'romantic', 'threatening'] },
        template: {
          type: 'object',
          additionalProperties: false,
          required: ['cameraMode', 'spacingMultiplier', 'motionEnergyScale', 'pauseFrequency', 'contrastBoost', 'headroom'],
          properties: {
            cameraMode: { enum: ['static', 'follow', 'close_up', 'wide_shot', 'over_the_shoulder', 'dramatic_zoom', 'tension'] },
            spacingMultiplier: { type: 'number' },
            motionEnergyScale: { type: 'number' },
            pauseFrequency: { type: 'number' },
            contrastBoost: { type: 'number' },
            headroom: { type: 'number' }
          }
        }
      }
    },
    atmosphere: {
      type: 'object',
      additionalProperties: false,
      required: ['effects', 'lightingTint', 'ambientIntensity'],
      properties: {
        effects: { type: 'array', items: { enum: ['rain', 'fog', 'flicker', 'dust', 'none'] } },
        lightingTint: { type: 'string' },
        ambientIntensity: { type: 'number' }
      }
    },
    relationships: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['actorAId', 'actorBId', 'type', 'awarenessRadius', 'gazeTarget', 'emotionalReaction'],
        properties: {
          actorAId: { type: 'string' },
          actorBId: { type: 'string' },
          type: { enum: ['stranger', 'approaching', 'confronting', 'avoiding', 'conversing'] },
          awarenessRadius: { type: 'number' },
          gazeTarget: { anyOf: [{ type: 'string' }, { type: 'null' }] },
          emotionalReaction: { anyOf: [{ type: 'string' }, { type: 'null' }] }
        }
      }
    },
    rhythm: {
      type: 'object',
      additionalProperties: false,
      required: ['tempo', 'pauseFrequencyPerMinute', 'motionEnergyCurve'],
      properties: {
        tempo: { enum: ['slow', 'medium', 'fast'] },
        pauseFrequencyPerMinute: { type: 'number' },
        motionEnergyCurve: { enum: ['linear', 'ease-in', 'ease-out', 'sharp'] }
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
- IMPORTANT: When the prompt describes sequential actions (e.g. "walks and sits", "runs then jumps"), set currentAction to the FIRST action and populate actionQueue with the REMAINING actions in order. The runtime will automatically advance through the queue.
  - Example: "walks and sits" → currentAction: "walking", actionQueue: ["sitting"]
  - Example: "sits then walks" → currentAction: "sitting", actionQueue: ["walking"]
  - Example: "walks into a room and sits down" → currentAction: "walking", actionQueue: ["sitting"]
- If the prompt only describes one action, set currentAction to that action and leave actionQueue empty.
- When an actor is walking, always set targetPosition to a destination point. Use x:660 as a default right-side target.
- Keep joints consistent with actor position. Head is ~58px above position.y, torso ~30px above, arms ~28px to each side and ~10px above, legs ~18px to each side and ~42px below.
- Always include a sessionHistory entry with the user's prompt.

## Phase 2 Fields
- ALWAYS include cinematicGrammar, atmosphere, relationships, and rhythm fields.
- Infer the scene tone from the prompt: sad, tense, lonely, awkward, energetic, romantic, threatening, or neutral.
- Set cinematicGrammar.tone and template based on inferred tone (e.g. lonely → wide_shot camera, high spacing, low energy).
- Set atmosphere effects and lightingTint based on the environment (e.g. night scene → lightingTint 'night', streetlight → flicker effect).
- If multiple actors exist, populate relationships array with their spatial relationship.
- Set rhythm tempo based on scene energy (slow for lonely/sad, fast for energetic).
- Valid emotions: neutral, sad, happy, nervous, excited, awkward, angry, exhausted.
- Valid actions: idle, walking, sitting, approaching, pacing. Use 'approaching' for slow deliberate movement toward another actor.
- Camera modes: static, follow, close_up, wide_shot, over_the_shoulder, dramatic_zoom, tension.

Schema:
${JSON.stringify(sceneGenerationResponseSchema, null, 2)}

Examples:
1. Prompt: "A sad stickman walks into a room and sits."
   Output: one humanoid actor, sad emotion, indoor room, currentAction "walking", actionQueue ["sitting"], targetPosition {x:660,y:360}, darker colors, cinematicGrammar tone 'sad', wide_shot camera, rhythm tempo 'slow'.
2. Prompt: "A nervous stickman waits under a flickering streetlight while another character approaches slowly from the distance."
   Output: two actors, nervous+neutral emotions, street environment, first actor idle, second approaching with targetPosition, atmosphere with flicker effect and night tint, cinematicGrammar tone 'tense', relationships array, rhythm tempo 'slow'.
3. Prompt: "Two stickmen in a dark room, one walking."
   Output: two humanoid actors, one walking with targetPosition, one idle. Dark environment, relationships array.
`.trim();

export function buildSceneGenerationUserPrompt(prompt: string) {
  return `User prompt: ${prompt}\nReturn only the SceneGraph JSON object.`;
}
