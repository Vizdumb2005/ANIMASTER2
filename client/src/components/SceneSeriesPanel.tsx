import { useState, useEffect, useRef } from 'react';
import { sceneStore, type SceneSeries } from '../store/sceneStore';
import { interpretScene } from '../services/interpretService';
import { initActorJoints } from '../runtime/initActorJoints';

export default function SceneSeriesPanel() {
  const [collapsed, setCollapsed] = useState(true);
  const [series, setSeries] = useState<SceneSeries>(() => sceneStore.getSeries());
  const [newScenePrompt, setNewScenePrompt] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => sceneStore.onSeriesChange(setSeries), []);

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  async function handleAddScene(e: React.FormEvent) {
    e.preventDefault();
    const prompt = newScenePrompt.trim();
    if (!prompt || isCreating) return;
    setIsCreating(true);
    setError(null);
    try {
      const directing = sceneStore.getDirectingContext();
      const scene = await interpretScene(prompt, directing);
      for (const actor of scene.actors) {
        actor.joints = initActorJoints(actor.position);
      }
      sceneStore.setScene(scene);
      sceneStore.addSceneToSeries(scene, prompt);
      setNewScenePrompt('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create scene');
    } finally {
      setIsCreating(false);
    }
  }

  function handleSaveCurrentToSeries() {
    const scene = sceneStore.getScene();
    if (scene.actors.length === 0) return;
    const label = scene.sessionHistory.at(-1)?.prompt ?? `Scene ${series.scenes.length + 1}`;
    sceneStore.addSceneToSeries(scene, label);
  }

  function commitTitle() {
    if (titleDraft.trim()) sceneStore.setSeriesTitle(titleDraft.trim());
    setEditingTitle(false);
  }

  if (collapsed) {
    return (
      <button className="series-toggle" onClick={() => setCollapsed(false)}>
        Series {series.scenes.length > 0 ? `(${series.scenes.length})` : ''}
      </button>
    );
  }

  return (
    <div className="scene-series-panel">
      <div className="series-header">
        {editingTitle ? (
          <input
            ref={titleInputRef}
            className="series-title-input"
            value={titleDraft}
            onChange={e => setTitleDraft(e.target.value)}
            onBlur={commitTitle}
            onKeyDown={e => { if (e.key === 'Enter') commitTitle(); if (e.key === 'Escape') setEditingTitle(false); }}
          />
        ) : (
          <button
            className="series-title-btn"
            onClick={() => { setTitleDraft(series.title); setEditingTitle(true); }}
            title="Click to rename"
          >
            {series.title}
          </button>
        )}
        <button className="series-close" onClick={() => setCollapsed(true)}>&times;</button>
      </div>

      {/* Scene strip */}
      {series.scenes.length > 0 ? (
        <div className="series-strip">
          {series.scenes.map((scene, i) => {
            const label = (scene as SceneSeries['scenes'][number] & { seriesTitle?: string }).seriesTitle
              ?? scene.sessionHistory.at(-1)?.prompt
              ?? `Scene ${i + 1}`;
            const tone = scene.cinematicGrammar?.tone ?? 'neutral';
            const isActive = i === series.activeIndex;
            return (
              <div
                key={scene.id + i}
                className={`series-scene-card ${isActive ? 'series-scene-active' : ''}`}
              >
                <button
                  className="series-scene-thumb"
                  onClick={() => sceneStore.navigateSeriesTo(i)}
                  title={label}
                >
                  <span className="series-scene-index">{i + 1}</span>
                  <span className={`series-scene-tone tone-dot-${tone}`}>{tone}</span>
                  <span className="series-scene-actors">{scene.actors.length} actor{scene.actors.length !== 1 ? 's' : ''}</span>
                </button>
                <button
                  className="series-scene-remove"
                  onClick={() => sceneStore.removeSceneFromSeries(i)}
                  title="Remove from series"
                >
                  &times;
                </button>
                <p className="series-scene-label">{label.length > 40 ? label.slice(0, 38) + '…' : label}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="series-empty">No scenes yet. Add the current scene or create a new one below.</p>
      )}

      {/* Save current scene */}
      <button
        className="series-save-btn"
        onClick={handleSaveCurrentToSeries}
        disabled={sceneStore.getScene().actors.length === 0}
        type="button"
      >
        + Save current scene to series
      </button>

      {/* Create new scene in series */}
      <form className="series-new-form" onSubmit={handleAddScene}>
        <input
          className="series-new-input"
          value={newScenePrompt}
          onChange={e => setNewScenePrompt(e.target.value)}
          placeholder="Describe next scene…"
          disabled={isCreating}
        />
        <button className="series-new-btn" type="submit" disabled={isCreating || !newScenePrompt.trim()}>
          {isCreating ? '…' : 'Create & Add'}
        </button>
      </form>
      {error && <p className="series-error">{error}</p>}

      {series.scenes.length > 1 && (
        <div className="series-nav">
          <button
            className="series-nav-btn"
            onClick={() => sceneStore.navigateSeriesTo(series.activeIndex - 1)}
            disabled={series.activeIndex === 0}
          >
            ← Prev
          </button>
          <span className="series-nav-pos">{series.activeIndex + 1} / {series.scenes.length}</span>
          <button
            className="series-nav-btn"
            onClick={() => sceneStore.navigateSeriesTo(series.activeIndex + 1)}
            disabled={series.activeIndex >= series.scenes.length - 1}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
