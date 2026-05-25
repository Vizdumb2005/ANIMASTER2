// Phase 7 — Task Group 1: Google Gemini Provider

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

export class GeminiProvider implements AIProvider {
  readonly name = 'gemini';
  private apiKey = '';
  private model = 'gemini-2.0-flash';
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta';
  private maxTokens = 4096;
  private defaultTemperature = 0.2;
  private timeoutMs = 30_000;
  private _isAvailable = false;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(config: AIProviderConfig): Promise<Result<void, AIError>> {
    this.apiKey = config.apiKey ?? '';
    this.model = config.model ?? 'gemini-2.0-flash';
    this.baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.maxTokens = config.maxTokens ?? 4096;
    this.defaultTemperature = config.temperature ?? 0.2;
    this.timeoutMs = config.timeoutMs ?? 30_000;
    this._isAvailable = this.apiKey.length > 0;
    return ok(undefined);
  }

  async complete(request: AICompletionRequest): Promise<Result<AICompletionResponse, AIError>> {
    if (!this._isAvailable) {
      return err({ message: 'Gemini provider not available — no API key configured' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);
    const start = Date.now();

    try {
      const systemMsg = request.messages.find(m => m.role === 'system')?.content ?? '';
      const contents = request.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }]
        }));

      const body: Record<string, unknown> = {
        contents,
        generationConfig: {
          temperature: request.temperature ?? this.defaultTemperature,
          maxOutputTokens: request.maxTokens ?? this.maxTokens
        }
      };

      if (systemMsg) {
        (body as Record<string, unknown>).systemInstruction = { parts: [{ text: systemMsg }] };
      }

      if (request.responseFormat === 'json') {
        (body.generationConfig as Record<string, unknown>).responseMimeType = 'application/json';
      }

      const url = `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`;
      const result = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!result.ok) {
        return err({ message: `Gemini request failed: ${result.status}` });
      }

      const payload = (await result.json()) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
        usageMetadata?: { totalTokenCount?: number };
      };

      const content = payload.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
      return ok({
        content,
        model: this.model,
        provider: this.name,
        tokensUsed: payload.usageMetadata?.totalTokenCount,
        latencyMs: Date.now() - start
      });
    } catch (error) {
      return err({ message: error instanceof Error ? error.message : 'Unknown error in Gemini provider' });
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
