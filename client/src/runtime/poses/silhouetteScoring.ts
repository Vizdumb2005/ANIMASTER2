import type { Actor } from '@animaster/shared/scene';

export function scoreSilhouetteReadability(actor: Actor): number {
  const j = actor.joints;

  const armSeparation = Math.abs(j.leftArm.x - j.rightArm.x);
  const legSeparation = Math.abs(j.leftLeg.x - j.rightLeg.x);
  const headTorsoSeparation = Math.abs(j.head.y - j.torso.y);

  const armScore = Math.min(armSeparation / 50, 1);
  const legScore = Math.min(legSeparation / 30, 1);
  const verticalScore = Math.min(headTorsoSeparation / 25, 1);

  return (armScore * 0.4 + legScore * 0.3 + verticalScore * 0.3);
}
