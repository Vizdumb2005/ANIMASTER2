import { Router } from 'express';
import {
  buildSceneGenerationUserPrompt,
  sceneGenerationResponseSchema,
  sceneGenerationSystemPrompt
} from '../prompts/sceneGenerationPrompt.js';
import { planScene } from '../planning/scenePlanner.js';

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

const router = Router();

router.post('/', async (request, response) => {
  const prompt = typeof request.body?.prompt === 'string' ? request.body.prompt.trim() : '';

  if (!prompt) {
    response.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const scene = await interpretPrompt(prompt);
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

async function interpretPrompt(prompt: string): Promise<SceneGraphResponse> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  if (!apiKey) {
    return createFallbackScene(prompt);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  let result: Response;
  try {
    result = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: sceneGenerationSystemPrompt },
        { role: 'user', content: buildSceneGenerationUserPrompt(prompt) }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'animaster_scene_graph',
          schema: sceneGenerationResponseSchema,
          strict: true
        }
      },
      temperature: 0.2
    }),
    signal: controller.signal
  });
  } finally {
    clearTimeout(timeout);
  }

  if (!result.ok) {
    throw new Error(`OpenAI request failed with status ${result.status}`);
  }

  let payload: { choices?: Array<{ message?: { content?: string } }> };
  try {
    payload = (await result.json()) as typeof payload;
  } catch {
    console.error('Failed to parse OpenAI JSON response, using fallback');
    return createFallbackScene(prompt);
  }

  const content = payload.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    console.error('OpenAI response did not include content, using fallback');
    return createFallbackScene(prompt);
  }

  let parsed: SceneGraphResponse;
  try {
    parsed = JSON.parse(content) as SceneGraphResponse;
  } catch {
    console.error('Malformed JSON from OpenAI, using fallback');
    return createFallbackScene(prompt);
  }

  return normalizeSceneGraph(parsed, prompt);
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
  };
}

function normalizeSceneGraph(scene: SceneGraphResponse, prompt: string): SceneGraphResponse {
  const fallback = createFallbackScene(prompt);

  return {
    id: typeof scene.id === 'string' ? scene.id : fallback.id,
    version: typeof scene.version === 'number' ? scene.version : fallback.version,
    actors: Array.isArray(scene.actors) && scene.actors.length > 0 ? scene.actors : fallback.actors,
    environment: scene.environment ?? fallback.environment,
    camera: scene.camera ?? fallback.camera,
    sessionHistory: Array.isArray(scene.sessionHistory) ? scene.sessionHistory : fallback.sessionHistory,
    cinematicGrammar: scene.cinematicGrammar ?? fallback.cinematicGrammar,
    atmosphere: scene.atmosphere ?? fallback.atmosphere,
    relationships: Array.isArray(scene.relationships) ? scene.relationships : fallback.relationships,
    rhythm: scene.rhythm ?? fallback.rhythm,
    worldPlan: scene.worldPlan ?? fallback.worldPlan,
  };
}

export default router;
