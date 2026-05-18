import type { CompositionZone, CompositionStyle, SceneTone } from '@animaster/shared/scene';

export interface CompositionAnalysis {
  ruleOfThirdsScore: number;
  negativeSpaceBalance: number;
  visualWeightDistribution: { left: number; right: number; center: number };
  depthSeparation: number;
  framingScore: number;
}

export function analyzeComposition(zones: CompositionZone[]): CompositionAnalysis {
  const totalWeight = zones.reduce((s, z) => s + z.visualWeight, 0) || 1;

  let leftWeight = 0;
  let rightWeight = 0;
  let centerWeight = 0;

  for (const zone of zones) {
    const cx = (zone.bounds.xMin + zone.bounds.xMax) / 2;
    if (cx < -1) leftWeight += zone.visualWeight;
    else if (cx > 1) rightWeight += zone.visualWeight;
    else centerWeight += zone.visualWeight;
  }

  const normalizedLeft = leftWeight / totalWeight;
  const normalizedRight = rightWeight / totalWeight;
  const normalizedCenter = centerWeight / totalWeight;

  // Rule of thirds: higher score when weight is on the thirds
  const thirdScore = Math.min(1, (normalizedLeft + normalizedRight) * 1.5);

  // Negative space balance
  const negSpaceZones = zones.filter((z) => z.type === 'negative_space');
  const negSpaceRatio = negSpaceZones.length / (zones.length || 1);

  // Depth separation
  const depths = zones.map((z) => z.depth);
  const depthRange = (Math.max(...depths) - Math.min(...depths)) / (Math.max(...depths) || 1);

  // Framing
  const framingZones = zones.filter((z) => z.type === 'framing');
  const framingScore = Math.min(1, framingZones.length * 0.5);

  return {
    ruleOfThirdsScore: thirdScore,
    negativeSpaceBalance: negSpaceRatio,
    visualWeightDistribution: {
      left: normalizedLeft,
      right: normalizedRight,
      center: normalizedCenter,
    },
    depthSeparation: depthRange,
    framingScore,
  };
}

export function adjustZonesForTone(zones: CompositionZone[], tone: SceneTone): CompositionZone[] {
  switch (tone) {
    case 'lonely':
      return zones.map((z) => {
        if (z.type === 'negative_space') {
          return {
            ...z,
            bounds: {
              ...z.bounds,
              xMin: z.bounds.xMin * 1.3,
              xMax: z.bounds.xMax * 1.3,
            },
            visualWeight: 0,
          };
        }
        return z;
      });

    case 'tense':
    case 'threatening':
      return zones.map((z) => {
        if (z.type === 'midground') {
          return {
            ...z,
            bounds: {
              ...z.bounds,
              xMin: z.bounds.xMin * 0.7,
              xMax: z.bounds.xMax * 0.7,
            },
            visualWeight: z.visualWeight * 1.3,
          };
        }
        return z;
      });

    case 'romantic':
      return zones.map((z) => {
        if (z.type === 'midground') {
          return {
            ...z,
            bounds: {
              ...z.bounds,
              xMin: z.bounds.xMin * 0.8,
              xMax: z.bounds.xMax * 0.8,
            },
          };
        }
        return z;
      });

    default:
      return zones;
  }
}

export function getCompositionStyleForScene(
  tone: SceneTone,
  actorCount: number,
  isIndoor: boolean,
): CompositionStyle {
  if (actorCount === 1) {
    if (tone === 'lonely' || tone === 'sad') return 'negative_space';
    if (tone === 'tense') return 'foreground_obstruction';
    return 'centered_isolation';
  }

  if (actorCount >= 2) {
    if (tone === 'tense' || tone === 'threatening') return 'asymmetric_tension';
    if (tone === 'romantic') return 'centered_isolation';
    if (isIndoor) return 'foreground_obstruction';
    return 'depth_layering';
  }

  return 'centered_isolation';
}
