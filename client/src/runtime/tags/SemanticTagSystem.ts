// Animaster Semantic Tag System — runtime modifiers that adjust procedural
// parameters to produce contextually appropriate behavior.
// Implements: Design.md (Semantic_Tag), Requirement 16
// Property 16: applying a tag produces baseline + delta; removing restores baseline.
//
// WHY: Tags are the runtime bridge between AI intent and motion parameters.
// When the AI Director says "make him more nervous", a 'nervous' tag is applied,
// which adjusts breath rate, fidget probability, arm swing, etc. When removed,
// all parameters restore to their pre-tag values. This is the mechanism that
// makes emotion actionable at the procedural level.

import type {
  Actor, SemanticTag, ParameterDelta, BuiltInSemanticTag,
  BehaviorLayerIndex, BehaviorLayerSet,
} from '@animaster/shared/core';

// ============================================================
// Built-in tag definitions: tag name → parameter deltas
// ============================================================

interface TagDefinition {
  parameterDeltas: Omit<ParameterDelta, 'preTagValue'>[];
  priority: number;
  affectedLayers: BehaviorLayerIndex[];
}

const TAG_DEFINITIONS: Record<BuiltInSemanticTag, TagDefinition> = {
  nervous: {
    priority: 5,
    affectedLayers: [2, 4],
    parameterDeltas: [
      { behaviorId: 'idle', parameterName: 'breathRate', delta: 0.3 },
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: 0.15 },
      { behaviorId: 'idle', parameterName: 'swayAmplitude', delta: 2 },
      { behaviorId: 'idle', parameterName: 'swayFrequency', delta: 0.5 },
    ],
  },
  hesitant: {
    priority: 5,
    affectedLayers: [1, 2],
    parameterDeltas: [
      { behaviorId: 'walking', parameterName: 'blendWeight', delta: -0.3 },
      { behaviorId: 'idle', parameterName: 'swayFrequency', delta: -0.3 },
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: 0.08 },
    ],
  },
  energetic: {
    priority: 4,
    affectedLayers: [1, 2],
    parameterDeltas: [
      { behaviorId: 'walking', parameterName: 'blendWeight', delta: 0.3 },
      { behaviorId: 'idle', parameterName: 'breathRate', delta: 0.4 },
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: 0.1 },
      { behaviorId: 'idle', parameterName: 'swayAmplitude', delta: 4 },
    ],
  },
  awkward: {
    priority: 5,
    affectedLayers: [2, 3],
    parameterDeltas: [
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: 0.12 },
      { behaviorId: 'idle', parameterName: 'swayAmplitude', delta: 1.5 },
      { behaviorId: 'idle', parameterName: 'breathRate', delta: 0.15 },
    ],
  },
  aggressive: {
    priority: 6,
    affectedLayers: [1, 2],
    parameterDeltas: [
      { behaviorId: 'walking', parameterName: 'blendWeight', delta: 0.4 },
      { behaviorId: 'idle', parameterName: 'breathRate', delta: 0.5 },
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: -0.05 },
      { behaviorId: 'idle', parameterName: 'swayAmplitude', delta: -2 },
    ],
  },
  tired: {
    priority: 4,
    affectedLayers: [1, 2],
    parameterDeltas: [
      { behaviorId: 'walking', parameterName: 'blendWeight', delta: -0.4 },
      { behaviorId: 'idle', parameterName: 'breathRate', delta: -0.2 },
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: -0.08 },
      { behaviorId: 'idle', parameterName: 'swayAmplitude', delta: -3 },
    ],
  },
  confident: {
    priority: 4,
    affectedLayers: [1, 2],
    parameterDeltas: [
      { behaviorId: 'walking', parameterName: 'blendWeight', delta: 0.2 },
      { behaviorId: 'idle', parameterName: 'breathRate', delta: -0.1 },
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: -0.1 },
    ],
  },
  distracted: {
    priority: 3,
    affectedLayers: [3, 4],
    parameterDeltas: [
      { behaviorId: 'idle', parameterName: 'fidgetProbability', delta: 0.2 },
      { behaviorId: 'idle', parameterName: 'swayFrequency', delta: 0.7 },
      { behaviorId: 'idle', parameterName: 'breathRate', delta: 0.1 },
    ],
  },
};

// ============================================================
// Tag Registry
// ============================================================

const customTags = new Map<string, TagDefinition>();

export function registerTag(name: string, definition: TagDefinition): void {
  customTags.set(name, definition);
}

export function getTagDefinition(name: string): TagDefinition | undefined {
  return (TAG_DEFINITIONS as Record<string, TagDefinition>)[name] ?? customTags.get(name);
}

export function getBuiltInTagNames(): string[] {
  return Object.keys(TAG_DEFINITIONS);
}

// ============================================================
// Apply / Remove tags on actors
// ============================================================

/**
 * Apply a semantic tag to an actor.
 * Property 16: parameter values become baseline + delta.
 * Pre-tag values are stored for exact restoration on removal.
 */
export function applyTag(actor: Actor, tagName: string, tick: number): boolean {
  // Don't apply the same tag twice
  if (actor.semanticTags.find(t => t.name === tagName)) return false;

  const definition = getTagDefinition(tagName);
  if (!definition) return false;

  const parameterDeltas: ParameterDelta[] = definition.parameterDeltas.map(delta => {
    // Store the current value before applying delta
    const currentValue = getCurrentParameterValue(actor, delta.behaviorId, delta.parameterName);
    return {
      ...delta,
      preTagValue: currentValue,
    };
  });

  const tag: SemanticTag = {
    name: tagName,
    parameterDeltas,
    priority: definition.priority,
    appliedAt: tick,
  };

  actor.semanticTags.push(tag);

  // Apply the deltas
  for (const delta of parameterDeltas) {
    applyParameterDelta(actor, delta);
  }

  return true;
}

/**
 * Remove a semantic tag from an actor.
 * Property 16: all affected parameters restore to exact pre-tag baseline values.
 */
export function removeTag(actor: Actor, tagName: string): boolean {
  const tagIndex = actor.semanticTags.findIndex(t => t.name === tagName);
  if (tagIndex === -1) return false;

  const tag = actor.semanticTags[tagIndex];

  // Restore all parameters to their pre-tag values
  for (const delta of tag.parameterDeltas) {
    setParameterValue(actor, delta.behaviorId, delta.parameterName, delta.preTagValue);
  }

  actor.semanticTags.splice(tagIndex, 1);
  return true;
}

/**
 * Get all active tags on an actor, sorted by priority (highest first).
 */
export function getActiveTags(actor: Actor): SemanticTag[] {
  return [...actor.semanticTags].sort((a, b) => b.priority - a.priority);
}

// ============================================================
// Internal helpers
// ============================================================

function getCurrentParameterValue(actor: Actor, behaviorId: string, parameterName: string): number {
  // Look through behavior layers for the matching parameter
  const layers = [
    actor.behaviorLayers.layer1_locomotion,
    actor.behaviorLayers.layer2_emotion,
    actor.behaviorLayers.layer3_gesture,
    actor.behaviorLayers.layer4_micro,
  ];

  for (const layer of layers) {
    const behavior = layer.behaviors.find(b => b.behaviorId === behaviorId);
    if (behavior) {
      // For now, return a default value based on the parameter name
      // In the full implementation, this would read from the MotionBehavior parameter map
      switch (parameterName) {
        case 'blendWeight': return behavior.blendWeight;
        case 'breathRate': return actor.idleParams.breathRate;
        case 'fidgetProbability': return actor.idleParams.fidgetProbability;
        case 'swayAmplitude': return actor.idleParams.swayAmplitude;
        case 'swayFrequency': return actor.idleParams.swayFrequency;
        default: return 0;
      }
    }
  }

  // Check idle params directly
  switch (parameterName) {
    case 'breathRate': return actor.idleParams.breathRate;
    case 'fidgetProbability': return actor.idleParams.fidgetProbability;
    case 'swayAmplitude': return actor.idleParams.swayAmplitude;
    case 'swayFrequency': return actor.idleParams.swayFrequency;
    case 'breathAmplitude': return actor.idleParams.breathAmplitude;
    default: return 0;
  }
}

function applyParameterDelta(actor: Actor, delta: ParameterDelta): void {
  if (typeof delta.delta === 'number') {
    const current = getCurrentParameterValue(actor, delta.behaviorId, delta.parameterName);
    setParameterValue(actor, delta.behaviorId, delta.parameterName, current + delta.delta);
  }
}

function setParameterValue(actor: Actor, behaviorId: string, parameterName: string, value: number | string): void {
  if (typeof value !== 'number') return;

  // Apply to idle params
  const idleKey = parameterName as keyof typeof actor.idleParams;
  if (idleKey in actor.idleParams) {
    (actor.idleParams as any)[idleKey] = Math.max(0, value);
  }

  // Apply to behavior blend weights
  const layers = [
    actor.behaviorLayers.layer1_locomotion,
    actor.behaviorLayers.layer2_emotion,
    actor.behaviorLayers.layer3_gesture,
    actor.behaviorLayers.layer4_micro,
  ];
  for (const layer of layers) {
    const behavior = layer.behaviors.find(b => b.behaviorId === behaviorId);
    if (behavior && parameterName === 'blendWeight') {
      behavior.blendWeight = Math.max(0, Math.min(1, value));
    }
  }
}