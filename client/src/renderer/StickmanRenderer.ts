import { Container, Graphics } from 'pixi.js';
import { Actor } from '@animaster/shared/scene';

export function drawStickman(layer: Container, actor: Actor) {
  const jointColor = actor.emotionState === 'sad' ? 0x8aa0c8 : actor.emotionState === 'nervous' ? 0xf2c879 : 0xf2e9dc;
  const lineColor = actor.emotionState === 'sad' ? 0x93a9d0 : 0xf7e9d8;
  const graphics = new Graphics();
  const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = actor.joints;

  graphics.circle(head.x, head.y, 16).fill({ color: jointColor });
  graphics.moveTo(head.x, head.y + 16);
  graphics.lineTo(torso.x, torso.y);
  graphics.lineTo(leftLeg.x, leftLeg.y);
  graphics.moveTo(torso.x, torso.y);
  graphics.lineTo(rightLeg.x, rightLeg.y);
  graphics.moveTo(torso.x, torso.y - 4);
  graphics.lineTo(leftArm.x, leftArm.y);
  graphics.moveTo(torso.x, torso.y - 4);
  graphics.lineTo(rightArm.x, rightArm.y);
  graphics.stroke({ color: lineColor, width: 5, alpha: 0.96 });

  const core = new Graphics();
  core.circle(torso.x, torso.y, 5).fill({ color: lineColor });
  core.circle(leftArm.x, leftArm.y, 3).fill({ color: lineColor });
  core.circle(rightArm.x, rightArm.y, 3).fill({ color: lineColor });
  core.circle(leftLeg.x, leftLeg.y, 3).fill({ color: lineColor });
  core.circle(rightLeg.x, rightLeg.y, 3).fill({ color: lineColor });

  layer.addChild(graphics, core);
}