/**
 * Cinematic Runtime — the master orchestrator that bridges Animaster's
 * semantic scene state with the Three.js rendering pipeline.
 * 
 * This is the integration point between:
 * - Semantic runtime (sceneStore, actorEvaluator, sceneEvaluator)
 * - Three.js rendering (SceneManager, LightingPipeline, etc.)
 * - Post-processing (CinematicEffects)
 * - Atmosphere (AtmosphereController, ParticleSystem)
 * - Camera (CinematicCameraController)
 * - Audio (AmbientAudioManager)
 * - Assets (AssetLoader)
 */
import * as THREE from 'three';
import { SceneManager } from './rendering/SceneManager';
import { LightingPipeline } from './lighting/LightingPipeline';
import { AtmosphereController } from './atmosphere/AtmosphereController';
import { AtmosphereManager } from './particles/AtmosphereManager';
import { ProceduralEnvironmentBuilder } from './environments/ProceduralEnvironment';
import { SkylineGenerator } from './environments/SkylineGenerator';
import { CinematicCameraController } from './camera/CinematicCamera';
import { AmbientAudioManager } from './audio/AmbientAudioManager';
import { getAssetLoader } from './assets/AssetLoader';
import { applyRendererSettings, getExposureForTone } from './rendering/RendererConfig';
import { getCameraSettingsForTone } from './camera/CinematicCamera';
import { getSkyColorsForTone, createSkyGradientMaterial } from './shaders/StylizedShaders';

export interface CinematicRuntimeConfig {
  canvas?: HTMLCanvasElement;
  width?: number;
  height?: number;
  audioEnabled?: boolean;
}

export class CinematicRuntime {
  // Core
  private renderer: THREE.WebGLRenderer | null = null;
  private sceneManager: SceneManager;
  private clock: THREE.Clock;

  // Subsystems
  private lightingPipeline: LightingPipeline;
  private atmosphereController: AtmosphereController;
  private particleManager: AtmosphereManager;
  private environmentBuilder: ProceduralEnvironmentBuilder;
  private skylineGenerator: SkylineGenerator;
  private cameraController: CinematicCameraController | null = null;
  private audioManager: AmbientAudioManager;

  // State
  private currentTone: string = 'neutral';
  private currentEnvironment: string = 'indoor_room';
  private initialized: boolean = false;

  constructor(config?: CinematicRuntimeConfig) {
    this.sceneManager = new SceneManager();
    this.clock = new THREE.Clock();
    this.lightingPipeline = new LightingPipeline();
    this.atmosphereController = new AtmosphereController();
    this.particleManager = new AtmosphereManager();
    this.environmentBuilder = new ProceduralEnvironmentBuilder();
    this.skylineGenerator = new SkylineGenerator();
    this.audioManager = new AmbientAudioManager();

    this.sceneManager.layers.lighting.add(this.lightingPipeline.getGroup());
    this.sceneManager.layers.atmosphere.add(this.particleManager.getGroup());

    if (config?.canvas) {
      this.initRenderer(config.canvas, config.width, config.height);
    }
  }

  initRenderer(canvas: HTMLCanvasElement, width?: number, height?: number): void {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    this.renderer.setSize(width ?? canvas.clientWidth, height ?? canvas.clientHeight);
    applyRendererSettings(this.renderer);
    this.initialized = true;
  }

  initCamera(camera: THREE.PerspectiveCamera): void {
    this.cameraController = new CinematicCameraController(camera);
  }

  applySceneState(sceneState: {
    tone?: string;
    environmentType?: string;
    atmosphereEffects?: string[];
    actors?: Array<{ position?: { x: number } }>;
  }): void {
    const tone = sceneState.tone ?? 'neutral';
    const envType = sceneState.environmentType ?? 'indoor_room';

    if (tone !== this.currentTone) {
      this.currentTone = tone;
      this.lightingPipeline.applyTone(tone);
      this.atmosphereController.applyTone(tone);
      this.audioManager.applyTone(tone);

      if (this.renderer) {
        this.renderer.toneMappingExposure = getExposureForTone(tone);
      }

      if (this.cameraController) {
        const camSettings = getCameraSettingsForTone(tone);
        this.cameraController.applyPreset(camSettings.preset);
        this.cameraController.setSmoothing(camSettings.smoothing);
        if (camSettings.handheld > 0) {
          this.cameraController.setRig('handheld');
        } else {
          this.cameraController.setRig('static');
        }
      }

      const skyColors = getSkyColorsForTone(tone);
      this.sceneManager.setBackgroundColor(skyColors.bottom);
    }

    if (envType !== this.currentEnvironment) {
      this.currentEnvironment = envType;
      this.sceneManager.clearLayer('environment');
      this.sceneManager.clearLayer('background');
      const envGroup = this.environmentBuilder.build(envType);
      this.sceneManager.layers.environment.add(envGroup);

      const envConfig = this.environmentBuilder.getConfigForType(envType);
      if (envConfig) {
        this.sceneManager.setFog(envConfig.fogColor, envConfig.fogDensity);
      }

      const isOutdoor = envType.startsWith('outdoor_') || envType === 'rooftop';
      if (isOutdoor) {
        const skylineType = envType === 'outdoor_forest' ? 'forest'
          : envType === 'outdoor_beach' ? 'mountain'
          : envType === 'outdoor_park' ? 'suburban'
          : 'city';
        const skyline = this.skylineGenerator.generate(skylineType);
        this.sceneManager.layers.background.add(skyline);

        const skyColors = getSkyColorsForTone(this.currentTone);
        const skyMat = createSkyGradientMaterial(skyColors.top, skyColors.bottom);
        const skyGeom = new THREE.SphereGeometry(50, 16, 8);
        const skyMesh = new THREE.Mesh(skyGeom, skyMat);
        this.sceneManager.layers.background.add(skyMesh);
      }

      this.audioManager.applyEnvironment(envType);
    }

    if (sceneState.atmosphereEffects) {
      this.particleManager.applyAtmosphereEffects(sceneState.atmosphereEffects);
    }
  }

  update(): void {
    const delta = this.clock.getDelta();

    this.atmosphereController.update(delta);
    this.particleManager.update(delta);

    if (this.cameraController) {
      this.cameraController.update(delta);
    }

    this.sceneManager.updateFogDensity(this.atmosphereController.getState().fogDensity);
  }

  render(camera: THREE.Camera): void {
    if (!this.renderer) return;
    this.renderer.render(this.sceneManager.scene, camera);
  }

  resize(width: number, height: number): void {
    if (this.renderer) {
      this.renderer.setSize(width, height);
    }
  }

  getSceneManager(): SceneManager {
    return this.sceneManager;
  }

  getLightingPipeline(): LightingPipeline {
    return this.lightingPipeline;
  }

  getAtmosphereController(): AtmosphereController {
    return this.atmosphereController;
  }

  getParticleManager(): AtmosphereManager {
    return this.particleManager;
  }

  getEnvironmentBuilder(): ProceduralEnvironmentBuilder {
    return this.environmentBuilder;
  }

  getCameraController(): CinematicCameraController | null {
    return this.cameraController;
  }

  getAudioManager(): AmbientAudioManager {
    return this.audioManager;
  }

  getAssetLoader() {
    return getAssetLoader();
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  dispose(): void {
    this.sceneManager.dispose();
    this.lightingPipeline.dispose();
    this.particleManager.dispose();
    this.environmentBuilder.dispose();
    this.skylineGenerator.dispose();
    this.audioManager.dispose();
    this.cameraController?.dispose();
    this.renderer?.dispose();
    this.initialized = false;
  }
}

let _runtimeInstance: CinematicRuntime | null = null;

export function getCinematicRuntime(config?: CinematicRuntimeConfig): CinematicRuntime {
  if (!_runtimeInstance) {
    _runtimeInstance = new CinematicRuntime(config);
  }
  return _runtimeInstance;
}

export function resetCinematicRuntime(): void {
  if (_runtimeInstance) {
    _runtimeInstance.dispose();
    _runtimeInstance = null;
  }
}
