import type { Camera, ShotIntent } from '@animaster/shared/scene';

export function applyShotIntentToCamera(camera: Camera, shotIntent: ShotIntent): Camera {
  const updated = { ...camera };

  switch (shotIntent.intent) {
    case 'isolate':
      updated.mode = 'close_up';
      updated.zoom = 1.3 + shotIntent.intensity * 0.3;
      break;
    case 'reveal':
      updated.mode = 'follow';
      updated.zoom = Math.max(1, (updated.zoom ?? 1) + shotIntent.intensity * 0.01);
      break;
    case 'emphasize':
      updated.mode = 'close_up';
      updated.zoom = 1.4 + shotIntent.intensity * 0.2;
      break;
    case 'confront':
      updated.mode = 'over_the_shoulder';
      updated.zoom = 1.1 + shotIntent.intensity * 0.2;
      break;
    case 'compress':
      updated.mode = 'tension';
      updated.zoom = 1.2 + shotIntent.intensity * 0.3;
      break;
    case 'establish':
      updated.mode = 'wide_shot';
      updated.zoom = 0.8;
      break;
    case 'observe':
      break;
  }

  return updated;
}
