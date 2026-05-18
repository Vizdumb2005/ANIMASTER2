import type { SceneGraph, AtmosphereEffect } from '@animaster/shared/scene';

export interface EnvironmentReaction {
  suggestedEffects: string[];
  lightingShift: string | null;
  ambientIntensityDelta: number;
  emptinessLevel: number;
}

export function reactEnvironmentToEmotion(scene: SceneGraph): EnvironmentReaction {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const tension = scene.tensionState?.currentLevel ?? 0;
  const actorCount = scene.actors.length;
  const hasRelationship = (scene.relationships ?? []).length > 0;

  const suggestedEffects: string[] = [];
  let lightingShift: string | null = null;
  let ambientIntensityDelta = 0;
  let emptinessLevel = 0;

  switch (tone) {
    case 'lonely':
      emptinessLevel = 0.8;
      lightingShift = 'cold';
      ambientIntensityDelta = -0.15;
      if (actorCount <= 1) emptinessLevel = 1.0;
      break;
    case 'sad':
      emptinessLevel = 0.6;
      lightingShift = 'cold';
      ambientIntensityDelta = -0.1;
      break;
    case 'tense':
      emptinessLevel = 0.3;
      ambientIntensityDelta = -0.05;
      if (tension > 0.5) suggestedEffects.push('flicker');
      break;
    case 'threatening':
      emptinessLevel = 0.4;
      lightingShift = 'cold';
      ambientIntensityDelta = -0.2;
      suggestedEffects.push('flicker');
      break;
    case 'romantic':
      emptinessLevel = 0.1;
      lightingShift = 'warm';
      ambientIntensityDelta = 0.05;
      break;
    case 'awkward':
      emptinessLevel = 0.5;
      break;
  }

  if (!hasRelationship && actorCount <= 1) {
    emptinessLevel = Math.max(emptinessLevel, 0.5);
  }

  return { suggestedEffects, lightingShift, ambientIntensityDelta, emptinessLevel };
}

export function applyEnvironmentReaction(scene: SceneGraph, reaction: EnvironmentReaction): SceneGraph {
  if (!scene.atmosphere) return scene;

  const existingEffects: AtmosphereEffect[] = scene.atmosphere.effects.filter((e): e is AtmosphereEffect => e !== 'none');
  for (const effect of reaction.suggestedEffects) {
    const typed = effect as AtmosphereEffect;
    if (!existingEffects.includes(typed)) {
      existingEffects.push(typed);
    }
  }

  const finalEffects: AtmosphereEffect[] = existingEffects.length > 0 ? existingEffects : ['none'];
  const updatedAtmosphere = {
    ...scene.atmosphere,
    effects: finalEffects,
    ambientIntensity: Math.max(0.2, Math.min(1.2, scene.atmosphere.ambientIntensity + reaction.ambientIntensityDelta))
  };

  if (reaction.lightingShift && scene.atmosphere.lightingTint === 'rgba(0,0,0,0)') {
    updatedAtmosphere.lightingTint = reaction.lightingShift;
  }

  return { ...scene, atmosphere: updatedAtmosphere, environmentReaction: reaction };
}
