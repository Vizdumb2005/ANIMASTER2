import { useState } from 'react';
import { sceneStore } from '../store/sceneStore';

export default function PlaybackControls() {
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);

  function togglePause() {
    const next = !paused;
    setPaused(next);
    sceneStore.setPaused(next);
  }

  function changeSpeed(newSpeed: number) {
    setSpeed(newSpeed);
    sceneStore.setPlaybackSpeed(newSpeed);
  }

  function resetScene() {
    sceneStore.resetScene();
    setPaused(false);
    setSpeed(1);
  }

  return (
    <div className="playback-controls">
      <button className="playback-btn" onClick={togglePause} title={paused ? 'Play' : 'Pause'}>
        {paused ? '\u25B6' : '\u2759\u2759'}
      </button>
      <div className="speed-selector">
        {[0.5, 1, 2].map((s) => (
          <button
            key={s}
            className={`speed-btn ${speed === s ? 'speed-active' : ''}`}
            onClick={() => changeSpeed(s)}
          >
            {s}x
          </button>
        ))}
      </div>
      <button className="playback-btn playback-reset" onClick={resetScene} title="New Scene">
        New
      </button>
    </div>
  );
}
