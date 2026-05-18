import type { Actor, PowerDynamic, Environment } from '@animaster/shared/scene';

export function applyPowerAwareStaging(actors: Actor[], dynamics: PowerDynamic[], env: Environment): Actor[] {
  if (dynamics.length === 0) return actors;

  return actors.map((actor) => {
    const clone = { ...actor, position: { ...actor.position }, joints: {
      head: { ...actor.joints.head },
      torso: { ...actor.joints.torso },
      leftArm: { ...actor.joints.leftArm },
      rightArm: { ...actor.joints.rightArm },
      leftLeg: { ...actor.joints.leftLeg },
      rightLeg: { ...actor.joints.rightLeg }
    } };

    for (const dyn of dynamics) {
      if (dyn.actorAId !== actor.id && dyn.actorBId !== actor.id) continue;

      const isDominant = dyn.dominantActorId === actor.id;
      const isSubmissive = dyn.submissiveActorId === actor.id;

      if (isDominant) {
        clone.joints.torso.y -= 2;
        clone.joints.leftArm.x -= 3;
        clone.joints.rightArm.x += 3;
      }

      if (isSubmissive) {
        clone.joints.torso.y += 2;
        clone.joints.leftArm.x += 2;
        clone.joints.rightArm.x -= 2;
        clone.joints.head.y += 3;
      }

      if (dyn.dynamicType === 'pursuit') {
        const other = actors.find((a) => a.id === (dyn.actorAId === actor.id ? dyn.actorBId : dyn.actorAId));
        if (other && isDominant) {
          const dx = other.position.x - clone.position.x;
          clone.position.x += Math.sign(dx) * 0.3;
        }
      }

      if (dyn.dynamicType === 'withdrawal') {
        const other = actors.find((a) => a.id === (dyn.actorAId === actor.id ? dyn.actorBId : dyn.actorAId));
        if (other && isSubmissive) {
          const dx = clone.position.x - other.position.x;
          clone.position.x += Math.sign(dx) * 0.2;
        }
      }
    }

    return clone;
  });
}
