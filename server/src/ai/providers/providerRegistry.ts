// Phase 7 — Task Group 1: Provider Registry

import type { AIProvider, AIProviderConfig, ProviderName, ProviderCapabilities } from './providerInterface.js';
import { GroqProvider } from './groqProvider.js';
import { OpenAIProvider } from './openaiProvider.js';
import { AnthropicProvider } from './anthropicProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { OllamaProvider } from './ollamaProvider.js';
import { MockProvider } from './mockProvider.js';

const CAPABILITIES: Record<ProviderName, ProviderCapabilities> = {
  groq: {
    maxContextTokens: 32_768,
    supportsJsonMode: true,
    supportsStreaming: true,
    reasoningStrength: 'strong',
    latencyProfile: 'fast',
    costTier: 'cheap',
    isLocal: false
  },
  openai: {
    maxContextTokens: 128_000,
    supportsJsonMode: true,
    supportsStreaming: true,
    reasoningStrength: 'strong',
    latencyProfile: 'moderate',
    costTier: 'moderate',
    isLocal: false
  },
  anthropic: {
    maxContextTokens: 200_000,
    supportsJsonMode: false,
    supportsStreaming: true,
    reasoningStrength: 'strong',
    latencyProfile: 'moderate',
    costTier: 'moderate',
    isLocal: false
  },
  gemini: {
    maxContextTokens: 1_000_000,
    supportsJsonMode: true,
    supportsStreaming: true,
    reasoningStrength: 'strong',
    latencyProfile: 'fast',
    costTier: 'cheap',
    isLocal: false
  },
  ollama: {
    maxContextTokens: 8_000,
    supportsJsonMode: true,
    supportsStreaming: true,
    reasoningStrength: 'basic',
    latencyProfile: 'fast',
    costTier: 'free',
    isLocal: true
  },
  mock: {
    maxContextTokens: Infinity,
    supportsJsonMode: true,
    supportsStreaming: false,
    reasoningStrength: 'basic',
    latencyProfile: 'fast',
    costTier: 'free',
    isLocal: true
  }
};

class ProviderRegistry {
  private providers = new Map<ProviderName, AIProvider>();
  private initialized = false;

  async initializeFromEnv(): Promise<void> {
    if (this.initialized) return;

    const groq = new GroqProvider();
    await groq.initialize({
      apiKey: process.env.GROQ_API_KEY,
      model: process.env.GROQ_MODEL
    });
    this.providers.set('groq', groq);

    const openai = new OpenAIProvider();
    await openai.initialize({
      apiKey: process.env.OPENAI_API_KEY,
      model: process.env.OPENAI_MODEL
    });
    this.providers.set('openai', openai);

    const anthropic = new AnthropicProvider();
    await anthropic.initialize({
      apiKey: process.env.ANTHROPIC_API_KEY,
      model: process.env.ANTHROPIC_MODEL
    });
    this.providers.set('anthropic', anthropic);

    const gemini = new GeminiProvider();
    await gemini.initialize({
      apiKey: process.env.GEMINI_API_KEY,
      model: process.env.GEMINI_MODEL
    });
    this.providers.set('gemini', gemini);

    const ollama = new OllamaProvider();
    await ollama.initialize({
      baseUrl: process.env.OLLAMA_URL,
      model: process.env.OLLAMA_MODEL
    });
    this.providers.set('ollama', ollama);

    const mock = new MockProvider();
    await mock.initialize({});
    this.providers.set('mock', mock);

    this.initialized = true;
  }

  getProvider(name: ProviderName): AIProvider | undefined {
    return this.providers.get(name);
  }

  getCapabilities(name: ProviderName): ProviderCapabilities {
    return CAPABILITIES[name];
  }

  getAvailableProviders(): ProviderName[] {
    return Array.from(this.providers.entries())
      .filter(([, p]) => p.isAvailable)
      .map(([name]) => name);
  }

  getBestAvailableProvider(preferLocal: boolean = false): AIProvider {
    const available = this.getAvailableProviders();

    if (preferLocal) {
      if (available.includes('ollama')) return this.providers.get('ollama')!;
    }

    const priority: ProviderName[] = ['groq', 'openai', 'anthropic', 'gemini', 'ollama', 'mock'];
    for (const name of priority) {
      if (available.includes(name)) return this.providers.get(name)!;
    }

    return this.providers.get('mock')!;
  }

  getProviderForComplexity(complexity: 'simple' | 'moderate' | 'complex'): AIProvider {
    const available = this.getAvailableProviders();

    if (complexity === 'simple') {
      if (available.includes('groq')) return this.providers.get('groq')!;
      if (available.includes('ollama')) return this.providers.get('ollama')!;
      if (available.includes('gemini')) return this.providers.get('gemini')!;
    }

    if (complexity === 'complex') {
      if (available.includes('groq')) return this.providers.get('groq')!;
      if (available.includes('anthropic')) return this.providers.get('anthropic')!;
      if (available.includes('openai')) return this.providers.get('openai')!;
    }

    return this.getBestAvailableProvider();
  }

  async registerProvider(name: ProviderName, provider: AIProvider, config: AIProviderConfig): Promise<void> {
    await provider.initialize(config);
    this.providers.set(name, provider);
  }

  getStatus(): Record<ProviderName, { available: boolean; capabilities: ProviderCapabilities }> {
    const status = {} as Record<ProviderName, { available: boolean; capabilities: ProviderCapabilities }>;
    for (const [name, provider] of this.providers.entries()) {
      status[name] = {
        available: provider.isAvailable,
        capabilities: CAPABILITIES[name]
      };
    }
    return status;
  }
}

export const providerRegistry = new ProviderRegistry();
