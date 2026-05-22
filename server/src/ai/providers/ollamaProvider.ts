// Phase 7 — Task Group 1 & 8: Ollama/Local Model Provider

import type {
  AIProvider,
  AIProviderConfig,
  AICompletionRequest,
  AICompletionResponse,
  CinematicPlanRequest,
  MutationPlanRequest,
  DialogueRequest,
  EnvironmentIntentRequest,
  CameraIntentRequest,
  BlockingIntentRequest,
  AIError
} from './providerInterface.js';
import { err, ok, Result } from '../../types/result.js';
import {
  buildScenePlanPrompt,
  buildMutationPlanPrompt,
  buildDialoguePrompt,
  buildEnvironmentPrompt,
  buildCameraPrompt,
  buildBlockingPrompt,
  buildMemorySummaryPrompt
} from '../prompts/agentPrompts.js';

export class OllamaProvider implements AIProvider {
  readonly name = 'ollama';
  private model = 'llama3.2';
  private baseUrl = 'http://localhost:11434';
  private maxTokens = 4096;
  private defaultTemperature = 0.2;
  private timeoutMs = 60_000;
  private _isAvailable = false;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(config: AIProviderConfig): Promise<Result<void, AIError>> {
    this.model = config.model ?? 'llama3.2';
    this.baseUrl = config.baseUrl ?? 'http://localhost:11434';
    this.maxTokens = config.maxTokens ?? 4096;
    this.defaultTemperature = config.temperature ?? 0.2;
    this.timeoutMs = config.timeoutMs ?? 60_000;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const result = await fetch(`${this.baseUrl}/api/tags`, { signal: controller.signal });
      clearTimeout(timeout);
      this._isAvailable = result.ok;
      return ok(undefined);
    } catch (error) {
      this._isAvailable = false;
      return err({ message: error instanceof Error ? error.message : 'Ollama server not reachable' });
    }
  }

  async complete(request: AICompletionRequest): Promise<Result<AICompletionResponse, AIError>> {
    if (!this._isAvailable) {
      return err({ message: 'Ollama provider not available — server not reachable' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const start = Date.now();

    try {
      const systemMsg = request.messages.find(m => m.role === 'system')?.content ?? '';
      const userMsgs = request.messages.filter(m => m.role !== 'system');
      const prompt = userMsgs.map(m => m.content).join('\n\n');

      const body: Record<string, unknown> = {
        model: this.model,
        system: systemMsg,
        prompt,
        stream: false,
        options: {
          temperature: request.temperature ?? this.defaultTemperature,
          num_predict: request.maxTokens ?? this.maxTokens
        }
      };

      if (request.responseFormat === 'json') {
        body.format = 'json';
      }

      const result = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!result.ok) {
        return err({ message: `Ollama request failed: ${result.status}` });
      }

      const payload = (await result.json()) as {
        response?: string;
        eval_count?: number;
        prompt_eval_count?: number;
      };

      return ok({
        content: payload.response ?? '',
        model: this.model,
        provider: this.name,
        tokensUsed: (payload.eval_count ?? 0) + (payload.prompt_eval_count ?? 0),
        latencyMs: Date.now() - start
      });
    } catch (error) {
      return err({ message: error instanceof Error ? error.message : 'Unknown error in Ollama provider' });
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateScenePlan(request: CinematicPlanRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildScenePlanPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateMutationPlan(request: MutationPlanRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildMutationPlanPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateDialogue(request: DialogueRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildDialoguePrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateEnvironmentIntent(request: EnvironmentIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildEnvironmentPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateBlockingIntent(request: BlockingIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildBlockingPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateCameraIntent(request: CameraIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildCameraPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async summarizeSceneMemory(sceneJson: string): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildMemorySummaryPrompt(sceneJson);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }
}
