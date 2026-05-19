// Phase 7 — Task Group 6: Context Assembler
// Distills semantic context for LLM consumption — NOT raw runtime dumps

import { sceneMemory } from '../../memory/sceneMemory.js';

export interface SemanticContext {
  sceneSummary: string;
  emotionalState: {
    dominantEmotion: string;
    intensity: number;
    trajectory: string;
    sustainedTensionMs: number;
  };
  cinematicState: {
    currentTone: string;
    cameraMode: string;
    lightingLanguage: string;
    pacingStyle: string;
  };
  environmentState: {
    locationType: string;
    density: string;
    mood: string;
    activeEffects: string[];
  };
  relationshipState: Array<{
    actorA: string;
    actorB: string;
    currentType: string;
    evolution: string[];
  }>;
  unresolvedTensions: string[];
  activeMotifs: string[];
  pacingSummary: string;
  sceneCount: number;
}

export function assembleContext(
  currentScene: {
    tone: string;
    environment: { type: string; density?: string; mood?: string };
    actors: Array<{ id: string; emotionState: string }>;
    camera?: { mode: string };
    atmosphere?: { effects: string[]; lightingTint: string };
    cinematicGrammar?: { pacing?: string };
  }
): SemanticContext {
  const emotionalMemory = sceneMemory.getEmotionalState();
  const continuityMemory = sceneMemory.getContinuityState();
  const recentHistory = sceneMemory.getRecentHistory(3);

  const emotionIntensity = emotionalMemory.lastPeakIntensity || 0.5;
  const trajectory = emotionalMemory.emotionalHistory.length > 2
    ? computeTrajectory(emotionalMemory.emotionalHistory.slice(-3).map(h => h.intensity))
    : 'stable';

  const sceneSummary = buildSceneSummary(currentScene, recentHistory.length);
  const pacingSummary = buildPacingSummary(currentScene.cinematicGrammar?.pacing, emotionalMemory.sustainedTensionMs);

  return {
    sceneSummary,
    emotionalState: {
      dominantEmotion: emotionalMemory.dominantEmotion,
      intensity: emotionIntensity,
      trajectory,
      sustainedTensionMs: emotionalMemory.sustainedTensionMs
    },
    cinematicState: {
      currentTone: currentScene.tone,
      cameraMode: currentScene.camera?.mode ?? 'static',
      lightingLanguage: currentScene.atmosphere?.lightingTint ?? 'neutral',
      pacingStyle: currentScene.cinematicGrammar?.pacing ?? 'medium'
    },
    environmentState: {
      locationType: currentScene.environment.type,
      density: currentScene.environment.density ?? 'moderate',
      mood: currentScene.environment.mood ?? 'neutral',
      activeEffects: currentScene.atmosphere?.effects ?? []
    },
    relationshipState: continuityMemory.relationshipEvolution.map(r => ({
      actorA: r.actorAId,
      actorB: r.actorBId,
      currentType: r.typeHistory[r.typeHistory.length - 1] ?? 'neutral',
      evolution: r.typeHistory
    })),
    unresolvedTensions: continuityMemory.unresolvedTensions,
    activeMotifs: continuityMemory.activeMotifs,
    pacingSummary,
    sceneCount: sceneMemory.getEntries().length
  };
}

function computeTrajectory(intensities: number[]): string {
  if (intensities.length < 2) return 'stable';
  const trend = intensities[intensities.length - 1] - intensities[0];
  if (trend > 0.2) return 'escalating';
  if (trend < -0.2) return 'de-escalating';
  return 'stable';
}

function buildSceneSummary(
  scene: { tone: string; environment: { type: string }; actors: Array<{ id: string; emotionState: string }> },
  historyLength: number
): string {
  const actorDesc = scene.actors.length === 0 ? 'empty scene'
    : scene.actors.length === 1 ? `1 actor (${scene.actors[0].emotionState})`
    : `${scene.actors.length} actors`;
  return `${scene.tone} ${scene.environment.type} scene with ${actorDesc}. Scene ${historyLength + 1} in sequence.`;
}

function buildPacingSummary(pacing: string | undefined, sustainedTensionMs: number): string {
  const base = pacing ?? 'medium';
  if (sustainedTensionMs > 10000) return `${base} pacing with prolonged tension (${Math.round(sustainedTensionMs / 1000)}s sustained)`;
  return `${base} pacing`;
}
