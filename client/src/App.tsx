import CinematicScene from './three/components/CinematicScene';
import PromptBar from './components/PromptBar';
import SessionSidebar from './components/SessionSidebar';
import DebugPanel from './components/DebugPanel';
import CinematicControls from './components/CinematicControls';
import PlaybackControls from './components/PlaybackControls';
import SceneInfoOverlay from './components/SceneInfoOverlay';
import BeatTimeline from './components/BeatTimeline';
import BeatTimelineV2 from './components/BeatTimelineV2';
import CameraPresets from './components/CameraPresets';
import ActorDirector from './components/ActorDirector';
import SceneGraphView from './components/SceneGraphView';
import CinematicDirector from './components/CinematicDirector';
import AIDebugPanel from './components/AIDebugPanel';
import DemoSelector from './components/DemoSelector';
import DirectorMode from './director/DirectorMode';
import CinematicInspector from './components/CinematicInspector';
import ShotSelector from './components/ShotSelector';
import EmotionalSpaceControls from './components/EmotionalSpaceControls';
import DirectorialStyleSelector from './components/DirectorialStyleSelector';

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
        <BeatTimelineV2 />
      </section>

      <div className="directing-panel">
        <CinematicControls />
        <CameraPresets />
        <ActorDirector />
        <ShotSelector />
        <EmotionalSpaceControls />
        <DirectorialStyleSelector />
        <CinematicDirector />
        <DemoSelector />
      </div>

      <SceneGraphView />
      <SessionSidebar />
      <DebugPanel />
      <AIDebugPanel />
      <DirectorMode />
      <CinematicInspector />
    </main>
  );
}
