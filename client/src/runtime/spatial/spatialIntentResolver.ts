import type { SceneGraph, SpatialIntent, EmotionalSpatialState } from '@animaster/shared/scene';

const TONE_SPATIAL_MAP: Record<string, SpatialIntent> = {
  lonely: 'isolation',
  sad: 'vulnerability',
  tense: 'confrontation',
  threatening: 'confrontation',
  romantic: 'intimacy',
  awkward: 'avoidance',
  energetic: 'neutral',
  neutral: 'neutral'
};

export function resolveSpatialIntent(scene: SceneGraph): EmotionalSpatialState {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actorCount = scene.actors.length;
  const relationships = scene.relationships ?? [];

  let intent: SpatialIntent = TONE_SPATIAL_MAP[tone] ?? 'neutral';

  if (actorCount === 1) {
    const emotion = scene.actors[0].emotionState;
    if (emotion === 'nervous' || emotion === 'awkward') intent = 'vulnerability';
    if (emotion === 'sad') intent = 'isolation';
  }

  if (actorCount >= 2) {
    const hasConfrontation = relationships.some((r) => r.type === 'confronting');
    const hasApproach = relationships.some((r) => r.type === 'approaching');
    const hasAvoidance = relationships.some((r) => r.type === 'avoiding');

    if (hasConfrontation) intent = 'confrontation';
    else if (hasAvoidance) intent = 'avoidance';
    else if (hasApproach && tone === 'romantic') intent = 'intimacy';
  }

  const negativeSpaceRatio = computeNegativeSpace(intent, actorCount);
  const frameEdgeBias = computeFrameEdgeBias(intent);
  const compositionTension = computeCompositionTension(intent, scene);

  return { spatialIntent: intent, negativeSpaceRatio, frameEdgeBias, compositionTension };
}

function computeNegativeSpace(intent: SpatialIntent, actorCount: number): number {
  switch (intent) {
    case 'isolation': return 0.8;
    case 'vulnerability': return 0.6;
    case 'avoidance': return 0.65;
    case 'confrontation': return 0.2;
    case 'intimacy': return 0.15;
    case 'dominance': return 0.4;
    default: return actorCount === 1 ? 0.5 : 0.4;
  }
}

function computeFrameEdgeBias(intent: SpatialIntent): { x: number; y: number } {
  switch (intent) {
    case 'isolation': return { x: -0.6, y: 0 };
    case 'vulnerability': return { x: 0.3, y: 0.2 };
    case 'confrontation': return { x: 0, y: 0 };
    case 'intimacy': return { x: 0, y: -0.1 };
    case 'avoidance': return { x: 0.4, y: 0.1 };
    case 'dominance': return { x: -0.2, y: -0.2 };
    default: return { x: 0, y: 0 };
  }
}

function computeCompositionTension(intent: SpatialIntent, scene: SceneGraph): number {
  const actorCount = scene.actors.length;
  if (actorCount < 2) {
    return intent === 'isolation' ? 0.3 : intent === 'vulnerability' ? 0.5 : 0.1;
  }

  const a = scene.actors[0];
  const b = scene.actors[1];
  const dx = Math.abs(a.position.x - b.position.x);
  const envWidth = scene.environment.width;
  const spacingRatio = dx / envWidth;

  if (intent === 'confrontation') return Math.min(1, 0.7 + (1 - spacingRatio));
  if (intent === 'intimacy') return 0.2;
  if (intent === 'avoidance') return 0.6;
  return spacingRatio < 0.2 ? 0.7 : 0.3;
}
