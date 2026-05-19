# 1. OBJECTIVE

Transform Animaster from a procedural cinematic runtime into a **LIVE CINEMATIC DIRECTING EXPERIENCE** where users feel like film directors shaping scenes emotionally in real time through conversational language — NOT users operating a semantic simulator.

**Key Success Metric:** Users should feel "I am shaping cinema" not "I am editing runtime metadata."

# 2. CONTEXT SUMMARY

**Current State Analysis:**
- Infrastructure is largely complete: DirectorMode, CinematicInspector, BeatTimeline, EmotionalSpaceControls, Shot Library (12 shots), Directorial Styles (8 styles), LiveMutationEngine, CinematicMemory, CharacterMesh with eyes/brows/blinking/gaze/breathing all exist
- **Core problem:** UI exposes too much technical terminology, feels like a debugging tool rather than a directing interface
- Runtime is functional but organizationally scattered across 97+ files in client/src/runtime/

**Existing Components (verified present):**
- `client/src/director/DirectorMode.tsx` — conversational directing interface
- `client/src/components/CinematicInspector.tsx` — runtime introspection
- `client/src/components/BeatTimelineV2.tsx` — beat progression
- `client/src/components/EmotionalSpaceControls.tsx` — emotional space sliders
- `shared/src/cinematicShots.ts` — 12 shot definitions
- `shared/src/directorialStyles.ts` — 8 directorial styles
- `shared/src/emotionalSpace.ts` — emotional space computation
- `client/src/runtime/liveMutation/liveMutationEngine.ts` — live semantic mutation
- `client/src/runtime/liveMutation/feedbackSystem.ts` — real-time feedback
- `server/src/memory/cinematicMemory.ts` — cinematic memory tracking
- `client/src/three/components/CharacterMesh.tsx` — characters with eyes/brows/blink/gaze/breathing

# 3. APPROACH OVERVIEW

**Philosophy:** Enhance existing infrastructure through UX/terminology refinement and runtime organization — NOT building new systems from scratch.

**Key Decisions:**
1. **UX Cleanup First:** Rename technical terms to cinematic language before any structural changes
2. **Runtime Refactor Second:** Organize into clear cinematic subsystems as specified
3. **Demo Polish Third:** Create 5 polished demo scenarios that show off the live directing experience
4. **Character Refinement Fourth:** Subtle expressiveness upgrades (not photorealistic faces)

**Why This Order:** UI perception is the primary bottleneck per the user's request. Structural refactoring is easier once the UX feels right.

# 4. IMPLEMENTATION STEPS

## Step 1: UX Terminology Cleanup (CRITICAL)
**Goal:** Replace all technical/debug terminology with cinematic directing language

**Method:** Update component labels and UI text across 5 key components

**Files to modify:**
- `CinematicInspector.tsx` — rename "Moment Score" → "Dramatic Impact", "Spatial Intent" → "Framing Intent", "Pacing" → "Rhythm"
- `EmotionalSpaceControls.tsx` — rename sliders: "social_tension" → "Pressure", "emotionalDistance" → "Distance", keep "Intimacy", "Dominance", "Isolation", "Vulnerability" as-is (already cinematic)
- `BeatTimelineV2.tsx` — add narrative labels: "Building tension", "Climax approaching", "Aftermath"
- `DirectorMode.tsx` — update placeholder text, improve suggestion buttons
- `CinematicControls.tsx` — rename any technical controls to cinematic equivalents

**Reference:** User-provided philosophy in requirements:
- GOOD: "Emotional Distance"
- BAD: "Relationship Proximity Scalar"

## Step 2: Runtime Directory Refactor
**Goal:** Organize runtime into clear cinematic subsystems

**Method:** Create symbolic links (or re-export files) to create organized structure

**New structure:**
```
client/src/runtime/
  acting/         ← re-export from: acting/*, emotions/*, behaviors/*
  camera/        ← re-export from: camera/*
  atmosphere/    ← re-export from: three/atmosphere/
  composition/   ← re-export from: composition/*
  emotionalSpace/ ← new: integration with shared/emotionalSpace.ts
  pacing/       ← re-export from: timing/*, rhythm/*
  staging/      ← re-export from: staging/*
  continuity/   ← re-export from: continuity/*
  liveMutation/  ← existing: liveMutation/*
  directing/    ← re-export from: director/*
```

**Reference:** Target structure from requirements

## Step 3: Add "Directed Scene" Feedback Display
**Goal:** Show users exactly what their directing commands accomplished

**Method:** Extend DirectorMode with visual feedback overlay

**File:** `client/src/components/DirectedFeedback.tsx` (NEW)

**Features:**
- Display last 3 directing commands with their interpreted effects
- Show emotional shift indicator (e.g., "Tension ↑ 15%", "Intimacy ↓ 8%")
- Highlight what changed in the scene visibly

## Step 4: Demo Scene Polish (Phase 8 Experience Demos)
**Goal:** Create 5 polished demo scenarios demonstrating live directing

**Method:** Update demo scenes with rich directing hooks

**Files:** Update `server/src/planning/demoScenes.ts` with:
1. **Rainy Rooftop Loneliness** — rain, cold, isolation, drift camera
2. **Subway Tension Encounter** — confined, fluorescent, approach tension
3. **Hospital Waiting Anxiety** — cold fluorescent, seated, negative space
4. **Apartment Awkward Silence** — practical light, two actors, discomfort
5. **Noir Alley Confrontation** — neon, rain, threatening, tension camera

Each demo should have:
- Initial directing "suggestion" buttons (e.g., "Make it lonelier", "Add rain")
- Pre-configured emotional space settings
- Matching directorial style

## Step 5: Character Expressiveness Refinement
**Goal:** Enhance subtle character expressiveness WITHOUT photorealism

**Method:** Extend emotional idle motion and reaction timing

**File:** `client/src/runtime/acting/expressiveCharacter.ts` (existing, enhance)

**Enhancements:**
- Add emotion-specific idle micro-movements (nervous weight shift, sad sway)
- Enhance gaze behavior: add "looking away then looking back" hesitation pattern
- Add subtle breathing variation based on emotion (rapid for nervous, shallow for anxious)
- Add emotional "recovery" animation after intensity peaks

## Step 6: Directorial Style Integration
**Goal:** Make directorial styles immediately visible in the scene

**Method:** Connect DirectorialStyleSelector to runtime atmosphere/camera

**File:** `client/src/runtime/directing/styleRuntime.ts` (NEW)

**Features:**
- On style selection: smoothly transition atmosphere, camera, lighting
- Apply style's breathing parameters to scene grammar
- Show style name in CinematicInspector

## Step 7: Shot Language Integration
**Goal:** Make shot selection feel like directing, not parameter tweaking

**Method:** Update ShotSelector with more directorial language

**File:** Update `client/src/components/ShotSelector.tsx`

**Changes:**
- Replace "FOV" terminology with emotional framing names
- Add preview thumbnail concept (optional, can be color coded)
- Connect shot selection to cameraRuntime with proper transitions

## Step 8: Verification - Live Directing Feel
**Goal:** Verify final experience matches Phase 8 philosophy

**Method:** Manual test of core directing flows

**Test scenarios:**
1. Open rainy rooftop demo → Type "make the silence heavier" → Verify scene feels different
2. Select "noir_isolation" style → Verify atmosphere changes visibly
3. Select "intimate closeup" shot → Verify camera responds
4. Adjust "Intimacy" slider → Verify character spacing changes

# 5. TESTING AND VALIDATION

**Success Criteria:**
1. ✓ DirectorMode opens with Ctrl+` and accepts conversational commands
2. ✓ CinematicInspector displays current cinematic state (emotion, tension, pacing, camera, atmosphere)
3. ✓ BeatTimeline shows emotional progression over time
4. ✓ EmotionalSpaceControls allow runtime manipulation of intimacy/distance/pressure
5. ✓ Shot library has 12 cinematic shot types accessible
6. ✓ Directorial styles have 8 different styles affecting scene appearance
7. ✓ LiveMutation applies changes without scene reset
8. ✓ FeedbackSystem provides real-time response to mutations
9. ✓ UI language is cinematic (not technical)

**Verification Checkpoints:**
- [ ] Open demo scene, invoke DirectorMode, issue "make it feel emotionally trapped" — scene should mutate smoothly
- [ ] CinematicInspector shows all key cinematic properties readable
- [ ] BeatTimeline shows beat progression correctly  
- [ ] EmotionalSpaceControls affect scene spacing/framing
- [ ] 5 demo scenarios are polished and runnable
- [ ] CharacterMesh shows emotion-appropriate expressions and idle motion
- [ ] Directorial style selection visibly changes scene
- [ ] Shot selection changes camera framing appropriately
