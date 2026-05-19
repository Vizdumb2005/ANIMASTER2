// Phase 8 — Task Group 10: Real-Time Cinematic Feedback System

import type { SceneGraph } from '@animaster/shared/scene';

export interface CinematicFeedback {
  emotionalShift: number;
  pacingShift: number;
  cinematographyShift: number;
  atmosphereShift: number;
  relationalShift: number;
  overallImpact: number;
  description: string;
}

export function computeFeedback(before: SceneSnapshot, after: SceneSnapshot): CinematicFeedback {
  const emotionalShift = computeEmotionalDelta(before, after);
  const pacingShift = computePacingDelta(before, after);
  const cinematographyShift = computeCameraDelta(before, after);
  const atmosphereShift = computeAtmosphereDelta(before, after);
  const relationalShift = computeRelationalDelta(before, after);

  const overallImpact = (
    Math.abs(emotionalShift) * 0.3 +
    Math.abs(pacingShift) * 0.15 +
    Math.abs(cinematographyShift) * 0.2 +
    Math.abs(atmosphereShift) * 0.2 +
    Math.abs(relationalShift) * 0.15
  );

  const description = buildFeedbackDescription(emotionalShift, pacingShift, cinematographyShift, atmosphereShift, relationalShift);

  return { emotionalShift, pacingShift, cinematographyShift, atmosphereShift, relationalShift, overallImpact, description };
}

export interface SceneSnapshot {
  tone: string;
  tension: number;
  tempo: string;
  cameraMode: string;
  cameraZoom: number;
  ambientIntensity: number;
  lightingTint: string;
  effectCount: number;
  actorEmotions: string[];
  relationshipTypes: string[];
}

export function captureSceneSnapshot(scene: SceneGraph): SceneSnapshot {
  return {
    tone: scene.cinematicGrammar?.tone ?? 'neutral',
    tension: scene.tensionState?.currentLevel ?? 0,
    tempo: scene.rhythm?.tempo ?? 'medium',
    cameraMode: scene.camera?.mode ?? 'static',
    cameraZoom: scene.camera?.zoom ?? 1,
    ambientIntensity: scene.atmosphere?.ambientIntensity ?? 1,
    lightingTint: scene.atmosphere?.lightingTint ?? 'rgba(0,0,0,0)',
    effectCount: scene.atmosphere?.effects?.filter((e) => e !== 'none').length ?? 0,
    actorEmotions: scene.actors.map((a) => a.emotionState),
    relationshipTypes: (scene.relationships ?? []).map((r) => r.type),
  };
}

function computeEmotionalDelta(before: SceneSnapshot, after: SceneSnapshot): number {
  let delta = 0;
  if (before.tone !== after.tone) delta += 0.5;
  delta += Math.abs(before.tension - after.tension);
  const emotionChanges = after.actorEmotions.filter((e, i) => before.actorEmotions[i] !== e).length;
  delta += emotionChanges * 0.3;
  return Math.min(delta, 1);
}

function computePacingDelta(before: SceneSnapshot, after: SceneSnapshot): number {
  if (before.tempo === after.tempo) return 0;
  const tempoValues: Record<string, number> = { slow: 0, medium: 0.5, fast: 1 };
  return Math.abs((tempoValues[before.tempo] ?? 0.5) - (tempoValues[after.tempo] ?? 0.5));
}

function computeCameraDelta(before: SceneSnapshot, after: SceneSnapshot): number {
  let delta = 0;
  if (before.cameraMode !== after.cameraMode) delta += 0.4;
  delta += Math.abs(before.cameraZoom - after.cameraZoom) * 0.5;
  return Math.min(delta, 1);
}

function computeAtmosphereDelta(before: SceneSnapshot, after: SceneSnapshot): number {
  let delta = 0;
  delta += Math.abs(before.ambientIntensity - after.ambientIntensity) * 0.8;
  if (before.lightingTint !== after.lightingTint) delta += 0.3;
  delta += Math.abs(before.effectCount - after.effectCount) * 0.2;
  return Math.min(delta, 1);
}

function computeRelationalDelta(before: SceneSnapshot, after: SceneSnapshot): number {
  if (before.relationshipTypes.length === 0 && after.relationshipTypes.length === 0) return 0;
  const changes = after.relationshipTypes.filter((t, i) => before.relationshipTypes[i] !== t).length;
  return Math.min(changes * 0.3, 1);
}

function buildFeedbackDescription(emotional: number, pacing: number, camera: number, atmosphere: number, relational: number): string {
  const parts: string[] = [];
  if (Math.abs(emotional) > 0.2) parts.push(emotional > 0 ? 'Emotional intensity increased' : 'Emotional tone shifted');
  if (Math.abs(pacing) > 0.1) parts.push(pacing > 0 ? 'Pacing quickened' : 'Pacing slowed');
  if (Math.abs(camera) > 0.15) parts.push('Camera adjusted');
  if (Math.abs(atmosphere) > 0.1) parts.push('Atmosphere evolved');
  if (Math.abs(relational) > 0.1) parts.push('Relationships shifted');
  return parts.length > 0 ? parts.join(', ') : 'Subtle adjustment applied';
}
