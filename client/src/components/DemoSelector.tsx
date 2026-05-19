// Phase 7 — Task Group 15: Demo Experience Selector UI
// Allows users to launch demo scenarios that prove semantic planning capabilities

import { useState, useEffect } from 'react';
import { fetchDemos, type DemoExperience } from '../services/aiService';
import { interpretScene } from '../services/interpretService';
import { sceneStore } from '../store/sceneStore';
import { initActorJoints } from '../runtime/initActorJoints';

export default function DemoSelector() {
  const [collapsed, setCollapsed] = useState(true);
  const [demos, setDemos] = useState<DemoExperience[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [mutationIndex, setMutationIndex] = useState(0);

  useEffect(() => {
    if (!collapsed && demos.length === 0) {
      loadDemos();
    }
  }, [collapsed, demos.length]);

  async function loadDemos() {
    try {
      const result = await fetchDemos();
      setDemos(result);
    } catch {
      // Server might not be running — show empty
    }
  }

  async function launchDemo(demo: DemoExperience) {
    setLoading(true);
    try {
      const scene = await interpretScene(demo.initialPrompt);
      for (const actor of scene.actors) {
        actor.joints = initActorJoints(actor.position);
      }
      sceneStore.setScene(scene);
      setActiveDemo(demo.id);
      setMutationIndex(0);
    } catch {
      // Fallback handled by interpret route
    } finally {
      setLoading(false);
    }
  }

  if (collapsed) {
    return (
      <button className="demo-toggle" onClick={() => setCollapsed(false)}>
        Demos
      </button>
    );
  }

  const currentDemo = demos.find(d => d.id === activeDemo);

  return (
    <div className="demo-selector">
      <div className="demo-header">
        <span className="demo-title">Demo Experiences</span>
        <button className="demo-close" onClick={() => setCollapsed(true)}>&times;</button>
      </div>
      <p className="demo-subtitle">Cinematic scenarios proving semantic planning</p>

      {demos.length === 0 ? (
        <p className="demo-loading">Loading demos...</p>
      ) : (
        <div className="demo-list">
          {demos.map(demo => (
            <div key={demo.id} className={`demo-card ${activeDemo === demo.id ? 'active' : ''}`}>
              <div className="demo-card-header">
                <strong>{demo.title}</strong>
                <button
                  className="demo-launch-btn"
                  onClick={() => launchDemo(demo)}
                  disabled={loading}
                  type="button"
                >
                  {loading && activeDemo === demo.id ? '...' : 'Launch'}
                </button>
              </div>
              <p className="demo-card-desc">{demo.description}</p>
              {activeDemo === demo.id && currentDemo && (
                <div className="demo-mutations">
                  <p className="demo-mutations-label">Suggested mutations:</p>
                  {currentDemo.mutations.map((m, i) => (
                    <div key={i} className={`demo-mutation ${i < mutationIndex ? 'done' : i === mutationIndex ? 'next' : ''}`}>
                      <span className="demo-mutation-prompt">&ldquo;{m.prompt}&rdquo;</span>
                      <span className="demo-mutation-effect">{m.expectedEffect}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
