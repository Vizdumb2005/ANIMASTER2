// Phase 7 — Task Group 6: Context Compression
// Reduces token usage by distilling semantic context into compact summaries

import type { SemanticContext } from './contextAssembler.js';

export interface CompressedContext {
  summary: string;
  tokenEstimate: number;
  compressionRatio: number;
}

export function compressContext(context: SemanticContext, maxTokens: number = 500): CompressedContext {
  const fullSummary = buildFullSummary(context);
  const fullTokenEstimate = estimateTokens(fullSummary);

  if (fullTokenEstimate <= maxTokens) {
    return {
      summary: fullSummary,
      tokenEstimate: fullTokenEstimate,
      compressionRatio: 1.0
    };
  }

  // Progressive compression levels
  let compressed = compressLevel1(context);
  let tokenEst = estimateTokens(compressed);
  if (tokenEst <= maxTokens) {
    return { summary: compressed, tokenEstimate: tokenEst, compressionRatio: fullTokenEstimate / tokenEst };
  }

  compressed = compressLevel2(context);
  tokenEst = estimateTokens(compressed);
  if (tokenEst <= maxTokens) {
    return { summary: compressed, tokenEstimate: tokenEst, compressionRatio: fullTokenEstimate / tokenEst };
  }

  compressed = compressLevel3(context);
  tokenEst = estimateTokens(compressed);
  return { summary: compressed, tokenEstimate: tokenEst, compressionRatio: fullTokenEstimate / tokenEst };
}

function buildFullSummary(ctx: SemanticContext): string {
  const parts: string[] = [
    `Scene: ${ctx.sceneSummary}`,
    `Emotion: ${ctx.emotionalState.dominantEmotion} (intensity=${ctx.emotionalState.intensity.toFixed(2)}, ${ctx.emotionalState.trajectory})`,
    `Tone: ${ctx.cinematicState.currentTone}, Camera: ${ctx.cinematicState.cameraMode}, Light: ${ctx.cinematicState.lightingLanguage}`,
    `Environment: ${ctx.environmentState.locationType} (${ctx.environmentState.density}, ${ctx.environmentState.mood})`,
    `Effects: ${ctx.environmentState.activeEffects.length > 0 ? ctx.environmentState.activeEffects.join(', ') : 'none'}`,
    `Pacing: ${ctx.pacingSummary}`
  ];

  if (ctx.relationshipState.length > 0) {
    const rels = ctx.relationshipState.map(r => `${r.actorA}-${r.actorB}: ${r.currentType}`).join(', ');
    parts.push(`Relationships: ${rels}`);
  }

  if (ctx.unresolvedTensions.length > 0) {
    parts.push(`Tensions: ${ctx.unresolvedTensions.join(', ')}`);
  }

  if (ctx.activeMotifs.length > 0) {
    parts.push(`Motifs: ${ctx.activeMotifs.join(', ')}`);
  }

  return parts.join('\n');
}

// Level 1: Remove motifs and relationship evolution history
function compressLevel1(ctx: SemanticContext): string {
  const parts: string[] = [
    `Scene: ${ctx.sceneSummary}`,
    `Emotion: ${ctx.emotionalState.dominantEmotion} (${ctx.emotionalState.intensity.toFixed(1)}, ${ctx.emotionalState.trajectory})`,
    `Tone: ${ctx.cinematicState.currentTone}, Camera: ${ctx.cinematicState.cameraMode}, Light: ${ctx.cinematicState.lightingLanguage}`,
    `Env: ${ctx.environmentState.locationType} (${ctx.environmentState.density})`,
    `Pacing: ${ctx.pacingSummary}`
  ];

  if (ctx.environmentState.activeEffects.length > 0) {
    parts.push(`Effects: ${ctx.environmentState.activeEffects.join(', ')}`);
  }

  if (ctx.unresolvedTensions.length > 0) {
    parts.push(`Tensions: ${ctx.unresolvedTensions.slice(0, 3).join(', ')}`);
  }

  return parts.join('\n');
}

// Level 2: Single line summary
function compressLevel2(ctx: SemanticContext): string {
  const effects = ctx.environmentState.activeEffects.length > 0 ? ` [${ctx.environmentState.activeEffects.join(',')}]` : '';
  return `${ctx.cinematicState.currentTone} ${ctx.environmentState.locationType} | ${ctx.emotionalState.dominantEmotion} (${ctx.emotionalState.intensity.toFixed(1)}) ${ctx.emotionalState.trajectory} | ${ctx.cinematicState.cameraMode}${effects}`;
}

// Level 3: Minimal keywords
function compressLevel3(ctx: SemanticContext): string {
  return `${ctx.cinematicState.currentTone}/${ctx.environmentState.locationType}/${ctx.emotionalState.dominantEmotion}/${ctx.cinematicState.cameraMode}`;
}

function estimateTokens(text: string): number {
  // Rough estimate: ~4 chars per token for English text
  return Math.ceil(text.length / 4);
}
