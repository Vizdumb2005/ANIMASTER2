import { Router } from 'express';
import { providerRegistry } from '../ai/providers/providerRegistry.js';
import { orchestrator } from '../ai/runtime/orchestrator.js';
import type { ProviderName } from '../ai/providers/providerInterface.js';
import { isOk, isErr } from '../types/result.js';
import { getDirectorIntentAdjustments, type DirectorIntent } from '../ai/directing/directorIntent.js';
import {
  buildSceneMutationUserPrompt,
  sceneMutationResponseSchema,
  sceneMutationSystemPrompt
} from '../prompts/sceneMutationPrompt.js';

type MutateRequestBody = {
  prompt: string;
  currentScene: {
    actors: unknown[];
    environment: unknown;
    camera: unknown;
    cinematicGrammar?: unknown;
    atmosphere?: unknown;
    relationships?: unknown;
    rhythm?: unknown;
  };
  directing?: DirectingContext;
};

type ScenePatch = {
  actors: Array<{
    id: string;
    label: string;
    type: 'humanoid';
    position: { x: number; y: number };
    targetPosition: { x: number; y: number } | null;
    emotionState: 'neutral' | 'sad' | 'happy' | 'nervous' | 'excited' | 'awkward' | 'angry' | 'exhausted';
    currentAction: 'idle' | 'walking' | 'sitting' | 'approaching' | 'pacing';
    actionQueue: Array<'idle' | 'walking' | 'sitting' | 'approaching' | 'pacing'>;
    joints: {
      head: { x: number; y: number };
      torso: { x: number; y: number };
      leftArm: { x: number; y: number };
      rightArm: { x: number; y: number };
      leftLeg: { x: number; y: number };
      rightLeg: { x: number; y: number };
    };
    actionElapsed: number;
  }>;
  environment: {
    type: string;
    backgroundColor: string;
    floorColor: string;
    wallColor: string;
    width: number;
    height: number;
  };
  camera: { x: number; y: number; zoom: number; mode: string };
  cinematicGrammar?: {
    tone: string;
    template: {
      cameraMode: string;
      spacingMultiplier: number;
      motionEnergyScale: number;
      pauseFrequency: number;
      contrastBoost: number;
      headroom: number;
    };
  };
  atmosphere?: {
    effects: string[];
    lightingTint: string;
    ambientIntensity: number;
  };
  relationships?: Array<{
    actorAId: string;
    actorBId: string;
    type: string;
    awarenessRadius: number;
    gazeTarget: string | null;
    emotionalReaction: string | null;
  }>;
  rhythm?: {
    tempo: string;
    pauseFrequencyPerMinute: number;
    motionEnergyCurve: string;
  };
  semanticOperations?: Array<Record<string, unknown>>;
};

type ActorOverride = {
  actorId: string;
  emotion: ScenePatch['actors'][number]['emotionState'];
  intensity?: number;
};

type BeatSequenceContext = {
  id?: string;
  label?: string;
  currentIndex?: number;
  beats?: Array<{ action: string; durationMs: number }>;
};

type DirectingContext = {
  directorIntent?: DirectorIntent;
  actorOverrides?: ActorOverride[];
  beatSequence?: BeatSequenceContext;
};

const router = Router();

router.post('/', async (request, response) => {
  const body = request.body as Partial<MutateRequestBody> | undefined;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const directing = body?.directing;

  if (!prompt) {
    response.status(400).json({ error: 'prompt is required' });
    return;
  }

  if (!body?.currentScene || typeof body.currentScene !== 'object') {
    response.status(400).json({ error: 'currentScene is required' });
    return;
  }

  try {
    const patch = await mutateScene(prompt, body.currentScene, directing);
    response.json(patch);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to mutate scene';
    response.status(502).json({ error: message });
  }
});

export async function mutateScene(prompt: string, currentScene: unknown, directing?: DirectingContext): Promise<Partial<ScenePatch>> {
  const scene = currentScene as ScenePatch;
  const orchestration = await orchestrator.orchestrateMutation(prompt, buildOrchestrationScene(scene));
  const context = buildMutationContext(directing, orchestration);
  const provider = resolveProvider(orchestration.providerUsed);

  if (!provider || provider.name === 'mock') {
    const fallback = createFallbackPatch(prompt, scene);
    const directedFallback = applyDirectorIntentToPatch(fallback, scene, directing?.directorIntent);
    return applyActorOverrides(directedFallback, scene, directing?.actorOverrides);
  }

  let parsed: ScenePatch;
  const completionResult = await provider.complete({
    messages: [
      { role: 'system', content: sceneMutationSystemPrompt },
      { role: 'user', content: buildSceneMutationUserPrompt(prompt, JSON.stringify(currentScene, null, 2), context) }
    ],
    temperature: 0.2,
    maxTokens: 1500,
    responseFormat: 'json',
    jsonSchema: sceneMutationResponseSchema
  });

  if (isErr(completionResult)) {
    const fallback = createFallbackPatch(prompt, scene);
    const directedFallback = applyDirectorIntentToPatch(fallback, scene, directing?.directorIntent);
    return applyActorOverrides(directedFallback, scene, directing?.actorOverrides);
  }

  const completion = completionResult.value;
  if (!completion.content || !completion.content.trim()) {
    const fallback = createFallbackPatch(prompt, scene);
    const directedFallback = applyDirectorIntentToPatch(fallback, scene, directing?.directorIntent);
    return applyActorOverrides(directedFallback, scene, directing?.actorOverrides);
  }

  parsed = JSON.parse(completion.content) as ScenePatch;

  const normalized = normalizePatch(parsed, scene);
  const directedPatch = applyDirectorIntentToPatch(normalized, scene, directing?.directorIntent);
  return applyActorOverrides(directedPatch, scene, directing?.actorOverrides);
}

type MutationOrchestration = Awaited<ReturnType<typeof orchestrator.orchestrateMutation>>;

const PROVIDER_NAMES: ProviderName[] = ['groq', 'openai', 'anthropic', 'gemini', 'ollama', 'mock'];

function isProviderName(value: string): value is ProviderName {
  return PROVIDER_NAMES.includes(value as ProviderName);
}

function resolveProvider(preferred?: string) {
  if (preferred && isProviderName(preferred)) {
    const provider = providerRegistry.getProvider(preferred);
    if (provider?.isAvailable) return provider;
  }
  return providerRegistry.getBestAvailableProvider();
}

function buildOrchestrationScene(scene: ScenePatch) {
  return {
    tone: scene.cinematicGrammar?.tone ?? 'neutral',
    environment: scene.environment ? { type: scene.environment.type } : { type: 'indoor_room' },
    actors: Array.isArray(scene.actors)
      ? scene.actors.map(actor => ({
        id: actor.id,
        emotionState: actor.emotionState,
        position: actor.position,
        currentAction: actor.currentAction
      }))
      : [],
    camera: scene.camera,
    atmosphere: scene.atmosphere,
    cinematicGrammar: scene.cinematicGrammar ? { pacing: scene.cinematicGrammar.tone } : undefined
  };
}

function buildMutationContext(directing: DirectingContext | undefined, orchestration: MutationOrchestration) {
  const contextPayload = {
    directorIntent: directing?.directorIntent ?? null,
    actorOverrides: directing?.actorOverrides ?? [],
    beatSequence: summarizeBeatSequence(directing?.beatSequence),
    mutationPlan: orchestration.mutationPlan,
    continuityCheck: orchestration.continuityCheck,
    intent: orchestration.intent,
    semanticContext: orchestration.context
  };

  return JSON.stringify(contextPayload, null, 2);
}

function summarizeBeatSequence(sequence?: BeatSequenceContext) {
  if (!sequence || !Array.isArray(sequence.beats)) return undefined;
  return {
    id: sequence.id,
    label: sequence.label,
    currentIndex: sequence.currentIndex,
    beats: sequence.beats.map((beat) => ({
      action: beat.action,
      durationMs: beat.durationMs
    }))
  };
}

function applyActorOverrides(
  patch: Partial<ScenePatch>,
  currentScene: ScenePatch,
  overrides?: ActorOverride[]
): Partial<ScenePatch> {
  if (!overrides || overrides.length === 0) return patch;

  const overrideMap = new Map(overrides.map(override => [override.actorId, override]));
  const sourceActors = Array.isArray(patch.actors) && patch.actors.length > 0
    ? patch.actors
    : (Array.isArray(currentScene.actors) ? currentScene.actors : []);

  const updatedActors = sourceActors.map(actor => {
    const override = overrideMap.get(actor.id);
    if (!override) return actor;
    return {
      ...actor,
      emotionState: override.emotion
    };
  });

  return {
    ...patch,
    actors: updatedActors
  };
}

function createFallbackPatch(prompt: string, currentScene: ScenePatch): Partial<ScenePatch> {
  const patch: Partial<ScenePatch> & { semanticOperations: Array<Record<string, unknown>> } = {
    semanticOperations: []
  };
  const actors = Array.isArray(currentScene.actors) ? [...currentScene.actors] : [];
  const environment = currentScene.environment ?? {
    type: 'indoor_room',
    backgroundColor: '#17151f',
    floorColor: '#2d221f',
    wallColor: '#211c29',
    width: 960,
    height: 540
  };
  const camera = currentScene.camera ?? { x: 0, y: 0, zoom: 1, mode: 'static' };
  const atmosphere = currentScene.atmosphere ?? { effects: ['none'], lightingTint: 'rgba(0,0,0,0)', ambientIntensity: 1.0 };
  const rhythm = currentScene.rhythm ?? { tempo: 'medium', pauseFrequencyPerMinute: 4, motionEnergyCurve: 'linear' };
  let actorsChanged = false;
  let environmentChanged = false;
  let cameraChanged = false;
  let grammarChanged = false;
  let atmosphereChanged = false;
  let relationshipsChanged = false;
  let rhythmChanged = false;

  if (/darker|dim/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'night', ambientIntensity: 0.55, reason: prompt });
    patch.environment = {
      ...environment,
      backgroundColor: '#0d0b14',
      floorColor: '#1f1815',
      wallColor: '#17131d'
    };
    environmentChanged = true;
  } else if (/warmer|warm/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'warm', reason: prompt });
    patch.environment = {
      ...environment,
      backgroundColor: '#2d1d12',
      floorColor: '#3a2b1f',
      wallColor: '#2a1e15'
    };
    environmentChanged = true;
  } else if (/brighter|bright|lighter/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'rgba(0,0,0,0)', ambientIntensity: 1.15, reason: prompt });
    patch.environment = {
      ...environment,
      backgroundColor: '#2a2535',
      floorColor: '#3d3228',
      wallColor: '#302a38'
    };
    environmentChanged = true;
  }

  if (/nervous|anxious/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'nervous' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'nervous', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/sad|depressed/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'sad' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'sad', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/happy|cheerful/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'happy' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'happy', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/excited|thrilled/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'excited' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'excited', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/angry|furious/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'angry' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'angry', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/exhausted|tired/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'exhausted' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'exhausted', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/awkward/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'awkward' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'awkward', intensity: 1, reason: prompt });
    actorsChanged = true;
  } else if (/neutral|calm/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'neutral' };
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'neutral', intensity: 0, reason: prompt });
    actorsChanged = true;
  }

  if (/lonely|more\s+lonely|lonelier/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'SetTone', tone: 'lonely', reason: prompt });
    patch.cinematicGrammar = {
      tone: 'lonely',
      template: { cameraMode: 'wide_shot', spacingMultiplier: 1.8, motionEnergyScale: 0.6, pauseFrequency: 8, contrastBoost: 0.2, headroom: 1.4 }
    };
    grammarChanged = true;
    patch.camera = { ...camera, mode: 'wide_shot' };
    cameraChanged = true;
    patch.atmosphere = { ...atmosphere, lightingTint: 'cold' };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
    patch.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 8, motionEnergyCurve: 'ease-out' };
    rhythmChanged = true;
  } else if (/tense|tenser|more\s+tense/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'SetTone', tone: 'tense', reason: prompt });
    patch.cinematicGrammar = {
      tone: 'tense',
      template: { cameraMode: 'close_up', spacingMultiplier: 0.7, motionEnergyScale: 1.2, pauseFrequency: 2, contrastBoost: 0.5, headroom: 0.7 }
    };
    grammarChanged = true;
    patch.camera = { ...camera, mode: 'close_up' };
    cameraChanged = true;
    patch.rhythm = { tempo: 'medium', pauseFrequencyPerMinute: 2, motionEnergyCurve: 'sharp' };
    rhythmChanged = true;
  } else if (/romantic|love|intimate/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'SetTone', tone: 'romantic', reason: prompt });
    patch.cinematicGrammar = {
      tone: 'romantic',
      template: { cameraMode: 'close_up', spacingMultiplier: 0.5, motionEnergyScale: 0.7, pauseFrequency: 6, contrastBoost: 0.3, headroom: 0.8 }
    };
    grammarChanged = true;
    patch.camera = { ...camera, mode: 'close_up' };
    cameraChanged = true;
    patch.atmosphere = { ...atmosphere, lightingTint: 'warm' };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'warm', reason: prompt });
    patch.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 6, motionEnergyCurve: 'ease-out' };
    rhythmChanged = true;
  } else if (/energetic|fast|chaotic/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'SetTone', tone: 'energetic', reason: prompt });
    patch.cinematicGrammar = {
      tone: 'energetic',
      template: { cameraMode: 'follow', spacingMultiplier: 1.0, motionEnergyScale: 1.5, pauseFrequency: 1, contrastBoost: 0.4, headroom: 0.9 }
    };
    grammarChanged = true;
    patch.camera = { ...camera, mode: 'follow' };
    cameraChanged = true;
    patch.rhythm = { tempo: 'fast', pauseFrequencyPerMinute: 1, motionEnergyCurve: 'sharp' };
    rhythmChanged = true;
  } else if (/threatening|danger|menacing/i.test(prompt)) {
    patch.semanticOperations.push({ type: 'SetTone', tone: 'threatening', reason: prompt });
    patch.cinematicGrammar = {
      tone: 'threatening',
      template: { cameraMode: 'dramatic_zoom', spacingMultiplier: 0.6, motionEnergyScale: 0.8, pauseFrequency: 3, contrastBoost: 0.7, headroom: 0.6 }
    };
    grammarChanged = true;
    patch.camera = { ...camera, mode: 'dramatic_zoom' };
    cameraChanged = true;
    patch.atmosphere = { ...atmosphere, lightingTint: 'cold' };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
    patch.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 3, motionEnergyCurve: 'sharp' };
    rhythmChanged = true;
  }

  if (/rain/i.test(prompt)) {
    const existingEffects = atmosphere.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('rain')) existingEffects.push('rain');
    patch.semanticOperations.push({ type: 'AddAtmosphere', effect: 'rain', reason: prompt });
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), effects: existingEffects };
    atmosphereChanged = true;
  }

  if (/add\s+fog|foggy/i.test(prompt)) {
    const existingEffects = (patch.atmosphere ?? atmosphere).effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('fog')) existingEffects.push('fog');
    patch.semanticOperations.push({ type: 'AddAtmosphere', effect: 'fog', reason: prompt });
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), effects: existingEffects };
    atmosphereChanged = true;
  }

  if (/add\s+flicker|flickering/i.test(prompt)) {
    const existingEffects = (patch.atmosphere ?? atmosphere).effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('flicker')) existingEffects.push('flicker');
    patch.semanticOperations.push({ type: 'AddAtmosphere', effect: 'flicker', reason: prompt });
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), effects: existingEffects };
    atmosphereChanged = true;
  }

  if (/cold|colder/i.test(prompt) && /light/i.test(prompt)) {
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), lightingTint: 'cold' };
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
    atmosphereChanged = true;
  } else if (/warm|warmer/i.test(prompt) && /light/i.test(prompt)) {
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), lightingTint: 'warm' };
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'warm', reason: prompt });
    atmosphereChanged = true;
  }

  if (/night|nighttime/i.test(prompt)) {
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), lightingTint: 'night', ambientIntensity: 0.4 };
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'night', ambientIntensity: 0.4, reason: prompt });
    atmosphereChanged = true;
  }

  if (/park|garden/i.test(prompt)) {
    patch.environment = { ...environment, type: 'outdoor_park', backgroundColor: '#1a2e1a', floorColor: '#2d4a2d', wallColor: '#1f3a1f' };
    environmentChanged = true;
  } else if (/street|road|alley/i.test(prompt)) {
    patch.environment = { ...environment, type: 'outdoor_street', backgroundColor: '#0a0e1a', floorColor: '#1a1a2a', wallColor: '#111828' };
    environmentChanged = true;
  } else if (/beach|ocean|sea|shore/i.test(prompt)) {
    patch.environment = { ...environment, type: 'outdoor_beach', backgroundColor: '#1a3a5a', floorColor: '#c2a878', wallColor: '#2a4a6a' };
    environmentChanged = true;
  } else if (/forest|woods|jungle/i.test(prompt)) {
    patch.environment = { ...environment, type: 'outdoor_forest', backgroundColor: '#0f1f0f', floorColor: '#1a3a1a', wallColor: '#0a2a0a' };
    environmentChanged = true;
  } else if (/rooftop|roof/i.test(prompt)) {
    patch.environment = { ...environment, type: 'rooftop', backgroundColor: '#0a0e1a', floorColor: '#2a2530', wallColor: '#0f1420' };
    environmentChanged = true;
  } else if (/hallway|corridor/i.test(prompt)) {
    patch.environment = { ...environment, type: 'hallway', backgroundColor: '#0f1218', floorColor: '#1a1620', wallColor: '#1a1822' };
    environmentChanged = true;
  } else if (/subway|metro|underground|station/i.test(prompt)) {
    patch.environment = { ...environment, type: 'subway', backgroundColor: '#0a0c12', floorColor: '#2a2530', wallColor: '#16141e' };
    environmentChanged = true;
  } else if (/hospital|clinic|ward/i.test(prompt)) {
    patch.environment = { ...environment, type: 'hospital', backgroundColor: '#1a1e24', floorColor: '#1e2228', wallColor: '#202830' };
    environmentChanged = true;
  } else if (/apartment|flat|home/i.test(prompt)) {
    patch.environment = { ...environment, type: 'apartment', backgroundColor: '#17151f', floorColor: '#2d221f', wallColor: '#211c29' };
    environmentChanged = true;
  } else if (/staircase|stairs|stairwell/i.test(prompt)) {
    patch.environment = { ...environment, type: 'staircase', backgroundColor: '#0f1218', floorColor: '#1a1620', wallColor: '#1a1822' };
    environmentChanged = true;
  } else if (/outdoor|outside/i.test(prompt)) {
    patch.environment = { ...environment, type: 'outdoor_park', backgroundColor: '#1a2e1a', floorColor: '#2d4a2d', wallColor: '#1f3a1f' };
    environmentChanged = true;
  }

  if (/push\s+camera\s+closer|close\s*up|zoom\s+in|closer\s+shot/i.test(prompt)) {
    patch.camera = { ...camera, zoom: Math.min((camera.zoom ?? 1) + 0.2, 1.5), mode: 'close_up' };
    cameraChanged = true;
    patch.semanticOperations.push({ type: 'AdjustCamera', zoom: patch.camera.zoom, mode: 'close_up', reason: prompt });
  } else if (/pull\s+back|push\s+camera\s+farther|wide\s+shot|zoom\s+out|farther\s+away|pull\s+camera/i.test(prompt)) {
    patch.camera = { ...camera, zoom: Math.max((camera.zoom ?? 1) - 0.15, 0.6), mode: 'wide_shot' };
    cameraChanged = true;
    patch.semanticOperations.push({ type: 'AdjustCamera', zoom: patch.camera.zoom, mode: 'wide_shot', reason: prompt });
  } else if (/over\s+the\s+shoulder|over-the-shoulder|ots/i.test(prompt)) {
    patch.camera = { ...camera, mode: 'over_the_shoulder' };
    cameraChanged = true;
    patch.semanticOperations.push({ type: 'AdjustCamera', mode: 'over_the_shoulder', reason: prompt });
  }

  if (/slow\s+down|slower|more\s+contemplative|more\s+silence/i.test(prompt)) {
    patch.rhythm = { ...rhythm, tempo: 'slow', pauseFrequencyPerMinute: 8, motionEnergyCurve: 'ease-out' };
    rhythmChanged = true;
    patch.semanticOperations.push({ type: 'AdjustPacing', tempo: 'slow', reason: prompt });
  } else if (/speed\s+up|faster|more\s+frantic|more\s+urgent/i.test(prompt)) {
    patch.rhythm = { ...rhythm, tempo: 'fast', pauseFrequencyPerMinute: 1, motionEnergyCurve: 'sharp' };
    rhythmChanged = true;
    patch.semanticOperations.push({ type: 'AdjustPacing', tempo: 'fast', reason: prompt });
  }

  if (/cold|colder|make\s+it\s+cold/i.test(prompt) && !/light/i.test(prompt)) {
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), lightingTint: 'cold' };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
  }
  if (/more\s+silent|more\s+silence|add\s+silence|silent/i.test(prompt)) {
    patch.rhythm = { ...(patch.rhythm ?? rhythm), tempo: 'slow', pauseFrequencyPerMinute: 12, motionEnergyCurve: 'ease-out' };
    rhythmChanged = true;
    patch.semanticOperations.push({ type: 'AdjustPacing', tempo: 'slow', reason: 'silence: ' + prompt });
  }
  if (/wind|windy/i.test(prompt)) {
    const existingEffects = (patch.atmosphere ?? atmosphere).effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('wind')) existingEffects.push('wind');
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), effects: existingEffects };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AddAtmosphere', effect: 'wind', reason: prompt });
  }

  if (/snow|snowing|snowy/i.test(prompt)) {
    const existingEffects = (patch.atmosphere ?? atmosphere).effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('snow')) existingEffects.push('snow');
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), effects: existingEffects };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AddAtmosphere', effect: 'snow', reason: prompt });
  }

  if (/dust|dusty/i.test(prompt)) {
    const existingEffects = (patch.atmosphere ?? atmosphere).effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('dust')) existingEffects.push('dust');
    patch.atmosphere = { ...(patch.atmosphere ?? atmosphere), effects: existingEffects };
    atmosphereChanged = true;
    patch.semanticOperations.push({ type: 'AddAtmosphere', effect: 'dust', reason: prompt });
  }

  if (/make\s+them\s+closer|closer\s+together|bring\s+them\s+together/i.test(prompt) && actors.length >= 2) {
    const midX = (actors[0].position.x + actors[1].position.x) / 2;
    actors[0] = { ...actors[0], position: { ...actors[0].position, x: midX - 60 } };
    actors[1] = { ...actors[1], position: { ...actors[1].position, x: midX + 60 } };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'AdjustSpacing', direction: 'closer', reason: prompt });
  } else if (/add\s+more\s+distance|more\s+distant|push\s+them\s+apart|farther\s+apart/i.test(prompt) && actors.length >= 2) {
    actors[0] = { ...actors[0], position: { ...actors[0].position, x: Math.max(actors[0].position.x - 80, 100) } };
    actors[1] = { ...actors[1], position: { ...actors[1].position, x: Math.min(actors[1].position.x + 80, 860) } };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'AdjustSpacing', direction: 'farther', reason: prompt });
  }

  if (/make\s+(?:him|her|them)\s+(?:more\s+)?nervous|more\s+anxious/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], emotionState: 'nervous' };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'nervous', intensity: 1, reason: prompt });
  }
  if (/emotionally\s+distant|emotionally\s+trapped|feel\s+trapped/i.test(prompt)) {
    patch.cinematicGrammar = { ...(patch.cinematicGrammar ?? (currentScene.cinematicGrammar ?? { tone: 'neutral', template: { cameraMode: 'static', spacingMultiplier: 1.0, motionEnergyScale: 1.0, pauseFrequency: 4, contrastBoost: 0.0, headroom: 1.0 } })), tone: 'lonely' };
    grammarChanged = true;
    patch.camera = { ...(patch.camera ?? camera), zoom: Math.max(((patch.camera ?? camera).zoom ?? 1) - 0.1, 0.7) };
    cameraChanged = true;
    patch.semanticOperations.push({ type: 'SetTone', tone: 'lonely', reason: prompt });
  }

  if (/new\s+scene|start\s+over|reset/i.test(prompt)) {
    actors.length = 0;
    actorsChanged = true;
    patch.relationships = [];
    relationshipsChanged = true;
    patch.semanticOperations.push({ type: 'ResetScene', reason: prompt });
  }

  if (/walk|walking|walks/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], currentAction: 'walking' };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'QueueActorAction', actorId: actors[0].id, action: { type: 'walking' }, reason: prompt });
  } else if (/sit|sitting|sits/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], currentAction: 'sitting' };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'QueueActorAction', actorId: actors[0].id, action: { type: 'sitting' }, reason: prompt });
  } else if (/pace|pacing|paces/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], currentAction: 'pacing' };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'QueueActorAction', actorId: actors[0].id, action: { type: 'pacing' }, reason: prompt });
  } else if (/stop|hesitate/i.test(prompt) && actors.length > 1) {
    const approachingIdx = actors.findIndex((a) => a.currentAction === 'approaching' || a.currentAction === 'walking');
    if (approachingIdx >= 0) {
      actors[approachingIdx] = {
        ...actors[approachingIdx],
        currentAction: 'idle',
        targetPosition: null,
        actionQueue: []
      };
      actorsChanged = true;
      patch.semanticOperations.push({
        type: 'QueueActorAction',
        actorId: actors[approachingIdx].id,
        action: { id: `action_hesitate_${actors[approachingIdx].id}`, type: 'hesitating', target: null, semanticReason: prompt, phase: 'queued', startedAt: 0, duration: 600, priority: 3, interruptible: true, status: 'queued' },
        reason: prompt
      });
    }
  } else if (/stand|standing|stands|idle/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], currentAction: 'idle' };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'QueueActorAction', actorId: actors[0].id, action: { type: 'idle' }, reason: prompt });
  }

  if (/move\s+(?:to\s+the\s+)?left|go\s+left/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], position: { ...actors[0].position, x: Math.max(actors[0].position.x - 120, 100) } };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'MoveActor', actorId: actors[0].id, direction: 'left', reason: prompt });
  } else if (/move\s+(?:to\s+the\s+)?right|go\s+right/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], position: { ...actors[0].position, x: Math.min(actors[0].position.x + 120, 860) } };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'MoveActor', actorId: actors[0].id, direction: 'right', reason: prompt });
  } else if (/move\s+(?:to\s+the\s+)?center|go\s+(?:to\s+)?center/i.test(prompt) && actors.length > 0) {
    actors[0] = { ...actors[0], position: { ...actors[0].position, x: 480 } };
    actorsChanged = true;
    patch.semanticOperations.push({ type: 'MoveActor', actorId: actors[0].id, direction: 'center', reason: prompt });
  }

  const relationships = currentScene.relationships ?? [];
  if (/argues?\s+with|confronts?|corners?/i.test(prompt) && actors.length >= 2) {
    actors[0] = { ...actors[0], emotionState: 'angry' };
    actors[1] = { ...actors[1], emotionState: 'angry' };
    actorsChanged = true;
    const rels = [...relationships];
    const relIdx = rels.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === actors[0].id && r.actorBId === actors[1].id);
    if (relIdx >= 0) {
      rels[relIdx] = { ...rels[relIdx], type: 'confronting' };
    } else {
      rels.push({ actorAId: actors[0].id, actorBId: actors[1].id, type: 'confronting', awarenessRadius: 200, gazeTarget: actors[1].id, emotionalReaction: 'angry' });
    }
    patch.relationships = rels;
    relationshipsChanged = true;
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'angry', intensity: 0.8, reason: prompt });
    patch.cinematicGrammar = { tone: 'threatening', template: { cameraMode: 'tension', spacingMultiplier: 0.6, motionEnergyScale: 0.8, pauseFrequency: 3, contrastBoost: 0.7, headroom: 0.6 } };
    grammarChanged = true;
  } else if (/comforts?|consoles?/i.test(prompt) && actors.length >= 2) {
    actors[0] = { ...actors[0], emotionState: 'sad' };
    actorsChanged = true;
    const rels = [...relationships];
    const relIdx = rels.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === actors[0].id && r.actorBId === actors[1].id);
    if (relIdx >= 0) {
      rels[relIdx] = { ...rels[relIdx], type: 'approaching' };
    } else {
      rels.push({ actorAId: actors[0].id, actorBId: actors[1].id, type: 'approaching', awarenessRadius: 200, gazeTarget: actors[1].id, emotionalReaction: 'sad' });
    }
    patch.relationships = rels;
    relationshipsChanged = true;
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[0].id, emotion: 'sad', intensity: 0.6, reason: prompt });
    patch.cinematicGrammar = { tone: 'sad', template: { cameraMode: 'close_up', spacingMultiplier: 0.5, motionEnergyScale: 0.5, pauseFrequency: 8, contrastBoost: 0.2, headroom: 0.8 } };
    grammarChanged = true;
  } else if (/avoids?|ignores?|turns?\s+away/i.test(prompt) && actors.length >= 2) {
    actors[1] = { ...actors[1], emotionState: 'nervous' };
    actorsChanged = true;
    const rels = [...relationships];
    const relIdx = rels.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === actors[0].id && r.actorBId === actors[1].id);
    if (relIdx >= 0) {
      rels[relIdx] = { ...rels[relIdx], type: 'avoiding' };
    } else {
      rels.push({ actorAId: actors[0].id, actorBId: actors[1].id, type: 'avoiding', awarenessRadius: 200, gazeTarget: null, emotionalReaction: 'nervous' });
    }
    patch.relationships = rels;
    relationshipsChanged = true;
    patch.semanticOperations.push({ type: 'SetActorEmotion', actorId: actors[1].id, emotion: 'nervous', intensity: 0.6, reason: prompt });
  } else if (/talks?\s+to|speaks?\s+to|chats?\s+with|converses?\s+with/i.test(prompt) && actors.length >= 2) {
    const rels = [...relationships];
    const relIdx = rels.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === actors[0].id && r.actorBId === actors[1].id);
    if (relIdx >= 0) {
      rels[relIdx] = { ...rels[relIdx], type: 'conversing' };
    } else {
      rels.push({ actorAId: actors[0].id, actorBId: actors[1].id, type: 'conversing', awarenessRadius: 200, gazeTarget: actors[1].id, emotionalReaction: null });
    }
    patch.relationships = rels;
    relationshipsChanged = true;
  }

  if (/add\s+(another|a\s+new|a\s+second)\s+(character|stickman|actor|person)/i.test(prompt)) {
    const newId = `actor_${actors.length + 1}`;
    const posX = 800;
    const posY = 360;
    actors.push({
      id: newId,
      label: 'Stickman',
      type: 'humanoid',
      position: { x: posX, y: posY },
      targetPosition: null,
      emotionState: 'neutral',
      currentAction: 'idle',
      actionQueue: [],
      joints: {
        head: { x: posX, y: posY - 58 },
        torso: { x: posX, y: posY - 30 },
        leftArm: { x: posX - 28, y: posY - 10 },
        rightArm: { x: posX + 28, y: posY - 10 },
        leftLeg: { x: posX - 18, y: posY + 42 },
        rightLeg: { x: posX + 18, y: posY + 42 }
      },
      actionElapsed: 0
    });
    actorsChanged = true;
  }

  if (actorsChanged) patch.actors = actors;
  if (!environmentChanged) delete patch.environment;
  if (!cameraChanged) delete patch.camera;
  if (!grammarChanged) delete patch.cinematicGrammar;
  if (!atmosphereChanged) delete patch.atmosphere;
  if (!relationshipsChanged) delete patch.relationships;
  if (!rhythmChanged) delete patch.rhythm;

  return patch;
}

const VALID_EMOTIONS = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];

export function normalizePatch(patch: ScenePatch, currentScene: ScenePatch): ScenePatch {
  const actors = Array.isArray(patch.actors) && patch.actors.length > 0
    ? [...patch.actors]
    : (Array.isArray(currentScene.actors) && currentScene.actors.length > 0 ? [...currentScene.actors] : []);

  if (actors.length === 0) {
    actors.push({
      id: 'actor_stickman',
      label: 'Stickman',
      type: 'humanoid',
      position: { x: 400, y: 360 },
      targetPosition: null,
      emotionState: 'neutral',
      currentAction: 'idle',
      actionQueue: ['idle'],
      joints: {
        head: { x: 400, y: 302 },
        torso: { x: 400, y: 330 },
        leftArm: { x: 372, y: 350 },
        rightArm: { x: 428, y: 350 },
        leftLeg: { x: 382, y: 402 },
        rightLeg: { x: 418, y: 402 }
      },
      actionElapsed: 0
    });
  }

  const sanitizedActors = actors.map((a: any) => {
    const emotionState = VALID_EMOTIONS.includes(a?.emotionState) ? a.emotionState : 'neutral';
    return {
      ...a,
      emotionState
    };
  });

  const defaultEnv = {
    type: 'indoor_room',
    backgroundColor: '#17151f',
    floorColor: '#2d221f',
    wallColor: '#211c29',
    width: 960,
    height: 540
  };

  const defaultCamera = { x: 0, y: 0, zoom: 1, mode: 'static' };
  const defaultAtmosphere = { effects: ['none'], lightingTint: 'rgba(0,0,0,0)', ambientIntensity: 1.0 };
  const defaultRhythm = { tempo: 'medium', pauseFrequencyPerMinute: 4, motionEnergyCurve: 'linear' };
  const defaultGrammar = { tone: 'neutral', template: { cameraMode: 'static', spacingMultiplier: 1.0, motionEnergyScale: 1.0, headroom: 1.0, pauseFrequency: 4, contrastBoost: 0 } };

  return {
    actors: sanitizedActors,
    environment: patch.environment ?? currentScene.environment ?? defaultEnv,
    camera: patch.camera ?? currentScene.camera ?? defaultCamera,
    cinematicGrammar: patch.cinematicGrammar ?? currentScene.cinematicGrammar ?? defaultGrammar,
    atmosphere: patch.atmosphere ?? currentScene.atmosphere ?? defaultAtmosphere,
    relationships: Array.isArray(patch.relationships) ? patch.relationships : (Array.isArray(currentScene.relationships) ? currentScene.relationships : []),
    rhythm: patch.rhythm ?? currentScene.rhythm ?? defaultRhythm,
    semanticOperations: Array.isArray(patch.semanticOperations) ? patch.semanticOperations : []
  };
}

function applyDirectorIntentToPatch(
  patch: Partial<ScenePatch>,
  currentScene: ScenePatch,
  intent?: DirectorIntent
): Partial<ScenePatch> {
  const adjustments = getDirectorIntentAdjustments(intent);
  if (!adjustments) return patch;

  const baseCamera = patch.camera ?? currentScene.camera ?? { x: 0, y: 0, zoom: 1, mode: 'static' };
  const baseGrammar = patch.cinematicGrammar ?? currentScene.cinematicGrammar ?? {
    tone: 'neutral',
    template: {
      cameraMode: 'static',
      spacingMultiplier: 1.0,
      motionEnergyScale: 1.0,
      pauseFrequency: 4,
      contrastBoost: 0.0,
      headroom: 1.0
    }
  };
  const baseAtmosphere = patch.atmosphere ?? currentScene.atmosphere ?? {
    effects: ['none'],
    lightingTint: 'rgba(0,0,0,0)',
    ambientIntensity: 1.0
  };
  const baseRhythm = patch.rhythm ?? currentScene.rhythm ?? {
    tempo: 'medium',
    pauseFrequencyPerMinute: 4,
    motionEnergyCurve: 'linear'
  };

  return {
    ...patch,
    camera: {
      ...baseCamera,
      zoom: adjustments.cameraZoom
    },
    cinematicGrammar: {
      ...baseGrammar,
      template: {
        ...baseGrammar.template,
        spacingMultiplier: adjustments.spacingMultiplier,
        motionEnergyScale: adjustments.motionEnergyScale,
        pauseFrequency: adjustments.pauseFrequency,
        contrastBoost: adjustments.contrastBoost,
        headroom: adjustments.headroom
      }
    },
    atmosphere: {
      ...baseAtmosphere,
      ambientIntensity: adjustments.ambientIntensity,
      lightingTint: adjustments.lightingTint
    },
    rhythm: {
      ...baseRhythm,
      pauseFrequencyPerMinute: adjustments.pauseFrequency
    }
  };
}

export default router;
