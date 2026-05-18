import type { Environment } from '@animaster/shared/scene';

export interface EnvironmentLayer {
  type: 'sky' | 'far_bg' | 'mid_bg' | 'floor' | 'foreground';
  shapes: EnvironmentShape[];
}

export interface EnvironmentShape {
  kind: 'rect' | 'polygon' | 'circle' | 'line' | 'gradient_rect';
  color: number;
  alpha: number;
  x: number;
  y: number;
  width?: number;
  height?: number;
  radius?: number;
  points?: number[];
  gradientTo?: number;
}

export interface EnvironmentDefinition {
  id: string;
  label: string;
  buildLayers: (env: Environment, width: number, height: number, timeOfDay: string) => EnvironmentLayer[];
}

const registry = new Map<string, EnvironmentDefinition>();

export function registerEnvironment(def: EnvironmentDefinition): void {
  registry.set(def.id, def);
}

export function getEnvironmentDefinition(envType: string): EnvironmentDefinition | undefined {
  return registry.get(envType);
}

export function listEnvironmentTypes(): string[] {
  return Array.from(registry.keys());
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16);
}

// --- Indoor Room ---
registerEnvironment({
  id: 'indoor_room',
  label: 'Room',
  buildLayers: (env, width, height, timeOfDay) => {
    const wallH = Math.round(height * 0.62);
    const isDark = timeOfDay === 'night';
    const wallColor = hexToNum(env.wallColor);
    const floorColor = hexToNum(env.floorColor);
    const bgColor = hexToNum(env.backgroundColor);
    return [
      {
        type: 'sky',
        shapes: [{ kind: 'rect', color: bgColor, alpha: 1, x: 0, y: 0, width, height }]
      },
      {
        type: 'mid_bg',
        shapes: [
          { kind: 'rect', color: wallColor, alpha: 1, x: 0, y: 0, width, height: wallH },
          // baseboard
          { kind: 'rect', color: 0x1a1520, alpha: 0.6, x: 0, y: wallH - 12, width, height: 12 },
          // window silhouette
          { kind: 'rect', color: isDark ? 0x1a2540 : 0x3a4a6a, alpha: 0.4, x: width * 0.7, y: wallH * 0.15, width: 100, height: 130 },
          { kind: 'rect', color: isDark ? 0x0a1428 : 0x2a3a5a, alpha: 0.3, x: width * 0.7 + 4, y: wallH * 0.15 + 4, width: 92, height: 122 },
          // window cross
          { kind: 'rect', color: wallColor, alpha: 0.8, x: width * 0.7 + 46, y: wallH * 0.15, width: 4, height: 130 },
          { kind: 'rect', color: wallColor, alpha: 0.8, x: width * 0.7, y: wallH * 0.15 + 62, width: 100, height: 4 },
        ]
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: floorColor, alpha: 1, x: 0, y: wallH, width, height: height - wallH },
          { kind: 'rect', color: 0x000000, alpha: 0.18, x: 0, y: wallH - 4, width, height: 8 },
        ]
      }
    ];
  }
});

// --- Rooftop ---
registerEnvironment({
  id: 'rooftop',
  label: 'Rooftop',
  buildLayers: (_env, width, height, timeOfDay) => {
    const isDark = timeOfDay === 'night';
    const skyTop = isDark ? 0x0a0e1a : 0x1a2a4a;
    const skyBot = isDark ? 0x0f1420 : 0x3a4a6a;
    const horizonY = Math.round(height * 0.55);
    const ledgeH = 24;
    const skylineShapes: EnvironmentShape[] = [];
    const bx = [60, 150, 250, 370, 460, 560, 650, 740, 830];
    const bh = [90, 140, 70, 160, 100, 130, 80, 120, 60];
    const bw = [50, 40, 55, 35, 60, 45, 50, 38, 55];
    for (let i = 0; i < bx.length; i++) {
      skylineShapes.push({
        kind: 'rect', color: isDark ? 0x0d1118 : 0x1a2030, alpha: 0.7,
        x: bx[i], y: horizonY - bh[i], width: bw[i], height: bh[i]
      });
      if (isDark) {
        // window lights
        for (let wy = horizonY - bh[i] + 10; wy < horizonY - 10; wy += 20) {
          if (Math.random() > 0.5) {
            skylineShapes.push({ kind: 'rect', color: 0xffe8a0, alpha: 0.3, x: bx[i] + 8, y: wy, width: 6, height: 8 });
          }
        }
      }
    }
    return [
      {
        type: 'sky',
        shapes: [
          { kind: 'gradient_rect', color: skyTop, gradientTo: skyBot, alpha: 1, x: 0, y: 0, width, height: horizonY },
        ]
      },
      {
        type: 'far_bg',
        shapes: skylineShapes
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: 0x2a2530, alpha: 1, x: 0, y: horizonY, width, height: height - horizonY },
          // concrete texture
          { kind: 'rect', color: 0x000000, alpha: 0.1, x: 0, y: horizonY, width, height: 3 },
          // ledge
          { kind: 'rect', color: 0x3a3540, alpha: 1, x: 0, y: horizonY - ledgeH, width: width * 0.3, height: ledgeH },
          { kind: 'rect', color: 0x2a2530, alpha: 1, x: 0, y: horizonY - ledgeH - 4, width: width * 0.3, height: 4 },
        ]
      }
    ];
  }
});

// --- Hallway ---
registerEnvironment({
  id: 'hallway',
  label: 'Hallway',
  buildLayers: (_env, width, height, _timeOfDay) => {
    const wallH = Math.round(height * 0.65);
    const vanishX = width * 0.5;
    const vanishY = wallH * 0.35;
    return [
      {
        type: 'sky',
        shapes: [{ kind: 'rect', color: 0x0f1218, alpha: 1, x: 0, y: 0, width, height }]
      },
      {
        type: 'mid_bg',
        shapes: [
          // left wall
          { kind: 'polygon', color: 0x1a1822, alpha: 1, x: 0, y: 0, points: [0, 0, vanishX - 80, vanishY, vanishX - 80, wallH, 0, height] },
          // right wall
          { kind: 'polygon', color: 0x1e1c26, alpha: 1, x: 0, y: 0, points: [width, 0, vanishX + 80, vanishY, vanishX + 80, wallH, width, height] },
          // back wall
          { kind: 'rect', color: 0x12101a, alpha: 1, x: vanishX - 80, y: vanishY, width: 160, height: wallH - vanishY },
          // doorway at end
          { kind: 'rect', color: 0x0a0810, alpha: 0.9, x: vanishX - 30, y: vanishY + 20, width: 60, height: wallH - vanishY - 20 },
          // ceiling light strip
          { kind: 'rect', color: 0x4a5a6a, alpha: 0.3, x: vanishX - 2, y: vanishY - 8, width: 4, height: 20 },
          { kind: 'rect', color: 0x8a9aaa, alpha: 0.15, x: vanishX - 40, y: 0, width: 80, height: vanishY },
        ]
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: 0x1a1620, alpha: 1, x: 0, y: wallH, width, height: height - wallH },
          { kind: 'rect', color: 0x000000, alpha: 0.15, x: 0, y: wallH - 2, width, height: 4 },
          // floor tiles
          { kind: 'rect', color: 0x1e1a24, alpha: 0.5, x: width * 0.25, y: wallH + 20, width: width * 0.5, height: 2 },
          { kind: 'rect', color: 0x1e1a24, alpha: 0.4, x: width * 0.3, y: wallH + 50, width: width * 0.4, height: 2 },
        ]
      }
    ];
  }
});

// --- Street / Alley ---
registerEnvironment({
  id: 'outdoor_street',
  label: 'Street',
  buildLayers: (_env, width, height, timeOfDay) => {
    const isDark = timeOfDay === 'night';
    const horizonY = Math.round(height * 0.5);
    const buildingShapes: EnvironmentShape[] = [];
    // left buildings
    buildingShapes.push({ kind: 'rect', color: 0x12101a, alpha: 0.8, x: 0, y: horizonY - 180, width: 120, height: 180 });
    buildingShapes.push({ kind: 'rect', color: 0x14121c, alpha: 0.7, x: 120, y: horizonY - 130, width: 80, height: 130 });
    // right buildings
    buildingShapes.push({ kind: 'rect', color: 0x12101a, alpha: 0.8, x: width - 100, y: horizonY - 160, width: 100, height: 160 });
    buildingShapes.push({ kind: 'rect', color: 0x16141e, alpha: 0.7, x: width - 180, y: horizonY - 110, width: 80, height: 110 });
    // streetlight
    buildingShapes.push({ kind: 'rect', color: 0x3a3540, alpha: 0.9, x: width * 0.75, y: horizonY - 140, width: 4, height: 140 });
    buildingShapes.push({ kind: 'rect', color: 0x3a3540, alpha: 0.9, x: width * 0.75 - 12, y: horizonY - 140, width: 28, height: 4 });
    if (isDark) {
      buildingShapes.push({ kind: 'circle', color: 0xffe8a0, alpha: 0.25, x: width * 0.75, y: horizonY - 136, radius: 50 });
    }
    return [
      {
        type: 'sky',
        shapes: [
          { kind: 'gradient_rect', color: isDark ? 0x0a0e1a : 0x2a3a5a, gradientTo: isDark ? 0x141a28 : 0x4a5a7a, alpha: 1, x: 0, y: 0, width, height: horizonY },
        ]
      },
      {
        type: 'far_bg',
        shapes: buildingShapes
      },
      {
        type: 'floor',
        shapes: [
          // sidewalk
          { kind: 'rect', color: 0x2a2530, alpha: 1, x: 0, y: horizonY, width, height: height - horizonY },
          // road
          { kind: 'rect', color: 0x1a1822, alpha: 1, x: width * 0.15, y: horizonY, width: width * 0.7, height: height - horizonY },
          // curb
          { kind: 'rect', color: 0x3a3540, alpha: 0.6, x: width * 0.15, y: horizonY, width: width * 0.7, height: 3 },
          // road line
          { kind: 'rect', color: 0x4a4540, alpha: 0.2, x: width * 0.48, y: horizonY + 20, width: width * 0.04, height: 30 },
          { kind: 'rect', color: 0x4a4540, alpha: 0.2, x: width * 0.48, y: horizonY + 70, width: width * 0.04, height: 30 },
        ]
      }
    ];
  }
});

// --- Park ---
registerEnvironment({
  id: 'outdoor_park',
  label: 'Park',
  buildLayers: (env, width, height, timeOfDay) => {
    const isDark = timeOfDay === 'night';
    const horizonY = Math.round(height * 0.52);
    const treeShapes: EnvironmentShape[] = [];
    const treePositions = [80, 200, 700, 850];
    for (const tx of treePositions) {
      // trunk
      treeShapes.push({ kind: 'rect', color: 0x2a1a10, alpha: 0.7, x: tx - 4, y: horizonY - 80, width: 8, height: 80 });
      // canopy
      treeShapes.push({ kind: 'circle', color: isDark ? 0x1a2a1a : 0x2a4a2a, alpha: 0.6, x: tx, y: horizonY - 100, radius: 35 });
    }
    return [
      {
        type: 'sky',
        shapes: [
          { kind: 'gradient_rect', color: isDark ? 0x0a1a0a : 0x3a5a4a, gradientTo: isDark ? 0x0f1f0f : 0x5a7a6a, alpha: 1, x: 0, y: 0, width, height: horizonY },
        ]
      },
      {
        type: 'far_bg',
        shapes: treeShapes
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: hexToNum(env.floorColor), alpha: 1, x: 0, y: horizonY, width, height: height - horizonY },
          // path
          { kind: 'rect', color: 0x3a3228, alpha: 0.5, x: width * 0.3, y: horizonY, width: width * 0.4, height: height - horizonY },
        ]
      }
    ];
  }
});

// --- Beach ---
registerEnvironment({
  id: 'outdoor_beach',
  label: 'Beach',
  buildLayers: (env, width, height, timeOfDay) => {
    const isDark = timeOfDay === 'night';
    const horizonY = Math.round(height * 0.45);
    const waterY = Math.round(height * 0.58);
    return [
      {
        type: 'sky',
        shapes: [
          { kind: 'gradient_rect', color: isDark ? 0x0a1428 : 0x4a6a9a, gradientTo: isDark ? 0x1a2a3a : 0x8aaaca, alpha: 1, x: 0, y: 0, width, height: horizonY },
        ]
      },
      {
        type: 'mid_bg',
        shapes: [
          // ocean
          { kind: 'rect', color: isDark ? 0x0a1a2a : 0x2a4a6a, alpha: 1, x: 0, y: horizonY, width, height: waterY - horizonY },
          // wave line
          { kind: 'rect', color: isDark ? 0x1a2a3a : 0x5a7a9a, alpha: 0.4, x: 0, y: waterY - 4, width, height: 4 },
        ]
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: hexToNum(env.floorColor), alpha: 1, x: 0, y: waterY, width, height: height - waterY },
        ]
      }
    ];
  }
});

// --- Forest ---
registerEnvironment({
  id: 'outdoor_forest',
  label: 'Forest',
  buildLayers: (_env, width, height, timeOfDay) => {
    const isDark = timeOfDay === 'night';
    const horizonY = Math.round(height * 0.5);
    const treeShapes: EnvironmentShape[] = [];
    const positions = [30, 90, 160, 250, 340, 500, 600, 680, 760, 840, 900];
    for (const tx of positions) {
      const h = 100 + (tx * 7) % 80;
      treeShapes.push({ kind: 'rect', color: 0x1a0f08, alpha: 0.7, x: tx - 5, y: horizonY - h, width: 10, height: h });
      treeShapes.push({ kind: 'circle', color: isDark ? 0x0f1f0f : 0x1a3a1a, alpha: 0.5, x: tx, y: horizonY - h - 20, radius: 28 });
    }
    return [
      {
        type: 'sky',
        shapes: [
          { kind: 'rect', color: isDark ? 0x060a06 : 0x1a2a1a, alpha: 1, x: 0, y: 0, width, height: horizonY },
        ]
      },
      {
        type: 'far_bg',
        shapes: treeShapes
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: isDark ? 0x0a150a : 0x1a3a1a, alpha: 1, x: 0, y: horizonY, width, height: height - horizonY },
          // ground texture
          { kind: 'rect', color: 0x0f1f0f, alpha: 0.3, x: 0, y: horizonY, width, height: 3 },
        ]
      }
    ];
  }
});

// --- Subway Platform ---
registerEnvironment({
  id: 'subway',
  label: 'Subway Platform',
  buildLayers: (_env, width, height, _timeOfDay) => {
    const ceilingH = Math.round(height * 0.2);
    const platformY = Math.round(height * 0.65);
    const trackY = Math.round(height * 0.78);
    return [
      {
        type: 'sky',
        shapes: [
          { kind: 'rect', color: 0x0a0c12, alpha: 1, x: 0, y: 0, width, height }
        ]
      },
      {
        type: 'mid_bg',
        shapes: [
          // ceiling
          { kind: 'rect', color: 0x16141e, alpha: 1, x: 0, y: 0, width, height: ceilingH },
          // fluorescent lights
          { kind: 'rect', color: 0x6a7a8a, alpha: 0.3, x: width * 0.2, y: ceilingH - 6, width: width * 0.15, height: 6 },
          { kind: 'rect', color: 0x6a7a8a, alpha: 0.3, x: width * 0.55, y: ceilingH - 6, width: width * 0.15, height: 6 },
          // back wall
          { kind: 'rect', color: 0x12101a, alpha: 1, x: 0, y: ceilingH, width, height: platformY - ceilingH },
          // tile pattern
          { kind: 'rect', color: 0x1a182a, alpha: 0.4, x: 0, y: ceilingH + 30, width, height: 2 },
          { kind: 'rect', color: 0x1a182a, alpha: 0.4, x: 0, y: ceilingH + 70, width, height: 2 },
          // tunnel darkness (left and right)
          { kind: 'rect', color: 0x050508, alpha: 0.9, x: 0, y: platformY, width: 80, height: height - platformY },
          { kind: 'rect', color: 0x050508, alpha: 0.9, x: width - 80, y: platformY, width: 80, height: height - platformY },
        ]
      },
      {
        type: 'floor',
        shapes: [
          // platform
          { kind: 'rect', color: 0x2a2530, alpha: 1, x: 80, y: platformY, width: width - 160, height: trackY - platformY },
          // platform edge
          { kind: 'rect', color: 0xffcc00, alpha: 0.3, x: 80, y: trackY - 4, width: width - 160, height: 4 },
          // tracks
          { kind: 'rect', color: 0x0a0a10, alpha: 1, x: 80, y: trackY, width: width - 160, height: height - trackY },
          // rail lines
          { kind: 'rect', color: 0x4a4a5a, alpha: 0.4, x: 120, y: trackY + 15, width: width - 240, height: 2 },
          { kind: 'rect', color: 0x4a4a5a, alpha: 0.4, x: 120, y: trackY + 35, width: width - 240, height: 2 },
        ]
      }
    ];
  }
});

// --- Hospital Corridor ---
registerEnvironment({
  id: 'hospital',
  label: 'Hospital Corridor',
  buildLayers: (_env, width, height, _timeOfDay) => {
    const wallH = Math.round(height * 0.6);
    return [
      {
        type: 'sky',
        shapes: [{ kind: 'rect', color: 0x1a1e24, alpha: 1, x: 0, y: 0, width, height }]
      },
      {
        type: 'mid_bg',
        shapes: [
          { kind: 'rect', color: 0x202830, alpha: 1, x: 0, y: 0, width, height: wallH },
          // wainscoting
          { kind: 'rect', color: 0x1a2028, alpha: 1, x: 0, y: wallH * 0.55, width, height: wallH * 0.45 },
          { kind: 'rect', color: 0x2a3038, alpha: 0.5, x: 0, y: wallH * 0.55 - 2, width, height: 4 },
          // overhead light glow
          { kind: 'rect', color: 0x4a5a6a, alpha: 0.15, x: width * 0.4, y: 0, width: width * 0.2, height: wallH * 0.3 },
          // door
          { kind: 'rect', color: 0x14181e, alpha: 0.8, x: width * 0.6, y: wallH * 0.2, width: 60, height: wallH * 0.8 },
          { kind: 'circle', color: 0x3a3a3a, alpha: 0.5, x: width * 0.6 + 50, y: wallH * 0.55, radius: 4 },
        ]
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: 0x1e2228, alpha: 1, x: 0, y: wallH, width, height: height - wallH },
          { kind: 'rect', color: 0x2a2e34, alpha: 0.3, x: 0, y: wallH, width, height: 3 },
        ]
      }
    ];
  }
});

// --- Apartment Interior ---
registerEnvironment({
  id: 'apartment',
  label: 'Apartment',
  buildLayers: (env, width, height, timeOfDay) => {
    const isDark = timeOfDay === 'night';
    const wallH = Math.round(height * 0.6);
    const wallColor = hexToNum(env.wallColor);
    return [
      {
        type: 'sky',
        shapes: [{ kind: 'rect', color: hexToNum(env.backgroundColor), alpha: 1, x: 0, y: 0, width, height }]
      },
      {
        type: 'mid_bg',
        shapes: [
          { kind: 'rect', color: wallColor, alpha: 1, x: 0, y: 0, width, height: wallH },
          // large window
          { kind: 'rect', color: isDark ? 0x0a1428 : 0x3a5a7a, alpha: 0.5, x: width * 0.55, y: wallH * 0.1, width: 180, height: wallH * 0.7 },
          { kind: 'rect', color: wallColor, alpha: 0.9, x: width * 0.55 + 88, y: wallH * 0.1, width: 4, height: wallH * 0.7 },
          // bookshelf silhouette
          { kind: 'rect', color: 0x1a1520, alpha: 0.6, x: 40, y: wallH * 0.25, width: 80, height: wallH * 0.75 },
          { kind: 'rect', color: 0x1a1520, alpha: 0.5, x: 44, y: wallH * 0.35, width: 72, height: 3 },
          { kind: 'rect', color: 0x1a1520, alpha: 0.5, x: 44, y: wallH * 0.55, width: 72, height: 3 },
          { kind: 'rect', color: 0x1a1520, alpha: 0.5, x: 44, y: wallH * 0.75, width: 72, height: 3 },
        ]
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: hexToNum(env.floorColor), alpha: 1, x: 0, y: wallH, width, height: height - wallH },
          { kind: 'rect', color: 0x000000, alpha: 0.15, x: 0, y: wallH - 3, width, height: 6 },
        ]
      }
    ];
  }
});

// --- Staircase ---
registerEnvironment({
  id: 'staircase',
  label: 'Staircase',
  buildLayers: (_env, width, height, _timeOfDay) => {
    const stairShapes: EnvironmentShape[] = [];
    const stepCount = 8;
    const stepW = width * 0.4;
    const stepH = 22;
    const startX = width * 0.55;
    const startY = height * 0.35;
    for (let i = 0; i < stepCount; i++) {
      stairShapes.push({
        kind: 'rect', color: 0x2a2530, alpha: 0.9,
        x: startX - i * 15, y: startY + i * stepH, width: stepW, height: stepH
      });
      stairShapes.push({
        kind: 'rect', color: 0x201c28, alpha: 0.5,
        x: startX - i * 15, y: startY + i * stepH, width: stepW, height: 3
      });
    }
    return [
      {
        type: 'sky',
        shapes: [{ kind: 'rect', color: 0x0f1218, alpha: 1, x: 0, y: 0, width, height }]
      },
      {
        type: 'mid_bg',
        shapes: [
          // walls
          { kind: 'rect', color: 0x1a1822, alpha: 1, x: 0, y: 0, width: width * 0.2, height },
          { kind: 'rect', color: 0x1e1c26, alpha: 1, x: width * 0.8, y: 0, width: width * 0.2, height },
          // railing
          { kind: 'rect', color: 0x3a3540, alpha: 0.6, x: startX - 10, y: startY - 40, width: 3, height: stepCount * stepH + 40 },
          ...stairShapes,
        ]
      },
      {
        type: 'floor',
        shapes: [
          { kind: 'rect', color: 0x1a1620, alpha: 1, x: 0, y: startY + stepCount * stepH, width, height: height - (startY + stepCount * stepH) },
        ]
      }
    ];
  }
});
