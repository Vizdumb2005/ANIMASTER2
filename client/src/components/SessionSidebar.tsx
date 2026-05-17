import { useEffect, useState } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SessionEntry } from '@animaster/shared/scene';

export default function SessionSidebar() {
  const [history, setHistory] = useState<SessionEntry[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    return sceneStore.onSceneChange((scene) => {
      setHistory(scene.sessionHistory);
    });
  }, []);

  if (history.length === 0) {
    return null;
  }

  return (
    <aside className="session-sidebar">
      <button
        className="session-sidebar-toggle"
        onClick={() => setCollapsed(!collapsed)}
        type="button"
      >
        {collapsed ? '▶ History' : '▼ History'}
      </button>
      {!collapsed && (
        <ol className="session-list">
          {history.map((entry) => (
            <li key={entry.id} className="session-entry">
              <span className="session-prompt">{entry.prompt}</span>
              <time className="session-time">
                {new Date(entry.createdAt).toLocaleTimeString()}
              </time>
            </li>
          ))}
        </ol>
      )}
    </aside>
  );
}
