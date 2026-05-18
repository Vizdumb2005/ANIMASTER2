import { Container, Graphics } from 'pixi.js';
import type { SceneTone } from '@animaster/shared/scene';

// --- Task 225: Composition Framing Overlay ---

export function drawCompositionFraming(
  layer: Container,
  width: number,
  height: number,
  tone: SceneTone,
  actorCenterX?: number,
  actorCenterY?: number
): void {
  const g = new Graphics();

  switch (tone) {
    case 'lonely':
    case 'sad': {
      // Extra darkness at edges — emphasize isolation
      g.rect(0, 0, width * 0.08, height).fill({ color: 0x000000, alpha: 0.12 });
      g.rect(width * 0.92, 0, width * 0.08, height).fill({ color: 0x000000, alpha: 0.12 });
      break;
    }
    case 'threatening': {
      // Lower ceiling — oppressive overhead darkness
      g.rect(0, 0, width, height * 0.12).fill({ color: 0x000000, alpha: 0.15 });
      // Narrow side compression
      g.rect(0, 0, width * 0.06, height).fill({ color: 0x0a0008, alpha: 0.1 });
      g.rect(width * 0.94, 0, width * 0.06, height).fill({ color: 0x0a0008, alpha: 0.1 });
      break;
    }
    case 'tense': {
      // Top-bottom compression
      g.rect(0, 0, width, height * 0.08).fill({ color: 0x000000, alpha: 0.1 });
      g.rect(0, height * 0.92, width, height * 0.08).fill({ color: 0x000000, alpha: 0.1 });
      break;
    }
    case 'romantic': {
      // Soft circular focus around actors
      if (actorCenterX !== undefined && actorCenterY !== undefined) {
        const focusR = Math.min(width, height) * 0.35;
        // Darken everything outside a soft ring
        const steps = 3;
        for (let i = 0; i < steps; i++) {
          const t = (i + 1) / steps;
          const r = focusR + (Math.max(width, height) * 0.5 - focusR) * t;
          // Draw ring segments
          g.rect(0, 0, width, height).fill({ color: 0x0a0508, alpha: 0.015 * t });
        }
      }
      break;
    }
  }

  layer.addChild(g);
}
