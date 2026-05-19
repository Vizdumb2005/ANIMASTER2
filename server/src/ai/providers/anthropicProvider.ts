// Phase 7 — Task Group 1: Anthropic Provider

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
  BlockingIntentRequest
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

export class AnthropicProvider implements AIProvider {
  readonly name = 'anthropic';
  private apiKey = '';
  private model = 'claude-sonnet-4-20250514';
  private baseUrl = 'https://api.anthropic.com/v1';
  private maxTokens = 4096;
  private defaultTemperature = 0.2;
  private timeoutMs = 30_000;
  private _isAvailable = false;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(config: AIProviderConfig): Promise<void> {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'claude-sonnet-4-20250514';
    this.baseUrl = config.baseUrl ?? 'https://api.anthropic.com/v1';
    this.maxTokens = config.maxTokens ?? 4096;
    this.defaultTemperature = config.temperature ?? 0.2;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this._isAvailable = this.apiKey.length > 0;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this._isAvailable) {
      throw new Error('Anthropic provider not available — no API key configured');
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const start = Date.now();

    try {
      const systemMsg = request.messages.find(m => m.role === 'system')?.content ?? '';
      const userMessages = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      const body: Record<string, unknown> = {
        model: this.model,
        max_tokens: request.maxTokens ?? this.maxTokens,
        temperature: request.temperature ?? this.defaultTemperature,
        system: systemMsg,
        messages: userMessages
      };

      const result = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!result.ok) {
        throw new Error(`Anthropic request failed: ${result.status}`);
      }

      const payload = (await result.json()) as {
        content?: Array<{ type: string; text?: string }>;
        usage?: { input_tokens?: number; output_tokens?: number };
      };

      const content = payload.content?.find(c => c.type === 'text')?.text ?? '';
      const tokensUsed = (payload.usage?.input_tokens ?? 0) + (payload.usage?.output_tokens ?? 0);

      return {
        content,
        model: this.model,
        provider: this.name,
        tokensUsed,
        latencyMs: Date.now() - start
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  async generateScenePlan(request: CinematicPlanRequest): Promise<AICompletionResponse> {
    const { system, user } = buildScenePlanPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateMutationPlan(request: MutationPlanRequest): Promise<AICompletionResponse> {
    const { system, user } = buildMutationPlanPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateDialogue(request: DialogueRequest): Promise<AICompletionResponse> {
    const { system, user } = buildDialoguePrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateEnvironmentIntent(request: EnvironmentIntentRequest): Promise<AICompletionResponse> {
    const { system, user } = buildEnvironmentPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateBlockingIntent(request: BlockingIntentRequest): Promise<AICompletionResponse> {
    const { system, user } = buildBlockingPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async generateCameraIntent(request: CameraIntentRequest): Promise<AICompletionResponse> {
    const { system, user } = buildCameraPrompt(request);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }

  async summarizeSceneMemory(sceneJson: string): Promise<AICompletionResponse> {
    const { system, user } = buildMemorySummaryPrompt(sceneJson);
    return this.complete({
      messages: [{ role: 'system', content: system }, { role: 'user', content: user }],
      responseFormat: 'json'
    });
  }
}
