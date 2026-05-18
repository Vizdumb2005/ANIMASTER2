import type { Actor, PoseProfile } from '@animaster/shared/scene';
import { getPoseProfile, interpolatePose } from './poseRegistry';

export function applyPoseProfile(actor: Actor, profile: PoseProfile, intensity: number): Actor {
  const scale = Math.min(intensity, 1);

  actor.joints.torso.y += profile.centerOfGravityY * scale;
  actor.joints.head.y += profile.headTilt * scale;
  actor.joints.head.x += profile.torsoAngle * scale * 0.3;

  const armBase = 28;
  const armOffset = (profile.armSpread - 1.0) * armBase * scale;
  actor.joints.leftArm.x -= armOffset;
  actor.joints.rightArm.x += armOffset;

  const legBase = 18;
  const legOffset = (profile.stanceWidth - 1.0) * legBase * scale;
  actor.joints.leftLeg.x -= legOffset;
  actor.joints.rightLeg.x += legOffset;

  const shoulderOffset = (profile.shoulderSquare - 1.0) * 6 * scale;
  actor.joints.leftArm.y -= shoulderOffset;
  actor.joints.rightArm.y -= shoulderOffset;

  return actor;
}

const previousEmotions = new Map<string, { emotion: string; transitionProgress: number }>();

export function resetPoseTransitions(): void {
  previousEmotions.clear();
}

export function applyPoseWithTransition(actor: Actor, deltaMs: number): Actor {
  const prev = previousEmotions.get(actor.id);
  const intensity = actor.emotionIntensity ?? 0.5;

  if (!prev || prev.emotion === actor.emotionState) {
    previousEmotions.set(actor.id, { emotion: actor.emotionState, transitionProgress: 1 });
    const profile = getPoseProfile(actor.emotionState);
    return applyPoseProfile(actor, profile, intensity);
  }

  const transitionSpeed = 0.002;
  const isNewTransition = prev.transitionProgress >= 1;
  const baseProgress = isNewTransition ? 0 : prev.transitionProgress;
  const newProgress = Math.min(baseProgress + deltaMs * transitionSpeed, 1);
  previousEmotions.set(actor.id, { emotion: newProgress >= 1 ? actor.emotionState : prev.emotion, transitionProgress: newProgress >= 1 ? 1 : newProgress });

  const fromProfile = getPoseProfile(prev.emotion as Actor['emotionState']);
  const toProfile = getPoseProfile(actor.emotionState);
  const blended = interpolatePose(fromProfile, toProfile, newProgress);

  return applyPoseProfile(actor, blended, intensity);
}
