---
name: testing-phase2.6-cinematic-intelligence
description: Test Phase 2.6 Cinematic Intelligence Deepening systems end-to-end. Use when verifying emotional spatial intelligence, dramatic timing, shot logic, attention direction, deep acting, composition, power dynamics, tension escalation, anticipation/payoff, and readability validation.
---

# Testing Phase 2.6 — Cinematic Intelligence Deepening

## Prerequisites

- Server running on port 3001: `cd server && npm run dev`
- Client running on port 5173: `cd client && npm run dev`
- No OpenAI key needed — fallback mode works for all tests

## How to Extract Phase 2.6 Data

The debug panel (Ctrl+D) shows the full SceneGraph JSON, but it's very long. Use Playwright CDP to extract fields programmatically:

```js
const { chromium } = require('playwright');
const browser = await chromium.connectOverCDP('http://localhost:29229');
const page = browser.contexts()[0].pages().find(p => p.url().includes('localhost:5173'));
const result = await page.evaluate(() => {
  const pre = document.querySelector('pre');
  const scene = JSON.parse(pre.textContent);
  return {
    emotionalSpatial: scene.emotionalSpatial,
    dramaticBeatsTypes: [...new Set(scene.dramaticBeats?.map(b => b.type))],
    shotIntent: scene.shotIntent,
    attentionFocus: scene.attentionFocus,
    compositionMetrics: scene.compositionMetrics,
    powerDynamics: scene.powerDynamics,
    tensionState: scene.tensionState,
    anticipationState: scene.anticipationState,
    tone: scene.cinematicGrammar?.tone
  };
});
```

**Important**: The debug panel (`<pre>` element) must be open (Ctrl+D) before extracting data.

## Test Prompts and Expected Values

### 1. Lonely/Sad Single Actor
**Prompt**: "A sad stickman stands alone in a dark room"  
**Expected**:
- `spatialIntent: "isolation"`, `negativeSpaceRatio: 0.8`, `frameEdgeBias.x: -0.6`
- `shotIntent.intent: "isolate"`
- `dramaticBeats` contains `"silence"` type
- `tone: "lonely"`

### 2. Tense 2-Actor Confrontation
**Prompt**: "A nervous stickman waits while another angry character approaches slowly from the distance"  
**Expected**:
- `spatialIntent: "confrontation"`, `negativeSpaceRatio: 0.2`
- `powerDynamics` array length ≥ 1, `dynamicType` is pursuit/dominance/submission
- `tensionState.currentLevel > 0`, `escalationRate > 0`
- `dramaticBeats` contains `"tension_hold"` or `"anticipation"`
- `anticipationState.phase` is `"building"` or `"peak"`

### 3. Mutation Test
After generating Test 2, mutate with "make the scene lonely"  
**Expected changes**:
- `spatialIntent` → `"isolation"`, `negativeSpaceRatio` → `0.8`
- `tone` → `"lonely"`, `dramaticBeats` → `"silence"` type
- Actors preserved (count unchanged)
- Note: `shotIntent.intent` might stay `"reveal"` in multi-actor scenes (expected)

### 4. Nervous Single Actor
**Prompt**: "A nervous stickman paces back and forth in a small room"  
**Expected**:
- `spatialIntent: "vulnerability"`
- `shotIntent.intent: "isolate"`
- `compositionMetrics.ruleOfThirdsScore` is number 0-1
- `attentionFocus.primaryTarget` matches actor id
- `focusIntensity > 0`

## Tone-to-Spatial Mapping Reference

| Tone | Spatial Intent | Negative Space |
|------|---------------|----------------|
| lonely | isolation | 0.8 |
| sad | vulnerability | 0.6 |
| tense | confrontation | 0.2 |
| threatening | confrontation | 0.2 |
| romantic | intimacy | 0.15 |
| awkward | avoidance | 0.65 |

## Common Issues

- **Port 3001 in use**: Kill with `fuser -k 3001/tcp` before starting server
- **Playwright not installed**: Run `npm install playwright` in home directory
- **browser_console tool may not detect Chrome as foreground**: Use Playwright CDP scripts instead
- **dramaticBeats accumulate rapidly**: Silence beats are added every tick — count may be high (60+), this is normal
- **Shot intent in multi-actor lonely scenes**: `shotIntent` uses multi-actor logic even when tone is lonely, so it may show `"reveal"` instead of `"isolate"` — the spatial system correctly computes isolation
