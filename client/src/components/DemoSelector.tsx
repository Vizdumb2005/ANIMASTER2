// Phase 7 — Task Group 15: Demo Experience Selector UI
// Allows users to launch demo scenarios that prove semantic planning capabilities

import { useState, useEffect } from 'react';
import { fetchDemos, type DemoExperience } from '../services/aiService';
import { interpretScene } from '../services/interpretService';
import { mutateScene } from '../services/mutateService';
import { sceneStore } from '../store/sceneStore';
import { initActorJoints } from '../runtime/initActorJoints';

export default function DemoSelector() {
  const [collapsed, setCollapsed] = useState(true);
  const [demos, setDemos] = useState<DemoExperience[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);
  const [mutationIndex, setMutationIndex] = useState(0);
  const [applyingMutation, setApplyingMutation] = useState(false);

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

  async function applyMutation(mutation: DemoExperience['mutations'][number], index: number) {
    if (applyingMutation || index !== mutationIndex) return;
    setApplyingMutation(true);
    try {
      const currentScene = sceneStore.getScene();
      const directing = sceneStore.getDirectingContext();
      const patch = await mutateScene(mutation.prompt, currentScene, directing);
      sceneStore.applyPatch(patch, mutation.prompt);
      setMutationIndex(index + 1);
    } catch {
      // Fallback handled by mutate route
    } finally {
      setApplyingMutation(false);
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
                  <p className="demo-mutations-label">Scene mutations:</p>
                  {currentDemo.mutations.map((m, i) => (
                    <div key={i} className={`demo-mutation ${i < mutationIndex ? 'done' : i === mutationIndex ? 'next' : 'pending'}`}>
                      <div className="demo-mutation-row">
                        <span className="demo-mutation-prompt">&ldquo;{m.prompt}&rdquo;</span>
                        {i === mutationIndex && (
                          <button
                            className="demo-mutation-apply-btn"
                            onClick={() => applyMutation(m, i)}
                            disabled={applyingMutation}
                            type="button"
                          >
                            {applyingMutation ? '…' : 'Apply'}
                          </button>
                        )}
                        {i < mutationIndex && <span className="demo-mutation-done-mark">✓</span>}
                      </div>
                      <span className="demo-mutation-effect">{m.expectedEffect}</span>
                    </div>
                  ))}
                  {mutationIndex >= currentDemo.mutations.length && (
                    <p className="demo-complete">All mutations applied ✓</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
