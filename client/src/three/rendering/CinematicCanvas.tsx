/**
 * CinematicCanvas — React component wrapping React Three Fiber's Canvas
 * with Animaster's cinematic rendering defaults.
 */
import { Canvas } from '@react-three/fiber';
import type { ReactNode } from 'react';
import * as THREE from 'three';

interface CinematicCanvasProps {
  children: ReactNode;
  className?: string;
  shadows?: boolean;
  flat?: boolean;
}

export default function CinematicCanvas({
  children,
  className,
  shadows = true,
  flat = false,
}: CinematicCanvasProps) {
  return (
    <Canvas
      className={className}
      shadows={shadows}
      flat={flat}
      dpr={[1, 2]}
      gl={{
        antialias: true,
        toneMapping: THREE.ACESFilmicToneMapping,
        toneMappingExposure: 1.0,
      }}
      camera={{ position: [0, 2, 8], fov: 50, near: 0.1, far: 100 }}
      onCreated={({ gl }) => {
        gl.outputColorSpace = THREE.SRGBColorSpace;
        gl.shadowMap.type = THREE.PCFSoftShadowMap;
      }}
    >
      {children}
    </Canvas>
  );
}
