// Phase 7 — Task Group 1: OpenAI Provider

import { err, ok, Result } from '../../types/result.js';
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
import {
  buildScenePlanPrompt,
  buildMutationPlanPrompt,
  buildDialoguePrompt,
  buildEnvironmentPrompt,
  buildCameraPrompt,
  buildBlockingPrompt,
  buildMemorySummaryPrompt
} from '../prompts/agentPrompts.js';

export class OpenAIProvider implements AIProvider {
  readonly name = 'openai';
  private apiKey = '';
  private model = 'gpt-4o-mini';
  private baseUrl = 'https://api.openai.com/v1';
  private maxTokens = 4096;
  private defaultTemperature = 0.2;
  private timeoutMs = 30_000;
  private _isAvailable = false;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(config: AIProviderConfig): Promise<Result<void, AIError>> {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'gpt-4o-mini';
    this.baseUrl = config.baseUrl ?? 'https://api.openai.com/v1';
    this.maxTokens = config.maxTokens ?? 4096;
    this.defaultTemperature = config.temperature ?? 0.2;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this._isAvailable = this.apiKey.length > 0;
    return ok(undefined);
  }

  async complete(request: AICompletionRequest): Promise<Result<AICompletionResponse, AIError>> {
    if (!this._isAvailable) {
      return err({ message: 'OpenAI provider not available — no API key configured' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const start = Date.now();

    try {
      const body: Record<string, unknown> = {
        model: this.model,
        messages: request.messages,
        temperature: request.temperature ?? this.defaultTemperature,
        max_tokens: request.maxTokens ?? this.maxTokens
      };

      if (request.responseFormat === 'json' && request.jsonSchema) {
        body.response_format = {
          type: 'json_schema',
          json_schema: {
            name: 'animaster_response',
            schema: request.jsonSchema,
            strict: true
          }
        };
      } else if (request.responseFormat === 'json') {
        body.response_format = { type: 'json_object' };
      }

      const result = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!result.ok) {
        return err({ message: `OpenAI request failed: ${result.status}` });
      }

      const payload = (await result.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
        usage?: { total_tokens?: number };
      };

      const content = payload.choices?.[0]?.message?.content ?? '';
      return ok({
        content,
        model: this.model,
        provider: this.name,
        tokensUsed: payload.usage?.total_tokens,
        latencyMs: Date.now() - start
      });
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
