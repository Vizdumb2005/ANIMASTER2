import { useEffect, useRef, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { sceneStore } from '../../store/sceneStore';
import { startTickLoop } from '../../runtime/tickLoop';
import { evaluateActor } from '../../runtime/actorEvaluator';
import { evaluateScene } from '../../runtime/sceneEvaluator';
import { getVideoExporter } from '../../runtime/export/VideoExporter';
import type { SceneGraph } from '@animaster/shared/scene';

import EnvironmentMesh from './EnvironmentMesh';
import CharacterMesh from './CharacterMesh';
import AtmosphereEffects from './AtmosphereEffects';
import SceneLighting from './SceneLighting';
import SceneProps from './SceneProps';
import SceneCameraController from './SceneCamera';
import ScenePostProcessing from './ScenePostProcessing';

/** Inner component that registers the Three.js canvas with the export pipeline */
function CanvasExporterBridge() {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const exporter = getVideoExporter();
    exporter.setSourceCanvas(gl.domElement);
  }, [gl]);
  return null;
}

export default function CinematicScene() {
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const stopLoopRef = useRef<() => void>(() => {});

  // Subscribe to scene changes
  useEffect(() => {
    const unsubscribe = sceneStore.onSceneChange((newScene) => {
      setScene(newScene);
    });
    return () => { unsubscribe(); };
  }, []);

  // Tick loop — runs evaluators and mutates scene
  useEffect(() => {
    stopLoopRef.current = startTickLoop((deltaMs) => {
      if (sceneStore.isPaused()) return;
      const scaledDelta = deltaMs * sceneStore.getPlaybackSpeed();
      sceneStore.mutateScene((draft) => {
        draft.actors = draft.actors.map((actor) => evaluateActor(actor, scaledDelta, draft));
        evaluateScene(draft);
      });
    });

    return () => {
      stopLoopRef.current();
    };
  }, []);

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const envType = scene.environment?.type ?? 'indoor_room';
  const tensionLevel = scene.tensionState?.currentLevel ?? 0;

  // Map actor positions to 3D for camera
  const actorPositions = scene.actors.map((a) => ({
    x: (a.position.x - 480) / 100,
    z: (a.position.y - 270) / 100,
  }));

  // Fog color based on environment
  const fogColor = (() => {
    if (envType.startsWith('outdoor_')) return '#0a0a15';
    if (envType === 'hospital') return '#253035';
    if (envType === 'subway') return '#121010';
    return '#1a1520';
  })();

  return (
    <div className="canvas-view" style={{ width: '100%', height: '100%' }}>
      <Canvas
        shadows
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.0,
          outputColorSpace: THREE.SRGBColorSpace,
        }}
        camera={{
          fov: 50,
          near: 0.1,
          far: 100,
          position: [0, 3, 8],
        }}
        style={{ background: '#000000' }}
      >
        {/* Fog */}
        <fog attach="fog" args={[fogColor, 8, 35]} />

        {/* Lighting driven by tone */}
        <SceneLighting tone={tone} tensionLevel={tensionLevel} />

        {/* Procedural environment */}
        <EnvironmentMesh envType={envType} tone={tone} worldLayout={scene.worldLayout} visualStyle={scene.visualStyle} />

        {/* Environmental storytelling props */}
        <SceneProps envType={envType} tone={tone} />

        {/* Atmosphere effects (rain, fog, dust, etc.) */}
        <AtmosphereEffects
          effects={scene.atmosphere?.effects ?? ['none']}
          lightingTint={scene.atmosphere?.lightingTint ?? 'rgba(0,0,0,0)'}
          ambientIntensity={scene.atmosphere?.ambientIntensity ?? 1}
        />

        {/* Characters */}
        {scene.actors.map((actor, i) => (
          <CharacterMesh key={actor.id} actor={actor} index={i} />
        ))}

        {/* Camera controller */}
        <SceneCameraController
          camera={scene.camera}
          tone={tone}
          tensionLevel={tensionLevel}
          actorPositions={actorPositions}
        />

        {/* Post-processing */}
        <ScenePostProcessing tone={tone} tensionLevel={tensionLevel} />
      {/* Bridge: registers canvas with export pipeline */}
      <CanvasExporterBridge />
      </Canvas>
    </div>
  );
}
