import type { Camera, ReactionStep } from '@animaster/shared/scene';

export function applyReactionCameraEffect(camera: Camera, step: ReactionStep, progress: number): Camera {
  const shot = camera.shot;
  if (!shot) return camera;

  const ease = Math.sin(progress * Math.PI);

  switch (step.action) {
    case 'glance':
      shot.targetX += ease * 3;
      break;
    case 'freeze':
      shot.transitionProgress = Math.max(shot.transitionProgress, 0.95);
      break;
    case 'step_back':
      shot.targetZoom = Math.max(shot.targetZoom - ease * 0.05, 0.5);
      break;
    case 'collapse':
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.1, 2.2);
      break;
    case 'approach':
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.06, 2.0);
      break;
    case 'recoil':
      shot.targetZoom = Math.max(shot.targetZoom - ease * 0.08, 0.6);
      break;
    case 'look_away':
      shot.targetX += ease * 4;
      break;
  }

  return camera;
}
