import { Container, Graphics, Text } from 'pixi.js';
import type { SceneGraph } from '@animaster/shared/scene';
import { drawEnvironment } from './environments/environmentRenderer';
import { drawStickman } from './StickmanRenderer';
import { drawRain } from './effects/rain';
import { drawFog } from './effects/fog';
import { drawFlicker } from './effects/flicker';
import { drawLightingTint } from './effects/lightingTint';
import { drawWind } from './effects/wind';
import { drawDust } from './effects/dust';
import { drawLightPulse } from './effects/lightPulse';
import { drawTrafficAmbient } from './effects/trafficAmbient';
import { drawSilhouetteMovement } from './effects/silhouetteMovement';
import { drawVignette } from './effects/vignette';
import { drawFilmGrain } from './effects/filmGrain';
import { drawRimLighting } from './effects/rimLighting';
import { drawStoryAnchors } from '../runtime/anchors/storyAnchorRenderer';

function clearLayer(layer: Container) {
  layer.removeChildren();
}

function applyCameraTransform(actorLayer: Container, scene: SceneGraph) {
  const shot = scene.camera.shot;
  const x = shot?.x ?? scene.camera.x;
  const y = shot?.y ?? scene.camera.y;
  const zoom = shot?.zoom ?? scene.camera.zoom;
  actorLayer.scale.set(zoom);
  actorLayer.position.set(x, y);
}

let elapsedTotal = 0;

function isOutdoorEnv(envType: string): boolean {
  return envType.startsWith('outdoor_') || envType === 'rooftop' || envType === 'beach';
}

function isLonelyScene(scene: SceneGraph): boolean {
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  return tone === 'lonely' || tone === 'sad';
}

export function clearAndRedrawScene({
  backgroundLayer,
  actorLayer,
  uiLayer,
  scene,
  width,
  height,
  deltaMs
}: {
  backgroundLayer: Container;
  actorLayer: Container;
  uiLayer: Container;
  scene: SceneGraph;
  width: number;
  height: number;
  deltaMs?: number;
}) {
  const dt = deltaMs ?? 16;
  elapsedTotal += dt;

  clearLayer(backgroundLayer);
  clearLayer(actorLayer);
  clearLayer(uiLayer);

  applyCameraTransform(actorLayer, scene);

  // Phase 3: Use new environment renderer
  drawEnvironment(backgroundLayer, scene.environment, width, height);

  // Ambient environment effects based on environment type
  const envType = scene.environment.type;
  const outdoor = isOutdoorEnv(envType);
  const lonely = isLonelyScene(scene);

  if (outdoor) {
    const ambientLayer = new Container();
    drawWind(ambientLayer, width, height, dt);
    if (envType === 'outdoor_street' || envType === 'rooftop') {
      drawTrafficAmbient(ambientLayer, width, height, dt);
      drawSilhouetteMovement(ambientLayer, width, height, dt, lonely);
    }
    backgroundLayer.addChild(ambientLayer);
  } else {
    // Indoor dust motes
    const dustLayer = new Container();
    drawDust(dustLayer, width, height, dt);
    backgroundLayer.addChild(dustLayer);
  }

  // Atmosphere effects
  if (scene.atmosphere) {
    const effectsLayer = new Container();
    for (const effect of scene.atmosphere.effects) {
      switch (effect) {
        case 'rain':
          drawRain(effectsLayer, width, height, dt);
          break;
        case 'fog':
          drawFog(effectsLayer, width, height);
          break;
        case 'flicker':
          drawFlicker(effectsLayer, width * 0.5, height * 0.25, elapsedTotal);
          break;
      }
    }
    drawLightingTint(effectsLayer, width, height, scene.atmosphere.lightingTint);
    backgroundLayer.addChild(effectsLayer);
  }

  // Tension-based light pulse
  const tensionLevel = scene.tensionState?.currentLevel ?? 0;
  if (tensionLevel > 0.3) {
    const pulseLayer = new Container();
    drawLightPulse(pulseLayer, width, height, elapsedTotal, tensionLevel);
    backgroundLayer.addChild(pulseLayer);
  }

  // Story anchors
  if (scene.storyAnchors && scene.storyAnchors.length > 0) {
    const anchorLayer = new Container();
    drawStoryAnchors(anchorLayer, scene.storyAnchors);
    backgroundLayer.addChild(anchorLayer);
  }

  // Draw actors with rim lighting
  for (const actor of scene.actors) {
    drawRimLighting(actorLayer, actor);
    drawStickman(actorLayer, actor);
  }

  // Cinematic overlays (on top of everything)
  const overlayLayer = new Container();
  const vignetteIntensity = lonely ? 0.8 : tensionLevel > 0.5 ? 0.6 : 0.3;
  drawVignette(overlayLayer, width, height, vignetteIntensity);
  drawFilmGrain(overlayLayer, width, height, elapsedTotal);
  uiLayer.addChild(overlayLayer);

  drawUiLayer(uiLayer, scene);
}

function drawUiLayer(layer: Container, scene: SceneGraph) {
  const badge = new Container();
  const backdrop = new Graphics();
  const tone = scene.cinematicGrammar?.tone ?? '';
  const toneLabel = tone && tone !== 'neutral' ? ` • ${tone}` : '';
  backdrop.roundRect(20, 20, 240, 52, 16).fill({ color: 0x0d1118, alpha: 0.78 });
  backdrop.stroke({ color: 0xffcc8f, width: 1, alpha: 0.45 });
  const label = new Text({
    text: `Scene ${scene.version} • ${scene.actors.length} actor${scene.actors.length === 1 ? '' : 's'}${toneLabel}`,
    style: {
      fill: '#f6efe7',
      fontFamily: 'Georgia',
      fontSize: 14
    }
  });
  label.position.set(34, 34);
  badge.addChild(backdrop, label);
  layer.addChild(badge);
}
