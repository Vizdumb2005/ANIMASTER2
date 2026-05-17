export const sceneMutationResponseSchema = {
  type: 'object',
  additionalProperties: false,
  required: ['actors', 'environment', 'camera', 'cinematicGrammar', 'atmosphere', 'relationships', 'rhythm'],
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
- The response must contain actors, environment, camera, cinematicGrammar, atmosphere, relationships, and rhythm fields.
- Preserve ALL existing actors, their positions, actions, and states unless the edit explicitly changes them.
- When the user says "make the room darker" or similar lighting edits, darken the environment colors but keep all actors unchanged.
- When the user says "make him nervous" or similar emotion edits, change only the referenced actor's emotionState. Valid emotions: neutral, sad, happy, nervous, excited, awkward, angry, exhausted.
- When the user says "add another character", append a new actor to the actors array while preserving all existing actors.
- Valid actions: idle, walking, sitting, approaching, pacing.
- Keep joints consistent with actor position. Head is ~58px above position.y, torso ~30px above, arms ~28px to each side and ~10px above, legs ~18px to each side and ~42px below.

## Tonal Edits (Phase 2)
- When the user says "make the scene feel more lonely/tense/sad/etc.", update the cinematicGrammar.tone and template accordingly.
- Lonely: wide_shot camera, high spacing, low energy, cold lighting.
- Tense: close_up or tension camera, low spacing, high energy, high contrast.
- Sad: wide_shot camera, high spacing, low energy, cool lighting tint.

## Camera Edits
- Camera modes: static, follow, close_up, wide_shot, over_the_shoulder, dramatic_zoom, tension.
- Match camera mode to scene tone when editing mood.

## Atmosphere Edits
- Effects: rain, fog, flicker, dust, none.
- lightingTint: warm, cold, night, or rgba(0,0,0,0) for no tint.
- When user says "add rain", add 'rain' to effects array.
- When user says "colder lighting", set lightingTint to 'cold'.

## Relationship Edits
- When user says "have the character stop and hesitate", change their currentAction to 'idle' and update relationships.
- Relationship types: stranger, approaching, confronting, avoiding, conversing.

## Rhythm
- tempo: slow, medium, fast.
- motionEnergyCurve: linear, ease-in, ease-out, sharp.
- Lonely/sad scenes should have slow tempo and high pauseFrequencyPerMinute.

- Do NOT regenerate the entire scene. Only change what the edit instruction asks for.

Schema:
${JSON.stringify(sceneMutationResponseSchema, null, 2)}

Examples:

1. Edit: "Make the room darker."
   → Darken backgroundColor, floorColor, wallColor. Keep all actors and other fields as they are.

2. Edit: "Make the scene feel more lonely."
   → Set cinematicGrammar.tone to 'lonely', template.cameraMode to 'wide_shot', increase spacingMultiplier, decrease motionEnergyScale, set atmosphere.lightingTint to 'cold', increase rhythm.pauseFrequencyPerMinute.

3. Edit: "Add rain and make the lighting colder."
   → Add 'rain' to atmosphere.effects, set atmosphere.lightingTint to 'cold'. Keep actors unchanged.

4. Edit: "Have the approaching character stop and hesitate."
   → Change the approaching actor's currentAction to 'idle', update relationship type.
`.trim();

export function buildSceneMutationUserPrompt(prompt: string, currentScene: string) {
  return `Current scene state:\n${currentScene}\n\nUser edit instruction: ${prompt}\n\nReturn the complete patched scene JSON with actors, environment, and camera.`;
}
