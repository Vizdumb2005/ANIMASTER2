// Phase 7 — Task Group 3: Continuity Agent

export interface ContinuityCheck {
  valid: boolean;
  violations: Array<{
    field: string;
    severity: 'warning' | 'error';
    message: string;
    autoRepair: boolean;
  }>;
  repairs: Array<{
    field: string;
    action: string;
  }>;
  reasoning: string;
}

interface ActorSnapshot {
  id: string;
  position: { x: number; y: number };
  emotionState: string;
  currentAction: string;
}

interface SceneSnapshot {
  actors: ActorSnapshot[];
  environment: { type: string };
  tone: string;
  effects: string[];
}

export function checkContinuity(
  previousScene: SceneSnapshot | null,
  currentScene: SceneSnapshot,
  mutationPrompt: string
): ContinuityCheck {
  const violations: ContinuityCheck['violations'] = [];
  const repairs: ContinuityCheck['repairs'] = [];

  if (!previousScene) {
    return { valid: true, violations: [], repairs: [], reasoning: 'First scene — no continuity to check' };
  }

  const isToneChange = /lonely|tense|sad|happy|energetic|threatening|romantic|awkward/i.test(mutationPrompt);
  const isEnvChange = /move to|go to|change.*to|switch.*to/i.test(mutationPrompt);
  const isActorChange = /add|remove|another/i.test(mutationPrompt);

  // Check actor teleportation
  for (const prevActor of previousScene.actors) {
    const currActor = currentScene.actors.find(a => a.id === prevActor.id);
    if (!currActor) {
      if (!isActorChange) {
        violations.push({
          field: `actors.${prevActor.id}`,
          severity: 'error',
          message: `Actor ${prevActor.id} disappeared without removal instruction`,
          autoRepair: true
        });
        repairs.push({
          field: `actors.${prevActor.id}`,
          action: 'restore_actor'
        });
      }
      continue;
    }

    const dx = Math.abs(currActor.position.x - prevActor.position.x);
    const dy = Math.abs(currActor.position.y - prevActor.position.y);
    const teleportThreshold = 300;

    if (dx > teleportThreshold || dy > teleportThreshold) {
      if (!isEnvChange) {
        violations.push({
          field: `actors.${prevActor.id}.position`,
          severity: 'warning',
          message: `Actor ${prevActor.id} teleported ${Math.round(Math.sqrt(dx * dx + dy * dy))}px`,
          autoRepair: false
        });
      }
    }
  }

  // Check environment continuity
  if (previousScene.environment.type !== currentScene.environment.type && !isEnvChange) {
    violations.push({
      field: 'environment.type',
      severity: 'warning',
      message: `Environment changed from ${previousScene.environment.type} to ${currentScene.environment.type} without explicit instruction`,
      autoRepair: true
    });
    repairs.push({
      field: 'environment.type',
      action: `restore_to_${previousScene.environment.type}`
    });
  }

  // Check effect preservation
  if (!isToneChange) {
    for (const effect of previousScene.effects) {
      if (effect !== 'none' && !currentScene.effects.includes(effect)) {
        const effectMentioned = new RegExp(effect, 'i').test(mutationPrompt);
        if (!effectMentioned) {
          violations.push({
            field: `atmosphere.effects`,
            severity: 'warning',
            message: `Effect '${effect}' was dropped without instruction`,
            autoRepair: true
          });
          repairs.push({
            field: 'atmosphere.effects',
            action: `restore_effect_${effect}`
          });
        }
      }
    }
  }

  const valid = violations.filter(v => v.severity === 'error').length === 0;
  const reasons: string[] = [];
  if (violations.length === 0) reasons.push('all continuity checks passed');
  else reasons.push(`${violations.length} violation(s) detected, ${repairs.length} auto-repair(s) available`);

  return {
    valid,
    violations,
    repairs,
    reasoning: reasons.join('; ')
  };
}
