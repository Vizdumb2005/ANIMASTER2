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
18. [Scene Series Feature](#18-scene-series-feature)
19. [Demo System](#19-demo-system)
20. [AI Provider System](#20-ai-provider-system)
21. [API Reference](#21-api-reference)
22. [Development Workflow](#22-development-workflow)
23. [Glossary](#23-glossary)

---

## 1. Project Overview

Animaster is **not** an animation editor, timeline tool, or Blender alternative. It is a **semantic cinematic creation platform** where:

- Users describe scenes using natural language prompts
- An LLM (Groq, OpenAI, Anthropic, Gemini, or local Ollama) interprets the prompt into a semantic scene graph
- A deterministic runtime evaluates the scene graph every frame at 60 FPS
- A Three.js/React Three Fiber renderer visualizes the scene with cinematic lighting, atmosphere, and post-processing
- Users can mutate scenes conversationally ("make it lonelier", "add rain", "make him nervous")
- Users can build **scene series** — sequences of scenes that form a narrative arc

The system feels like **directing a movie through language** — all editing happens through natural language prompts and semantic controls (sliders for pacing/tension/atmosphere), never through manual animation curves or keyframes.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Client | React 19, TypeScript, Vite 6 |
| 3D Rendering | Three.js 0.184, React Three Fiber 9, React Three Drei 10 |
| Post-Processing | @react-three/postprocessing 3, postprocessing 6 |
| State Management | Custom reactive store (pub/sub pattern) |
| Server | Express 4, TypeScript, tsx (dev) |
| AI | Groq API (qwen/qwen3-32b) with multi-provider fallback |
| Shared Types | TypeScript monorepo workspace (`@animaster/shared`) |

### Key Features

- **Natural Language Scene Generation** — Describe any scene, get a fully populated scene graph
- **Conversational Mutation** — "make it lonelier", "add rain", "push camera closer"
- **Cinematic Director Controls** — 9 semantic sliders (Emotional Intensity, Visual Density, Symbolic Abstraction, etc.)
- **Scene Series** — Build multi-scene narratives with navigation
- **Demo Experiences** — Pre-built scenarios with step-by-step mutation guides
- **Real-time 60 FPS Runtime** — 25+ evaluator modules computing acting, camera, tension, arcs
- **Atmospheric Effects** — Rain, fog, flicker, dust, snow, embers
- **Procedural Environments** — 18+ location types with semantic world generation

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
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT (localhost:5173)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │   App.tsx   │───▶│  PromptBar  │───▶│ SceneStore  │───▶│  TickLoop   │  │
│  └─────────────┘    └─────────────┘    └──────┬──────┘    └──────┬──────┘  │
│         │                                     │                   │         │
│         ▼                                     ▼                   ▼         │
│  ┌─────────────┐    ┌─────────────────────────────────────────────────┐    │
│  │    UI       │    │              RUNTIME EVALUATORS                 │    │
│  │ Components  │    │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │
│  │             │    │  │ Staging │ │ Camera  │ │ Acting  │ ...25+    │    │
│  │ • Director  │    │  └─────────┘ └─────────┘ └─────────┘           │    │
│  │ • Controls  │    │  ┌─────────┐ ┌─────────┐ ┌─────────┐           │    │
│  │ • Series    │    │  │ Tension │ │  Arcs   │ │ Reactions│          │    │
│  │ • Demos     │    │  └─────────┘ └─────────┘ └─────────┘           │    │
│  └─────────────┘    └─────────────────────────────────────────────────┘    │
│         │                                     │                             │
│         ▼                                     ▼                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    THREE.JS / R3F RENDERER                          │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │   │
│  │  │ Environment  │ │  Characters  │ │  Atmosphere  │                │   │
│  │  │    Mesh      │ │    Mesh      │ │   Effects    │                │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │   │
│  │  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐                │   │
│  │  │   Lighting   │ │    Props     │ │   Post-FX    │                │   │
│  │  └──────────────┘ └──────────────┘ └──────────────┘                │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                                      │ HTTP/WebSocket
                                      ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                             SERVER (localhost:3001)                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐  │
│  │  /interpret │    │   /mutate   │    │ /live-mutate│    │    /ai      │  │
│  │   Route     │    │   Route     │    │   Route     │    │   Route     │  │
│  └──────┬──────┘    └──────┬──────┘    └─────────────┘    └─────────────┘  │
│         │                  │                                               │
│         ▼                  ▼                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      AI ORCHESTRATOR                                 │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐   │   │
│  │  │   Intent    │ │   Agents    │ │   Context   │ │   Memory    │   │   │
│  │  │  Compiler   │ │ (6 agents)  │ │  Assembler  │ │   System    │   │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                      PROVIDER REGISTRY                               │   │
│  │  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐      │   │
│  │  │ Groq  │ │OpenAI │ │Anthropic│ │Gemini │ │Ollama │ │ Mock  │      │   │
│  │  │(qwen) │ │(gpt-4)│ │(claude)│ │(gemini)│ │(local)│ │(regex)│      │   │
│  │  └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
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
- (Optional) Groq API key for AI-powered scene generation

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
# Primary AI provider — Groq (qwen/qwen3-32b)
GROQ_API_KEY=gsk_...
GROQ_MODEL=qwen/qwen3-32b

# Fallback providers (optional)
# OPENAI_API_KEY=sk-...
# OPENAI_MODEL=gpt-4o-mini
# ANTHROPIC_API_KEY=...
# GEMINI_API_KEY=...
# OLLAMA_URL=http://localhost:11434
# OLLAMA_MODEL=llama3

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
│   │   └── scene.ts              # 500+ lines — ALL shared type definitions
│   ├── package.json
│   └── tsconfig.json
│
├── server/
│   ├── src/
│   │   ├── index.ts              # Express app entry point + WebSocket
│   │   ├── routes/
│   │   │   ├── interpret.ts      # POST /interpret — scene generation
│   │   │   ├── mutate.ts         # POST /mutate — scene mutation
│   │   │   ├── liveMutate.ts     # Real-time mutation via WebSocket
│   │   │   └── ai.ts             # AI status & control endpoints
│   │   ├── prompts/
│   │   │   ├── sceneGenerationPrompt.ts
│   │   │   └── sceneMutationPrompt.ts
│   │   ├── planning/
│   │   │   └── scenePlanner.ts   # Regex-based scene planning fallback
│   │   ├── memory/
│   │   │   └── sceneMemory.ts    # In-memory scene history
│   │   └── ai/
│   │       ├── providers/        # AI provider implementations
│   │       │   ├── groqProvider.ts      # Groq (qwen/qwen3-32b) ⭐ PRIMARY
│   │       │   ├── openaiProvider.ts
│   │       │   ├── anthropicProvider.ts
│   │       │   ├── geminiProvider.ts
│   │       │   ├── ollamaProvider.ts
│   │       │   ├── mockProvider.ts
│   │       │   ├── providerInterface.ts
│   │       │   └── providerRegistry.ts
│   │       ├── runtime/
│   │       │   └── orchestrator.ts      # AI task routing & provider selection
│   │       ├── compiler/
│   │       │   └── intentCompiler.ts    # Prompt → CinematicIntent
│   │       ├── context/
│   │       │   ├── contextAssembler.ts
│   │       │   └── contextCompression.ts
│   │       └── agents/           # 6 cinematic agents
│   │           ├── cinematographerAgent.ts
│   │           ├── environmentAgent.ts
│   │           ├── emotionalArcAgent.ts
│   │           ├── blockingAgent.ts
│   │           ├── dialogueAgent.ts
│   │           ├── lightingAgent.ts
│   │           └── continuityAgent.ts
│   ├── package.json
│   └── tsconfig.json
│
├── client/
│   ├── src/
│   │   ├── App.tsx               # Root component
│   │   ├── main.tsx              # React entry point
│   │   ├── styles.css            # All UI styles (700+ lines)
│   │   │
│   │   ├── components/           # UI components (20+ files)
│   │   │   ├── PromptBar.tsx           # Main input + scene creation
│   │   │   ├── CinematicControls.tsx   # Semantic sliders
│   │   │   ├── CinematicDirector.tsx   # 9 director controls
│   │   │   ├── SceneSeriesPanel.tsx    # Scene series builder
│   │   │   ├── DemoSelector.tsx        # Demo experiences + mutations
│   │   │   ├── SessionSidebar.tsx      # Prompt history
│   │   │   ├── PlaybackControls.tsx    # Play/pause/speed
│   │   │   ├── CameraPresets.tsx       # Shot buttons
│   │   │   ├── ActorDirector.tsx       # Per-actor emotion control
│   │   │   ├── BeatTimeline.tsx        # Beat visualization
│   │   │   ├── SceneGraphView.tsx      # Debug scene inspector
│   │   │   └── ...more
│   │   │
│   │   ├── services/             # API communication
│   │   │   ├── interpretService.ts
│   │   │   ├── mutateService.ts
│   │   │   └── aiService.ts
│   │   │
│   │   ├── store/
│   │   │   └── sceneStore.ts     # Central state (350+ lines)
│   │   │                         # - Scene graph + series management
│   │   │                         # - Director intent tracking
│   │   │                         # - Pub/sub listeners
│   │   │
│   │   ├── runtime/              # 25+ runtime evaluator modules
│   │   │   ├── tickLoop.ts       # 60 FPS fixed timestep loop
│   │   │   ├── sceneEvaluator.ts # Main scene evaluation orchestrator
│   │   │   ├── actorEvaluator.ts # Per-actor tick evaluation
│   │   │   ├── actionRuntime.ts  # Action queue processing
│   │   │   │
│   │   │   ├── behaviors/        # idle, walk, sit, pace, approach
│   │   │   ├── acting/           # deepActing, hesitation, weightShift
│   │   │   ├── camera/           # cameraRuntime, shotIntent, intentDriven
│   │   │   ├── beats/            # beatSequence, beatActing, beatCamera
│   │   │   ├── arcs/             # emotionalArc templates + evaluator
│   │   │   ├── emotions/         # emotion modifiers per emotion
│   │   │   ├── tension/          # tensionAccumulator, compression
│   │   │   ├── reactions/        # reactionTrigger, reactionRunner
│   │   │   ├── staging/          # stagingEvaluator, stagingRules
│   │   │   ├── continuity/       # continuityTracker, emotionalAftermath
│   │   │   ├── world/            # proceduralWorldGenerator
│   │   │   └── ...30+ more modules
│   │   │
│   │   └── three/                # Three.js/R3F rendering layer
│   │       ├── components/
│   │       │   ├── CinematicScene.tsx  # Main canvas + tick loop
│   │       │   ├── CharacterMesh.tsx   # Stickman renderer
│   │       │   ├── EnvironmentMesh.tsx # Room/world geometry
│   │       │   ├── AtmosphereEffects.tsx
│   │       │   ├── SceneLighting.tsx
│   │       │   ├── ScenePostProcessing.tsx
│   │       │   └── ...more
│   │       ├── effects/          # rain, fog, flicker, bloom, vignette
│   │       ├── environments/     # environmentRenderer, parallaxSystem
│   │       └── postprocessing/   # CinematicEffects pipeline
│   │
│   └── package.json
```
---

## 6. Shared Types (`shared/`)

The `shared` package contains **all** type definitions used by both client and server. This ensures type safety across the API boundary.

### Core Types

```typescript
// Actor types
type ActorEmotion = 'neutral' | 'sad' | 'happy' | 'nervous' | 'excited' | 'awkward' | 'angry' | 'exhausted';
type ActorAction = 'idle' | 'walking' | 'sitting' | 'approaching' | 'pacing';

interface Actor {
  id: string;
  label: string;
  type: 'humanoid';
  position: Vector2;
  targetPosition: Vector2 | null;
  emotionState: ActorEmotion;
  emotionIntensity?: number;
  currentAction: ActorAction;
  actionQueue: ActorAction[];       // Sequential actions to execute
  activeAction?: ActionInstance | null;
  joints: StickmanJoints;
  actingState?: ActingState;
  actionElapsed: number;
}

// Environment types
type LocationType = 'subway' | 'alley' | 'rooftop' | 'forest' | 'beach' | 
                    'apartment' | 'hallway' | 'hospital' | 'parking_garage' |
                    'diner' | 'office' | 'warehouse' | 'indoor_room' |
                    'outdoor_street' | 'outdoor_park' | 'outdoor_beach' |
                    'outdoor_forest' | 'staircase';

interface Environment {
  type: LocationType;
  backgroundColor: string;
  floorColor: string;
  wallColor: string;
  width: number;   // 960
  height: number;  // 540
}

// Cinematic grammar
type SceneTone = 'neutral' | 'sad' | 'tense' | 'lonely' | 'awkward' | 'energetic' | 'romantic' | 'threatening';
type CameraMode = 'static' | 'follow' | 'close_up' | 'wide_shot' | 'over_the_shoulder' | 'dramatic_zoom' | 'tension';

interface CinematicGrammar {
  tone: SceneTone;
  template: CinematicTemplate;  // cameraMode, spacingMultiplier, motionEnergyScale, etc.
}

// Atmosphere
type AtmosphereEffect = 'rain' | 'fog' | 'flicker' | 'dust' | 'snow' | 'embers' | 'none';
interface AtmosphereProfile {
  effects: AtmosphereEffect[];
  lightingTint: string;      // 'warm', 'cold', 'night', 'rgba(0,0,0,0)'
  ambientIntensity: number;  // 0-1
}

// Rhythm
interface SceneRhythm {
  tempo: 'slow' | 'medium' | 'fast';
  pauseFrequencyPerMinute: number;
  motionEnergyCurve: 'linear' | 'ease-in' | 'ease-out' | 'sharp';
}

// The complete SceneGraph (500+ lines of types)
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
  
  // Phase 2.6 runtime fields (computed each tick)
  emotionalSpatial?: EmotionalSpatialState;
  dramaticBeats?: DramaticBeat[];
  shotIntent?: ShotIntent;
  attentionFocus?: AttentionFocus;
  compositionMetrics?: CompositionMetrics;
  powerDynamics?: PowerDynamic[];
  tensionState?: TensionState;
  anticipationState?: AnticipationState;
  
  // Phase 2.7 runtime fields
  beatSequence?: BeatSequence;
  emotionalArc?: EmotionalArc;
  reactionChains?: ReactionChain[];
  storyAnchors?: StoryAnchor[];
  sceneEvolution?: SceneEvolution;
  cinematicMomentScore?: CinematicMomentScore;
  
  // Phase 6 world generation
  worldPlan?: SemanticWorldPlan;
  worldLayout?: WorldLayout;
  visualStyle?: VisualStyleProfile;
}
```

### Scene Series Types (client extension)

```typescript
type SceneSeries = {
  id: string;
  title: string;
  scenes: SceneGraph[];      // Array of complete scene graphs
  activeIndex: number;       // Currently viewing scene index
};

type DirectorIntent = Record<string, number>;  // 0-1 normalized values
type ActorOverride = { actorId: string; emotion: ActorEmotion; intensity?: number };
type DirectingContext = {
  directorIntent: DirectorIntent;
  actorOverrides: ActorOverride[];
  beatSequence?: BeatSequenceContext;
};
```

---

## 7. Server (`server/`)

The server handles all AI communication, scene generation, and mutation.

### Entry Point (`index.ts`)

```typescript
// Express + WebSocket server
const app = express();
const wss = new WebSocketServer({ server });

// Routes
app.use('/interpret', interpretRouter);   // POST — create new scene
app.use('/mutate', mutateRouter);          // POST — mutate existing scene
app.use('/live-mutate', liveMutateRouter); // WebSocket — real-time edits
app.use('/ai', aiRouter);                  // GET — provider status

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));
```

### Routes

#### `POST /interpret`

Creates a **new scene** from a natural language prompt.

**Request:**
```json
{
  "prompt": "A lonely man waits outside a hospital in the rain at night",
  "directing": {
    "directorIntent": { "emotionalIntensity": 0.7, "symbolicAbstraction": 0.3 },
    "actorOverrides": []
  }
}
```

**Response:** Complete `SceneGraph` with all fields populated by LLM + fallback.

**Flow:**
1. `orchestrator.orchestrateSceneGeneration(prompt)` — compiles intent, runs agents
2. Resolves best available AI provider (Groq → OpenAI → Anthropic → Gemini → Ollama → Mock)
3. Calls LLM with `sceneGenerationSystemPrompt` + user prompt + director context
4. LLM returns JSON matching `sceneGenerationResponseSchema`
5. Normalizes/validates response, applies director intent adjustments
6. Falls back to regex-based scene planner if all providers fail

#### `POST /mutate`

Mutates an **existing scene** with a conversational edit.

**Request:**
```json
{
  "prompt": "make it more tense, add fog",
  "currentScene": { /* partial scene state */ },
  "directing": { /* optional context */ }
}
```

**Response:** Partial `SceneGraph` patch (only changed fields).

**Flow:**
1. `orchestrator.orchestrateMutation(prompt, currentScene)` — compiles intent, checks continuity
2. Resolves provider, calls LLM with `sceneMutationSystemPrompt`
3. LLM returns JSON patch matching `sceneMutationResponseSchema`
4. Falls back to regex-based mutation rules if providers fail

### AI Provider System

The server implements a **provider registry** with automatic fallback:

| Provider | Model | Latency | Context | Status |
|----------|-------|---------|---------|--------|
| **Groq** | qwen/qwen3-32b | ~200ms | 32K | ⭐ Primary |
| OpenAI | gpt-4o-mini | ~500ms | 128K | Fallback |
| Anthropic | claude-3-haiku | ~400ms | 200K | Fallback |
| Gemini | gemini-1.5-flash | ~300ms | 1M | Fallback |
| Ollama | llama3 (local) | varies | 8K | Local fallback |
| Mock | regex fallback | <10ms | ∞ | Ultimate fallback |

**Provider Selection Logic:**
- **Complex tasks** (high intensity, long prompts): Groq → OpenAI → Anthropic → Gemini → Mock
- **Moderate tasks**: Groq → Gemini → OpenAI → Ollama → Mock
- **Simple tasks** (low intensity, short prompts): Groq → Ollama → Gemini → Mock

### AI Orchestrator (`orchestrator.ts`)

The orchestrator is the brain of the server:

```typescript
class AIOrchestrator {
  // Phase 1: Intent Compilation
  intent = compileIntent(prompt);  // → CinematicIntent
  
  // Phase 2: Agent Execution (parallel, deterministic)
  cinematography = planCinematography(intent, actorCount);
  environment = planEnvironment(intent, prompt);
  emotionalArc = planEmotionalArc(intent, actorCount);
  blocking = planBlocking(intent, actorCount);
  dialogue = planDialogue(intent, actorCount);
  lighting = planLighting(intent);
  
  // Phase 3: Provider Selection & LLM Call
  provider = providerRegistry.getProviderForComplexity(complexity);
  scenePlan = await provider.complete(prompt);
  
  // Phase 4: Memory Recording
  sceneMemory.recordScene({...});
}
```

### Agents (Deterministic)

Six agents run without LLM calls to provide domain-specific planning:

1. **CinematographerAgent** — framing, shot composition, camera language
2. **EnvironmentAgent** — location type, time of day, weather, visual density
3. **EmotionalArcAgent** — emotional trajectory, peak moments, recovery
4. **BlockingAgent** — actor positioning, spatial relationships
5. **DialogueAgent** — speech patterns, naturalism level
6. **LightingAgent** — lighting language, tint, practicals

### Prompts

#### Scene Generation Prompt

The system prompt instructs the LLM to output a complete `SceneGraph`:

- Validates against JSON schema
- Infers environment from prompt keywords
- Sets emotions: neutral, sad, happy, nervous, excited, awkward, angry, exhausted
- Sets actions: idle, walking, sitting, approaching, pacing
- Supports **action queues** — "walks and sits" → currentAction: "walking", actionQueue: ["sitting"]
- Respects director intent (0-1 values) as style modifiers

#### Scene Mutation Prompt

The mutation prompt instructs the LLM to output a **patch**:

- Only includes changed fields
- Preserves all existing actors unless explicitly modified
- Supports `semanticOperations` array for executable runtime mutations
- Maps tone changes to camera/lighting/rhythm adjustments
- Validates against partial schema

---

## 8. Client (`client/`)

The client is a React + Three.js application that renders the cinematic scene in real-time.

### App Structure

```tsx
// App.tsx
export default function App() {
  return (
    <main className="app-shell">
      <PromptBar />                                    // Main input
      
      <CinematicScene />                               // Three.js canvas
      <PlaybackControls />                             // Play/pause/speed
      
      <div className="directing-panel">
        <CinematicControls />                          // Pacing, tension, atmosphere sliders
        <CameraPresets />                              // Shot buttons
        <ActorDirector />                              // Per-actor emotion
        <ShotSelector />                               // Camera mode buttons
        <EmotionalSpaceControls />                    // Intimacy/distance sliders
        <DirectorialStyleSelector />                  // Visual style presets
        <CinematicDirector />                         // 9 semantic sliders
        <DemoSelector />                              // Demo scenarios + mutations
        <SceneSeriesPanel />                          // Multi-scene series
      </div>
    </main>
  );
}
```

### Services

#### `interpretService.ts`

```typescript
async function interpretScene(
  prompt: string, 
  directing?: DirectingContext
): Promise<SceneGraph> {
  const response = await fetch(`${apiBaseUrl}/interpret`, {
    method: 'POST',
    body: JSON.stringify({ prompt, directing })
  });
  return response.json();
}
```

#### `mutateService.ts`

```typescript
async function mutateScene(
  prompt: string,
  currentScene: SceneGraph,
  directing?: DirectingContext
): Promise<Partial<SceneGraph>> {
  const response = await fetch(`${apiBaseUrl}/mutate`, {
    method: 'POST',
    body: JSON.stringify({ prompt, currentScene, directing })
  });
  return response.json();
}
```

#### `aiService.ts`

Exposes client-side routes for fetching AI Status, debugging compiling intents, fetching and clearing scene memory, running prompt tests, and loading demo experiences.

```typescript
export async function fetchAIStatus(): Promise<AIStatus>;
export async function debugIntent(prompt: string): Promise<IntentDebug>;
export async function debugReasoning(prompt: string): Promise<ReasoningDebug>;
export async function fetchMemory(): Promise<MemoryState>;
export async function clearMemory(): Promise<void>;
export async function runPromptTests(): Promise<PromptTestResults>;
export async function fetchDemos(): Promise<DemoExperience[]>;
```

#### `useSceneWebSocket.ts`

A custom React hook that establishes a real-time WebSocket connection to `ws://localhost:3001` (or the configured backend). It listens for `'sceneUpdate'` messages broadcast by the server, parsed into a `SceneGraph` structure, and merges the data directly into the client's `sceneStore` via `sceneStore.mutateScene()`. It also supports auto-reconnection with a 3-second delay.

---

## 9. Runtime Systems

The Animaster runtime operates on a **deterministic frame-evaluation architecture** that decouples scene planning (LLM compilation) from scene execution.

### The Tick Loop (`tickLoop.ts`)

The execution heart of the application is a fixed 60 FPS tick loop implemented in [tickLoop.ts](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/tickLoop.ts).
- Drives execution at a steady `16.67ms` timestep (`TICK_DELTA_MS`).
- Utilizes `requestAnimationFrame` for scheduling.
- Calculates elapsed delta time, applies client-controlled `playbackSpeed`, and passes the scaled delta to the evaluation cycle.
- Allows pausing (`sceneStore.isPaused()`) which halts time increments without freezing renderer loops (e.g., camera sway and blinking continue).

### Scene Evaluation Orchestrator (`sceneEvaluator.ts`)

Every frame, the tick loop executes [sceneEvaluator.ts](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/sceneEvaluator.ts#L62) which sequences all cinematic and acting modules:

1. **State Invalidation & Inits**: Verifies presence of mandatory state properties via [ensureSemanticRuntimeState](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/semanticOperations.ts#L9). Resets temporary joint-rotation metrics if actor IDs change.
2. **Actor Staging**: Invokes [evaluateStaging](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/staging/stagingEvaluator.ts) to calculate baseline coordinate adjustments according to the scene's emotional tone and spacing factors.
3. **Proximity & Relationships**: Invokes [evaluateProximity](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/proximityAwareness.ts) to dynamically update character distance states, gaze targets, and closeness thresholds.
4. **Reaction Timing**: Invokes [evaluateReactions](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/acting/reactionTiming.ts) to handle physical recoil or adjustments triggered by close proximity.
5. **Emotional Aftermath**: Invokes [applyEmotionalAftermath](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/continuity/emotionalAftermath.ts) to simulate exponential recovery and residue of high-intensity emotions (slouched joints, nervous fidgeting).
6. **Emotional Spatial Intelligence**: Runs [resolveSpatialIntent](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/spatial/spatialIntentResolver.ts) and applies framing biases ([applyNegativeSpace](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/spatial/negativeSpaceController.ts), [applyFrameEdgeBias](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/spatial/frameEdgeBias.ts)) to push actors into expressive positions (e.g. edge-of-frame for isolation).
7. **Dramatic Timing Engine**: Evaluates dramatic beats ([scheduleBeats](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/timing/beatScheduler.ts), [evaluateBeats](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/timing/beatEvaluator.ts)) to schedule temporary pauses, reactions, and silence periods.
8. **Power Dynamics**: Resolves dominance/submission indices with [resolvePowerDynamics](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/dynamics/powerDynamicResolver.ts) and applies posture and vertical staging scaling ([applyPowerAwareStaging](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/dynamics/powerAwareStaging.ts)).
9. **Tension & Anticipation**: Calculates visual tension build-ups ([accumulateTension](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/tension/tensionAccumulator.ts)) and builds anticipation states ([buildAnticipation](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/anticipation/anticipationBuilder.ts)) which restrict motion damping before triggering cinematic release ([applyPayoffRelease](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/anticipation/payoffRelease.ts)).
10. **Composition Metrics**: Computes rule-of-thirds, visual balancing, and silhouette weight scores with [calculateCompositionMetrics](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/composition/visualWeightBalancer.ts).
11. **Camera Framing & Attention**: Maps gaze directions ([resolveAttentionFocus](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/attention/attentionResolver.ts)) and camera intent ([resolveShotIntent](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/camera/shotIntentResolver.ts)) to apply camera positioning and offsets ([evaluateCameraRuntime](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/camera/cameraRuntime.ts)).
12. **Beat Sequences & Emotional Arcs**: Updates and processes ongoing multi-phase narratives ([advanceBeatSequence](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/beats/beatSequenceRunner.ts), [advanceEmotionalArc](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/arcs/arcEvaluator.ts)) which drive acting modifiers, camera zooms, and atmospheric lighting shifts.
13. **Reaction Chains**: Advances automated event-driven reactions ([advanceReactionChain](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/reactions/reactionRunner.ts)).
14. **Scene Evolution & Continuity**: Updates trajectories for camera zoom, spacing, and pacing over the scene's lifetime ([evaluateSceneEvolution](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/evolution/sceneEvolutionEvaluator.ts)). Validates layout against previous frames using [validateContinuity](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/continuity/continuityTracker.ts#L188) and captures snapshots to persist history.

---

## 10. Three.js Rendering Layer

The visual representation of Animaster uses a specialized 3D canvas built in Three.js and React Three Fiber (R3F), located in [client/src/three/components/](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components).

### Core Components

#### 1. `CinematicScene.tsx`
The primary canvas entry point ([CinematicScene.tsx](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components/CinematicScene.tsx)).
- Instantiates the R3F `<Canvas>` wrapper with shadow mapping support and `ACESFilmicToneMapping` exposure.
- Subscribes to `sceneStore` mutations to trigger frame state updates.
- Wires the fixed-timestep loop that updates individual actors (`evaluateActor`) and evaluations (`evaluateScene`) on every tick.
- Spawns lighting, environment meshes, props, camera controls, particle systems, and post-processing elements.

#### 2. `CharacterMesh.tsx`
Renders actors as procedural stickman skeletons ([CharacterMesh.tsx](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components/CharacterMesh.tsx)).
- **Aesthetic**: Prioritizes silhouette readability inspired by Limbo and Kentucky Route Zero.
- **Emotion Colors**: Modulates color base using `EMOTION_COLORS` mapping (e.g. `neutral` is grey, `sad` is blue, `happy` is yellow, `nervous` is orange, `angry` is red, `exhausted` is purple).
- **Postures**: Modulates lean angle, shoulder droop, head tilt, and arm angles using `EMOTION_POSTURE` mapping.
- **Facial System**: Renders a head mesh with interactive sub-components:
  - `Eye`: Controls scaleY to simulate random blinking patterns, and offsets pupil position coordinates (`gazeRef`) to represent jittery gazes (nervous) or downcast looks (sad/exhausted).
  - `Brow`: Alters angles to signal sadness, anger, or nervousness.
  - `Mouth`: Generates a vector curve representing smiles (happy), frowns (sad), tight lines (angry), or squiggly lines (nervous).
- **Animations**: Handles breathing cycles (pulses scale at a rate modulated by anxiety level) and leg/arm walking swings computed dynamically from action states.

#### 3. `EnvironmentMesh.tsx`
Builds procedural 3D environments ([EnvironmentMesh.tsx](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components/EnvironmentMesh.tsx)).
- Supports 18+ location types (e.g. subway, alley, forest, apartment, rooftop, hospital, parking garage, diner, office, warehouse, staircase).
- Renders structural details: Wall panels, checkboard flooring, pillars (parking garage), stair steps (staircase), diner booths, office desks, and warehouse racks.
- Integrates a **parallax backdrop system** that creates depth layering by spawning silhouette elements (e.g. skylines, city building blocks, or tree outlines) that translate relative to camera movement.
- Controls ground and ceiling colors, skyline layouts, and fog density.

#### 4. `AtmosphereEffects.tsx`
Renders real-time weather and atmospheric particle systems ([AtmosphereEffects.tsx](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components/AtmosphereEffects.tsx)).
- **Particle Fields**: Implements GPU-friendly particle fields for:
  - `rain`: High-speed downward blue-tinted points.
  - `snow`: Floating larger white points.
  - `dust`: Slow-drifting warm particles simulating indoor light shafts.
  - `embers`: Upward floating orange points simulating fires or ashes.
- Includes wrap-around logic that loops particles back to boundary origins once they exceed spatial constraints.
- Spawns horizontal fog bands and a pulsing flicker light source simulating failing fluorescent or streetlights.

#### 5. `SceneLighting.tsx`
Cinematic light rigs controlled by tone ([SceneLighting.tsx](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components/SceneLighting.tsx)).
- Combines a main directional Key light, an ambient Fill light, a point Rim light, and an base Ambient light.
- Key light position shifts with a subtle sinusoidal sway to simulate emergent shadows.
- Integrates a **tension-pulse light** that projects an ambient red flash matching tension escalation levels.

#### 6. `ScenePostProcessing.tsx`
Applies filmic post-processing effects ([ScenePostProcessing.tsx](file:///c:/Users/viren/Desktop/Animaster/client/src/three/components/ScenePostProcessing.tsx)).
- Integrates Bloom, Vignette, and Film Grain (Noise) overlays.
- Parameters (bloom threshold, vignette size, noise opacity) scale according to the active scene tone and tension levels (e.g. tension darkens vignettes, sad boosts bloom glow).

---

## 11. UI Components

Animaster utilizes a rich dashboard layout constructed of functional React components found in [client/src/components/](file:///c:/Users/viren/Desktop/Animaster/client/src/components).

### UI Layout Map

- **`PromptBar.tsx`**: The primary input bar. Includes suggestions and handles submitting prompt triggers to interpret/mutate services.
- **`CinematicDirector.tsx`**: Side panel exposing **9 Semantic Sliders** mapping directly to the director intent values:
  - *Emotional Intensity*: Modulates action pacing and motion energy levels.
  - *Visual Density*: Modulates backdrop lighting intensities and fog.
  - *Environmental Richness*: Alters contrast curves.
  - *Symbolic Abstraction*: Biases camera zoom ranges and headroom.
  - *Dialogue Naturalism*: Controls pause frequencies and tempo.
  - *Cinematic Realism*: Shifts color tints from natural to expressionistic.
  - *Camera Aggression*: Increases camera movement speed and closer framing.
  - *Atmosphere Weight*: Alters fog density and ambient shading.
  - *Directorial Intensity*: Scale visual energy and motion damping thresholds.
- **`CinematicControls.tsx`**: Slider adjustments for global scene tempo, tension escalation, weather overlays, and sound properties.
- **`ActorDirector.tsx`**: Direct overrides that allow manual adjustments of character emotions (e.g. sad, happy, angry) and intensity levels.
- **`SceneSeriesPanel.tsx`**: Supports narrative chaining. Displays current scene sequence indices, allows deleting, moving, adding scenes, and navigating storyboard nodes.
- **`DemoSelector.tsx`**: Lists pre-loaded capabilities demos (lonely subway, apartment tension, etc.) and provides guides for applying sequential mutations.
- **`PlaybackControls.tsx`**: Houses standard controls (Play, Pause, Speed multiplier).
- **`CameraPresets.tsx` & `ShotSelector.tsx`**: Buttons mapping camera modes (follow, over-the-shoulder, close-up, wide-shot, static, tension-zoom) to camera coordinates.
- **`SessionSidebar.tsx`**: Logs prompt session entries enabling a history timeline.
- **`SceneGraphView.tsx`**: Debug panel that visualizes the raw JSON schema structure of the current scene graph.
- **`BeatTimelineV2.tsx`**: Graphs dramatic beat progress, timers, and transitions.
- **`CinematicInspector.tsx` & `AIDebugPanel.tsx`**: Inspection overlays displaying real-time metrics for visual weights, rule-of-thirds alignment, spatial intent, and LLM reasoning steps.

---

## 12. Scene Store & State Management

The core state manager is [sceneStore.ts](file:///c:/Users/viren/Desktop/Animaster/client/src/store/sceneStore.ts), which handles state serialization and merges patches.

### Core Mechanics

- **Single Source of Truth**: The active visual state resides in `currentScene` (matching `SceneGraph` interface) and `currentSeries` (matching `SceneSeries` interface).
- **Reactive Pub-Sub**: Listeners register using `onSceneChange` and `onSeriesChange`. The system triggers updates imperatively using `notify()` or `notifySeries()`.
- **Deep Merging**: The store implements a recursive `deepMerge()` algorithm that merges sparse patches generated by the AI server without deleting unaffected fields.
- **Joint and State Initialization**: When a new scene is set (`setScene`), the store executes `initActorJoints()` to compute skeleton vectors for new characters, and clears stale poses and cached variables.
- **State Clearing on Patch**: Applying changes clears transient runtime properties (e.g. `dramaticBeats`, `tensionState`, `emotionalSpatial`, `reactionChains`) to force runtime evaluators to rebuild them according to the updated parameters and tones.
- **History Tracking**: Automatically pushes records into `sessionHistory` and `mutationHistory` to preserve prompts, versions, and operations.

---

## 13. Data Flow & Mutation Pipeline

The diagram below outlines the runtime lifecycle of a scene mutation request:

```
 ┌───────────┐       Prompt & State        ┌──────────────┐
 │ PromptBar │────────────────────────────▶│  Express API │
 └───────────┘                             │  (Server)    │
       ▲                                   └──────┬───────┘
       │                                          │
       │                                          ▼
       │                                   ┌──────────────┐
       │                                   │ AI           │
       │                                   │ Orchestration│
       │                                   └──────┬───────┘
       │                                          │
       │                                          ▼
       │                                   ┌──────────────┐
       │                                   │ LLM Provider │
       │                                   │ (Groq/etc.)  │
       │                                   └──────┬───────┘
       │                                          │ JSON Patch
       │                                          ▼
┌──────────────┐      sceneStore.applyPatch   ┌──────────────┐
│  Three.js/R3F│◀─────────────────────────────│  client      │
│  Rendering   │                              │  sceneStore  │
└──────┬───────┘                              └──────────────┘
       │                                              ▲
       │ 60 FPS tickLoop                              │
       └──────────────────────────────────────────────┘
                    Evaluators (mutate draft)
```

### Process Sequence

1. **Input Submission**: The user submits a prompt (e.g., *"Make it rain and make them look at each other"*).
2. **Server Handshake**: Client sends the prompt, current `SceneGraph` state, and `DirectingContext` values via `POST /mutate`.
3. **AI Compilation**: The server's `intentCompiler` resolves keywords, determines complexity, runs parallel agent planners (Blocking, Cinematography, etc.), and invokes the LLM provider (or falls back to regex planning).
4. **JSON Patch Return**: The server returns a sparse patch representing changed properties (e.g. weather changes to rain, actor actions update to looking at each other).
5. **Patch Merging**: The client's `sceneStore.applyPatch()` merges the sparse patch into the active scene graph, increments the version count, and records history logs.
6. **State Notifications**: The store notifies listeners, updating React component layouts and canvas assets.
7. **Frame Evaluation (60 FPS)**: The tick loop runs evaluators (staging, tension, camera framing, joints) that write emergent positions, joint transforms, and camera transitions back into the active draft on every frame.
8. **Visual Render**: The Three.js canvas reads the updated values and draws the updated skeleton frames, particles, and shaders.

---

## 14. Cinematic Grammar & Tone System

The platform operates on a semantic mapping system called **Cinematic Grammar** that binds visual styles to the emotional tone of a scene.

- **Tone Profile Registry**: [cinematicGrammarRegistry.ts](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/cinematicGrammarRegistry.ts) maps specific `SceneTone` values to visual parameters:
  - `lonely`: Wide negative spacing, slower actor speed, distant camera, cool desaturated tints.
  - `tense`: Clamped visual spacing, high motion energy curves, tight camera framing, high contrast, red tension light activation.
  - `sad`: Drooped posture configurations, slower pacing, misty blue lighting tints, elevated fog.
  - `romantic`: Close proximity thresholds, warm amber lighting, high bloom ratios.
  - `threatening`: Oppressive lighting silhouettes, low camera height, high camera drift (handheld shake), dark vignette borders.
- **Rhythm Mapping**: Translates tone tempo (`slow`, `medium`, `fast`) into tick evaluations:
  - Dictates pause intervals during actions.
  - Adjusts joint movement speed using interpolation dampening metrics.

---

## 15. Emotion System

Animaster uses a detailed skeletal and facial posture system to render character emotions without relying on pre-baked animation cycles.

### Skeletal Posture Adjustments

Every frame, the active character posture is calculated using the actor's emotion state and intensity values:
- `sad`/`exhausted`: The head tilt is negative (pointing down), shoulders drop, and torso lean is biased backward.
- `happy`/`excited`: The head tilts upward, shoulders pull back, and arms square out.
- `angry`: The torso leans forward toward targets, head tilts up, and shoulders square aggressively.

### Expressive Face System

Characters feature an interactive face schema (`FaceExpression`):
- **Brows**: Rotates eyebrow meshes (e.g. angled inward for angry, sloped outward for sad).
- **Eyes**: Modulates eye heights (`blinkState`) to simulate random blink ticks. Scales mesh shapes (`round`, `wide`, `narrow`, `squint`) to reflect emotional intensity.
- **Gaze**: Offsets pupils (`pupilOffsetX`, `pupilOffsetY`). Jitters pupil coordinates for nervous states, or points them downward for sad/exhausted states.
- **Mouth**: Evaluates a mathematical sine wave representing curved smiles, frowns, tight lips, or squiggles.

### Emotional Decay (`continuity/emotionalAftermath.ts`)

Simulates realistic emotional memory. When a high-intensity emotion ends, [applyEmotionalAftermath](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/continuity/emotionalAftermath.ts) calculates a residual decay curve. For example, a character who was angry will gradually ease back to a neutral posture, retaining minor fidgets or slouched shoulders that slowly decay according to an exponential half-life formula.

---

## 16. Camera System

The camera is an active director rather than a static viewport. It translates spatial intent into camera placements.

### Camera Framing Modes

- **`static`**: Locks position coordinate targets.
- **`follow`**: Dynamically tracks the midpoint of all active characters.
- **`close_up`**: Halves distance, lowers height, and clamps FOV to focus on a target character's silhouette.
- **`wide_shot`**: Increases camera distance, raises height, and widens FOV to establish environments.
- **`over_the_shoulder`**: Sets up positioning behind one character looking at another.
- **`tension`**: Constrains FOV in proportion to the active tension level.

### Handheld Drift and Shake

Driven by the scene's emotional tone, the camera controller injects random noise offsets into the camera position matrix:
- Tense and threatening tones apply a continuous, multi-frequency sinusoidal drift (`drift` value up to `0.015`) to simulate a handheld operator's micro-movements.
- Increases in frequency and amplitude when tension spikes.

### Transitions

Smooth transitions are achieved through linear interpolation (lerping) of positions, target look-at vectors, and field-of-view (FOV) values at a controlled speed (`0.04` per frame), preventing sudden camera cuts.

---

## 17. Atmosphere & Environment System

Atmospheric systems translate environmental weather and tones into visual filters and lighting changes.

### Atmospheric Profiles

Profiles configured on the scene graph dictate particle configurations:
- **Rain & Snow**: Particles fall within a 3D bounding box surrounding the viewport, wrapping around from top to bottom.
- **Dust**: Emits slow-drifting brown particles.
- **Embers**: Emits rising orange-red particles that float upward to simulate ashes.
- **Lighting Tints**: Replaces standard ambient shading with warm, cool, night, or custom RGBA overlays.

### Environmental Reactivity (`emotionalEnvironmentReactor.ts`)

Establishes a feedback loop between character state and the world. High visual tension or extreme character emotions trigger atmospheric changes:
- Peak anxiety levels cause indoor lights to flicker or pulse.
- Tense tones worsen storm effects, increasing particle counts and wind drift speed.
- Sad tones dim ambient lighting and elevate fog layers.

---

## 18. Scene Series Feature

The **Scene Series** system chains multiple scene graphs into a sequential storyboard sequence.

- **Storyboard Chaining**: Enables users to generate multi-shot narratives (e.g. *Shot 1: wide establishing shot, Shot 2: close-up, Shot 3: character walks away*).
- **Navigation Controls**: The client UI provides storyboard tabs for adding, deleting, reordering, and renaming scenes.
- **State Preservation**: Navigating between storyboard nodes updates the client's current scene and resets runtime caches. This allows each shot to maintain its independent tone, weather profile, and actor setups.

---

## 19. Demo System

Animaster includes a suite of pre-loaded **Demo Experiences** configured on the server ([demoExperiences.ts](file:///c:/Users/viren/Desktop/Animaster/server/src/ai/demos/demoExperiences.ts)) to demonstrate capabilities:

| Demo ID | Title | Core Narrative & Setup | Proves Capabilities |
|---------|-------|------------------------|---------------------|
| `lonely-subway` | Lonely Subway at Midnight | Solitary figure on a subway platform. Mutations introduce silent pacing, distant train rumbling, and shift to nostalgic warm lighting. | Semantic planning, lighting intelligence, memory system, tone mutation. |
| `apartment-tension` | Apartment Emotional Tension | Two people standing in an apartment. Mutations claustrophobically tighten blocking, trigger hesitation beats, and widen spatial distance. | Multi-agent reasoning, spatial relationships, blocking logic. |
| `rainy-rooftop` | Rainy Rooftop Confrontation | Rainy confrontation. Mutations control anger restraint, build tension without aggression, and handle de-escalation blocking. | Emotional arcs, weather effects, provider fallback logic. |
| `nostalgic-diner` | Nostalgic Diner Memory | Solitary customer in a diner. Mutations transition between warm memories and cold reality, using emptiness as a character. | Tone switching, visual style profiling, environment grammars. |
| `hospital-anxiety` | Hospital Waiting Room Anxiety | Patient waiting in a hospital room. Mutations slow pacing to build suspense, and freeze blocking as a new character enters. | Pacing intelligence, dramatic timing, anticipation/payoff loops. |

---

## 20. AI Provider System

The server is equipped with a robust **AI Orchestration Framework** featuring multi-provider fallbacks and context handling.

### Fallback Hierarchy

When a client sends a scene generation or mutation request, the server's `providerRegistry` determines availability and selects the best provider using a fallback hierarchy:

1. **Groq (Primary)**: Default provider. Uses `qwen/qwen3-32b` for low latency (~200ms) and strong reasoning.
2. **OpenAI (Secondary)**: Fallback provider. Uses `gpt-4o-mini` (~500ms).
3. **Anthropic**: Fallback provider. Uses `claude-3-haiku` (~400ms).
4. **Gemini**: Fallback provider. Uses `gemini-1.5-flash` (~300ms).
5. **Ollama**: Local offline fallback provider. Uses a locally hosted `llama3` model.
6. **Mock (Ultimate Fallback)**: RegEx-based fallback system that parses prompt keywords (e.g. "rain", "sad", "walking") and generates valid JSON configurations locally, guaranteeing system uptime even without internet access.

### Context Compression

To prevent token overflows during long prompt sessions, the server monitors context size:
- Truncates history arrays, preserving only the most recent scene snapshots.
- Compresses dialogue logs and mutation records, maintaining only active narrative contexts.

---

## 21. API Reference

The server exposes Express endpoints and WebSocket events.

### HTTP Endpoints

#### `POST /interpret`
Interprets a prompt to generate a new `SceneGraph`.
- **Request Body**:
  ```json
  {
    "prompt": "string",
    "directing": {
      "directorIntent": { "key": "number" },
      "actorOverrides": []
    }
  }
  ```
- **Response**: Full `SceneGraph` JSON structure.

#### `POST /mutate`
Applies a conversational edit to modify an existing scene graph.
- **Request Body**:
  ```json
  {
    "prompt": "string",
    "currentScene": { "id": "string", "version": "number" },
    "directing": { "directorIntent": { "key": "number" } }
  }
  ```
- **Response**: A partial `SceneGraph` patch.

#### `POST /live-mutate`
Applies rapid semantic edits to active parameters.
- **Request Body**:
  ```json
  {
    "command": "string",
    "currentTone": "string",
    "currentEnvironment": "string",
    "actorCount": "number",
    "currentEffects": []
  }
  ```
- **Response**: JSON mapping of live mutation operations.

#### `GET /ai/status`
Checks orchestrator health and registers available LLM providers.
- **Response**:
  ```json
  {
    "orchestrator": { "memoryEntries": 2 },
    "registeredProviders": ["groq", "openai"],
    "providerAvailability": { "groq": true, "openai": false }
  }
  ```

#### `GET /ai/demos`
Lists all pre-configured demo experiences.
- **Response**: Array of `DemoExperience` objects.

#### `GET /ai/memory`
Retrieves historical memories, emotion tracks, and continuity records.
- **Response**: Objects outlining history tracks and validation lists.

#### `DELETE /ai/memory`
Clears session memories.

#### `POST /ai/tests`
Runs the prompt test suite to validate prompt interpretations.
- **Response**: Test summaries outlining passed/total figures.

### WebSocket Communication

- **Endpoint**: `ws://localhost:3001`
- **Outgoing Message**: Server broadcasts a `sceneUpdate` payload to connected clients when a route mutates the global scene:
  ```json
  {
    "type": "sceneUpdate",
    "data": {
      /* SceneGraph fields */
    }
  }
  ```

---

## 22. Development Workflow

The project is structured as a TypeScript monorepo using npm workspaces.

### Development Commands

Run packages simultaneously in development mode:

```bash
# Start backend server with tsx watch
cd server
npm run dev

# Start frontend Vite server
cd client
npm run dev
```

### Running Tests

Validate functionality:

```bash
# Run server test suite
cd server
npm run test

# Run client tests
cd client
npm run test
```

### Extending the Runtime

To implement a new cinematic evaluator (e.g., adding character pacing or reaction states):
1. Create a new module file under [client/src/runtime/](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime) (e.g. `client/src/runtime/acting/customEvaluator.ts`).
2. Implement an evaluation function that accepts and returns a `SceneGraph` (or array of `Actor` coordinates).
3. Import the function in [client/src/runtime/sceneEvaluator.ts](file:///c:/Users/viren/Desktop/Animaster/client/src/runtime/sceneEvaluator.ts).
4. Register the function inside the `evaluateScene()` sequence.

---

## 23. Glossary

- **Scene Graph**: The single source of truth data model representing characters, environments, cameras, and cinematic settings.
- **Sparse Mutation**: An update payload containing only changed fields to be merged into an existing scene graph.
- **Runtime Evaluator**: Code that runs on every frame at 60 FPS to calculate emergent parameters (e.g. joints, framing offsets, and lighting intensity).
- **Director Sliders**: Sliders in the UI that map qualitative settings (e.g. *Camera Aggression*) directly to numerical configurations.
- **Tension Accumulator**: A runtime utility tracking silent gaps or spacing limits to build visual tension.
- **Continuity Violation**: A diagnostic flag raised when the system detects sudden position jumps or emotional flips.
- **Parallax Backdrop**: Background scenery layers that move at different speeds relative to the camera to create an illusion of depth.
- **Reaction Chain**: A sequence of scheduled movements or beats triggered when characters reach proximity thresholds.

---

*Last updated: 2026*
*Animaster — Direct cinema through language.*