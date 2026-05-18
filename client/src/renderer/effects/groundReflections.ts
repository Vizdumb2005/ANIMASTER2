import { Container, Graphics } from 'pixi.js';
import type { Actor } from '@animaster/shared/scene';

// --- Task 226: Ground Reflections ---

export function drawGroundReflections(
  layer: Container,
  actors: Actor[],
  floorY: number,
  isIndoor: boolean,
  hasRain: boolean
): void {
  if (!isIndoor && !hasRain) return;

  const reflectionAlpha = hasRain ? 0.12 : 0.08;

  for (const actor of actors) {
    const g = new Graphics();
    const { head, torso, leftArm, rightArm, leftLeg, rightLeg } = actor.joints;

    // Mirror Y positions below floorY
    const mirrorY = (y: number) => floorY + (floorY - y) * 0.4;

    const mHead = mirrorY(head.y);
    const mTorso = mirrorY(torso.y);
    const mLeftLeg = mirrorY(leftLeg.y);
    const mRightLeg = mirrorY(rightLeg.y);
    const mLeftArm = mirrorY(leftArm.y);
    const mRightArm = mirrorY(rightArm.y);

    // Draw mirrored silhouette
    g.circle(head.x, mHead, 14).fill({ color: 0x1a1a2a, alpha: reflectionAlpha });

    g.moveTo(head.x, mHead - 14);
    g.lineTo(torso.x, mTorso);
    g.lineTo(leftLeg.x, mLeftLeg);
    g.moveTo(torso.x, mTorso);
    g.lineTo(rightLeg.x, mRightLeg);
    g.moveTo(torso.x, mTorso + 4);
    g.lineTo(leftArm.x, mLeftArm);
    g.moveTo(torso.x, mTorso + 4);
    g.lineTo(rightArm.x, mRightArm);
    g.stroke({ color: 0x1a1a2a, width: 3, alpha: reflectionAlpha * 0.7 });

    layer.addChild(g);
  }
}
