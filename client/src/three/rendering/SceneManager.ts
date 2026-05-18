/**
 * Three.js Scene Manager — abstraction layer between Animaster's semantic runtime
 * and Three.js rendering. Manages the scene graph, renderer, and render loop.
 */
import * as THREE from 'three';

export interface SceneLayer {
  background: THREE.Group;
  environment: THREE.Group;
  props: THREE.Group;
  actors: THREE.Group;
  atmosphere: THREE.Group;
  lighting: THREE.Group;
  overlay: THREE.Group;
}

export class SceneManager {
  readonly scene: THREE.Scene;
  readonly layers: SceneLayer;
  private fog: THREE.FogExp2 | null = null;

  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a0a12);

    this.layers = {
      background: new THREE.Group(),
      environment: new THREE.Group(),
      props: new THREE.Group(),
      actors: new THREE.Group(),
      atmosphere: new THREE.Group(),
      lighting: new THREE.Group(),
      overlay: new THREE.Group(),
    };

    this.layers.background.renderOrder = 0;
    this.layers.environment.renderOrder = 1;
    this.layers.props.renderOrder = 2;
    this.layers.actors.renderOrder = 3;
    this.layers.atmosphere.renderOrder = 4;
    this.layers.lighting.renderOrder = 5;
    this.layers.overlay.renderOrder = 6;

    for (const group of Object.values(this.layers)) {
      this.scene.add(group);
    }
  }

  setBackgroundColor(color: number | string): void {
    this.scene.background = new THREE.Color(color);
  }

  setFog(color: number, density: number): void {
    this.fog = new THREE.FogExp2(color, density);
    this.scene.fog = this.fog;
  }

  clearFog(): void {
    this.scene.fog = null;
    this.fog = null;
  }

  updateFogDensity(density: number): void {
    if (this.fog) {
      this.fog.density = density;
    }
  }

  clearLayer(layerName: keyof SceneLayer): void {
    const group = this.layers[layerName];
    while (group.children.length > 0) {
      const child = group.children[0];
      group.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry?.dispose();
        if (child.material instanceof THREE.Material) {
          child.material.dispose();
        }
      }
    }
  }

  clearAllLayers(): void {
    for (const key of Object.keys(this.layers) as (keyof SceneLayer)[]) {
      this.clearLayer(key);
    }
  }

  dispose(): void {
    this.clearAllLayers();
    this.scene.clear();
  }
}

let _instance: SceneManager | null = null;

export function getSceneManager(): SceneManager {
  if (!_instance) {
    _instance = new SceneManager();
  }
  return _instance;
}

export function resetSceneManager(): void {
  if (_instance) {
    _instance.dispose();
    _instance = null;
  }
}
