import type { ReactionChain, ReactionTrigger, ReactionStep } from '@animaster/shared/scene';

function step(action: ReactionStep['action'], durationMs: number, delayMs: number = 0): ReactionStep {
  return { action, durationMs, delayMs };
}

const reactionTemplates: Record<ReactionTrigger, ReactionStep[]> = {
  approach_detected: [
    step('glance', 400),
    step('freeze', 500, 100),
    step('step_back', 600, 200),
  ],
  bad_news: [
    step('stillness', 600),
    step('pause', 800, 300),
    step('collapse', 1200, 200),
  ],
  awkward_pause: [
    step('look_away', 500),
    step('fidget', 700, 150),
    step('avoidance', 600, 100),
  ],
  confrontation: [
    step('freeze', 400),
    step('approach', 800, 100),
    step('recoil', 500, 200),
  ],
  comfort: [
    step('pause', 500),
    step('approach', 900),
    step('attempt_contact', 800, 100),
  ],
  avoidance_detected: [
    step('glance', 300),
    step('look_away', 600, 100),
    step('step_back', 500, 150),
  ],
};

export function createReactionChain(trigger: ReactionTrigger): ReactionChain {
  return {
    trigger,
    steps: reactionTemplates[trigger].map((s) => ({ ...s })),
    currentStepIndex: 0,
    elapsedMs: 0,
    completed: false,
  };
}
