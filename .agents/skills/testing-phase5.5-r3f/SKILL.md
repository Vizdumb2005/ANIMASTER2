---
name: testing-phase5.5-r3f
description: Test the Three.js/R3F cinematic renderer end-to-end. Use when verifying 3D rendering, environment types, tone mutations, atmosphere effects, UI overlays, or camera systems.
---

# Testing Phase 5.5 — Three.js/R3F Active Integration

## Setup

1. Start server: `cd server && npm run dev` (port 3001)
2. Start client: `cd client && npm run dev` (port 5173)
3. Open browser to http://localhost:5173
4. If EADDRINUSE, kill the blocking process: `fuser -k 3001/tcp` or `fuser -k 5173/tcp`

## Key Test Scenarios

### 1. Basic Scene Generation
- Type: "A nervous stickman waits on a rooftop"
- Verify: R3F Canvas renders (not black void), 3D environment geometry visible, character mesh (sphere head + capsule body), lighting active

### 2. Environment Types
- Type: "Two stickmen argue in a hospital hallway"
- Verify: Hallway walls/ceiling, 2 character meshes, Ctrl+D debug panel shows `environment.type = "hallway"`
- Supported environments: indoor_room, rooftop, hallway, hospital, subway, outdoor_street, outdoor_park, outdoor_beach, outdoor_forest, apartment, staircase

### 3. Tone Mutations
- Type: "make it lonely" (after creating a scene)
- Verify: Overlay shows LONELY, lighting shifts cold, camera adjusts

### 4. Atmosphere Effects
- Type: "add rain"
- Verify: Rain particles visible, debug shows `atmosphere.effects = ["rain"]`, previous state preserved

### 5. UI Overlays
- Test: Playback controls (pause/play/speed/new), overlay badges, prompt suggestions, debug panel (Ctrl+D)
- Verify: All render on top of 3D canvas and are interactive

### 6. Park Environment
- Type: "A happy stickman walks in a park"
- Verify: Green trees (cone+cylinder geometry), benches, streetlight

## Debugging Tips

- **Debug Panel**: Ctrl+D toggles the SceneGraph JSON panel showing all runtime state
- **Console Warnings**: THREE.Clock and PCFSoftShadowMap deprecation warnings are expected from Three.js library — not errors
- **Fallback Mode**: Without an OpenAI API key, the app uses regex-based scene generation which supports basic scenarios
- **Environment Detection**: The fallback detects keywords like park, beach, forest, hospital, hallway, rooftop, subway, apartment, staircase

## Devin Secrets Needed

- `OPENAI_API_KEY` (optional) — enables AI-powered scene generation/mutation. Without it, fallback regex mode is used.
