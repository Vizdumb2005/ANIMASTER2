/**
 * Asset Loading System — unified loaders for GLTF, GLB, and VRM models.
 * Provides caching, progress tracking, and error handling.
 */
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three-stdlib';
import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyGLTFPlugin = any;

export type AssetType = 'gltf' | 'glb' | 'vrm' | 'texture' | 'audio';

interface LoadedAsset {
  type: AssetType;
  data: GLTF | VRM | THREE.Texture | AudioBuffer;
  url: string;
  timestamp: number;
}

class AssetCache {
  private cache: Map<string, LoadedAsset> = new Map();
  private maxSize: number;

  constructor(maxSize: number = 50) {
    this.maxSize = maxSize;
  }

  get(url: string): LoadedAsset | undefined {
    return this.cache.get(url);
  }

  set(url: string, asset: LoadedAsset): void {
    if (this.cache.size >= this.maxSize) {
      const oldest = [...this.cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) {
        this.cache.delete(oldest[0]);
      }
    }
    this.cache.set(url, asset);
  }

  has(url: string): boolean {
    return this.cache.has(url);
  }

  clear(): void {
    this.cache.clear();
  }
}

export class AssetLoader {
  private gltfLoader: GLTFLoader;
  private textureLoader: THREE.TextureLoader;
  private cache: AssetCache;
  private onProgress: ((url: string, loaded: number, total: number) => void) | null = null;

  constructor() {
    this.gltfLoader = new GLTFLoader();
    // VRMLoaderPlugin and three-stdlib GLTFParser have minor type mismatches;
    // cast parser to satisfy VRMLoaderPlugin's expected type.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.gltfLoader.register((parser: any) => new VRMLoaderPlugin(parser) as AnyGLTFPlugin);

    this.textureLoader = new THREE.TextureLoader();
    this.cache = new AssetCache();
  }

  setProgressCallback(cb: (url: string, loaded: number, total: number) => void): void {
    this.onProgress = cb;
  }

  async loadGLTF(url: string): Promise<GLTF> {
    const cached = this.cache.get(url);
    if (cached && cached.type === 'gltf') return cached.data as GLTF;

    const gltf = await new Promise<GLTF>((resolve, reject) => {
      this.gltfLoader.load(
        url,
        resolve,
        (event) => this.onProgress?.(url, event.loaded, event.total),
        reject
      );
    });

    this.cache.set(url, { type: 'gltf', data: gltf, url, timestamp: Date.now() });
    return gltf;
  }

  async loadVRM(url: string): Promise<VRM> {
    const cached = this.cache.get(url);
    if (cached && cached.type === 'vrm') return cached.data as VRM;

    const gltf = await this.loadGLTF(url);
    const vrm = gltf.userData.vrm as VRM | undefined;
    if (!vrm) {
      throw new Error(`File ${url} is not a valid VRM model`);
    }

    this.cache.set(url, { type: 'vrm', data: vrm, url, timestamp: Date.now() });
    return vrm;
  }

  async loadTexture(url: string): Promise<THREE.Texture> {
    const cached = this.cache.get(url);
    if (cached && cached.type === 'texture') return cached.data as THREE.Texture;

    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      this.textureLoader.load(
        url,
        resolve,
        (event) => this.onProgress?.(url, event.loaded, event.total),
        reject
      );
    });

    texture.colorSpace = THREE.SRGBColorSpace;
    this.cache.set(url, { type: 'texture', data: texture, url, timestamp: Date.now() });
    return texture;
  }

  clearCache(): void {
    this.cache.clear();
  }

  dispose(): void {
    this.clearCache();
  }
}

let _instance: AssetLoader | null = null;

export function getAssetLoader(): AssetLoader {
  if (!_instance) {
    _instance = new AssetLoader();
  }
  return _instance;
}
