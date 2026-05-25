// Phase 7 — AI Service: Client-side API for AI orchestration endpoints

import { ok, err, type Result } from '@animaster/shared/result';

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

export async function fetchAIStatus(): Promise<Result<AIStatus, Error>> {
  const res = await fetch(`${API_BASE}/ai/status`);
  if (!res.ok) return err(new Error(`AI status request failed: ${res.status}`));
  return ok(await res.json() as AIStatus);
}

export async function debugIntent(prompt: string): Promise<Result<IntentDebug, Error>> {
  const res = await fetch(`${API_BASE}/ai/debug/intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) return err(new Error(`Intent debug failed: ${res.status}`));
  return ok(await res.json() as IntentDebug);
}

export async function debugReasoning(prompt: string): Promise<Result<ReasoningDebug, Error>> {
  const res = await fetch(`${API_BASE}/ai/debug/reasoning`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!res.ok) return err(new Error(`Reasoning debug failed: ${res.status}`));
  return ok(await res.json() as ReasoningDebug);
}

export async function fetchMemory(): Promise<Result<MemoryState, Error>> {
  const res = await fetch(`${API_BASE}/ai/memory`);
  if (!res.ok) return err(new Error(`Memory fetch failed: ${res.status}`));
  return ok(await res.json() as MemoryState);
}

export async function clearMemory(): Promise<Result<void, Error>> {
  const res = await fetch(`${API_BASE}/ai/memory`, { method: 'DELETE' });
  if (!res.ok) return err(new Error(`Memory clear failed: ${res.status}`));
  return ok(undefined);
}

export async function runPromptTests(): Promise<Result<PromptTestResults, Error>> {
  const res = await fetch(`${API_BASE}/ai/tests`, { method: 'POST' });
  if (!res.ok) return err(new Error(`Test run failed: ${res.status}`));
  return ok(await res.json() as PromptTestResults);
}

export async function fetchDemos(): Promise<Result<DemoExperience[], Error>> {
  const res = await fetch(`${API_BASE}/ai/demos`);
  if (!res.ok) return err(new Error(`Demo fetch failed: ${res.status}`));
  return ok(await res.json() as DemoExperience[]);
}

export async function fetchDemo(id: string): Promise<Result<DemoExperience, Error>> {
  const res = await fetch(`${API_BASE}/ai/demos/${id}`);
  if (!res.ok) return err(new Error(`Demo fetch failed: ${res.status}`));
  return ok(await res.json() as DemoExperience);
}
