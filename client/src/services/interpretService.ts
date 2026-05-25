import type { SceneGraph } from '@animaster/shared/scene';
import { ok, err, type Result } from '@animaster/shared/result';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

type InterpretResponse = SceneGraph;

type DirectingContext = {
  directorIntent?: Record<string, number>;
  actorOverrides?: Array<{ actorId: string; emotion: string; intensity?: number }>;
  beatSequence?: {
    id?: string;
    label?: string;
    currentIndex?: number;
    beats?: Array<{ action: string; durationMs: number }>;
  };
};

export async function interpretScene(prompt: string, directing?: DirectingContext): Promise<Result<SceneGraph, Error>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/interpret`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ prompt, directing }),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      return err(new Error('Request timed out — please try again'));
    }
    return err(new Error('Network error — check your connection and try again'));
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await readErrorMessage(response);
    return err(new Error(details));
  }

  const parsed = (await response.json()) as InterpretResponse;
  const validationResult = validateSceneGraph(parsed);
  if (!validationResult.ok) {
    return validationResult;
  }
  return ok(parsed);
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Interpret request failed with status ${response.status}`;
  } catch {
    return `Interpret request failed with status ${response.status}`;
  }
}

function validateSceneGraph(value: unknown): Result<void, Error> {
  if (!value || typeof value !== 'object') {
    return err(new Error('Interpret response was not an object'));
  }

  const scene = value as SceneGraph;
  if (typeof scene.id !== 'string' || typeof scene.version !== 'number') {
    return err(new Error('Interpret response is missing scene identity fields'));
  }

  if (!Array.isArray(scene.actors) || scene.actors.length === 0) {
    return err(new Error('Interpret response did not include any actors'));
  }

  if (!scene.environment || typeof scene.environment !== 'object') {
    return err(new Error('Interpret response is missing environment data'));
  }

  if (!scene.camera || typeof scene.camera !== 'object') {
    return err(new Error('Interpret response is missing camera data'));
  }

  if (!Array.isArray(scene.sessionHistory)) {
    return err(new Error('Interpret response is missing session history'));
  }

  return ok(undefined);
}
