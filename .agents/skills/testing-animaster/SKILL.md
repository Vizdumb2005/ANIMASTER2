---
name: testing-animaster
description: Test Animaster end-to-end — scene generation, mutation, UI controls, debug panel, and console errors. Use when verifying any Animaster code changes.
---

# Testing Animaster E2E

## Prerequisites
- Server and client must both be running
- No OpenAI API key needed — fallback mode generates deterministic scenes

## Setup
1. Start server: `npm run dev -w server` (runs on port 3001)
2. Start client: `npm run dev -w client` (runs on port 5173)
3. Open http://localhost:5173 in browser

## Core Test Scenarios

### 1. Scene Generation
- Type a prompt like "A nervous stickman in a dark room" and click Create/Direct
- **Verify**: Stickman renders with face (eyes visible), scene info overlay shows actor count and tone, cinematic overlay shows beat/phase/score

### 2. Scene Mutation
- With an existing scene, type "make it lonely" or "make it tense" and click Direct
- **Verify**: Tone changes, background color/grading shifts, actor is preserved, atmosphere effects (if any) are preserved across mutations

### 3. UI Controls
- Scroll down to see Controls tab, Camera presets, Actors panel
- **Verify**: Camera preset buttons are clickable, actor emotion presets work, playback controls (pause/play/speed/new) respond

### 4. Debug Panel
- Press Ctrl+D to toggle debug panel
- **Verify**: Full SceneGraph JSON displayed with actors, positions, joints, emotionState, cinematicGrammar, atmosphere, relationships, rhythm, beatSequence, emotionalArc, sceneEvolution fields

### 5. Console Errors
- Open browser DevTools console
- **Verify**: 0 JavaScript errors. Only acceptable: React DevTools info, WebGL deprecation warnings, favicon 404

## Fallback Mode Behavior
Without an OpenAI API key, the server uses regex-based interpretation:
- Environment keywords: room, street, park, beach, forest, subway, hospital, hallway, rooftop, staircase
- Tone mutations: "lonely", "tense", "sad", "romantic", "energetic", "threatening"
- Effect mutations: "rain", "fog", "flicker"
- Camera mutations: "push camera closer", "pull camera back"
- Relational prompts: "confronts", "comforts", "avoids", "talks to"

## Common Issues
- PixiJS `_cancelResize` crash: Guarded with try/catch in cleanup. If it recurs, check React StrictMode double-mount.
- Mutation losing effects: Ensure `mutateService.ts` sends all Phase 2+ fields (atmosphere, cinematicGrammar, relationships, rhythm) to the server.

## Devin Secrets Needed
- `OPENAI_API_KEY` (optional) — for AI-powered scene generation/mutation instead of fallback mode
