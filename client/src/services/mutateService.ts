import type { SceneGraph } from '@animaster/shared/scene';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

export async function mutateScene(prompt: string, currentScene: SceneGraph): Promise<Partial<SceneGraph>> {
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
        currentScene: {
          actors: currentScene.actors,
          environment: currentScene.environment,
          camera: currentScene.camera
        }
      }),
      signal: controller.signal
    });
  } catch (error) {
    clearTimeout(timeout);
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out — please try again');
    }
    throw new Error('Network error — check your connection and try again');
  } finally {
    clearTimeout(timeout);
  }

  if (!response.ok) {
    const details = await readErrorMessage(response);
    throw new Error(details);
  }

  const parsed = (await response.json()) as Partial<SceneGraph>;
  validatePatch(parsed);
  return parsed;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Mutate request failed with status ${response.status}`;
  } catch {
    return `Mutate request failed with status ${response.status}`;
  }
}

function validatePatch(value: unknown): asserts value is Partial<SceneGraph> {
  if (!value || typeof value !== 'object') {
    throw new Error('Mutate response was not an object');
  }
}
