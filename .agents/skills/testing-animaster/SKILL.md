---
name: testing-animaster
description: How to run and test the Animaster app end-to-end, including server/client startup, fallback mode testing, and demo scenario workflows.
---

# Testing Animaster

## Environment Setup

1. Start the server (port 3001):
   ```bash
   cd server && npx tsx src/index.ts
   ```

2. Start the client (default port 5173, may increment if in use):
   ```bash
   cd client && npx vite --host
   ```

3. If port 3001 is in use from a previous run:
   ```bash
   fuser -k 3001/tcp
   ```

## Testing Mode

The app works in **fallback mode** without an OpenAI API key. The server uses regex-based pattern matching to generate scenes and apply mutations. No credentials are needed for basic E2E testing.

## Key Test Scenarios

### Phase 1 (Tasks 21-33)
- Scene generation: Type a prompt like "A stickman walks in a room" and click Generate
- Scene mutation: With an existing scene, type "make the room darker" to mutate
- Emotion changes: "make the stickman nervous" changes emotionState
- Add characters: "add another stickman" adds a second actor
- Debug panel: Ctrl+D toggles SceneGraph JSON overlay
- Session sidebar: Shows all prompts in chronological order

### Phase 2 (Tasks 34-80)
- **Demo 1**: "A nervous stickman waits under a flickering streetlight while another character approaches slowly from the distance."
  - Expect: 2 actors, street environment, flicker effect, nervous emotion, approach behavior
- **Demo 2**: "Make the scene feel more lonely."
  - Expect: tone→lonely, camera→wide_shot, lightingTint→cold, tempo→slow (no scene regeneration)
- **Demo 3**: "Add rain and make the lighting colder."
  - Expect: Rain particles visible, atmosphere.effects includes "rain", lightingTint "cold"
- **Demo 4**: "Have the approaching character stop and hesitate."
  - Expect: Approaching actor stops (currentAction→idle)

## Verification via Debug Panel

Press **Ctrl+D** to open the debug panel. Key Phase 2 fields to verify:
- `cinematicGrammar.tone` — should match inferred scene tone
- `atmosphere.effects` — array of active effects (rain, flicker, fog, etc.)
- `atmosphere.lightingTint` — warm, cold, night, or rgba value
- `relationships` — array of actor relationships
- `rhythm.tempo` — slow, medium, or fast
- `camera.mode` — static, follow, close_up, wide_shot, over_the_shoulder, dramatic_zoom, tension

## TypeScript Checks

```bash
npx tsc -p client/tsconfig.json --noEmit
npx tsc -p server/tsconfig.json --noEmit
```
