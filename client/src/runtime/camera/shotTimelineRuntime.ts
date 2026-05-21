import type { SceneGraph, CameraMode } from '@animaster/shared/scene';
import type { CinematicShot } from '@animaster/shared/cinematicShots';

// Helper to linearly interpolate between numbers
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

// Sample tension curve at a specific progress [0, 1]
function sampleTensionCurve(curve: number[] | undefined, progress: number): number {
  if (!curve || curve.length === 0) return 0.5;
  if (curve.length === 1) return curve[0];
  
  const totalSegments = curve.length - 1;
  const rawIndex = progress * totalSegments;
  const index = Math.floor(rawIndex);
  const frac = rawIndex - index;
  
  if (index >= totalSegments) return curve[curve.length - 1];
  return lerp(curve[index], curve[index + 1], frac);
}

// Map shotType to CameraMode
function mapShotTypeToCameraMode(shotType: string, actorCount: number): CameraMode {
  switch (shotType) {
    case 'establishing':
    case 'wide':
    case 'isolation':
      return 'wide_shot';
    case 'closeup':
    case 'reaction':
      return 'close_up';
    case 'extreme_closeup':
    case 'insert':
      return 'dramatic_zoom';
    case 'medium':
      return actorCount >= 2 ? 'tension' : 'follow';
    case 'tracking':
      return 'follow';
    default:
      return 'static';
  }
}

export function evaluateShotTimeline(scene: SceneGraph, deltaMs: number): void {
  // If no sequence exists, do nothing
  if (!scene.shotSequence || scene.shotSequence.length === 0) return;

  // Initialize playback fields if not set
  if (scene.isTimelinePlaying === undefined) {
    scene.isTimelinePlaying = true;
  }
  if (!scene.activeShotId) {
    scene.activeShotId = scene.shotSequence[0].id;
  }
  if (scene.shotElapsedMs === undefined) {
    scene.shotElapsedMs = 0;
  }
  if (scene.timelineTimeMs === undefined) {
    scene.timelineTimeMs = 0;
  }

  // Find active shot
  let shotIndex = scene.shotSequence.findIndex(s => s.id === scene.activeShotId);
  if (shotIndex === -1) {
    shotIndex = 0;
    scene.activeShotId = scene.shotSequence[0].id;
  }

  const currentShot = scene.shotSequence[shotIndex];
  const shotDurationMs = currentShot.pacing.duration * 1000;

  // Update time if playing
  if (scene.isTimelinePlaying) {
    scene.shotElapsedMs += deltaMs;
    scene.timelineTimeMs += deltaMs;

    // Check shot completion
    if (scene.shotElapsedMs >= shotDurationMs) {
      // Transition to next shot
      const nextIndex = (shotIndex + 1) % scene.shotSequence.length;
      const nextShot = scene.shotSequence[nextIndex];
      scene.activeShotId = nextShot.id;
      scene.shotElapsedMs = 0;
      
      // Trigger entrance event cues for the next shot
      triggerShotCue(scene, nextShot);
    }
  }

  // Calculate current shot progress
  const progress = Math.min(1, scene.shotElapsedMs / Math.max(1, shotDurationMs));

  // 1. Interpolate Tension Level
  const currentTension = sampleTensionCurve(currentShot.pacing.tensionCurve, progress);
  if (!scene.tensionState) {
    scene.tensionState = {
      currentLevel: currentTension,
      peakLevel: currentTension,
      escalationRate: 0,
      compressionFactor: 1.0,
      cameraIntensityBoost: 0.0
    };
  } else {
    scene.tensionState.currentLevel = currentTension;
  }

  // 2. Map Camera Settings
  const cameraMode = mapShotTypeToCameraMode(currentShot.shotType, scene.actors.length);
  scene.camera.mode = cameraMode;
  
  // Map distance to zoom (e.g. 12 -> 0.7, 6 -> 1.2, 2.5 -> 2.0)
  const targetZoom = Math.min(2.5, Math.max(0.5, 5 / currentShot.camera.distance));
  scene.camera.zoom = targetZoom;
  
  if (scene.camera.shot) {
    scene.camera.shot.targetZoom = targetZoom;
  }

  // 3. Interpolate Atmosphere & Lighting
  // Smoothly blend fog/ambient intensity in the first 1000ms of a new shot
  const blendDurationMs = 1000;
  const prevShotIndex = shotIndex === 0 ? scene.shotSequence.length - 1 : shotIndex - 1;
  const prevShot = scene.shotSequence[prevShotIndex];
  
  const targetFog = currentShot.atmosphere.fogDensity;
  const sourceFog = prevShot.atmosphere.fogDensity;
  
  const blendFactor = Math.min(1, scene.shotElapsedMs / blendDurationMs);
  const activeFogDensity = lerp(sourceFog, targetFog, blendFactor);
  
  // Set in scene environment Reaction or directly on environment
  if (!scene.environmentReaction) {
    scene.environmentReaction = {
      suggestedEffects: currentShot.atmosphere.ambience,
      lightingShift: currentShot.atmosphere.lighting,
      ambientIntensityDelta: 0,
      emptinessLevel: currentShot.shotType === 'isolation' ? 0.8 : 0.2
    };
  } else {
    scene.environmentReaction.suggestedEffects = currentShot.atmosphere.ambience;
    scene.environmentReaction.lightingShift = currentShot.atmosphere.lighting;
    scene.environmentReaction.emptinessLevel = currentShot.shotType === 'isolation' ? 0.8 : 0.2;
  }

  // Update atmosphere profile
  if (scene.atmosphere) {
    scene.atmosphere.ambientIntensity = lerp(
      prevShot.shotType === 'isolation' ? 0.4 : 1.0,
      currentShot.shotType === 'isolation' ? 0.4 : 1.0,
      blendFactor
    );
  }
}

// Cues triggered exactly when a shot starts
function triggerShotCue(scene: SceneGraph, shot: CinematicShot): void {
  const emotionalIntent = shot.emotionalIntent.toLowerCase();

  // FIX: Previously, the shot timeline force-overwrote actor emotionState on
  // every shot transition. This clobbered the AI Director's emotional arc.
  // Now, shot cues only INFLUENCE emotion — they nudge intensity and
  // add semantic tags rather than replacing the emotion state.

  scene.actors.forEach((actor, index) => {
    // Influence emotion intensity based on shot emotional intent
    if (emotionalIntent.includes('sad')) {
      actor.emotionIntensity = Math.min(1, (actor.emotionIntensity ?? 0.5) + 0.1);
    } else if (emotionalIntent.includes('tense') || emotionalIntent.includes('nervous')) {
      actor.emotionIntensity = Math.min(1, (actor.emotionIntensity ?? 0.5) + 0.15);
    } else if (emotionalIntent.includes('angry') || emotionalIntent.includes('combat')) {
      actor.emotionIntensity = Math.min(1, (actor.emotionIntensity ?? 0.5) + 0.2);
    } else if (emotionalIntent.includes('happy') || emotionalIntent.includes('warm')) {
      actor.emotionIntensity = Math.max(0, (actor.emotionIntensity ?? 0.5) - 0.1);
    } else if (emotionalIntent.includes('exhausted')) {
      actor.emotionIntensity = Math.max(0, (actor.emotionIntensity ?? 0.5) - 0.15);
    }

    // Action cues remain unchanged (these don't conflict with emotion state)
    if (shot.shotType === 'reaction' && index === 1 && scene.actors[0]) {
      actor.currentAction = 'idle';
      if (actor.joints) {
        actor.joints.head.x = actor.position.x - 2;
      }
    }
  });

  // Track motif occurrence in narrative state
  if (scene.narrativeState) {
    const key = shot.emotionalIntent;
    scene.narrativeState.motifOccurrences[key] = (scene.narrativeState.motifOccurrences[key] || 0) + 1;
  }
}
