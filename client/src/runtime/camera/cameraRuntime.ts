import type { CameraMode, SceneGraph } from '@animaster/shared/scene';
import type { RhythmRuntimeProfile, ToneRuntimeProfile } from '../semanticProfiles';
import { sceneStore } from '../../store/sceneStore';
import type { ShotDefinition } from '@animaster/shared/cinematicShots';

export function evaluateCameraRuntime(scene: SceneGraph, width: number, height: number, tone: ToneRuntimeProfile, rhythm: RhythmRuntimeProfile) {
  const subjects = resolveSubjects(scene);
  const mode: CameraMode = scene.camera.plan?.mode ?? scene.camera.mode ?? tone.cameraMode;
  scene.camera.mode = mode;

  let targetX = scene.camera.x;
  let targetY = scene.camera.y;
  let targetZoom = scene.camera.zoom;

  const first = subjects[0] ?? scene.actors[0];
  if (mode === 'wide_shot') {
    targetZoom = 0.7 * (scene.cinematicGrammar?.template?.headroom ?? tone.negativeSpace);
    targetX = width * 0.5 - scene.environment.width * 0.5 * targetZoom;
    targetY = height * 0.5 - scene.environment.height * 0.5 * targetZoom;
  } else if (mode === 'close_up' && first) {
    targetZoom = 1.8;
    targetX = width * 0.5 - first.position.x * targetZoom;
    targetY = height * 0.35 - first.position.y * targetZoom;
  } else if (mode === 'tension' && scene.actors.length >= 2) {
    const a = scene.actors[0];
    const b = scene.actors[1];
    targetZoom = 1.12;
    targetX = width * 0.5 - ((a.position.x + b.position.x) * 0.5) * targetZoom;
    targetY = height * 0.45 - ((a.position.y + b.position.y) * 0.5) * targetZoom;
  } else if (mode === 'over_the_shoulder' && scene.actors.length >= 2) {
    const a = scene.actors[0];
    const b = scene.actors[1];
    targetZoom = 1.3;
    targetX = width * 0.4 - (a.position.x * 0.7 + b.position.x * 0.3) * targetZoom;
    targetY = height * 0.4 - a.position.y * targetZoom;
  } else if (mode === 'dramatic_zoom' && first) {
    targetZoom = 2.1;
    targetX = width * 0.5 - first.position.x * targetZoom;
    targetY = height * 0.4 - first.position.y * targetZoom;
  } else if ((mode === 'follow' || scene.camera.plan?.framingIntent === 'follow') && first) {
    targetZoom = scene.camera.zoom || 1;
    targetX = width * 0.5 - first.position.x * targetZoom;
    targetY = height * 0.5 - first.position.y * targetZoom;
  }

  const shot = scene.camera.shot ?? { x: scene.camera.x, y: scene.camera.y, zoom: scene.camera.zoom, targetX, targetY, targetZoom, transitionProgress: 0, subjectIds: [] };
  const smoothing = scene.camera.plan?.transition === 'cut' ? 1 : rhythm.cameraSmoothing;
  shot.targetX = targetX;
  shot.targetY = targetY;
  shot.targetZoom = targetZoom;
  shot.x += (targetX - shot.x) * smoothing;
  shot.y += (targetY - shot.y) * smoothing;
  shot.zoom += (targetZoom - shot.zoom) * smoothing;
  shot.transitionProgress = Math.min(1, shot.transitionProgress + smoothing);
  shot.subjectIds = subjects.map((actor) => actor.id);
  scene.camera.shot = shot;
  scene.camera.x = shot.x;
  scene.camera.y = shot.y;
  scene.camera.zoom = shot.zoom;
}

function resolveSubjects(scene: SceneGraph) {
  const subjectIds = scene.camera.plan?.subjectIds ?? [];
  const subjects = subjectIds.map((id) => scene.actors.find((actor) => actor.id === id)).filter(Boolean) as typeof scene.actors;
  return subjects.length > 0 ? subjects : scene.actors.slice(0, scene.cinematicGrammar?.tone === 'lonely' ? 1 : 2);
}

// Phase 8 — Shot transition integration
// Apply shot definition with smooth camera transitions

interface ShotTransitionState {
  isTransitioning: boolean;
  startTime: number;
  duration: number;
  startZoom: number;
  targetZoom: number;
}

let currentShotTransition: ShotTransitionState | null = null;

export function applyShotWithTransition(shot: ShotDefinition): void {
  const scene = sceneStore.getScene();
  const currentZoom = scene.camera.zoom ?? 1;
  const targetZoom = (shot.zoomRange.min + shot.zoomRange.max) / 2;
  
  // Set up transition state
  currentShotTransition = {
    isTransitioning: true,
    startTime: Date.now(),
    duration: Math.round(shot.transitionSpeed * 1500), // Convert 0-1 speed to ms
    startZoom: currentZoom,
    targetZoom,
  };
}

export function isShotTransitioning(): boolean {
  if (!currentShotTransition) return false;
  
  const elapsed = Date.now() - currentShotTransition.startTime;
  if (elapsed >= currentShotTransition.duration) {
    currentShotTransition = null;
    return false;
  }
  return true;
}

export function getShotTransitionProgress(): number {
  if (!currentShotTransition) return 1;
  
  const elapsed = Date.now() - currentShotTransition.startTime;
  const progress = elapsed / currentShotTransition.duration;
  return Math.min(progress, 1);
}

export function getShotTransitionZoom(): number {
  if (!currentShotTransition) return 1;
  
  const progress = getShotTransitionProgress();
  // Ease in-out cubic
  const eased = progress < 0.5
    ? 4 * progress * progress * progress
    : 1 - Math.pow(-2 * progress + 2, 3) / 2;
  
  return currentShotTransition.startZoom + 
    (currentShotTransition.targetZoom - currentShotTransition.startZoom) * eased;
}
