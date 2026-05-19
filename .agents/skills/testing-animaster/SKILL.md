---
name: testing-animaster
description: Test Animaster end-to-end including scene generation, mutations, AI orchestration, and all UI panels. Use when verifying any Animaster changes.
---

# Testing Animaster

## Prerequisites
- Server running: `cd server && npm run dev` (port 3001)
- Client running: `cd client && npm run dev` (port 5174)
- No OpenAI API key needed — fallback/mock provider handles all requests

## Devin Secrets Needed
- None required for fallback testing
- `OPENAI_API_KEY` (optional) — for testing real AI-powered generation

## Quick Health Check
```bash
curl -s http://localhost:3001/ai/status | python3 -m json.tool
```
Expect: `providers` object with 5 entries, `mock.available = true`

## API Route Tests
Test all AI routes via curl:
1. `GET /ai/status` — provider availability, config
2. `POST /ai/debug/intent` with `{"prompt":"..."}` — intent compilation + agent reports
3. `POST /ai/debug/reasoning` with `{"prompt":"..."}` — full orchestration reasoning chain
4. `GET /ai/memory` — emotional state, continuity, history
5. `POST /ai/tests` — 7 prompt test suite (expect 5+/7 passing)
6. `GET /ai/demos` — 5 demo scenarios

## Browser UI Tests
1. **Scene generation**: Type a prompt (e.g., "a lonely person on a rooftop at night"), click Create Scene. Expect: 3D scene renders with environment + character, tone badge visible.
2. **Mutation**: Type "make it lonely" and submit. Expect: tone changes, environment/character preserved.
3. **AI Debug Panel**: Press `Ctrl+Shift+I`. Expect: overlay with 4 tabs (Intent Debug, Providers, Memory, Agents). Type prompt in Intent Debug, click Debug — verify intent values + agent reports appear.
4. **Cinematic Director**: Scroll to directing panel, click DIRECTOR button. Expect: 9 semantic sliders (Emotional Intensity, Visual Density, etc.) — NO raw LLM settings.
5. **Demo Selector**: Click DEMOS button. Expect: 5 demo cards with Launch buttons.

## Known Behaviors
- Port 5173 may be in use; client auto-selects 5174
- Port 3001 may be occupied from previous session — kill with `fuser -k 3001/tcp`
- `lsof` is not available on the VM; use `fuser` instead
- Scene memory is in-process only — restarting server clears it
- 2/7 prompt tests may fail on edge cases (camera aggression threshold, distance graph op) — these are intent compiler sensitivity, not bugs
- Beat tracker resets to SETUP after mutations (expected behavior)
- `Ctrl+Shift+I` opens AI Debug Panel, NOT browser DevTools (custom handler)

## Environment Types That Work
room, apartment, hallway, hospital, subway, street, park, beach, forest, rooftop, staircase, alley, parking_garage, diner, office, warehouse

## Demo Scenarios
1. Lonely Subway at Midnight
2. Apartment Emotional Tension
3. Rainy Rooftop Confrontation
4. Nostalgic Diner Memory
5. Hospital Waiting Room Anxiety
