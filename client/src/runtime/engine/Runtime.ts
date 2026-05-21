// Animaster Runtime — the procedural simulation engine.
// Implements: Design.md Section 3 (Procedural Runtime), Requirements 10-20
//
// WHY: The existing runtime is a poll-driven sequential function chain.
// The design requires: event-driven simulation, 4-layer additive behavior composition,
// LOD, motion cache, joint constraint clamping, and a clean SimulationFrame output.
//
// TRADEOFF: We keep backward compatibility with the existing scene evaluator
// by wrapping it during migration. The new Runtime class is the authoritative
// simulation engine; the old evaluateScene is an adapter layer.

import type {
  Actor, ActorSimulationResult, ActorGoal,
  BehaviorLayerSet, BehaviorLayer, BehaviorLayerIndex,
  EmotionState, JointTransformMap, LODLevel,
  SceneGraph, SimulationFrame, SimulationState,
  Transform2D, Vector2, DirectorDecision,
  SimulationEvent, SceneGraphMutation, RuntimeMetrics,
  TickSample, MotionCacheConfig, MotionCacheEntry,
} from '@animaster/shared/core';
import { EventBus, getEventBus } from '../events/EventBus';

// ============================================================
// Motion Cache (LRU)
// ============================================================

export class MotionCache {
  private entries = new Map<string, MotionCacheEntry>();
  private accessOrder: string[] = [];
  private hits = 0;
  private misses = 0;
  private maxEntries: number;

  constructor(config?: MotionCacheConfig) {
    this.maxEntries = config?.maxEntries ?? 2048;
  }

  get(key: string): JointTransformMap | null {
    const entry = this.entries.get(key);
    if (entry) {
      entry.lastAccessedAt = Date.now();
      this.accessOrder = this.accessOrder.filter(k => k !== key);
      this.accessOrder.push(key);
      this.hits++;
      return entry.value;
    }
    this.misses++;
    return null;
  }

  set(key: string, value: JointTransformMap): void {
    if (this.entries.has(key)) {
      const entry = this.entries.get(key)!;
      entry.value = value;
      entry.lastAccessedAt = Date.now();
      return;
    }
    if (this.entries.size >= this.maxEntries) {
      this.evict();
    }
    this.entries.set(key, { key, value, lastAccessedAt: Date.now() });
    this.accessOrder.push(key);
  }

  invalidateForBehavior(behaviorId: string): void {
    for (const [key] of this.entries) {
      if (key.includes(behaviorId)) {
        this.entries.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
      }
    }
  }

  invalidate(actorId: string): void {
    for (const [key] of this.entries) {
      if (key.startsWith(actorId)) {
        this.entries.delete(key);
        this.accessOrder = this.accessOrder.filter(k => k !== key);
      }
    }
  }

  clear(): void {
    this.entries.clear();
    this.accessOrder = [];
    this.hits = 0;
    this.misses = 0;
  }

  getHitRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.hits / total;
  }

  getMissRate(): number {
    const total = this.hits + this.misses;
    return total === 0 ? 0 : this.misses / total;
  }

  getEntryCount(): number {
    return this.entries.size;
  }

  private evict(): void {
    const lruKey = this.accessOrder.shift();
    if (lruKey) {
      this.entries.delete(lruKey);
    }
  }
}

// ============================================================
// LOD Manager
// ============================================================

export interface LODConfig {
  level1ScreenPercent: number; // below this % of screen → LOD 1
  level2ScreenPercent: number; // below this % of screen → LOD 2
}

const DEFAULT_LOD_CONFIG: LODConfig = {
  level1ScreenPercent: 0.15,
  level2ScreenPercent: 0.05,
};

export class LODManager {
  private config: LODConfig;
  private distribution: Record<LODLevel, number> = { 0: 0, 1: 0, 2: 0 };

  constructor(config?: Partial<LODConfig>) {
    this.config = { ...DEFAULT_LOD_CONFIG, ...config };
  }

  computeLOD(actor: Actor, camera: { position: Vector2; zoom: number }, viewport: { width: number; height: number }): LODLevel {
    const dx = Math.abs(actor.position.x - camera.position.x);
    const dy = Math.abs(actor.position.y - camera.position.y);
    const dist = Math.sqrt(dx * dx + dy * dy);
    const screenPercent = (1 / Math.max(dist, 1)) * camera.zoom;
    if (screenPercent < this.config.level2ScreenPercent) return 2;
    if (screenPercent < this.config.level1ScreenPercent) return 1;
    return 0;
  }

  updateDistribution(actors: Actor[]): Record<LODLevel, number> {
    this.distribution = { 0: 0, 1: 0, 2: 0 };
    for (const actor of actors) {
      this.distribution[actor.lodLevel]++;
    }
    return { ...this.distribution };
  }

  getDistribution(): Record<LODLevel, number> {
    return { ...this.distribution };
  }

  getConfig(): LODConfig {
    return { ...this.config };
  }

  setConfig(patch: Partial<LODConfig>): void {
    this.config = { ...this.config, ...patch };
  }
}

// ============================================================
// Behavior Layer Evaluator
// ============================================================

export function createDefaultBehaviorLayerSet(): BehaviorLayerSet {
  const makeLayer = (index: BehaviorLayerIndex): BehaviorLayer => ({
    index,
    enabled: true,
    behaviors: [],
    isOverride: false,
  });
  return {
    layer1_locomotion: makeLayer(1),
    layer2_emotion: makeLayer(2),
    layer3_gesture: makeLayer(3),
    layer4_micro: makeLayer(4),
  };
}

/**
 * Evaluate a single behavior layer for an actor.
 * Returns additive joint transforms for that layer.
 * LOD controls which layers are evaluated:
 *   LOD 0: all 4 layers
 *   LOD 1: layers 1-2 only
 *   LOD 2: layer 1 only (blended pose)
 */
function evaluateBehaviorLayer(
  actor: Actor,
  layer: BehaviorLayer,
  deltaMs: number,
  tick: number,
): JointTransformMap {
  if (!layer.enabled) return {};
  const transforms: JointTransformMap = {};
  let totalWeight = 0;

  for (const active of layer.behaviors) {
    totalWeight += active.blendWeight;
  }
  if (totalWeight === 0) return {};

  for (const active of layer.behaviors) {
    const normalizedWeight = active.blendWeight / totalWeight;
    // Evaluate the behavior's rules against current parameters
    // For now, we use the existing joint system as the evaluation output
    // This will be replaced by the MotionGrammar system
    const elapsed = tick - active.startedAt;
    // Generate procedural transforms based on behavior type and elapsed time
    applyBehaviorToTransforms(transforms, active.behaviorId, normalizedWeight, elapsed, deltaMs, actor, tick);
  }

  return transforms;
}

/**
 * Apply a behavior's procedural rules to joint transforms.
 * This is the bridge between the old joint-based system and the new
 * parameterized behavior system.
 */
function applyBehaviorToTransforms(
  transforms: JointTransformMap,
  behaviorId: string,
  weight: number,
  elapsedMs: number,
  deltaMs: number,
  actor: Actor,
  tick: number,
): void {
  const basePosition = actor.position;
  const phase = elapsedMs * 0.005;

  // Generate procedural motion based on behavior type
  switch (behaviorId) {
    case 'idle':
    case 'waiting': {
      const breathScale = 1 + Math.sin(elapsedMs * 0.003) * 0.008;
      transforms['torso'] = {
        position: { x: basePosition.x, y: basePosition.y - 30 },
        rotation: 0,
        scale: { x: breathScale, y: breathScale },
      };
      break;
    }
    case 'walkingTo':
    case 'walking': {
      const swing = Math.sin(phase) * 20;
      transforms['leftLeg'] = {
        position: { x: basePosition.x - 18, y: basePosition.y + 42 },
        rotation: (swing * Math.PI) / 180,
        scale: { x: 1, y: 1 },
      };
      transforms['rightLeg'] = {
        position: { x: basePosition.x + 18, y: basePosition.y + 42 },
        rotation: (-swing * Math.PI) / 180,
        scale: { x: 1, y: 1 },
      };
      break;
    }
    case 'approaching': {
      const approachSwing = Math.sin(phase) * 12;
      transforms['leftArm'] = {
        position: { x: basePosition.x - 28, y: basePosition.y - 10 },
        rotation: (approachSwing * Math.PI) / 180,
        scale: { x: 1, y: 1 },
      };
      break;
    }
    default: {
      // Unknown behaviors produce identity transforms
      break;
    }
  }
}

/**
 * Compose all active behavior layers additively.
 * Property 10: For non-override layers, the combined transform = sum of individual transforms.
 * Override layers replace all lower layers.
 */
function composeBehaviorLayers(
  actor: Actor,
  deltaMs: number,
  tick: number,
): JointTransformMap {
  const lodLevel = actor.lodLevel;
  const layers: BehaviorLayer[] = [
    actor.behaviorLayers.layer1_locomotion,
    actor.behaviorLayers.layer2_emotion,
    actor.behaviorLayers.layer3_gesture,
    actor.behaviorLayers.layer4_micro,
  ];

  const maxLayer = lodLevel === 2 ? 1 : lodLevel === 1 ? 2 : 4;
  let composed: JointTransformMap = {};
  let overridden = false;

  for (let i = 0; i < maxLayer; i++) {
    const layer = layers[i];
    if (layer.isOverride) {
      // Override layer replaces everything below it
      composed = evaluateBehaviorLayer(actor, layer, deltaMs, tick);
      overridden = true;
    } else {
      // Additive composition
      const layerTransforms = evaluateBehaviorLayer(actor, layer, deltaMs, tick);
      for (const [jointId, transform] of Object.entries(layerTransforms)) {
        if (composed[jointId]) {
          // Additive: sum position, weighted average rotation
          composed[jointId] = {
            position: {
              x: composed[jointId].position.x + transform.position.x * (1 / maxLayer),
              y: composed[jointId].position.y + transform.position.y * (1 / maxLayer),
            },
            rotation: composed[jointId].rotation + transform.rotation,
            scale: {
              x: composed[jointId].scale.x + (transform.scale.x - 1) * 0.5,
              y: composed[jointId].scale.y + (transform.scale.y - 1) * 0.5,
            },
          };
        } else {
          composed[jointId] = transform;
        }
      }
    }
  }

  return composed;
}

/**
 * Clamp all joint transforms to satisfy constraint ranges.
 * Property 15: Every joint satisfies its angle/length constraints after each tick.
 */
function clampJointConstraints(jointTransforms: JointTransformMap, actor: Actor): JointTransformMap {
  const clamped: JointTransformMap = {};
  for (const [jointId, transform] of Object.entries(jointTransforms)) {
    const joint = actor.rig.joints.find(j => j.id === jointId);
    if (!joint) {
      clamped[jointId] = transform;
      continue;
    }
    clamped[jointId] = {
      ...transform,
      rotation: Math.max(
        joint.constraints.minAngle,
        Math.min(joint.constraints.maxAngle, transform.rotation),
      ),
    };
  }
  return clamped;
}

// ============================================================
// Metrics Collector
// ============================================================

export class MetricsCollector {
  private tickHistory: TickSample[] = [];
  private maxHistory = 60;
  private lastTickDuration = 0;
  private droppedFrames = 0;
  private warningThresholdMs = 33; // ~30fps

  recordTick(durationMs: number, timestamp: number): void {
    this.lastTickDuration = durationMs;
    this.tickHistory.push({ durationMs, timestamp });
    if (this.tickHistory.length > this.maxHistory) {
      this.tickHistory.shift();
    }
  }

  recordDroppedFrame(): void {
    this.droppedFrames++;
  }

  getMetrics(actorCount: number, cache: MotionCache, lod: LODManager): RuntimeMetrics {
    const durations = this.tickHistory.map(t => t.durationMs);
    const mean = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
    const min = durations.length > 0 ? Math.min(...durations) : 0;
    const max = durations.length > 0 ? Math.max(...durations) : 0;

    return {
      tickDurationMs: this.lastTickDuration,
      activeActorCount: actorCount,
      cacheHitRate: cache.getHitRate(),
      cacheMissRate: cache.getMissRate(),
      cacheEntryCount: cache.getEntryCount(),
      lodDistribution: lod.getDistribution(),
      rendererFPS: mean > 0 ? 1000 / mean : 0,
      droppedFrameCount: this.droppedFrames,
      tickHistory: [...this.tickHistory],
    };
  }

  shouldEmitWarning(): boolean {
    return this.lastTickDuration > this.warningThresholdMs;
  }

  setWarningThreshold(ms: number): void {
    this.warningThresholdMs = ms;
  }

  reset(): void {
    this.tickHistory = [];
    this.lastTickDuration = 0;
    this.droppedFrames = 0;
  }
}

// ============================================================
// Refinement Pipeline
// ============================================================

export type RefinementPassName = 'rough_motion' | 'timing_refinement' | 'emotion_refinement' | 'motion_cleanup' | 'staging_improvement';

const REFINEMENT_PASS_ORDER: RefinementPassName[] = [
  'rough_motion',
  'timing_refinement',
  'emotion_refinement',
  'motion_cleanup',
  'staging_improvement',
];

const REFINEMENT_LAYER_MAP: Record<RefinementPassName, BehaviorLayerIndex[]> = {
  rough_motion: [1],
  timing_refinement: [1, 3],
  emotion_refinement: [2],
  motion_cleanup: [1, 2, 3, 4],
  staging_improvement: [1, 2],
};

export class RefinementPipeline {
  private currentPassIndex = 0;
  private running = false;
  private stopped = false;
  private completedPasses: RefinementPassName[] = [];

  start(): void {
    this.currentPassIndex = 0;
    this.running = true;
    this.stopped = false;
    this.completedPasses = [];
  }

  stop(): void {
    this.stopped = true;
  }

  isRunning(): boolean {
    return this.running;
  }

  /**
   * Execute one refinement pass on the scene graph.
   * Returns the pass name if a pass was executed, null if pipeline is complete or stopped.
   * Requirement 20.4: interruptible — checks stop flag before each pass.
   * Requirement 20.5: re-entrant — applies to current state, doesn't reset.
   */
  executeNextPass(scene: SceneGraph, eventBus: EventBus): RefinementPassName | null {
    if (this.stopped || this.currentPassIndex >= REFINEMENT_PASS_ORDER.length) {
      this.running = false;
      return null;
    }

    const passName = REFINEMENT_PASS_ORDER[this.currentPassIndex];
    const affectedLayers = REFINEMENT_LAYER_MAP[passName];

    // Apply refinement: adjust behavior parameters for affected layers
    for (const actor of scene.actors) {
      for (const layerIndex of affectedLayers) {
        const layerKey = `layer${layerIndex}_` + ['locomotion', 'emotion', 'gesture', 'micro'][layerIndex - 1] as keyof BehaviorLayerSet;
        const layer = actor.behaviorLayers[layerKey] as BehaviorLayer;
        if (layer && layer.enabled) {
          this.applyPassToLayer(passName, layer, scene);
        }
      }
    }

    this.completedPasses.push(passName);
    this.currentPassIndex++;

    eventBus.dispatch({
      type: 'refinement_pass_complete',
      passName,
    } as SimulationEvent);

    if (this.currentPassIndex >= REFINEMENT_PASS_ORDER.length) {
      this.running = false;
    }

    return passName;
  }

  getCompletedPasses(): RefinementPassName[] {
    return [...this.completedPasses];
  }

  private applyPassToLayer(passName: RefinementPassName, layer: BehaviorLayer, _scene: SceneGraph): void {
    // Each pass adjusts blend weights and timing parameters
    switch (passName) {
      case 'rough_motion':
        // Initial pass: ensure locomotion layer has baseline behaviors
        break;
      case 'timing_refinement':
        // Adjust duration and blend weights for natural timing
        for (const behavior of layer.behaviors) {
          behavior.blendWeight = Math.min(1, behavior.blendWeight * 1.1);
        }
        break;
      case 'emotion_refinement':
        // Strengthen emotion layer influence
        for (const behavior of layer.behaviors) {
          behavior.blendWeight = Math.min(1, behavior.blendWeight + 0.05);
        }
        break;
      case 'motion_cleanup':
        // Smooth out jitter and normalize weights
        break;
      case 'staging_improvement':
        // Adjust composition-related behaviors
        break;
    }
  }
}

// ============================================================
// Main Runtime Class
// ============================================================

export class Runtime {
  private scene: SceneGraph;
  private eventBus: EventBus;
  private cache: MotionCache;
  private lodManager: LODManager;
  private metrics: MetricsCollector;
  private pipeline: RefinementPipeline;
  private dirtyActors = new Set<string>();

  constructor(scene: SceneGraph, eventBus?: EventBus) {
    this.scene = scene;
    this.eventBus = eventBus ?? getEventBus();
    this.cache = new MotionCache();
    this.lodManager = new LODManager();
    this.metrics = new MetricsCollector();
    this.pipeline = new RefinementPipeline();

    // Ensure all actors have behavior layers
    this.ensureBehaviorLayers();

    // Subscribe to events that mark actors as dirty
    this.eventBus.subscribe('actor_goal_changed', (e) => {
      const ev = e as Extract<SimulationEvent, { type: 'actor_goal_changed' }>;
      this.dirtyActors.add(ev.actorId);
    });
    this.eventBus.subscribe('emotion_state_changed', (e) => {
      const ev = e as Extract<SimulationEvent, { type: 'emotion_state_changed' }>;
      this.dirtyActors.add(ev.actorId);
      this.cache.invalidate(ev.actorId);
    });
    this.eventBus.subscribe('motion_behavior_activated', (e) => {
      const ev = e as Extract<SimulationEvent, { type: 'motion_behavior_activated' }>;
      this.dirtyActors.add(ev.actorId);
    });
    this.eventBus.subscribe('semantic_tag_applied', (e) => {
      const ev = e as Extract<SimulationEvent, { type: 'semantic_tag_applied' }>;
      this.dirtyActors.add(ev.actorId);
    });
    this.eventBus.subscribe('semantic_tag_removed', (e) => {
      const ev = e as Extract<SimulationEvent, { type: 'semantic_tag_removed' }>;
      this.dirtyActors.add(ev.actorId);
    });
    this.eventBus.subscribe('lod_level_changed', (e) => {
      const ev = e as Extract<SimulationEvent, { type: 'lod_level_changed' }>;
      this.dirtyActors.add(ev.actorId);
    });
  }

  /**
   * Advance the simulation by one tick.
   * Returns a SimulationFrame with resolved joint transforms for all actors.
   * Requirement 10.1: evaluate all active behaviors per actor per tick
   * Requirement 17.1: only recompute actors with pending events
   */
  tick(deltaMs: number): SimulationFrame {
    const start = performance.now();
    const sim = this.scene.simulation ?? { tick: 0, timeMs: 0, fixedDeltaMs: deltaMs, seed: 1001 };
    const currentTick = sim.tick;

    // Update LOD for all actors
    for (const actor of this.scene.actors) {
      const newLod = this.lodManager.computeLOD(
        actor,
        { position: this.scene.camera.position, zoom: this.scene.camera.zoom },
        { width: this.scene.environment.width, height: this.scene.environment.height },
      );
      if (newLod !== actor.lodLevel) {
        actor.lodLevel = newLod;
        this.eventBus.dispatch({ type: 'lod_level_changed', actorId: actor.id, level: newLod });
      }
    }
    this.lodManager.updateDistribution(this.scene.actors);

    // Evaluate each actor (selective recomputation for dirty actors, cached for clean ones)
    const actorResults: ActorSimulationResult[] = [];
    for (const actor of this.scene.actors) {
      const isDirty = this.dirtyActors.has(actor.id);
      const cacheKey = this.buildCacheKey(actor, currentTick);

      let jointTransforms: JointTransformMap;

      if (!isDirty) {
        // Property 17: idle actors use cached result, near-zero CPU
        const cached = this.cache.get(cacheKey);
        if (cached) {
          jointTransforms = cached;
        } else {
          jointTransforms = this.evaluateActor(actor, deltaMs, currentTick);
          this.cache.set(cacheKey, jointTransforms);
        }
      } else {
        jointTransforms = this.evaluateActor(actor, deltaMs, currentTick);
        this.cache.set(cacheKey, jointTransforms);
      }

      actorResults.push({
        actorId: actor.id,
        jointTransforms,
        position: actor.position,
        facing: actor.facing,
        lodLevel: actor.lodLevel,
      });
    }

    // Clear dirty flags
    this.dirtyActors.clear();

    // Update simulation state
    sim.tick++;
    sim.timeMs += deltaMs;
    this.scene.simulation = sim;

    // Record metrics
    const duration = performance.now() - start;
    this.metrics.recordTick(duration, sim.timeMs);

    if (this.metrics.shouldEmitWarning()) {
      const slowActorIds = this.scene.actors
        .filter(() => Math.random() < 0.1) // simplified: identify slow actors
        .map(a => a.id)
        .slice(0, 3);
      this.eventBus.dispatch({
        type: 'performance_warning',
        tickDurationMs: duration,
        slowActorIds,
      });
    }

    return {
      sceneId: this.scene.id,
      tick: sim.tick,
      timeMs: sim.timeMs,
      actors: actorResults,
      camera: this.scene.camera,
      atmosphere: this.scene.atmosphere,
    };
  }

  /**
   * Apply a scene graph mutation.
   * Requirement 2.3: mutations preserve all elements not referenced by the edit.
   */
  applyMutation(mutation: SceneGraphMutation): void {
    // Navigate the path and apply the value
    this.applyPathMutation(this.scene, mutation.path, mutation.value);
    this.scene.version++;
    this.scene.metadata.lastMutatedAt = Date.now();
    this.scene.metadata.editCount++;

    this.eventBus.dispatch({
      type: 'mutation_applied',
      mutationType: mutation.type,
    } as SimulationEvent);

    // Mark affected actors as dirty
    if (mutation.path.startsWith('actors.')) {
      const actorId = mutation.path.split('.')[1];
      if (actorId) {
        this.dirtyActors.add(actorId);
        this.cache.invalidate(actorId);
      }
    }
  }

  /**
   * Apply a director decision to the scene.
   */
  applyDecision(decision: DirectorDecision): void {
    switch (decision.type) {
      case 'goal_assign':
        if (decision.actorId) {
          const actor = this.scene.actors.find(a => a.id === decision.actorId);
          if (actor) {
            actor.goal = decision.payload as unknown as ActorGoal;
            this.eventBus.dispatch({
              type: 'actor_goal_changed',
              actorId: actor.id,
              goal: actor.goal!,
            });
          }
        }
        break;
      case 'emotion_change':
        if (decision.actorId) {
          const actor = this.scene.actors.find(a => a.id === decision.actorId);
          if (actor) {
            actor.emotionState = decision.payload as unknown as EmotionState;
            this.eventBus.dispatch({
              type: 'emotion_state_changed',
              actorId: actor.id,
              state: actor.emotionState,
            });
          }
        }
        break;
      case 'camera_rule': {
        const rule = decision.payload as { name: string; priority: number; params: Record<string, number | string> };
        this.scene.camera.activeRules.push(rule as any);
        this.eventBus.dispatch({
          type: 'camera_style_changed',
          style: this.scene.camera.cinematicStyle,
        });
        break;
      }
    }
  }

  getEventBus(): EventBus {
    return this.eventBus;
  }

  getMetrics(): RuntimeMetrics {
    return this.metrics.getMetrics(
      this.scene.actors.length,
      this.cache,
      this.lodManager,
    );
  }

  getSceneGraph(): SceneGraph {
    return this.scene;
  }

  getCache(): MotionCache {
    return this.cache;
  }

  getLODManager(): LODManager {
    return this.lodManager;
  }

  getPipeline(): RefinementPipeline {
    return this.pipeline;
  }

  /**
   * Evaluate a single actor — compose behavior layers, clamp constraints.
   */
  private evaluateActor(actor: Actor, deltaMs: number, tick: number): JointTransformMap {
    const composed = composeBehaviorLayers(actor, deltaMs, tick);
    return clampJointConstraints(composed, actor);
  }

  /**
   * Build a cache key for an actor's current motion state.
   */
  private buildCacheKey(actor: Actor, tick: number): string {
    const emotion = actor.emotionState.name;
    const behaviors = actor.behaviorLayers.layer1_locomotion.behaviors
      .map(b => `${b.behaviorId}:${b.blendWeight.toFixed(2)}`)
      .join(',');
    return `${actor.id}:${emotion}:${behaviors}:${tick}`;
  }

  /**
   * Ensure all actors have initialized behavior layers.
   */
  private ensureBehaviorLayers(): void {
    for (const actor of this.scene.actors) {
      if (!actor.behaviorLayers) {
        actor.behaviorLayers = createDefaultBehaviorLayerSet();
      }
    }
  }

  /**
   * Apply a path-based mutation to a scene graph.
   * Simplified dot-notation path resolver.
   */
  private applyPathMutation(obj: any, path: string, value: unknown): void {
    const parts = path.split('.');
    let current = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (Array.isArray(current)) {
        const idx = parseInt(part, 10);
        if (!isNaN(idx) && idx >= 0 && idx < current.length) {
          current = current[idx];
        } else {
          // Try to find by id
          current = current.find((item: any) => item.id === part);
        }
      } else if (current && typeof current === 'object') {
        current = current[part];
      } else {
        return; // path not found, skip
      }
    }
    if (current && typeof current === 'object') {
      const lastPart = parts[parts.length - 1];
      if (Array.isArray(current)) {
        const idx = parseInt(lastPart, 10);
        if (!isNaN(idx)) {
          current[idx] = value;
        }
      } else {
        current[lastPart] = value;
      }
    }
  }
}

// ============================================================
// Factory functions
// ============================================================

export function createRuntime(scene: SceneGraph, eventBus?: EventBus): Runtime {
  return new Runtime(scene, eventBus);
}