# Animaster Deep Repository Wiki

> **Animaster** is a semantic cinematic operating system that lets users direct cinema through language. Describe a scene emotionally, direct it conversationally, and create cinematic moments without manual animation workflows.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Philosophy & Design Principles](#2-philosophy--design-principles)
3. [Architecture Overview](#3-architecture-overview)
4. [Setup & Installation](#4-setup--installation)
5. [Project Structure](#5-project-structure)
6. [Shared Types (`shared/`)](#6-shared-types-shared)
7. [Server (`server/`)](#7-server-server)
8. [Client (`client/`)](#8-client-client)
9. [Runtime Systems](#9-runtime-systems)
10. [Three.js Rendering Layer](#10-threejs-rendering-layer)
11. [UI Components](#11-ui-components)
12. [Scene Store & State Management](#12-scene-store--state-management)
13. [Data Flow & Mutation Pipeline](#13-data-flow--mutation-pipeline)
14. [Cinematic Grammar & Tone System](#14-cinematic-grammar--tone-system)
15. [Emotion System](#15-emotion-system)
16. [Camera System](#16-camera-system)
17. [Atmosphere & Environment System](#17-atmosphere--environment-system)
18. [Phase Progression](#18-phase-progression)
19. [API Reference](#19-api-reference)
20. [Development Workflow](#20-development-workflow)
21. [Glossary](#21-glossary)

---

## 1. Project Overview

Animaster is **not** an animation editor, timeline tool, or Blender alternative. It is a **semantic cinematic creation platform** where:

- Users describe scenes using natural language prompts
- An LLM (or regex-based fallback) interprets the prompt into a semantic scene graph
- A deterministic runtime evaluates the scene graph every frame at 60 FPS
- A Three.js/React Three Fiber renderer visualizes the scene with cinematic lighting, atmosphere, and post-processing
- Users can mutate scenes conversationally ("make it lonelier", "add rain", "make him nervous")

The system feels like **directing a movie through language** — all editing happens through natural language prompts and semantic controls (sliders for pacing/tension/atmosphere), never through manual animation curves or keyframes.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | React 19, TypeScript, Vite 6 |
| 3D Rendering | Three.js 0.184, React Three Fiber 9, React Three Drei 10 |
| Post-Processing | @react-three/postprocessing 3, postprocessing 6 |
| State Management | Custom reactive store (pub/sub pattern) |
| Server | Express 4, TypeScript, tsx (dev) |
| AI | OpenAI API (gpt-4o-mini) with regex fallback |
| Shared Types | TypeScript monorepo workspace (`@animaster/shared`) |

---

## 2. Philosophy & Design Principles

### Core Principles

1. **Semantic Runtime Authority** — The runtime is the single source of truth. LLMs interpret intent and generate semantic plans, but the runtime executes deterministically. LLMs never directly animate, render, control timing, or generate frames.

2. **Deterministic Execution** — All visual state derives from `sceneStore`. The tick loop runs at a fixed 60 FPS timestep. Given the same scene graph, the same visual output is produced.

3. **Sparse Patch Mutations** — Mutations return only changed fields. Unchanged fields are preserved from the current scene. This prevents "make it lonely" from accidentally clearing rain effects.

4. **Runtime-First Logic** — All cinematic behaviors (staging, timing, camera, acting, emotions) are computed by runtime evaluators every tick, not baked into the scene graph by the LLM.

5. **Silhouette Readability** — Visual design prioritizes readable silhouettes over photorealistic detail. Inspired by Limbo and Kentucky Route Zero.

### What Animaster Is NOT

- Not a timeline editor or keyframe system
- Not a Blender alternative or mesh editor
- Not an AI video generator
- Not a skeletal rig system
- Not a node/graph editor

---

## 3. Architecture Overview

```
+------------------+     HTTP      +------------------+
|                  | ------------> |                  |
|   Client (Vite)  |   /interpret  |  Server (Express)|
|   localhost:5173  |   /mutate     |  localhost:3001   |
|                  | <------------ |                  |
+------------------+     JSON      +------------------+
        |                                   |
        |                                   |
   +----v----+                        +-----v-----+
   | Scene   |                        |  OpenAI   |
   | Store   |                        |  API      |
   +---------+                        |  (or      |
        |                             |  fallback)|
   +----v----+                        +-----------+
   | Runtime |
   | Systems |
   | (25+    |
   | modules)|
   +---------+
        |
   +----v--------+
   | Three.js    |
   | R3F Renderer|
   | (8 comps)   |
   +-------------+
```

### Monorepo Structure

The project is a TypeScript monorepo with three packages:

- **`shared/`** — Shared type definitions (`@animaster/shared`)
- **`server/`** — Express API server (`@animaster/server`)
- **`client/`** — React + Three.js client (`@animaster/client`)

---

## 4. Setup & Installation

### Prerequisites

- Node.js 18+ (LTS recommended)
- npm 9+
- (Optional) OpenAI API key for AI-powered scene generation

### Installation

```bash
# Clone the repository
git clone https://github.com/Vizdumb2005/ANIMASTER2.git
cd ANIMASTER2

# Install dependencies for all packages
cd shared && npm install && cd ..
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### Running the Application

```bash
# Terminal 1: Start the server
cd server
npx tsx watch src/index.ts
# Server runs on http://localhost:3001

# Terminal 2: Start the client
cd client
npx vite --host 0.0.0.0
# Client runs on http://localhost:5173
```

### Environment Variables

Create a `.env` file in `server/`:

```env
# Optional — without this, the regex-based fallback is used
OPENAI_API_KEY=sk-...

# Optional — defaults to gpt-4o-mini
OPENAI_MODEL=gpt-4o-mini

# Optional — defaults to 3001
PORT=3001
```

The client reads `VITE_API_BASE_URL` from its environment (defaults to `http://localhost:3001`).

### Build

```bash
# Server
cd server && npm run build    # tsc → dist/

# Client
cd client && npm run build    # tsc --noEmit + vite build → dist/
```

---

## 5. Project Structure

```
ANIMASTER2/
├── shared/
│   ├── src/
│   │   └── scene.ts              # 507 lines — ALL shared type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── server/
│   ├── src/
│   │   ├── index.ts              # Express app entry point
│   │   ├── routes/
│   │   │   ├── interpret.ts      # POST /interpret — scene generation
│   │   │   └── mutate.ts         # POST /mutate — scene mutation
│   │   └── prompts/
│   │       ├── sceneGenerationPrompt.ts
│   │       └── sceneMutationPrompt.ts
│   ├── package.json
│   └── tsconfig.json
│
├── client/
│   ├── src/
│   │   ├── App.tsx               # Root component
│   │   ├── main.tsx              # React entry point
│   │   ├── styles.css            # 716 lines — all UI styles
│   │   │
│   │   ├── components/           # UI components
│   │   │   ├── PromptBar.tsx
│   │   │   ├── SessionSidebar.tsx
│   │   │   ├── DebugPanel.tsx
│   │   │   ├── CinematicControls.tsx
│   │   │   ├── PlaybackControls.tsx
│   │   │   ├── CameraPresets.tsx
│   │   │   ├── ActorDirector.tsx
│   │   │   ├── SceneInfoOverlay.tsx
│   │   │   ├── BeatTimeline.tsx
│   │   │   ├── SceneGraphView.tsx
│   │   │   └── PromptSuggestions.tsx
│   │   │
│   │   ├── services/             # API communication
│   │   │   ├── interpretService.ts
│   │   │   └── mutateService.ts
│   │   │
│   │   ├── store/
│   │   │   └── sceneStore.ts     # Central state management (287 lines)
│   │   │
│   │   ├── runtime/              # 25+ runtime evaluator modules
│   │   │   ├── tickLoop.ts
│   │   │   ├── sceneEvaluator.ts
│   │   │   ├── actorEvaluator.ts
│   │   │   ├── actionRuntime.ts
│   │   │   ├── cinematicGrammarRegistry.ts
│   │   │   ├── semanticProfiles.ts
│   │   │   ├── semanticOperations.ts
│   │   │   ├── semanticAnchors.ts
│   │   │   ├── deterministicRandom.ts
│   │   │   ├── initActorJoints.ts
│   │   │   ├── proximityAwareness.ts
│   │   │   ├── acting/
│   │   │   ├── anchors/
│   │   │   ├── anticipation/
│   │   │   ├── arcs/
│   │   │   ├── attention/
│   │   │   ├── beats/
│   │   │   ├── behaviors/
│   │   │   ├── camera/
│   │   │   ├── composition/
│   │   │   ├── continuity/
│   │   │   ├── dynamics/
│   │   │   ├── emotions/
│   │   │   ├── environment/
│   │   │   ├── evolution/
│   │   │   ├── poses/
│   │   │   ├── reactions/
│   │   │   ├── rhythm/
│   │   │   ├── spatial/
│   │   │   ├── staging/
│   │   │   ├── tension/
│   │   │   ├── timing/
│   │   │   └── validation/
│   │   │
│   │   └── three/                # Three.js/R3F rendering layer
│   │       ├── components/
│   │       │   ├── CinematicScene.tsx
│   │       │   ├── CharacterMesh.tsx
│   │       │   ├── EnvironmentMesh.tsx
│   │       │   ├── AtmosphereEffects.tsx
│   │       │   ├── SceneLighting.tsx
│   │       │   ├── SceneCamera.tsx
│   │       │   ├── SceneProps.tsx
│   │       │   └── ScenePostProcessing.tsx
│   │       ├── assets/
│   │       ├── atmosphere/
│   │       ├── audio/
│   │       ├── camera/
│   │       ├── postprocessing/
│   │       ├── store/
│   │       └── index.ts
│   │
│   ├── package.json
│   └── tsconfig.json
│
└── package.json                  # Root workspace config
```

---

## 6. Shared Types (`shared/`)

**File**: `shared/src/scene.ts` (507 lines)

This is the single source of truth for all TypeScript type definitions used by both client and server. Every data structure in the system is defined here.

### Core Types

#### SceneGraph (root type)

```typescript
interface SceneGraph {
  id: string;
  version: number;
  seed?: number;
  simulation?: SimulationState;
  actors: Actor[];
  environment: Environment;
  anchors?: SemanticAnchor[];
  camera: Camera;
  sessionHistory: SessionEntry[];
  mutationHistory?: SemanticMutationRecord[];
  cinematicGrammar: CinematicGrammar;
  atmosphere: AtmosphereProfile;
  relationships: CharacterRelationship[];
  rhythm: SceneRhythm;
  continuity?: ContinuityState;
  // Phase 2.6 computed fields
  emotionalSpatial?: EmotionalSpatialState;
  dramaticBeats?: DramaticBeat[];
  shotIntent?: ShotIntent;
  attentionFocus?: AttentionFocus;
  compositionMetrics?: CompositionMetrics;
  powerDynamics?: PowerDynamic[];
  tensionState?: TensionState;
  anticipationState?: AnticipationState;
  // Phase 2.7 computed fields
  beatSequence?: BeatSequence;
  emotionalArc?: EmotionalArc;
  reactionChains?: ReactionChain[];
  storyAnchors?: StoryAnchor[];
  sceneEvolution?: SceneEvolution;
  cinematicMomentScore?: CinematicMomentScore;
  // Phase 3 computed fields
  environmentReaction?: { ... };
}
```

#### Actor

```typescript
interface Actor {
  id: string;
  label: string;
  type: 'humanoid';
  position: Vector2;
  targetPosition: Vector2 | null;
  emotionState: ActorEmotion;        // 'neutral'|'sad'|'happy'|'nervous'|'excited'|'awkward'|'angry'|'exhausted'
  emotionIntensity?: number;
  currentAction: ActorAction;        // 'idle'|'walking'|'sitting'|'approaching'|'pacing'
  actionQueue: ActorAction[];
  activeAction?: ActionInstance;
  actionPlan?: ActionInstance[];
  joints: StickmanJoints;
  actingState?: ActingState;
  actionElapsed: number;
  emotionalMomentum?: number;
}
```

#### ActionInstance (Phase 2.5 semantic actions)

```typescript
interface ActionInstance {
  id: string;
  type: ActionType;                  // 'idle'|'waiting'|'walkingTo'|'approaching'|'sittingDown'|'seated'|'lookingAt'|'hesitating'|'pacing'
  target: ActionTarget | null;      // position, anchor, actor, or none
  semanticReason: string;
  phase: ActionPhase;               // 'queued'|'starting'|'executing'|'settling'|'sustained'|'completed'|'interrupted'|'failed'
  startedAt: number;
  duration: number | null;
  priority: number;
  interruptible: boolean;
  status: ActionStatus;
}
```

#### Environment

```typescript
interface Environment {
  type: string;                      // 'indoor_room'|'outdoor_park'|'rooftop'|'hospital'|'subway'|etc.
  backgroundColor: string;
  floorColor: string;
  wallColor: string;
  width: number;                     // default 960
  height: number;                    // default 540
}
```

#### Camera

```typescript
type CameraMode = 'static' | 'follow' | 'close_up' | 'wide_shot' | 'over_the_shoulder' | 'dramatic_zoom' | 'tension';

interface Camera {
  x: number;
  y: number;
  zoom: number;
  mode: CameraMode;
  plan?: CameraPlan | null;
  shot?: ShotState;
}
```

#### CinematicGrammar

```typescript
type SceneTone = 'neutral' | 'sad' | 'tense' | 'lonely' | 'awkward' | 'energetic' | 'romantic' | 'threatening';

interface CinematicGrammar {
  tone: SceneTone;
  template: CinematicTemplate;
}

interface CinematicTemplate {
  cameraMode: CameraMode;
  spacingMultiplier: number;
  motionEnergyScale: number;
  pauseFrequency: number;
  contrastBoost: number;
  headroom: number;
}
```

#### AtmosphereProfile

```typescript
type AtmosphereEffect = 'rain' | 'fog' | 'flicker' | 'dust' | 'snow' | 'embers' | 'none';

interface AtmosphereProfile {
  effects: AtmosphereEffect[];
  lightingTint: string;              // 'cold'|'warm'|'night'|'rgba(0,0,0,0)'
  ambientIntensity: number;
}
```

#### CharacterRelationship

```typescript
type RelationshipType = 'stranger' | 'approaching' | 'confronting' | 'avoiding' | 'conversing';

interface CharacterRelationship {
  actorAId: string;
  actorBId: string;
  type: RelationshipType;
  awarenessRadius: number;
  gazeTarget: string | null;
  emotionalReaction: ActorEmotion | null;
  preferredDistance?: number;
  tension?: number;
}
```

#### SemanticMutationOperation (Phase 2.5)

A discriminated union of all possible semantic mutations:

| Type | Purpose |
|------|---------|
| `SetTone` | Change scene tone (sad, tense, lonely, etc.) |
| `AdjustLighting` | Modify lighting tint and ambient intensity |
| `AddAtmosphere` | Add effects (rain, fog, flicker, etc.) |
| `QueueActorAction` | Queue a semantic action for an actor |
| `SetActorEmotion` | Change an actor's emotion and intensity |
| `RestageScene` | Trigger scene restaging |
| `MoveActorToAnchor` | Move an actor to a semantic anchor point |
| `AdjustRelationship` | Modify relationship between two actors |
| `FocusCameraOn` | Direct camera to specific subjects |

### Phase 2.6 Types (Cinematic Intelligence)

| Type | Purpose |
|------|---------|
| `EmotionalSpatialState` | Spatial intent (intimacy/isolation/confrontation/vulnerability/avoidance/dominance) |
| `DramaticBeat` | Timing beats (anticipation/silence/reaction/tension_hold/release/interruption) |
| `ShotIntent` | Shot reasoning (establish/reveal/emphasize/isolate/confront/observe/compress) |
| `AttentionFocus` | Where viewers should look |
| `CompositionMetrics` | Rule-of-thirds, negative space, visual weight, silhouette clarity |
| `PowerDynamic` | Power relationships (dominance/submission/pursuit/withdrawal) |
| `TensionState` | Accumulated tension level with escalation rate |
| `AnticipationState` | Build-peak-release cycle |

### Phase 2.7 Types (Beat Runtime)

| Type | Purpose |
|------|---------|
| `BeatSequence` | Ordered emotional beats (freeze, collapse, silence, etc.) |
| `EmotionalArc` | 5-phase arc (setup, rising, peak, falling, resolution) |
| `PoseProfile` | Joint-level pose language |
| `ReactionChain` | Triggered emotional reactions between actors |
| `StoryAnchor` | Symbolic environment shapes (bench, window, streetlight) |
| `SceneEvolution` | Trajectory tracking for spacing, posture, pacing, camera |
| `CinematicMomentScore` | Quality score (emotionalClarity, poseReadability, dramaticProgression) |

---

## 7. Server (`server/`)

### Entry Point (`server/src/index.ts`)

```typescript
const app = express();
const port = Number(process.env.PORT ?? 3001);

app.use(cors());
app.use(express.json());

app.get('/health', (_, res) => res.json({ status: 'ok' }));
app.use('/interpret', interpretRouter);
app.use('/mutate', mutateRouter);
```

### POST `/interpret` — Scene Generation

**File**: `server/src/routes/interpret.ts` (348 lines)

Generates a complete `SceneGraph` from a natural language prompt.

**Flow**:
1. Receive `{ prompt: string }` in request body
2. If `OPENAI_API_KEY` is set → call OpenAI API with structured JSON schema response
3. If no API key → use `createFallbackScene()` regex-based generation
4. Normalize the response with `normalizeSceneGraph()` (fills missing fields from fallback)
5. Return complete `SceneGraph` JSON

**Fallback Scene Generation** detects:
- **Emotions**: sad, nervous, happy, excited, angry, exhausted, awkward
- **Actions**: walk, sit, approach, confront, comfort, talk to, avoid
- **Environments**: 11 types (indoor_room, outdoor_park, rooftop, hospital, subway, hallway, apartment, staircase, outdoor_street, outdoor_beach, outdoor_forest)
- **Atmosphere**: rain, flicker, night
- **Tone**: lonely, sad, tense
- **Relationships**: confronting, approaching, conversing, avoiding (spawns 2nd actor)

**Timeouts**: 30s server-side, 35s client-side

### POST `/mutate` — Scene Mutation

**File**: `server/src/routes/mutate.ts` (643 lines)

Mutates an existing scene based on a natural language prompt. Returns a **sparse patch** — only changed fields.

**Flow**:
1. Receive `{ prompt: string, currentScene: {...} }` in request body
2. If `OPENAI_API_KEY` is set → call OpenAI API
3. If no API key → use `createFallbackPatch()` regex-based mutation
4. Normalize with `normalizePatch()` — strip fields identical to current scene
5. Return `Partial<SceneGraph>` patch

**Fallback Mutation** supports:
- Lighting: darker, brighter, warmer, cold/warm light, night mode
- Emotions: all 8 emotion states
- Tones: lonely, tense, romantic, energetic, threatening
- Atmosphere: rain, fog, flicker
- Environments: park, street, beach, forest, rooftop, hallway, subway, hospital, apartment, staircase
- Actions: walk, stop, sit, approach, pace, hesitate
- Actor management: add character, remove character

**Key Design**: The `normalizePatch()` function strips unchanged fields from the response so the client only receives what actually changed. This is critical for preserving state across mutations.

### Prompts (`server/src/prompts/`)

- `sceneGenerationPrompt.ts` — System prompt, user prompt builder, and JSON schema for scene generation
- `sceneMutationPrompt.ts` — System prompt, user prompt builder, and JSON schema for scene mutation

Both use OpenAI's structured output (`json_schema` response format) with `strict: true` for guaranteed schema compliance.

---

## 8. Client (`client/`)

### Entry Point (`client/src/App.tsx`)

The root component composes all UI layers:

```tsx
<main className="app-shell">
  <header className="hero">...</header>
  <PromptBar />
  <section className="canvas-frame">
    <CinematicScene />        {/* Three.js R3F canvas */}
    <SceneInfoOverlay />      {/* Tone/beat/camera badges */}
    <PlaybackControls />      {/* Pause/play/speed/reset */}
    <BeatTimeline />          {/* Beat progress bar */}
  </section>
  <div className="directing-panel">
    <CinematicControls />     {/* 5 semantic sliders */}
    <CameraPresets />         {/* 8 camera modes */}
    <ActorDirector />         {/* Click actor + emotion presets */}
  </div>
  <SceneGraphView />          {/* Visual scene graph */}
  <SessionSidebar />          {/* Prompt history */}
  <DebugPanel />              {/* Ctrl+D raw JSON */}
</main>
```

### Services (`client/src/services/`)

#### `interpretService.ts` (76 lines)

```typescript
export async function interpretScene(prompt: string): Promise<SceneGraph>
```

- Calls `POST /interpret` with 35s timeout
- Validates response is a valid SceneGraph
- Throws typed errors for timeout, network, and validation failures

#### `mutateService.ts` (64 lines)

```typescript
export async function mutateScene(prompt: string, currentScene: SceneGraph): Promise<Partial<SceneGraph>>
```

- Calls `POST /mutate` with the prompt and current scene state
- Sends `actors`, `environment`, `camera`, `cinematicGrammar`, `atmosphere`, `relationships`, `rhythm`
- Returns a sparse patch (only changed fields)

---

## 9. Runtime Systems

The runtime is the heart of Animaster. It runs **every frame** (60 FPS fixed timestep) and computes all visual state from the scene graph.

### Tick Loop (`runtime/tickLoop.ts`)

```typescript
export const FIXED_DELTA_MS = 1000 / 60;  // ~16.67ms

export function startTickLoop(onTick: (deltaMs: number) => void): () => void
```

- Fixed timestep game loop using `requestAnimationFrame`
- Accumulator pattern prevents spiral-of-death when frames are slow
- Caps frame delta at 100ms to prevent huge jumps
- Returns a stop function for cleanup

### Scene Evaluator (`runtime/sceneEvaluator.ts`)

The main orchestrator that runs all scene-level systems every tick:

```typescript
export function evaluateScene(scene: SceneGraph): void
```

**Evaluation order** (all Phase 2.5-3 systems):
1. Staging rules
2. Proximity awareness
3. Reaction chains (Phase 2.7)
4. Spatial intent resolution (Phase 2.6)
5. Dramatic timing (Phase 2.6)
6. Power dynamics (Phase 2.6)
7. Tension accumulation (Phase 2.6)
8. Anticipation cycle (Phase 2.6)
9. Composition metrics (Phase 2.6)
10. Camera evaluation (Phase 2.6)
11. Beat sequence progression (Phase 2.7)
12. Emotional arc progression (Phase 2.7)
13. Story anchor placement (Phase 2.7)
14. Scene evolution tracking (Phase 2.7)
15. Environment reaction (Phase 3)

### Actor Evaluator (`runtime/actorEvaluator.ts`)

Per-actor evaluation pipeline:

```typescript
export function evaluateActor(actor: Actor, deltaMs: number, scene: SceneGraph): Actor
```

**Evaluation order**:
1. Action runtime (walking, sitting, pacing, approaching)
2. Emotion modifiers
3. Acting scheduler (weight shift, look around, hesitation, fidget)
4. Deep acting (posture openness, gaze aversion, breathing rate)
5. Pose language (emotion-to-pose mapping with smooth transitions)
6. Beat pose overrides (from active beat sequence)

### Action Runtime (`runtime/actionRuntime.ts`)

Executes actor actions (walking, sitting, pacing, approaching):

```typescript
export function evaluateActionRuntime(actor: Actor, deltaMs: number, scene: SceneGraph): Actor
```

- Manages action queue and action plan promotion
- `executeWalkTo()` — moves actor toward target position at speed
- `executeSittingDown()` — transitions to seated pose
- `executePacing()` — oscillates between waypoints
- Idle evaluator checks `actionQueue` and transitions to next action

### Runtime Module Directory

| Directory | Purpose | Phase |
|-----------|---------|-------|
| `acting/` | Acting primitives (weight shift, look around, hesitation) | 2 |
| `anchors/` | Semantic anchor management | 2.5 |
| `anticipation/` | Build-peak-release cycle | 2.6 |
| `arcs/` | Emotional arc progression and atmosphere effects | 2.7 |
| `attention/` | Attention focus resolution and camera bias | 2.6 |
| `beats/` | Beat sequence evaluation and tone templates | 2.7 |
| `behaviors/` | Behavioral patterns | 2 |
| `camera/` | Intent-driven camera and shot resolution | 2.6 |
| `composition/` | Rule-of-thirds, visual weight, depth separation | 2.6 |
| `continuity/` | Continuity validation and repair | 2.5 |
| `dynamics/` | Power dynamic resolution | 2.6 |
| `emotions/` | Emotion modifiers and aftermath | 2 |
| `environment/` | Environment reaction system | 3 |
| `evolution/` | Scene evolution tracking and moment scoring | 2.7 |
| `poses/` | Pose language profiles and transitions | 2.7 |
| `reactions/` | Reaction chain triggers and execution | 2.7 |
| `rhythm/` | Tempo and motion energy evaluation | 2 |
| `spatial/` | Spatial intent resolution (intimacy/isolation/confrontation) | 2.6 |
| `staging/` | Actor staging rules | 2 |
| `tension/` | Tension accumulation and compression | 2.6 |
| `timing/` | Dramatic beat scheduling | 2.6 |
| `validation/` | Readability validation | 2.6 |

### Key Standalone Modules

| Module | Purpose |
|--------|---------|
| `cinematicGrammarRegistry.ts` | Maps tones to cinematic templates (camera, spacing, energy, pause, contrast) |
| `semanticProfiles.ts` | Derives tone/rhythm runtime profiles from scene state |
| `semanticOperations.ts` | Applies semantic mutation operations (SetTone, QueueAction, etc.) |
| `semanticAnchors.ts` | Creates/finds semantic anchors in environments |
| `deterministicRandom.ts` | Seeded PRNG for deterministic randomness |
| `initActorJoints.ts` | Initializes stickman joint positions from a base position |
| `proximityAwareness.ts` | Detects actor proximity and triggers relationship changes |

---

## 10. Three.js Rendering Layer

**Directory**: `client/src/three/components/`

The rendering layer converts the semantic scene graph into 3D visuals using React Three Fiber.

### CinematicScene (`CinematicScene.tsx` — 120 lines)

The root R3F component that:
1. Creates a `<Canvas>` with ACES filmic tone mapping and shadow maps
2. Subscribes to `sceneStore.onSceneChange()` for reactive updates
3. Runs the tick loop (evaluateActor + evaluateScene) at 60 FPS
4. Composes all 3D sub-components:

```tsx
<Canvas shadows>
  <fog />
  <SceneLighting tone={tone} tensionLevel={tensionLevel} />
  <EnvironmentMesh envType={envType} tone={tone} />
  <SceneProps envType={envType} tone={tone} />
  <AtmosphereEffects effects={...} lightingTint={...} />
  {actors.map(actor => <CharacterMesh actor={actor} />)}
  <SceneCameraController camera={camera} tone={tone} />
  <ScenePostProcessing tone={tone} tensionLevel={tensionLevel} />
</Canvas>
```

### CharacterMesh (`CharacterMesh.tsx` — 300 lines)

Stylized 3D stickman with:
- **Body**: Capsule torso, sphere head, capsule arms and legs
- **Face**: Eyes (spheres with pupils), eyebrows (boxes), mouth (curved line)
- **8 emotion colors**: neutral=0xb0a898, sad=0x6688bb, happy=0xddcc77, nervous=0xddaa55, angry=0xcc5544, etc.
- **Emotion-driven posture**: Head tilt, shoulder drop, lean, arm angle per emotion
- **Blink system**: Random blinks every 2.5-6s
- **Gaze system**: Emotion-driven (nervous=jittery, sad=downward)
- **Walking animation**: Arm and leg swing via refs
- **Breathing**: Subtle scale oscillation

### EnvironmentMesh (`EnvironmentMesh.tsx` — 277 lines)

Procedural 3D environments for 11 types:

| Type | Features |
|------|----------|
| `indoor_room` | Ground plane, walls, ceiling |
| `apartment` | Warm-toned room |
| `hallway` | Narrow walls, deep fog |
| `hospital` | Tile pattern floor |
| `subway` | Tracks, rails, pillars |
| `outdoor_street` | Skyline buildings, no ceiling |
| `outdoor_park` | Trees, green ground |
| `outdoor_beach` | Sand ground, water plane |
| `outdoor_forest` | Dense trees |
| `rooftop` | Ledge, skyline, vent |
| `staircase` | Walls, no skyline |

Each environment has unique colors for ground, walls, ceiling, sky, and fog.

Sub-components:
- `SkylineBuildings` — Procedurally generated building silhouettes (seeded RNG)
- `Trees` — Procedural trunk + canopy spheres
- `WallPanels` — Back, left, right walls for indoor scenes

### SceneLighting (`SceneLighting.tsx` — 151 lines)

Cinematic three-point lighting driven by scene tone:

- **Key light** (DirectionalLight) — 1024x1024 shadow map, subtle positional sway
- **Fill light** (HemisphereLight) — Fills shadows
- **Rim/back light** (PointLight) — Edge lighting for silhouette readability
- **Ambient base** (AmbientLight) — Base illumination
- **Tension pulse** (PointLight) — Red pulsing when tension > 0.2

Each tone has a unique lighting configuration:

| Tone | Key Color | Key Intensity | Ambient |
|------|-----------|---------------|---------|
| neutral | warm white | 0.8 | 0.35 |
| lonely | blue | 0.5 | 0.2 |
| tense | orange-red | 0.7 | 0.15 |
| romantic | warm orange | 0.7 | 0.25 |
| threatening | dark red | 0.6 | 0.1 |

### AtmosphereEffects (`AtmosphereEffects.tsx` — 218 lines)

GPU particle systems and effects:

| Effect | Particles | Color | Speed | Notes |
|--------|-----------|-------|-------|-------|
| Rain | 800 | blue-gray | 8 | Falling down + slight wind |
| Snow | 400 | white | 0.8 | Slow drift down |
| Dust | 150 | amber | 0.15 | Horizontal drift |
| Embers | 60 | orange-red | 0.6 | Rising upward |
| Fog | — | — | — | 4 horizontal translucent planes |
| Flicker | — | — | — | Pulsing orange point light |

All particle systems use additive blending and depth-write disabled for proper transparency. Particles wrap around when they leave bounds.

### SceneCamera (`SceneCamera.tsx` — 126 lines)

Tone-driven camera controller:

- **Smooth interpolation**: Position and look-at lerp at 0.04
- **FOV interpolation**: Gradual FOV changes with 0.05 lerp
- **Camera mode adjustments**: close_up (0.5x distance), wide_shot (1.4x), dramatic_zoom (0.4x), tension (0.7x + FOV reduction)
- **Actor tracking**: Camera centers on actor group centroid
- **Handheld shake**: Sin-based drift for tense/threatening tones (configurable drift amount)

| Tone | FOV | Height | Distance | Drift |
|------|-----|--------|----------|-------|
| neutral | 50 | 3.0 | 8.0 | 0 |
| lonely | 55 | 3.5 | 10.0 | 0.003 |
| tense | 42 | 2.5 | 6.0 | 0.01 |
| threatening | 38 | 2.0 | 5.5 | 0.015 |

### ScenePostProcessing (`ScenePostProcessing.tsx` — 87 lines)

Post-processing effects via `@react-three/postprocessing`:

- **Bloom** — Glow on bright areas (intensity/threshold per tone)
- **Vignette** — Dark edges (offset/darkness per tone, boosted by tension)
- **Film Grain** (Noise) — Subtle grain overlay

| Tone | Bloom Intensity | Vignette Darkness | Noise |
|------|----------------|-------------------|-------|
| neutral | 0.3 | 0.5 | 0.03 |
| lonely | 0.5 | 0.75 | 0.05 |
| threatening | 0.35 | 0.9 | 0.07 |
| romantic | 0.6 | 0.55 | 0.02 |

### SceneProps (`SceneProps.tsx` — 249 lines)

Procedural environmental storytelling props:

| Prop | Component | Features |
|------|-----------|----------|
| Street Light | `StreetLight` | Pole + arm + lamp sphere + animated point light |
| Bench | `Bench` | Seat + backrest + metal legs |
| Vending Machine | `VendingMachine` | Body + glowing screen + blue point light |
| Neon Sign | `NeonSign` | Glowing box + flickering point light |
| Window | `Window` | Frame + translucent glass + cool point light |
| Hospital Bed | `HospitalBed` | Metal frame + mattress + 4 legs |
| Subway Pillar | `SubwayPillar` | Tall cylinder |
| Trash Can | `TrashCan` | Short cylinder |

Props are placed per-environment via `ENV_PROPS` lookup table.

---

## 11. UI Components

### PromptBar (`components/PromptBar.tsx` — 73 lines)

The primary user input. Routes prompts to either scene generation or mutation:

```
IF currentScene.actors.length > 0 AND currentScene.version > 0:
  → mutateScene(prompt, currentScene) → sceneStore.applyPatch(patch, prompt)
ELSE:
  → interpretScene(prompt) → sceneStore.setScene(scene)
```

### CinematicControls (`components/CinematicControls.tsx` — 152 lines)

5 semantic sliders for live directing:

| Slider | Range | Effect |
|--------|-------|--------|
| Pacing | 0-100 | Controls rhythm tempo (slow/medium/fast) and pause frequency |
| Tension | 0-100 | Controls spacing multiplier and contrast boost |
| Atmosphere | 0-100 | Controls ambient light intensity |
| Camera Energy | 0-100 | Controls motion energy scale |
| Emotional Distance | 0-100 | Controls headroom and camera zoom |

Each slider immediately applies a patch to the scene store.

### PlaybackControls (`components/PlaybackControls.tsx`)

Overlay at bottom of canvas:
- Pause / Play toggle
- Speed selector: 0.25x, 0.5x, 1x, 2x
- Reset button (restores default scene)

### CameraPresets (`components/CameraPresets.tsx`)

8 camera preset buttons:
- Intimate (close_up, zoom 1.15)
- Wide (wide_shot, zoom 0.75)
- Over Shoulder
- Dramatic (dramatic_zoom, zoom 1.5)
- Tension (tension mode)
- Follow
- Static
- Cinematic

### ActorDirector (`components/ActorDirector.tsx`)

Click an actor, then apply an emotion preset:
- Lists actors as selectable chips
- Shows 8 emotion presets when an actor is selected
- Applies emotion mutation via `sceneStore.applyPatch()`

### SessionSidebar (`components/SessionSidebar.tsx` — 43 lines)

Collapsible sidebar showing prompt history:
- Chronological list of all prompts
- Timestamps for each entry
- Hidden when no history exists

### DebugPanel (`components/DebugPanel.tsx` — 47 lines)

Toggle with **Ctrl+D**:
- Fixed panel on right side
- Shows live `JSON.stringify(scene, null, 2)` of current SceneGraph
- Updates every frame via `sceneStore.onSceneChange()`

### SceneInfoOverlay (`components/SceneInfoOverlay.tsx`)

Top-right overlay badges showing:
- Current tone (e.g., "LONELY")
- Beat index (e.g., "BEAT 3/5")
- Arc phase (e.g., "RISING")
- Moment score (e.g., "SCORE 72")
- Camera mode (e.g., "WIDE_SHOT")
- Tension level

### BeatTimeline (`components/BeatTimeline.tsx`)

Horizontal progress bar above playback controls:
- Segments for each beat in the sequence
- Current beat highlighted
- Past beats dimmed

### SceneGraphView (`components/SceneGraphView.tsx`)

Visual representation of the scene graph structure with expandable sections.

---

## 12. Scene Store & State Management

**File**: `client/src/store/sceneStore.ts` (287 lines)

A custom reactive store using the pub/sub pattern (no external state library for the core scene).

### API

| Method | Purpose |
|--------|---------|
| `getScene()` | Returns a deep clone of current scene |
| `setScene(scene)` | Replaces entire scene (used for new scene generation) |
| `mutateScene(mutator)` | In-place mutation with clone-mutate-notify pattern (used by tick loop) |
| `applyPatch(patch, prompt)` | Applies a sparse patch from server mutation (used by PromptBar) |
| `setPaused(paused)` | Pause/resume runtime |
| `isPaused()` | Check pause state |
| `setPlaybackSpeed(speed)` | Set playback speed multiplier |
| `getPlaybackSpeed()` | Get current speed |
| `resetScene()` | Reset to default empty scene |
| `onSceneChange(listener)` | Subscribe to scene changes (returns unsubscribe function) |

### Deep Merge

The store uses a custom `deepMerge()` function for applying patches:
- Recursively merges objects (non-array, non-null)
- Arrays are replaced entirely (not merged element-by-element)
- `undefined` values in the source are skipped
- This ensures sparse patches correctly overlay on existing state

### applyPatch() Flow

```
1. Clone current scene
2. Ensure semantic runtime state (simulation, anchors, continuity, etc.)
3. Apply semantic operations (if present in patch)
4. Deep merge: environment, camera, cinematicGrammar, atmosphere, rhythm
5. Merge actors by ID (existing actors updated, new actors added)
6. Replace relationships array
7. If meaningful changes detected:
   - Clear all Phase 2.6 computed fields
   - Clear all Phase 2.7 computed fields
   - Clear Phase 3 computed fields
   - Reset pose transitions and arc caches
8. Re-ensure semantic runtime state
9. Increment version
10. Add to mutationHistory and sessionHistory
11. Notify all listeners
```

---

## 13. Data Flow & Mutation Pipeline

### New Scene Generation

```
User types prompt
     │
     v
PromptBar detects empty scene (actors.length === 0 || version === 0)
     │
     v
interpretService.ts → POST /interpret { prompt }
     │
     v
Server: interpretPrompt()
  ├── OpenAI API (if OPENAI_API_KEY set) → structured JSON response
  └── createFallbackScene() (regex-based) → SceneGraph
     │
     v
normalizeSceneGraph() → fill missing fields
     │
     v
Response: complete SceneGraph JSON
     │
     v
Client: initActorJoints() for each actor
     │
     v
sceneStore.setScene(scene) → notify listeners → CinematicScene re-renders
```

### Scene Mutation

```
User types prompt (scene exists)
     │
     v
PromptBar detects existing scene (actors.length > 0 && version > 0)
     │
     v
mutateService.ts → POST /mutate { prompt, currentScene }
  (sends actors, environment, camera, cinematicGrammar, atmosphere, relationships, rhythm)
     │
     v
Server: mutateScene()
  ├── OpenAI API → structured JSON response → normalizePatch()
  └── createFallbackPatch() (regex-based) → Partial<SceneGraph>
     │
     v
Response: sparse patch (only changed fields)
     │
     v
sceneStore.applyPatch(patch, prompt)
  ├── Apply semantic operations
  ├── Deep merge changed fields
  ├── Clear computed fields
  ├── Increment version
  └── Notify listeners
     │
     v
CinematicScene re-renders with updated state
```

### Runtime Loop (every 16.67ms)

```
requestAnimationFrame
     │
     v
tickLoop accumulator
     │
     v
if (!paused):
  scaledDelta = deltaMs * playbackSpeed
  sceneStore.mutateScene(draft => {
    draft.actors = draft.actors.map(actor => evaluateActor(actor, scaledDelta, draft))
    evaluateScene(draft)
  })
     │
     v
sceneStore notifies listeners → CinematicScene useState updates → R3F re-renders
```

---

## 14. Cinematic Grammar & Tone System

### Tone Templates (`cinematicGrammarRegistry.ts`)

Each of the 8 tones maps to a `CinematicTemplate` that drives camera, spacing, timing, and visual treatment:

| Tone | Camera Mode | Spacing | Motion Energy | Pause Freq | Contrast | Headroom |
|------|------------|---------|---------------|------------|----------|----------|
| neutral | static | 1.0 | 1.0 | 4 | 0.0 | 1.0 |
| sad | wide_shot | 1.4 | 0.5 | 10 | 0.1 | 1.2 |
| tense | close_up | 0.7 | 1.2 | 2 | 0.5 | 0.7 |
| lonely | wide_shot | 1.8 | 0.6 | 8 | 0.2 | 1.4 |
| awkward | over_the_shoulder | 1.1 | 0.8 | 6 | 0.0 | 1.0 |
| energetic | follow | 0.8 | 1.5 | 1 | 0.1 | 0.9 |
| romantic | close_up | 0.6 | 0.7 | 6 | 0.15 | 1.1 |
| threatening | tension | 0.5 | 1.3 | 1 | 0.6 | 0.6 |

### Semantic Runtime Profiles (`semanticProfiles.ts`)

Extended tone profiles used by runtime systems:

Each tone also defines:
- `gestureEnergy` — How much actors gesture
- `preferredRelationshipDistance` — How far apart actors stand
- `lightingTint` — warm, cold, or null
- `negativeSpace` — How much empty space around actors
- `pauseScale` — How long pauses last

---

## 15. Emotion System

### 8 Emotion States

| Emotion | Body Color | Head Tilt | Shoulder Drop | Lean | Arm Angle |
|---------|-----------|-----------|---------------|------|-----------|
| neutral | 0xb0a898 | 0 | 0 | 0 | 0.15 |
| sad | 0x6688bb | -0.2 | 0.12 | -0.05 | 0.05 |
| happy | 0xddcc77 | 0.1 | -0.05 | 0.03 | 0.35 |
| nervous | 0xddaa55 | -0.08 | 0.08 | -0.03 | 0.1 |
| angry | 0xcc5544 | 0.15 | -0.1 | 0.08 | 0.25 |
| exhausted | 0x7777aa | -0.25 | 0.18 | -0.08 | 0.02 |
| awkward | 0xaa9977 | -0.12 | 0.05 | -0.02 | 0.08 |
| excited | 0xddbb44 | 0.12 | -0.08 | 0.05 | 0.4 |

### Emotion Effects on Systems

- **Gaze**: Nervous = jittery random, Sad/exhausted = downward
- **Breathing**: Nervous = fast (4x), Exhausted = slow (1.5x), Normal = 2.5x
- **Eyes**: Nervous/excited = wider, Angry = constricted pupils
- **Brows**: Sad = raised inner, Angry = lowered, Nervous = slightly raised
- **Mouth**: Happy/excited = smile curve, Sad/exhausted = frown, Angry = up-curve, Nervous = wavy, Awkward = asymmetric

---

## 16. Camera System

### 7 Camera Modes

| Mode | FOV Adjust | Distance Adjust | Height Adjust | Notes |
|------|-----------|----------------|---------------|-------|
| static | — | — | — | Fixed position |
| follow | — | — | — | Tracks actor centroid |
| close_up | 35 | 0.5x | 0.7x | Tight on subject |
| wide_shot | 60 | 1.4x | 1.2x | Establishes environment |
| over_the_shoulder | — | 0.6x | 0.85x | — |
| dramatic_zoom | 30 | 0.4x | — | Intense focus |
| tension | FOV-tension*10 | 0.7x | — | FOV narrows with tension |

### Camera Behavior

- **Smooth interpolation**: All camera movement lerps at 0.04 speed
- **Handheld shake**: Composite sine waves at different frequencies for organic drift
- **FOV animation**: Gradual FOV transitions at 0.05 lerp speed
- **Actor tracking**: Computes centroid of all actor 3D positions

---

## 17. Atmosphere & Environment System

### 11 Environment Types

**Indoor** (walls + ceiling):
- `indoor_room` — Generic dark room
- `apartment` — Warm-toned residential
- `hallway` — Narrow corridor, deep fog
- `hospital` — Cool tones, tile floor pattern
- `subway` — Dark, metallic, tracks + rails
- `staircase` — Enclosed, moody

**Outdoor** (no ceiling, optional skyline):
- `outdoor_street` — Building skyline, neon signs, streetlights
- `outdoor_park` — Trees, green ground, benches
- `outdoor_beach` — Sand ground, water plane, warm sky
- `outdoor_forest` — Dense trees, green fog

**Special**:
- `rooftop` — Building ledge, skyline, vent, open sky

### Atmosphere Effects

| Effect | Visual | Interaction |
|--------|--------|-------------|
| Rain | 800 blue-gray particles falling | Additive blending |
| Snow | 400 white particles drifting | Slow, wide spread |
| Dust | 150 amber particles floating | Horizontal drift |
| Embers | 60 orange particles rising | Upward motion |
| Fog | 4 translucent horizontal planes | Layered depth |
| Flicker | Pulsing orange point light | Random intensity drops |

### Lighting Tints

- `cold` — Blue-shifted ambient
- `warm` — Orange-shifted ambient
- `night` — Very dark, low ambient intensity (0.4)
- `rgba(0,0,0,0)` — No tint (default)

---

## 18. Phase Progression

Animaster has been built in phases, each adding depth to the cinematic runtime:

### Phase 1 — Vertical Slice (Tasks 1-33)
- Basic scene generation and rendering
- Stickman character with walking animation
- PromptBar with interpret/mutate routing
- Session history sidebar
- Debug panel (Ctrl+D)
- Error recovery (timeouts, fallbacks)

### Phase 2 — Cinematic Grammar (Tasks 34-80)
- 8 scene tones with cinematic templates
- 8 emotion states with body animations
- 7 camera modes with auto-selection
- Atmosphere effects (rain, fog, flicker, dust)
- Character relationships (approaching, confronting, avoiding, conversing)
- Actor staging rules (1-actor and 2-actor layouts)
- Acting primitives (weight shift, look around, hesitation, pacing)
- Scene rhythm (tempo, pause frequency, motion energy curves)
- Continuity tracking

### Phase 2.5 — Semantic Runtime Hardening
- Deterministic execution with seeded PRNG
- Semantic mutation operations (discriminated union)
- Action instances with phases, priorities, and interruption
- Semantic anchors (door, chair, window, etc.)
- Continuity validation and repair

### Phase 2.6 — Cinematic Intelligence Deepening (Tasks 81-120)
- Emotional spatial intelligence (intimacy, isolation, confrontation)
- Dramatic timing engine (anticipation, silence, tension beats)
- Shot intent reasoning (establish, reveal, isolate, compress)
- Attention direction system
- Deep acting (posture openness, gaze aversion, breathing)
- Composition heuristics (rule-of-thirds, negative space, visual weight)
- Power dynamics (dominance, submission, pursuit, withdrawal)
- Tension accumulation with compression
- Anticipation build-peak-release cycle
- Readability validation

### Phase 2.7 — Cinematic Beat Runtime (Tasks 121-160)
- Beat sequences (ordered emotional beats with camera/spacing/timing responses)
- 6 tone-specific beat templates
- Emotional arcs (5-phase: setup → rising → peak → falling → resolution)
- Embodied pose language (emotion-to-joint-profile mapping)
- Reaction chains (triggered by approach, confrontation, comfort, etc.)
- Story anchors (bench, window, streetlight silhouettes)
- Scene evolution tracking (spacing, posture, pacing trajectories)
- Cinematic moment scoring

### Phase 3 — Semantic Cinematic Creation (Tasks 161-200)
- CinematicControls (5 semantic sliders)
- PlaybackControls (pause, speed, reset)
- CameraPresets (8 lens modes)
- ActorDirector (click-to-direct emotions)
- SceneInfoOverlay, BeatTimeline, SceneGraphView
- 11 procedural environment types
- 8 atmospheric effects
- Server mutations for live directing
- Prompt suggestions

### Phase 4 — Visual Evolution (Tasks 201-227)
- Expressive faces (eyes, brows, mouth per emotion)
- Gaze tracking system
- Blink system
- Parallax depth layers
- Cinematic lighting (key, rim, fill, light shafts)
- Snow and ember particles
- Animated props (vending machine, neon sign, bench, etc.)
- Post-processing (bloom, color grading, vignette)

### Phase 5 — Infrastructure Integration (Tasks 228+)
- Three.js, React Three Fiber, React Three Drei installation
- Post-processing pipeline
- Asset loader with LRU cache
- Atmosphere controller architecture
- Camera rig architecture
- Audio manager architecture

### Phase 5.5 — Full Active Integration
- CinematicScene R3F Canvas replacing PixiJS
- EnvironmentMesh — 11 procedural 3D environments
- CharacterMesh — Stylized 3D stickman with emotion-driven posture and face
- AtmosphereEffects — GPU particle systems
- SceneLighting — Tone-driven three-point lighting
- SceneCamera — Smooth lerp camera with handheld shake
- ScenePostProcessing — Bloom, vignette, film grain
- SceneProps — 8 procedural prop types

---

## 19. API Reference

### `GET /health`

Health check endpoint.

**Response**: `{ "status": "ok" }`

### `POST /interpret`

Generate a new scene from a natural language prompt.

**Request Body**:
```json
{
  "prompt": "a nervous stickman walking on a dark street at night"
}
```

**Response**: Complete `SceneGraph` JSON (see [Shared Types](#6-shared-types-shared))

**Status Codes**:
- `200` — Success
- `400` — Missing prompt
- `502` — OpenAI error (falls back to regex)
- `504` — Timeout (30s)

### `POST /mutate`

Mutate an existing scene based on a natural language command.

**Request Body**:
```json
{
  "prompt": "make it lonelier",
  "currentScene": {
    "actors": [...],
    "environment": {...},
    "camera": {...},
    "cinematicGrammar": {...},
    "atmosphere": {...},
    "relationships": [...],
    "rhythm": {...}
  }
}
```

**Response**: `Partial<SceneGraph>` — only changed fields

**Status Codes**:
- `200` — Success
- `400` — Missing prompt or currentScene
- `502` — OpenAI error (falls back to regex)

### Supported Mutation Commands (Fallback Mode)

| Category | Commands |
|----------|---------|
| **Lighting** | darker, dim, brighter, bright, lighter, warmer, warm |
| **Emotions** | nervous, anxious, sad, depressed, happy, cheerful, excited, thrilled, angry, furious, exhausted, tired, awkward, neutral, calm |
| **Tones** | lonely, tense, romantic, love, intimate, energetic, fast, chaotic, threatening, danger, menacing |
| **Effects** | rain, add fog, foggy, add flicker, flickering, cold light, warm light, night |
| **Environments** | park, garden, street, road, alley, beach, ocean, forest, woods, rooftop, hallway, subway, hospital, apartment, staircase |
| **Actions** | walk, stop, sit, approach, pace, hesitate |
| **Actors** | add character/person/someone, remove character/person |

---

## 20. Development Workflow

### Daily Development

```bash
# Start server with hot reload
cd server && npx tsx watch src/index.ts

# Start client with HMR
cd client && npx vite --host 0.0.0.0
```

### Type Checking

```bash
# Server
cd server && npx tsc -p tsconfig.json --noEmit

# Client
cd client && npx tsc -p tsconfig.json --noEmit
```

### Adding New Features

1. **Add types** to `shared/src/scene.ts` first
2. **Add runtime logic** in `client/src/runtime/` — create a subdirectory for new systems
3. **Wire into evaluators** — add to `sceneEvaluator.ts` (scene-level) or `actorEvaluator.ts` (per-actor)
4. **Add visual rendering** in `client/src/three/components/` — read from scene state, render with R3F
5. **Add server support** — update fallback functions in `interpret.ts` and `mutate.ts`
6. **Add UI controls** — create component in `client/src/components/`

### Key Conventions

- All scene state lives in `SceneGraph` — never store rendering state outside it
- Runtime evaluators mutate the scene graph in-place (inside `mutateScene()` callback)
- Three.js components read from scene state passed as props — they never write back
- Use `useFrame()` for per-frame animations in R3F components
- Use `useRef()` for imperative updates (eyes, limbs) to avoid React re-renders
- Sparse patches: mutation responses should only include changed fields

---

## 21. Glossary

| Term | Definition |
|------|-----------|
| **SceneGraph** | The root data structure containing all scene state |
| **Tone** | The emotional mood of a scene (lonely, tense, romantic, etc.) |
| **Sparse Patch** | A partial SceneGraph containing only changed fields from a mutation |
| **Semantic Operation** | A typed mutation command (SetTone, QueueActorAction, etc.) |
| **Beat** | A single emotional moment in a beat sequence |
| **Beat Sequence** | An ordered list of emotional beats that unfold over time |
| **Emotional Arc** | A 5-phase narrative curve (setup → rising → peak → falling → resolution) |
| **Semantic Anchor** | A named position in the environment (door, chair, bench, window) |
| **Story Anchor** | A symbolic environment shape (bench silhouette, streetlight, window) |
| **Cinematic Template** | Camera, spacing, and timing defaults for a given tone |
| **Action Instance** | A semantic action with type, target, phase, priority, and interruptibility |
| **Action Plan** | A queue of pending ActionInstances for an actor |
| **Continuity** | Validation that scene state is consistent across mutations |
| **Power Dynamic** | The dominance/submission relationship between two actors |
| **Spatial Intent** | The emotional meaning of spacing (intimacy, isolation, confrontation) |
| **Shot Intent** | The cinematic purpose of a camera shot (establish, reveal, isolate) |
| **Moment Score** | A quality metric combining emotional clarity, pose readability, dramatic progression, and beat coherence |
| **Tick Loop** | The fixed 60 FPS game loop that drives all runtime evaluation |
| **R3F** | React Three Fiber — React renderer for Three.js |
| **Fallback** | Regex-based scene generation/mutation when no OpenAI API key is available |

---

*This wiki was auto-generated from the ANIMASTER2 codebase. For the latest architecture details, refer to the source code and type definitions in `shared/src/scene.ts`.*
