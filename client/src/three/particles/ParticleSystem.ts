/**
 * GPU-friendly particle system for atmosphere effects.
 * Rain, snow, dust, embers, smoke — all driven by semantic tone.
 */
import * as THREE from 'three';

export type ParticleType = 'rain' | 'snow' | 'dust' | 'embers' | 'smoke' | 'fog' | 'wind';

interface ParticleConfig {
  count: number;
  size: number;
  color: number;
  opacity: number;
  velocity: THREE.Vector3;
  spread: THREE.Vector3;
  lifetime: number;
  gravity: number;
  turbulence: number;
  fadeIn: number;
  fadeOut: number;
}

const PARTICLE_PRESETS: Record<ParticleType, ParticleConfig> = {
  rain: {
    count: 500, size: 0.02, color: 0x8899cc, opacity: 0.4,
    velocity: new THREE.Vector3(0, -8, 0), spread: new THREE.Vector3(15, 10, 5),
    lifetime: 2.0, gravity: 0, turbulence: 0.1, fadeIn: 0.1, fadeOut: 0.1,
  },
  snow: {
    count: 200, size: 0.04, color: 0xeeeeff, opacity: 0.6,
    velocity: new THREE.Vector3(0, -0.8, 0), spread: new THREE.Vector3(12, 8, 4),
    lifetime: 8.0, gravity: 0, turbulence: 0.5, fadeIn: 0.3, fadeOut: 0.5,
  },
  dust: {
    count: 80, size: 0.015, color: 0xaa9977, opacity: 0.25,
    velocity: new THREE.Vector3(0.1, 0.02, 0), spread: new THREE.Vector3(8, 4, 3),
    lifetime: 12.0, gravity: 0, turbulence: 0.8, fadeIn: 1.0, fadeOut: 2.0,
  },
  embers: {
    count: 40, size: 0.03, color: 0xff6622, opacity: 0.7,
    velocity: new THREE.Vector3(0, 1.2, 0), spread: new THREE.Vector3(4, 3, 2),
    lifetime: 4.0, gravity: -0.1, turbulence: 0.6, fadeIn: 0.2, fadeOut: 1.0,
  },
  smoke: {
    count: 30, size: 0.15, color: 0x444444, opacity: 0.15,
    velocity: new THREE.Vector3(0, 0.3, 0), spread: new THREE.Vector3(3, 5, 2),
    lifetime: 10.0, gravity: -0.02, turbulence: 0.3, fadeIn: 1.0, fadeOut: 3.0,
  },
  fog: {
    count: 20, size: 0.5, color: 0x667788, opacity: 0.08,
    velocity: new THREE.Vector3(0.05, 0, 0), spread: new THREE.Vector3(20, 2, 5),
    lifetime: 20.0, gravity: 0, turbulence: 0.1, fadeIn: 3.0, fadeOut: 5.0,
  },
  wind: {
    count: 60, size: 0.01, color: 0xcccccc, opacity: 0.15,
    velocity: new THREE.Vector3(2, 0, 0), spread: new THREE.Vector3(15, 5, 3),
    lifetime: 3.0, gravity: 0, turbulence: 0.4, fadeIn: 0.2, fadeOut: 0.5,
  },
};

export class ParticleEmitter {
  private geometry: THREE.BufferGeometry;
  private material: THREE.PointsMaterial;
  private points: THREE.Points;
  private positions: Float32Array;
  private velocities: Float32Array;
  private ages: Float32Array;
  private config: ParticleConfig;
  private elapsed = 0;

  constructor(type: ParticleType, overrides?: Partial<ParticleConfig>) {
    this.config = { ...PARTICLE_PRESETS[type], ...overrides };
    const count = this.config.count;

    this.positions = new Float32Array(count * 3);
    this.velocities = new Float32Array(count * 3);
    this.ages = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      this.resetParticle(i);
      this.ages[i] = Math.random() * this.config.lifetime;
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3));

    this.material = new THREE.PointsMaterial({
      color: this.config.color,
      size: this.config.size,
      transparent: true,
      opacity: this.config.opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    this.points = new THREE.Points(this.geometry, this.material);
  }

  private resetParticle(i: number): void {
    const s = this.config.spread;
    this.positions[i * 3] = (Math.random() - 0.5) * s.x;
    this.positions[i * 3 + 1] = (Math.random() - 0.5) * s.y;
    this.positions[i * 3 + 2] = (Math.random() - 0.5) * s.z;

    const v = this.config.velocity;
    const t = this.config.turbulence;
    this.velocities[i * 3] = v.x + (Math.random() - 0.5) * t;
    this.velocities[i * 3 + 1] = v.y + (Math.random() - 0.5) * t;
    this.velocities[i * 3 + 2] = v.z + (Math.random() - 0.5) * t;

    this.ages[i] = 0;
  }

  update(deltaSeconds: number): void {
    this.elapsed += deltaSeconds;
    const count = this.config.count;

    for (let i = 0; i < count; i++) {
      this.ages[i] += deltaSeconds;

      if (this.ages[i] >= this.config.lifetime) {
        this.resetParticle(i);
        continue;
      }

      this.positions[i * 3] += this.velocities[i * 3] * deltaSeconds;
      this.positions[i * 3 + 1] += (this.velocities[i * 3 + 1] + this.config.gravity) * deltaSeconds;
      this.positions[i * 3 + 2] += this.velocities[i * 3 + 2] * deltaSeconds;

      if (this.config.turbulence > 0) {
        this.positions[i * 3] += Math.sin(this.elapsed * 2 + i) * this.config.turbulence * 0.01;
      }
    }

    this.geometry.attributes.position.needsUpdate = true;
  }

  getObject(): THREE.Points {
    return this.points;
  }

  setOpacity(opacity: number): void {
    this.material.opacity = opacity;
  }

  dispose(): void {
    this.geometry.dispose();
    this.material.dispose();
  }
}

export function createParticleSystem(type: ParticleType, overrides?: Partial<ParticleConfig>): ParticleEmitter {
  return new ParticleEmitter(type, overrides);
}

export { PARTICLE_PRESETS };
