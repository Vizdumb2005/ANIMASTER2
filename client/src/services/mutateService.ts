import type { SceneGraph } from '@animaster/shared/scene';
import { ok, err, type Result } from '@animaster/shared/result';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

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

export async function mutateScene(prompt: string, currentScene: SceneGraph, directing?: DirectingContext): Promise<Result<Partial<SceneGraph>, Error>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 35000);

  let response: Response;
  try {
    response = await fetch(`${apiBaseUrl}/mutate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        prompt,
        directing,
        currentScene: {
          actors: currentScene.actors,
          environment: currentScene.environment,
          camera: currentScene.camera,
          cinematicGrammar: currentScene.cinematicGrammar,
          atmosphere: currentScene.atmosphere,
          relationships: currentScene.relationships,
          rhythm: currentScene.rhythm
        }
      }),
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

  const parsed = (await response.json()) as Partial<SceneGraph>;
  const validationResult = validatePatch(parsed);
  if (!validationResult.ok) {
    return validationResult;
  }
  return ok(parsed);
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Mutate request failed with status ${response.status}`;
  } catch {
    return `Mutate request failed with status ${response.status}`;
  }
}

function validatePatch(value: unknown): Result<void, Error> {
  if (!value || typeof value !== 'object') {
    return err(new Error('Mutate response was not an object'));
  }
  return ok(undefined);
}
