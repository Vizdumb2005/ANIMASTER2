import type { SceneGraph, ContinuityViolation } from '@animaster/shared/scene';

export function captureSnapshot(scene: SceneGraph) {
  scene.continuity ??= { lastValidatedVersion: scene.version, actorSnapshots: {}, cameraSnapshot: null, violations: [] };
  const actorSnapshots: NonNullable<SceneGraph['continuity']>['actorSnapshots'] = {};
  for (const actor of scene.actors) {
    actorSnapshots[actor.id] = {
      position: { ...actor.position },
      emotionState: actor.emotionState,
      actionType: actor.activeAction?.type ?? actor.currentAction
    };
  }
  scene.continuity.actorSnapshots = actorSnapshots;
  scene.continuity.cameraSnapshot = { x: scene.camera.x, y: scene.camera.y, zoom: scene.camera.zoom, mode: scene.camera.mode };
  scene.continuity.lastValidatedVersion = scene.version;
  return scene.continuity;
}

export function getLastSnapshot(scene?: SceneGraph) {
  return scene?.continuity ?? null;
}

export function validateContinuity(scene: SceneGraph): ContinuityViolation[] {
  scene.continuity ??= { lastValidatedVersion: scene.version, actorSnapshots: {}, cameraSnapshot: null, violations: [] };
  const previous = scene.continuity.actorSnapshots;
  const violations: ContinuityViolation[] = [];

  for (const actor of scene.actors) {
    const prev = previous[actor.id];
    if (!prev) continue;
    const dx = actor.position.x - prev.position.x;
    const dy = actor.position.y - prev.position.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 300) {
      violations.push({ id: `spatial_${actor.id}`, severity: 'error', field: 'position', message: `${actor.id} moved ${Math.round(dist)}px without a transition`, repairApplied: false });
    }
    if (prev.actionType !== (actor.activeAction?.type ?? actor.currentAction) && actor.activeAction?.interruptible === false && actor.activeAction.status !== 'complete') {
      violations.push({ id: `action_${actor.id}`, severity: 'warning', field: 'activeAction', message: `${actor.id} changed non-interruptible action`, repairApplied: false });
    }
  }

  const preservedViolations = scene.continuity.violations.filter(
    (violation) => !violation.id.startsWith('spatial_') && !violation.id.startsWith('action_')
  );
  scene.continuity.violations = [...preservedViolations, ...violations];
  return violations;
}
