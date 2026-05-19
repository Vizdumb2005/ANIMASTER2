// Phase 8 — Task Group 2/14: Live Mutation API Route

import { Router } from 'express';
import { processLiveMutation, type LiveMutationRequest } from '../ai/liveMutation/liveMutationProcessor.js';
import { cinematicMemory } from '../memory/cinematicMemory.js';

const router = Router();

router.post('/', (request, response) => {
  const body = request.body as Partial<LiveMutationRequest> | undefined;
  const command = typeof body?.command === 'string' ? body.command.trim() : '';

  if (!command) {
    response.status(400).json({ error: 'command is required' });
    return;
  }

  try {
    const result = processLiveMutation({
      command,
      currentTone: typeof body?.currentTone === 'string' ? body.currentTone : 'neutral',
      currentEnvironment: typeof body?.currentEnvironment === 'string' ? body.currentEnvironment : 'indoor_room',
      actorCount: typeof body?.actorCount === 'number' ? body.actorCount : 0,
      currentEffects: Array.isArray(body?.currentEffects) ? body.currentEffects : [],
    });

    // Record to cinematic memory
    cinematicMemory.incrementSceneCount();
    if (result.mutations.length > 0) {
      for (const mutation of result.mutations) {
        if (mutation.type === 'tone') {
          cinematicMemory.recordEmotionalMoment(mutation.value, 0.7, Date.now());
        }
      }
    }

    response.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Live mutation failed';
    response.status(500).json({ error: message });
  }
});

router.get('/memory', (_request, response) => {
  response.json(cinematicMemory.getState());
});

export default router;
