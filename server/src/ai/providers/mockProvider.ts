// Phase 7 — Task Group 1: Mock Provider (deterministic fallback)

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
import { compileIntent } from '../compiler/intentCompiler.js';

export class MockProvider implements AIProvider {
  readonly name = 'mock';
  readonly isAvailable = true;

  async initialize(_config: AIProviderConfig): Promise<Result<void, AIError>> {
    // Mock provider is always available
    return ok(undefined);
  }

  private wrap(content: string, start: number): AICompletionResponse {
    return {
      content,
      model: 'mock-deterministic',
      provider: this.name,
      tokensUsed: 0,
      latencyMs: Date.now() - start
    };
  }

  async complete(request: AICompletionRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const userMsg = request.messages.find(m => m.role === 'user')?.content ?? '';
    return ok(this.wrap(JSON.stringify({ echo: userMsg }), start));
  }

  async generateScenePlan(request: CinematicPlanRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const intent = compileIntent(request.prompt);
    const plan = {
      locationType: inferLocationType(request.prompt),
      timeOfDay: inferTimeOfDay(request.prompt),
      tone: intent.pacingStyle === 'slow_heavy' ? 'lonely' : intent.emotionalPressure > 0.6 ? 'tense' : 'neutral',
      weather: inferWeather(request.prompt),
      actorCount: request.actorCount,
      emotionalPressure: intent.emotionalPressure,
      compositionStyle: intent.compositionStyle,
      lightingLanguage: intent.lightingLanguage,
      cameraLanguage: intent.cameraAggression > 0.6 ? 'tight_tension' : 'steady_observe',
      blockingStyle: intent.blockingStyle,
      visualIsolation: intent.visualIsolation,
      dialogueEnergy: intent.dialogueEnergy
    };
    return ok(this.wrap(JSON.stringify(plan), start));
  }

  async generateMutationPlan(request: MutationPlanRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const intent = compileIntent(request.prompt);
    const mutations = {
      emotionalShift: intent.emotionalPressure,
      compositionChange: intent.compositionStyle,
      lightingChange: intent.lightingLanguage,
      pacingChange: intent.pacingStyle,
      cameraChange: intent.cameraAggression > 0.5 ? 'tighten' : 'hold',
      reasoning: `Mock mutation for: ${request.prompt}`
    };
    return ok(this.wrap(JSON.stringify(mutations), start));
  }

  async generateDialogue(request: DialogueRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const lines = request.characters.map(c => ({
      actorId: c.id,
      line: `[${c.emotion}] ...`,
      delivery: c.emotion === 'angry' ? 'sharp' : c.emotion === 'sad' ? 'quiet' : 'measured',
      pauseAfterMs: request.tone === 'tense' ? 800 : 1200
    }));
    return ok(this.wrap(JSON.stringify({ lines, tone: request.tone }), start));
  }

  async generateEnvironmentIntent(request: EnvironmentIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const intent = compileIntent(request.prompt);
    const envIntent = {
      locationType: inferLocationType(request.prompt),
      density: intent.environmentDensity,
      lightingLanguage: intent.lightingLanguage,
      compositionStyle: intent.compositionStyle,
      mood: intent.emotionalPressure > 0.6 ? 'oppressive' : 'neutral'
    };
    return ok(this.wrap(JSON.stringify(envIntent), start));
  }

  async generateBlockingIntent(request: BlockingIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const intent = compileIntent(request.prompt);
    const blocking = {
      style: intent.blockingStyle,
      actorDirections: request.actors.map(a => ({
        actorId: a.id,
        movement: intent.blockingStyle === 'trapped' ? 'constrained' : 'natural',
        spacing: intent.compositionStyle === 'compressed' ? 'close' : 'standard'
      }))
    };
    return ok(this.wrap(JSON.stringify(blocking), start));
  }

  async generateCameraIntent(request: CameraIntentRequest): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    const intent = compileIntent(request.prompt);
    const cameraIntent = {
      mode: intent.cameraAggression > 0.7 ? 'close_up' : intent.visualIsolation > 0.6 ? 'wide_shot' : 'static',
      movement: intent.cameraAggression > 0.5 ? 'push_in' : 'hold',
      framing: request.actorCount > 1 ? 'two_shot' : 'single',
      urgency: intent.cameraAggression
    };
    return ok(this.wrap(JSON.stringify(cameraIntent), start));
  }

  async summarizeSceneMemory(sceneJson: string): Promise<Result<AICompletionResponse, AIError>> {
    const start = Date.now();
    let scene: Record<string, unknown>;
    try {
      scene = JSON.parse(sceneJson) as Record<string, unknown>;
    } catch {
      scene = {};
    }
    const tone = (scene.cinematicGrammar as Record<string, unknown>)?.tone ?? 'neutral';
    const summary = {
      emotionalArc: `Scene with ${tone} tone`,
      keyEvents: [`Scene established with ${tone} atmosphere`],
      relationships: [],
      visualMotifs: [],
      unresolvedTensions: []
    };
    return ok(this.wrap(JSON.stringify(summary), start));
  }
}

function inferLocationType(prompt: string): string {
  if (/subway|metro|station/i.test(prompt)) return 'subway';
  if (/alley/i.test(prompt)) return 'alley';
  if (/rooftop|roof/i.test(prompt)) return 'rooftop';
  if (/forest|woods/i.test(prompt)) return 'forest';
  if (/beach|ocean|shore/i.test(prompt)) return 'beach';
  if (/apartment|flat|home/i.test(prompt)) return 'apartment';
  if (/hallway|corridor/i.test(prompt)) return 'hallway';
  if (/hospital|clinic/i.test(prompt)) return 'hospital';
  if (/parking|garage/i.test(prompt)) return 'parking_garage';
  if (/diner|restaurant|cafe/i.test(prompt)) return 'diner';
  if (/office|cubicle/i.test(prompt)) return 'office';
  if (/warehouse|factory/i.test(prompt)) return 'warehouse';
  if (/park|garden/i.test(prompt)) return 'outdoor_park';
  if (/street|road|outside/i.test(prompt)) return 'outdoor_street';
  return 'indoor_room';
}

function inferTimeOfDay(prompt: string): string {
  if (/night|late|midnight/i.test(prompt)) return 'night';
  if (/dawn|sunrise/i.test(prompt)) return 'dawn';
  if (/dusk|sunset|evening/i.test(prompt)) return 'evening';
  if (/morning/i.test(prompt)) return 'morning';
  if (/afternoon/i.test(prompt)) return 'afternoon';
  return 'evening';
}

function inferWeather(prompt: string): string {
  if (/rain/i.test(prompt)) return 'rain';
  if (/snow/i.test(prompt)) return 'snow';
  if (/fog/i.test(prompt)) return 'fog';
  if (/storm/i.test(prompt)) return 'storm';
  return 'clear';
}
