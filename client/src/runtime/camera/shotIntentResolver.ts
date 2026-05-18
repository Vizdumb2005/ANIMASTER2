import type { SceneGraph, ShotIntent, ShotIntentType } from '@animaster/shared/scene';

export function resolveShotIntent(scene: SceneGraph): ShotIntent {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actors = scene.actors;
  const spatial = scene.emotionalSpatial;

  let intent: ShotIntentType = 'observe';
  let subject = actors.length > 0 ? actors[0].id : '';
  let intensity = 0.5;

  if (actors.length === 1) {
    const emotion = actors[0].emotionState;
    if (emotion === 'sad' || emotion === 'nervous') {
      intent = 'isolate';
      intensity = 0.7;
    } else if (emotion === 'angry') {
      intent = 'emphasize';
      intensity = 0.8;
    }
  }

  if (actors.length >= 2) {
    const relationships = scene.relationships ?? [];
    const hasConfrontation = relationships.some((r) => r.type === 'confronting');
    const hasApproach = relationships.some((r) => r.type === 'approaching');

    if (hasConfrontation) {
      intent = 'confront';
      intensity = 0.85;
    } else if (hasApproach) {
      intent = 'reveal';
      intensity = 0.6;
    }
  }

  switch (tone) {
    case 'tense':
    case 'threatening':
      intent = intent === 'observe' ? 'compress' : intent;
      intensity = Math.max(intensity, 0.75);
      break;
    case 'lonely':
    case 'sad':
      intent = intent === 'observe' ? 'isolate' : intent;
      break;
    case 'romantic':
      intent = intent === 'observe' ? 'emphasize' : intent;
      intensity = 0.55;
      break;
  }

  if (spatial?.spatialIntent === 'vulnerability') {
    intent = 'isolate';
    intensity = Math.max(intensity, 0.65);
  }

  return { intent, subject, intensity };
}
