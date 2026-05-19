// Phase 7 — Task Group 10: AI Debug & Reasoning Visualization Routes
// Task Group 14: Architecture Cleanup — central AI orchestration routes

import { Router } from 'express';
import { providerRegistry } from '../ai/providers/providerRegistry.js';
import { orchestrator } from '../ai/runtime/orchestrator.js';
import { compileIntent, intentToSemanticControls } from '../ai/compiler/intentCompiler.js';
import { planCinematography } from '../ai/agents/cinematographerAgent.js';
import { planEnvironment } from '../ai/agents/environmentAgent.js';
import { planEmotionalArc } from '../ai/agents/emotionalArcAgent.js';
import { planBlocking } from '../ai/agents/blockingAgent.js';
import { planDialogue } from '../ai/agents/dialogueAgent.js';
import { planLighting } from '../ai/agents/lightingAgent.js';
import { buildSemanticGraphPlan } from '../ai/sceneGraph/sceneGraphIntelligence.js';
import { sceneMemory } from '../memory/sceneMemory.js';
import { runPromptTests, getTestCaseCount } from '../ai/testing/promptTestSuite.js';
import { getAllDemoExperiences, getDemoExperience } from '../ai/demos/demoExperiences.js';

const router = Router();

// GET /ai/status — Provider status and orchestrator health
router.get('/status', async (_req, res) => {
  try {
    const status = orchestrator.getStatus();
    const availableProviders = providerRegistry.getAvailableProviders();

    // Check each provider's availability
    const providerChecks: Record<string, boolean> = {};
    for (const name of availableProviders) {
      const provider = providerRegistry.getProvider(name);
      if (provider) {
        providerChecks[name] = provider.isAvailable;
      }
    }

    res.json({
      orchestrator: {
        memoryEntries: status.memoryEntries,
        config: status.config
      },
      providers: status.providers,
      providerAvailability: providerChecks,
      registeredProviders: availableProviders
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// POST /ai/debug/intent — Debug intent compilation for a prompt
router.post('/debug/intent', (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  const intent = compileIntent(prompt);
  const semanticControls = intentToSemanticControls(intent);
  const actorCount = /two|2|both|couple|pair/i.test(prompt) ? 2
    : /three|3|group/i.test(prompt) ? 3
    : 1;

  const cinematography = planCinematography(intent, actorCount);
  const environment = planEnvironment(intent, prompt);
  const emotionalArc = planEmotionalArc(intent, actorCount);
  const blocking = planBlocking(intent, actorCount);
  const dialogue = planDialogue(intent, actorCount);
  const lighting = planLighting(intent);
  const graphPlan = buildSemanticGraphPlan(prompt, intent);

  res.json({
    prompt,
    intent,
    semanticControls,
    agentReports: {
      cinematography,
      environment,
      emotionalArc,
      blocking,
      dialogue,
      lighting
    },
    sceneGraphPlan: graphPlan
  });
});

// POST /ai/debug/reasoning — Full orchestration reasoning trace
router.post('/debug/reasoning', async (req, res) => {
  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  try {
    const result = await orchestrator.orchestrateSceneGeneration(prompt);
    res.json({
      prompt,
      reasoning: result.reasoning,
      providerUsed: result.providerUsed,
      fallbackUsed: result.fallbackUsed,
      intent: result.intent,
      agentReports: result.agentReports,
      scenePlan: result.scenePlan
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    res.status(500).json({ error: msg });
  }
});

// GET /ai/memory — Current memory state
router.get('/memory', (_req, res) => {
  res.json({
    entries: sceneMemory.getEntries(),
    emotionalState: sceneMemory.getEmotionalState(),
    continuityState: sceneMemory.getContinuityState(),
    recentHistory: sceneMemory.getRecentHistory(5)
  });
});

// DELETE /ai/memory — Clear memory
router.delete('/memory', (_req, res) => {
  sceneMemory.clear();
  res.json({ cleared: true });
});

// POST /ai/tests — Run prompt test suite
router.post('/tests', (_req, res) => {
  const results = runPromptTests();
  const passed = results.filter(r => r.passed).length;
  const total = getTestCaseCount();

  res.json({
    summary: `${passed}/${total} tests passed`,
    passed,
    total,
    results
  });
});

// GET /ai/demos — List all demo experiences
router.get('/demos', (_req, res) => {
  res.json(getAllDemoExperiences());
});

// GET /ai/demos/:id — Get specific demo experience
router.get('/demos/:id', (req, res) => {
  const demo = getDemoExperience(req.params.id);
  if (!demo) {
    res.status(404).json({ error: 'Demo not found' });
    return;
  }
  res.json(demo);
});

export default router;
