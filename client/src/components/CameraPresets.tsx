import { sceneStore } from '../store/sceneStore';

const CAMERA_PROFILES: Record<string, { label: string; zoom: number; mode: string; damping: number; headroom: number }> = {
  observational: { label: 'Observational', zoom: 0.85, mode: 'wide_shot', damping: 0.95, headroom: 1.4 },
  intimate: { label: 'Intimate', zoom: 1.15, mode: 'close_up', damping: 0.92, headroom: 0.7 },
  oppressive: { label: 'Oppressive', zoom: 1.25, mode: 'tension', damping: 0.88, headroom: 0.5 },
  lonely: { label: 'Lonely', zoom: 0.75, mode: 'wide_shot', damping: 0.97, headroom: 1.6 },
  tense: { label: 'Tense', zoom: 1.05, mode: 'tension', damping: 0.85, headroom: 0.8 },
  documentary: { label: 'Documentary', zoom: 0.9, mode: 'follow', damping: 0.9, headroom: 1.2 },
  restrained: { label: 'Restrained', zoom: 0.95, mode: 'static', damping: 0.98, headroom: 1.0 },
  anxious: { label: 'Anxious', zoom: 1.1, mode: 'follow', damping: 0.8, headroom: 0.9 },
};

export default function CameraPresets() {
  function applyPreset(key: string) {
    const profile = CAMERA_PROFILES[key];
    if (!profile) return;
    const scene = sceneStore.getScene();
    if (scene.version === 0) return;
    sceneStore.applyPatch({
      ...scene,
      camera: { ...scene.camera, zoom: profile.zoom, mode: profile.mode as typeof scene.camera.mode },
      cinematicGrammar: {
        ...scene.cinematicGrammar,
        template: {
          ...scene.cinematicGrammar.template,
          headroom: profile.headroom,
          motionEnergyScale: profile.damping < 0.9 ? 1.3 : 0.8
        }
      }
    }, `[camera] ${profile.label}`);
  }

  return (
    <div className="camera-presets">
      <span className="camera-presets-label">Camera</span>
      <div className="camera-presets-grid">
        {Object.entries(CAMERA_PROFILES).map(([key, profile]) => (
          <button key={key} className="camera-preset-btn" onClick={() => applyPreset(key)}>
            {profile.label}
          </button>
        ))}
      </div>
    </div>
  );
}
