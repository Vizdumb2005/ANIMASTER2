import type { SceneGraph } from '@animaster/shared/scene';

const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';

type InterpretResponse = SceneGraph;

export async function interpretScene(prompt: string): Promise<SceneGraph> {
  const response = await fetch(`${apiBaseUrl}/interpret`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ prompt })
  });

  if (!response.ok) {
    const details = await readErrorMessage(response);
    throw new Error(details);
  }

  const parsed = (await response.json()) as InterpretResponse;
  validateSceneGraph(parsed);
  return parsed;
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? `Interpret request failed with status ${response.status}`;
  } catch {
    return `Interpret request failed with status ${response.status}`;
  }
}

function validateSceneGraph(value: unknown): asserts value is SceneGraph {
  if (!value || typeof value !== 'object') {
    throw new Error('Interpret response was not an object');
  }

  const scene = value as SceneGraph;
  if (typeof scene.id !== 'string' || typeof scene.version !== 'number') {
    throw new Error('Interpret response is missing scene identity fields');
  }

  if (!Array.isArray(scene.actors) || scene.actors.length === 0) {
    throw new Error('Interpret response did not include any actors');
  }

  if (!scene.environment || typeof scene.environment !== 'object') {
    throw new Error('Interpret response is missing environment data');
  }

  if (!scene.camera || typeof scene.camera !== 'object') {
    throw new Error('Interpret response is missing camera data');
  }

  if (!Array.isArray(scene.sessionHistory)) {
    throw new Error('Interpret response is missing session history');
  }
}
