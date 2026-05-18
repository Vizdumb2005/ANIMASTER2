/**
 * Procedural Environment Pipeline — generates stylized 3D environments
 * from Animaster's semantic environment types.
 */
import * as THREE from 'three';

export type EnvironmentType =
  | 'indoor_room' | 'apartment' | 'hallway' | 'hospital' | 'subway'
  | 'outdoor_street' | 'outdoor_park' | 'outdoor_beach' | 'outdoor_forest'
  | 'rooftop' | 'staircase';

interface EnvironmentConfig {
  groundColor: number;
  groundSize: [number, number];
  wallColor: number;
  hasWalls: boolean;
  hasCeiling: boolean;
  skyColor: number;
  fogColor: number;
  fogDensity: number;
  props: ProceduralPropDef[];
}

interface ProceduralPropDef {
  type: 'box' | 'cylinder' | 'plane';
  position: [number, number, number];
  scale: [number, number, number];
  color: number;
  opacity?: number;
}

const ENV_CONFIGS: Record<EnvironmentType, EnvironmentConfig> = {
  indoor_room: {
    groundColor: 0x2a2520, groundSize: [10, 8],
    wallColor: 0x3a3530, hasWalls: true, hasCeiling: true,
    skyColor: 0x0a0a12, fogColor: 0x1a1520, fogDensity: 0.05,
    props: [
      { type: 'box', position: [-4, 1.5, -3.5], scale: [0.1, 3, 7], color: 0x3a3530 },
      { type: 'box', position: [4, 1.5, -3.5], scale: [0.1, 3, 7], color: 0x3a3530 },
      { type: 'box', position: [0, 3, -3.5], scale: [8, 0.1, 7], color: 0x332e28 },
    ],
  },
  apartment: {
    groundColor: 0x3a3225, groundSize: [12, 10],
    wallColor: 0x44382e, hasWalls: true, hasCeiling: true,
    skyColor: 0x0a0a12, fogColor: 0x1a1520, fogDensity: 0.03,
    props: [
      { type: 'box', position: [3, 1, -4], scale: [2, 2.5, 0.1], color: 0x556688, opacity: 0.3 },
      { type: 'box', position: [-4, 0.3, -2], scale: [1.5, 0.6, 0.8], color: 0x443322 },
    ],
  },
  hallway: {
    groundColor: 0x252228, groundSize: [4, 20],
    wallColor: 0x33303a, hasWalls: true, hasCeiling: true,
    skyColor: 0x0a0a12, fogColor: 0x15121a, fogDensity: 0.08,
    props: [
      { type: 'box', position: [-1.8, 1.5, 0], scale: [0.1, 3, 18], color: 0x33303a },
      { type: 'box', position: [1.8, 1.5, 0], scale: [0.1, 3, 18], color: 0x33303a },
    ],
  },
  hospital: {
    groundColor: 0xdde4e8, groundSize: [14, 12],
    wallColor: 0xe8eef2, hasWalls: true, hasCeiling: true,
    skyColor: 0xc0cdd5, fogColor: 0xd0dde5, fogDensity: 0.02,
    props: [
      { type: 'box', position: [0, 2.8, -5], scale: [12, 0.1, 0.1], color: 0xaabbcc },
    ],
  },
  subway: {
    groundColor: 0x1a1a22, groundSize: [6, 30],
    wallColor: 0x252530, hasWalls: true, hasCeiling: true,
    skyColor: 0x08080f, fogColor: 0x12121a, fogDensity: 0.06,
    props: [
      { type: 'box', position: [-2.5, 0.4, -3], scale: [1.5, 0.8, 0.4], color: 0x333340 },
      { type: 'cylinder', position: [-2, 2.5, 0], scale: [0.05, 5, 0.05], color: 0x556677 },
    ],
  },
  outdoor_street: {
    groundColor: 0x2a2a30, groundSize: [20, 30],
    wallColor: 0x333338, hasWalls: false, hasCeiling: false,
    skyColor: 0x0a0e1a, fogColor: 0x15182a, fogDensity: 0.04,
    props: [
      { type: 'cylinder', position: [-5, 2, -3], scale: [0.08, 4, 0.08], color: 0x445566 },
      { type: 'cylinder', position: [5, 2, -5], scale: [0.08, 4, 0.08], color: 0x445566 },
      { type: 'box', position: [-8, 3, -10], scale: [4, 6, 3], color: 0x222230 },
      { type: 'box', position: [8, 4, -12], scale: [5, 8, 4], color: 0x1a1a28 },
    ],
  },
  outdoor_park: {
    groundColor: 0x2a4a25, groundSize: [30, 30],
    wallColor: 0x1a3a15, hasWalls: false, hasCeiling: false,
    skyColor: 0x1a2a3a, fogColor: 0x223322, fogDensity: 0.02,
    props: [
      { type: 'cylinder', position: [-5, 2, -4], scale: [0.15, 4, 0.15], color: 0x443322 },
      { type: 'cylinder', position: [4, 2.5, -6], scale: [0.2, 5, 0.2], color: 0x3a2a18 },
      { type: 'box', position: [0, 0.25, -2], scale: [1.5, 0.5, 0.5], color: 0x553a22 },
    ],
  },
  outdoor_beach: {
    groundColor: 0xc4a86a, groundSize: [40, 20],
    wallColor: 0x1a3a5a, hasWalls: false, hasCeiling: false,
    skyColor: 0x2a4a6a, fogColor: 0x3a5a7a, fogDensity: 0.015,
    props: [],
  },
  outdoor_forest: {
    groundColor: 0x1a3018, groundSize: [25, 25],
    wallColor: 0x0a2008, hasWalls: false, hasCeiling: false,
    skyColor: 0x0a1a0a, fogColor: 0x152015, fogDensity: 0.06,
    props: [
      { type: 'cylinder', position: [-3, 3, -5], scale: [0.2, 6, 0.2], color: 0x3a2a15 },
      { type: 'cylinder', position: [2, 2.5, -3], scale: [0.18, 5, 0.18], color: 0x443318 },
      { type: 'cylinder', position: [-6, 4, -8], scale: [0.25, 8, 0.25], color: 0x332a12 },
      { type: 'cylinder', position: [5, 3, -7], scale: [0.22, 6, 0.22], color: 0x3a2a15 },
    ],
  },
  rooftop: {
    groundColor: 0x2a2a30, groundSize: [16, 12],
    wallColor: 0x333340, hasWalls: false, hasCeiling: false,
    skyColor: 0x0a0e2a, fogColor: 0x15183a, fogDensity: 0.01,
    props: [
      { type: 'box', position: [-6, 0.5, -4], scale: [2, 1, 1.5], color: 0x333340 },
      { type: 'cylinder', position: [5, 1.5, -3], scale: [0.3, 3, 0.3], color: 0x445566 },
    ],
  },
  staircase: {
    groundColor: 0x252228, groundSize: [5, 12],
    wallColor: 0x302830, hasWalls: true, hasCeiling: false,
    skyColor: 0x0a0a12, fogColor: 0x15121a, fogDensity: 0.07,
    props: [],
  },
};

export class ProceduralEnvironmentBuilder {
  private group: THREE.Group;

  constructor() {
    this.group = new THREE.Group();
  }

  build(envType: string): THREE.Group {
    this.clear();
    const config = ENV_CONFIGS[envType as EnvironmentType] ?? ENV_CONFIGS.indoor_room;

    const groundGeom = new THREE.PlaneGeometry(config.groundSize[0], config.groundSize[1]);
    const groundMat = new THREE.MeshStandardMaterial({
      color: config.groundColor,
      roughness: 0.9,
      metalness: 0.1,
    });
    const ground = new THREE.Mesh(groundGeom, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    this.group.add(ground);

    for (const prop of config.props) {
      const mesh = this.createProp(prop);
      this.group.add(mesh);
    }

    return this.group;
  }

  private createProp(def: ProceduralPropDef): THREE.Mesh {
    let geometry: THREE.BufferGeometry;
    switch (def.type) {
      case 'cylinder':
        geometry = new THREE.CylinderGeometry(0.5, 0.5, 1, 8);
        break;
      case 'plane':
        geometry = new THREE.PlaneGeometry(1, 1);
        break;
      default:
        geometry = new THREE.BoxGeometry(1, 1, 1);
    }

    const material = new THREE.MeshStandardMaterial({
      color: def.color,
      roughness: 0.8,
      metalness: 0.1,
      transparent: def.opacity !== undefined && def.opacity < 1,
      opacity: def.opacity ?? 1,
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...def.position);
    mesh.scale.set(...def.scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return mesh;
  }

  getGroup(): THREE.Group {
    return this.group;
  }

  getConfigForType(envType: string): EnvironmentConfig | undefined {
    return ENV_CONFIGS[envType as EnvironmentType];
  }

  clear(): void {
    while (this.group.children.length > 0) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }
  }

  dispose(): void {
    this.clear();
  }
}

export function getEnvironmentConfig(envType: string): EnvironmentConfig | undefined {
  return ENV_CONFIGS[envType as EnvironmentType];
}
