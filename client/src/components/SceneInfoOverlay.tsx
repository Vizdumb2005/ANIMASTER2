import { useEffect, useState } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';

export default function SceneInfoOverlay() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());

  useEffect(() => {
    const interval = setInterval(() => {
      setScene({ ...sceneStore.getScene() });
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (scene.version === 0) return null;

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const beatLabel = scene.beatSequence?.label ?? '';
  const beatIdx = scene.beatSequence?.currentIndex ?? 0;
  const beatTotal = scene.beatSequence?.beats?.length ?? 0;
  const arcPhase = scene.emotionalArc?.phases?.[scene.emotionalArc?.currentPhaseIndex ?? 0]?.name ?? '';
  const tensionLevel = scene.tensionState?.currentLevel ?? 0;
  const cameraMode = scene.camera?.mode ?? 'static';
  const momentScore = scene.cinematicMomentScore?.overallScore ?? 0;

  return (
    <div className="scene-info-overlay">
      <div className="scene-info-chip" data-type="tone">{tone}</div>
      {beatLabel && (
        <div className="scene-info-chip" data-type="beat">
          beat {beatIdx + 1}/{beatTotal}
        </div>
      )}
      {arcPhase && (
        <div className="scene-info-chip" data-type="arc">{arcPhase}</div>
      )}
      {tensionLevel > 0.1 && (
        <div className="scene-info-chip" data-type="tension">
          tension {Math.round(tensionLevel * 100)}%
        </div>
      )}
      <div className="scene-info-chip" data-type="camera">{cameraMode.replace('_', ' ')}</div>
      {momentScore > 0 && (
        <div className="scene-info-chip" data-type="score">
          score {Math.round(momentScore * 100)}
        </div>
      )}
    </div>
  );
}
