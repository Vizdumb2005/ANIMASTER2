// Cinematic Escalation System for 1-minute shorts
// Phase 10: Vertical Slice

import { EmotionalBeat, ShotSegment } from './narrativeArcGenerator.js';

export interface CinematicIntensity {
  timeSeconds: number;
  cameraTightness: number; // 0-1, 0=wide, 1=close
  movementEnergy: number; // 0-1, 0=static, 1=dynamic
  editingPace: number; // 0-1, 0=slow cuts, 1=fast cuts
  audioDensity: number; // 0-1, 0=sparse, 1=dense
  visualComplexity: number; // 0-1, 0=simple, 1=complex
}

export interface EscalationProfile {
  overallShape: 'linear' | 'parabolic' | 'sawtooth' | 'plateau';
  peakTime: number; // seconds when intensity peaks
  peakIntensity: number; // 0-1
  resolutionSlope: number; // 0-1, how steep the resolution is
}

export function analyzeEscalation(beats: EmotionalBeat[], shots: ShotSegment[]): EscalationProfile {
  // Calculate emotional intensity curve
  const emotionalIntensity = beats.map(beat => ({
    time: (beat.timeStart + beat.timeEnd) / 2,
    intensity: beat.intensity
  }));
  
  // Calculate cinematic intensity from shots
  const cinematicIntensity = shots.map(shot => ({
    time: (shot.timeStart + shot.timeEnd) / 2,
    intensity: calculateShotIntensity(shot)
  }));
  
  // Combine emotional and cinematic intensity
  const combinedIntensity = emotionalIntensity.map((emo, i) => ({
    time: emo.time,
    intensity: (emo.intensity + (cinematicIntensity[i]?.intensity || 0.5)) / 2
  }));
  
  // Find peak
  const peak = combinedIntensity.reduce((max, curr) => 
    curr.intensity > max.intensity ? curr : max, 
    { time: 0, intensity: 0 }
  );
  
  // Determine shape
  const shape = determineShape(combinedIntensity);
  
  // Calculate resolution slope (intensity drop after peak)
  const postPeak = combinedIntensity.filter(i => i.time > peak.time);
  const resolutionSlope = postPeak.length > 1 
    ? (postPeak[0].intensity - postPeak[postPeak.length - 1].intensity) / (postPeak[postPeak.length - 1].time - peak.time)
    : 0.3;
  
  return {
    overallShape: shape,
    peakTime: peak.time,
    peakIntensity: peak.intensity,
    resolutionSlope: Math.min(Math.max(resolutionSlope, 0.1), 0.9)
  };
}

function calculateShotIntensity(shot: ShotSegment): number {
  let intensity = 0.5; // Base
  
  // Shot type intensity
  const shotTypeWeights: Record<string, number> = {
    'establishing': 0.3,
    'wide': 0.4,
    'medium': 0.6,
    'closeup': 0.8,
    'extreme_closeup': 0.9,
    'tracking': 0.7,
    'insert': 0.7
  };
  intensity += (shotTypeWeights[shot.shotType] || 0.5) * 0.3;
  
  // Camera movement intensity
  const movementWeights: Record<string, number> = {
    'static': 0.3,
    'subtle drift': 0.4,
    'slow pan': 0.5,
    'slow push in': 0.6,
    'handheld': 0.7,
    'rapid pan': 0.8
  };
  intensity += (movementWeights[shot.cameraMovement] || 0.5) * 0.3;
  
  // Emotional intent intensity
  const emotionalWeights: Record<string, number> = {
    'isolation': 0.6,
    'observation': 0.4,
    'introspection': 0.7,
    'detail': 0.5,
    'loneliness': 0.6,
    'anticipation': 0.7,
    'decision': 0.8,
    'resolution': 0.4
  };
  intensity += (emotionalWeights[shot.emotionalIntent] || 0.5) * 0.4;
  
  return Math.min(Math.max(intensity, 0), 1);
}

function determineShape(intensityPoints: Array<{time: number, intensity: number}>): 'linear' | 'parabolic' | 'sawtooth' | 'plateau' {
  if (intensityPoints.length < 3) return 'linear';
  
  // Calculate slope changes
  const slopes: number[] = [];
  for (let i = 1; i < intensityPoints.length; i++) {
    const slope = (intensityPoints[i].intensity - intensityPoints[i-1].intensity) / 
                  (intensityPoints[i].time - intensityPoints[i-1].time);
    slopes.push(slope);
  }
  
  // Count slope direction changes
  let directionChanges = 0;
  for (let i = 1; i < slopes.length; i++) {
    if ((slopes[i] > 0 && slopes[i-1] < 0) || (slopes[i] < 0 && slopes[i-1] > 0)) {
      directionChanges++;
    }
  }
  
  // Determine shape based on direction changes
  if (directionChanges > 3) return 'sawtooth';
  
  // Check for plateau (long period of similar intensity)
  const intensityRange = Math.max(...intensityPoints.map(i => i.intensity)) - 
                        Math.min(...intensityPoints.map(i => i.intensity));
  if (intensityRange < 0.3) return 'plateau';
  
  // Check for parabolic (single peak)
  const peakIndex = intensityPoints.reduce((maxIdx, _, idx, arr) => 
    arr[idx].intensity > arr[maxIdx].intensity ? idx : maxIdx, 0);
  
  const beforePeak = intensityPoints.slice(0, peakIndex);
  const afterPeak = intensityPoints.slice(peakIndex + 1);
  
  const beforeIncreasing = beforePeak.every((point, idx, arr) => 
    idx === 0 || point.intensity >= arr[idx-1].intensity);
  const afterDecreasing = afterPeak.every((point, idx, arr) => 
    idx === 0 || point.intensity <= arr[idx-1].intensity);
  
  if (beforeIncreasing && afterDecreasing) return 'parabolic';
  
  return 'linear';
}

export function generateCinematicIntensityCurve(
  profile: EscalationProfile,
  durationSeconds: number,
  sampleRate: number = 1 // samples per second
): CinematicIntensity[] {
  const points: CinematicIntensity[] = [];
  const totalSamples = Math.floor(durationSeconds * sampleRate);
  
  for (let i = 0; i < totalSamples; i++) {
    const time = i / sampleRate;
    const normalizedTime = time / durationSeconds;
    
    // Calculate base intensity based on profile shape
    let baseIntensity = 0.5;
    
    switch (profile.overallShape) {
      case 'linear':
        baseIntensity = normalizedTime * 0.5 + 0.3;
        break;
      case 'parabolic':
        // Parabola peaking at profile.peakTime
        const peakNormalized = profile.peakTime / durationSeconds;
        const distanceFromPeak = Math.abs(normalizedTime - peakNormalized);
        baseIntensity = profile.peakIntensity * (1 - distanceFromPeak / peakNormalized);
        break;
      case 'sawtooth':
        // Oscillating intensity
        baseIntensity = 0.4 + 0.3 * Math.sin(normalizedTime * Math.PI * 4);
        break;
      case 'plateau':
        baseIntensity = 0.6;
        break;
    }
    
    // Add time-based variation
    const timeVariation = 0.1 * Math.sin(normalizedTime * Math.PI * 2);
    const finalIntensity = Math.min(Math.max(baseIntensity + timeVariation, 0.1), 0.9);
    
    // Generate correlated cinematic parameters
    const cameraTightness = finalIntensity * 0.8 + 0.1;
    const movementEnergy = finalIntensity * 0.7 + 0.2;
    const editingPace = finalIntensity * 0.6 + 0.2;
    const audioDensity = finalIntensity * 0.5 + 0.3;
    const visualComplexity = finalIntensity * 0.4 + 0.3;
    
    points.push({
      timeSeconds: time,
      cameraTightness,
      movementEnergy,
      editingPace,
      audioDensity,
      visualComplexity
    });
  }
  
  return points;
}

export function getEscalationRecommendations(profile: EscalationProfile): string[] {
  const recommendations: string[] = [];
  
  switch (profile.overallShape) {
    case 'linear':
      recommendations.push(
        "Consider adding emotional peaks to create more dynamic progression",
        "Introduce midpoint escalation to maintain audience engagement"
      );
      break;
    case 'parabolic':
      recommendations.push(
        "Ensure peak intensity aligns with emotional climax",
        "Build tension gradually before peak, release smoothly after"
      );
      break;
    case 'sawtooth':
      recommendations.push(
        "Consider smoothing intensity oscillations for more coherent flow",
        "Use intensity variations to punctuate emotional beats"
      );
      break;
    case 'plateau':
      recommendations.push(
        "Introduce intensity variation to create emotional journey",
        "Consider adding subtle escalation throughout"
      );
      break;
  }
  
  if (profile.peakIntensity < 0.6) {
    recommendations.push("Consider increasing peak intensity for stronger emotional impact");
  }
  
  if (profile.resolutionSlope < 0.2) {
    recommendations.push("Consider sharper resolution for clearer emotional conclusion");
  }
  
  if (profile.resolutionSlope > 0.7) {
    recommendations.push("Consider gentler resolution for more satisfying emotional release");
  }
  
  return recommendations;
}

export function validateEscalationCoherence(
  profile: EscalationProfile,
  durationSeconds: number
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  if (profile.peakTime < durationSeconds * 0.2) {
    issues.push("Peak occurs too early (before 20% of duration)");
  }
  
  if (profile.peakTime > durationSeconds * 0.9) {
    issues.push("Peak occurs too late (after 90% of duration)");
  }
  
  if (profile.peakIntensity < 0.4) {
    issues.push("Peak intensity too low for emotional impact");
  }
  
  if (profile.resolutionSlope < 0.1 && profile.peakTime < durationSeconds * 0.8) {
    issues.push("Resolution too gradual after peak");
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}