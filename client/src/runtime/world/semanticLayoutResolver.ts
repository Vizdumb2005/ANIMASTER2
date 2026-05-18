import type { CompositionZone, LayoutStyle, CompositionStyle, VisualDensity } from '@animaster/shared/scene';

interface LayoutParams {
  layoutStyle: LayoutStyle;
  compositionStyle: CompositionStyle;
  visualDensity: VisualDensity;
  isIndoor: boolean;
  depthLayers: number;
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function resolveLayout(params: LayoutParams, seed: number): CompositionZone[] {
  const rng = seededRandom(seed);
  const zones: CompositionZone[] = [];

  const baseWidth = params.isIndoor ? 12 : 20;
  const baseDepth = params.isIndoor ? 10 : 25;

  // Background zone — always present
  zones.push({
    id: 'bg',
    type: 'background',
    bounds: { xMin: -baseWidth, xMax: baseWidth, zMin: -baseDepth, zMax: -baseDepth * 0.6 },
    visualWeight: 0.2,
    depth: params.depthLayers,
  });

  // Midground zone
  zones.push({
    id: 'mid',
    type: 'midground',
    bounds: { xMin: -baseWidth * 0.7, xMax: baseWidth * 0.7, zMin: -baseDepth * 0.5, zMax: -baseDepth * 0.1 },
    visualWeight: 0.5,
    depth: Math.ceil(params.depthLayers / 2),
  });

  // Foreground zone
  zones.push({
    id: 'fg',
    type: 'foreground',
    bounds: { xMin: -baseWidth * 0.5, xMax: baseWidth * 0.5, zMin: -baseDepth * 0.05, zMax: baseDepth * 0.15 },
    visualWeight: 0.3,
    depth: 1,
  });

  // Composition-specific zones
  switch (params.compositionStyle) {
    case 'negative_space':
      zones.push({
        id: 'neg-left',
        type: 'negative_space',
        bounds: { xMin: -baseWidth, xMax: -baseWidth * 0.3, zMin: -baseDepth * 0.5, zMax: 0 },
        visualWeight: 0,
        depth: 2,
      });
      zones.push({
        id: 'neg-right',
        type: 'negative_space',
        bounds: { xMin: baseWidth * 0.3, xMax: baseWidth, zMin: -baseDepth * 0.5, zMax: 0 },
        visualWeight: 0,
        depth: 2,
      });
      break;

    case 'foreground_obstruction': {
      const side = rng() > 0.5 ? 1 : -1;
      zones.push({
        id: 'frame-obstruct',
        type: 'framing',
        bounds: { xMin: side * baseWidth * 0.3, xMax: side * baseWidth * 0.6, zMin: 0, zMax: baseDepth * 0.1 },
        visualWeight: 0.4,
        depth: 0,
      });
      break;
    }

    case 'silhouette_framing':
      zones.push({
        id: 'frame-left',
        type: 'framing',
        bounds: { xMin: -baseWidth * 0.8, xMax: -baseWidth * 0.5, zMin: -baseDepth * 0.3, zMax: baseDepth * 0.05 },
        visualWeight: 0.3,
        depth: 0,
      });
      zones.push({
        id: 'frame-right',
        type: 'framing',
        bounds: { xMin: baseWidth * 0.5, xMax: baseWidth * 0.8, zMin: -baseDepth * 0.3, zMax: baseDepth * 0.05 },
        visualWeight: 0.3,
        depth: 0,
      });
      break;

    case 'asymmetric_tension': {
      const heavySide = rng() > 0.5 ? 1 : -1;
      zones[1] = {
        ...zones[1],
        bounds: {
          xMin: heavySide * -baseWidth * 0.1,
          xMax: heavySide * baseWidth * 0.8,
          zMin: zones[1].bounds.zMin,
          zMax: zones[1].bounds.zMax,
        },
        visualWeight: 0.7,
      };
      break;
    }

    case 'depth_layering':
      for (let i = 0; i < params.depthLayers; i++) {
        const layerDepth = -baseDepth * (i / params.depthLayers);
        zones.push({
          id: `depth-${i}`,
          type: i === 0 ? 'foreground' : i === params.depthLayers - 1 ? 'background' : 'midground',
          bounds: {
            xMin: -baseWidth * (0.3 + i * 0.15),
            xMax: baseWidth * (0.3 + i * 0.15),
            zMin: layerDepth - baseDepth / params.depthLayers,
            zMax: layerDepth,
          },
          visualWeight: 1 / (i + 1),
          depth: i,
        });
      }
      break;
  }

  // Layout-specific adjustments
  if (params.layoutStyle === 'long_corridor') {
    zones.forEach((z) => {
      if (z.type === 'midground' || z.type === 'background') {
        z.bounds.xMin = Math.max(z.bounds.xMin, -baseWidth * 0.35);
        z.bounds.xMax = Math.min(z.bounds.xMax, baseWidth * 0.35);
      }
    });
  }

  if (params.layoutStyle === 'circular') {
    zones.forEach((z) => {
      if (z.type === 'midground') {
        const cx = (z.bounds.xMin + z.bounds.xMax) / 2;
        const cz = (z.bounds.zMin + z.bounds.zMax) / 2;
        const r = Math.min(z.bounds.xMax - z.bounds.xMin, z.bounds.zMax - z.bounds.zMin) * 0.4;
        z.bounds = { xMin: cx - r, xMax: cx + r, zMin: cz - r, zMax: cz + r };
      }
    });
  }

  return zones;
}
