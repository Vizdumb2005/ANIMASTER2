import type { SceneGraph, SceneEvolution } from '@animaster/shared/scene';

const SAMPLE_INTERVAL_MS = 500;
const MAX_SAMPLES = 30;

export function evaluateSceneEvolution(scene: SceneGraph, deltaMs: number): SceneEvolution {
  const prev = scene.sceneEvolution ?? {
    spacingTrajectory: [],
    postureTrajectory: [],
    pacingTrajectory: [],
    cameraZoomTrajectory: [],
    intensityTrajectory: [],
    sampleCount: 0,
    lifetimeMs: 0,
  };

  const updated: SceneEvolution = { ...prev };
  updated.lifetimeMs += deltaMs;

  const shouldSample = updated.lifetimeMs - (updated.sampleCount * SAMPLE_INTERVAL_MS) >= SAMPLE_INTERVAL_MS;
  if (!shouldSample) return updated;

  let spacing = 0;
  if (scene.actors.length >= 2) {
    const a = scene.actors[0];
    const b = scene.actors[1];
    spacing = Math.sqrt((a.position.x - b.position.x) ** 2 + (a.position.y - b.position.y) ** 2);
  }

  let postureScore = 0;
  for (const actor of scene.actors) {
    const headDrop = actor.joints.head.y - (actor.position.y - 58);
    postureScore += Math.abs(headDrop);
  }
  postureScore = scene.actors.length > 0 ? postureScore / scene.actors.length : 0;

  const pacingValue = scene.rhythm.tempo === 'fast' ? 1 : scene.rhythm.tempo === 'medium' ? 0.5 : 0.2;
  const cameraZoom = scene.camera.shot?.zoom ?? scene.camera.zoom;
  const intensity = scene.tensionState?.currentLevel ?? 0;

  updated.spacingTrajectory = [...prev.spacingTrajectory, spacing].slice(-MAX_SAMPLES);
  updated.postureTrajectory = [...prev.postureTrajectory, postureScore].slice(-MAX_SAMPLES);
  updated.pacingTrajectory = [...prev.pacingTrajectory, pacingValue].slice(-MAX_SAMPLES);
  updated.cameraZoomTrajectory = [...prev.cameraZoomTrajectory, cameraZoom].slice(-MAX_SAMPLES);
  updated.intensityTrajectory = [...prev.intensityTrajectory, intensity].slice(-MAX_SAMPLES);
  updated.sampleCount += 1;

  return updated;
}

export function getEvolutionTrend(trajectory: number[]): number {
  if (trajectory.length < 2) return 0;
  const recent = trajectory.slice(-5);
  const older = trajectory.slice(-10, -5);
  if (older.length === 0) return 0;
  const recentAvg = recent.reduce((s, v) => s + v, 0) / recent.length;
  const olderAvg = older.reduce((s, v) => s + v, 0) / older.length;
  return recentAvg - olderAvg;
}
