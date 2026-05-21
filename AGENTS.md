# Animaster2 — Agent Memory

## Architecture Summary
- **Monorepo**: client/ (React + Three.js + Vite), server/ (Express + TypeScript), shared/ (types)
- **Renderer**: Three.js ONLY (PixiJS pipeline was deleted in Phase A)
- **Runtime**: Event-driven via EventBus (replaced poll-driven tickLoop)
- **Types**: `shared/src/core.ts` is the canonical type foundation (Phase 10 types)
- **Scene Store**: `client/src/store/sceneStore.ts` — single source of truth for scene state

## Critical Runtime Systems
- `client/src/runtime/engine/Runtime.ts` — procedural simulation engine (~850 lines)
- `client/src/runtime/events/EventBus.ts` — typed pub/sub event system
- `client/src/runtime/motion/MotionGrammar.ts` — motion grammar assembly & evaluation
- `client/src/runtime/spec/SpecFormat.ts` — human-readable scene format parser/printer
- `client/src/runtime/tags/SemanticTagSystem.ts` — semantic tag apply/restore (Req 16)
- `client/src/runtime/export/VideoExporter.ts` — MediaRecorder-based video export pipeline

## Known Issues (Fixed in Phase 10 Audit)
1. **sceneStore.applyPatch() cleared ALL derived state on every mutation** — Fixed: now only clears fields whose inputs actually changed
2. **shotTimelineRuntime.ts force-overwrote actor emotionState** — Fixed: now only nudges intensity
3. **tickLoop guard silently returned stopTickLoop** — Fixed: now warns

## Type System Notes
- `shared/src/core.ts` defines: SceneGraph, SemanticMutation, BehaviorLayerSet, MotionPrimitive, EmotionState, IntentResolution, DirectorEvent
- `shared/src/scene.ts` is the LEGACY type file — still used by old runtime components
- The two type systems are NOT unified yet — this is a known gap

## Test Infrastructure
- Vitest + fast-check for property-based testing
- `client/src/__tests__/properties.test.ts` — 19 property tests
- `client/src/__tests__/arbitraries.ts` — fast-check arbitraries for all core types
- Run with: `cd client && npx vitest run`

## Build Commands
- `cd client && npx vite build` — production build
- `cd client && npx tsc -p tsconfig.json --noEmit` — type-check
- `cd client && npx vitest run` — property tests
- `cd server && npx tsc -p tsconfig.json --noEmit` — type-check server

## Export Pipeline
- Uses browser's MediaRecorder API (no FFmpeg WASM dependency)
- VideoExporter singleton wired to Three.js canvas via CanvasExporterBridge component
- Supports WebM (VP8/VP9), quality settings (draft/standard/high)
- `ExportPanel` component in UI for video/frame capture

## Semantic Tag System
- Built-in tags: nervous, hesitant, energetic, awkward, aggressive, tired, confident, distracted
- Property 16: applying a tag stores pre-tag values; removing restores them exactly
- Tags affect idle params (breathRate, fidgetProbability, swayAmplitude, etc.)