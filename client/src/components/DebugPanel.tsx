import { useEffect, useState } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';

export default function DebugPanel() {
  const [visible, setVisible] = useState(false);
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());

  useEffect(() => {
    return sceneStore.onSceneChange((nextScene) => {
      setScene(nextScene);
    });
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.key === 'd') {
        event.preventDefault();
        setVisible((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <div className="debug-panel">
      <div className="debug-header">
        <span className="debug-title">SceneGraph (Ctrl+D to close)</span>
        <button
          className="debug-close"
          onClick={() => setVisible(false)}
          type="button"
        >
          ✕
        </button>
      </div>
      <pre className="debug-json">{JSON.stringify(scene, null, 2)}</pre>
    </div>
  );
}
