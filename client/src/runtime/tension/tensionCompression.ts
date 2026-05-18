import type { Actor, TensionState, Environment } from '@animaster/shared/scene';

export function applyTensionCompression(actors: Actor[], tension: TensionState, env: Environment): Actor[] {
  if (tension.currentLevel < 0.1 || actors.length < 2) return actors;

  const compression = tension.compressionFactor;
  const centerX = env.width * 0.5;

  return actors.map((actor) => {
    const clone = { ...actor, position: { ...actor.position }, joints: {
      head: { ...actor.joints.head },
      torso: { ...actor.joints.torso },
      leftArm: { ...actor.joints.leftArm },
      rightArm: { ...actor.joints.rightArm },
      leftLeg: { ...actor.joints.leftLeg },
      rightLeg: { ...actor.joints.rightLeg }
    } };

    const dx = clone.position.x - centerX;
    clone.position.x = centerX + dx * compression;

    if (tension.currentLevel > 0.5) {
      clone.joints.leftArm.x += tension.currentLevel * 2;
      clone.joints.rightArm.x -= tension.currentLevel * 2;
      clone.joints.torso.y += tension.currentLevel * 1.5;
    }

    return clone;
  });
}
