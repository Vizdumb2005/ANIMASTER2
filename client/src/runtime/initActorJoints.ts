import { StickmanJoints, Vector2 } from '@animaster/shared/scene';

export function initActorJoints(position: Vector2): StickmanJoints {
  return {
    head: { x: position.x, y: position.y - 58 },
    torso: { x: position.x, y: position.y - 30 },
    leftArm: { x: position.x - 28, y: position.y - 10 },
    rightArm: { x: position.x + 28, y: position.y - 10 },
    leftLeg: { x: position.x - 18, y: position.y + 42 },
    rightLeg: { x: position.x + 18, y: position.y + 42 }
  };
}