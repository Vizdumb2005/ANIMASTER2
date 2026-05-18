import CinematicScene from './three/components/CinematicScene';
import PromptBar from './components/PromptBar';
import SessionSidebar from './components/SessionSidebar';
import DebugPanel from './components/DebugPanel';
import CinematicControls from './components/CinematicControls';
import PlaybackControls from './components/PlaybackControls';
import SceneInfoOverlay from './components/SceneInfoOverlay';
import BeatTimeline from './components/BeatTimeline';
import CameraPresets from './components/CameraPresets';
import ActorDirector from './components/ActorDirector';
import SceneGraphView from './components/SceneGraphView';

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Animaster</p>
          <h1>Direct cinema through language.</h1>
        </div>
        <p className="subtle">
          Describe a scene. Direct it conversationally. No manual animation.
        </p>
      </header>

      <PromptBar />

      <section className="canvas-frame">
        <CinematicScene />
        <SceneInfoOverlay />
        <PlaybackControls />
        <BeatTimeline />
      </section>

      <div className="directing-panel">
        <CinematicControls />
        <CameraPresets />
        <ActorDirector />
      </div>

      <SceneGraphView />
      <SessionSidebar />
      <DebugPanel />
    </main>
  );
}
