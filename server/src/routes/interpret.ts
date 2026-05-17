import { Router } from 'express';
import {
  buildSceneGenerationUserPrompt,
  sceneGenerationResponseSchema,
  sceneGenerationSystemPrompt
} from '../prompts/sceneGenerationPrompt.js';

type SceneGraphResponse = {
  id: string;
  version: number;
  actors: Array<{
    id: string;
    label: string;
    type: 'humanoid';
    position: { x: number; y: number };
    targetPosition: { x: number; y: number } | null;
    emotionState: 'neutral' | 'sad' | 'happy' | 'nervous';
    currentAction: 'idle' | 'walking' | 'sitting';
    actionQueue: Array<'idle' | 'walking' | 'sitting'>;
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
  camera: { x: number; y: number; zoom: number; mode: 'static' | 'follow' };
  sessionHistory: Array<{ id: string; prompt: string; createdAt: number }>;
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

  const result = await fetch('https://api.openai.com/v1/chat/completions', {
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
    })
  });

  if (!result.ok) {
    throw new Error(`OpenAI request failed with status ${result.status}`);
  }

  const payload = (await result.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = payload.choices?.[0]?.message?.content;

  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('OpenAI response did not include scene JSON');
  }

  const parsed = JSON.parse(content) as SceneGraphResponse;
  return normalizeSceneGraph(parsed, prompt);
}

function createFallbackScene(prompt: string): SceneGraphResponse {
  const isSad = /sad|dark|lonely/i.test(prompt);
  const isNervous = /nervous|anxious|tense/i.test(prompt);
  const isHappy = /happy|warm|bright/i.test(prompt);
  const isSit = /sit/i.test(prompt);
  const isWalk = /walk|enter/i.test(prompt) || !isSit;

  const emotionState = isNervous ? 'nervous' : isHappy ? 'happy' : isSad ? 'sad' : 'neutral';
  const currentAction = isWalk ? 'walking' : isSit ? 'sitting' : 'idle';
  const actionQueue = isWalk && isSit ? ['sitting'] as const : ['idle'] as const;
  const roomColor = isSad ? '#17151f' : isHappy ? '#2d1d12' : '#1b1f24';

  return {
    id: 'scene_001',
    version: 1,
    actors: [
      {
        id: 'actor_stickman',
        label: 'Stickman',
        type: 'humanoid',
        position: { x: 400, y: 360 },
        targetPosition: { x: 660, y: 360 },
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
    ],
    environment: {
      type: 'indoor_room',
      backgroundColor: roomColor,
      floorColor: isSad ? '#2d221f' : '#3a2b1f',
      wallColor: isSad ? '#211c29' : '#2a2228',
      width: 960,
      height: 540
    },
    camera: {
      x: 0,
      y: 0,
      zoom: 1,
      mode: 'static'
    },
    sessionHistory: [
      {
        id: 'session_entry_1',
        prompt,
        createdAt: Date.now()
      }
    ]
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
    sessionHistory: Array.isArray(scene.sessionHistory) ? scene.sessionHistory : fallback.sessionHistory
  };
}

export default router;
