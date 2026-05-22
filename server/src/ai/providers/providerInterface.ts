// Phase 7 — Task Group 1: Provider-agnostic AI interface

import { Result } from '../../types/result.js';

export interface AIProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
  timeoutMs?: number;
}

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  temperature?: number;
  maxTokens?: number;
  responseFormat?: 'json' | 'text';
  jsonSchema?: Record<string, unknown>;
}

export interface AICompletionResponse {
  content: string;
  model: string;
  provider: string;
  tokensUsed?: number;
  latencyMs: number;
}

export interface AIError {
  message: string;
  code?: string;
  details?: any;
}

export interface CinematicPlanRequest {
  prompt: string;
  actorCount: number;
  context?: string;
}

export interface MutationPlanRequest {
  prompt: string;
  currentSceneJson: string;
  context?: string;
}

export interface DialogueRequest {
  prompt: string;
  characters: Array<{ id: string; label: string; emotion: string }>;
  tone: string;
  context?: string;
}

export interface EnvironmentIntentRequest {
  prompt: string;
  currentEnvironment?: string;
  tone?: string;
}

export interface CameraIntentRequest {
  prompt: string;
  actorCount: number;
  tone: string;
  currentMode?: string;
}

export interface BlockingIntentRequest {
  prompt: string;
  actors: Array<{ id: string; position: { x: number; y: number } }>;
  environment: string;
}

export interface SceneMemorySummary {
  emotionalArc: string;
  keyEvents: string[];
  relationships: string[];
  visualMotifs: string[];
  unresolvedTensions: string[];
}

export interface AIProvider {
  readonly name: string;
  readonly isAvailable: boolean;

  initialize(config: AIProviderConfig): Promise<Result<void, AIError>>;
  complete(request: AICompletionRequest): Promise<Result<AICompletionResponse, AIError>>;

  generateScenePlan(request: CinematicPlanRequest): Promise<Result<AICompletionResponse, AIError>>;
  generateMutationPlan(request: MutationPlanRequest): Promise<Result<AICompletionResponse, AIError>>;
  generateDialogue(request: DialogueRequest): Promise<Result<AICompletionResponse, AIError>>;
  generateEnvironmentIntent(request: EnvironmentIntentRequest): Promise<Result<AICompletionResponse, AIError>>;
  generateBlockingIntent(request: BlockingIntentRequest): Promise<Result<AICompletionResponse, AIError>>;
  generateCameraIntent(request: CameraIntentRequest): Promise<Result<AICompletionResponse, AIError>>;
  summarizeSceneMemory(sceneJson: string): Promise<Result<AICompletionResponse, AIError>>;
}

export type ProviderName = 'groq' | 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'mock';

export type TaskComplexity = 'simple' | 'moderate' | 'complex';

export interface ProviderCapabilities {
  maxContextTokens: number;
  supportsJsonMode: boolean;
  supportsStreaming: boolean;
  reasoningStrength: 'basic' | 'moderate' | 'strong';
  latencyProfile: 'fast' | 'moderate' | 'slow';
  costTier: 'free' | 'cheap' | 'moderate' | 'expensive';
  isLocal: boolean;
}
