// Animaster Event Bus — the central nervous system of the runtime.
// Implements: Design.md Section 6 (Event Bus), Requirement 17 (Event-Driven Selective Recomputation)
//
// WHY: The design spec requires event-driven simulation. The EventBus enables:
// 1. Selective recomputation — only recompute actors that received events
// 2. Ordered dispatch — events process in dispatch order (Property 18)
// 3. Layer-specific invalidation — a layer-K event only invalidates layer K (Property 17)
// 4. Observability — all state changes flow through a single channel

import type { SimulationEvent } from '@animaster/shared/core';

export type EventHandler = (event: SimulationEvent) => void;
export type Unsubscribe = () => void;

export class EventBus {
  private handlers = new Map<string, Set<EventHandler>>();
  private queue: SimulationEvent[] = [];
  private processing = false;
  private dispatchCount = 0;

  dispatch(event: SimulationEvent): void {
    this.queue.push(event);
    this.dispatchCount++;
    if (!this.processing) {
      this.processQueue();
    }
  }

  subscribe(eventType: string, handler: EventHandler): Unsubscribe {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, new Set());
    }
    this.handlers.get(eventType)!.add(handler);
    return () => {
      const set = this.handlers.get(eventType);
      if (set) {
        set.delete(handler);
        if (set.size === 0) {
          this.handlers.delete(eventType);
        }
      }
    };
  }

  subscribeAll(handler: EventHandler): Unsubscribe {
    return this.subscribe('*', handler);
  }

  getQueue(): SimulationEvent[] {
    return [...this.queue];
  }

  getDispatchCount(): number {
    return this.dispatchCount;
  }

  hasPending(): boolean {
    return this.queue.length > 0;
  }

  clear(): void {
    this.queue = [];
  }

  reset(): void {
    this.queue = [];
    this.handlers.clear();
    this.processing = false;
    this.dispatchCount = 0;
  }

  private processQueue(): void {
    this.processing = true;
    let maxIterations = 1000;
    while (this.queue.length > 0 && maxIterations > 0) {
      const event = this.queue.shift()!;
      this.deliver(event);
      maxIterations--;
    }
    if (maxIterations <= 0 && this.queue.length > 0) {
      this.queue = [];
    }
    this.processing = false;
  }

  private deliver(event: SimulationEvent): void {
    const specific = this.handlers.get(event.type);
    if (specific) {
      for (const handler of specific) {
        try { handler(event); } catch { /* swallow handler errors */ }
      }
    }
    const wildcard = this.handlers.get('*');
    if (wildcard) {
      for (const handler of wildcard) {
        try { handler(event); } catch { /* swallow handler errors */ }
      }
    }
  }
}

let _instance: EventBus | null = null;

export function getEventBus(): EventBus {
  if (!_instance) {
    _instance = new EventBus();
  }
  return _instance;
}

export function resetEventBus(): void {
  if (_instance) {
    _instance.reset();
    _instance = null;
  }
}