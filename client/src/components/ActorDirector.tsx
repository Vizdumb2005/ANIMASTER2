import { useState, useEffect, useCallback } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { ActorEmotion } from '@animaster/shared/scene';

const EMOTION_PRESETS: Array<{ label: string; emotion: ActorEmotion }> = [
  { label: 'Neutral', emotion: 'neutral' },
  { label: 'Sad', emotion: 'sad' },
  { label: 'Happy', emotion: 'happy' },
  { label: 'Nervous', emotion: 'nervous' },
  { label: 'Angry', emotion: 'angry' },
  { label: 'Exhausted', emotion: 'exhausted' },
  { label: 'Awkward', emotion: 'awkward' },
  { label: 'Excited', emotion: 'excited' },
];

export default function ActorDirector() {
  const [selectedActorId, setSelectedActorId] = useState<string | null>(null);
  const [actors, setActors] = useState<Array<{ id: string; label: string; emotionState: string }>>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const scene = sceneStore.getScene();
      setActors(scene.actors.map((a) => ({ id: a.id, label: a.label, emotionState: a.emotionState })));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const applyEmotion = useCallback((emotion: ActorEmotion) => {
    if (!selectedActorId) return;
    const scene = sceneStore.getScene();
    const actorIdx = scene.actors.findIndex((a) => a.id === selectedActorId);
    if (actorIdx < 0) return;

    const updatedActors = [...scene.actors];
    updatedActors[actorIdx] = { ...updatedActors[actorIdx], emotionState: emotion };
    sceneStore.setActorOverride(selectedActorId, emotion);
    sceneStore.applyPatch({ ...scene, actors: updatedActors }, `[direct] ${selectedActorId} → ${emotion}`);
  }, [selectedActorId]);

  if (actors.length === 0) return null;

  return (
    <div className="actor-director">
      <span className="actor-director-label">Actors</span>
      <div className="actor-list">
        {actors.map((a) => (
          <button
            key={a.id}
            className={`actor-chip ${selectedActorId === a.id ? 'actor-selected' : ''}`}
            onClick={() => setSelectedActorId(selectedActorId === a.id ? null : a.id)}
          >
            {a.label} ({a.emotionState})
          </button>
        ))}
      </div>
      {selectedActorId && (
        <div className="emotion-presets">
          {EMOTION_PRESETS.map((p) => (
            <button key={p.emotion} className="emotion-preset-btn" onClick={() => applyEmotion(p.emotion)}>
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
