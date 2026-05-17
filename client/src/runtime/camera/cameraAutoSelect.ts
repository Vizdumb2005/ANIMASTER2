import type { CameraMode, SceneGraph, SceneTone } from '@animaster/shared/scene';

const TONE_CAMERA_MAP: Record<SceneTone, CameraMode> = {
  neutral: 'static',
  sad: 'wide_shot',
  tense: 'close_up',
  lonely: 'wide_shot',
  awkward: 'over_the_shoulder',
  energetic: 'follow',
  romantic: 'close_up',
  threatening: 'tension'
};

export function autoSelectCameraMode(scene: SceneGraph): CameraMode {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const actorCount = scene.actors.length;

  if (actorCount === 0) return 'static';

  const toneCamera = TONE_CAMERA_MAP[tone] ?? 'static';

  if (actorCount >= 2 && tone === 'tense') return 'tension';
  if (actorCount >= 2 && tone === 'awkward') return 'over_the_shoulder';
  if (actorCount === 1 && tone === 'lonely') return 'wide_shot';

  return toneCamera;
}
