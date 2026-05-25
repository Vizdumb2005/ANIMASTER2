// Phase 7 — Task Group 10: AI Debug & Reasoning Visualization
// Developer cinematic introspection overlay showing:
// emotional interpretation, active cinematic intentions, staging logic,
// environment reasoning, camera reasoning, pacing reasoning, visual style reasoning

import { useEffect, useState } from 'react';
import { debugIntent, fetchAIStatus, fetchMemory, type IntentDebug, type AIStatus, type MemoryState } from '../services/aiService';

type TabId = 'intent' | 'providers' | 'memory' | 'agents';

export default function AIDebugPanel() {
  const [visible, setVisible] = useState(false);
  const [tab, setTab] = useState<TabId>('intent');
  const [promptInput, setPromptInput] = useState('');
  const [intentDebug, setIntentDebug] = useState<IntentDebug | null>(null);
  const [aiStatus, setAIStatus] = useState<AIStatus | null>(null);
  const [memory, setMemory] = useState<MemoryState | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey && event.shiftKey && event.key === 'I') {
        event.preventDefault();
        setVisible(prev => !prev);
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleDebugIntent() {
    if (!promptInput.trim()) return;
    setLoading(true);
    setError(null);
    const result = await debugIntent(promptInput.trim());
    if (!result.ok) {
      setError(result.error.message);
    } else {
      setIntentDebug(result.value);
    }
    setLoading(false);
  }

  async function handleLoadStatus() {
    setLoading(true);
    setError(null);
    const result = await fetchAIStatus();
    if (!result.ok) {
      setError(result.error.message);
    } else {
      setAIStatus(result.value);
    }
    setLoading(false);
  }

  async function handleLoadMemory() {
    setLoading(true);
    setError(null);
    const result = await fetchMemory();
    if (!result.ok) {
      setError(result.error.message);
    } else {
      setMemory(result.value);
    }
    setLoading(false);
  }

  if (!visible) return null;

  return (
    <div className="ai-debug-panel">
      <div className="ai-debug-header">
        <span className="ai-debug-title">AI Orchestration Debug (Ctrl+Shift+I)</span>
        <button className="ai-debug-close" onClick={() => setVisible(false)} type="button">&times;</button>
      </div>

      <div className="ai-debug-tabs">
        {(['intent', 'providers', 'memory', 'agents'] as TabId[]).map(t => (
          <button
            key={t}
            className={`ai-debug-tab ${tab === t ? 'active' : ''}`}
            onClick={() => {
              setTab(t);
              if (t === 'providers') handleLoadStatus();
              if (t === 'memory') handleLoadMemory();
            }}
            type="button"
          >
            {t === 'intent' ? 'Intent Debug' : t === 'providers' ? 'Providers' : t === 'memory' ? 'Memory' : 'Agents'}
          </button>
        ))}
      </div>

      {error && <p className="ai-debug-error">{error}</p>}

      <div className="ai-debug-content">
        {tab === 'intent' && (
          <div className="ai-debug-intent">
            <div className="ai-debug-input-row">
              <input
                className="ai-debug-input"
                value={promptInput}
                onChange={e => setPromptInput(e.target.value)}
                placeholder="Enter a prompt to debug..."
                onKeyDown={e => { if (e.key === 'Enter') handleDebugIntent(); }}
              />
              <button className="ai-debug-btn" onClick={handleDebugIntent} disabled={loading} type="button">
                {loading ? '...' : 'Debug'}
              </button>
            </div>
            {intentDebug && (
              <div className="ai-debug-results">
                <h4>Cinematic Intent</h4>
                <div className="ai-debug-intent-grid">
                  {Object.entries(intentDebug.intent).map(([key, val]) => (
                    <div key={key} className="ai-debug-intent-item">
                      <span className="ai-debug-intent-key">{key}</span>
                      <span className="ai-debug-intent-val">
                        {typeof val === 'number' ? val.toFixed(2) : String(val)}
                      </span>
                      {typeof val === 'number' && (
                        <div className="ai-debug-bar">
                          <div className="ai-debug-bar-fill" style={{ width: `${Math.min(val * 100, 100)}%` }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <h4>Semantic Controls</h4>
                <div className="ai-debug-intent-grid">
                  {Object.entries(intentDebug.semanticControls).map(([key, val]) => (
                    <div key={key} className="ai-debug-intent-item">
                      <span className="ai-debug-intent-key">{key}</span>
                      <span className="ai-debug-intent-val">{(val as number).toFixed(0)}%</span>
                      <div className="ai-debug-bar">
                        <div className="ai-debug-bar-fill" style={{ width: `${val}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <h4>Agent Reports</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports, null, 2)}</pre>
                <h4>Scene Graph Plan</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.sceneGraphPlan, null, 2)}</pre>
              </div>
            )}
          </div>
        )}

        {tab === 'providers' && (
          <div className="ai-debug-providers">
            {aiStatus ? (
              <>
                <h4>Registered Providers</h4>
                <div className="ai-debug-provider-list">
                  {aiStatus.registeredProviders.map(name => (
                    <div key={name} className="ai-debug-provider-item">
                      <span className="ai-debug-provider-name">{name}</span>
                      <span className={`ai-debug-provider-status ${aiStatus.providerAvailability[name] ? 'available' : 'unavailable'}`}>
                        {aiStatus.providerAvailability[name] ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  ))}
                </div>
                <h4>Orchestrator Config</h4>
                <pre className="ai-debug-json">{JSON.stringify(aiStatus.orchestrator, null, 2)}</pre>
                <h4>Provider Details</h4>
                <pre className="ai-debug-json">{JSON.stringify(aiStatus.providers, null, 2)}</pre>
              </>
            ) : (
              <p>{loading ? 'Loading...' : 'Click Providers tab to load'}</p>
            )}
          </div>
        )}

        {tab === 'memory' && (
          <div className="ai-debug-memory">
            {memory ? (
              <>
                <h4>Emotional State</h4>
                <pre className="ai-debug-json">{JSON.stringify(memory.emotionalState, null, 2)}</pre>
                <h4>Continuity State</h4>
                <pre className="ai-debug-json">{JSON.stringify(memory.continuityState, null, 2)}</pre>
                <h4>Recent History ({memory.recentHistory.length} entries)</h4>
                <pre className="ai-debug-json">{JSON.stringify(memory.recentHistory, null, 2)}</pre>
              </>
            ) : (
              <p>{loading ? 'Loading...' : 'Click Memory tab to load'}</p>
            )}
          </div>
        )}

        {tab === 'agents' && (
          <div className="ai-debug-agents">
            <p>Enter a prompt in the Intent Debug tab to see agent reports.</p>
            {intentDebug && (
              <>
                <h4>Cinematography</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports['cinematography' as keyof typeof intentDebug.agentReports], null, 2)}</pre>
                <h4>Environment</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports['environment' as keyof typeof intentDebug.agentReports], null, 2)}</pre>
                <h4>Emotional Arc</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports['emotionalArc' as keyof typeof intentDebug.agentReports], null, 2)}</pre>
                <h4>Blocking</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports['blocking' as keyof typeof intentDebug.agentReports], null, 2)}</pre>
                <h4>Dialogue</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports['dialogue' as keyof typeof intentDebug.agentReports], null, 2)}</pre>
                <h4>Lighting</h4>
                <pre className="ai-debug-json">{JSON.stringify(intentDebug.agentReports['lighting' as keyof typeof intentDebug.agentReports], null, 2)}</pre>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
