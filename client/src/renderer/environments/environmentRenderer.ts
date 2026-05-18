import { Container, Graphics } from 'pixi.js';
import type { Environment } from '@animaster/shared/scene';
import { getEnvironmentDefinition, type EnvironmentShape } from './environmentRegistry';

function inferTimeOfDay(env: Environment): string {
  const bg = env.backgroundColor.toLowerCase();
  if (bg.includes('0a') || bg.includes('0d') || bg.includes('0f')) return 'night';
  return 'day';
}

function drawShape(g: Graphics, shape: EnvironmentShape): void {
  switch (shape.kind) {
    case 'rect':
      g.rect(shape.x, shape.y, shape.width ?? 0, shape.height ?? 0)
        .fill({ color: shape.color, alpha: shape.alpha });
      break;
    case 'gradient_rect': {
      g.rect(shape.x, shape.y, shape.width ?? 0, shape.height ?? 0)
        .fill({ color: shape.color, alpha: shape.alpha });
      if (shape.gradientTo !== undefined) {
        const h = shape.height ?? 0;
        const halfH = Math.round(h * 0.5);
        g.rect(shape.x, shape.y + halfH, shape.width ?? 0, h - halfH)
          .fill({ color: shape.gradientTo, alpha: shape.alpha * 0.7 });
      }
      break;
    }
    case 'circle':
      g.circle(shape.x, shape.y, shape.radius ?? 10)
        .fill({ color: shape.color, alpha: shape.alpha });
      break;
    case 'polygon':
      if (shape.points && shape.points.length >= 6) {
        const pts = shape.points;
        g.moveTo(pts[0], pts[1]);
        for (let i = 2; i < pts.length; i += 2) {
          g.lineTo(pts[i], pts[i + 1]);
        }
        g.closePath().fill({ color: shape.color, alpha: shape.alpha });
      }
      break;
    case 'line':
      if (shape.points && shape.points.length >= 4) {
        g.moveTo(shape.points[0], shape.points[1]);
        g.lineTo(shape.points[2], shape.points[3]);
        g.stroke({ color: shape.color, width: 2, alpha: shape.alpha });
      }
      break;
  }
}

export function drawEnvironment(layer: Container, env: Environment, width: number, height: number): void {
  const def = getEnvironmentDefinition(env.type);
  if (!def) {
    drawFallbackRoom(layer, env, width, height);
    return;
  }

  const timeOfDay = inferTimeOfDay(env);
  const layers = def.buildLayers(env, width, height, timeOfDay);

  for (const envLayer of layers) {
    const g = new Graphics();
    for (const shape of envLayer.shapes) {
      drawShape(g, shape);
    }
    layer.addChild(g);
  }
}

function drawFallbackRoom(layer: Container, env: Environment, width: number, height: number): void {
  const g = new Graphics();
  const bgColor = parseInt(env.backgroundColor.replace('#', ''), 16) || 0x1b1f24;
  const wallColor = parseInt(env.wallColor.replace('#', ''), 16) || 0x2a2228;
  const floorColor = parseInt(env.floorColor.replace('#', ''), 16) || 0x3a2b1f;

  g.rect(0, 0, width, height).fill(bgColor);
  const wallH = Math.round(height * 0.62);
  g.rect(0, 0, width, wallH).fill(wallColor);
  g.rect(0, wallH, width, height - wallH).fill(floorColor);
  g.rect(0, wallH - 4, width, 8).fill({ color: 0x000000, alpha: 0.18 });

  layer.addChild(g);
}
