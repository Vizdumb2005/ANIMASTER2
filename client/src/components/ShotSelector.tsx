import { useState, useEffect, useCallback } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph, CameraMode } from '@animaster/shared/scene';
import { SHOT_LIBRARY, type ShotDefinition, type ShotStyle } from '@animaster/shared/cinematicShots';
import { applyShotWithTransition } from '../runtime/camera/cameraRuntime';

export default function ShotSelector() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const [collapsed, setCollapsed] = useState(true);
  const [activeShot, setActiveShot] = useState<ShotStyle | null>(null);

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  // Initialize from scene camera mode
  useEffect(() => {
    const currentMode = scene.camera.mode;
    if (currentMode) {
      const matching = SHOT_LIBRARY.find((s) => s.cameraMode === currentMode);
      if (matching) setActiveShot(matching.style);
    }
  }, []);

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const recommended = SHOT_LIBRARY.filter((s) => s.preferredTones.includes(tone));
  const others = SHOT_LIBRARY.filter((s) => !s.preferredTones.includes(tone));

  const applyShot = useCallback((shot: ShotDefinition) => {
    setActiveShot(shot.style);
    
    // Apply shot with smooth transition via cameraRuntime
    applyShotWithTransition(shot);
    
    sceneStore.mutateScene((draft) => {
      draft.camera.mode = shot.cameraMode as CameraMode;
      if (draft.camera.shot) {
        const targetZoom = (shot.zoomRange.min + shot.zoomRange.max) / 2;
        draft.camera.shot.targetZoom = targetZoom;
        draft.camera.shot.transitionProgress = 1 - shot.transitionSpeed;
      }
      // Update shot intent for runtime
      draft.shotIntent = {
        intent: shot.framingIntent as any,
        targetSubjectId: draft.actors[0]?.id,
        transitionSpeed: shot.transitionSpeed,
      };
    });
  }, []);

  return (
    <div className="shot-selector">
      <button className="shot-toggle" onClick={() => setCollapsed(!collapsed)}>
        Shot Language {collapsed ? '▸' : '▾'}
      </button>

      {!collapsed && (
        <div className="shot-list">
          {recommended.length > 0 && (
            <div className="shot-group">
              <span className="shot-group-label">Recommended for {tone}</span>
              {recommended.map((shot) => (
                <button
                  key={shot.style}
                  className={`shot-btn ${activeShot === shot.style ? 'shot-active' : ''}`}
                  onClick={() => applyShot(shot)}
                  title={shot.description}
                >
                  {shot.label}
                </button>
              ))}
            </div>
          )}
          <div className="shot-group">
            <span className="shot-group-label">All Shots</span>
            {others.map((shot) => (
              <button
                key={shot.style}
                className={`shot-btn ${activeShot === shot.style ? 'shot-active' : ''}`}
                onClick={() => applyShot(shot)}
                title={shot.description}
              >
                {shot.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
