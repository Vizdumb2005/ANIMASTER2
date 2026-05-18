---
name: testing-animaster
description: How to test Animaster's cinematic runtime systems end-to-end, including Phase 2.6 and 2.7 features.
---

# Testing Animaster

## Starting the App
```bash
# Server (port 3001)
cd server && npm run dev

# Client (port 5173)
cd client && npm run dev
```

## Debug Panel
- Toggle with `Ctrl+D` — shows live SceneGraph JSON
- Key Phase 2.7 fields to verify: `beatSequence`, `emotionalArc`, `storyAnchors`, `sceneEvolution`, `cinematicMomentScore`
- Key Phase 2.6 fields: `emotionalSpatial`, `shotIntent`, `tensionState`, `anticipationState`, `powerDynamics`, `compositionMetrics`

## Extracting Data via Playwright CDP
The debug panel JSON is large. Use Playwright CDP for efficient extraction:
```python
from playwright.sync_api import sync_playwright
import json, time

with sync_playwright() as p:
    browser = p.chromium.connect_over_cdp('http://localhost:29229')
    ctx = browser.contexts[0]
    page = next((pg for pg in ctx.pages if 'localhost:5173' in pg.url), ctx.pages[0])
    time.sleep(1)  # Wait for HMR to settle
    result = page.evaluate("""() => {
        const pre = document.querySelector('pre');
        if (!pre) return null;
        const data = JSON.parse(pre.textContent);
        return {
            tone: data.cinematicGrammar?.tone,
            beatLabel: data.beatSequence?.label,
            beatIndex: data.beatSequence?.currentIndex,
            arcLabel: data.emotionalArc?.label,
            storyAnchorsCount: data.storyAnchors?.length ?? 0,
            momentScore: data.cinematicMomentScore?.overallScore,
            actorCount: data.actors?.length ?? 0,
            emotions: (data.actors || []).map(a => a.emotionState),
            relTypes: (data.relationships || []).map(r => r.type)
        };
    }""")
    print(json.dumps(result, indent=2))
    browser.close()
```

**Note**: Vite HMR can cause "Execution context was destroyed" errors. Add `time.sleep(1)` before queries and wrap in retry loops (3 attempts).

## Test Scenarios

### Phase 2.7 Beat Runtime
1. **Beat progression**: Enter "A nervous stickman stands alone", verify `beatSequence.currentIndex` advances and `totalElapsedMs` increases
2. **Emotional arc**: Verify `emotionalArc` has 5 phases, `currentPhaseIndex` advances over ~10s
3. **Story anchors**: Verify `storyAnchors` array populated with bench/window/streetlight/doorway types
4. **Scene evolution**: Verify `sceneEvolution.sampleCount` increases, trajectory arrays fill up
5. **Cinematic moment score**: Verify all scores between 0-1

### Relational Parsing
6. **Confronts**: "A stickman confronts another stickman" → 2 actors, `confronting` relationship
7. **Comforts**: "A stickman comforts a sad stickman" → 2 actors, `approaching` relationship, `sad` tone

### Mutation
8. **State reset**: After mutation (e.g. "make it lonely"), Phase 2.7 fields reinitialize with new tone

### Console Errors
9. Check browser console — expect 0 uncaught errors from Phase 2.7 modules. WebGL driver messages and favicon 404 are non-critical.

## Known Issues
- No OpenAI API key configured — all testing uses fallback regex engine
- "confronts" prompt may produce tone=`neutral` instead of `threatening` due to emotion regex priority in fallback
- Playwright CDP connections can break due to Vite HMR — use retry loops
