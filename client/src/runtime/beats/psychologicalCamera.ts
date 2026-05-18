import type { Camera, EmotionalBeat, BeatSequence } from '@animaster/shared/scene';

export function applyPsychologicalCameraResponse(camera: Camera, sequence: BeatSequence, activeBeat: EmotionalBeat | null, beatProgress: number): Camera {
  if (!activeBeat || !camera.shot) return camera;

  const shot = camera.shot;
  const ease = Math.sin(beatProgress * Math.PI);
  const beatIndex = sequence.currentIndex;
  const totalBeats = sequence.beats.length;
  const sequenceProgress = totalBeats > 0 ? beatIndex / totalBeats : 0;

  switch (activeBeat.action) {
    case 'freeze':
      shot.transitionProgress = Math.max(shot.transitionProgress, 0.96);
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.04, 2.0);
      break;
    case 'collapse':
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.12, 2.2);
      shot.targetY -= ease * 5;
      break;
    case 'stillness':
      shot.transitionProgress = Math.max(shot.transitionProgress, 0.93);
      break;
    case 'approach':
      shot.targetZoom = Math.min(shot.targetZoom + ease * 0.06 * (1 + sequenceProgress), 2.0);
      break;
    case 'recoil':
      shot.targetZoom = Math.max(shot.targetZoom - ease * 0.08, 0.6);
      break;
  }

  if (activeBeat.cameraResponse === 'hold') {
    shot.transitionProgress = Math.max(shot.transitionProgress, 0.94);
  }

  return camera;
}
