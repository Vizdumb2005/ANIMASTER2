import { Container, Graphics } from 'pixi.js';
import { Environment } from '@animaster/shared/scene';

export function drawRoom(layer: Container, environment: Environment, width: number, height: number) {
  const room = new Graphics();
  room.rect(0, 0, width, height).fill(environment.backgroundColor);

  const wallHeight = Math.round(height * 0.62);
  room.rect(0, 0, width, wallHeight).fill(environment.wallColor);

  const floorY = wallHeight;
  room.rect(0, floorY, width, height - floorY).fill(environment.floorColor);

  const trim = new Graphics();
  trim.rect(0, floorY - 4, width, 8).fill({ color: 0x000000, alpha: 0.18 });

  layer.addChild(room, trim);
}