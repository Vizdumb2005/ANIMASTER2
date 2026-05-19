// Phase 7 — AI Service: Client-side API for AI orchestration endpoints

const API_BASE = 'http://localhost:3001';

export interface AIStatus {
  orchestrator: {
    memoryEntries: number;
    config: Record<string, unknown>;
  };
  providers: Record<string, unknown>;
  providerAvailability: Record<string, boolean>;
  registeredProviders: string[];
}

export interface IntentDebug {
  prompt: string;
  intent: Record<string, number | string>;
  semanticControls: Record<string, number>;
  agentReports: Record<string, unknown>;
  sceneGraphPlan: Record<string, unknown>;
}

export interface ReasoningDebug {
  prompt: string;
  reasoning: string[];
  providerUsed: string;
  fallbackUsed: boolean;
  intent: Record<string, unknown>;
  agentReports: Record<string, unknown>;
  scenePlan: Record<string, unknown>;
}

export interface MemoryState {
  entries: Array<Record<string, unknown>>;
  emotionalState: Record<string, unknown>;
  continuityState: Record<string, unknown>;
  recentHistory: Array<Record<string, unknown>>;
}

export interface PromptTestResults {
  summary: string;
  passed: number;
  total: number;
  results: Array<{
    prompt: string;
    passed: boolean;
    checks: Array<{ name: string; expected: string; actual: string; passed: boolean }>;
  }>;
}

export interface DemoExperience {
  id: string;
  title: string;
  description: string;
  initialPrompt: string;
  mutations: Array<{ prompt: string; expectedEffect: string }>;
  provesCapabilities: string[];
}

export async function fetchAIStatus(): Promise<AIStatus> {
  const res = await fetch(`${API_BASE}/ai/status`);
  if (!res.ok) throw new Error(`AI status request failed: ${res.status}`);
  return res.json() as Promise<AIStatus>;
}

export async function debugIntent(prompt: string): Promise<IntentDebug> {
  const res = await fetch(`${API_BASE}/ai/debug/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(`Intent debug failed: ${res.status}`);
  return res.json() as Promise<IntentDebug>;
}

export async function debugReasoning(prompt: string): Promise<ReasoningDebug> {
  const res = await fetch(`${API_BASE}/ai/debug/reasoning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) throw new Error(`Reasoning debug failed: ${res.status}`);
  return res.json() as Promise<ReasoningDebug>;
}

export async function fetchMemory(): Promise<MemoryState> {
  const res = await fetch(`${API_BASE}/ai/memory`);
  if (!res.ok) throw new Error(`Memory fetch failed: ${res.status}`);
  return res.json() as Promise<MemoryState>;
}

export async function clearMemory(): Promise<void> {
  const res = await fetch(`${API_BASE}/ai/memory`, { method: 'DELETE' });
  if (!res.ok) throw new Error(`Memory clear failed: ${res.status}`);
}

export async function runPromptTests(): Promise<PromptTestResults> {
  const res = await fetch(`${API_BASE}/ai/tests`, { method: 'POST' });
  if (!res.ok) throw new Error(`Test run failed: ${res.status}`);
  return res.json() as Promise<PromptTestResults>;
}

export async function fetchDemos(): Promise<DemoExperience[]> {
  const res = await fetch(`${API_BASE}/ai/demos`);
  if (!res.ok) throw new Error(`Demo fetch failed: ${res.status}`);
  return res.json() as Promise<DemoExperience[]>;
}

export async function fetchDemo(id: string): Promise<DemoExperience> {
  const res = await fetch(`${API_BASE}/ai/demos/${id}`);
  if (!res.ok) throw new Error(`Demo fetch failed: ${res.status}`);
  return res.json() as Promise<DemoExperience>;
}
