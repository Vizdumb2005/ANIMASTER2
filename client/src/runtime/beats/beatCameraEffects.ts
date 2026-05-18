import type { Camera, EmotionalBeat } from '@animaster/shared/scene';

export function applyBeatCameraEffects(camera: Camera, beat: EmotionalBeat, progress: number): Camera {
  const ease = Math.sin(progress * Math.PI);
  const shot = camera.shot;
  if (!shot) return camera;

  switch (beat.cameraResponse) {
    case 'push_in':
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.15, 2.5);
      break;
    case 'pull_back':
      shot.targetZoom = Math.max(shot.targetZoom - ease * 0.1, 0.5);
      break;
    case 'hold':
      shot.transitionProgress = Math.max(shot.transitionProgress, 0.95);
      break;
    case 'compress':
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.08, 2.0);
      break;
    case 'drift':
      shot.targetX += ease * 2;
      break;
    case 'reframe':
      shot.transitionProgress = Math.min(shot.transitionProgress, 0.7);
      break;
    case 'none':
      break;
  }

  return camera;
}
