import Groq from 'groq-sdk';
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

export class GroqProvider implements AIProvider {
  readonly name = 'groq';
  private client: Groq | null = null;
  private model = 'qwen/qwen3-32b';
  private maxTokens = 4096;
  private defaultTemperature = 0.6;
  private _isAvailable = false;

  get isAvailable(): boolean {
    return this._isAvailable;
  }

  async initialize(config: AIProviderConfig): Promise<Result<void, AIError>> {
    const apiKey = config.apiKey ?? '';
    if (!apiKey) return ok(undefined);
    this.client = new Groq({ apiKey });
    this.model = config.model ?? 'qwen/qwen3-32b';
    this.maxTokens = config.maxTokens ?? 4096;
    this.defaultTemperature = config.temperature ?? 0.6;
    this._isAvailable = true;
    return ok(undefined);
  }

  async complete(request: AICompletionRequest): Promise<Result<AICompletionResponse, AIError>> {
    if (!this._isAvailable || !this.client) {
      return err({ message: 'Groq provider not available — no API key configured' });
    }

    const start = Date.now();

    try {
      const responseFormat = request.responseFormat === 'json'
        ? { type: 'json_object' as const }
        : null;

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages: request.messages as Groq.Chat.ChatCompletionMessageParam[],
        temperature: request.temperature ?? this.defaultTemperature,
        max_completion_tokens: request.maxTokens ?? this.maxTokens,
        top_p: 0.95,
        reasoning_effort: 'none',
        reasoning_format: 'hidden',
        response_format: responseFormat,
        stop: null,
        stream: false
      });

      const content = completion.choices[0]?.message?.content ?? '';
      return ok({
        content,
        model: this.model,
        provider: this.name,
        tokensUsed: completion.usage?.total_tokens,
        latencyMs: Date.now() - start
      });
    } catch (error) {
      return err({ message: error instanceof Error ? error.message : 'Unknown error in Groq provider' });
    }
  }

  async generateScenePlan(request: CinematicPlanRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildScenePlanPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateMutationPlan(request: MutationPlanRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildMutationPlanPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateDialogue(request: DialogueRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildDialoguePrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateEnvironmentIntent(request: EnvironmentIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildEnvironmentPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateBlockingIntent(request: BlockingIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildBlockingPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateCameraIntent(request: CameraIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildCameraPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async summarizeSceneMemory(sceneJson: string): Promise<Result<AICompletionResponse, AIError>> {
    const { system, user } = buildMemorySummaryPrompt(sceneJson);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }
}
