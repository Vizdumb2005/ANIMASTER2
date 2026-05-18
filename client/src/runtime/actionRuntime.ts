import type { ActionInstance, ActionTarget, ActionType, Actor, ActorAction, SceneGraph, Vector2 } from '@animaster/shared/scene';
import { initActorJoints } from './initActorJoints';
import { findAnchor } from './semanticAnchors';
import type { RhythmRuntimeProfile, ToneRuntimeProfile } from './semanticProfiles';

const legacyActionMap: Record<ActorAction, ActionType> = {
  idle: 'idle',
  walking: 'walkingTo',
  sitting: 'sittingDown',
  approaching: 'approaching',
  pacing: 'pacing'
};

export function createAction(type: ActionType, options: Partial<ActionInstance> & { target?: ActionTarget | null; reason?: string } = {}): ActionInstance {
  return {
    id: options.id ?? `action_${type}_${Math.abs(hash(`${type}:${options.reason ?? ''}:${options.priority ?? 0}`))}`,
    type,
    target: options.target ?? null,
    semanticReason: options.semanticReason ?? options.reason ?? type,
    phase: options.phase ?? 'queued',
    startedAt: options.startedAt ?? 0,
    duration: options.duration ?? defaultDuration(type),
    priority: options.priority ?? 1,
    interruptible: options.interruptible ?? type !== 'sittingDown',
    status: options.status ?? 'queued'
  };
}

export function normalizeActorActions(actor: Actor, scene: SceneGraph): Actor {
  if (actor.activeAction || (actor.actionPlan && actor.actionPlan.length > 0)) return actor;

  const activeType = legacyActionMap[actor.currentAction] ?? 'idle';
  actor.activeAction = createAction(activeType, {
    target: inferLegacyTarget(actor, activeType, scene),
    reason: `legacy:${actor.currentAction}`,
    phase: 'starting',
    status: 'active',
    startedAt: scene.simulation?.timeMs ?? 0
  });
  actor.actionPlan = actor.actionQueue.map((legacy, index) => createAction(legacyActionMap[legacy] ?? 'idle', {
    target: inferLegacyTarget(actor, legacyActionMap[legacy] ?? 'idle', scene),
    reason: `legacy-queue:${legacy}`,
    priority: 1 - index * 0.01
  }));
  return actor;
}

export function evaluateActionRuntime(actor: Actor, scene: SceneGraph, deltaMs: number, tone: ToneRuntimeProfile, rhythm: RhythmRuntimeProfile): Actor {
  const next = normalizeActorActions(actor, scene);
  if (!next.activeAction || next.activeAction.status !== 'active') {
    promoteNextAction(next, scene);
  }

  const action = next.activeAction;
  if (!action) return next;

  if (next.actingState?.pauseUntil && (scene.simulation?.timeMs ?? 0) < next.actingState.pauseUntil && action.interruptible) {
    updateLegacyAction(next, 'idle');
    next.joints = initActorJoints(next.position);
    return next;
  }

  if (action.phase === 'starting') {
    action.phase = 'executing';
    action.startedAt = scene.simulation?.timeMs ?? 0;
    next.actionElapsed = 0;
  }

  const movementScale = rhythm.tempoMultiplier * tone.motionEnergyScale;
  switch (action.type) {
    case 'walkingTo':
      executeWalkTo(next, action, scene, deltaMs, 1.35 * movementScale);
      break;
    case 'approaching':
      executeWalkTo(next, action, scene, deltaMs, 0.75 * movementScale);
      break;
    case 'sittingDown':
      executeSittingDown(next, action, scene, tone);
      break;
    case 'seated':
      updateLegacyAction(next, 'sitting');
      next.joints = seatedPose(next.position);
      action.phase = 'sustained';
      break;
    case 'waiting':
    case 'idle':
      updateLegacyAction(next, 'idle');
      action.phase = 'sustained';
      break;
    case 'lookingAt':
    case 'hesitating':
      updateLegacyAction(next, 'idle');
      action.phase = 'executing';
      break;
    case 'pacing':
      updateLegacyAction(next, 'pacing');
      executePacing(next, scene, deltaMs, movementScale);
      break;
  }

  if (action.status === 'complete') {
    promoteNextAction(next, scene);
  }
  return next;
}

function promoteNextAction(actor: Actor, scene: SceneGraph) {
  const plan = actor.actionPlan ?? [];
  const nextAction = plan.sort((a, b) => b.priority - a.priority).shift();
  actor.actionPlan = plan.filter((action) => action !== nextAction);
  actor.activeAction = nextAction ?? createAction('idle', { reason: 'sustained idle' });
  actor.activeAction.status = 'active';
  actor.activeAction.phase = 'starting';
  actor.activeAction.startedAt = scene.simulation?.timeMs ?? 0;
  actor.actionElapsed = 0;
  updateLegacyAction(actor, legacyFromAction(actor.activeAction.type));
}

function executeWalkTo(actor: Actor, action: ActionInstance, scene: SceneGraph, deltaMs: number, speed: number) {
  const target = resolveTarget(action.target, scene, actor) ?? actor.targetPosition;
  updateLegacyAction(actor, action.type === 'approaching' ? 'approaching' : 'walking');
  if (!target) {
    action.status = 'complete';
    return;
  }
  actor.targetPosition = target;
  const dx = target.x - actor.position.x;
  const dy = target.y - actor.position.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < 2) {
    actor.position = { ...target };
    actor.targetPosition = null;
    actor.joints = initActorJoints(actor.position);
    action.phase = 'completed';
    action.status = 'complete';
    return;
  }
  const step = Math.min(dist, speed * (deltaMs / 16));
  actor.position.x += (dx / dist) * step;
  actor.position.y += (dy / dist) * step;
  actor.joints = initActorJoints(actor.position);
  const phase = actor.actionElapsed * 0.005 * speed;
  const swing = action.type === 'approaching' ? 12 : 20;
  actor.joints.leftLeg.y += Math.sin(phase) * swing;
  actor.joints.rightLeg.y += Math.sin(phase + Math.PI) * swing;
  actor.joints.leftArm.y += Math.sin(phase + Math.PI) * swing * 0.5;
  actor.joints.rightArm.y += Math.sin(phase) * swing * 0.5;
}

function executeSittingDown(actor: Actor, action: ActionInstance, scene: SceneGraph, tone: ToneRuntimeProfile) {
  const elapsed = Math.max(0, (scene.simulation?.timeMs ?? 0) - action.startedAt);
  const duration = Math.max(500, (action.duration ?? 1000) / Math.max(0.35, tone.motionEnergyScale));
  const progress = Math.min(elapsed / duration, 1);
  const standing = initActorJoints(actor.position);
  const seated = seatedPose(actor.position);
  actor.joints = {
    head: lerp(standing.head, seated.head, progress),
    torso: lerp(standing.torso, seated.torso, progress),
    leftArm: lerp(standing.leftArm, seated.leftArm, progress),
    rightArm: lerp(standing.rightArm, seated.rightArm, progress),
    leftLeg: lerp(standing.leftLeg, seated.leftLeg, progress),
    rightLeg: lerp(standing.rightLeg, seated.rightLeg, progress)
  };
  updateLegacyAction(actor, 'sitting');
  if (progress >= 1) {
    action.status = 'complete';
    actor.activeAction = createAction('seated', { reason: 'completed sittingDown', phase: 'sustained', status: 'active', startedAt: scene.simulation?.timeMs ?? 0, duration: null });
  }
}

function executePacing(actor: Actor, scene: SceneGraph, deltaMs: number, movementScale: number) {
  const dir = Math.sin((scene.simulation?.timeMs ?? 0) * 0.001) > 0 ? 1 : -1;
  actor.position.x += dir * 0.45 * movementScale * (deltaMs / 16);
  actor.joints = initActorJoints(actor.position);
}

function resolveTarget(target: ActionTarget | null, scene: SceneGraph, actor: Actor): Vector2 | null {
  if (!target || target.kind === 'none') return actor.targetPosition;
  if (target.kind === 'position') return target.position;
  if (target.kind === 'anchor') return findAnchor(scene.anchors, target.anchorId)?.position ?? null;
  if (target.kind === 'actor') return scene.actors.find((candidate) => candidate.id === target.actorId)?.position ?? null;
  return null;
}

function inferLegacyTarget(actor: Actor, type: ActionType, scene: SceneGraph): ActionTarget | null {
  if (actor.targetPosition) return { kind: 'position', position: actor.targetPosition };
  if (type === 'sittingDown') {
    const chair = findAnchor(scene.anchors, 'chair');
    if (chair) return { kind: 'anchor', anchorId: chair.id };
  }
  return null;
}

function seatedPose(position: Vector2) {
  return {
    head: { x: position.x, y: position.y - 54 },
    torso: { x: position.x, y: position.y - 22 },
    leftArm: { x: position.x - 30, y: position.y - 6 },
    rightArm: { x: position.x + 30, y: position.y - 6 },
    leftLeg: { x: position.x - 20, y: position.y + 20 },
    rightLeg: { x: position.x + 20, y: position.y + 20 }
  };
}

function defaultDuration(type: ActionType): number | null {
  if (type === 'sittingDown') return 1000;
  if (type === 'hesitating') return 500;
  if (type === 'lookingAt') return 800;
  if (type === 'seated' || type === 'waiting' || type === 'idle') return null;
  return null;
}

function legacyFromAction(type: ActionType): ActorAction {
  if (type === 'walkingTo') return 'walking';
  if (type === 'sittingDown' || type === 'seated') return 'sitting';
  if (type === 'approaching') return 'approaching';
  if (type === 'pacing') return 'pacing';
  return 'idle';
}

function updateLegacyAction(actor: Actor, action: ActorAction) {
  actor.currentAction = action;
  actor.actionQueue = actor.actionPlan?.map((item) => legacyFromAction(item.type)) ?? [];
}

function lerp(from: Vector2, to: Vector2, amount: number): Vector2 {
  return { x: from.x + (to.x - from.x) * amount, y: from.y + (to.y - from.y) * amount };
}

function hash(input: string) {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = Math.imul(31, h) + input.charCodeAt(i) | 0;
  return h;
}
