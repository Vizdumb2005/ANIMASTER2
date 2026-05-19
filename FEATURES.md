# Animaster — Features & How It Works

## Overview

Animaster is a semantic cinematic creation platform: describe scenes in natural language, the server interprets them into a typed semantic scene graph, a deterministic runtime evaluates that graph each tick, and a Three.js/R3F renderer visualizes the result. Users can iteratively mutate scenes conversationally (e.g. "make it lonelier", "add rain").

## Key Features

- **Natural-language scene authoring** — Create scenes via free-text prompts in the UI. Interpretation is handled by the server (`/interpret`).
- **Conversational mutation** — Modify scenes with follow-up prompts; mutations are sparse patches that preserve unchanged fields (`/mutate`).
- **Deterministic runtime** — A fixed 60 FPS tick loop evaluates 25+ runtime modules (acting, camera, composition, tension, timing, etc.) to produce consistent visuals given the same scene graph and seed.
- **Semantic scene graph** — All data structures and types live in `shared/src/scene.ts` and form the single source of truth for client/server communication.
- **Acting & emotion system** — Actor models, action queues, emotional states, and action instances are evaluated by `actorEvaluator` and related runtime modules to generate believable behavior.
- **Cinematic grammar & camera system** — Cinematic intent, shot types, camera modes, and presets are computed by the runtime rather than authored as keyframes.
- **Atmosphere & environment** — Environment profiles, weather/atmosphere effects, and scene lighting are applied by renderer components and atmospheric modules.
- **Three.js / React Three Fiber renderer** — The visual layer uses modular R3F components (`client/src/three/*`) for scene composition, post-processing, and assets.
- **UI & controls** — Rich UI: `PromptBar`, `PlaybackControls`, `CinematicControls`, `ActorDirector`, `SceneGraphView`, `BeatTimeline`, `PromptSuggestions`, `SessionSidebar`, and debug panels for inspecting the runtime and scene store.
- **Server-side AI & prompts** — Server hosts prompt templates and the `/interpret` and `/mutate` routes; optionally calls OpenAI (configurable via `OPENAI_API_KEY`). A regex fallback exists for offline usage.
- **Session history & mutation tracking** — Scenes keep session and mutation history allowing undo-like conversational edits and auditability.
- **Extensible runtime modules** — The runtime is composed of independent evaluator modules (many under `client/src/runtime/`) so new cinematic behaviors can be added without changing the core loop.

## How It Works (High-level data flow)

1. User types a prompt in the client `PromptBar`.
2. Client sends `POST /interpret` (for new scenes) or `POST /mutate` (for changes) to the server via `services/interpretService.ts` or `mutateService.ts`.
3. Server uses prompt templates (`server/src/prompts/*`) and the configured AI model (OpenAI or fallback) to produce a semantic scene graph or sparse mutation patch.
4. Client receives the scene graph/patch and applies it to the central `sceneStore` (`client/src/store/sceneStore.ts`).
5. The deterministic `tickLoop` runs at 60 FPS and invokes runtime evaluators (`client/src/runtime/*`) that compute actor actions, camera transforms, composition metrics, emotional arcs, and more.
6. The Three.js/R3F components in `client/src/three/` render the computed state every frame: meshes, lighting, atmosphere, postprocessing, and audio.
7. User observes the rendered scene and can send further mutations; mutation patches are sparse and merge into the existing scene graph.

## Important Implementation Files (where to look)

- Shared types: `shared/src/scene.ts`
- Client root: `client/src/App.tsx` and `client/src/main.tsx`
- Scene store: `client/src/store/sceneStore.ts`
- Runtime / evaluators: `client/src/runtime/` (tickLoop, sceneEvaluator, actorEvaluator, etc.)
- Renderer: `client/src/three/` and its `components/` (CinematicScene, SceneCamera, AtmosphereEffects, ScenePostProcessing)
- UI components: `client/src/components/` (PromptBar, CinematicControls, PlaybackControls, etc.)
- Server entry + routes: `server/src/index.ts`, `server/src/routes/interpret.ts`, `server/src/routes/mutate.ts`
- Server prompts & planning: `server/src/prompts/` and `server/src/planning/`

## Running locally (dev)

1. Install dependencies (from workspace root or per-package):

```bash
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..
```

2. Start the server and client (two terminals):

```bash
# Terminal 1
cd server
npx tsx watch src/index.ts

# Terminal 2
cd client
npx vite --host 0.0.0.0
```

3. Optional: set `OPENAI_API_KEY` in `server/.env` to enable AI-powered generation. Without it, the regex fallback is used.

## Developer notes & extension points

- Add new cinematic behaviors by creating new modules under `client/src/runtime/` and registering them in the runtime loop.
- To extend server reasoning, add prompt templates in `server/src/prompts/` and adjust the route handlers.
- The shared type definitions in `shared/src/scene.ts` must be kept in sync when adding new data fields.

## Quick glossary

- Scene graph: the typed data model representing actors, environment, camera, and cinematic metadata.
- Sparse mutation: a patch object containing only changed fields to be merged into an existing scene graph.
- Runtime evaluator: code that computes emergent behaviors (acting, camera, timing) per tick.

---

If you want, I can expand any section into a dedicated README section (e.g., detailed runtime internals, actor/emotion design, or API docs).
