import type { ActorEmotion, PoseProfile } from '@animaster/shared/scene';

const poseProfiles: Record<ActorEmotion, PoseProfile> = {
  neutral: { torsoAngle: 0, headTilt: 0, armSpread: 1.0, stanceWidth: 1.0, centerOfGravityY: 0, shoulderSquare: 1.0 },
  sad: { torsoAngle: 8, headTilt: 12, armSpread: 0.7, stanceWidth: 0.85, centerOfGravityY: 6, shoulderSquare: 0.7 },
  happy: { torsoAngle: -3, headTilt: -5, armSpread: 1.3, stanceWidth: 1.1, centerOfGravityY: -3, shoulderSquare: 1.1 },
  nervous: { torsoAngle: 4, headTilt: 5, armSpread: 0.6, stanceWidth: 0.75, centerOfGravityY: 3, shoulderSquare: 0.6 },
  excited: { torsoAngle: -5, headTilt: -4, armSpread: 1.4, stanceWidth: 1.2, centerOfGravityY: -5, shoulderSquare: 1.2 },
  awkward: { torsoAngle: 6, headTilt: 8, armSpread: 0.65, stanceWidth: 0.8, centerOfGravityY: 2, shoulderSquare: 0.5 },
  angry: { torsoAngle: -6, headTilt: -3, armSpread: 1.2, stanceWidth: 1.15, centerOfGravityY: -2, shoulderSquare: 1.3 },
  exhausted: { torsoAngle: 15, headTilt: 18, armSpread: 0.5, stanceWidth: 0.9, centerOfGravityY: 10, shoulderSquare: 0.4 },
};

export function getPoseProfile(emotion: ActorEmotion): PoseProfile {
  return poseProfiles[emotion];
}

export function interpolatePose(from: PoseProfile, to: PoseProfile, t: number): PoseProfile {
  const lerp = (a: number, b: number) => a + (b - a) * t;
  return {
    torsoAngle: lerp(from.torsoAngle, to.torsoAngle),
    headTilt: lerp(from.headTilt, to.headTilt),
    armSpread: lerp(from.armSpread, to.armSpread),
    stanceWidth: lerp(from.stanceWidth, to.stanceWidth),
    centerOfGravityY: lerp(from.centerOfGravityY, to.centerOfGravityY),
    shoulderSquare: lerp(from.shoulderSquare, to.shoulderSquare),
  };
}
