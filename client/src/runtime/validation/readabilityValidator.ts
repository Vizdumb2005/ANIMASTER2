import type { SceneGraph, CompositionMetrics } from '@animaster/shared/scene';

export interface ReadabilityReport {
  emotionalClarity: number;
  stagingReadability: number;
  focusAmbiguity: number;
  compositionalConfusion: number;
  emotionalContradiction: number;
  overallScore: number;
  warnings: string[];
}

export function validateReadability(scene: SceneGraph): ReadabilityReport {
  const warnings: string[] = [];
  const actors = scene.actors;
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';

  const emotionalClarity = evaluateEmotionalClarity(scene);
  const stagingReadability = evaluateStagingReadability(scene);
  const focusAmbiguity = evaluateFocusAmbiguity(scene);
  const compositionalConfusion = evaluateCompositionalConfusion(scene);
  const emotionalContradiction = evaluateEmotionalContradiction(scene);

  if (emotionalClarity < 0.4) warnings.push('Low emotional clarity — mixed emotions without clear intent');
  if (stagingReadability < 0.4) warnings.push('Poor staging readability — actors may overlap or crowd');
  if (focusAmbiguity > 0.6) warnings.push('High focus ambiguity — unclear where viewer should look');
  if (compositionalConfusion > 0.6) warnings.push('Compositional confusion — unbalanced frame');
  if (emotionalContradiction > 0.5) warnings.push('Emotional contradiction — tone and acting conflict');

  const overallScore =
    emotionalClarity * 0.25 +
    stagingReadability * 0.2 +
    (1 - focusAmbiguity) * 0.2 +
    (1 - compositionalConfusion) * 0.15 +
    (1 - emotionalContradiction) * 0.2;

  return { emotionalClarity, stagingReadability, focusAmbiguity, compositionalConfusion, emotionalContradiction, overallScore, warnings };
}

function evaluateEmotionalClarity(scene: SceneGraph): number {
  const actors = scene.actors;
  if (actors.length === 0) return 1;

  const emotions = actors.map((a) => a.emotionState);
  const uniqueEmotions = new Set(emotions);

  if (uniqueEmotions.size === 1) return 1;

  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const toneEmotionMap: Record<string, string[]> = {
    sad: ['sad', 'exhausted'],
    tense: ['nervous', 'angry'],
    lonely: ['sad'],
    awkward: ['awkward', 'nervous'],
    romantic: ['happy', 'nervous'],
    threatening: ['angry', 'nervous'],
    energetic: ['excited', 'happy']
  };

  const expectedEmotions = toneEmotionMap[tone] ?? [];
  if (expectedEmotions.length === 0) return 0.7;

  let matches = 0;
  for (const emotion of emotions) {
    if (expectedEmotions.includes(emotion)) matches++;
  }

  return matches / actors.length;
}

function evaluateStagingReadability(scene: SceneGraph): number {
  const actors = scene.actors;
  if (actors.length <= 1) return 1;

  let minDist = Infinity;
  for (let i = 0; i < actors.length; i++) {
    for (let j = i + 1; j < actors.length; j++) {
      const dx = actors[i].position.x - actors[j].position.x;
      const dy = actors[i].position.y - actors[j].position.y;
      minDist = Math.min(minDist, Math.sqrt(dx * dx + dy * dy));
    }
  }

  if (minDist < 20) return 0.2;
  if (minDist < 40) return 0.5;
  if (minDist < 60) return 0.7;
  return 1;
}

function evaluateFocusAmbiguity(scene: SceneGraph): number {
  const actors = scene.actors;
  if (actors.length <= 1) return 0;

  const movingCount = actors.filter((a) => a.currentAction !== 'idle').length;
  if (movingCount === 0) return 0.3;
  if (movingCount === 1) return 0;
  return Math.min(1, movingCount / actors.length);
}

function evaluateCompositionalConfusion(scene: SceneGraph): number {
  const metrics = scene.compositionMetrics;
  if (!metrics) return 0.3;

  let confusion = 0;
  if (metrics.negativeSpaceBalance < 0.3) confusion += 0.3;
  if (metrics.silhouetteClarity < 0.4) confusion += 0.3;
  if (metrics.ruleOfThirdsScore < 0.3) confusion += 0.2;

  const weightDiff = Math.abs(metrics.visualWeight.left - metrics.visualWeight.right);
  if (weightDiff > 1.5) confusion += 0.2;

  return Math.min(1, confusion);
}

function evaluateEmotionalContradiction(scene: SceneGraph): number {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const spatial = scene.emotionalSpatial;

  if (!spatial) return 0;

  const contradictions: Record<string, string[]> = {
    intimacy: ['lonely', 'threatening'],
    isolation: ['romantic', 'energetic'],
    confrontation: ['romantic'],
    vulnerability: ['threatening', 'energetic']
  };

  const conflicting = contradictions[spatial.spatialIntent] ?? [];
  if (conflicting.includes(tone)) return 0.7;

  return 0;
}
