import type { Actor, EmotionalAftermath, SceneGraph } from '@animaster/shared/scene';

function getResidualIntensity(aftermath: EmotionalAftermath | undefined, sceneTimeMs: number) {
  if (!aftermath) return 0;

  const elapsed = Math.max(0, sceneTimeMs - aftermath.lastUpdatedAtMs);
  const decay = Math.exp(-elapsed / Math.max(1, aftermath.recoveryHalfLifeMs));
  return Math.max(0, aftermath.peakIntensity * decay);
}

function applyResidualToActor(actor: Actor, residual: number, aftermath: EmotionalAftermath, sceneTimeMs: number): Actor {
  const clone = structuredClone(actor);
  clone.emotionalMomentum = Math.max(clone.emotionalMomentum ?? 0, residual);
  clone.emotionIntensity = Math.max(clone.emotionIntensity ?? 0, residual);

  const pulse = Math.sin(sceneTimeMs * 0.004 + residual * Math.PI) * residual;

  switch (aftermath.emotion) {
    case 'sad':
    case 'exhausted':
      clone.joints.torso.y += residual * 3.5;
      clone.joints.head.y += residual * 2.2;
      clone.joints.leftArm.x += residual * 1.5;
      clone.joints.rightArm.x -= residual * 1.5;
      break;
    case 'nervous':
    case 'awkward':
      clone.joints.head.x += pulse * 3;
      clone.joints.torso.y += residual * 1.2;
      clone.joints.leftArm.y += pulse * 1.2;
      clone.joints.rightArm.y -= pulse * 1.2;
      break;
    case 'angry':
      clone.joints.torso.y -= residual * 1.3;
      clone.joints.leftArm.x -= residual * 1.8;
      clone.joints.rightArm.x += residual * 1.8;
      break;
    case 'excited':
      clone.joints.torso.y += pulse * 1.5;
      clone.joints.head.y += pulse * 0.8;
      break;
    case 'happy':
      clone.joints.head.y -= residual * 0.8;
      break;
    default:
      break;
  }

  return clone;
}

export function applyEmotionalAftermath(scene: SceneGraph): SceneGraph {
  const aftermath = scene.continuity?.emotionalAftermath;
  if (!aftermath) return scene;

  const sceneTimeMs = scene.simulation?.timeMs ?? scene.version * 16.6667;
  let strongestResidual = 0;

  scene.actors = scene.actors.map((actor) => {
    const record = aftermath[actor.id];
    if (!record) return actor;

    const residual = getResidualIntensity(record, sceneTimeMs);
    strongestResidual = Math.max(strongestResidual, residual);

    if (residual < 0.08) {
      return actor;
    }

    return applyResidualToActor(actor, residual, record, sceneTimeMs);
  });

  if (strongestResidual > 0.35 && scene.camera.shot) {
    scene.camera.shot.transitionProgress = Math.max(scene.camera.shot.transitionProgress, 0.9);
    scene.camera.shot.targetZoom = Math.min(scene.camera.shot.targetZoom + strongestResidual * 0.04, 2.6);
  }

  return scene;
}