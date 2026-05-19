import { useState, useEffect } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';

export default function CinematicInspector() {
  const [open, setOpen] = useState(false);
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'i' && e.ctrlKey && !e.shiftKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!open) return null;

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const tension = scene.tensionState?.currentLevel ?? 0;
  const pacing = scene.rhythm?.tempo ?? 'medium';
  const cameraMode = scene.camera?.mode ?? 'static';
  const shotIntent = scene.shotIntent?.intent ?? 'observe';
  const atmosphere = scene.atmosphere?.effects?.filter((e) => e !== 'none') ?? [];
  const lightingTint = scene.atmosphere?.lightingTint ?? 'neutral';
  const ambientIntensity = scene.atmosphere?.ambientIntensity ?? 1.0;
  const spatialIntent = scene.emotionalSpatial?.spatialIntent ?? 'neutral';
  const negativeSpace = scene.emotionalSpatial?.negativeSpaceRatio ?? 0.5;
  const compositionTension = scene.emotionalSpatial?.compositionTension ?? 0;
  const beatLabel = scene.beatSequence?.label ?? 'none';
  const beatIndex = scene.beatSequence?.currentIndex ?? 0;
  const beatTotal = scene.beatSequence?.beats?.length ?? 0;
  const arcPhase = scene.emotionalArc?.phases?.[scene.emotionalArc?.currentPhaseIndex ?? 0]?.name ?? 'none';
  const arcProgress = scene.emotionalArc ? Math.round((scene.emotionalArc.currentPhaseIndex / Math.max(1, scene.emotionalArc.phases.length)) * 100) : 0;
  const momentScore = scene.cinematicMomentScore?.overallScore ?? 0;
  const visualStyle = scene.visualStyle?.name ?? 'default';

  const relationships = scene.relationships ?? [];
  const actors = scene.actors ?? [];

  return (
    <div className="cinematic-inspector">
      <div className="inspector-header">
        <span className="inspector-title">Scene Monitor</span>
        <button className="inspector-close" onClick={() => setOpen(false)}>x</button>
      </div>

      <div className="inspector-body">
        <section className="inspector-section">
          <h4>Emotional Tone</h4>
          <div className="inspector-row">
            <span className="inspector-label">Tone</span>
            <span className={`inspector-value tone-${tone}`}>{tone}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Tension</span>
            <div className="inspector-bar">
              <div className="inspector-bar-fill" style={{ width: `${Math.round(tension * 100)}%` }} />
            </div>
            <span className="inspector-value">{Math.round(tension * 100)}%</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Dramatic Impact</span>
            <span className="inspector-value">{Math.round(momentScore * 100)}%</span>
          </div>
        </section>

        <section className="inspector-section">
          <h4>Rhythm & Pacing</h4>
          <div className="inspector-row">
            <span className="inspector-label">Rhythm</span>
            <span className="inspector-value">{pacing}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Beat</span>
            <span className="inspector-value">{beatLabel} ({beatIndex + 1}/{beatTotal})</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Arc</span>
            <span className="inspector-value">{arcPhase} ({arcProgress}%)</span>
          </div>
        </section>

        <section className="inspector-section">
          <h4>Camera & Framing</h4>
          <div className="inspector-row">
            <span className="inspector-label">Camera</span>
            <span className="inspector-value">{cameraMode.replace(/_/g, ' ')}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Shot Intent</span>
            <span className="inspector-value">{shotIntent}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Framing Intent</span>
            <span className="inspector-value">{spatialIntent}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Negative Space</span>
            <span className="inspector-value">{Math.round(negativeSpace * 100)}%</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Composition Tension</span>
            <span className="inspector-value">{Math.round(compositionTension * 100)}%</span>
          </div>
        </section>

        <section className="inspector-section">
          <h4>Atmosphere</h4>
          <div className="inspector-row">
            <span className="inspector-label">Effects</span>
            <span className="inspector-value">{atmosphere.length > 0 ? atmosphere.join(', ') : 'none'}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Lighting</span>
            <span className="inspector-value">{lightingTint}</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Ambient</span>
            <span className="inspector-value">{Math.round(ambientIntensity * 100)}%</span>
          </div>
          <div className="inspector-row">
            <span className="inspector-label">Visual Style</span>
            <span className="inspector-value">{visualStyle.replace(/_/g, ' ')}</span>
          </div>
        </section>

        {actors.length > 0 && (
          <section className="inspector-section">
            <h4>Characters</h4>
            {actors.map((actor) => (
              <div key={actor.id} className="inspector-row">
                <span className="inspector-label">{actor.label}</span>
                <span className="inspector-value">
                  {actor.emotionState} ({Math.round((actor.emotionIntensity ?? 0.5) * 100)}%) — {actor.currentAction}
                </span>
              </div>
            ))}
          </section>
        )}

        {relationships.length > 0 && (
          <section className="inspector-section">
            <h4>Relationships</h4>
            {relationships.map((rel, i) => {
              const a = actors.find((ac) => ac.id === rel.actorAId)?.label ?? rel.actorAId;
              const b = actors.find((ac) => ac.id === rel.actorBId)?.label ?? rel.actorBId;
              return (
                <div key={i} className="inspector-row">
                  <span className="inspector-label">{a} ↔ {b}</span>
                  <span className="inspector-value">{rel.type}{rel.tension ? ` (tension: ${Math.round(rel.tension * 100)}%)` : ''}</span>
                </div>
              );
            })}
          </section>
        )}
      </div>
    </div>
  );
}
