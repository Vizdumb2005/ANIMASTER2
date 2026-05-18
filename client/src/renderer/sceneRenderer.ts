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
import { drawForegroundSilhouettes, applyAtmosphericPerspective, getParallaxOffset } from './environments/parallaxSystem';
import { drawKeyLight, drawLightShafts } from './effects/keyLight';
import { drawSnow } from './effects/snow';
import { drawEmbers } from './effects/embers';
import { drawDepthFog } from './effects/depthFog';
import { drawProps } from './props/propRenderer';
import { drawBloom } from './effects/bloom';
import { drawColorGrading } from './effects/colorGrading';
import { drawCompositionFraming } from './effects/compositionFraming';
import { drawGroundReflections } from './effects/groundReflections';

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

  // Phase 4: Environment with parallax + atmospheric perspective
  drawEnvironment(backgroundLayer, scene.environment, width, height, scene.camera);

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
        case 'snow':
          drawSnow(effectsLayer, width, height, dt);
          break;
        case 'embers':
          drawEmbers(effectsLayer, width, height, dt);
          break;
      }
    }
    drawLightingTint(effectsLayer, width, height, scene.atmosphere.lightingTint);
    backgroundLayer.addChild(effectsLayer);
  }

  // Phase 4: Cinematic key light + light shafts
  const tone = scene.cinematicGrammar?.tone ?? 'neutral';
  const lightingLayer = new Container();
  drawKeyLight(lightingLayer, width, height, envType, tone);
  drawLightShafts(lightingLayer, width, height, envType, tone, elapsedTotal);
  backgroundLayer.addChild(lightingLayer);

  // Phase 4: Enhanced depth fog
  if (scene.atmosphere?.effects?.includes('fog') || lonely) {
    const fogLayer = new Container();
    const fogIntensity = lonely ? 0.6 : 0.4;
    drawDepthFog(fogLayer, width, height, elapsedTotal, fogIntensity);
    backgroundLayer.addChild(fogLayer);
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

  // Phase 4: Environmental storytelling props
  const propsLayer = new Container();
  drawProps(propsLayer, envType, tone, elapsedTotal);
  backgroundLayer.addChild(propsLayer);

  // Phase 4: Ground reflections (for indoor/rainy scenes) — drawn on actorLayer BEFORE actors
  const hasRain = scene.atmosphere?.effects?.includes('rain') ?? false;
  const floorY = height * 0.62;
  drawGroundReflections(actorLayer, scene.actors, floorY, !outdoor, hasRain);

  // Draw actors with rim lighting + expressive faces
  for (const actor of scene.actors) {
    drawRimLighting(actorLayer, actor, tone, tensionLevel);
    // Find gaze target position (from relationships)
    let gazeTargetPos: { x: number; y: number } | null = null;
    if (scene.relationships) {
      for (const rel of scene.relationships) {
        const targetId = rel.gazeTarget;
        if (targetId && (rel.actorAId === actor.id || rel.actorBId === actor.id)) {
          const targetActor = scene.actors.find(a => a.id === targetId);
          if (targetActor) {
            gazeTargetPos = targetActor.position;
          }
        }
      }
    }
    drawStickman(actorLayer, actor, gazeTargetPos, dt, elapsedTotal);
  }

  // Phase 4: Foreground silhouettes (in front of actors for depth)
  const foregroundLayer = new Container();
  drawForegroundSilhouettes(foregroundLayer, envType, width, height);
  uiLayer.addChild(foregroundLayer);

  // Cinematic overlays (on top of everything)
  const overlayLayer = new Container();
  const vignetteIntensity = lonely ? 0.8 : tensionLevel > 0.5 ? 0.6 : 0.3;
  drawVignette(overlayLayer, width, height, vignetteIntensity, tone);

  // Phase 4: Bloom around light sources
  drawBloom(overlayLayer, width, height, envType, elapsedTotal);

  // Phase 4: Color grading by tone
  drawColorGrading(overlayLayer, width, height, tone);

  // Phase 4: Composition framing
  const actorCenterX = scene.actors.length > 0
    ? scene.actors.reduce((s, a) => s + a.position.x, 0) / scene.actors.length
    : width * 0.5;
  const actorCenterY = scene.actors.length > 0
    ? scene.actors.reduce((s, a) => s + a.position.y, 0) / scene.actors.length
    : height * 0.5;
  drawCompositionFraming(overlayLayer, width, height, tone, actorCenterX, actorCenterY);

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
