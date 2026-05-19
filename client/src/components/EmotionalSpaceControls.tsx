import { useState, useEffect, useCallback } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph } from '@animaster/shared/scene';
import { deriveEmotionalSpaceFromTone, createDefaultEmotionalSpace, type EmotionalSpaceState } from '@animaster/shared/emotionalSpace';

type DimensionConfig = {
  key: keyof EmotionalSpaceState;
  label: string;
  min: number;
  max: number;
  step: number;
};

const DIMENSIONS: DimensionConfig[] = [
  { key: 'intimacy', label: 'Intimacy', min: 0, max: 1, step: 0.05 },
  { key: 'dominance', label: 'Dominance', min: -1, max: 1, step: 0.05 },
  { key: 'emotionalDistance', label: 'Emotional Distance', min: 0, max: 1, step: 0.05 },
  { key: 'socialTension', label: 'Social Tension', min: 0, max: 1, step: 0.05 },
  { key: 'vulnerability', label: 'Vulnerability', min: 0, max: 1, step: 0.05 },
  { key: 'isolation', label: 'Isolation', min: 0, max: 1, step: 0.05 },
];

export default function EmotionalSpaceControls() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const [space, setSpace] = useState<EmotionalSpaceState>(createDefaultEmotionalSpace());
  const [collapsed, setCollapsed] = useState(true);

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  useEffect(() => {
    const tone = scene.cinematicGrammar?.tone ?? 'neutral';
    const derived = deriveEmotionalSpaceFromTone(tone);
    setSpace({ ...createDefaultEmotionalSpace(), ...derived });
  }, [scene.cinematicGrammar?.tone]);

  const handleChange = useCallback((key: keyof EmotionalSpaceState, value: number) => {
    setSpace((prev) => ({ ...prev, [key]: value }));
    // Apply to runtime via mutation
    sceneStore.mutateScene((draft) => {
      if (!draft.emotionalSpatial) {
        draft.emotionalSpatial = {
          spatialIntent: 'neutral',
          negativeSpaceRatio: 0.5,
          frameEdgeBias: { x: 0, y: 0 },
          compositionTension: 0,
        };
      }
      // Map emotional space dimensions to spatial state
      if (key === 'isolation') {
        draft.emotionalSpatial.negativeSpaceRatio = 0.3 + value * 0.5;
        draft.emotionalSpatial.spatialIntent = value > 0.6 ? 'isolation' : draft.emotionalSpatial.spatialIntent;
      } else if (key === 'intimacy') {
        draft.emotionalSpatial.spatialIntent = value > 0.6 ? 'intimacy' : draft.emotionalSpatial.spatialIntent;
        draft.emotionalSpatial.negativeSpaceRatio = Math.max(0.1, 0.5 - value * 0.3);
      } else if (key === 'socialTension') {
        draft.emotionalSpatial.compositionTension = value;
        draft.emotionalSpatial.spatialIntent = value > 0.7 ? 'confrontation' : draft.emotionalSpatial.spatialIntent;
      } else if (key === 'vulnerability') {
        draft.emotionalSpatial.spatialIntent = value > 0.6 ? 'vulnerability' : draft.emotionalSpatial.spatialIntent;
      } else if (key === 'dominance') {
        draft.emotionalSpatial.spatialIntent = value > 0.5 ? 'dominance' : value < -0.5 ? 'vulnerability' : draft.emotionalSpatial.spatialIntent;
      }
    });
  }, []);

  return (
    <div className="emotional-space-controls">
      <button className="esc-toggle" onClick={() => setCollapsed(!collapsed)}>
        Emotional Space {collapsed ? '▸' : '▾'}
      </button>

      {!collapsed && (
        <div className="esc-sliders">
          {DIMENSIONS.map((dim) => (
            <div key={dim.key} className="esc-slider-row">
              <label className="esc-label">{dim.label}</label>
              <input
                type="range"
                className="esc-slider"
                min={dim.min}
                max={dim.max}
                step={dim.step}
                value={space[dim.key]}
                onChange={(e) => handleChange(dim.key, parseFloat(e.target.value))}
              />
              <span className="esc-value">{Math.round(space[dim.key] * 100)}%</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
