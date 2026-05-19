import type {
  SemanticWorldPlan, WorldLayout, SceneGraph,
  VisualStyleProfile, EnvironmentCinematicInfluence,
} from '@animaster/shared/scene';
import { getEnvironmentGrammar, resolveLightingForTone, resolveCompositionForTone } from './environmentGrammar';
import { resolveLayout } from './semanticLayoutResolver';
import { distributeProps, filterPropsForTone } from './propDistribution';
import { adjustZonesForTone } from './compositionZones';
import { getVisualStyleProfile } from './visualStyleProfiles';
import { resolveEnvironmentInfluence } from './cinematicEnvironmentLogic';

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateWorldPlan(scene: SceneGraph): SemanticWorldPlan {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const envType = scene.environment?.type ?? 'indoor_room';
  const grammar = getEnvironmentGrammar(envType);
  const effects = scene.atmosphere?.effects ?? [];

  let weather: SemanticWorldPlan['weather'] = 'clear';
  if (effects.includes('rain')) weather = 'rain';
  else if (effects.includes('snow')) weather = 'snow';
  else if (effects.includes('fog')) weather = 'fog';

  const lightingLanguage = resolveLightingForTone(tone, grammar);
  const compositionStyle = resolveCompositionForTone(tone, grammar);

  const tint = scene.atmosphere?.lightingTint ?? '';
  let timeOfDay: SemanticWorldPlan['timeOfDay'] = 'evening';
  if (tint.includes('warm') || tone === 'romantic') timeOfDay = 'evening';
  else if (tint.includes('cold') || tone === 'lonely' || tone === 'sad') timeOfDay = 'night';
  else if (tone === 'energetic') timeOfDay = 'afternoon';
  else if (tone === 'threatening') timeOfDay = 'late_night';

  const layoutStyle = grammar.layoutPatterns[0];

  const cameraLanguageMap: Record<string, SemanticWorldPlan['cameraLanguage']> = {
    neutral: 'steady_observe',
    lonely: 'slow_isolation',
    tense: 'tight_tension',
    sad: 'drift_melancholy',
    romantic: 'steady_observe',
    threatening: 'handheld_anxiety',
    awkward: 'steady_observe',
    energetic: 'wide_establishing',
  };

  const emotionalEnergyMap: Record<string, number> = {
    neutral: 0.5, lonely: 0.2, tense: 0.8, sad: 0.3,
    romantic: 0.5, threatening: 0.9, awkward: 0.4, energetic: 0.9,
  };

  return {
    locationType: envType as SemanticWorldPlan['locationType'],
    timeOfDay,
    tone,
    weather,
    layoutStyle,
    visualDensity: grammar.defaultDensity,
    lightingLanguage,
    compositionStyle,
    cameraLanguage: cameraLanguageMap[tone] ?? 'steady_observe',
    keyProps: grammar.propPools.slice(0, 4),
    emotionalEnergy: emotionalEnergyMap[tone] ?? 0.5,
  };
}

export function generateWorldLayout(plan: SemanticWorldPlan, seed: number): WorldLayout {
  const grammar = getEnvironmentGrammar(plan.locationType);
  const rng = seededRandom(seed);

  // Resolve composition zones
  let zones = resolveLayout({
    layoutStyle: plan.layoutStyle,
    compositionStyle: plan.compositionStyle,
    visualDensity: plan.visualDensity,
    isIndoor: grammar.isIndoor,
    depthLayers: grammar.depthLayers,
  }, seed);

  // Adjust zones for emotional tone
  zones = adjustZonesForTone(zones, plan.tone);

  // Distribute props
  let props = distributeProps({
    propPool: grammar.propPools,
    zones,
    density: plan.visualDensity,
    tone: plan.tone,
    keyProps: plan.keyProps,
    seed: seed + 1000,
  });

  // Filter props for tone
  props = filterPropsForTone(props, plan.tone);

  return {
    zones,
    props,
    depthLayers: grammar.depthLayers,
    groundVariation: grammar.groundVariation,
    skylineType: grammar.skylineType,
    fogLayers: grammar.fogLayers,
  };
}

export function applyWorldGeneration(scene: SceneGraph): void {
  const seed = scene.seed ?? Date.now();

  const worldPlan = generateWorldPlan(scene);
  const worldLayout = generateWorldLayout(worldPlan, seed);
  const visualStyle = getVisualStyleProfile(worldPlan.visualStyle ?? 'default', worldPlan.tone);
  const environmentInfluence = resolveEnvironmentInfluence(
    worldPlan.locationType,
    worldPlan.tone,
    worldPlan.layoutStyle,
  );

  scene.worldPlan = worldPlan;
  scene.worldLayout = worldLayout;
  scene.visualStyle = visualStyle;
  scene.environmentInfluence = environmentInfluence;
}
