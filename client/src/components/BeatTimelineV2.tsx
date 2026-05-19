import { useState, useEffect } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph, EmotionalBeat } from '@animaster/shared/scene';

type BeatDisplay = {
  label: string;
  type: string;
  progress: number;
  active: boolean;
  emotionColor: string;
};

const BEAT_COLORS: Record<string, string> = {
  pause: '#6b7280',
  freeze: '#3b82f6',
  collapse: '#ef4444',
  recoil: '#f97316',
  approach: '#22c55e',
  step_back: '#a855f7',
  look_away: '#eab308',
  glance: '#06b6d4',
  fidget: '#ec4899',
  stillness: '#94a3b8',
  neutral: '#9ca3af',
  attempt_contact: '#10b981',
  avoidance: '#f43f5e',
  retry: '#8b5cf6',
};

function getBeatColor(action: string): string {
  return BEAT_COLORS[action] ?? '#6b7280';
}

function formatBeatLabel(action: string): string {
  return action.replace(/_/g, ' ');
}

export default function BeatTimelineV2() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  const sequence = scene.beatSequence;
  if (!sequence || !sequence.beats || sequence.beats.length === 0) return null;

  const beats: BeatDisplay[] = sequence.beats.map((beat, i) => ({
    label: formatBeatLabel(beat.action),
    type: beat.action,
    progress: i < sequence.currentIndex ? 1 : i === sequence.currentIndex ? (beat.elapsedMs / Math.max(1, beat.durationMs)) : 0,
    active: i === sequence.currentIndex,
    emotionColor: getBeatColor(beat.action),
  }));

  const arc = scene.emotionalArc;
  const arcPhase = arc?.phases?.[arc.currentPhaseIndex]?.name ?? null;
  const tensionLevel = scene.tensionState?.currentLevel ?? 0;
  const momentScore = scene.cinematicMomentScore?.overallScore ?? 0;

  return (
    <div className="beat-timeline-v2">
      <div className="btv2-header">
        <span className="btv2-title">{sequence.label}</span>
        <div className="btv2-meta">
          {arcPhase && <span className="btv2-arc">Arc: {arcPhase}</span>}
          <span className="btv2-tension">Tension: {Math.round(tensionLevel * 100)}%</span>
          <span className="btv2-moment">Score: {Math.round(momentScore * 100)}%</span>
        </div>
      </div>

      <div className="btv2-track">
        {beats.map((beat, i) => (
          <div
            key={i}
            className={`btv2-beat ${beat.active ? 'btv2-beat-active' : ''} ${beat.progress >= 1 ? 'btv2-beat-done' : ''}`}
            style={{ '--beat-color': beat.emotionColor } as React.CSSProperties}
          >
            <div className="btv2-beat-fill" style={{ width: `${Math.round(beat.progress * 100)}%` }} />
            <span className="btv2-beat-label">{beat.label}</span>
          </div>
        ))}
      </div>

      {scene.dramaticBeats && scene.dramaticBeats.length > 0 && (
        <div className="btv2-dramatic">
          {scene.dramaticBeats.slice(0, 3).map((db, i) => (
            <span key={i} className="btv2-dramatic-tag">
              {db.type.replace(/_/g, ' ')} ({Math.round(db.intensity * 100)}%)
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
