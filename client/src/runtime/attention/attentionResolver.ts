import type { SceneGraph, AttentionFocus } from '@animaster/shared/scene';

export function resolveAttentionFocus(scene: SceneGraph): AttentionFocus {
  const actors = scene.actors;
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';

  let primaryTarget = actors.length > 0 ? actors[0].id : '';
  const secondaryTargets: string[] = [];
  let focusIntensity = 0.5;
  let motionContrast = 0;

  if (actors.length === 1) {
    const emotion = actors[0].emotionState;
    if (emotion === 'angry' || emotion === 'nervous') focusIntensity = 0.8;
    if (emotion === 'sad') focusIntensity = 0.6;
  }

  if (actors.length >= 2) {
    const movingActors = actors.filter((a) => a.currentAction !== 'idle');
    const idleActors = actors.filter((a) => a.currentAction === 'idle');

    if (movingActors.length === 1) {
      primaryTarget = movingActors[0].id;
      focusIntensity = 0.75;
      motionContrast = 0.6;
      for (const idle of idleActors) secondaryTargets.push(idle.id);
    } else if (movingActors.length === 0) {
      const emotionalActor = actors.reduce((prev, curr) => {
        const emotionWeight = getEmotionWeight(curr.emotionState);
        return emotionWeight > getEmotionWeight(prev.emotionState) ? curr : prev;
      });
      primaryTarget = emotionalActor.id;
      for (const a of actors) {
        if (a.id !== primaryTarget) secondaryTargets.push(a.id);
      }
    }

    const relationships = scene.relationships ?? [];
    const approaching = relationships.find((r) => r.type === 'approaching');
    if (approaching) {
      primaryTarget = approaching.actorBId;
      focusIntensity = 0.7;
    }

    const confronting = relationships.find((r) => r.type === 'confronting');
    if (confronting) {
      focusIntensity = 0.85;
      motionContrast = 0.4;
    }
  }

  if (tone === 'tense' || tone === 'threatening') focusIntensity = Math.max(focusIntensity, 0.8);

  return { primaryTarget, secondaryTargets, focusIntensity, motionContrast };
}

function getEmotionWeight(emotion: string): number {
  switch (emotion) {
    case 'angry': return 0.9;
    case 'nervous': return 0.7;
    case 'sad': return 0.6;
    case 'excited': return 0.5;
    case 'awkward': return 0.4;
    case 'exhausted': return 0.3;
    case 'happy': return 0.2;
    default: return 0.1;
  }
}
