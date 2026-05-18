/**
 * Stylized Shader Pipeline — custom shader materials for Animaster's
 * cinematic aesthetic (silhouette, painterly, atmospheric blending).
 */
import * as THREE from 'three';

export const SilhouetteShader = {
  uniforms: {
    color: { value: new THREE.Color(0x0a0a12) },
    rimColor: { value: new THREE.Color(0x334466) },
    rimPower: { value: 2.0 },
    opacity: { value: 1.0 },
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vViewDir = normalize(-mvPosition.xyz);
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform vec3 rimColor;
    uniform float rimPower;
    uniform float opacity;
    varying vec3 vNormal;
    varying vec3 vViewDir;
    void main() {
      float rim = 1.0 - max(dot(vViewDir, vNormal), 0.0);
      rim = pow(rim, rimPower);
      vec3 finalColor = mix(color, rimColor, rim);
      gl_FragColor = vec4(finalColor, opacity);
    }
  `,
};

export const AtmosphericFogShader = {
  uniforms: {
    fogColor: { value: new THREE.Color(0x15182a) },
    fogNear: { value: 5.0 },
    fogFar: { value: 30.0 },
    density: { value: 0.5 },
  },
  vertexShader: `
    varying float vFogDepth;
    void main() {
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      vFogDepth = -mvPosition.z;
      gl_Position = projectionMatrix * mvPosition;
    }
  `,
  fragmentShader: `
    uniform vec3 fogColor;
    uniform float fogNear;
    uniform float fogFar;
    uniform float density;
    varying float vFogDepth;
    void main() {
      float fogFactor = smoothstep(fogNear, fogFar, vFogDepth) * density;
      gl_FragColor = vec4(fogColor, fogFactor);
    }
  `,
};

export const PainterlyGradientShader = {
  uniforms: {
    topColor: { value: new THREE.Color(0x1a2a4a) },
    bottomColor: { value: new THREE.Color(0x0a0a12) },
    offset: { value: 0.0 },
    exponent: { value: 0.8 },
  },
  vertexShader: `
    varying vec3 vWorldPosition;
    void main() {
      vec4 worldPos = modelMatrix * vec4(position, 1.0);
      vWorldPosition = worldPos.xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;
    void main() {
      float h = normalize(vWorldPosition + offset).y;
      float t = pow(max(h, 0.0), exponent);
      gl_FragColor = vec4(mix(bottomColor, topColor, t), 1.0);
    }
  `,
};

export function createSilhouetteMaterial(
  color: number = 0x0a0a12,
  rimColor: number = 0x334466,
  rimPower: number = 2.0
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      rimColor: { value: new THREE.Color(rimColor) },
      rimPower: { value: rimPower },
      opacity: { value: 1.0 },
    },
    vertexShader: SilhouetteShader.vertexShader,
    fragmentShader: SilhouetteShader.fragmentShader,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

export function createSkyGradientMaterial(
  topColor: number = 0x1a2a4a,
  bottomColor: number = 0x0a0a12
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      topColor: { value: new THREE.Color(topColor) },
      bottomColor: { value: new THREE.Color(bottomColor) },
      offset: { value: 0.0 },
      exponent: { value: 0.8 },
    },
    vertexShader: PainterlyGradientShader.vertexShader,
    fragmentShader: PainterlyGradientShader.fragmentShader,
    side: THREE.BackSide,
  });
}

type ShaderTone = 'neutral' | 'lonely' | 'tense' | 'romantic' | 'sad' | 'threatening' | 'awkward' | 'energetic';

const TONE_SKY_COLORS: Record<ShaderTone, { top: number; bottom: number }> = {
  neutral: { top: 0x1a2a4a, bottom: 0x0a0a12 },
  lonely: { top: 0x15253a, bottom: 0x08081a },
  tense: { top: 0x1a0a0a, bottom: 0x0a0808 },
  romantic: { top: 0x2a1a2a, bottom: 0x120a12 },
  sad: { top: 0x152535, bottom: 0x080a15 },
  threatening: { top: 0x200808, bottom: 0x0a0000 },
  awkward: { top: 0x2a2a1a, bottom: 0x0a0a08 },
  energetic: { top: 0x2a2a0a, bottom: 0x12120a },
};

export function getSkyColorsForTone(tone: string): { top: number; bottom: number } {
  return TONE_SKY_COLORS[tone as ShaderTone] ?? TONE_SKY_COLORS.neutral;
}
