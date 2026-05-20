import { useState, useEffect, useCallback } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';
import { DIRECTORIAL_STYLES, type DirectorialStyle, type DirectorialStyleName } from '@animaster/shared/directorialStyles';
import { applyStyleWithTransition, getCurrentStyleName } from '../runtime/directing/styleRuntime';

export default function DirectorialStyleSelector() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const [collapsed, setCollapsed] = useState(true);
  const [activeStyle, setActiveStyle] = useState<DirectorialStyleName | null>(null);

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  // Initialize active style from scene
  useEffect(() => {
    const sceneStyle = scene.visualStyle?.name;
    if (sceneStyle) {
      setActiveStyle(sceneStyle as DirectorialStyleName);
    }
  }, []);

  const applyStyle = useCallback((style: DirectorialStyle) => {
    setActiveStyle(style.name);
    
    // Apply with runtime integration
    applyStyleWithTransition(style);
    
    sceneStore.mutateScene((draft) => {
      // Apply lighting
      draft.atmosphere.lightingTint = style.lighting.tint;
      draft.atmosphere.ambientIntensity = style.lighting.ambientIntensity;

      // Apply pacing
      draft.rhythm.tempo = style.pacing.tempo;
      draft.rhythm.motionEnergyCurve = style.pacing.pauseWeight > 0.5 ? 'ease-out' : 'linear';
      draft.rhythm.pauseFrequencyPerMinute = Math.round(style.pacing.pauseWeight * 10);

      // Apply camera bias
      draft.camera.mode = style.camera.preferredMode as typeof draft.camera.mode;

      // Apply visual style if available
      if (draft.visualStyle) {
        draft.visualStyle.fogDensity = style.atmosphere.fogDensity;
        draft.visualStyle.bloomIntensity = style.atmosphere.bloomIntensity;
        draft.visualStyle.vignetteStrength = style.atmosphere.vignetteStrength;
        draft.visualStyle.grainIntensity = style.atmosphere.grainIntensity;
        draft.visualStyle.saturation = style.colorLanguage.saturation;
        draft.visualStyle.contrastBoost = style.lighting.contrastBoost;
        draft.visualStyle.name = style.name as any;
      }

      // Apply cinematic grammar energy
      if (draft.cinematicGrammar?.template) {
        draft.cinematicGrammar.template.motionEnergyScale = style.movementEnergy;
        draft.cinematicGrammar.template.contrastBoost = style.lighting.contrastBoost;
      }
    });
  }, []);

  return (
    <div className="directorial-style-selector">
      <button className="dss-toggle" onClick={() => setCollapsed(!collapsed)}>
        Directorial Style {collapsed ? '▸' : '▾'}
      </button>

      {!collapsed && (
        <div className="dss-list">
          {DIRECTORIAL_STYLES.map((style) => (
            <button
              key={style.name}
              className={`dss-btn ${activeStyle === style.name ? 'dss-active' : ''}`}
              onClick={() => applyStyle(style)}
            >
              <span className="dss-name">{style.label}</span>
              <span className="dss-desc">{style.description}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
