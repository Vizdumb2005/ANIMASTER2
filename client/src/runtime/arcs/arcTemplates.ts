import type { EmotionalArc, ArcPhase, SceneTone } from '@animaster/shared/scene';

function phase(
  name: ArcPhase['name'],
  targetEmotion: ArcPhase['targetEmotion'],
  targetIntensity: number,
  durationMs: number,
  atmosphereShift: ArcPhase['atmosphereShift'] = null
): ArcPhase {
  return { name, targetEmotion, targetIntensity, durationMs, elapsedMs: 0, atmosphereShift };
}

const tenseArc: ArcPhase[] = [
  phase('setup', 'neutral', 0.2, 3000),
  phase('rising', 'nervous', 0.5, 3000, { ambientDelta: -0.1 }),
  phase('peak', 'angry', 0.9, 2500, { lightingTint: 'cold', ambientDelta: -0.2 }),
  phase('falling', 'nervous', 0.6, 2000),
  phase('resolution', 'neutral', 0.3, 2000, { ambientDelta: 0.1 }),
];

const lonelyArc: ArcPhase[] = [
  phase('setup', 'neutral', 0.3, 2500),
  phase('rising', 'sad', 0.4, 3000, { ambientDelta: -0.1 }),
  phase('peak', 'sad', 0.8, 3500, { lightingTint: 'cold', ambientDelta: -0.15 }),
  phase('falling', 'sad', 0.6, 2500),
  phase('resolution', 'sad', 0.4, 2500),
];

const revealArc: ArcPhase[] = [
  phase('setup', 'neutral', 0.2, 2000),
  phase('rising', 'nervous', 0.5, 2500),
  phase('peak', 'sad', 0.9, 2000, { ambientDelta: -0.2 }),
  phase('falling', 'exhausted', 0.7, 3000),
  phase('resolution', 'sad', 0.4, 2500),
];

const awkwardArc: ArcPhase[] = [
  phase('setup', 'neutral', 0.2, 2000),
  phase('rising', 'awkward', 0.4, 2500),
  phase('peak', 'awkward', 0.7, 3000),
  phase('falling', 'nervous', 0.5, 2000),
  phase('resolution', 'neutral', 0.3, 2500),
];

const confrontationArc: ArcPhase[] = [
  phase('setup', 'neutral', 0.3, 2000),
  phase('rising', 'angry', 0.5, 2500, { ambientDelta: -0.1 }),
  phase('peak', 'angry', 1.0, 2000, { lightingTint: 'cold', ambientDelta: -0.2 }),
  phase('falling', 'nervous', 0.6, 2500),
  phase('resolution', 'exhausted', 0.4, 2000),
];

const romanticArc: ArcPhase[] = [
  phase('setup', 'neutral', 0.2, 2500),
  phase('rising', 'happy', 0.4, 3000, { lightingTint: 'warm', ambientDelta: 0.05 }),
  phase('peak', 'happy', 0.8, 3000, { lightingTint: 'warm' }),
  phase('falling', 'happy', 0.6, 2500),
  phase('resolution', 'happy', 0.5, 2000),
];

const arcMap: Record<string, ArcPhase[]> = {
  tense: tenseArc,
  lonely: lonelyArc,
  sad: lonelyArc,
  neutral: revealArc,
  awkward: awkwardArc,
  threatening: confrontationArc,
  energetic: revealArc,
  romantic: romanticArc,
};

export function createEmotionalArc(tone: SceneTone): EmotionalArc {
  const phases = arcMap[tone] ?? revealArc;
  return {
    id: `arc_${tone}`,
    label: tone,
    phases: phases.map((p) => ({ ...p, elapsedMs: 0 })),
    currentPhaseIndex: 0,
    totalElapsedMs: 0,
    completed: false,
  };
}
