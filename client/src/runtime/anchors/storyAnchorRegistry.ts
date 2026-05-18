import type { StoryAnchor, StoryAnchorType, SceneTone, Environment } from '@animaster/shared/scene';

const toneAnchorMap: Record<SceneTone, StoryAnchorType[]> = {
  lonely: ['bench', 'window_silhouette', 'streetlight_silhouette'],
  sad: ['window_silhouette', 'rain_window', 'bench'],
  tense: ['hallway', 'corner_wall', 'doorway'],
  threatening: ['hallway', 'corner_wall', 'streetlight_silhouette'],
  awkward: ['doorway', 'bench', 'corner_wall'],
  romantic: ['bench', 'window_silhouette', 'skyline'],
  energetic: ['doorway', 'skyline', 'streetlight_silhouette'],
  neutral: ['bench', 'doorway'],
};

function anchorDimensions(type: StoryAnchorType): { width: number; height: number } {
  switch (type) {
    case 'rooftop_ledge': return { width: 200, height: 12 };
    case 'window_silhouette': return { width: 60, height: 80 };
    case 'bench': return { width: 80, height: 30 };
    case 'doorway': return { width: 50, height: 100 };
    case 'hallway': return { width: 120, height: 110 };
    case 'corner_wall': return { width: 20, height: 110 };
    case 'streetlight_silhouette': return { width: 12, height: 120 };
    case 'rain_window': return { width: 70, height: 90 };
    case 'skyline': return { width: 300, height: 40 };
  }
}

function anchorPosition(type: StoryAnchorType, env: Environment, index: number): { x: number; y: number } {
  const margin = 60;
  switch (type) {
    case 'bench': return { x: env.width * 0.2 + index * 100, y: env.height * 0.75 };
    case 'window_silhouette': return { x: env.width * 0.85, y: env.height * 0.25 };
    case 'doorway': return { x: margin, y: env.height * 0.35 };
    case 'hallway': return { x: env.width * 0.5, y: env.height * 0.3 };
    case 'corner_wall': return { x: env.width - margin, y: env.height * 0.35 };
    case 'streetlight_silhouette': return { x: env.width * 0.15 + index * 200, y: env.height * 0.2 };
    case 'rain_window': return { x: env.width * 0.8, y: env.height * 0.2 };
    case 'skyline': return { x: env.width * 0.5, y: env.height * 0.08 };
    case 'rooftop_ledge': return { x: env.width * 0.5, y: env.height * 0.15 };
  }
}

export function selectStoryAnchors(tone: SceneTone, env: Environment): StoryAnchor[] {
  const types = toneAnchorMap[tone] ?? toneAnchorMap.neutral;
  return types.map((type, i) => {
    const dims = anchorDimensions(type);
    const pos = anchorPosition(type, env, i);
    return {
      id: `story_anchor_${type}_${i}`,
      type,
      position: pos,
      width: dims.width,
      height: dims.height,
    };
  });
}
