import CanvasView from './components/CanvasView';
import PromptBar from './components/PromptBar';
import SessionSidebar from './components/SessionSidebar';
import DebugPanel from './components/DebugPanel';

export default function App() {
  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">Animaster Phase 1</p>
          <h1>Semantic animation, rendered live.</h1>
        </div>
        <p className="subtle">
          A procedural room, a stickman actor, and a runtime loop wired for the vertical slice.
        </p>
      </header>

      <PromptBar />

      <section className="canvas-frame">
        <CanvasView />
      </section>

      <SessionSidebar />
      <DebugPanel />
    </main>
  );
}
