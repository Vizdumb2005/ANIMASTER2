import type { SceneGraph, TensionState } from '@animaster/shared/scene';

export function accumulateTension(scene: SceneGraph, existing: TensionState | undefined, deltaMs: number): TensionState {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actors = scene.actors;
  const relationships = scene.relationships ?? [];

  const current = existing ?? {
    currentLevel: 0,
    peakLevel: 0,
    escalationRate: 0,
    compressionFactor: 1,
    cameraIntensityBoost: 0
  };

  let targetRate = 0;

  if (tone === 'tense' || tone === 'threatening') targetRate += 0.3;
  if (tone === 'awkward') targetRate += 0.15;

  const hasConfrontation = relationships.some((r) => r.type === 'confronting');
  const hasApproach = relationships.some((r) => r.type === 'approaching');
  if (hasConfrontation) targetRate += 0.4;
  if (hasApproach) targetRate += 0.2;

  const hasAngry = actors.some((a) => a.emotionState === 'angry');
  const hasNervous = actors.some((a) => a.emotionState === 'nervous');
  if (hasAngry) targetRate += 0.25;
  if (hasNervous) targetRate += 0.1;

  if (actors.length >= 2) {
    const dx = Math.abs(actors[0].position.x - actors[1].position.x);
    const envWidth = scene.environment.width;
    if (dx / envWidth < 0.15) targetRate += 0.2;
  }

  const escalationRate = current.escalationRate + (targetRate - current.escalationRate) * 0.05;
  const increment = escalationRate * (deltaMs / 1000) * 0.1;
  const decay = current.currentLevel * 0.002;
  const newLevel = Math.max(0, Math.min(1, current.currentLevel + increment - decay));
  const peakLevel = Math.max(current.peakLevel, newLevel);

  const compressionFactor = 1 - newLevel * 0.4;
  const cameraIntensityBoost = newLevel * 0.5;

  return { currentLevel: newLevel, peakLevel, escalationRate, compressionFactor, cameraIntensityBoost };
}
