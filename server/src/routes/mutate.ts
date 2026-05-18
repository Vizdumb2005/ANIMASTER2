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
    rhythm: currentScene.rhythm ?? { tempo: 'medium', pauseFrequencyPerMinute: 4, motionEnergyCurve: 'linear' }
  };

  if (/darker|dim/i.test(prompt)) {
    scene.environment = {
      ...scene.environment,
      backgroundColor: '#0d0b14',
      floorColor: '#1f1815',
      wallColor: '#17131d'
    };
  } else if (/warmer|warm/i.test(prompt)) {
    scene.environment = {
      ...scene.environment,
      backgroundColor: '#2d1d12',
      floorColor: '#3a2b1f',
      wallColor: '#2a1e15'
    };
  } else if (/brighter|bright|lighter/i.test(prompt)) {
    scene.environment = {
      ...scene.environment,
      backgroundColor: '#2a2535',
      floorColor: '#3d3228',
      wallColor: '#302a38'
    };
  }

  if (/nervous|anxious/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'nervous' };
  } else if (/sad|depressed/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'sad' };
  } else if (/happy|cheerful/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'happy' };
  } else if (/excited|thrilled/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'excited' };
  } else if (/angry|furious/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'angry' };
  } else if (/exhausted|tired/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'exhausted' };
  } else if (/awkward/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'awkward' };
  } else if (/neutral|calm/i.test(prompt) && scene.actors.length > 0) {
    scene.actors[0] = { ...scene.actors[0], emotionState: 'neutral' };
  }

  if (/lonely|more\s+lonely|lonelier/i.test(prompt)) {
    scene.cinematicGrammar = {
      tone: 'lonely',
      template: { cameraMode: 'wide_shot', spacingMultiplier: 1.8, motionEnergyScale: 0.6, pauseFrequency: 8, contrastBoost: 0.2, headroom: 1.4 }
    };
    scene.camera = { ...scene.camera, mode: 'wide_shot' };
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
    scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 8, motionEnergyCurve: 'ease-out' };
  } else if (/tense|tenser|more\s+tense/i.test(prompt)) {
    scene.cinematicGrammar = {
      tone: 'tense',
      template: { cameraMode: 'close_up', spacingMultiplier: 0.7, motionEnergyScale: 1.2, pauseFrequency: 2, contrastBoost: 0.5, headroom: 0.7 }
    };
    scene.camera = { ...scene.camera, mode: 'close_up' };
    scene.rhythm = { tempo: 'medium', pauseFrequencyPerMinute: 2, motionEnergyCurve: 'sharp' };
  } else if (/romantic|love|intimate/i.test(prompt)) {
    scene.cinematicGrammar = {
      tone: 'romantic',
      template: { cameraMode: 'close_up', spacingMultiplier: 0.5, motionEnergyScale: 0.7, pauseFrequency: 6, contrastBoost: 0.3, headroom: 0.8 }
    };
    scene.camera = { ...scene.camera, mode: 'close_up' };
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'warm' };
    scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 6, motionEnergyCurve: 'ease-out' };
  } else if (/energetic|fast|chaotic/i.test(prompt)) {
    scene.cinematicGrammar = {
      tone: 'energetic',
      template: { cameraMode: 'follow', spacingMultiplier: 1.0, motionEnergyScale: 1.5, pauseFrequency: 1, contrastBoost: 0.4, headroom: 0.9 }
    };
    scene.camera = { ...scene.camera, mode: 'follow' };
    scene.rhythm = { tempo: 'fast', pauseFrequencyPerMinute: 1, motionEnergyCurve: 'sharp' };
  } else if (/threatening|danger|menacing/i.test(prompt)) {
    scene.cinematicGrammar = {
      tone: 'threatening',
      template: { cameraMode: 'dramatic_zoom', spacingMultiplier: 0.6, motionEnergyScale: 0.8, pauseFrequency: 3, contrastBoost: 0.7, headroom: 0.6 }
    };
    scene.camera = { ...scene.camera, mode: 'dramatic_zoom' };
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
    scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: 3, motionEnergyCurve: 'sharp' };
  }

  if (/add\s+rain|raining|rainy/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('rain')) existingEffects.push('rain');
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
  }

  if (/add\s+fog|foggy/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('fog')) existingEffects.push('fog');
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
  }

  if (/add\s+flicker|flickering/i.test(prompt)) {
    const existingEffects = scene.atmosphere?.effects?.filter((e: string) => e !== 'none') ?? [];
    if (!existingEffects.includes('flicker')) existingEffects.push('flicker');
    scene.atmosphere = { ...scene.atmosphere!, effects: existingEffects };
  }

  if (/cold|colder/i.test(prompt) && /light/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'cold' };
  } else if (/warm|warmer/i.test(prompt) && /light/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'warm' };
  }

  if (/night|nighttime/i.test(prompt)) {
    scene.atmosphere = { ...scene.atmosphere!, lightingTint: 'night', ambientIntensity: 0.4 };
  }

  if (/park|garden|forest|outdoor|outside/i.test(prompt)) {
    scene.environment = {
      ...scene.environment,
      type: 'outdoor_park',
      backgroundColor: '#1a2e1a',
      floorColor: '#2d4a2d',
      wallColor: '#1f3a1f'
    };
  } else if (/street|road|alley/i.test(prompt)) {
    scene.environment = {
      ...scene.environment,
      type: 'outdoor_street',
      backgroundColor: '#0a0e1a',
      floorColor: '#1a1a2a',
      wallColor: '#111828'
    };
  } else if (/beach|ocean|sea/i.test(prompt)) {
    scene.environment = {
      ...scene.environment,
      type: 'outdoor_beach',
      backgroundColor: '#1a3a5a',
      floorColor: '#c2a878',
      wallColor: '#2a4a6a'
    };
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
    rhythm: patch.rhythm ?? currentScene.rhythm
  };
}

export default router;
