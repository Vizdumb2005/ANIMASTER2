import { Container, Graphics } from 'pixi.js';
import type { SceneTone } from '@animaster/shared/scene';
import { getPropsForScene, getPropById } from './propRegistry';

// --- Task 220: Prop Renderer Integration ---

export function drawProps(
  layer: Container,
  envType: string,
  tone: SceneTone,
  elapsedMs: number
): void {
  const placements = getPropsForScene(envType, tone);

  for (const placement of placements) {
    const propDef = getPropById(placement.propId);
    if (!propDef) continue;

    const g = new Graphics();
    propDef.draw(g, placement.x, placement.y, elapsedMs);
    layer.addChild(g);
  }
}
