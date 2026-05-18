import type { ReactionChain, ReactionStep } from '@animaster/shared/scene';

export interface ReactionRunnerOutput {
  updatedChain: ReactionChain;
  activeStep: ReactionStep | null;
  stepProgress: number;
}

export function advanceReactionChain(chain: ReactionChain, deltaMs: number): ReactionRunnerOutput {
  if (chain.completed) {
    return { updatedChain: chain, activeStep: null, stepProgress: 1 };
  }

  const updated: ReactionChain = {
    ...chain,
    steps: chain.steps.map((s) => ({ ...s })),
    elapsedMs: chain.elapsedMs + deltaMs,
  };

  if (updated.currentStepIndex >= updated.steps.length) {
    updated.completed = true;
    return { updatedChain: updated, activeStep: null, stepProgress: 1 };
  }

  const step = updated.steps[updated.currentStepIndex];

  let accumulatedTime = 0;
  for (let i = 0; i < updated.currentStepIndex; i++) {
    accumulatedTime += updated.steps[i].durationMs + updated.steps[i].delayMs;
  }
  accumulatedTime += step.delayMs;

  if (updated.elapsedMs < accumulatedTime) {
    return { updatedChain: updated, activeStep: null, stepProgress: 0 };
  }

  const stepElapsed = updated.elapsedMs - accumulatedTime;
  const progress = Math.min(stepElapsed / Math.max(1, step.durationMs), 1);

  if (stepElapsed >= step.durationMs) {
    updated.currentStepIndex += 1;
  }

  return { updatedChain: updated, activeStep: step, stepProgress: progress };
}
