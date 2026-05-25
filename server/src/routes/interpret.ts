import { Router } from 'express';
import { providerRegistry } from '../ai/providers/providerRegistry.js';
import { orchestrator } from '../ai/runtime/orchestrator.js';
import type { ProviderName } from '../ai/providers/providerInterface.js';
import { isOk, isErr } from '../types/result.js';
import { getDirectorIntentAdjustments, type DirectorIntent } from '../ai/directing/directorIntent.js';
import {
  buildSceneGenerationUserPrompt,
  sceneGenerationResponseSchema,
  sceneGenerationSystemPrompt
} from '../prompts/sceneGenerationPrompt.js';
import { planScene } from '../planning/scenePlanner.js';
import { generateShotSequence, NarrativeState } from '../planning/shotSequencer.js';
import { SequencedShot } from '../shots/shotSequencer.js';

type SceneGraphResponse = {
  id: string;
  version: number;
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
  sessionHistory: Array<{ id: string; prompt: string; createdAt: number }>;
  cinematicGrammar: {
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
  atmosphere: {
    effects: string[];
    lightingTint: string;
    ambientIntensity: number;
  };
  relationships: Array<{
    actorAId: string;
    actorBId: string;
    type: string;
    awarenessRadius: number;
    gazeTarget: string | null;
    emotionalReaction: string | null;
  }>;
  rhythm: {
    tempo: string;
    pauseFrequencyPerMinute: number;
    motionEnergyCurve: string;
  };
  worldPlan?: {
    locationType: string;
    timeOfDay: string;
    tone: string;
    weather: string;
    layoutStyle: string;
    visualDensity: string;
    lightingLanguage: string;
    compositionStyle: string;
    cameraLanguage: string;
    keyProps: string[];
    visualStyle: string;
    emotionalEnergy: number;
  };
};

export type InterpretationResult = SceneGraphResponse & {
  explanation?: string;
};

type ActorOverride = {
  actorId: string;
  emotion: SceneGraphResponse['actors'][number]['emotionState'];
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

type InterpretRequestBody = {
  prompt?: string;
  directing?: DirectingContext;
};

const router = Router();

router.post('/', async (request, response) => {
  const body = request.body as InterpretRequestBody | undefined;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';
  const directing = body?.directing;

  if (!prompt) {
    response.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const scene = await interpretPrompt(prompt, directing);
    response.json(scene);
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      response.status(504).json({ error: 'Request timed out — please try again' });
      return;
    }
    const message = error instanceof Error ? error.message : 'Unable to interpret prompt';
    response.status(502).json({ error: message });
  }
});

export async function interpretPrompt(prompt: string, directing?: DirectingContext): Promise<InterpretationResult> {
  const truncatedPrompt = typeof prompt === 'string' ? prompt.trim().substring(0, 2000) : '';

  try {
    let orchestration;
    try {
      orchestration = await orchestrator.orchestrateSceneGeneration(truncatedPrompt);
    } catch (err) {
      console.error('Orchestration failed, using fallback:', err);
      orchestration = {
        scenePlan: {},
        agentReports: {
          cinematography: { cameraMode: 'static', framing: 'medium', transition: 'cut', reasoning: 'fallback' },
          environment: { locationType: 'indoor_room', compositionBias: 'balanced', reasoning: 'fallback' },
          emotionalArc: { pacing: 'medium', intensityCurve: 'flat', reasoning: 'fallback' },
          blocking: { style: 'static', spacing: 200, reasoning: 'fallback' },
          dialogue: { energy: 0.5, speed: 'normal', reasoning: 'fallback' },
          lighting: { lightingLanguage: 'natural', keyColor: '#ffffff', ambientIntensity: 0.5, reasoning: 'fallback' }
        },
        intent: { emotionalPressure: 0.5, tensionLevel: 0.5, threatLevel: 0.5, intimacyLevel: 0.5, compositionStyle: 'balanced', lightingLanguage: 'natural', pacingStyle: 'measured', cameraAggression: 0.5, dialogueEnergy: 0.5, visualIsolation: 0.5, pacingStyleDurationMultiplier: 1.0 },
        context: null,
        providerUsed: 'fallback',
        fallbackUsed: true,
        reasoning: ['orchestration threw exception']
      };
    }

    const context = buildGenerationContext(directing, orchestration as any);
    const provider = resolveProvider(orchestration.providerUsed);

    if (!provider || provider.name === 'mock') {
      const fallback = createFallbackScene(truncatedPrompt);
      fallback.worldPlan = resolveWorldPlan(truncatedPrompt, fallback.actors.length, orchestration.scenePlan);
      const scene = applyDirectorIntentToScene(fallback, directing?.directorIntent);
      return {
        ...scene,
        explanation: 'LLM provider is set to mock or is unavailable. Skipped LLM scene interpretation. Inferred fallback scene parameters (environment, actors, cinematic settings) using rule-based parsing of the prompt.'
      };
    }

    let completionResult;
    try {
      completionResult = await provider.complete({
        messages: [
          { role: 'system', content: sceneGenerationSystemPrompt },
          { role: 'user', content: buildSceneGenerationUserPrompt(truncatedPrompt, context) }
        ],
        temperature: 0.2,
        maxTokens: 2000,
        responseFormat: 'json',
        jsonSchema: sceneGenerationResponseSchema
      });
    } catch (err) {
      console.error('LLM complete call threw exception, falling back:', err);
      completionResult = { ok: false, error: err instanceof Error ? err : new Error(String(err)) } as any;
    }

    if (isErr(completionResult)) {
      console.error('Scene generation failed, using fallback', completionResult.error);
      const fallback = createFallbackScene(truncatedPrompt);
      fallback.worldPlan = resolveWorldPlan(truncatedPrompt, fallback.actors.length, orchestration.scenePlan);
      const scene = applyDirectorIntentToScene(fallback, directing?.directorIntent);
      const errMsg = completionResult.error instanceof Error ? completionResult.error.message : String(completionResult.error);
      return {
        ...scene,
        explanation: `LLM complete call failed with error: ${errMsg}. Skipped LLM interpretation and fell back to rule-based inference for scene parameters based on the prompt.`
      };
    }

    const completion = completionResult.value;
    if (!completion.content || !completion.content.trim()) {
      console.error('Provider response was empty');
      const fallback = createFallbackScene(truncatedPrompt);
      fallback.worldPlan = resolveWorldPlan(truncatedPrompt, fallback.actors.length, orchestration.scenePlan);
      const scene = applyDirectorIntentToScene(fallback, directing?.directorIntent);
      return {
        ...scene,
        explanation: 'LLM provider returned an empty response. Skipped LLM interpretation and fell back to rule-based inference for scene parameters based on the prompt.'
      };
    }

    let parsed: SceneGraphResponse;
    try {
      parsed = JSON.parse(completion.content) as SceneGraphResponse;
    } catch (parseErr) {
      console.error('JSON parse of completion content failed, using fallback:', parseErr);
      const fallback = createFallbackScene(truncatedPrompt);
      fallback.worldPlan = resolveWorldPlan(truncatedPrompt, fallback.actors.length, orchestration.scenePlan);
      const scene = applyDirectorIntentToScene(fallback, directing?.directorIntent);
      return {
        ...scene,
        explanation: `LLM provider response was not valid JSON (${parseErr instanceof Error ? parseErr.message : String(parseErr)}). Skipped LLM interpretation and fell back to rule-based inference for scene parameters based on the prompt.`
      };
    }

    const actorCount = Array.isArray(parsed.actors) ? parsed.actors.length : 1;
    const worldPlan = resolveWorldPlan(truncatedPrompt, actorCount, orchestration.scenePlan);
    const normalized = normalizeSceneGraph(parsed, truncatedPrompt, worldPlan);
    return applyDirectorIntentToScene(normalized, directing?.directorIntent);
  } catch (globalError) {
    console.error('Fatal error in interpretPrompt, returning fallback scene:', globalError);
    const fallback = createFallbackScene(truncatedPrompt);
    fallback.worldPlan = resolveWorldPlan(truncatedPrompt, fallback.actors.length, {});
    const scene = applyDirectorIntentToScene(fallback, directing?.directorIntent);
    return {
      ...scene,
      explanation: `Fatal error in interpretation pipeline: ${globalError instanceof Error ? globalError.message : String(globalError)}. Skipped standard interpretation and fell back to rule-based inference.`
    };
  }
}

type SceneOrchestration = Awaited<ReturnType<typeof orchestrator.orchestrateSceneGeneration>>;

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

function buildGenerationContext(directing: DirectingContext | undefined, orchestration: SceneOrchestration) {
  if (!directing && !orchestration) return '';

  const contextPayload = {
    directorIntent: directing?.directorIntent ?? null,
    actorOverrides: directing?.actorOverrides ?? [],
    beatSequence: summarizeBeatSequence(directing?.beatSequence),
    scenePlan: orchestration.scenePlan,
    intent: orchestration.intent,
    agentReports: orchestration.agentReports,
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

function resolveWorldPlan(prompt: string, actorCount: number, scenePlan?: Record<string, unknown>): SceneGraphResponse['worldPlan'] {
  const base = planScene(prompt, actorCount);
  if (!scenePlan || typeof scenePlan !== 'object') {
    return base as SceneGraphResponse['worldPlan'];
  }

  return {
    ...base,
    locationType: typeof scenePlan.locationType === 'string' ? scenePlan.locationType : base.locationType,
    timeOfDay: typeof scenePlan.timeOfDay === 'string' ? scenePlan.timeOfDay : base.timeOfDay,
    tone: typeof scenePlan.tone === 'string' ? scenePlan.tone : base.tone,
    weather: typeof scenePlan.weather === 'string' ? scenePlan.weather : base.weather,
    compositionStyle: typeof scenePlan.compositionStyle === 'string' ? scenePlan.compositionStyle : base.compositionStyle,
    lightingLanguage: typeof scenePlan.lightingLanguage === 'string' ? scenePlan.lightingLanguage : base.lightingLanguage,
    cameraLanguage: typeof scenePlan.cameraLanguage === 'string' ? scenePlan.cameraLanguage : base.cameraLanguage,
    keyProps: Array.isArray(scenePlan.keyProps) ? scenePlan.keyProps as string[] : base.keyProps,
    emotionalEnergy: typeof scenePlan.emotionalPressure === 'number' ? scenePlan.emotionalPressure : base.emotionalEnergy
  } as SceneGraphResponse['worldPlan'];
}

function applyDirectorIntentToScene<T extends SceneGraphResponse>(scene: T, intent?: DirectorIntent): T {
  const adjustments = getDirectorIntentAdjustments(intent);
  if (!adjustments) return scene;

  return {
    ...scene,
    camera: {
      ...scene.camera,
      zoom: adjustments.cameraZoom
    },
    cinematicGrammar: {
      ...scene.cinematicGrammar,
      template: {
        ...scene.cinematicGrammar.template,
        spacingMultiplier: adjustments.spacingMultiplier,
        motionEnergyScale: adjustments.motionEnergyScale,
        pauseFrequency: adjustments.pauseFrequency,
        contrastBoost: adjustments.contrastBoost,
        headroom: adjustments.headroom
      }
    },
    atmosphere: {
      ...scene.atmosphere,
      ambientIntensity: adjustments.ambientIntensity,
      lightingTint: adjustments.lightingTint
    },
    rhythm: {
      ...scene.rhythm,
      pauseFrequencyPerMinute: adjustments.pauseFrequency
    }
  };
}

function createFallbackScene(prompt: string): SceneGraphResponse {
  const isSad = /sad|dark|lonely/i.test(prompt);
  const isNervous = /nervous|anxious|tense/i.test(prompt);
  const isHappy = /happy|warm|bright/i.test(prompt);
  const isExcited = /excited|thrilled/i.test(prompt);
  const isAngry = /angry|furious|rage/i.test(prompt);
  const isExhausted = /exhausted|tired|weary/i.test(prompt);
  const isAwkward = /awkward|uncomfortable/i.test(prompt);
  const isSit = /sit/i.test(prompt);
  const isWalk = /walk|enter/i.test(prompt);
  const isApproach = /approach|comes|walks.*toward|comes.*closer/i.test(prompt);
  const isConfront = /argues?\s+with|confronts?|corners?|fights?\s+with|yells?\s+at/i.test(prompt);
  const isComfort = /comforts?|consoles?|hugs?|holds?\s+hands?/i.test(prompt);
  const isTalkTo = /talks?\s+to|speaks?\s+to|chats?\s+with|converses?\s+with/i.test(prompt);
  const isWatchWith = /watches?\s+with|sits?\s+with|stands?\s+with|waits?\s+with/i.test(prompt);
  const isAvoid = /avoids?|ignores?|turns?\s+away|walks?\s+away/i.test(prompt);
  const hasRelational = isConfront || isComfort || isTalkTo || isWatchWith || isAvoid;
  const hasSecondActor = /another|second|someone|while.*character|two/i.test(prompt) || hasRelational;
  const isPark = /park|garden|meadow/i.test(prompt);
  const isBeach = /beach|ocean|sea|shore/i.test(prompt);
  const isForest = /forest|woods|jungle/i.test(prompt);
  const isRooftop = /rooftop|roof/i.test(prompt);
  const isHallway = /hallway|corridor/i.test(prompt);
  const isSubway = /subway|metro|underground|station/i.test(prompt);
  const isHospital = /hospital|clinic|ward/i.test(prompt);
  const isApartment = /apartment|flat|home/i.test(prompt);
  const isStaircase = /staircase|stairs|stairwell/i.test(prompt);
  const isAlley = /alley|alleyway|back\s*alley/i.test(prompt);
  const isParkingGarage = /parking\s*garage|parking\s*lot|garage/i.test(prompt);
  const isDiner = /diner|restaurant|cafe|cafeteria/i.test(prompt);
  const isOffice = /office|cubicle|workspace|boardroom/i.test(prompt);
  const isWarehouse = /warehouse|factory|storage|loading\s*dock/i.test(prompt);
  const isStreet = /street|outdoor|outside|lamp|road/i.test(prompt);
  const isNight = /night|flicker|streetlight/i.test(prompt);
  const isLonely = /lonely|alone|isolated/i.test(prompt);
  const hasFlicker = /flicker|streetlight|lamp/i.test(prompt);
  const hasRain = /rain/i.test(prompt);

  const emotionState = isAngry ? 'angry' : isExhausted ? 'exhausted' : isExcited ? 'excited' : isAwkward ? 'awkward' : isNervous ? 'nervous' : isHappy ? 'happy' : isSad ? 'sad' : 'neutral';
  const currentAction = isWalk ? 'walking' : isSit ? 'sitting' : 'idle';
  const actionQueue: Array<'idle' | 'walking' | 'sitting' | 'approaching' | 'pacing'> = isWalk && isSit ? ['sitting'] : ['idle'];

  const envType = isAlley ? 'alley' : isParkingGarage ? 'parking_garage' : isDiner ? 'diner' : isOffice ? 'office' : isWarehouse ? 'warehouse' : isRooftop ? 'rooftop' : isHallway ? 'hallway' : isSubway ? 'subway' : isHospital ? 'hospital' : isApartment ? 'apartment' : isStaircase ? 'staircase' : isPark ? 'outdoor_park' : isBeach ? 'outdoor_beach' : isForest ? 'outdoor_forest' : isStreet ? 'outdoor_street' : 'indoor_room';
  const roomColor = isAlley ? '#0a0a12' : isParkingGarage ? '#101012' : isDiner ? '#1a1510' : isOffice ? '#1a1a22' : isWarehouse ? '#101010' : isRooftop ? '#0a0e1a' : isHallway ? '#0f1218' : isSubway ? '#0a0c12' : isHospital ? '#1a1e24' : isPark ? '#1a2e1a' : isBeach ? '#1a3a5a' : isForest ? '#0f1f0f' : isNight ? '#0a0e1a' : isSad ? '#17151f' : isHappy ? '#2d1d12' : '#1b1f24';

  const tone = isLonely ? 'lonely' : isSad ? 'sad' : isNervous ? 'tense' : 'neutral';
  const cameraMode = isLonely ? 'wide_shot' : isSad ? 'wide_shot' : isNervous && hasSecondActor ? 'tension' : 'static';

  const effects: string[] = [];
  if (hasFlicker) effects.push('flicker');
  if (hasRain) effects.push('rain');
  if (effects.length === 0) effects.push('none');

  const actors: SceneGraphResponse['actors'] = [
    {
      id: 'actor_stickman',
      label: 'Stickman',
      type: 'humanoid',
      position: { x: 400, y: 360 },
      targetPosition: isWalk ? { x: 660, y: 360 } : null,
      emotionState,
      currentAction,
      actionQueue: [...actionQueue],
      joints: {
        head: { x: 400, y: 302 },
        torso: { x: 400, y: 330 },
        leftArm: { x: 372, y: 350 },
        rightArm: { x: 428, y: 350 },
        leftLeg: { x: 382, y: 402 },
        rightLeg: { x: 418, y: 402 }
      },
      actionElapsed: 0
    }
  ];

  const relationships: SceneGraphResponse['relationships'] = [];

  if (hasSecondActor) {
    const secondAction = isApproach ? 'approaching' : 'idle';
    const relSpacing = isConfront ? 180 : isComfort ? 120 : isAvoid ? 500 : isTalkTo || isWatchWith ? 160 : 450;
    const secondPos = { x: 400 + relSpacing, y: 360 };
    const secondEmotion = isConfront ? 'angry' : isComfort ? 'sad' : isAvoid ? 'nervous' : 'neutral';
    const relType = isConfront ? 'confronting' : isComfort ? 'approaching' : isAvoid ? 'avoiding' : isTalkTo || isWatchWith ? 'conversing' : isApproach ? 'approaching' : 'stranger';

    actors.push({
      id: 'actor_2',
      label: 'Stranger',
      type: 'humanoid',
      position: secondPos,
      targetPosition: isApproach || isConfront ? { x: 500, y: 360 } : null,
      emotionState: secondEmotion,
      currentAction: secondAction,
      actionQueue: ['idle'],
      joints: {
        head: { x: secondPos.x, y: secondPos.y - 58 },
        torso: { x: secondPos.x, y: secondPos.y - 30 },
        leftArm: { x: secondPos.x - 28, y: secondPos.y - 10 },
        rightArm: { x: secondPos.x + 28, y: secondPos.y - 10 },
        leftLeg: { x: secondPos.x - 18, y: secondPos.y + 42 },
        rightLeg: { x: secondPos.x + 18, y: secondPos.y + 42 }
      },
      actionElapsed: 0
    });

    if (isConfront) {
      actors[0] = { ...actors[0], emotionState: 'angry' };
    } else if (isComfort) {
      actors[0] = { ...actors[0], emotionState: 'sad' };
    }

    relationships.push({
      actorAId: 'actor_stickman',
      actorBId: 'actor_2',
      type: relType,
      awarenessRadius: 200,
      gazeTarget: 'actor_2',
      emotionalReaction: isConfront ? 'angry' : isComfort ? 'sad' : null
    });
  }

  return {
    id: 'scene_001',
    version: 1,
    actors,
    environment: {
      type: envType,
      backgroundColor: roomColor,
      floorColor: isAlley ? '#151515' : isParkingGarage ? '#1a1a1a' : isDiner ? '#2a2018' : isOffice ? '#2a2a30' : isWarehouse ? '#1a1a18' : isRooftop ? '#2a2530' : isHallway ? '#1a1620' : isSubway ? '#2a2530' : isHospital ? '#1e2228' : isApartment ? '#2d221f' : isStaircase ? '#1a1620' : isPark ? '#2d4a2d' : isBeach ? '#c2a878' : isForest ? '#1a3a1a' : isNight ? '#0d0f14' : isSad ? '#2d221f' : '#3a2b1f',
      wallColor: isAlley ? '#1a1a20' : isParkingGarage ? '#222228' : isDiner ? '#352a20' : isOffice ? '#353540' : isWarehouse ? '#222220' : isRooftop ? '#0f1420' : isHallway ? '#1a1822' : isSubway ? '#16141e' : isHospital ? '#202830' : isApartment ? '#211c29' : isStaircase ? '#1a1822' : isPark ? '#1f3a1f' : isBeach ? '#2a4a6a' : isForest ? '#0a2a0a' : isNight ? '#111828' : isSad ? '#211c29' : '#2a2228',
      width: 960,
      height: 540
    },
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
      mode: cameraMode
    },
    sessionHistory: [
      {
        id: 'session_entry_1',
        prompt,
        createdAt: Date.now()
      }
    ],
    cinematicGrammar: {
      tone,
      template: {
        cameraMode,
        spacingMultiplier: isLonely ? 1.8 : isSad ? 1.4 : 1.0,
        motionEnergyScale: isLonely ? 0.6 : isSad ? 0.5 : 1.0,
        pauseFrequency: isLonely ? 8 : isSad ? 10 : 4,
        contrastBoost: isNervous ? 0.5 : 0.0,
        headroom: isLonely ? 1.4 : 1.0
      }
    },
    atmosphere: {
      effects,
      lightingTint: isNight ? 'night' : isSad ? 'cold' : 'rgba(0,0,0,0)',
      ambientIntensity: isNight ? 0.4 : 1.0
    },
    relationships,
    rhythm: {
      tempo: isLonely || isSad ? 'slow' : isExcited ? 'fast' : 'medium',
      pauseFrequencyPerMinute: isLonely ? 8 : isSad ? 10 : 4,
      motionEnergyCurve: isNervous ? 'sharp' : 'linear'
    },
    // Phase 6: Generate semantic world plan
    worldPlan: planScene(prompt, actors.length) as SceneGraphResponse['worldPlan'],
    // Phase 9
    ...generateShotSequence(prompt, actors as any),
  };
}

const VALID_EMOTIONS = ['neutral', 'sad', 'happy', 'nervous', 'excited', 'awkward', 'angry', 'exhausted'];
const VALID_ACTIONS = ['idle', 'walking', 'sitting', 'approaching', 'pacing'];

function sanitizeActor(a: any, index: number, skipped: string[], inferred: string[]): SceneGraphResponse['actors'][number] {
  if (typeof a !== 'object' || a === null) {
    skipped.push(`actor at index ${index}`);
    inferred.push(`default actor at index ${index}`);
    return {
      id: `actor_${index + 1}`,
      label: `Actor ${index + 1}`,
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
    };
  }

  const id = typeof a.id === 'string' && a.id.trim() ? a.id.trim() : `actor_${index + 1}`;
  if (typeof a.id !== 'string' || !a.id.trim()) {
    skipped.push(`actor_${index + 1} ID`);
    inferred.push(`actor_${index + 1} ID`);
  }

  const label = typeof a.label === 'string' && a.label.trim() ? a.label.trim() : id;
  if (typeof a.label !== 'string' || !a.label.trim()) {
    skipped.push(`actor label for ${id}`);
    inferred.push(`actor label set to ID '${id}'`);
  }

  let position = { x: 400, y: 360 };
  if (a.position && typeof a.position.x === 'number' && typeof a.position.y === 'number') {
    position = { x: a.position.x, y: a.position.y };
  } else {
    skipped.push(`actor position for ${id}`);
    inferred.push(`default position {x: 400, y: 360} for ${id}`);
  }

  const targetPosition = (a.targetPosition && typeof a.targetPosition.x === 'number' && typeof a.targetPosition.y === 'number')
    ? { x: a.targetPosition.x, y: a.targetPosition.y }
    : null;
  if (a.targetPosition && !(typeof a.targetPosition.x === 'number' && typeof a.targetPosition.y === 'number')) {
    skipped.push(`invalid targetPosition for ${id}`);
    inferred.push(`targetPosition set to null for ${id}`);
  }

  let emotionState = a.emotionState;
  if (!VALID_EMOTIONS.includes(emotionState)) {
    skipped.push(`invalid emotionState '${a.emotionState}' for ${id}`);
    inferred.push(`'neutral' emotionState for ${id}`);
    emotionState = 'neutral';
  }

  let currentAction = a.currentAction;
  if (!VALID_ACTIONS.includes(currentAction)) {
    skipped.push(`invalid currentAction '${a.currentAction}' for ${id}`);
    inferred.push(`'idle' currentAction for ${id}`);
    currentAction = 'idle';
  }

  let actionQueue = a.actionQueue;
  if (Array.isArray(actionQueue)) {
    const validQueue = actionQueue.filter((act: any) => VALID_ACTIONS.includes(act));
    if (validQueue.length !== actionQueue.length) {
      skipped.push(`invalid actions in actionQueue for ${id}`);
    }
    actionQueue = validQueue;
  } else {
    skipped.push(`missing or invalid actionQueue for ${id}`);
    actionQueue = ['idle'];
    inferred.push(`['idle'] actionQueue for ${id}`);
  }
  if (actionQueue.length === 0) {
    actionQueue.push('idle');
    inferred.push(`injected 'idle' action into empty actionQueue for ${id}`);
  }

  let joints;
  if (a.joints &&
    a.joints.head && typeof a.joints.head.x === 'number' && typeof a.joints.head.y === 'number' &&
    a.joints.torso && typeof a.joints.torso.x === 'number' && typeof a.joints.torso.y === 'number' &&
    a.joints.leftArm && typeof a.joints.leftArm.x === 'number' && typeof a.joints.leftArm.y === 'number' &&
    a.joints.rightArm && typeof a.joints.rightArm.x === 'number' && typeof a.joints.rightArm.y === 'number' &&
    a.joints.leftLeg && typeof a.joints.leftLeg.x === 'number' && typeof a.joints.leftLeg.y === 'number' &&
    a.joints.rightLeg && typeof a.joints.rightLeg.x === 'number' && typeof a.joints.rightLeg.y === 'number') {
    joints = {
      head: { x: a.joints.head.x, y: a.joints.head.y },
      torso: { x: a.joints.torso.x, y: a.joints.torso.y },
      leftArm: { x: a.joints.leftArm.x, y: a.joints.leftArm.y },
      rightArm: { x: a.joints.rightArm.x, y: a.joints.rightArm.y },
      leftLeg: { x: a.joints.leftLeg.x, y: a.joints.leftLeg.y },
      rightLeg: { x: a.joints.rightLeg.x, y: a.joints.rightLeg.y }
    };
  } else {
    skipped.push(`missing or invalid joints for ${id}`);
    inferred.push(`default stickman joint layout for ${id}`);
    joints = {
      head: { x: position.x, y: position.y - 58 },
      torso: { x: position.x, y: position.y - 30 },
      leftArm: { x: position.x - 28, y: position.y - 10 },
      rightArm: { x: position.x + 28, y: position.y - 10 },
      leftLeg: { x: position.x - 18, y: position.y + 42 },
      rightLeg: { x: position.x + 18, y: position.y + 42 }
    };
  }

  const actionElapsed = typeof a.actionElapsed === 'number' && a.actionElapsed >= 0 ? a.actionElapsed : 0;
  if (typeof a.actionElapsed !== 'number' || a.actionElapsed < 0) {
    skipped.push(`invalid actionElapsed for ${id}`);
    inferred.push(`actionElapsed set to 0 for ${id}`);
  }

  return {
    id,
    label,
    type: 'humanoid',
    position,
    targetPosition,
    emotionState: emotionState as any,
    currentAction: currentAction as any,
    actionQueue: actionQueue as any,
    joints,
    actionElapsed
  };
}

function sanitizeEnvironment(env: any, fallbackEnv: SceneGraphResponse['environment'], skipped: string[], inferred: string[]): SceneGraphResponse['environment'] {
  if (typeof env !== 'object' || env === null) {
    skipped.push('environment configuration');
    inferred.push('default environment settings');
    return fallbackEnv;
  }

  let type = fallbackEnv.type;
  if (typeof env.type === 'string' && env.type.trim()) {
    type = env.type.trim();
  } else {
    skipped.push('environment type');
    inferred.push(`environment type '${fallbackEnv.type}'`);
  }

  let backgroundColor = fallbackEnv.backgroundColor;
  if (typeof env.backgroundColor === 'string' && env.backgroundColor.trim()) {
    backgroundColor = env.backgroundColor.trim();
  } else {
    skipped.push('environment background color');
    inferred.push(`background color '${fallbackEnv.backgroundColor}'`);
  }

  let floorColor = fallbackEnv.floorColor;
  if (typeof env.floorColor === 'string' && env.floorColor.trim()) {
    floorColor = env.floorColor.trim();
  } else {
    skipped.push('environment floor color');
    inferred.push(`floor color '${fallbackEnv.floorColor}'`);
  }

  let wallColor = fallbackEnv.wallColor;
  if (typeof env.wallColor === 'string' && env.wallColor.trim()) {
    wallColor = env.wallColor.trim();
  } else {
    skipped.push('environment wall color');
    inferred.push(`wall color '${fallbackEnv.wallColor}'`);
  }

  let width = fallbackEnv.width;
  if (typeof env.width === 'number' && env.width >= 1) {
    width = env.width;
  } else {
    skipped.push('environment width');
    inferred.push(`width ${fallbackEnv.width}`);
  }

  let height = fallbackEnv.height;
  if (typeof env.height === 'number' && env.height >= 1) {
    height = env.height;
  } else {
    skipped.push('environment height');
    inferred.push(`height ${fallbackEnv.height}`);
  }

  return { type, backgroundColor, floorColor, wallColor, width, height };
}

function sanitizeCamera(cam: any, fallbackCam: SceneGraphResponse['camera'], skipped: string[], inferred: string[]): SceneGraphResponse['camera'] {
  if (typeof cam !== 'object' || cam === null) {
    skipped.push('camera configuration');
    inferred.push('default camera settings');
    return fallbackCam;
  }

  let x = fallbackCam.x;
  if (typeof cam.x === 'number') {
    x = cam.x;
  } else {
    skipped.push('camera x position');
    inferred.push(`camera x to ${fallbackCam.x}`);
  }

  let y = fallbackCam.y;
  if (typeof cam.y === 'number') {
    y = cam.y;
  } else {
    skipped.push('camera y position');
    inferred.push(`camera y to ${fallbackCam.y}`);
  }

  let zoom = fallbackCam.zoom;
  if (typeof cam.zoom === 'number' && cam.zoom >= 0) {
    zoom = cam.zoom;
  } else {
    skipped.push('camera zoom');
    inferred.push(`camera zoom to ${fallbackCam.zoom}`);
  }

  let mode = fallbackCam.mode;
  if (typeof cam.mode === 'string' && cam.mode.trim()) {
    mode = cam.mode.trim();
  } else {
    skipped.push('camera mode');
    inferred.push(`camera mode to '${fallbackCam.mode}'`);
  }

  return { x, y, zoom, mode };
}

function sanitizeAtmosphere(atmo: any, fallbackAtmo: SceneGraphResponse['atmosphere'], skipped: string[], inferred: string[]): SceneGraphResponse['atmosphere'] {
  if (typeof atmo !== 'object' || atmo === null) {
    skipped.push('atmosphere configuration');
    inferred.push('default atmosphere profile');
    return fallbackAtmo;
  }

  let effects = fallbackAtmo.effects;
  if (Array.isArray(atmo.effects) && atmo.effects.length > 0) {
    const validEffects = atmo.effects.map((e: any) => typeof e === 'string' ? e.trim() : '').filter(Boolean);
    if (validEffects.length > 0) {
      effects = validEffects;
    } else {
      skipped.push('atmosphere effects list');
      inferred.push(`default effects [${fallbackAtmo.effects.join(', ')}]`);
    }
  } else {
    skipped.push('atmosphere effects');
    inferred.push(`default effects [${fallbackAtmo.effects.join(', ')}]`);
  }

  let lightingTint = fallbackAtmo.lightingTint;
  if (typeof atmo.lightingTint === 'string' && atmo.lightingTint.trim()) {
    lightingTint = atmo.lightingTint.trim();
  } else {
    skipped.push('atmosphere lighting tint');
    inferred.push(`lighting tint '${fallbackAtmo.lightingTint}'`);
  }

  let ambientIntensity = fallbackAtmo.ambientIntensity;
  if (typeof atmo.ambientIntensity === 'number' && atmo.ambientIntensity >= 0 && atmo.ambientIntensity <= 1) {
    ambientIntensity = atmo.ambientIntensity;
  } else {
    skipped.push('atmosphere ambient intensity');
    inferred.push(`ambient intensity ${fallbackAtmo.ambientIntensity}`);
  }

  return { effects, lightingTint, ambientIntensity };
}

function sanitizeCinematicGrammar(cg: any, fallbackCg: SceneGraphResponse['cinematicGrammar'], skipped: string[], inferred: string[]): SceneGraphResponse['cinematicGrammar'] {
  if (typeof cg !== 'object' || cg === null) {
    skipped.push('cinematic grammar configuration');
    inferred.push('default cinematic grammar settings');
    return fallbackCg;
  }

  let tone = fallbackCg.tone;
  if (typeof cg.tone === 'string' && cg.tone.trim()) {
    tone = cg.tone.trim();
  } else {
    skipped.push('cinematic tone');
    inferred.push(`cinematic tone '${fallbackCg.tone}'`);
  }

  if (typeof cg.template !== 'object' || cg.template === null) {
    skipped.push('cinematic template config');
    inferred.push('default cinematic template values');
    return { tone, template: fallbackCg.template };
  }

  const template = cg.template;
  let cameraMode = fallbackCg.template.cameraMode;
  if (typeof template.cameraMode === 'string' && template.cameraMode.trim()) {
    cameraMode = template.cameraMode.trim();
  } else {
    skipped.push('cinematic template cameraMode');
    inferred.push(`cameraMode '${fallbackCg.template.cameraMode}'`);
  }

  let spacingMultiplier = fallbackCg.template.spacingMultiplier;
  if (typeof template.spacingMultiplier === 'number') {
    spacingMultiplier = template.spacingMultiplier;
  } else {
    skipped.push('cinematic template spacingMultiplier');
    inferred.push(`spacingMultiplier ${fallbackCg.template.spacingMultiplier}`);
  }

  let motionEnergyScale = fallbackCg.template.motionEnergyScale;
  if (typeof template.motionEnergyScale === 'number') {
    motionEnergyScale = template.motionEnergyScale;
  } else {
    skipped.push('cinematic template motionEnergyScale');
    inferred.push(`motionEnergyScale ${fallbackCg.template.motionEnergyScale}`);
  }

  let pauseFrequency = fallbackCg.template.pauseFrequency;
  if (typeof template.pauseFrequency === 'number' && template.pauseFrequency >= 0) {
    pauseFrequency = template.pauseFrequency;
  } else {
    skipped.push('cinematic template pauseFrequency');
    inferred.push(`pauseFrequency ${fallbackCg.template.pauseFrequency}`);
  }

  let contrastBoost = fallbackCg.template.contrastBoost;
  if (typeof template.contrastBoost === 'number') {
    contrastBoost = template.contrastBoost;
  } else {
    skipped.push('cinematic template contrastBoost');
    inferred.push(`contrastBoost ${fallbackCg.template.contrastBoost}`);
  }

  let headroom = fallbackCg.template.headroom;
  if (typeof template.headroom === 'number') {
    headroom = template.headroom;
  } else {
    skipped.push('cinematic template headroom');
    inferred.push(`headroom ${fallbackCg.template.headroom}`);
  }

  return {
    tone,
    template: {
      cameraMode,
      spacingMultiplier,
      motionEnergyScale,
      pauseFrequency,
      contrastBoost,
      headroom
    }
  };
}

function sanitizeRhythm(rhythm: any, fallbackRhythm: SceneGraphResponse['rhythm'], skipped: string[], inferred: string[]): SceneGraphResponse['rhythm'] {
  if (typeof rhythm !== 'object' || rhythm === null) {
    skipped.push('rhythm configuration');
    inferred.push('default rhythm parameters');
    return fallbackRhythm;
  }

  let tempo = fallbackRhythm.tempo;
  if (typeof rhythm.tempo === 'string' && rhythm.tempo.trim()) {
    tempo = rhythm.tempo.trim();
  } else {
    skipped.push('rhythm tempo');
    inferred.push(`tempo '${fallbackRhythm.tempo}'`);
  }

  let pauseFrequencyPerMinute = fallbackRhythm.pauseFrequencyPerMinute;
  if (typeof rhythm.pauseFrequencyPerMinute === 'number' && rhythm.pauseFrequencyPerMinute >= 0) {
    pauseFrequencyPerMinute = rhythm.pauseFrequencyPerMinute;
  } else {
    skipped.push('rhythm pauseFrequencyPerMinute');
    inferred.push(`pauseFrequencyPerMinute ${fallbackRhythm.pauseFrequencyPerMinute}`);
  }

  let motionEnergyCurve = fallbackRhythm.motionEnergyCurve;
  if (typeof rhythm.motionEnergyCurve === 'string' && rhythm.motionEnergyCurve.trim()) {
    motionEnergyCurve = rhythm.motionEnergyCurve.trim();
  } else {
    skipped.push('rhythm motionEnergyCurve');
    inferred.push(`motionEnergyCurve '${fallbackRhythm.motionEnergyCurve}'`);
  }

  return { tempo, pauseFrequencyPerMinute, motionEnergyCurve };
}

export function normalizeSceneGraph(
  scene: SceneGraphResponse & { shotSequence?: SequencedShot[]; narrativeState?: NarrativeState },
  prompt: string,
  worldPlanOverride?: SceneGraphResponse['worldPlan']
): InterpretationResult & { shotSequence?: SequencedShot[]; narrativeState?: NarrativeState } {
  const fallback = createFallbackScene(prompt);
  const skipped: string[] = [];
  const inferred: string[] = [];

  const shotsInfo = (scene.shotSequence && scene.shotSequence.length > 0)
    ? { shotSequence: scene.shotSequence, narrativeState: scene.narrativeState }
    : (() => {
        skipped.push('shot sequence');
        inferred.push('generated shot sequence from actors and prompt');
        return generateShotSequence(prompt, (scene.actors || fallback.actors) as any);
      })();

  let inputActors = scene.actors;
  if (!Array.isArray(inputActors) || inputActors.length === 0) {
    skipped.push('actors array');
    inferred.push('default actors array');
    inputActors = fallback.actors;
  }

  const sanitizedActors = inputActors.map((actor, idx) => sanitizeActor(actor, idx, skipped, inferred));

  const environment = sanitizeEnvironment(scene.environment, fallback.environment, skipped, inferred);
  const camera = sanitizeCamera(scene.camera, fallback.camera, skipped, inferred);
  
  let sessionHistory = scene.sessionHistory;
  if (!Array.isArray(sessionHistory)) {
    skipped.push('session history');
    inferred.push('default session history');
    sessionHistory = fallback.sessionHistory;
  }

  const cinematicGrammar = sanitizeCinematicGrammar(scene.cinematicGrammar, fallback.cinematicGrammar, skipped, inferred);
  const atmosphere = sanitizeAtmosphere(scene.atmosphere, fallback.atmosphere, skipped, inferred);

  let relationships = scene.relationships;
  if (!Array.isArray(relationships)) {
    skipped.push('relationships array');
    inferred.push('empty relationships array');
    relationships = fallback.relationships;
  }

  const rhythm = sanitizeRhythm(scene.rhythm, fallback.rhythm, skipped, inferred);
  
  let explanation: string | undefined = undefined;
  if (skipped.length > 0 || inferred.length > 0) {
    explanation = `The intent could not be fully resolved. Skipped: ${skipped.join(', ')}. Inferred: ${inferred.join(', ')}.`;
  }

  return {
    id: typeof scene.id === 'string' ? scene.id : fallback.id,
    version: typeof scene.version === 'number' ? scene.version : fallback.version,
    actors: sanitizedActors,
    environment,
    camera,
    sessionHistory,
    cinematicGrammar,
    atmosphere,
    relationships,
    rhythm,
    worldPlan: worldPlanOverride ?? scene.worldPlan ?? fallback.worldPlan,
    shotSequence: shotsInfo.shotSequence,
    narrativeState: shotsInfo.narrativeState,
    explanation,
  };
}

export default router;
