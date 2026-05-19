// Phase 7 — Task Group 2: AI Orchestration Runtime
// Central orchestration: task routing, provider selection, fallback, context assembly, memory injection

import { providerRegistry } from '../providers/providerRegistry.js';
import type { ProviderName, TaskComplexity } from '../providers/providerInterface.js';
import { compileIntent, type CinematicIntent } from '../compiler/intentCompiler.js';
import { planCinematography } from '../agents/cinematographerAgent.js';
import { planEnvironment } from '../agents/environmentAgent.js';
import { planEmotionalArc } from '../agents/emotionalArcAgent.js';
import { planBlocking } from '../agents/blockingAgent.js';
import { planDialogue } from '../agents/dialogueAgent.js';
import { planLighting } from '../agents/lightingAgent.js';
import { checkContinuity } from '../agents/continuityAgent.js';
import { assembleContext, type SemanticContext } from '../context/contextAssembler.js';
import { compressContext } from '../context/contextCompression.js';
import { sceneMemory } from '../../memory/sceneMemory.js';
import { buildScenePlanPrompt, buildMutationPlanPrompt } from '../prompts/agentPrompts.js';

export interface OrchestratorConfig {
  preferredProvider?: ProviderName;
  maxRetries: number;
  enableMemory: boolean;
  enableCompression: boolean;
  compressionMaxTokens: number;
}

export interface OrchestrationResult {
  scenePlan: Record<string, unknown>;
  agentReports: {
    cinematography: ReturnType<typeof planCinematography>;
    environment: ReturnType<typeof planEnvironment>;
    emotionalArc: ReturnType<typeof planEmotionalArc>;
    blocking: ReturnType<typeof planBlocking>;
    dialogue: ReturnType<typeof planDialogue>;
    lighting: ReturnType<typeof planLighting>;
  };
  intent: CinematicIntent;
  context: SemanticContext | null;
  providerUsed: string;
  fallbackUsed: boolean;
  reasoning: string[];
}

export interface MutationOrchestrationResult {
  mutationPlan: Record<string, unknown>;
  continuityCheck: ReturnType<typeof checkContinuity>;
  intent: CinematicIntent;
  context: SemanticContext | null;
  providerUsed: string;
  fallbackUsed: boolean;
  reasoning: string[];
}

const DEFAULT_CONFIG: OrchestratorConfig = {
  maxRetries: 2,
  enableMemory: true,
  enableCompression: true,
  compressionMaxTokens: 500
};

export class AIOrchestrator {
  private config: OrchestratorConfig;

  constructor(config: Partial<OrchestratorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  async orchestrateSceneGeneration(prompt: string): Promise<OrchestrationResult> {
    const reasoning: string[] = [];
    const intent = compileIntent(prompt);
    reasoning.push(`Intent compiled: pressure=${intent.emotionalPressure.toFixed(2)}, tension=${intent.tensionLevel.toFixed(2)}`);

    // Determine complexity
    const complexity = this.assessComplexity(intent, prompt);
    reasoning.push(`Task complexity: ${complexity}`);

    // Run all agents in parallel (deterministic, no LLM needed)
    const actorCount = this.estimateActorCount(prompt);
    const cinematography = planCinematography(intent, actorCount);
    const environment = planEnvironment(intent, prompt);
    const emotionalArc = planEmotionalArc(intent, actorCount);
    const blocking = planBlocking(intent, actorCount);
    const dialogue = planDialogue(intent, actorCount);
    const lighting = planLighting(intent);

    reasoning.push(`Agents: cinematography(${cinematography.framing}), environment(${environment.locationType}), lighting(${lighting.lightingLanguage})`);

    // Attempt LLM-based scene planning with fallback
    let scenePlan: Record<string, unknown>;
    let providerUsed = 'mock';
    let fallbackUsed = false;

    try {
      const result = await this.generateScenePlanWithFallback(prompt, intent, complexity, reasoning);
      scenePlan = result.plan;
      providerUsed = result.provider;
      fallbackUsed = result.fallback;
    } catch {
      // Ultimate fallback: use agent reports to build plan
      scenePlan = this.buildPlanFromAgents(prompt, environment, cinematography, lighting, blocking, actorCount);
      providerUsed = 'agent-fallback';
      fallbackUsed = true;
      reasoning.push('All providers failed — built plan from agent reports');
    }

    // Record to memory
    if (this.config.enableMemory) {
      sceneMemory.recordScene({
        id: `scene-${Date.now()}`,
        prompt,
        timestamp: Date.now(),
        tone: (scenePlan['tone'] as string) ?? 'neutral',
        environment: environment.locationType,
        actorCount,
        emotionalPeak: intent.emotionalPressure,
        effects: [],
        keyMoments: []
      });
      reasoning.push('Scene recorded to memory');
    }

    return {
      scenePlan,
      agentReports: { cinematography, environment, emotionalArc, blocking, dialogue, lighting },
      intent,
      context: null,
      providerUsed,
      fallbackUsed,
      reasoning
    };
  }

  async orchestrateMutation(
    prompt: string,
    currentScene: {
      tone: string;
      environment: { type: string; density?: string; mood?: string };
      actors: Array<{ id: string; emotionState: string; position: { x: number; y: number }; currentAction: string }>;
      camera?: { mode: string };
      atmosphere?: { effects: string[]; lightingTint: string };
      cinematicGrammar?: { pacing?: string };
    }
  ): Promise<MutationOrchestrationResult> {
    const reasoning: string[] = [];
    const intent = compileIntent(prompt);
    reasoning.push(`Mutation intent: pressure=${intent.emotionalPressure.toFixed(2)}, tension=${intent.tensionLevel.toFixed(2)}`);

    // Assemble and compress context
    let context: SemanticContext | null = null;
    if (this.config.enableMemory) {
      context = assembleContext(currentScene);
      if (this.config.enableCompression) {
        const compressed = compressContext(context, this.config.compressionMaxTokens);
        reasoning.push(`Context compressed: ${compressed.tokenEstimate} tokens (ratio ${compressed.compressionRatio.toFixed(1)}x)`);
      }
    }

    // Continuity check
    const previousEntries = sceneMemory.getRecentHistory(1);
    const previousScene = previousEntries.length > 0 ? {
      actors: currentScene.actors.map(a => ({
        id: a.id,
        position: a.position,
        emotionState: a.emotionState,
        currentAction: a.currentAction
      })),
      environment: currentScene.environment,
      tone: currentScene.tone,
      effects: currentScene.atmosphere?.effects ?? []
    } : null;

    const continuityCheck = checkContinuity(previousScene, {
      actors: currentScene.actors.map(a => ({
        id: a.id,
        position: a.position,
        emotionState: a.emotionState,
        currentAction: a.currentAction
      })),
      environment: currentScene.environment,
      tone: currentScene.tone,
      effects: currentScene.atmosphere?.effects ?? []
    }, prompt);

    if (continuityCheck.violations.length > 0) {
      reasoning.push(`Continuity: ${continuityCheck.violations.length} violation(s)`);
    }

    // Attempt LLM-based mutation planning
    const complexity = this.assessComplexity(intent, prompt);
    let mutationPlan: Record<string, unknown>;
    let providerUsed = 'mock';
    let fallbackUsed = false;

    try {
      const result = await this.generateMutationPlanWithFallback(prompt, intent, complexity, context, reasoning);
      mutationPlan = result.plan;
      providerUsed = result.provider;
      fallbackUsed = result.fallback;
    } catch {
      mutationPlan = this.buildMutationFromIntent(prompt, intent);
      providerUsed = 'intent-fallback';
      fallbackUsed = true;
      reasoning.push('All providers failed — built mutation from intent');
    }

    // Record to memory
    if (this.config.enableMemory) {
      sceneMemory.recordScene({
        id: `mutation-${Date.now()}`,
        prompt,
        timestamp: Date.now(),
        tone: (mutationPlan['toneChange'] as string) ?? currentScene.tone,
        environment: currentScene.environment.type,
        actorCount: currentScene.actors.length,
        emotionalPeak: intent.emotionalPressure,
        effects: currentScene.atmosphere?.effects ?? [],
        keyMoments: [`mutation: ${prompt.slice(0, 50)}`]
      });
    }

    return {
      mutationPlan,
      continuityCheck,
      intent,
      context,
      providerUsed,
      fallbackUsed,
      reasoning
    };
  }

  private async generateScenePlanWithFallback(
    prompt: string,
    intent: CinematicIntent,
    complexity: TaskComplexity,
    reasoning: string[]
  ): Promise<{ plan: Record<string, unknown>; provider: string; fallback: boolean }> {
    // Try preferred provider first
    const providers = this.getProviderOrder(complexity);

    for (const providerName of providers) {
      const provider = providerRegistry.getProvider(providerName);
      if (!provider) continue;

      if (!provider.isAvailable) {
        reasoning.push(`${providerName}: not available`);
        continue;
      }

      try {
        reasoning.push(`Trying ${providerName}...`);
        const { system, user } = buildScenePlanPrompt({ prompt, actorCount: this.estimateActorCount(prompt) });
        const response = await provider.complete({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user }
          ],
          temperature: 0.7,
          maxTokens: 2000,
          responseFormat: 'json'
        });

        const plan = JSON.parse(response.content) as Record<string, unknown>;
        reasoning.push(`${providerName}: success (${response.tokensUsed ?? 0} tokens)`);
        return { plan, provider: providerName, fallback: providerName === 'mock' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        reasoning.push(`${providerName}: failed (${msg})`);
      }
    }

    throw new Error('All providers exhausted');
  }

  private async generateMutationPlanWithFallback(
    prompt: string,
    intent: CinematicIntent,
    complexity: TaskComplexity,
    context: SemanticContext | null,
    reasoning: string[]
  ): Promise<{ plan: Record<string, unknown>; provider: string; fallback: boolean }> {
    const providers = this.getProviderOrder(complexity);

    let contextSuffix = '';
    if (context && this.config.enableCompression) {
      const compressed = compressContext(context, this.config.compressionMaxTokens);
      contextSuffix = `\n\nCurrent scene context:\n${compressed.summary}`;
    }

    for (const providerName of providers) {
      const provider = providerRegistry.getProvider(providerName);
      if (!provider) continue;

      if (!provider.isAvailable) continue;

      try {
        const { system, user } = buildMutationPlanPrompt({ prompt, currentSceneJson: '{}' });
        const response = await provider.complete({
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user + contextSuffix }
          ],
          temperature: 0.7,
          maxTokens: 1500,
          responseFormat: 'json'
        });

        const plan = JSON.parse(response.content) as Record<string, unknown>;
        reasoning.push(`${providerName}: mutation success`);
        return { plan, provider: providerName, fallback: providerName === 'mock' };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        reasoning.push(`${providerName}: mutation failed (${msg})`);
      }
    }

    throw new Error('All providers exhausted for mutation');
  }

  private getProviderOrder(complexity: TaskComplexity): ProviderName[] {
    if (this.config.preferredProvider) {
      const rest: ProviderName[] = ['openai', 'anthropic', 'gemini', 'ollama', 'mock']
        .filter(p => p !== this.config.preferredProvider) as ProviderName[];
      return [this.config.preferredProvider, ...rest];
    }

    // Route by complexity
    if (complexity === 'complex') {
      return ['openai', 'anthropic', 'gemini', 'ollama', 'mock'];
    }
    if (complexity === 'moderate') {
      return ['gemini', 'openai', 'ollama', 'anthropic', 'mock'];
    }
    // Low complexity: prefer local/cheap
    return ['ollama', 'gemini', 'mock', 'openai', 'anthropic'];
  }

  private assessComplexity(intent: CinematicIntent, prompt: string): TaskComplexity {
    const maxIntensity = Math.max(
      intent.emotionalPressure,
      intent.tensionLevel,
      intent.threatLevel,
      intent.intimacyLevel
    );

    const wordCount = prompt.split(/\s+/).length;

    if (maxIntensity > 0.7 || wordCount > 30) return 'complex';
    if (maxIntensity > 0.4 || wordCount > 15) return 'moderate';
    return 'simple';
  }

  private estimateActorCount(prompt: string): number {
    if (/two|2|both|couple|pair/i.test(prompt)) return 2;
    if (/three|3|group|trio/i.test(prompt)) return 3;
    if (/crowd|many|several/i.test(prompt)) return 5;
    if (/alone|single|one|solitary|lonely/i.test(prompt)) return 1;
    if (/argues?\s+with|confronts?|comforts?|avoids?|talks?\s+to/i.test(prompt)) return 2;
    return 1;
  }

  private buildPlanFromAgents(
    prompt: string,
    env: ReturnType<typeof planEnvironment>,
    cam: ReturnType<typeof planCinematography>,
    light: ReturnType<typeof planLighting>,
    block: ReturnType<typeof planBlocking>,
    actorCount: number
  ): Record<string, unknown> {
    return {
      locationType: env.locationType,
      timeOfDay: 'night',
      tone: 'neutral',
      weather: 'clear',
      actorCount,
      emotionalPressure: 0.5,
      compositionStyle: env.compositionBias,
      lightingLanguage: light.lightingLanguage,
      cameraLanguage: cam.cameraMode,
      blockingStyle: block.style,
      visualIsolation: 0.5,
      dialogueEnergy: 0.5,
      keyProps: [],
      reasoning: `Agent-assembled plan: ${env.reasoning}; ${cam.reasoning}; ${light.reasoning}`
    };
  }

  private buildMutationFromIntent(prompt: string, intent: CinematicIntent): Record<string, unknown> {
    return {
      emotionalShift: intent.emotionalPressure > 0.5 ? 'intensify' : 'soften',
      toneChange: intent.tensionLevel > 0.5 ? 'tense' : null,
      compositionChange: intent.compositionStyle !== 'balanced' ? intent.compositionStyle : null,
      lightingChange: intent.lightingLanguage !== 'natural' ? intent.lightingLanguage : null,
      pacingChange: intent.pacingStyle !== 'measured' ? intent.pacingStyle : null,
      cameraChange: intent.cameraAggression > 0.5 ? 'push_in' : null,
      environmentChange: null,
      actorChanges: [],
      atmosphereChanges: [],
      reasoning: `Intent-based mutation: pressure=${intent.emotionalPressure.toFixed(2)}, tension=${intent.tensionLevel.toFixed(2)}`
    };
  }

  getStatus(): {
    providers: ReturnType<typeof providerRegistry.getStatus>;
    memoryEntries: number;
    config: OrchestratorConfig;
  } {
    return {
      providers: providerRegistry.getStatus(),
      memoryEntries: sceneMemory.getEntries().length,
      config: this.config
    };
  }
}

export const orchestrator = new AIOrchestrator();
