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

  async initialize(config: AIProviderConfig): Promise<void> {
    const apiKey = config.apiKey ?? '';
    if (!apiKey) return;
    this.client = new Groq({ apiKey });
    this.model = config.model ?? 'qwen/qwen3-32b';
    this.maxTokens = config.maxTokens ?? 4096;
    this.defaultTemperature = config.temperature ?? 0.6;
    this._isAvailable = true;
  }

  async complete(request: AICompletionRequest): Promise<AICompletionResponse> {
    if (!this._isAvailable || !this.client) {
      throw new Error('Groq provider not available — no API key configured');
    }

    const start = Date.now();

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
    return {
      content,
      model: this.model,
      provider: this.name,
      tokensUsed: completion.usage?.total_tokens,
      latencyMs: Date.now() - start
    };
  }

  async generateScenePlan(request: CinematicPlanRequest): Promise<AICompletionResponse> {
    const { system, user } = buildScenePlanPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateMutationPlan(request: MutationPlanRequest): Promise<AICompletionResponse> {
    const { system, user } = buildMutationPlanPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateDialogue(request: DialogueRequest): Promise<AICompletionResponse> {
    const { system, user } = buildDialoguePrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateEnvironmentIntent(request: EnvironmentIntentRequest): Promise<AICompletionResponse> {
    const { system, user } = buildEnvironmentPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateBlockingIntent(request: BlockingIntentRequest): Promise<AICompletionResponse> {
    const { system, user } = buildBlockingPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async generateCameraIntent(request: CameraIntentRequest): Promise<AICompletionResponse> {
    const { system, user } = buildCameraPrompt(request);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }

  async summarizeSceneMemory(sceneJson: string): Promise<AICompletionResponse> {
    const { system, user } = buildMemorySummaryPrompt(sceneJson);
    return this.complete({ messages: [{ role: 'system', content: system }, { role: 'user', content: user }], responseFormat: 'json' });
  }
}
