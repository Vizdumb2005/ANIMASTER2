// Phase 7 — Task Group 12: Prompt Test Suite
// Tests semantic interpretation actually affects staging, lighting, pacing, environment, camera, acting

import { compileIntent } from '../compiler/intentCompiler.js';
import { planCinematography } from '../agents/cinematographerAgent.js';
import { planEnvironment } from '../agents/environmentAgent.js';
import { planEmotionalArc } from '../agents/emotionalArcAgent.js';
import { planBlocking } from '../agents/blockingAgent.js';
import { planDialogue } from '../agents/dialogueAgent.js';
import { planLighting } from '../agents/lightingAgent.js';
import { buildSemanticGraphPlan } from '../sceneGraph/sceneGraphIntelligence.js';

export interface PromptTestResult {
  prompt: string;
  passed: boolean;
  checks: Array<{
    name: string;
    expected: string;
    actual: string;
    passed: boolean;
  }>;
}

interface PromptTestCase {
  prompt: string;
  checks: Array<{
    name: string;
    test: (results: TestResults) => { expected: string; actual: string; passed: boolean };
  }>;
}

interface TestResults {
  intent: ReturnType<typeof compileIntent>;
  cinematography: ReturnType<typeof planCinematography>;
  environment: ReturnType<typeof planEnvironment>;
  emotionalArc: ReturnType<typeof planEmotionalArc>;
  blocking: ReturnType<typeof planBlocking>;
  dialogue: ReturnType<typeof planDialogue>;
  lighting: ReturnType<typeof planLighting>;
  graphPlan: ReturnType<typeof buildSemanticGraphPlan>;
}

const TEST_CASES: PromptTestCase[] = [
  {
    prompt: 'Make the silence feel painful',
    checks: [
      {
        name: 'High emotional pressure',
        test: (r) => ({ expected: '>0.5', actual: r.intent.emotionalPressure.toFixed(2), passed: r.intent.emotionalPressure > 0.5 })
      },
      {
        name: 'Slow pacing',
        test: (r) => ({ expected: 'slow_heavy or measured', actual: r.intent.pacingStyle, passed: r.intent.pacingStyle === 'slow_heavy' || r.intent.pacingStyle === 'measured' })
      },
      {
        name: 'Silence beats in dialogue',
        test: (r) => ({ expected: '>0 silence beats', actual: `${r.dialogue.silenceBeats.length} beats`, passed: r.dialogue.silenceBeats.length > 0 })
      }
    ]
  },
  {
    prompt: 'Create emotional distance between them',
    checks: [
      {
        name: 'Graph plan has distance operation',
        test: (r) => ({ expected: 'distance operation', actual: r.graphPlan.operations.length > 0 ? r.graphPlan.operations[0].type : 'none', passed: r.graphPlan.operations.length > 0 })
      },
      {
        name: 'Wide framing',
        test: (r) => ({ expected: 'wide or extreme_wide', actual: r.cinematography.framing, passed: r.cinematography.framing === 'extreme_wide' || r.cinematography.framing === 'wide' })
      }
    ]
  },
  {
    prompt: 'Make the room feel emotionally trapped',
    checks: [
      {
        name: 'Trapped blocking style',
        test: (r) => ({ expected: 'trapped', actual: r.intent.blockingStyle, passed: r.intent.blockingStyle === 'trapped' })
      },
      {
        name: 'Claustrophobic environment mood',
        test: (r) => ({ expected: 'claustrophobic or oppressive', actual: r.environment.mood, passed: r.environment.mood === 'claustrophobic' || r.environment.mood === 'oppressive' })
      },
      {
        name: 'High obstruction level',
        test: (r) => ({ expected: '>0.5', actual: r.environment.obstructionLevel.toFixed(2), passed: r.environment.obstructionLevel > 0.5 })
      }
    ]
  },
  {
    prompt: 'Turn this into a nostalgic memory',
    checks: [
      {
        name: 'Warm lighting',
        test: (r) => ({ expected: 'warm', actual: r.lighting.colorTemperature, passed: r.lighting.colorTemperature === 'warm' })
      },
      {
        name: 'Moderate emotional pressure',
        test: (r) => ({ expected: '>0.3', actual: r.intent.emotionalPressure.toFixed(2), passed: r.intent.emotionalPressure > 0.3 })
      }
    ]
  },
  {
    prompt: 'Make the confrontation feel restrained',
    checks: [
      {
        name: 'Tension present',
        test: (r) => ({ expected: '>0.4', actual: r.intent.tensionLevel.toFixed(2), passed: r.intent.tensionLevel > 0.4 })
      },
      {
        name: 'Not frantic pacing',
        test: (r) => ({ expected: 'not frantic', actual: r.intent.pacingStyle, passed: r.intent.pacingStyle !== 'frantic' })
      },
      {
        name: 'Camera not aggressive',
        test: (r) => ({ expected: '<0.6', actual: r.intent.cameraAggression.toFixed(2), passed: r.intent.cameraAggression < 0.6 })
      }
    ]
  },
  {
    prompt: 'Create tension without aggression',
    checks: [
      {
        name: 'Tension level elevated',
        test: (r) => ({ expected: '>0.4', actual: r.intent.tensionLevel.toFixed(2), passed: r.intent.tensionLevel > 0.4 })
      },
      {
        name: 'Low threat level',
        test: (r) => ({ expected: '<0.5', actual: r.intent.threatLevel.toFixed(2), passed: r.intent.threatLevel < 0.5 })
      },
      {
        name: 'Camera not highly aggressive',
        test: (r) => ({ expected: '<0.7', actual: r.intent.cameraAggression.toFixed(2), passed: r.intent.cameraAggression < 0.7 })
      }
    ]
  },
  {
    prompt: 'Make the hallway feel endless',
    checks: [
      {
        name: 'Hallway environment detected',
        test: (r) => ({ expected: 'hallway', actual: r.environment.locationType, passed: r.environment.locationType === 'hallway' })
      },
      {
        name: 'High visual isolation',
        test: (r) => ({ expected: '>0.4', actual: r.intent.visualIsolation.toFixed(2), passed: r.intent.visualIsolation > 0.4 })
      },
      {
        name: 'Wide or standard framing',
        test: (r) => ({ expected: 'not tight', actual: r.cinematography.framing, passed: r.cinematography.framing !== 'tight' })
      }
    ]
  }
];

export function runPromptTests(): PromptTestResult[] {
  return TEST_CASES.map(testCase => {
    const intent = compileIntent(testCase.prompt);
    const actorCount = 2;
    const cinematography = planCinematography(intent, actorCount);
    const environment = planEnvironment(intent, testCase.prompt);
    const emotionalArc = planEmotionalArc(intent, actorCount);
    const blocking = planBlocking(intent, actorCount);
    const dialogue = planDialogue(intent, actorCount);
    const lighting = planLighting(intent);
    const graphPlan = buildSemanticGraphPlan(testCase.prompt, intent);

    const results: TestResults = {
      intent, cinematography, environment, emotionalArc, blocking, dialogue, lighting, graphPlan
    };

    const checks = testCase.checks.map(check => {
      const result = check.test(results);
      return { name: check.name, ...result };
    });

    return {
      prompt: testCase.prompt,
      passed: checks.every(c => c.passed),
      checks
    };
  });
}

export function getTestCaseCount(): number {
  return TEST_CASES.length;
}
