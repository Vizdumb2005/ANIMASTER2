import type { Actor, SceneGraph } from '@animaster/shared/scene';
import type { ToneRuntimeProfile } from '../semanticProfiles';
import { findAnchor } from '../semanticAnchors';

export function evaluateStaging(scene: SceneGraph, tone?: ToneRuntimeProfile): Actor[] {
  const profile = tone ?? {
    spacingMultiplier: scene.cinematicGrammar?.template?.spacingMultiplier ?? 1,
    preferredRelationshipDistance: 180,
    tone: scene.cinematicGrammar?.tone ?? 'neutral',
    negativeSpace: 1
  } as ToneRuntimeProfile;

  const actors = scene.actors.map((actor) => ({ ...actor }));
  const hasActiveMovement = actors.some((actor) => {
    const type = actor.activeAction?.type;
    return actor.targetPosition || type === 'walkingTo' || type === 'approaching' || type === 'sittingDown' || type === 'seated';
  });
  if (hasActiveMovement) return actors;

  const floorY = scene.environment.height * 0.67;
  const center = findAnchor(scene.anchors, 'center')?.position ?? { x: scene.environment.width / 2, y: floorY };
  const spacing = profile.preferredRelationshipDistance * profile.spacingMultiplier;

  if (actors.length === 1) {
    const actor = actors[0];
    const lonelyOffset = profile.tone === 'lonely' ? -scene.environment.width * 0.16 : 0;
    actor.position = { x: center.x + lonelyOffset, y: center.y };
    return actors;
  }

  if (actors.length >= 2) {
    const left = center.x - spacing / 2;
    const right = center.x + spacing / 2;
    actors[0].position = { x: left, y: floorY };
    actors[1].position = { x: right, y: floorY };
    for (let i = 2; i < actors.length; i++) {
      actors[i].position = { x: center.x + (i - 1) * 60, y: floorY };
    }
  }

  return actors;
}
