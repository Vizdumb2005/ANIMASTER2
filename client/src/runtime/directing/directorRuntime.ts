// Phase 8 — Task Group 11: Director Runtime Subsystem

import type { SceneGraph, SceneTone } from '@animaster/shared/scene';
import { getStyleForTone, type DirectorialStyle } from '@animaster/shared/directorialStyles';
import { deriveEmotionalSpaceFromTone, computeEmotionalSpaceEffect, createDefaultEmotionalSpace, type EmotionalSpaceState } from '@animaster/shared/emotionalSpace';

let activeStyle: DirectorialStyle | null = null;
let emotionalSpace: EmotionalSpaceState = createDefaultEmotionalSpace();

export function evaluateDirectorRuntime(scene: SceneGraph): void {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';

  // Resolve directorial style from tone
  activeStyle = getStyleForTone(tone);

  // Derive emotional space from tone
  const toneSpace = deriveEmotionalSpaceFromTone(tone);
  emotionalSpace = { ...createDefaultEmotionalSpace(), ...toneSpace };

  // Apply emotional space effects to scene
  const effect = computeEmotionalSpaceEffect(emotionalSpace);

  // Apply style-driven pacing influence
  if (activeStyle) {
    const styleMotionEnergy = activeStyle.movementEnergy;
    const currentEnergy = scene.cinematicGrammar?.template?.motionEnergyScale ?? 1.0;
    const blended = currentEnergy * 0.6 + styleMotionEnergy * 0.4;
    if (scene.cinematicGrammar?.template) {
      scene.cinematicGrammar.template.motionEnergyScale = blended;
    }
  }
}

export function getActiveDirectorialStyle(): DirectorialStyle | null {
  return activeStyle;
}

export function getEmotionalSpaceState(): EmotionalSpaceState {
  return { ...emotionalSpace };
}

export function setEmotionalSpaceDimension(dimension: keyof EmotionalSpaceState, value: number): void {
  emotionalSpace[dimension] = Math.max(-1, Math.min(1, value));
}

export function resetDirectorRuntime(): void {
  activeStyle = null;
  emotionalSpace = createDefaultEmotionalSpace();
}
