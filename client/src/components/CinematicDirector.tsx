// Phase 7 — Task Group 7 + 13: Cinematic Directing UI
// Users feel like directors, NOT prompt engineers
// NO raw LLM settings (temperature, top_p, token count, provider internals)
// YES cinematic controls: Emotional Intensity, Visual Density, etc.

import { useState } from 'react';
import { sceneStore } from '../store/sceneStore';

interface DirectorControl {
  key: string;
  label: string;
  description: string;
  lowLabel: string;
  highLabel: string;
  defaultValue: number;
}

const DIRECTOR_CONTROLS: DirectorControl[] = [
  {
    key: 'emotionalIntensity',
    label: 'Emotional Intensity',
    description: 'How deeply felt the scene is',
    lowLabel: 'Subdued',
    highLabel: 'Overwhelming',
    defaultValue: 50
  },
  {
    key: 'visualDensity',
    label: 'Visual Density',
    description: 'How much fills the frame',
    lowLabel: 'Sparse',
    highLabel: 'Cluttered',
    defaultValue: 50
  },
  {
    key: 'environmentalRichness',
    label: 'Environmental Richness',
    description: 'Detail and complexity of the world',
    lowLabel: 'Minimal',
    highLabel: 'Immersive',
    defaultValue: 50
  },
  {
    key: 'symbolicAbstraction',
    label: 'Symbolic Abstraction',
    description: 'How literal vs metaphorical the staging is',
    lowLabel: 'Literal',
    highLabel: 'Abstract',
    defaultValue: 30
  },
  {
    key: 'dialogueNaturalism',
    label: 'Dialogue Naturalism',
    description: 'How natural vs stylized the delivery',
    lowLabel: 'Stylized',
    highLabel: 'Naturalistic',
    defaultValue: 60
  },
  {
    key: 'cinematicRealism',
    label: 'Cinematic Realism',
    description: 'How grounded the visual language is',
    lowLabel: 'Expressionistic',
    highLabel: 'Grounded',
    defaultValue: 50
  },
  {
    key: 'cameraAggression',
    label: 'Camera Aggression',
    description: 'How active and intrusive the camera is',
    lowLabel: 'Observational',
    highLabel: 'Confrontational',
    defaultValue: 30
  },
  {
    key: 'atmosphereWeight',
    label: 'Atmosphere Weight',
    description: 'The heaviness of the visual atmosphere',
    lowLabel: 'Light',
    highLabel: 'Oppressive',
    defaultValue: 50
  },
  {
    key: 'directorialIntensity',
    label: 'Directorial Intensity',
    description: 'Overall strength of cinematic direction',
    lowLabel: 'Restrained',
    highLabel: 'Forceful',
    defaultValue: 50
  }
];

export default function CinematicDirector() {
  const [collapsed, setCollapsed] = useState(true);
  const [values, setValues] = useState<Record<string, number>>(() => {
    const stored = sceneStore.getDirectorIntent();
    return Object.fromEntries(
      DIRECTOR_CONTROLS.map(c => [c.key, Math.round((stored[c.key] ?? c.defaultValue / 100) * 100)])
    );
  });

  function applyDirectorControl(key: string, value: number) {
    const scene = sceneStore.getScene();
    const normalized = value / 100;
    sceneStore.setDirectorIntent(key, normalized);
    if (scene.version === 0) return;

    switch (key) {
      case 'emotionalIntensity': {
        const motionScale = 0.3 + normalized * 1.2;
        const pauseFreq = Math.round(12 - normalized * 10);
        sceneStore.applyPatch({
          ...scene,
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              motionEnergyScale: motionScale,
              pauseFrequency: pauseFreq
            }
          }
        }, `[director] emotional intensity: ${value}%`);
        break;
      }
      case 'visualDensity': {
        const ambientIntensity = 0.3 + (1 - normalized) * 0.7;
        sceneStore.applyPatch({
          ...scene,
          atmosphere: { ...scene.atmosphere, ambientIntensity }
        }, `[director] visual density: ${value}%`);
        break;
      }
      case 'environmentalRichness': {
        // Maps to environment detail level through contrast
        const contrastBoost = normalized * 0.8;
        sceneStore.applyPatch({
          ...scene,
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              contrastBoost
            }
          }
        }, `[director] environmental richness: ${value}%`);
        break;
      }
      case 'cameraAggression': {
        const zoom = 0.8 + normalized * 0.6;
        const spacingMult = 1.2 - normalized * 0.6;
        sceneStore.applyPatch({
          ...scene,
          camera: { ...scene.camera, zoom },
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              spacingMultiplier: spacingMult
            }
          }
        }, `[director] camera aggression: ${value}%`);
        break;
      }
      case 'atmosphereWeight': {
        const ambIntensity = 1.0 - normalized * 0.6;
        const tint = normalized > 0.6 ? 'cold' : normalized < 0.3 ? 'warm' : 'rgba(0,0,0,0)';
        sceneStore.applyPatch({
          ...scene,
          atmosphere: { ...scene.atmosphere, ambientIntensity: ambIntensity, lightingTint: tint }
        }, `[director] atmosphere weight: ${value}%`);
        break;
      }
      case 'directorialIntensity': {
        const headroom = 1.4 - normalized * 0.8;
        const motionEnergy = 0.4 + normalized * 1.1;
        sceneStore.applyPatch({
          ...scene,
          cinematicGrammar: {
            ...scene.cinematicGrammar,
            template: {
              ...scene.cinematicGrammar.template,
              headroom,
              motionEnergyScale: motionEnergy
            }
          }
        }, `[director] directorial intensity: ${value}%`);
        break;
      }
      case 'symbolicAbstraction':
      case 'dialogueNaturalism':
      case 'cinematicRealism':
        // These controls influence future AI generation but don't directly modify runtime state
        break;
    }
  }

  if (collapsed) {
    return (
      <button className="director-toggle" onClick={() => setCollapsed(false)}>
        Director
      </button>
    );
  }

  return (
    <div className="cinematic-director">
      <div className="director-header">
        <span className="director-title">Cinematic Director</span>
        <button className="director-close" onClick={() => setCollapsed(true)}>
          &times;
        </button>
      </div>
      <p className="director-subtitle">Shape the scene as a director, not an engineer.</p>
      {DIRECTOR_CONTROLS.map(control => {
        const value = values[control.key] ?? control.defaultValue;
        return (
          <div key={control.key} className="director-slider-group">
            <label className="director-slider-label">
              {control.label}
              <span className="director-slider-desc">{control.description}</span>
            </label>
            <div className="director-slider-range-labels">
              <span>{control.lowLabel}</span>
              <span>{control.highLabel}</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={value}
              aria-label={control.label}
              onChange={(e) => {
                const v = Number(e.target.value);
                setValues(prev => ({ ...prev, [control.key]: v }));
                applyDirectorControl(control.key, v);
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
