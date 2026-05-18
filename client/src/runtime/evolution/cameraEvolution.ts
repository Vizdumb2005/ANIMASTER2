import type { Camera, SceneGraph } from '@animaster/shared/scene';
import { getEvolutionTrend } from './sceneEvolutionEvaluator';

export function evolveCameraIntensity(camera: Camera, scene: SceneGraph): Camera {
  if (!scene.sceneEvolution || !camera.shot) return camera;

  const intensityTrend = getEvolutionTrend(scene.sceneEvolution.intensityTrajectory);
  const zoomTrend = getEvolutionTrend(scene.sceneEvolution.cameraZoomTrajectory);

  if (intensityTrend > 0.05 && zoomTrend < 0.05) {
    camera.shot.targetZoom = Math.min(camera.shot.targetZoom + 0.005, 2.2);
  } else if (intensityTrend < -0.05 && zoomTrend > -0.05) {
    camera.shot.targetZoom = Math.max(camera.shot.targetZoom - 0.003, 0.5);
  }

  return camera;
}
