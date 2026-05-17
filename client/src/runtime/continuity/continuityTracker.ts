import type { Actor, SceneGraph, CharacterRelationship } from '@animaster/shared/scene';

interface ContinuitySnapshot {
  actorPositions: Map<string, { x: number; y: number }>;
  actorEmotions: Map<string, string>;
  relationships: CharacterRelationship[];
  version: number;
}

let lastSnapshot: ContinuitySnapshot | null = null;

export function captureSnapshot(scene: SceneGraph): ContinuitySnapshot {
  const positions = new Map<string, { x: number; y: number }>();
  const emotions = new Map<string, string>();

  for (const actor of scene.actors) {
    positions.set(actor.id, { x: actor.position.x, y: actor.position.y });
    emotions.set(actor.id, actor.emotionState);
  }

  const snapshot: ContinuitySnapshot = {
    actorPositions: positions,
    actorEmotions: emotions,
    relationships: scene.relationships ? [...scene.relationships] : [],
    version: scene.version
  };

  lastSnapshot = snapshot;
  return snapshot;
}

export function getLastSnapshot(): ContinuitySnapshot | null {
  return lastSnapshot;
}

export interface ContinuityViolation {
  actorId: string;
  field: string;
  expected: string;
  actual: string;
}

export function validateContinuity(scene: SceneGraph): ContinuityViolation[] {
  if (!lastSnapshot) return [];

  const violations: ContinuityViolation[] = [];

  for (const actor of scene.actors) {
    const prevPos = lastSnapshot.actorPositions.get(actor.id);
    if (prevPos) {
      const dx = Math.abs(actor.position.x - prevPos.x);
      const dy = Math.abs(actor.position.y - prevPos.y);
      if (dx > 300 || dy > 300) {
        violations.push({
          actorId: actor.id,
          field: 'position',
          expected: `near (${prevPos.x}, ${prevPos.y})`,
          actual: `(${actor.position.x}, ${actor.position.y})`
        });
      }
    }
  }

  return violations;
}
