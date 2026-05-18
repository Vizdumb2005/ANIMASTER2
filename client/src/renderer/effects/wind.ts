import { Container, Graphics } from 'pixi.js';

interface WindParticle {
  x: number;
  y: number;
  speed: number;
  length: number;
  alpha: number;
}

let particles: WindParticle[] = [];
let initialized = false;

function initParticles(width: number, height: number): void {
  particles = [];
  for (let i = 0; i < 30; i++) {
    particles.push({
      x: Math.random() * width,
      y: Math.random() * height * 0.8,
      speed: 0.8 + Math.random() * 1.5,
      length: 15 + Math.random() * 25,
      alpha: 0.05 + Math.random() * 0.12
    });
  }
  initialized = true;
}

export function drawWind(layer: Container, width: number, height: number, deltaMs: number): void {
  if (!initialized) initParticles(width, height);

  const g = new Graphics();
  const dt = deltaMs / 16;

  for (const p of particles) {
    p.x += p.speed * dt;
    p.y += Math.sin(p.x * 0.01) * 0.3;
    if (p.x > width + p.length) {
      p.x = -p.length;
      p.y = Math.random() * height * 0.8;
    }
    g.moveTo(p.x, p.y);
    g.lineTo(p.x + p.length, p.y - 2);
    g.stroke({ color: 0xcccccc, width: 1, alpha: p.alpha });
  }

  layer.addChild(g);
}

export function resetWind(): void {
  initialized = false;
  particles = [];
}
