import { Container, Graphics } from 'pixi.js';

// --- Task 215: Ember/Particle System ---

const EMBER_COUNT = 25;

interface Ember {
  x: number;
  y: number;
  radius: number;
  opacity: number;
  speedY: number;
  speedX: number;
  flickerPhase: number;
  flickerSpeed: number;
}

let embers: Ember[] = [];
let initialized = false;

function seededUnit(index: number, salt: number): number {
  const x = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return x - Math.floor(x);
}

function initEmbers(width: number, height: number): void {
  embers = [];
  for (let i = 0; i < EMBER_COUNT; i++) {
    embers.push({
      x: seededUnit(i, 1) * width,
      y: height * 0.3 + seededUnit(i, 2) * height * 0.7,
      radius: 1 + seededUnit(i, 3) * 1.5,
      opacity: 0.3 + seededUnit(i, 4) * 0.5,
      speedY: -(0.3 + seededUnit(i, 5) * 0.8),
      speedX: (seededUnit(i, 6) - 0.5) * 0.4,
      flickerPhase: seededUnit(i, 7) * Math.PI * 2,
      flickerSpeed: 0.005 + seededUnit(i, 8) * 0.008,
    });
  }
  initialized = true;
}

export function drawEmbers(layer: Container, width: number, height: number, deltaMs: number): void {
  if (!initialized) {
    initEmbers(width, height);
  }

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (let i = 0; i < embers.length; i++) {
    const ember = embers[i];
    ember.y += ember.speedY * dt;
    ember.x += ember.speedX * dt;
    ember.flickerPhase += ember.flickerSpeed * deltaMs;

    if (ember.y < -10) {
      ember.y = height + 10;
      ember.x = seededUnit(i, Math.floor(ember.x + ember.y) + 20) * width;
    }

    const flicker = 0.5 + Math.sin(ember.flickerPhase) * 0.5;
    const alpha = ember.opacity * flicker;

    // Orange-red core
    g.circle(ember.x, ember.y, ember.radius)
      .fill({ color: 0xdd6a2a, alpha });
    // Bright center
    g.circle(ember.x, ember.y, ember.radius * 0.5)
      .fill({ color: 0xffaa4a, alpha: alpha * 0.8 });
  }

  layer.addChild(g);
}

export function resetEmbers(): void {
  initialized = false;
  embers = [];
}
