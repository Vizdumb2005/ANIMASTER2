import { Container, Graphics, Text } from 'pixi.js';
import type { SceneGraph } from '@animaster/shared/scene';
import { drawRoom } from './RoomRenderer';
import { drawStickman } from './StickmanRenderer';
import { drawRain } from './effects/rain';
import { drawFog } from './effects/fog';
import { drawFlicker } from './effects/flicker';
import { drawLightingTint } from './effects/lightingTint';
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

  if (scene.storyAnchors && scene.storyAnchors.length > 0) {
    const anchorLayer = new Container();
    drawStoryAnchors(anchorLayer, scene.storyAnchors);
    backgroundLayer.addChild(anchorLayer);
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
