import { Actor } from '@animaster/shared/scene';

export function applyEmotionModifier(actor: Actor): Actor {
  switch (actor.emotionState) {
    case 'sad':
      actor.joints.head.y += 5;
      actor.joints.torso.y += 3;
      actor.joints.leftArm.y += 10;
      actor.joints.rightArm.y += 10;
      actor.joints.leftLeg.y += 2;
      actor.joints.rightLeg.y += 2;
      break;
    case 'nervous':
      actor.joints.head.y -= 2;
      actor.joints.torso.y -= 1;
      actor.joints.leftArm.x -= 4;
      actor.joints.rightArm.x += 4;
      actor.joints.leftArm.y -= 3;
      actor.joints.rightArm.y -= 3;
      break;
    case 'happy':
      actor.joints.head.y -= 3;
      actor.joints.torso.y -= 2;
      actor.joints.leftArm.y -= 4;
      actor.joints.rightArm.y -= 4;
      actor.joints.leftLeg.y -= 1;
      actor.joints.rightLeg.y -= 1;
      break;
    default:
      break;
  }

  return actor;
}