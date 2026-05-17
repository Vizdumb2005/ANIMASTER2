import { Container, Graphics, Text } from 'pixi.js';
import type { SceneGraph, CameraMode } from '@animaster/shared/scene';
import { drawRoom } from './RoomRenderer';
import { drawStickman } from './StickmanRenderer';
import { drawRain } from './effects/rain';
import { drawFog } from './effects/fog';
import { drawFlicker } from './effects/flicker';
import { drawLightingTint } from './effects/lightingTint';

function clearLayer(layer: Container) {
  layer.removeChildren();
}

let cameraX = 0;
let cameraY = 0;
let elapsedTotal = 0;

function applyCameraTransform(actorLayer: Container, scene: SceneGraph, width: number, height: number) {
  const targetActor = scene.actors[0];
  const camera = scene.camera;
  const mode = camera.mode as CameraMode;
  const grammarZoom = scene.cinematicGrammar?.template?.headroom ?? 1.0;

  switch (mode) {
    case 'close_up': {
      const zoom = 1.8 * grammarZoom;
      actorLayer.scale.set(zoom);
      if (targetActor) {
        const dx = width * 0.5 - targetActor.position.x * zoom;
        const dy = height * 0.35 - targetActor.position.y * zoom;
        cameraX += (dx - cameraX) * 0.06;
        cameraY += (dy - cameraY) * 0.06;
        actorLayer.position.set(cameraX, cameraY);
      }
      break;
    }
    case 'wide_shot': {
      const zoom = 0.7 * grammarZoom;
      actorLayer.scale.set(zoom);
      const cx = width * 0.5 - (scene.environment.width * 0.5) * zoom;
      const cy = height * 0.5 - (scene.environment.height * 0.5) * zoom;
      cameraX += (cx - cameraX) * 0.04;
      cameraY += (cy - cameraY) * 0.04;
      actorLayer.position.set(cameraX, cameraY);
      break;
    }
    case 'over_the_shoulder': {
      const zoom = 1.3 * grammarZoom;
      actorLayer.scale.set(zoom);
      if (scene.actors.length >= 2) {
        const shoulder = scene.actors[0];
        const target = scene.actors[1];
        const midX = (shoulder.position.x * 0.7 + target.position.x * 0.3);
        const dx = width * 0.4 - midX * zoom;
        const dy = height * 0.4 - shoulder.position.y * zoom;
        cameraX += (dx - cameraX) * 0.05;
        cameraY += (dy - cameraY) * 0.05;
      } else if (targetActor) {
        const dx = width * 0.5 - targetActor.position.x * zoom;
        const dy = height * 0.4 - targetActor.position.y * zoom;
        cameraX += (dx - cameraX) * 0.05;
        cameraY += (dy - cameraY) * 0.05;
      }
      actorLayer.position.set(cameraX, cameraY);
      break;
    }
    case 'dramatic_zoom': {
      const targetZoom = 2.2 * grammarZoom;
      const currentZoom = actorLayer.scale.x;
      const newZoom = currentZoom + (targetZoom - currentZoom) * 0.02;
      actorLayer.scale.set(newZoom);
      if (targetActor) {
        const dx = width * 0.5 - targetActor.position.x * newZoom;
        const dy = height * 0.4 - targetActor.position.y * newZoom;
        cameraX += (dx - cameraX) * 0.03;
        cameraY += (dy - cameraY) * 0.03;
      }
      actorLayer.position.set(cameraX, cameraY);
      break;
    }
    case 'tension': {
      const zoom = 1.1 * grammarZoom;
      actorLayer.scale.set(zoom);
      if (scene.actors.length >= 2) {
        const a = scene.actors[0];
        const b = scene.actors[1];
        const midX = (a.position.x + b.position.x) * 0.5;
        const midY = (a.position.y + b.position.y) * 0.5;
        const dx = width * 0.5 - midX * zoom;
        const dy = height * 0.45 - midY * zoom;
        cameraX += (dx - cameraX) * 0.04;
        cameraY += (dy - cameraY) * 0.04;
      } else if (targetActor) {
        const dx = width * 0.5 - targetActor.position.x * zoom;
        const dy = height * 0.45 - targetActor.position.y * zoom;
        cameraX += (dx - cameraX) * 0.04;
        cameraY += (dy - cameraY) * 0.04;
      }
      actorLayer.position.set(cameraX, cameraY);
      break;
    }
    case 'follow': {
      actorLayer.scale.set(camera.zoom);
      if (targetActor) {
        const desiredX = width * 0.5 - targetActor.position.x * camera.zoom;
        const desiredY = height * 0.5 - targetActor.position.y * camera.zoom;
        cameraX += (desiredX - cameraX) * 0.08;
        cameraY += (desiredY - cameraY) * 0.08;
        actorLayer.position.set(cameraX, cameraY);
      }
      break;
    }
    default: {
      actorLayer.scale.set(camera.zoom);
      cameraX = camera.x;
      cameraY = camera.y;
      actorLayer.position.set(camera.x, camera.y);
      break;
    }
  }
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

  applyCameraTransform(actorLayer, scene, width, height);
  drawRoom(backgroundLayer, scene.environment, width, height);

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

  for (const actor of scene.actors) {
    drawStickman(actorLayer, actor);
  }

  drawUiLayer(uiLayer, scene);
}

function drawUiLayer(layer: Container, scene: SceneGraph) {
  const badge = new Container();
  const backdrop = new Graphics();
  backdrop.roundRect(20, 20, 220, 52, 16).fill({ color: 0x0d1118, alpha: 0.78 });
  backdrop.stroke({ color: 0xffcc8f, width: 1, alpha: 0.45 });
  const label = new Text({
    text: `Scene ${scene.version} • ${scene.actors.length} actor${scene.actors.length === 1 ? '' : 's'}`,
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
