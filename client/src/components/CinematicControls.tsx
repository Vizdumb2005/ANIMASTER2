import { useState } from 'react';
import { sceneStore } from '../store/sceneStore';

export default function CinematicControls() {
  const [collapsed, setCollapsed] = useState(true);
  const [pacing, setPacing] = useState(50);
  const [tension, setTension] = useState(30);
  const [atmosphereDensity, setAtmosphereDensity] = useState(50);
  const [cameraEnergy, setCameraEnergy] = useState(40);
  const [emotionalDistance, setEmotionalDistance] = useState(50);

  function applyControl(key: string, value: number) {
    const scene = sceneStore.getScene();
    if (scene.actors.length === 0) return;

    switch (key) {
      case 'pacing': {
        const tempo = value < 30 ? 'slow' : value > 70 ? 'fast' : 'medium';
        const pauseFreq = Math.round(12 - (value / 100) * 10);
        sceneStore.applyPatch({
          ...scene,
          rhythm: { ...scene.rhythm, tempo, pauseFrequencyPerMinute: pauseFreq }
        }, `[control] pacing: ${value}%`);
        break;
      }
      case 'tension': {
        const tensionLevel = value / 100;
        const spacingMult = 1.0 - tensionLevel * 0.4;
        sceneStore.applyPatch({
          ...scene,
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              spacingMultiplier: spacingMult,
              contrastBoost: tensionLevel * 0.7
            }
          }
        }, `[control] tension: ${value}%`);
        break;
      }
      case 'atmosphereDensity': {
        const ambientIntensity = 0.3 + (1 - value / 100) * 0.7;
        sceneStore.applyPatch({
          ...scene,
          atmosphere: { ...scene.atmosphere, ambientIntensity }
        }, `[control] atmosphere: ${value}%`);
        break;
      }
      case 'cameraEnergy': {
        const motionScale = 0.3 + (value / 100) * 1.2;
        sceneStore.applyPatch({
          ...scene,
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              motionEnergyScale: motionScale
            }
          }
        }, `[control] camera energy: ${value}%`);
        break;
      }
      case 'emotionalDistance': {
        const headroom = 0.6 + (value / 100) * 1.0;
        const zoom = 1.2 - (value / 100) * 0.5;
        sceneStore.applyPatch({
          ...scene,
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              headroom
            }
          },
          camera: { ...scene.camera, zoom }
        }, `[control] emotional distance: ${value}%`);
        break;
      }
    }
  }

  if (collapsed) {
    return (
      <button className="cinematic-controls-toggle" onClick={() => setCollapsed(false)}>
        Controls
      </button>
    );
  }

  return (
    <div className="cinematic-controls">
      <div className="cinematic-controls-header">
        <span className="cinematic-controls-title">Cinematic Controls</span>
        <button className="cinematic-controls-close" onClick={() => setCollapsed(true)}>
          &times;
        </button>
      </div>
      <div className="cinematic-slider-group">
        <label className="cinematic-slider-label">
          Pacing
          <span className="cinematic-slider-value">{pacing < 30 ? 'Slow' : pacing > 70 ? 'Fast' : 'Medium'}</span>
        </label>
        <input
          type="range" min="0" max="100" value={pacing}
          onChange={(e) => { const v = Number(e.target.value); setPacing(v); applyControl('pacing', v); }}
        />
      </div>
      <div className="cinematic-slider-group">
        <label className="cinematic-slider-label">
          Tension
          <span className="cinematic-slider-value">{tension}%</span>
        </label>
        <input
          type="range" min="0" max="100" value={tension}
          onChange={(e) => { const v = Number(e.target.value); setTension(v); applyControl('tension', v); }}
        />
      </div>
      <div className="cinematic-slider-group">
        <label className="cinematic-slider-label">
          Atmosphere
          <span className="cinematic-slider-value">{atmosphereDensity}%</span>
        </label>
        <input
          type="range" min="0" max="100" value={atmosphereDensity}
          onChange={(e) => { const v = Number(e.target.value); setAtmosphereDensity(v); applyControl('atmosphereDensity', v); }}
        />
      </div>
      <div className="cinematic-slider-group">
        <label className="cinematic-slider-label">
          Camera Energy
          <span className="cinematic-slider-value">{cameraEnergy}%</span>
        </label>
        <input
          type="range" min="0" max="100" value={cameraEnergy}
          onChange={(e) => { const v = Number(e.target.value); setCameraEnergy(v); applyControl('cameraEnergy', v); }}
        />
      </div>
      <div className="cinematic-slider-group">
        <label className="cinematic-slider-label">
          Emotional Distance
          <span className="cinematic-slider-value">{emotionalDistance < 30 ? 'Intimate' : emotionalDistance > 70 ? 'Distant' : 'Balanced'}</span>
        </label>
        <input
          type="range" min="0" max="100" value={emotionalDistance}
          onChange={(e) => { const v = Number(e.target.value); setEmotionalDistance(v); applyControl('emotionalDistance', v); }}
        />
      </div>
    </div>
  );
}
