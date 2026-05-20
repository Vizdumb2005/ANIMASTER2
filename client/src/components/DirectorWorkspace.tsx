import { useState, useEffect, useCallback } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';
import type { CinematicShot, ShotType } from '@animaster/shared/cinematicShots';

type TabType = 'story' | 'timeline' | 'camera' | 'atmosphere' | 'curve' | 'memory';

export default function DirectorWorkspace() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const [activeTab, setActiveTab] = useState<TabType>('timeline');
  const [memoryData, setMemoryData] = useState<any>(null);
  const [loadingMemory, setLoadingMemory] = useState(false);

  // Subscribe to scene changes
  useEffect(() => {
    return sceneStore.onSceneChange(setScene);
  }, []);

  // Fetch memory data when memory tab is selected
  useEffect(() => {
    if (activeTab === 'memory') {
      setLoadingMemory(true);
      const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3001';
      fetch(`${apiBaseUrl}/ai/memory`)
        .then((res) => res.json())
        .then((data) => {
          setMemoryData(data);
          setLoadingMemory(false);
        })
        .catch(() => setLoadingMemory(false));
    }
  }, [activeTab]);

  const shots = scene.shotSequence ?? [];
  const activeShotId = scene.activeShotId ?? (shots[0]?.id);
  const activeShotIndex = shots.findIndex((s) => s.id === activeShotId);
  const currentShot = shots[activeShotIndex] ?? shots[0];

  const togglePlayback = useCallback(() => {
    sceneStore.mutateScene((draft) => {
      draft.isTimelinePlaying = !(draft.isTimelinePlaying ?? true);
    });
  }, []);

  const jumpToShot = useCallback((shotId: string) => {
    sceneStore.mutateScene((draft) => {
      draft.activeShotId = shotId;
      draft.shotElapsedMs = 0;
    });
  }, []);

  const changePlaybackSpeed = useCallback((speed: number) => {
    sceneStore.setPlaybackSpeed(speed);
    // Force a re-render
    sceneStore.mutateScene(() => {});
  }, []);

  const addShot = useCallback(() => {
    sceneStore.mutateScene((draft) => {
      if (!draft.shotSequence) draft.shotSequence = [];
      const newId = `shot_${Date.now()}`;
      const defaultShot: CinematicShot = {
        id: newId,
        shotType: 'medium',
        emotionalIntent: 'neutral',
        narrativePurpose: 'Additional director cut sequence.',
        framing: {
          composition: 'rule_of_thirds',
          ruleOfThirds: true,
          depthBias: 0.5,
          focalPriority: draft.actors.map(a => a.id),
        },
        camera: {
          angle: 'eye_level',
          movement: 'static',
          lens: 'prime',
          distance: 5.5,
        },
        pacing: {
          duration: 5.0,
          intensity: 0.5,
          tensionCurve: [0.3, 0.5, 0.4],
        },
        atmosphere: {
          lighting: 'natural_soft',
          fogDensity: 0.1,
          ambience: ['quiet_room'],
        },
        continuity: {
          previousShotRelation: 'cut_to_action',
          transitionType: 'cut',
        },
      };
      draft.shotSequence.push(defaultShot);
      draft.activeShotId = newId;
      draft.shotElapsedMs = 0;
    });
  }, []);

  const deleteShot = useCallback((shotId: string) => {
    sceneStore.mutateScene((draft) => {
      if (!draft.shotSequence) return;
      draft.shotSequence = draft.shotSequence.filter(s => s.id !== shotId);
      if (draft.activeShotId === shotId && draft.shotSequence.length > 0) {
        draft.activeShotId = draft.shotSequence[0].id;
        draft.shotElapsedMs = 0;
      }
    });
  }, []);

  const moveShot = useCallback((index: number, direction: 'left' | 'right') => {
    sceneStore.mutateScene((draft) => {
      if (!draft.shotSequence) return;
      const targetIndex = direction === 'left' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= draft.shotSequence.length) return;
      
      const temp = draft.shotSequence[index];
      draft.shotSequence[index] = draft.shotSequence[targetIndex];
      draft.shotSequence[targetIndex] = temp;
    });
  }, []);

  const updateActiveShot = useCallback((updater: (shot: CinematicShot) => void) => {
    sceneStore.mutateScene((draft) => {
      if (!draft.shotSequence) return;
      const idx = draft.shotSequence.findIndex(s => s.id === draft.activeShotId);
      if (idx !== -1) {
        updater(draft.shotSequence[idx]);
      }
    });
  }, []);

  const handleScrub = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentShot) return;
    const progress = parseFloat(e.target.value);
    sceneStore.mutateScene((draft) => {
      draft.shotElapsedMs = progress * currentShot.pacing.duration * 1000;
    });
  }, [currentShot]);

  if (shots.length === 0) {
    return (
      <div className="director-workspace empty-state">
        <p>No active cinematic storyboard sequence found. Submit a prompt to generate sequence.</p>
      </div>
    );
  }

  // Calculate elapsed progress
  const durationMs = currentShot ? currentShot.pacing.duration * 1000 : 1;
  const elapsedMs = scene.shotElapsedMs ?? 0;
  const currentProgress = elapsedMs / durationMs;

  return (
    <div className="director-workspace">
      {/* Workspace Sidebar Tabs */}
      <div className="dw-tabs">
        <button className={`dw-tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          🎞️ Storyboard Timeline
        </button>
        <button className={`dw-tab-btn ${activeTab === 'story' ? 'active' : ''}`} onClick={() => setActiveTab('story')}>
          🎬 Narrative & Theme
        </button>
        <button className={`dw-tab-btn ${activeTab === 'camera' ? 'active' : ''}`} onClick={() => setActiveTab('camera')}>
          🎥 Live Camera
        </button>
        <button className={`dw-tab-btn ${activeTab === 'atmosphere' ? 'active' : ''}`} onClick={() => setActiveTab('atmosphere')}>
          ☁️ Atmosphere Console
        </button>
        <button className={`dw-tab-btn ${activeTab === 'curve' ? 'active' : ''}`} onClick={() => setActiveTab('curve')}>
          📈 Tension Curves
        </button>
        <button className={`dw-tab-btn ${activeTab === 'memory' ? 'active' : ''}`} onClick={() => setActiveTab('memory')}>
          💾 Story Memory
        </button>
      </div>

      {/* Workspace Panel Content */}
      <div className="dw-panel-content">
        
        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <div className="dw-panel timeline-panel">
            <div className="timeline-controls">
              <button className="timeline-play-btn" onClick={togglePlayback}>
                {scene.isTimelinePlaying ? '⏸️ Pause' : '▶️ Play'}
              </button>
              <div className="speed-buttons">
                {[0.5, 1.0, 2.0].map((s) => (
                  <button
                    key={s}
                    className={`speed-btn ${sceneStore.getPlaybackSpeed() === s ? 'active' : ''}`}
                    onClick={() => changePlaybackSpeed(s)}
                  >
                    {s}x
                  </button>
                ))}
              </div>
              <button className="action-btn-green" onClick={addShot}>+ Add Cut</button>
            </div>

            {/* Timeline Track */}
            <div className="timeline-track">
              {shots.map((shot, idx) => {
                const isActive = shot.id === activeShotId;
                return (
                  <div
                    key={shot.id}
                    className={`timeline-shot-block ${isActive ? 'active-block' : ''}`}
                    style={{ flexGrow: shot.pacing.duration }}
                    onClick={() => jumpToShot(shot.id)}
                  >
                    <div className="shot-block-header">
                      <span className="shot-block-type">{shot.shotType.replace('_', ' ')}</span>
                      <span className="shot-block-dur">{shot.pacing.duration}s</span>
                    </div>
                    <div className="shot-block-purpose">{shot.narrativePurpose}</div>
                    
                    {/* Progress Bar inside active block */}
                    {isActive && (
                      <div className="shot-block-progress" style={{ width: `${Math.round(currentProgress * 100)}%` }} />
                    )}

                    {/* Editor Reorder */}
                    <div className="shot-block-actions" onClick={(e) => e.stopPropagation()}>
                      <button className="mini-btn" disabled={idx === 0} onClick={() => moveShot(idx, 'left')}>◀</button>
                      <button className="mini-btn" disabled={idx === shots.length - 1} onClick={() => moveShot(idx, 'right')}>▶</button>
                      <button className="mini-btn-del" onClick={() => deleteShot(shot.id)}>✕</button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Scrub Slider */}
            {currentShot && (
              <div className="scrub-slider-container">
                <span className="scrub-label">Scrub Shot: {Math.round(currentProgress * 100)}%</span>
                <input
                  type="range"
                  min="0"
                  max="0.99"
                  step="0.01"
                  value={currentProgress}
                  onChange={handleScrub}
                  className="scrub-range"
                />
                <span className="time-display">
                  {((elapsedMs) / 1000).toFixed(1)}s / {currentShot.pacing.duration.toFixed(1)}s
                </span>
              </div>
            )}
          </div>
        )}

        {/* NARRATIVE & STORY TAB */}
        {activeTab === 'story' && (
          <div className="dw-panel story-panel">
            <div className="story-header-grid">
              <div className="story-meta-card">
                <span className="card-label">Active Theme</span>
                <h3>{scene.narrativeState?.currentTheme.toUpperCase() ?? 'OBSERVATIONAL'}</h3>
              </div>
              <div className="story-meta-card">
                <span className="card-label">Overall Pace / Rhythm</span>
                <h3>{scene.rhythm?.tempo.toUpperCase() ?? 'MEDIUM'}</h3>
              </div>
            </div>

            <div className="story-grid-layout">
              <div className="story-sec">
                <h4>Emotional Trajectory</h4>
                <div className="trajectory-nodes">
                  {scene.narrativeState?.emotionalTrajectory.map((stage, idx) => (
                    <div key={idx} className="trajectory-node">
                      <span className="node-idx">{idx + 1}</span>
                      <span className="node-text">{stage}</span>
                      {scene.narrativeState?.emotionalTrajectory && idx < (scene.narrativeState.emotionalTrajectory.length - 1) && <span className="node-arrow">🡢</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="story-sec">
                <h4>Narrative Motifs</h4>
                <div className="motifs-chips">
                  {Object.entries(scene.narrativeState?.motifOccurrences ?? {}).map(([motif, count]) => (
                    <div key={motif} className="motif-chip">
                      <span className="motif-name">#{motif}</span>
                      <span className="motif-count">{count}</span>
                    </div>
                  ))}
                  {Object.keys(scene.narrativeState?.motifOccurrences ?? {}).length === 0 && (
                    <p className="no-motifs">No active narrative motifs detected.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* LIVE CAMERA TAB */}
        {activeTab === 'camera' && currentShot && (
          <div className="dw-panel camera-panel">
            <div className="camera-grid-inputs">
              <div className="input-group">
                <label>Shot Type Framing</label>
                <select
                  value={currentShot.shotType}
                  onChange={(e) => updateActiveShot((s) => { s.shotType = e.target.value as ShotType; })}
                >
                  <option value="establishing">Establishing Shot</option>
                  <option value="wide">Wide Landscape</option>
                  <option value="medium">Medium Two-Shot</option>
                  <option value="closeup">Close-up Expression</option>
                  <option value="extreme_closeup">Extreme Close-up Face</option>
                  <option value="reaction">Reaction Shot</option>
                  <option value="tracking">Tracking Camera</option>
                  <option value="isolation">Isolation Space</option>
                </select>
              </div>

              <div className="input-group">
                <label>Camera Angle</label>
                <select
                  value={currentShot.camera.angle}
                  onChange={(e) => updateActiveShot((s) => { s.camera.angle = e.target.value; })}
                >
                  <option value="low">Low Angle (Dominant)</option>
                  <option value="high">High Angle (Submissive)</option>
                  <option value="eye_level">Eye Level (Neutral)</option>
                  <option value="overhead">Overhead / Bird's Eye</option>
                </select>
              </div>

              <div className="input-group">
                <label>Camera Movement</label>
                <select
                  value={currentShot.camera.movement}
                  onChange={(e) => updateActiveShot((s) => { s.camera.movement = e.target.value; })}
                >
                  <option value="static">Static Camera</option>
                  <option value="pan">Panning Horizontal</option>
                  <option value="tilt">Tilting Vertical</option>
                  <option value="tracking">Dynamic Tracking</option>
                  <option value="push_in">Slow Push-In</option>
                </select>
              </div>

              <div className="input-group">
                <label>Lens Type</label>
                <select
                  value={currentShot.camera.lens}
                  onChange={(e) => updateActiveShot((s) => { s.camera.lens = e.target.value; })}
                >
                  <option value="prime">Classic Prime (50mm)</option>
                  <option value="wide_angle">Wide Angle (24mm)</option>
                  <option value="anamorphic">Cinematic Anamorphic</option>
                </select>
              </div>

              <div className="slider-input">
                <label>Camera Distance (Focus Depth): {currentShot.camera.distance}m</label>
                <input
                  type="range"
                  min="2.0"
                  max="15.0"
                  step="0.5"
                  value={currentShot.camera.distance}
                  onChange={(e) => updateActiveShot((s) => { s.camera.distance = parseFloat(e.target.value); })}
                />
              </div>

              <div className="checkboxes-group">
                <label>Framing Rules & Composition</label>
                <div className="chk-row">
                  <input
                    type="checkbox"
                    id="ruleOfThirds"
                    checked={currentShot.framing.ruleOfThirds}
                    onChange={(e) => updateActiveShot((s) => { s.framing.ruleOfThirds = e.target.checked; })}
                  />
                  <label htmlFor="ruleOfThirds">Apply Rule of Thirds alignment</label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ATMOSPHERE CONSOLE TAB */}
        {activeTab === 'atmosphere' && currentShot && (
          <div className="dw-panel atmosphere-panel">
            <div className="atmosphere-grid">
              
              <div className="slider-input">
                <label>Active Fog Density: {Math.round(currentShot.atmosphere.fogDensity * 100)}%</label>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.05"
                  value={currentShot.atmosphere.fogDensity}
                  onChange={(e) => updateActiveShot((s) => { s.atmosphere.fogDensity = parseFloat(e.target.value); })}
                />
              </div>

              <div className="input-group">
                <label>Lighting Theme Style</label>
                <select
                  value={currentShot.atmosphere.lighting}
                  onChange={(e) => updateActiveShot((s) => { s.atmosphere.lighting = e.target.value; })}
                >
                  <option value="natural_soft">Natural Soft Light</option>
                  <option value="high_contrast">High Contrast Film-Noir</option>
                  <option value="ambient_dim">Dim Ambient Shadows</option>
                  <option value="side_key">Dramatic Side-Key</option>
                  <option value="rim_light_accent">Neon Rim Highlight</option>
                </select>
              </div>

              <div className="multi-select-list">
                <label>Ambient Soundscape Loops</label>
                <div className="ambience-chips-container">
                  {['quiet_room', 'distant_wind', 'ominous_hum', 'ticking_clock', 'rain_heavy', 'intense_silence'].map((track) => {
                    const active = currentShot.atmosphere.ambience.includes(track);
                    return (
                      <button
                        key={track}
                        className={`ambience-chip ${active ? 'active' : ''}`}
                        onClick={() => updateActiveShot((s) => {
                          if (active) {
                            s.atmosphere.ambience = s.atmosphere.ambience.filter(t => t !== track);
                          } else {
                            s.atmosphere.ambience.push(track);
                          }
                        })}
                      >
                        🎵 {track.replace('_', ' ')}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TENSION CURVES TAB */}
        {activeTab === 'curve' && currentShot && (
          <div className="dw-panel curve-panel">
            <div className="curve-header">
              <h4>Active Tension Curve Progression</h4>
              <p>SVG-rendered real-time tension values. Playback cursor tracks timeline progress.</p>
            </div>
            
            {/* SVG Tension Plotter */}
            <div className="svg-curve-frame">
              <svg viewBox="0 0 500 120" className="svg-curve">
                <defs>
                  <linearGradient id="curveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4560" stopOpacity="0.4" />
                    <stop offset="100%" stopColor="#7878ff" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Draw curve path */}
                {(() => {
                  const curve = currentShot.pacing.tensionCurve;
                  if (!curve || curve.length < 2) return null;
                  
                  const segments = curve.length - 1;
                  let d = `M 0,${100 - curve[0] * 80}`;
                  for (let i = 1; i <= segments; i++) {
                    const x = (i / segments) * 500;
                    const y = 100 - curve[i] * 80;
                    d += ` L ${x},${y}`;
                  }
                  
                  // Fill area below
                  const fillD = `${d} L 500,110 L 0,110 Z`;

                  return (
                    <>
                      <path d={fillD} fill="url(#curveGradient)" />
                      <path d={d} fill="none" stroke="#ff4560" strokeWidth="3" />
                    </>
                  );
                })()}

                {/* Vertical Playhead Cursor */}
                <line
                  x1={currentProgress * 500}
                  y1="5"
                  x2={currentProgress * 500}
                  y2="115"
                  stroke="#7878ff"
                  strokeWidth="2"
                  strokeDasharray="4"
                />
                
                {/* Playhead indicator ball */}
                {(() => {
                  const curve = currentShot.pacing.tensionCurve;
                  if (!curve) return null;
                  
                  // Simple index finder
                  const totalSegments = curve.length - 1;
                  const rawIndex = currentProgress * totalSegments;
                  const idx = Math.floor(rawIndex);
                  const frac = rawIndex - idx;
                  let val = 0.5;
                  if (idx >= totalSegments) val = curve[curve.length - 1];
                  else if (idx >= 0) val = curve[idx] + (curve[idx + 1] - curve[idx]) * frac;
                  
                  return (
                    <circle
                      cx={currentProgress * 500}
                      cy={100 - val * 80}
                      r="6"
                      fill="#7878ff"
                      stroke="#ffffff"
                      strokeWidth="2"
                    />
                  );
                })()}
              </svg>
            </div>
          </div>
        )}

        {/* STORY MEMORY TAB */}
        {activeTab === 'memory' && (
          <div className="dw-panel memory-panel">
            {loadingMemory ? (
              <p>Querying narrative memory layer...</p>
            ) : memoryData ? (
              <div className="memory-info-scroller">
                
                <div className="memory-section">
                  <h4>Continuity Log & Screen Direction Rules</h4>
                  <div className="memory-tracker-details">
                    <p><strong>180-Degree Alignment Check:</strong> Active. Character directions tracked relative to screen side.</p>
                    <div className="continuity-actors-mapping">
                      {Object.entries(scene.narrativeState?.continuityTracker ?? {}).map(([id, info]: any) => (
                        <div key={id} className="actor-continuity-row">
                          <span>Actor #{id}</span>
                          <span>Initial X: {info.initialX}px</span>
                          <span className="tag-green">Screen Side: {info.screenSide}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="memory-section">
                  <h4>Narrative Milestones (Session Logs)</h4>
                  <ul className="memory-log-list">
                    {memoryData.entries?.map((entry: any, i: number) => (
                      <li key={entry.id || i} className="memory-log-item">
                        <span className="log-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                        <span className="log-prompt">"{entry.prompt}"</span>
                        <div className="log-tags">
                          <span className="log-tag">Theme: {entry.tone}</span>
                          <span className="log-tag">FX: {entry.effects.join(', ') || 'none'}</span>
                        </div>
                      </li>
                    ))}
                    {(!memoryData.entries || memoryData.entries.length === 0) && (
                      <p className="no-memory-entries">No past scene milestones recorded yet.</p>
                    )}
                  </ul>
                </div>
              </div>
            ) : (
              <p>Failed to query narrative state memory.</p>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
