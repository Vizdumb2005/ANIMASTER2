import { useEffect, useState } from 'react';
import { sceneStore } from '../store/sceneStore';

export default function BeatTimeline() {
  const [beatData, setBeatData] = useState<{ currentIndex: number; total: number; beats: Array<{ action: string; durationMs: number }> } | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      const scene = sceneStore.getScene();
      if (scene.beatSequence && scene.beatSequence.beats.length > 0) {
        setBeatData({
          currentIndex: scene.beatSequence.currentIndex,
          total: scene.beatSequence.beats.length,
          beats: scene.beatSequence.beats.map((b) => ({ action: b.action, durationMs: b.durationMs }))
        });
      } else {
        setBeatData(null);
      }
    }, 300);
    return () => clearInterval(interval);
  }, []);

  if (!beatData) return null;

  const totalDuration = beatData.beats.reduce((sum, b) => sum + b.durationMs, 0);

  return (
    <div className="beat-timeline">
      <div className="beat-timeline-bar">
        {beatData.beats.map((beat, i) => {
          const widthPct = (beat.durationMs / totalDuration) * 100;
          const isCurrent = i === beatData.currentIndex;
          const isPast = i < beatData.currentIndex;
          return (
            <div
              key={i}
              className={`beat-segment ${isCurrent ? 'beat-current' : ''} ${isPast ? 'beat-past' : ''}`}
              style={{ width: `${widthPct}%` }}
              title={beat.action}
            />
          );
        })}
      </div>
    </div>
  );
}
