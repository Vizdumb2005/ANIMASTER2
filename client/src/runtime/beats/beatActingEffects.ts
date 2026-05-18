import type { Actor, EmotionalBeat } from '@animaster/shared/scene';

export function applyBeatActingEffects(actor: Actor, beat: EmotionalBeat, progress: number): Actor {
  const ease = Math.sin(progress * Math.PI);
  const damping = 1 - beat.motionDamping;

  switch (beat.action) {
    case 'freeze':
      actor.joints.torso.y += ease * 2;
      break;
    case 'collapse':
      actor.joints.head.y += ease * 12;
      actor.joints.torso.y += ease * 8;
      actor.joints.leftArm.y += ease * 14;
      actor.joints.rightArm.y += ease * 14;
      break;
    case 'recoil':
      actor.joints.torso.x -= ease * 8;
      actor.joints.head.x -= ease * 6;
      actor.joints.leftArm.x -= ease * 10;
      actor.joints.rightArm.x -= ease * 5;
      break;
    case 'step_back':
      actor.position.x -= ease * 4 * damping;
      break;
    case 'look_away':
      actor.joints.head.x += ease * 10;
      actor.joints.head.y += ease * 3;
      break;
    case 'glance':
      actor.joints.head.x += ease * 6;
      break;
    case 'fidget':
      actor.joints.leftArm.y += Math.sin(progress * Math.PI * 3) * 4;
      actor.joints.rightArm.y -= Math.sin(progress * Math.PI * 2) * 3;
      break;
    case 'approach':
      actor.position.x += ease * 3 * damping;
      break;
    case 'attempt_contact':
      actor.joints.rightArm.x += ease * 8;
      actor.joints.rightArm.y -= ease * 4;
      break;
    case 'avoidance':
      actor.joints.torso.x -= ease * 5;
      actor.joints.head.x -= ease * 8;
      break;
    case 'retry':
      actor.joints.head.x -= ease * 4;
      actor.joints.torso.x += ease * 3;
      break;
    case 'stillness':
    case 'pause':
    case 'neutral':
      break;
  }

  return actor;
}
