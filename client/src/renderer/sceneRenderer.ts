import { Container, Graphics, Text } from 'pixi.js';
import { SceneGraph } from '@animaster/shared/scene';
import { drawRoom } from './RoomRenderer';
import { drawStickman } from './StickmanRenderer';

function clearLayer(layer: Container) {
  layer.removeChildren();
}

function applyCameraTransform(actorLayer: Container, scene: SceneGraph, width: number, height: number) {
  const targetActor = scene.actors[0];
  const camera = scene.camera;

  actorLayer.scale.set(camera.zoom);

  if (camera.mode === 'follow' && targetActor) {
    actorLayer.position.set(width * 0.5 - targetActor.position.x * camera.zoom, height * 0.5 - targetActor.position.y * camera.zoom);
  } else {
    actorLayer.position.set(camera.x, camera.y);
  }
}

export function clearAndRedrawScene({
  backgroundLayer,
  actorLayer,
  uiLayer,
  scene,
  width,
  height
}: {
  backgroundLayer: Container;
  actorLayer: Container;
  uiLayer: Container;
  scene: SceneGraph;
  width: number;
  height: number;
}) {
  clearLayer(backgroundLayer);
  clearLayer(actorLayer);
  clearLayer(uiLayer);

  applyCameraTransform(actorLayer, scene, width, height);
  drawRoom(backgroundLayer, scene.environment, width, height);

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