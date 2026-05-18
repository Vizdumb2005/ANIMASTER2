import { Container, Graphics } from 'pixi.js';

// --- Task 221: Bloom Effect ---

export function drawBloom(
  layer: Container,
  width: number,
  height: number,
  envType: string,
  elapsedMs: number
): void {
  const g = new Graphics();

  // Bloom around light sources based on environment
  const lightSources = getLightSources(envType, width, height);

  for (const light of lightSources) {
    const pulse = 0.8 + Math.sin(elapsedMs * 0.001 + light.x * 0.01) * 0.2;
    const bloomRadius = light.radius * 2.5;
    const steps = 4;

    for (let i = steps; i > 0; i--) {
      const t = i / steps;
      const r = bloomRadius * t;
      const a = light.alpha * 0.15 * (1 - t) * pulse;
      g.circle(light.x, light.y, r).fill({ color: light.color, alpha: a });
    }
  }

  layer.addChild(g);
}

interface LightSource {
  x: number;
  y: number;
  radius: number;
  color: number;
  alpha: number;
}

function getLightSources(envType: string, width: number, height: number): LightSource[] {
  switch (envType) {
    case 'indoor_room':
    case 'apartment':
      return [
        { x: width * 0.65, y: height * 0.2, radius: 30, color: 0xaabb99, alpha: 0.5 },
      ];
    case 'hallway':
    case 'hospital':
      return [
        { x: width * 0.35, y: height * 0.05, radius: 25, color: 0x8a9aaa, alpha: 0.4 },
        { x: width * 0.65, y: height * 0.05, radius: 25, color: 0x8a9aaa, alpha: 0.4 },
      ];
    case 'outdoor_street':
      return [
        { x: width * 0.15, y: height * 0.18, radius: 20, color: 0xddaa55, alpha: 0.5 },
      ];
    case 'subway':
      return [
        { x: width * 0.3, y: height * 0.08, radius: 20, color: 0x6a7a8a, alpha: 0.35 },
        { x: width * 0.6, y: height * 0.08, radius: 20, color: 0x6a7a8a, alpha: 0.35 },
      ];
    case 'rooftop':
      return [
        { x: width * 0.8, y: height * 0.1, radius: 40, color: 0x8a9abc, alpha: 0.3 },
      ];
    default:
      return [];
  }
}
