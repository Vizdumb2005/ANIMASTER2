import type { Camera, AttentionFocus, Actor } from '@animaster/shared/scene';

export function applyAttentionCameraBias(camera: Camera, focus: AttentionFocus, actors: Actor[]): Camera {
  const updated = { ...camera };
  const primary = actors.find((a) => a.id === focus.primaryTarget);
  if (!primary) return updated;

  const targetX = primary.position.x;
  const targetY = primary.position.y - 40;

  const lerpFactor = 0.03 + focus.focusIntensity * 0.04;
  updated.x += (targetX - updated.x) * lerpFactor;
  updated.y += (targetY - updated.y) * lerpFactor;

  if (focus.motionContrast > 0.3) {
    const zoomBoost = 1 + focus.motionContrast * 0.15;
    updated.zoom = Math.min(2, (updated.zoom ?? 1) * zoomBoost);
  }

  return updated;
}
