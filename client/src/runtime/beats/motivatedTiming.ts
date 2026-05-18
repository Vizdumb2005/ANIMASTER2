import type { EmotionalBeat, SceneGraph } from '@animaster/shared/scene';

export function motivateBeatTiming(beat: EmotionalBeat, scene: SceneGraph): EmotionalBeat {
  if (beat.action !== 'pause' && beat.action !== 'stillness') return beat;

  const tensionLevel = scene.tensionState?.currentLevel ?? 0;
  const arcPhaseIndex = scene.emotionalArc?.currentPhaseIndex ?? 0;
  const totalPhases = scene.emotionalArc?.phases.length ?? 1;
  const arcProgress = arcPhaseIndex / Math.max(1, totalPhases);

  const motivated = { ...beat };

  if (tensionLevel > 0.6) {
    motivated.durationMs = Math.max(400, motivated.durationMs * 0.7);
    motivated.motionDamping = Math.min(1, motivated.motionDamping + 0.2);
  } else if (tensionLevel < 0.3 && arcProgress > 0.5) {
    motivated.durationMs = motivated.durationMs * 1.3;
    motivated.motionDamping = Math.max(0, motivated.motionDamping - 0.1);
  }

  if (beat.action === 'stillness' && arcProgress > 0.7) {
    motivated.cameraResponse = 'hold';
    motivated.motionDamping = Math.min(1, motivated.motionDamping + 0.3);
  }

  return motivated;
}
