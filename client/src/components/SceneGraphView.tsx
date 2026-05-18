import { useEffect, useState } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';

export default function SceneGraphView() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setScene(sceneStore.getScene());
    }, 500);
    return () => clearInterval(interval);
  }, []);

  if (scene.version === 0) return null;

  if (!open) {
    return (
      <button className="scene-graph-toggle" onClick={() => setOpen(true)}>
        Scene Graph
      </button>
    );
  }

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const tensionLevel = scene.tensionState?.currentLevel ?? 0;
  const cameraMode = scene.camera.mode;
  const beatIndex = scene.beatSequence?.currentIndex ?? 0;
  const beatTotal = scene.beatSequence?.beats.length ?? 0;
  const arcPhase = scene.emotionalArc?.phases[scene.emotionalArc.currentPhaseIndex]?.name ?? 'none';
  const momentScore = scene.cinematicMomentScore?.overallScore ?? 0;
  const spatialIntent = scene.emotionalSpatial?.spatialIntent ?? 'neutral';
  const envReaction = scene.environmentReaction;

  return (
    <div className="scene-graph-panel">
      <div className="scene-graph-header">
        <span className="scene-graph-title">Scene Graph</span>
        <button className="scene-graph-close" onClick={() => setOpen(false)}>x</button>
      </div>

      <div className="scene-graph-section">
        <div className="scene-graph-label">Actors</div>
        {scene.actors.map((actor) => (
          <div key={actor.id} className="scene-graph-actor">
            <span className="actor-name">{actor.label}</span>
            <span className="actor-emotion">{actor.emotionState}</span>
            <span className="actor-action">{actor.currentAction}</span>
            <span className="actor-pos">
              ({Math.round(actor.position.x)}, {Math.round(actor.position.y)})
            </span>
          </div>
        ))}
      </div>

      <div className="scene-graph-section">
        <div className="scene-graph-label">Relationships</div>
        {(scene.relationships ?? []).length === 0 && (
          <div className="scene-graph-empty">No relationships</div>
        )}
        {(scene.relationships ?? []).map((rel, i) => (
          <div key={i} className="scene-graph-rel">
            {rel.actorAId} → {rel.actorBId}: {rel.type}
          </div>
        ))}
      </div>

      <div className="scene-graph-section">
        <div className="scene-graph-label">Cinematic State</div>
        <div className="scene-graph-metrics">
          <div className="metric-row"><span>Tone</span><span>{tone}</span></div>
          <div className="metric-row"><span>Spatial</span><span>{spatialIntent}</span></div>
          <div className="metric-row"><span>Tension</span><span>{(tensionLevel * 100).toFixed(0)}%</span></div>
          <div className="metric-row"><span>Camera</span><span>{cameraMode}</span></div>
          <div className="metric-row"><span>Beat</span><span>{beatIndex + 1}/{beatTotal}</span></div>
          <div className="metric-row"><span>Arc Phase</span><span>{arcPhase}</span></div>
          <div className="metric-row"><span>Moment Score</span><span>{(momentScore * 100).toFixed(0)}%</span></div>
        </div>
      </div>

      {envReaction && (
        <div className="scene-graph-section">
          <div className="scene-graph-label">Environment</div>
          <div className="scene-graph-metrics">
            <div className="metric-row"><span>Type</span><span>{scene.environment.type}</span></div>
            <div className="metric-row"><span>Emptiness</span><span>{(envReaction.emptinessLevel * 100).toFixed(0)}%</span></div>
            <div className="metric-row"><span>Lighting</span><span>{envReaction.lightingShift ?? 'default'}</span></div>
          </div>
        </div>
      )}

      <div className="scene-graph-section">
        <div className="scene-graph-label">Tension Progression</div>
        <div className="tension-bar-container">
          <div className="tension-bar-fill" style={{ width: `${tensionLevel * 100}%` }} />
        </div>
      </div>

      {scene.storyAnchors && scene.storyAnchors.length > 0 && (
        <div className="scene-graph-section">
          <div className="scene-graph-label">Anchors</div>
          {scene.storyAnchors.map((anchor) => (
            <div key={anchor.id} className="scene-graph-anchor">
              {anchor.type} @ ({Math.round(anchor.position.x)}, {Math.round(anchor.position.y)})
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
