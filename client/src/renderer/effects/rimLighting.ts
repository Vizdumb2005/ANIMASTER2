import { Container, Graphics } from 'pixi.js';
import type { Actor } from '@animaster/shared/scene';

export function drawRimLighting(layer: Container, actor: Actor): void {
  const g = new Graphics();
  const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = actor.joints;
  const rimColor = 0xaabbcc;
  const rimAlpha = 0.25;
  const offset = 3;

  // Head rim (right side = light source side)
  g.circle(head.x + offset, head.y, 17).stroke({ color: rimColor, width: 1.5, alpha: rimAlpha });

  // Body rim
  g.moveTo(head.x + offset, head.y + 16);
  g.lineTo(torso.x + offset, torso.y);
  g.stroke({ color: rimColor, width: 2, alpha: rimAlpha * 0.8 });

  // Arms rim
  g.moveTo(torso.x + offset, torso.y - 4);
  g.lineTo(rightArm.x + offset, rightArm.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.6 });

  g.moveTo(torso.x - offset, torso.y - 4);
  g.lineTo(leftArm.x - offset, leftArm.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.4 });

  // Legs rim
  g.moveTo(torso.x + offset, torso.y);
  g.lineTo(rightLeg.x + offset, rightLeg.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.5 });

  g.moveTo(torso.x - offset, torso.y);
  g.lineTo(leftLeg.x - offset, leftLeg.y);
  g.stroke({ color: rimColor, width: 1.5, alpha: rimAlpha * 0.3 });

  layer.addChild(g);
}
