import type { SceneGraph, SceneTone, CameraMode, AtmosphereEffect } from '@animaster/shared/scene';
import type { DirectorCommand } from '../../director/directorCommandParser';
import { sceneStore } from '../../store/sceneStore';
import { getTemplateForTone } from '../cinematicGrammarRegistry';

export function applyLiveMutation(command: DirectorCommand, scene: SceneGraph): string {
  const effects: string[] = [];

  if (command.type === 'compound' && command.subCommands) {
    for (const sub of command.subCommands) {
      const effect = applySingleMutation(sub, scene);
      if (effect) effects.push(effect);
    }
  } else {
    const effect = applySingleMutation(command, scene);
    if (effect) effects.push(effect);
  }

  if (effects.length === 0) {
    effects.push(applySemanticFallback(command.rawInput, scene));
  }

  return effects.join(' | ');
}

function applySingleMutation(command: DirectorCommand, scene: SceneGraph): string {
  switch (command.type) {
    case 'tone': return applyToneMutation(command, scene);
    case 'emotion': return applyEmotionMutation(command, scene);
    case 'camera': return applyCameraMutation(command, scene);
    case 'atmosphere': return applyAtmosphereMutation(command, scene);
    case 'pacing': return applyPacingMutation(command, scene);
    case 'spacing': return applySpacingMutation(command, scene);
    case 'lighting': return applyLightingMutation(command, scene);
    default: return '';
  }
}

function applyToneMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.tone) return '';
  const template = getTemplateForTone(command.tone);

  sceneStore.mutateScene((draft) => {
    draft.cinematicGrammar = { tone: command.tone!, template };
    // Clear Phase 2.6/2.7 state for recomputation
    draft.emotionalSpatial = undefined;
    draft.beatSequence = undefined;
    draft.emotionalArc = undefined;
    draft.storyAnchors = undefined;
  });

  return `Tone -> ${command.tone}`;
}

function applyEmotionMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.emotion) return '';
  const { target, emotion, intensity } = command.emotion;

  sceneStore.mutateScene((draft) => {
    const actor = draft.actors.find((a) => a.id === target);
    if (actor) {
      actor.emotionState = emotion;
      actor.emotionIntensity = intensity;
    }
  });

  const actorLabel = scene.actors.find((a) => a.id === target)?.label ?? target;
  return `${actorLabel} -> ${emotion} (${Math.round(intensity * 100)}%)`;
}

function applyCameraMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.camera) return '';
  const { mode, push, speed } = command.camera;

  sceneStore.mutateScene((draft) => {
    if (mode) draft.camera.mode = mode;
    if (push && draft.camera.shot) {
      const transitionSpeed = speed ?? 0.6;
      draft.camera.shot.targetZoom = Math.max(0.5, Math.min(2.5, draft.camera.shot.zoom + push));
      draft.camera.shot.transitionProgress = 1 - transitionSpeed;
    }
  });

  return `Camera -> ${mode ?? 'adjusted'}${push ? ` (${push > 0 ? 'push in' : 'pull back'})` : ''}`;
}

function applyAtmosphereMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.atmosphere) return '';
  const { effect, intensity } = command.atmosphere;

  sceneStore.mutateScene((draft) => {
    if (effect) {
      const validEffects = ['rain', 'fog', 'flicker', 'dust', 'snow', 'embers'] as const;
      type ValidEffect = typeof validEffects[number];
      const isValid = (e: string): e is ValidEffect => (validEffects as readonly string[]).includes(e);
      if (isValid(effect)) {
        const currentEffects = draft.atmosphere.effects.filter((e) => e !== 'none');
        if (!currentEffects.includes(effect)) {
          draft.atmosphere.effects = [...currentEffects, effect];
        }
      }
    }
    if (intensity !== undefined) {
      draft.atmosphere.ambientIntensity = Math.max(0.2, Math.min(1.2, draft.atmosphere.ambientIntensity * intensity));
    }
  });

  return `Atmosphere + ${effect ?? 'adjusted'}`;
}

function applyPacingMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.pacing) return '';
  const { tempo, pauseWeight } = command.pacing;

  sceneStore.mutateScene((draft) => {
    if (tempo) draft.rhythm.tempo = tempo;
    if (pauseWeight !== undefined) {
      draft.rhythm.pauseFrequencyPerMinute = Math.round(pauseWeight * 12);
      draft.rhythm.motionEnergyCurve = pauseWeight > 0.7 ? 'ease-out' : 'linear';
    }
  });

  return `Pacing -> ${tempo ?? 'adjusted'}${pauseWeight ? ` (pause: ${Math.round(pauseWeight * 100)}%)` : ''}`;
}

function applySpacingMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.spacing) return '';
  const { delta, intent } = command.spacing;

  sceneStore.mutateScene((draft) => {
    if (draft.actors.length >= 2) {
      const mid = (draft.actors[0].position.x + draft.actors[1].position.x) / 2;
      draft.actors[0].position.x = mid - Math.abs(delta);
      draft.actors[0].targetPosition = { x: mid - Math.abs(delta), y: draft.actors[0].position.y };
      draft.actors[1].position.x = mid + Math.abs(delta);
      draft.actors[1].targetPosition = { x: mid + Math.abs(delta), y: draft.actors[1].position.y };
    }
  });

  return `Spacing: ${intent} (${delta > 0 ? '+' : ''}${delta}px)`;
}

function applyLightingMutation(command: DirectorCommand, scene: SceneGraph): string {
  if (!command.lighting) return '';
  const { tint, ambientDelta } = command.lighting;

  sceneStore.mutateScene((draft) => {
    if (tint) draft.atmosphere.lightingTint = tint;
    if (ambientDelta !== undefined) {
      draft.atmosphere.ambientIntensity = Math.max(0.2, Math.min(1.5, draft.atmosphere.ambientIntensity + ambientDelta));
    }
  });

  return `Lighting: ${tint ?? ''}${ambientDelta ? ` (${ambientDelta > 0 ? 'brighter' : 'dimmer'})` : ''}`;
}

function applySemanticFallback(input: string, scene: SceneGraph): string {
  // For unrecognized commands, attempt a tonal interpretation
  if (/feel|make.*feel/i.test(input)) {
    sceneStore.mutateScene((draft) => {
      if (draft.atmosphere.ambientIntensity > 0.5) {
        draft.atmosphere.ambientIntensity -= 0.1;
      }
      draft.rhythm.motionEnergyCurve = 'ease-out';
    });
    return 'Applied subtle mood shift';
  }
  return 'No matching directive found';
}
