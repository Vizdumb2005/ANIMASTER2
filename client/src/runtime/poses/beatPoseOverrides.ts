import type { Actor, EmotionalBeatAction, PoseProfile } from '@animaster/shared/scene';
import { applyPoseProfile } from './poseResolver';

const beatPoseOverrides: Partial<Record<EmotionalBeatAction, PoseProfile>> = {
  freeze: { torsoAngle: 0, headTilt: 2, armSpread: 0.8, stanceWidth: 0.9, centerOfGravityY: 1, shoulderSquare: 0.9 },
  collapse: { torsoAngle: 20, headTilt: 25, armSpread: 0.4, stanceWidth: 0.85, centerOfGravityY: 15, shoulderSquare: 0.3 },
  recoil: { torsoAngle: -8, headTilt: -5, armSpread: 0.5, stanceWidth: 1.1, centerOfGravityY: -3, shoulderSquare: 0.7 },
  look_away: { torsoAngle: 5, headTilt: 10, armSpread: 0.75, stanceWidth: 0.95, centerOfGravityY: 2, shoulderSquare: 0.8 },
  avoidance: { torsoAngle: 8, headTilt: 12, armSpread: 0.6, stanceWidth: 0.8, centerOfGravityY: 3, shoulderSquare: 0.5 },
};

export function applyBeatPoseOverride(actor: Actor, beatAction: EmotionalBeatAction, progress: number): Actor {
  const override = beatPoseOverrides[beatAction];
  if (!override) return actor;

  const intensity = Math.sin(progress * Math.PI) * 0.6;
  return applyPoseProfile(actor, override, intensity);
}
