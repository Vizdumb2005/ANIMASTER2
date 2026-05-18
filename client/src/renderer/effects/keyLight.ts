import { Container, Graphics } from 'pixi.js';
import type { SceneTone } from '@animaster/shared/scene';

// --- Task 211: Dynamic Key Light ---

interface KeyLightConfig {
  x: number;      // normalized 0-1
  y: number;      // normalized 0-1
  radius: number; // normalized 0-1
  color: number;
  alpha: number;
}

const TONE_LIGHT_CONFIGS: Record<string, Partial<KeyLightConfig>> = {
  lonely: { color: 0x4a6a9a, alpha: 0.12 },
  sad: { color: 0x5a7aaa, alpha: 0.1 },
  tense: { color: 0x8a5a4a, alpha: 0.14 },
  threatening: { color: 0x9a3a2a, alpha: 0.16 },
  romantic: { color: 0xaa8a5a, alpha: 0.12 },
  energetic: { color: 0xaa9a6a, alpha: 0.1 },
  awkward: { color: 0x7a7a6a, alpha: 0.08 },
  neutral: { color: 0x8a9aaa, alpha: 0.08 },
};

const ENV_LIGHT_POSITIONS: Record<string, { x: number; y: number }> = {
  indoor_room: { x: 0.7, y: 0.2 },       // window light
  hallway: { x: 0.5, y: 0.05 },           // overhead
  rooftop: { x: 0.8, y: 0.15 },           // sky/moon
  outdoor_street: { x: 0.15, y: 0.2 },    // streetlight
  outdoor_park: { x: 0.7, y: 0.1 },       // sky
  outdoor_beach: { x: 0.6, y: 0.08 },     // sun/moon
  outdoor_forest: { x: 0.5, y: 0.05 },    // canopy gap
  subway: { x: 0.5, y: 0.03 },            // fluorescent
  hospital: { x: 0.5, y: 0.05 },          // overhead
  apartment: { x: 0.65, y: 0.2 },         // window
  staircase: { x: 0.3, y: 0.1 },          // above
};

export function drawKeyLight(
  layer: Container,
  width: number,
  height: number,
  envType: string,
  tone: SceneTone
): void {
  const toneConfig = TONE_LIGHT_CONFIGS[tone] ?? TONE_LIGHT_CONFIGS.neutral;
  const pos = ENV_LIGHT_POSITIONS[envType] ?? { x: 0.5, y: 0.2 };

  const g = new Graphics();
  const cx = pos.x * width;
  const cy = pos.y * height;
  const radius = Math.max(width, height) * 0.5;

  // Main light glow — radial gradient approximation with concentric circles
  const steps = 5;
  for (let i = steps; i > 0; i--) {
    const t = i / steps;
    const r = radius * t;
    const a = (toneConfig.alpha ?? 0.1) * (1 - t) * 1.5;
    g.circle(cx, cy, r).fill({ color: toneConfig.color ?? 0x8a9aaa, alpha: a });
  }

  layer.addChild(g);
}

// --- Task 212: Volumetric Light Shafts ---

export function drawLightShafts(
  layer: Container,
  width: number,
  height: number,
  envType: string,
  tone: SceneTone,
  elapsedMs: number
): void {
  const pos = ENV_LIGHT_POSITIONS[envType];
  if (!pos) return;

  // Only draw shafts for environments with strong directional light
  const shaftEnvs = ['indoor_room', 'apartment', 'hallway', 'hospital', 'outdoor_street', 'subway'];
  if (!shaftEnvs.includes(envType)) return;

  const toneConfig = TONE_LIGHT_CONFIGS[tone] ?? TONE_LIGHT_CONFIGS.neutral;
  const g = new Graphics();

  const sourceX = pos.x * width;
  const sourceY = pos.y * height;
  const shaftCount = 3;
  const shaftWidth = 30 + Math.sin(elapsedMs * 0.0003) * 5;

  for (let i = 0; i < shaftCount; i++) {
    const angle = -0.3 + i * 0.15 + Math.sin(elapsedMs * 0.0002 + i) * 0.03;
    const len = height * 0.8;
    const endX = sourceX + Math.sin(angle) * len;
    const endY = sourceY + Math.cos(angle) * len;

    const halfW = shaftWidth * 0.5;
    // Shaft as a tapered quad
    g.moveTo(sourceX - halfW * 0.3, sourceY);
    g.lineTo(sourceX + halfW * 0.3, sourceY);
    g.lineTo(endX + halfW, endY);
    g.lineTo(endX - halfW, endY);
    g.closePath().fill({
      color: toneConfig.color ?? 0x8a9aaa,
      alpha: (toneConfig.alpha ?? 0.08) * 0.35,
    });
  }

  layer.addChild(g);
}
