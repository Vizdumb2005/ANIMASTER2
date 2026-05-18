import { Container, Graphics } from 'pixi.js';
import type { Camera } from '@animaster/shared/scene';

// --- Task 207: Parallax Layer System ---

export interface ParallaxConfig {
  sky: number;     // 0 — fixed
  far_bg: number;  // 0.3x camera
  mid_bg: number;  // 0.6x camera
  floor: number;   // 1.0x camera
  foreground: number; // 1.2x — in front of actors
}

const DEFAULT_PARALLAX: ParallaxConfig = {
  sky: 0,
  far_bg: 0.3,
  mid_bg: 0.6,
  floor: 1.0,
  foreground: 1.2,
};

export function getParallaxOffset(layerType: string, camera: Camera): { x: number; y: number } {
  const depth = DEFAULT_PARALLAX[layerType as keyof ParallaxConfig] ?? 1.0;
  const camOffsetX = (camera.x ?? 0);
  const camOffsetY = (camera.y ?? 0);
  return {
    x: -camOffsetX * depth * 0.05,
    y: -camOffsetY * depth * 0.02,
  };
}

// --- Task 210: Atmospheric Perspective ---

export function applyAtmosphericPerspective(
  g: Graphics,
  layerType: string,
  width: number,
  height: number
): void {
  // Far background gets slightly blue-tinted and desaturated
  if (layerType === 'far_bg') {
    g.rect(0, 0, width, height).fill({ color: 0x1a2a3a, alpha: 0.12 });
  }
  // Mid background gets slight haze
  if (layerType === 'mid_bg') {
    g.rect(0, 0, width, height).fill({ color: 0x1a2030, alpha: 0.05 });
  }
}

// --- Task 208: Foreground Silhouettes ---

export interface ForegroundSilhouette {
  envType: string;
  draw: (g: Graphics, width: number, height: number) => void;
}

const foregroundSilhouettes: Record<string, (g: Graphics, w: number, h: number) => void> = {
  // Indoor rooms: doorframe / wall edge silhouettes
  indoor_room: (g, w, h) => {
    // Left wall edge
    g.rect(0, 0, 35, h).fill({ color: 0x0a0810, alpha: 0.6 });
    g.rect(35, 0, 8, h).fill({ color: 0x0a0810, alpha: 0.15 });
    // Right wall edge
    g.rect(w - 30, 0, 30, h).fill({ color: 0x0a0810, alpha: 0.5 });
    g.rect(w - 38, 0, 8, h).fill({ color: 0x0a0810, alpha: 0.12 });
  },

  // Hallway: strong framing pillars
  hallway: (g, w, h) => {
    // Left pillar silhouette
    g.rect(0, 0, 50, h).fill({ color: 0x08060e, alpha: 0.7 });
    g.rect(50, 0, 12, h).fill({ color: 0x08060e, alpha: 0.2 });
    // Right pillar
    g.rect(w - 45, 0, 45, h).fill({ color: 0x08060e, alpha: 0.65 });
    g.rect(w - 55, 0, 10, h).fill({ color: 0x08060e, alpha: 0.18 });
  },

  // Rooftop: railing silhouette at bottom
  rooftop: (g, w, h) => {
    const railY = h * 0.85;
    // Railing posts
    for (let x = 30; x < w - 30; x += 60) {
      g.rect(x, railY, 4, h - railY).fill({ color: 0x0a0a12, alpha: 0.5 });
    }
    // Horizontal rail
    g.rect(20, railY, w - 40, 3).fill({ color: 0x0a0a12, alpha: 0.45 });
    g.rect(20, railY + 15, w - 40, 2).fill({ color: 0x0a0a12, alpha: 0.3 });
  },

  // Street: lamppost + distant building silhouette edges
  outdoor_street: (g, w, h) => {
    // Lamppost silhouette (left side)
    g.rect(60, h * 0.15, 4, h * 0.85).fill({ color: 0x0a0a10, alpha: 0.4 });
    // Lamp arm
    g.rect(60, h * 0.15, 25, 3).fill({ color: 0x0a0a10, alpha: 0.35 });
    // Lamp head
    g.circle(85, h * 0.15, 6).fill({ color: 0x0a0a10, alpha: 0.3 });
    // Right edge building corner
    g.rect(w - 25, 0, 25, h).fill({ color: 0x08080e, alpha: 0.35 });
  },

  // Park: tree branch silhouettes framing top
  outdoor_park: (g, w, h) => {
    // Top-left branch
    drawBranch(g, 0, 0, w * 0.25, h * 0.2, 0.45);
    // Top-right branch
    drawBranch(g, w, 0, w * 0.7, h * 0.15, 0.35);
  },

  // Forest: dense tree silhouettes framing sides
  outdoor_forest: (g, w, h) => {
    // Left tree trunk
    g.rect(0, h * 0.1, 20, h * 0.9).fill({ color: 0x060806, alpha: 0.6 });
    // Left canopy
    drawBranch(g, 0, 0, w * 0.3, h * 0.25, 0.5);
    // Right tree trunk
    g.rect(w - 18, h * 0.15, 18, h * 0.85).fill({ color: 0x060806, alpha: 0.55 });
    // Right canopy
    drawBranch(g, w, 0, w * 0.75, h * 0.2, 0.4);
  },

  // Subway: ceiling overhang
  subway: (g, w, h) => {
    // Ceiling frame
    g.rect(0, 0, w, h * 0.08).fill({ color: 0x06050a, alpha: 0.6 });
    // Left column
    g.rect(0, 0, 40, h).fill({ color: 0x06050a, alpha: 0.55 });
    // Right column
    g.rect(w - 35, 0, 35, h).fill({ color: 0x06050a, alpha: 0.5 });
  },

  // Hospital: corridor framing
  hospital: (g, w, h) => {
    g.rect(0, 0, 30, h).fill({ color: 0x0a0c10, alpha: 0.45 });
    g.rect(w - 28, 0, 28, h).fill({ color: 0x0a0c10, alpha: 0.4 });
    // Top lintel
    g.rect(0, 0, w, h * 0.06).fill({ color: 0x0a0c10, alpha: 0.3 });
  },

  // Apartment: window frame silhouette
  apartment: (g, w, h) => {
    g.rect(0, 0, 25, h).fill({ color: 0x0a080e, alpha: 0.4 });
    g.rect(w - 22, 0, 22, h).fill({ color: 0x0a080e, alpha: 0.35 });
  },

  // Staircase: railing/bannister silhouette
  staircase: (g, w, h) => {
    // Diagonal railing
    g.moveTo(0, h);
    g.lineTo(w * 0.4, h * 0.2);
    g.lineTo(w * 0.4 + 6, h * 0.2);
    g.lineTo(6, h);
    g.closePath().fill({ color: 0x0a080e, alpha: 0.35 });
  },

  // Beach: nothing (open sky)
  outdoor_beach: (_g, _w, _h) => {},
};

function drawBranch(g: Graphics, startX: number, startY: number, endX: number, endY: number, alpha: number): void {
  // Organic branch shape using polygon
  const midX = (startX + endX) * 0.5;
  const midY = (startY + endY) * 0.5;
  const thickness = 25;
  g.moveTo(startX, startY);
  g.quadraticCurveTo(midX, midY - thickness, endX, endY);
  g.lineTo(endX, endY + thickness * 0.6);
  g.quadraticCurveTo(midX, midY + thickness * 0.3, startX, startY + thickness * 1.5);
  g.closePath().fill({ color: 0x060808, alpha });
  // Leaf clusters
  const leafCount = 5;
  for (let i = 0; i < leafCount; i++) {
    const t = (i + 0.5) / leafCount;
    const lx = startX + (endX - startX) * t;
    const ly = startY + (endY - startY) * t;
    g.circle(lx, ly + 8, 12 + i * 3).fill({ color: 0x060a06, alpha: alpha * 0.7 });
  }
}

export function drawForegroundSilhouettes(layer: Container, envType: string, width: number, height: number): void {
  const drawFn = foregroundSilhouettes[envType];
  if (!drawFn) return;
  const g = new Graphics();
  drawFn(g, width, height);
  layer.addChild(g);
}
