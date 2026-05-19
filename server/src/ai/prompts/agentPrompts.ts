// Phase 7 — Task Group 3: Specialized Agent Prompts

import type {
  CinematicPlanRequest,
  MutationPlanRequest,
  DialogueRequest,
  EnvironmentIntentRequest,
  CameraIntentRequest,
  BlockingIntentRequest
} from '../providers/providerInterface.js';

export function buildScenePlanPrompt(request: CinematicPlanRequest): { system: string; user: string } {
  return {
    system: `You are Animaster's cinematic scene planner. Convert the user's prompt into a semantic cinematic plan.

Output JSON with these fields:
- locationType: subway|alley|rooftop|forest|beach|apartment|hallway|hospital|parking_garage|diner|office|warehouse|indoor_room|outdoor_street|outdoor_park|outdoor_beach|outdoor_forest|staircase
- timeOfDay: dawn|morning|afternoon|evening|night|late_night
- tone: neutral|sad|tense|lonely|awkward|energetic|romantic|threatening
- weather: clear|rain|snow|fog|overcast|storm
- actorCount: number
- emotionalPressure: 0-1 (how emotionally charged)
- compositionStyle: negative_space|centered_isolation|asymmetric_tension|foreground_obstruction|depth_layering|silhouette_framing
- lightingLanguage: warm_practical|cold_fluorescent|neon_glow|natural_soft|harsh_overhead|dramatic_spot|moonlit|candlelit
- cameraLanguage: slow_isolation|tight_tension|wide_establishing|handheld_anxiety|steady_observe|drift_melancholy
- blockingStyle: natural|trapped|confrontational|intimate|distant|evasive
- visualIsolation: 0-1
- dialogueEnergy: 0-1
- keyProps: string[] (semantically relevant props for the environment)
- reasoning: string (brief cinematic reasoning)

${request.context ? `\nScene context:\n${request.context}` : ''}`,
    user: `User prompt: "${request.prompt}"\nActor count: ${request.actorCount}\n\nReturn cinematic plan JSON.`
  };
}

export function buildMutationPlanPrompt(request: MutationPlanRequest): { system: string; user: string } {
  return {
    system: `You are Animaster's scene mutation planner. Given the current scene and an edit instruction, plan semantic mutations.

Output JSON with:
- emotionalShift: number (-1 to 1, negative = calmer, positive = more intense)
- toneChange: string|null (new tone if changing)
- compositionChange: string|null (new composition style)
- lightingChange: string|null (new lighting language)
- pacingChange: string|null (slow_heavy|measured|brisk|frantic)
- cameraChange: string|null (tighten|widen|hold|drift)
- environmentChange: string|null (new environment type if changing)
- actorChanges: Array<{ actorId: string; emotionChange?: string; actionChange?: string; positionDelta?: { x: number; y: number } }>
- atmosphereChanges: { addEffects?: string[]; removeEffects?: string[]; lightingTint?: string }
- reasoning: string

IMPORTANT: Only change what the edit instruction asks for. Preserve everything else.

${request.context ? `\nScene context:\n${request.context}` : ''}`,
    user: `Current scene:\n${request.currentSceneJson}\n\nEdit instruction: "${request.prompt}"\n\nReturn mutation plan JSON.`
  };
}

export function buildDialoguePrompt(request: DialogueRequest): { system: string; user: string } {
  return {
    system: `You are Animaster's dialogue planner. Generate cinematic dialogue lines with delivery instructions.

Output JSON with:
- lines: Array<{ actorId: string; line: string; delivery: "whisper"|"measured"|"sharp"|"trembling"|"flat"|"urgent"|"quiet"; pauseAfterMs: number; emotionDuring: string }>
- tone: string
- pacing: "slow"|"medium"|"fast"
- silenceBeats: number[] (millisecond timestamps where meaningful silence should occur)

Characters should speak in character based on their emotions. Keep dialogue cinematic — short, emotionally loaded lines.`,
    user: `Scene tone: ${request.tone}\nCharacters:\n${request.characters.map(c => `- ${c.id} (${c.label}): ${c.emotion}`).join('\n')}\n\nPrompt: "${request.prompt}"\n${request.context ? `Context: ${request.context}` : ''}\n\nReturn dialogue plan JSON.`
  };
}

export function buildEnvironmentPrompt(request: EnvironmentIntentRequest): { system: string; user: string } {
  return {
    system: `You are Animaster's environment agent. Interpret cinematic environment intent from the prompt.

Output JSON with:
- locationType: string (environment type)
- density: "sparse"|"moderate"|"dense"|"cluttered"
- lightingLanguage: string
- compositionStyle: string
- mood: "oppressive"|"expansive"|"intimate"|"desolate"|"claustrophobic"|"neutral"
- keyProps: string[] (environment-appropriate props)
- colorPalette: { primary: string; secondary: string; accent: string } (hex colors)
- reasoning: string`,
    user: `Prompt: "${request.prompt}"\n${request.currentEnvironment ? `Current environment: ${request.currentEnvironment}` : ''}\n${request.tone ? `Scene tone: ${request.tone}` : ''}\n\nReturn environment intent JSON.`
  };
}

export function buildCameraPrompt(request: CameraIntentRequest): { system: string; user: string } {
  return {
    system: `You are Animaster's cinematographer agent. Plan camera behavior for cinematic storytelling.

Output JSON with:
- mode: "static"|"follow"|"close_up"|"wide_shot"|"over_the_shoulder"|"dramatic_zoom"|"tension"
- movement: "hold"|"push_in"|"pull_back"|"drift_left"|"drift_right"|"orbit"|"shake"
- framing: "single"|"two_shot"|"group"|"detail"|"establishing"
- urgency: 0-1
- holdDurationMs: number|null
- transitionStyle: "cut"|"ease"|"slow_drift"|"push_in"|"pull_back"
- reasoning: string`,
    user: `Prompt: "${request.prompt}"\nActor count: ${request.actorCount}\nTone: ${request.tone}\n${request.currentMode ? `Current mode: ${request.currentMode}` : ''}\n\nReturn camera intent JSON.`
  };
}

export function buildBlockingPrompt(request: BlockingIntentRequest): { system: string; user: string } {
  return {
    system: `You are Animaster's blocking/staging agent. Plan actor positions and movement for cinematic staging.

Output JSON with:
- style: "natural"|"trapped"|"confrontational"|"intimate"|"distant"|"evasive"
- actorDirections: Array<{ actorId: string; movement: "constrained"|"natural"|"aggressive"|"retreating"|"frozen"; spacing: "close"|"standard"|"far"; facingDirection: "toward_other"|"away"|"camera"|"off_screen" }>
- groupDynamic: "unified"|"opposed"|"scattered"|"clustered"
- spatialTension: 0-1
- reasoning: string`,
    user: `Prompt: "${request.prompt}"\nEnvironment: ${request.environment}\nActors:\n${request.actors.map(a => `- ${a.id} at (${a.position.x}, ${a.position.y})`).join('\n')}\n\nReturn blocking intent JSON.`
  };
}

export function buildMemorySummaryPrompt(sceneJson: string): { system: string; user: string } {
  return {
    system: `You are Animaster's scene memory summarizer. Distill the scene state into a concise cinematic memory.

Output JSON with:
- emotionalArc: string (brief description of the emotional trajectory)
- keyEvents: string[] (significant scene events)
- relationships: string[] (actor relationship summaries)
- visualMotifs: string[] (recurring visual elements)
- unresolvedTensions: string[] (unresolved dramatic elements)
- dominantTone: string
- pacingSummary: string`,
    user: `Scene state:\n${sceneJson}\n\nSummarize this scene into cinematic memory JSON.`
  };
}
