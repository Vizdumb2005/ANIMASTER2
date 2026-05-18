import { Router } from 'express';
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

const router = Router();

router.post('/', async (request, response) => {
  const body = request.body as Partial<MutateRequestBody> | undefined;
  const prompt = typeof body?.prompt === 'string' ? body.prompt.trim() : '';

  if (!prompt) {
    response.status(400).json({ error: 'prompt is required' });
    return;
  }

  if (!body?.currentScene || typeof body.currentScene !== 'object') {
    response.status(400).json({ error: 'currentScene is required' });
    return;
  }

  try {
    const patch = await mutateScene(prompt, body.currentScene);
    response.json(patch);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to mutate scene';
    response.status(502).json({ error: message });
  }
});

async function mutateScene(prompt: string, currentScene: unknown): Promise<ScenePatch> {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? 'gpt-4o-mini';

  if (!apiKey) {
    return createFallbackPatch(prompt, currentScene as ScenePatch);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const result = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: sceneMutationSystemPrompt },
          { role: 'user', content: buildSceneMutationUserPrompt(prompt, JSON.stringify(currentScene, null, 2)) }
        ],
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'animaster_scene_patch',
            schema: sceneMutationResponseSchema,
            strict: true
          }
        },
        temperature: 0.2
      }),
      signal: controller.signal
    });

    if (!result.ok) {
      throw new Error(`OpenAI request failed with status ${result.status}`);
    }

    const payload = (await result.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;

    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('OpenAI response did not include patch JSON');
    }

    const parsed = JSON.parse(content) as ScenePatch;
    return normalizePatch(parsed, currentScene as ScenePatch);
  } finally {
    clearTimeout(timeout);
  }
}

function createFallbackPatch(prompt: string, currentScene: ScenePatch): ScenePatch {
  const scene: ScenePatch = {
    actors: Array.isArray(currentScene.actors) ? [...currentScene.actors] : [],
    environment: currentScene.environment ?? {
      type: 'indoor_room',
      backgroundColor: '#17151f',
      floorColor: '#2d221f',
      wallColor: '#211c29',
      width: 960,
      height: 540
    },
    camera: currentScene.camera ?? { x: 0, y: 0, zoom: 1, mode: 'static' },
    cinematicGrammar: currentScene.cinematicGrammar ?? {
      tone: 'neutral',
      template: { cameraMode: 'static', spacingMultiplier: 1.0, motionEnergyScale: 1.0, pauseFrequency: 4, contrastBoost: 0.0, headroom: 1.0 }
    },
    atmosphere: currentScene.atmosphere ?? { effects: ['none'], lightingTint: 'rgba(0,0,0,0)', ambientIntensity: 1.0 },
    relationships: currentScene.relationships ?? [],
    rhythm: currentScene.rhythm ?? { tempo: 'medium', pauseFrequencyPerMinute: 4, motionEnergyCurve: 'linear' },
    semanticOperations: []
  };

  if (/darker|dim/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'night', ambientIntensity: 0.55, reason: prompt });
    scene.environment = {
      ...scene.environment,
      backgroundColor: '#0d0b14',
      floorColor: '#1f1815',
      wallColor: '#17131d'
    };
  } else if (/warmer|warm/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'warm', reason: prompt });
    scene.environment = {
      ...scene.environment,
      backgroundColor: '#2d1d12',
      floorColor: '#3a2b1f',
      wallColor: '#2a1e15'
    };
  } else if (/brighter|bright|lighter/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'rgba(0,0,0,0)', ambientIntensity: 1.15, reason: prompt });
    scene.environment = {
      ...scene.environment,
      backgroundColor: '#2a2535',
      floorColor: '#3d3228',
      wallColor: '#302a38'
    };
  }

  if (/nervous|anxious/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'nervous' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'nervous', intensity: 1, reason: prompt });
  } else if (/sad|depressed/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'sad' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'sad', intensity: 1, reason: prompt });
  } else if (/happy|cheerful/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'happy' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'happy', intensity: 1, reason: prompt });
  } else if (/excited|thrilled/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'excited' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'excited', intensity: 1, reason: prompt });
  } else if (/angry|furious/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'angry' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'angry', intensity: 1, reason: prompt });
  } else if (/exhausted|tired/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'exhausted' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'exhausted', intensity: 1, reason: prompt });
  } else if (/awkward/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'awkward' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'awkward', intensity: 1, reason: prompt });
  } else if (/neutral|calm/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'neutral' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'neutral', intensity: 0, reason: prompt });
  }

  if (/lonely|more\s+lonely|lonelier/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'SetTone', tone: 'lonely', reason: prompt });
    scene.cinematicGrammar = {
      tone: 'lonely',
      template: { cameraMode: 'wide_shot', spacingMultiplier: 1.8, motionEnergyScale: 0.6, pauseFrequency: 8, contrastBoost: 0.2, headroom: 1.4 }
    };
    scene.camera = { ...scene.camera, mode: 'wide_shot' };
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
    scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 8, motionEnergyCurve: 'ease-out' };
  } else if (/tense|tenser|more\s+tense/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'SetTone', tone: 'tense', reason: prompt });
    scene.cinematicGrammar = {
      tone: 'tense',
      template: { cameraMode: 'close_up', spacingMultiplier: 0.7, motionEnergyScale: 1.2, pauseFrequency: 2, contrastBoost: 0.5, headroom: 0.7 }
    };
    scene.camera = { ...scene.camera, mode: 'close_up' };
    scene.rhythm = { tempo: 'medium', pauseFrequencyPerMinute: 2, motionEnergyCurve: 'sharp' };
  } else if (/romantic|love|intimate/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'SetTone', tone: 'romantic', reason: prompt });
    scene.cinematicGrammar = {
      tone: 'romantic',
      template: { cameraMode: 'close_up', spacingMultiplier: 0.5, motionEnergyScale: 0.7, pauseFrequency: 6, contrastBoost: 0.3, headroom: 0.8 }
    };
    scene.camera = { ...scene.camera, mode: 'close_up' };
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'warm' };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'warm', reason: prompt });
    scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 6, motionEnergyCurve: 'ease-out' };
  } else if (/energetic|fast|chaotic/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'SetTone', tone: 'energetic', reason: prompt });
    scene.cinematicGrammar = {
      tone: 'energetic',
      template: { cameraMode: 'follow', spacingMultiplier: 1.0, motionEnergyScale: 1.5, pauseFrequency: 1, contrastBoost: 0.4, headroom: 0.9 }
    };
    scene.camera = { ...scene.camera, mode: 'follow' };
    scene.rhythm = { tempo: 'fast', pauseFrequencyPerMinute: 1, motionEnergyCurve: 'sharp' };
  } else if (/threatening|danger|menacing/i.test(prompt)) {
    scene.semanticOperations?.push({ type: 'SetTone', tone: 'threatening', reason: prompt });
    scene.cinematicGrammar = {
      tone: 'threatening',
      template: { cameraMode: 'dramatic_zoom', spacingMultiplier: 0.6, motionEnergyScale: 0.8, pauseFrequency: 3, contrastBoost: 0.7, headroom: 0.6 }
    };
    scene.camera = { ...scene.camera, mode: 'dramatic_zoom' };
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
    scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 3, motionEnergyCurve: 'sharp' };
  }

  if (/rain/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('rain')) existingEffects.push('rain');
    scene.semanticOperations?.push({ type: 'AddAtmosphere', effect: 'rain', reason: prompt });
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
  }

  if (/add\s+fog|foggy/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('fog')) existingEffects.push('fog');
    scene.semanticOperations?.push({ type: 'AddAtmosphere', effect: 'fog', reason: prompt });
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
  }

  if (/add\s+flicker|flickering/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('flicker')) existingEffects.push('flicker');
    scene.semanticOperations?.push({ type: 'AddAtmosphere', effect: 'flicker', reason: prompt });
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
  }

  if (/cold|colder/i.test(prompt) && /light/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
  } else if (/warm|warmer/i.test(prompt) && /light/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'warm' };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'warm', reason: prompt });
  }

  if (/night|nighttime/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'night', ambientIntensity: 0.4 };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'night', ambientIntensity: 0.4, reason: prompt });
  }

  if (/park|garden/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'outdoor_park', backgroundColor: '#1a2e1a', floorColor: '#2d4a2d', wallColor: '#1f3a1f' };
  } else if (/street|road|alley/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'outdoor_street', backgroundColor: '#0a0e1a', floorColor: '#1a1a2a', wallColor: '#111828' };
  } else if (/beach|ocean|sea|shore/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'outdoor_beach', backgroundColor: '#1a3a5a', floorColor: '#c2a878', wallColor: '#2a4a6a' };
  } else if (/forest|woods|jungle/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'outdoor_forest', backgroundColor: '#0f1f0f', floorColor: '#1a3a1a', wallColor: '#0a2a0a' };
  } else if (/rooftop|roof/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'rooftop', backgroundColor: '#0a0e1a', floorColor: '#2a2530', wallColor: '#0f1420' };
  } else if (/hallway|corridor/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'hallway', backgroundColor: '#0f1218', floorColor: '#1a1620', wallColor: '#1a1822' };
  } else if (/subway|metro|underground|station/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'subway', backgroundColor: '#0a0c12', floorColor: '#2a2530', wallColor: '#16141e' };
  } else if (/hospital|clinic|ward/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'hospital', backgroundColor: '#1a1e24', floorColor: '#1e2228', wallColor: '#202830' };
  } else if (/apartment|flat|home/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'apartment', backgroundColor: '#17151f', floorColor: '#2d221f', wallColor: '#211c29' };
  } else if (/staircase|stairs|stairwell/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'staircase', backgroundColor: '#0f1218', floorColor: '#1a1620', wallColor: '#1a1822' };
  } else if (/outdoor|outside/i.test(prompt)) {
    scene.environment = { ...scene.environment, type: 'outdoor_park', backgroundColor: '#1a2e1a', floorColor: '#2d4a2d', wallColor: '#1f3a1f' };
  }

  // Phase 3: Camera direction via prompt
  if (/push\s+camera\s+closer|close\s*up|zoom\s+in|closer\s+shot/i.test(prompt)) {
    scene.camera = { ...scene.camera, zoom: Math.min((scene.camera.zoom ?? 1) + 0.2, 1.5), mode: 'close_up' };
    scene.semanticOperations?.push({ type: 'AdjustCamera', zoom: scene.camera.zoom, mode: 'close_up', reason: prompt });
  } else if (/pull\s+back|push\s+camera\s+farther|wide\s+shot|zoom\s+out|farther\s+away|pull\s+camera/i.test(prompt)) {
    scene.camera = { ...scene.camera, zoom: Math.max((scene.camera.zoom ?? 1) - 0.15, 0.6), mode: 'wide_shot' };
    scene.semanticOperations?.push({ type: 'AdjustCamera', zoom: scene.camera.zoom, mode: 'wide_shot', reason: prompt });
  } else if (/over\s+the\s+shoulder|over-the-shoulder|ots/i.test(prompt)) {
    scene.camera = { ...scene.camera, mode: 'over_the_shoulder' };
    scene.semanticOperations?.push({ type: 'AdjustCamera', mode: 'over_the_shoulder', reason: prompt });
  }

  // Phase 3: Pacing direction via prompt
  if (/slow\s+down|slower|more\s+contemplative|more\s+silence/i.test(prompt)) {
    scene.rhythm = { ...scene.rhythm!, tempo: 'slow', pauseFrequencyPerMinute: 8, motionEnergyCurve: 'ease-out' };
    scene.semanticOperations?.push({ type: 'AdjustPacing', tempo: 'slow', reason: prompt });
  } else if (/speed\s+up|faster|more\s+frantic|more\s+urgent/i.test(prompt)) {
    scene.rhythm = { ...scene.rhythm!, tempo: 'fast', pauseFrequencyPerMinute: 1, motionEnergyCurve: 'sharp' };
    scene.semanticOperations?.push({ type: 'AdjustPacing', tempo: 'fast', reason: prompt });
  }

  // Phase 3: Atmosphere direction via prompt
  if (/cold|colder|make\s+it\s+cold/i.test(prompt) && !/light/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
    scene.semanticOperations?.push({ type: 'AdjustLighting', tint: 'cold', reason: prompt });
  }
  if (/more\s+silent|more\s+silence|add\s+silence|silent/i.test(prompt)) {
    scene.rhythm = { ...scene.rhythm!, tempo: 'slow', pauseFrequencyPerMinute: 12, motionEnergyCurve: 'ease-out' };
    scene.semanticOperations?.push({ type: 'AdjustPacing', tempo: 'slow', reason: 'silence: ' + prompt });
  }
  if (/wind|windy/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('wind')) existingEffects.push('wind');
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
    scene.semanticOperations?.push({ type: 'AddAtmosphere', effect: 'wind', reason: prompt });
  }

  // Phase 3: Relationship direction via prompt
  if (/make\s+them\s+closer|closer\s+together|bring\s+them\s+together/i.test(prompt) && scene.actors.length >= 2) {
    const midX = (scene.actors[0].position.x + scene.actors[1].position.x) / 2;
    scene.actors[0] = { ...scene.actors[0], position: { ...scene.actors[0].position, x: midX - 60 } };
    scene.actors[1] = { ...scene.actors[1], position: { ...scene.actors[1].position, x: midX + 60 } };
    scene.semanticOperations?.push({ type: 'AdjustSpacing', direction: 'closer', reason: prompt });
  } else if (/add\s+more\s+distance|more\s+distant|push\s+them\s+apart|farther\s+apart/i.test(prompt) && scene.actors.length >= 2) {
    scene.actors[0] = { ...scene.actors[0], position: { ...scene.actors[0].position, x: Math.max(scene.actors[0].position.x - 80, 100) } };
    scene.actors[1] = { ...scene.actors[1], position: { ...scene.actors[1].position, x: Math.min(scene.actors[1].position.x + 80, 860) } };
    scene.semanticOperations?.push({ type: 'AdjustSpacing', direction: 'farther', reason: prompt });
  }

  // Phase 3: Emotional state direction ("make him more nervous", "make her emotionally distant")
  if (/make\s+(?:him|her|them)\s+(?:more\s+)?nervous|more\s+anxious/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'nervous' };
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'nervous', intensity: 1, reason: prompt });
  }
  if (/emotionally\s+distant|emotionally\s+trapped|feel\s+trapped/i.test(prompt)) {
    scene.cinematicGrammar = { ...scene.cinematicGrammar!, tone: 'lonely' };
    scene.camera = { ...scene.camera, zoom: Math.max((scene.camera.zoom ?? 1) - 0.1, 0.7) };
    scene.semanticOperations?.push({ type: 'SetTone', tone: 'lonely', reason: prompt });
  }

  // Phase 3: New scene / start over
  if (/new\s+scene|start\s+over|reset/i.test(prompt)) {
    scene.actors = [];
    scene.relationships = [];
    scene.semanticOperations?.push({ type: 'ResetScene', reason: prompt });
  }

  if (/stop|hesitate/i.test(prompt) && scene.actors.length > 1) {
    const approachingIdx = scene.actors.findIndex((a) => a.currentAction === 'approaching' || a.currentAction === 'walking');
    if (approachingIdx >= 0) {
      scene.actors[approachingIdx] = {
        ...scene.actors[approachingIdx],
        currentAction: 'idle',
        targetPosition: null,
        actionQueue: []
      };
      scene.semanticOperations?.push({
        type: 'QueueActorAction',
        actorId: scene.actors[approachingIdx].id,
        action: { id: `action_hesitate_${scene.actors[approachingIdx].id}`, type: 'hesitating', target: null, semanticReason: prompt, phase: 'queued', startedAt: 0, duration: 600, priority: 3, interruptible: true, status: 'queued' },
        reason: prompt
      });
    }
  }

  if (/argues?\s+with|confronts?|corners?/i.test(prompt) && scene.actors.length >= 2) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'angry' };
    scene.actors[1] = { ...scene.actors[1], emotionState: 'angry' };
    scene.relationships = scene.relationships ?? [];
    const relIdx = scene.relationships.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === scene.actors[0].id && r.actorBId === scene.actors[1].id);
    if (relIdx >= 0) {
      scene.relationships[relIdx] = { ...scene.relationships[relIdx], type: 'confronting' };
    } else {
      scene.relationships.push({ actorAId: scene.actors[0].id, actorBId: scene.actors[1].id, type: 'confronting', awarenessRadius: 200, gazeTarget: scene.actors[1].id, emotionalReaction: 'angry' });
    }
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'angry', intensity: 0.8, reason: prompt });
    scene.cinematicGrammar = { tone: 'threatening', template: { cameraMode: 'tension', spacingMultiplier: 0.6, motionEnergyScale: 0.8, pauseFrequency: 3, contrastBoost: 0.7, headroom: 0.6 } };
  } else if (/comforts?|consoles?/i.test(prompt) && scene.actors.length >= 2) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'sad' };
    scene.relationships = scene.relationships ?? [];
    const relIdx = scene.relationships.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === scene.actors[0].id && r.actorBId === scene.actors[1].id);
    if (relIdx >= 0) {
      scene.relationships[relIdx] = { ...scene.relationships[relIdx], type: 'approaching' };
    } else {
      scene.relationships.push({ actorAId: scene.actors[0].id, actorBId: scene.actors[1].id, type: 'approaching', awarenessRadius: 200, gazeTarget: scene.actors[1].id, emotionalReaction: 'sad' });
    }
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[0].id, emotion: 'sad', intensity: 0.6, reason: prompt });
    scene.cinematicGrammar = { tone: 'sad', template: { cameraMode: 'close_up', spacingMultiplier: 0.5, motionEnergyScale: 0.5, pauseFrequency: 8, contrastBoost: 0.2, headroom: 0.8 } };
  } else if (/avoids?|ignores?|turns?\s+away/i.test(prompt) && scene.actors.length >= 2) {
    scene.actors[1] = { ...scene.actors[1], emotionState: 'nervous' };
    scene.relationships = scene.relationships ?? [];
    const relIdx = scene.relationships.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === scene.actors[0].id && r.actorBId === scene.actors[1].id);
    if (relIdx >= 0) {
      scene.relationships[relIdx] = { ...scene.relationships[relIdx], type: 'avoiding' };
    } else {
      scene.relationships.push({ actorAId: scene.actors[0].id, actorBId: scene.actors[1].id, type: 'avoiding', awarenessRadius: 200, gazeTarget: null, emotionalReaction: 'nervous' });
    }
    scene.semanticOperations?.push({ type: 'SetActorEmotion', actorId: scene.actors[1].id, emotion: 'nervous', intensity: 0.6, reason: prompt });
  } else if (/talks?\s+to|speaks?\s+to|chats?\s+with|converses?\s+with/i.test(prompt) && scene.actors.length >= 2) {
    scene.relationships = scene.relationships ?? [];
    const relIdx = scene.relationships.findIndex((r: { actorAId: string; actorBId: string }) => r.actorAId === scene.actors[0].id && r.actorBId === scene.actors[1].id);
    if (relIdx >= 0) {
      scene.relationships[relIdx] = { ...scene.relationships[relIdx], type: 'conversing' };
    } else {
      scene.relationships.push({ actorAId: scene.actors[0].id, actorBId: scene.actors[1].id, type: 'conversing', awarenessRadius: 200, gazeTarget: scene.actors[1].id, emotionalReaction: null });
    }
  }

  if (/add\s+(another|a\s+new|a\s+second)\s+(character|stickman|actor|person)/i.test(prompt)) {
    const newId = `actor_${scene.actors.length + 1}`;
    const posX = 800;
    const posY = 360;
    scene.actors.push({
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
  }

  return scene;
}

function normalizePatch(patch: ScenePatch, currentScene: ScenePatch): ScenePatch {
  return {
    actors: Array.isArray(patch.actors) && patch.actors.length > 0
      ? patch.actors
      : (Array.isArray(currentScene.actors) ? currentScene.actors : []),
    environment: patch.environment ?? currentScene.environment,
    camera: patch.camera ?? currentScene.camera,
    cinematicGrammar: patch.cinematicGrammar ?? currentScene.cinematicGrammar,
    atmosphere: patch.atmosphere ?? currentScene.atmosphere,
    relationships: Array.isArray(patch.relationships) ? patch.relationships : currentScene.relationships,
    rhythm: patch.rhythm ?? currentScene.rhythm,
    semanticOperations: Array.isArray(patch.semanticOperations) ? patch.semanticOperations : []
  };
}

export default router;
