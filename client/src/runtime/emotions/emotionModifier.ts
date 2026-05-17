import { Actor } from '@animaster/shared/scene';
import { applyNervousModifier } from './nervous';
import { applyExcitedModifier } from './excited';
import { applyAwkwardModifier } from './awkward';
import { applyAngryModifier } from './angry';
import { applyExhaustedModifier } from './exhausted';

export function applyEmotionModifier(actor: Actor, deltaMs: number = 0): Actor {
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
      return applyNervousModifier(actor, deltaMs);
    case 'happy':
      actor.joints.head.y -= 3;
      actor.joints.torso.y -= 2;
      actor.joints.leftArm.y -= 4;
      actor.joints.rightArm.y -= 4;
      actor.joints.leftLeg.y -= 1;
      actor.joints.rightLeg.y -= 1;
      break;
    case 'excited':
      return applyExcitedModifier(actor, deltaMs);
    case 'awkward':
      return applyAwkwardModifier(actor);
    case 'angry':
      return applyAngryModifier(actor, deltaMs);
    case 'exhausted':
      return applyExhaustedModifier(actor, deltaMs);
    default:
      break;
  }

  return actor;
}
