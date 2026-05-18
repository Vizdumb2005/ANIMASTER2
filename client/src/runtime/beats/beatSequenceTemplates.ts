import type { BeatSequence, EmotionalBeat, SceneTone } from '@animaster/shared/scene';

function beat(
  action: EmotionalBeat['action'],
  durationMs: number,
  opts: Partial<EmotionalBeat> = {}
): EmotionalBeat {
  return {
    action,
    durationMs,
    elapsedMs: 0,
    emotionTarget: opts.emotionTarget ?? null,
    intensityTarget: opts.intensityTarget ?? 0.5,
    cameraResponse: opts.cameraResponse ?? 'none',
    spacingDelta: opts.spacingDelta ?? 0,
    motionDamping: opts.motionDamping ?? 0,
  };
}

const realizationSequence: EmotionalBeat[] = [
  beat('neutral', 1200),
  beat('pause', 800, { cameraResponse: 'hold', motionDamping: 0.8 }),
  beat('freeze', 600, { cameraResponse: 'push_in', motionDamping: 1.0, emotionTarget: 'nervous', intensityTarget: 0.6 }),
  beat('collapse', 1400, { cameraResponse: 'hold', emotionTarget: 'sad', intensityTarget: 0.9, spacingDelta: -10 }),
  beat('stillness', 1000, { cameraResponse: 'pull_back', motionDamping: 0.9 }),
];

const awkwardConversationSequence: EmotionalBeat[] = [
  beat('attempt_contact', 900, { emotionTarget: 'awkward', intensityTarget: 0.3 }),
  beat('avoidance', 700, { cameraResponse: 'reframe', spacingDelta: 15 }),
  beat('pause', 600, { motionDamping: 0.7 }),
  beat('retry', 800, { emotionTarget: 'awkward', intensityTarget: 0.5, spacingDelta: -10 }),
  beat('look_away', 1000, { cameraResponse: 'drift', motionDamping: 0.6 }),
  beat('stillness', 800, { cameraResponse: 'hold' }),
];

const tensionSequence: EmotionalBeat[] = [
  beat('neutral', 1000, { emotionTarget: 'neutral', intensityTarget: 0.2 }),
  beat('glance', 500, { cameraResponse: 'reframe' }),
  beat('stillness', 800, { motionDamping: 0.9, cameraResponse: 'hold' }),
  beat('approach', 1200, { emotionTarget: 'nervous', intensityTarget: 0.6, spacingDelta: -30, cameraResponse: 'compress' }),
  beat('recoil', 600, { emotionTarget: 'nervous', intensityTarget: 0.8, spacingDelta: 20, cameraResponse: 'pull_back' }),
  beat('freeze', 900, { cameraResponse: 'hold', motionDamping: 1.0 }),
];

const lonelinessSequence: EmotionalBeat[] = [
  beat('neutral', 1500, { emotionTarget: 'neutral', intensityTarget: 0.3 }),
  beat('pause', 1000, { motionDamping: 0.5, cameraResponse: 'drift' }),
  beat('stillness', 1200, { emotionTarget: 'sad', intensityTarget: 0.5, motionDamping: 0.8 }),
  beat('look_away', 800, { cameraResponse: 'pull_back', spacingDelta: 10 }),
  beat('stillness', 2000, { emotionTarget: 'sad', intensityTarget: 0.8, cameraResponse: 'hold', motionDamping: 1.0 }),
];

const confrontationSequence: EmotionalBeat[] = [
  beat('glance', 600, { emotionTarget: 'angry', intensityTarget: 0.3, cameraResponse: 'reframe' }),
  beat('approach', 1000, { spacingDelta: -40, cameraResponse: 'compress', emotionTarget: 'angry', intensityTarget: 0.6 }),
  beat('freeze', 500, { cameraResponse: 'hold', motionDamping: 1.0 }),
  beat('approach', 800, { spacingDelta: -20, cameraResponse: 'push_in', emotionTarget: 'angry', intensityTarget: 0.9 }),
  beat('recoil', 600, { spacingDelta: 15, cameraResponse: 'pull_back' }),
  beat('stillness', 1000, { cameraResponse: 'hold', motionDamping: 0.8 }),
];

const comfortSequence: EmotionalBeat[] = [
  beat('pause', 800, { cameraResponse: 'hold' }),
  beat('approach', 1200, { spacingDelta: -25, cameraResponse: 'drift', emotionTarget: 'sad', intensityTarget: 0.4 }),
  beat('stillness', 600, { cameraResponse: 'hold', motionDamping: 0.6 }),
  beat('attempt_contact', 1000, { spacingDelta: -10, cameraResponse: 'push_in' }),
  beat('stillness', 1500, { emotionTarget: 'neutral', intensityTarget: 0.3, cameraResponse: 'hold', motionDamping: 0.4 }),
];

const templateMap: Record<string, EmotionalBeat[]> = {
  realization: realizationSequence,
  awkward: awkwardConversationSequence,
  tense: tensionSequence,
  lonely: lonelinessSequence,
  confrontation: confrontationSequence,
  comfort: comfortSequence,
  threatening: confrontationSequence,
  romantic: comfortSequence,
  sad: lonelinessSequence,
};

export function createBeatSequence(tone: SceneTone, sceneTimeMs: number): BeatSequence {
  const beats = templateMap[tone] ?? realizationSequence;
  return {
    id: `beat_seq_${tone}`,
    label: tone,
    beats: beats.map((b) => ({ ...b, elapsedMs: 0 })),
    currentIndex: 0,
    startedAtMs: sceneTimeMs,
    totalElapsedMs: 0,
    completed: false,
    looping: true,
  };
}
