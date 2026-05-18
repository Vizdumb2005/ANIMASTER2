import { Graphics } from 'pixi.js';
import type { SceneTone } from '@animaster/shared/scene';

// --- Task 217: Prop Registry System ---
// --- Task 218: Animated Props ---

export interface PropDefinition {
  id: string;
  label: string;
  width: number;
  height: number;
  emotionalAssociation: SceneTone[];
  draw: (g: Graphics, x: number, y: number, elapsedMs: number) => void;
}

const registry: PropDefinition[] = [];

function registerProp(def: PropDefinition): void {
  registry.push(def);
}

export function getPropsByTone(tone: SceneTone): PropDefinition[] {
  return registry.filter(p => p.emotionalAssociation.includes(tone));
}

export function getPropById(id: string): PropDefinition | undefined {
  return registry.find(p => p.id === id);
}

export function getAllProps(): PropDefinition[] {
  return [...registry];
}

// --- Prop Definitions ---

registerProp({
  id: 'vending_machine',
  label: 'Vending Machine',
  width: 40,
  height: 70,
  emotionalAssociation: ['lonely', 'awkward', 'neutral'],
  draw: (g, x, y, elapsedMs) => {
    // Body
    g.rect(x, y, 40, 70).fill({ color: 0x1a2030, alpha: 0.8 });
    g.rect(x + 2, y + 2, 36, 66).stroke({ color: 0x2a3040, width: 1, alpha: 0.5 });
    // Screen glow (flickering)
    const flicker = 0.5 + Math.sin(elapsedMs * 0.003) * 0.15 + Math.sin(elapsedMs * 0.007) * 0.1;
    g.rect(x + 5, y + 8, 30, 22).fill({ color: 0x3a6a8a, alpha: 0.3 * flicker });
    // Glow halo
    g.rect(x - 5, y + 5, 50, 28).fill({ color: 0x3a6a9a, alpha: 0.06 * flicker });
    // Product rows
    for (let row = 0; row < 3; row++) {
      g.rect(x + 8, y + 35 + row * 10, 24, 6).fill({ color: 0x14181e, alpha: 0.6 });
    }
  },
});

registerProp({
  id: 'neon_sign',
  label: 'Neon Sign',
  width: 60,
  height: 20,
  emotionalAssociation: ['lonely', 'tense', 'energetic'],
  draw: (g, x, y, elapsedMs) => {
    // Sign bracket
    g.rect(x + 25, y - 10, 3, 10).fill({ color: 0x2a2a30, alpha: 0.6 });
    // Neon tube glow — pulsing
    const pulse = 0.6 + Math.sin(elapsedMs * 0.002) * 0.2;
    const glitch = Math.sin(elapsedMs * 0.017) > 0.95 ? 0.1 : 1;
    const alpha = 0.35 * pulse * glitch;
    // Glow halo
    g.rect(x - 8, y - 5, 76, 30).fill({ color: 0xcc4466, alpha: alpha * 0.2 });
    // Neon tubes
    g.rect(x, y, 55, 3).fill({ color: 0xff4477, alpha });
    g.rect(x + 5, y + 8, 45, 3).fill({ color: 0xff4477, alpha: alpha * 0.8 });
  },
});

registerProp({
  id: 'bench',
  label: 'Park Bench',
  width: 60,
  height: 30,
  emotionalAssociation: ['lonely', 'sad', 'romantic'],
  draw: (g, x, y, _elapsedMs) => {
    // Seat
    g.rect(x, y, 60, 5).fill({ color: 0x3a2a1a, alpha: 0.7 });
    // Back
    g.rect(x + 2, y - 18, 56, 4).fill({ color: 0x3a2a1a, alpha: 0.6 });
    g.rect(x + 2, y - 10, 56, 3).fill({ color: 0x3a2a1a, alpha: 0.55 });
    // Legs
    g.rect(x + 5, y + 5, 3, 15).fill({ color: 0x2a1a0a, alpha: 0.6 });
    g.rect(x + 52, y + 5, 3, 15).fill({ color: 0x2a1a0a, alpha: 0.6 });
  },
});

registerProp({
  id: 'traffic_light',
  label: 'Traffic Light',
  width: 12,
  height: 90,
  emotionalAssociation: ['lonely', 'tense', 'neutral'],
  draw: (g, x, y, elapsedMs) => {
    // Pole
    g.rect(x + 4, y, 4, 90).fill({ color: 0x2a2a30, alpha: 0.6 });
    // Housing
    g.rect(x, y, 12, 30).fill({ color: 0x1a1a20, alpha: 0.7 });
    // Lights (cycle every 5 seconds)
    const cycle = Math.floor(elapsedMs / 5000) % 3;
    const colors = [0xcc3333, 0xccaa33, 0x33cc33];
    for (let i = 0; i < 3; i++) {
      const isActive = i === cycle;
      g.circle(x + 6, y + 5 + i * 9, 3.5)
        .fill({ color: colors[i], alpha: isActive ? 0.7 : 0.1 });
      if (isActive) {
        // Glow
        g.circle(x + 6, y + 5 + i * 9, 8)
          .fill({ color: colors[i], alpha: 0.08 });
      }
    }
  },
});

registerProp({
  id: 'antenna',
  label: 'Rooftop Antenna',
  width: 20,
  height: 50,
  emotionalAssociation: ['lonely', 'tense'],
  draw: (g, x, y, _elapsedMs) => {
    // Main mast
    g.rect(x + 9, y, 2, 50).fill({ color: 0x3a3a40, alpha: 0.5 });
    // Cross bars
    g.rect(x, y + 12, 20, 2).fill({ color: 0x3a3a40, alpha: 0.4 });
    g.rect(x + 3, y + 25, 14, 2).fill({ color: 0x3a3a40, alpha: 0.35 });
    // Dish
    g.circle(x + 10, y + 5, 5).fill({ color: 0x2a2a30, alpha: 0.4 });
  },
});

registerProp({
  id: 'hanging_wires',
  label: 'Hanging Wires',
  width: 120,
  height: 30,
  emotionalAssociation: ['tense', 'threatening'],
  draw: (g, x, y, elapsedMs) => {
    // Swaying wires
    const sway = Math.sin(elapsedMs * 0.001) * 5;
    for (let i = 0; i < 3; i++) {
      const wireY = y + i * 8;
      const midY = wireY + 12 + sway * (i * 0.3 + 0.5);
      g.moveTo(x, wireY);
      g.quadraticCurveTo(x + 60, midY, x + 120, wireY + 2);
      g.stroke({ color: 0x1a1a20, width: 1.5, alpha: 0.4 });
    }
  },
});

registerProp({
  id: 'puddle',
  label: 'Puddle',
  width: 50,
  height: 8,
  emotionalAssociation: ['lonely', 'sad'],
  draw: (g, x, y, elapsedMs) => {
    // Base puddle
    g.ellipse(x + 25, y + 4, 25, 4).fill({ color: 0x2a3a4a, alpha: 0.25 });
    // Ripples (animated)
    const ripplePhase = elapsedMs * 0.002;
    for (let i = 0; i < 2; i++) {
      const rippleR = 5 + ((ripplePhase + i * 2) % 4) * 5;
      const rippleAlpha = 0.15 * (1 - ((ripplePhase + i * 2) % 4) / 4);
      g.circle(x + 15 + i * 20, y + 4, rippleR)
        .stroke({ color: 0x4a5a6a, width: 0.8, alpha: rippleAlpha });
    }
  },
});

registerProp({
  id: 'cracked_window',
  label: 'Cracked Window',
  width: 50,
  height: 50,
  emotionalAssociation: ['tense', 'threatening', 'sad'],
  draw: (g, x, y, _elapsedMs) => {
    // Window frame
    g.rect(x, y, 50, 50).fill({ color: 0x0a1428, alpha: 0.4 });
    g.rect(x, y, 50, 50).stroke({ color: 0x2a2a30, width: 2, alpha: 0.5 });
    // Pane divider
    g.rect(x + 24, y, 2, 50).fill({ color: 0x2a2a30, alpha: 0.4 });
    g.rect(x, y + 24, 50, 2).fill({ color: 0x2a2a30, alpha: 0.4 });
    // Cracks
    g.moveTo(x + 15, y + 10);
    g.lineTo(x + 25, y + 25);
    g.lineTo(x + 35, y + 18);
    g.stroke({ color: 0x5a5a6a, width: 0.8, alpha: 0.4 });
    g.moveTo(x + 25, y + 25);
    g.lineTo(x + 20, y + 40);
    g.stroke({ color: 0x5a5a6a, width: 0.8, alpha: 0.35 });
  },
});

// --- Task 219: Tone-Driven Prop Selection ---

export interface PropPlacement {
  propId: string;
  x: number;
  y: number;
}

const ENV_PROP_POSITIONS: Record<string, PropPlacement[]> = {
  outdoor_street: [
    { propId: 'traffic_light', x: 850, y: 260 },
    { propId: 'puddle', x: 300, y: 425 },
    { propId: 'neon_sign', x: 600, y: 120 },
  ],
  rooftop: [
    { propId: 'antenna', x: 800, y: 180 },
    { propId: 'hanging_wires', x: 200, y: 100 },
  ],
  outdoor_park: [
    { propId: 'bench', x: 650, y: 400 },
  ],
  indoor_room: [
    { propId: 'cracked_window', x: 700, y: 80 },
  ],
  hallway: [
    { propId: 'vending_machine', x: 750, y: 210 },
  ],
  subway: [
    { propId: 'vending_machine', x: 650, y: 230 },
  ],
  apartment: [],
  hospital: [],
  outdoor_beach: [],
  outdoor_forest: [],
  staircase: [],
};

export function getPropsForScene(envType: string, tone: SceneTone): PropPlacement[] {
  const envProps = ENV_PROP_POSITIONS[envType] ?? [];
  const toneProps = getPropsByTone(tone);
  const toneIds = new Set(toneProps.map(p => p.id));

  // Filter env props to those matching the tone (keep all if no tone match)
  const filtered = envProps.filter(p => toneIds.has(p.propId));
  return filtered.length > 0 ? filtered : envProps.slice(0, 2);
}
