/**
 * Atmosphere Manager — orchestrates multiple particle systems
 * based on Animaster's semantic scene state.
 */
import * as THREE from 'three';
import { ParticleEmitter, createParticleSystem, type ParticleType } from './ParticleSystem';

export class AtmosphereManager {
  private emitters: Map<string, ParticleEmitter> = new Map();
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  addEffect(id: string, type: ParticleType): ParticleEmitter {
    if (this.emitters.has(id)) {
      this.removeEffect(id);
    }
    const emitter = createParticleSystem(type);
    this.emitters.set(id, emitter);
    this.group.add(emitter.getObject());
    return emitter;
  }

  removeEffect(id: string): void {
    const emitter = this.emitters.get(id);
    if (emitter) {
      this.group.remove(emitter.getObject());
      emitter.dispose();
      this.emitters.delete(id);
    }
  }

  hasEffect(id: string): boolean {
    return this.emitters.has(id);
  }

  update(deltaSeconds: number): void {
    for (const emitter of this.emitters.values()) {
      emitter.update(deltaSeconds);
    }
  }

  applyAtmosphereEffects(effects: string[]): void {
    const activeIds = new Set(effects);

    for (const [id] of this.emitters) {
      if (!activeIds.has(id)) {
        this.removeEffect(id);
      }
    }

    for (const effect of effects) {
      if (!this.emitters.has(effect) && isParticleType(effect)) {
        this.addEffect(effect, effect);
      }
    }
  }

  clearAll(): void {
    for (const [id] of this.emitters) {
      this.removeEffect(id);
    }
  }

  dispose(): void {
    this.clearAll();
  }
}

function isParticleType(s: string): s is ParticleType {
  return ['rain', 'snow', 'dust', 'embers', 'smoke', 'fog', 'wind'].includes(s);
}
