import type { Actor, SceneGraph, SemanticMutationOperation } from '@animaster/shared/scene';
import { createAction } from './actionRuntime';
import { createDefaultAnchors, findAnchor } from './semanticAnchors';
import { getToneRuntimeProfile } from './semanticProfiles';
import { getTemplateForTone } from './cinematicGrammarRegistry';

export function applySemanticOperations(scene: SceneGraph, operations: SemanticMutationOperation[]): SceneGraph {
  ensureSemanticRuntimeState(scene);
  for (const operation of operations) {
    const validation = validateOperation(scene, operation);
    if (!validation.valid && !validation.repaired) {
      scene.continuity!.violations.push({
        id: `violation_${scene.continuity!.violations.length + 1}`,
        severity: 'error',
        field: operation.type,
        message: validation.reason,
        repairApplied: false
      });
      continue;
    }
    reduceOperation(scene, operation);
  }
  return scene;
}

export function ensureSemanticRuntimeState(scene: SceneGraph) {
  scene.seed ??= hashSeed(scene.id);
  scene.simulation ??= { tick: 0, timeMs: 0, fixedDeltaMs: 1000 / 60, seed: scene.seed };
  scene.anchors ??= createDefaultAnchors(scene.environment);
  scene.mutationHistory ??= [];
  scene.continuity ??= { lastValidatedVersion: scene.version, actorSnapshots: {}, cameraSnapshot: null, violations: [] };
  scene.camera.shot ??= { x: scene.camera.x, y: scene.camera.y, zoom: scene.camera.zoom, targetX: scene.camera.x, targetY: scene.camera.y, targetZoom: scene.camera.zoom, transitionProgress: 1, subjectIds: [] };
  for (const actor of scene.actors) {
    actor.emotionIntensity ??= actor.emotionState === 'neutral' ? 0 : 1;
    actor.actionPlan ??= [];
  }
}

function reduceOperation(scene: SceneGraph, operation: SemanticMutationOperation) {
  switch (operation.type) {
    case 'SetTone': {
      const template = getTemplateForTone(operation.tone);
      scene.cinematicGrammar = { tone: operation.tone, template };
      const tone = getToneRuntimeProfile(scene);
      scene.camera.mode = tone.cameraMode;
      if (tone.lightingTint) scene.atmosphere.lightingTint = tone.lightingTint;
      if (operation.tone === 'lonely' || operation.tone === 'sad') {
        scene.rhythm = { tempo: 'slow', pauseFrequencyPerMinute: operation.tone === 'lonely' ? 8 : 10, motionEnergyCurve: 'ease-out' };
      } else if (operation.tone === 'energetic') {
        scene.rhythm = { tempo: 'fast', pauseFrequencyPerMinute: 1, motionEnergyCurve: 'sharp' };
      }
      break;
    }
    case 'AdjustLighting':
      if (operation.tint) scene.atmosphere.lightingTint = operation.tint;
      if (typeof operation.ambientIntensity === 'number') scene.atmosphere.ambientIntensity = operation.ambientIntensity;
      break;
    case 'AddAtmosphere': {
      const effects = scene.atmosphere.effects.filter((effect) => effect !== 'none');
      if (operation.effect !== 'none' && !effects.includes(operation.effect)) effects.push(operation.effect);
      scene.atmosphere.effects = effects.length > 0 ? effects : ['none'];
      break;
    }
    case 'QueueActorAction': {
      const actor = findActor(scene, operation.actorId);
      if (actor) {
        actor.actionPlan ??= [];
        const active = actor.activeAction;
        if (active && active.interruptible && operation.action.priority >= active.priority) {
          active.status = 'cancelled';
          active.phase = 'interrupted';
          actor.activeAction = { ...operation.action, status: 'active', phase: 'starting', startedAt: scene.simulation?.timeMs ?? 0 };
        } else {
          actor.actionPlan.push(operation.action);
        }
      }
      break;
    }
    case 'SetActorEmotion': {
      const actor = findActor(scene, operation.actorId);
      if (actor) {
        actor.emotionState = operation.emotion;
        actor.emotionIntensity = operation.intensity ?? 1;
      }
      break;
    }
    case 'RestageScene':
      scene.anchors ??= createDefaultAnchors(scene.environment);
      break;
    case 'MoveActorToAnchor': {
      const actor = findActor(scene, operation.actorId);
      const anchor = findAnchor(scene.anchors, operation.anchorId);
      if (actor && anchor) {
        actor.actionPlan ??= [];
        actor.actionPlan.push(createAction('walkingTo', { target: { kind: 'anchor', anchorId: anchor.id }, reason: operation.reason, priority: 2 }));
      }
      break;
    }
    case 'AdjustRelationship': {
      const idx = scene.relationships.findIndex((rel) =>
        (rel.actorAId === operation.actorAId && rel.actorBId === operation.actorBId) ||
        (rel.actorAId === operation.actorBId && rel.actorBId === operation.actorAId)
      );
      if (idx >= 0) scene.relationships[idx] = { ...scene.relationships[idx], ...operation.patch };
      break;
    }
    case 'FocusCameraOn':
      scene.camera.plan = {
        id: `camera_plan_${scene.version + 1}`,
        mode: scene.camera.mode,
        subjectIds: operation.subjectIds,
        framingIntent: operation.framingIntent,
        transition: 'ease',
        semanticReason: operation.reason,
        holdMs: null
      };
      break;
  }
}

function validateOperation(scene: SceneGraph, operation: SemanticMutationOperation): { valid: boolean; repaired: boolean; reason: string } {
  if (operation.type === 'QueueActorAction' || operation.type === 'SetActorEmotion' || operation.type === 'MoveActorToAnchor') {
    if (!findActor(scene, operation.actorId)) return { valid: false, repaired: false, reason: `Unknown actor ${operation.actorId}` };
  }
  if (operation.type === 'MoveActorToAnchor' && !findAnchor(scene.anchors, operation.anchorId)) {
    scene.anchors = createDefaultAnchors(scene.environment);
    return { valid: Boolean(findAnchor(scene.anchors, operation.anchorId)), repaired: true, reason: 'Regenerated default anchors' };
  }
  return { valid: true, repaired: false, reason: 'ok' };
}

function findActor(scene: SceneGraph, actorId: string): Actor | undefined {
  return scene.actors.find((actor) => actor.id === actorId);
}

function hashSeed(input: string) {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
