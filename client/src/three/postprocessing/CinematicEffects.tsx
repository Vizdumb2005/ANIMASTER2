/**
 * CinematicEffects — React Three Fiber component providing
 * post-processing effects driven by Animaster's tone system.
 */
import {
  EffectComposer,
  Bloom,
  Vignette,
  DepthOfField,
  Noise,
} from '@react-three/postprocessing';
import { BlendFunction, KernelSize } from 'postprocessing';

interface CinematicEffectsProps {
  tone?: string;
  bloomIntensity?: number;
  vignetteOffset?: number;
  vignetteDarkness?: number;
  dofEnabled?: boolean;
  dofFocusDistance?: number;
  dofFocalLength?: number;
  dofBokehScale?: number;
  noiseOpacity?: number;
}

function CinematicEffectsWithDOF({
  bloomIntensity,
  vignetteOffset,
  vignetteDarkness,
  dofFocusDistance,
  dofFocalLength,
  dofBokehScale,
  noiseOpacity,
}: Required<Omit<CinematicEffectsProps, 'tone' | 'dofEnabled'>>) {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={bloomIntensity} luminanceThreshold={0.6} luminanceSmoothing={0.3} kernelSize={KernelSize.LARGE} />
      <Vignette offset={vignetteOffset} darkness={vignetteDarkness} blendFunction={BlendFunction.NORMAL} />
      <DepthOfField focusDistance={dofFocusDistance} focalLength={dofFocalLength} bokehScale={dofBokehScale} />
      <Noise opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

function CinematicEffectsNoDOF({
  bloomIntensity,
  vignetteOffset,
  vignetteDarkness,
  noiseOpacity,
}: { bloomIntensity: number; vignetteOffset: number; vignetteDarkness: number; noiseOpacity: number }) {
  return (
    <EffectComposer multisampling={4}>
      <Bloom intensity={bloomIntensity} luminanceThreshold={0.6} luminanceSmoothing={0.3} kernelSize={KernelSize.LARGE} />
      <Vignette offset={vignetteOffset} darkness={vignetteDarkness} blendFunction={BlendFunction.NORMAL} />
      <Noise opacity={noiseOpacity} blendFunction={BlendFunction.OVERLAY} />
    </EffectComposer>
  );
}

export default function CinematicEffects({
  bloomIntensity = 0.3,
  vignetteOffset = 0.3,
  vignetteDarkness = 0.5,
  dofEnabled = false,
  dofFocusDistance = 0.01,
  dofFocalLength = 0.05,
  dofBokehScale = 3,
  noiseOpacity = 0.02,
}: CinematicEffectsProps) {
  if (dofEnabled) {
    return (
      <CinematicEffectsWithDOF
        bloomIntensity={bloomIntensity}
        vignetteOffset={vignetteOffset}
        vignetteDarkness={vignetteDarkness}
        dofFocusDistance={dofFocusDistance}
        dofFocalLength={dofFocalLength}
        dofBokehScale={dofBokehScale}
        noiseOpacity={noiseOpacity}
      />
    );
  }
  return (
    <CinematicEffectsNoDOF
      bloomIntensity={bloomIntensity}
      vignetteOffset={vignetteOffset}
      vignetteDarkness={vignetteDarkness}
      noiseOpacity={noiseOpacity}
    />
  );
}
