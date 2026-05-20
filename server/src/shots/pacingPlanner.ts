// Pacing Planner for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { SequencedShot } from './shotSequencer.js';
import { TransitionPlan } from './transitionPlanner.js';
import { EmotionalBeat } from '../narrative/narrativeArcGenerator.js';

export interface PacingAnalysis {
  overallTempo: TempoRating;
  shotDurationProfile: DurationProfile;
  emotionalRhythm: EmotionalRhythm;
  silenceDistribution: SilenceAnalysis;
  tensionCurve: TensionPoint[];
  pacingIssues: PacingIssue[];
  recommendations: string[];
}

export type TempoRating = 
  | 'very_slow'    // avg shot > 15s
  | 'slow'         // avg shot 10-15s
  | 'medium'       // avg shot 6-10s
  | 'fast'         // avg shot 3-6s
  | 'very_fast'    // avg shot < 3s
  | 'erratic';     // high variation

export interface DurationProfile {
  mean: number;
  median: number;
  stdDev: number;
  min: number;
  max: number;
  distribution: 'normal' | 'bimodal' | 'skewed' | 'uniform';
}

export interface EmotionalRhythm {
  beatFrequency: number; // emotional beats per minute
  intensityVariation: number; // 0-1, how much emotional intensity varies
  transitionSmoothness: number; // 0-1, how smoothly emotions transition
  peakAlignment: number; // 0-1, how well emotional peaks align with cinematic peaks
}

export interface SilenceAnalysis {
  totalSilenceSeconds: number;
  silenceRatio: number; // proportion of total duration
  longestSilence: number;
  distribution: 'clustered' | 'dispersed' | 'rhythmic';
  effectiveness: number; // 0-1, how well silence serves emotional purpose
}

export interface TensionPoint {
  timeSeconds: number;
  tension: number; // 0-1
  source: 'emotional' | 'visual' | 'temporal' | 'combined';
  description: string;
}

export interface PacingIssue {
  type: 'duration' | 'rhythm' | 'silence' | 'tension';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location: string; // time range or shot numbers
  suggestedFix: string;
}

export function analyzePacing(
  shots: SequencedShot[],
  transitions: TransitionPlan[],
  emotionalBeats: EmotionalBeat[]
): PacingAnalysis {
  // Analyze shot durations
  const durationProfile = analyzeDurationProfile(shots);
  
  // Determine overall tempo
  const overallTempo = determineTempo(durationProfile);
  
  // Analyze emotional rhythm
  const emotionalRhythm = analyzeEmotionalRhythm(shots, emotionalBeats);
  
  // Analyze silence distribution
  const silenceAnalysis = analyzeSilenceDistribution(shots);
  
  // Calculate tension curve
  const tensionCurve = calculateTensionCurve(shots, emotionalBeats);
  
  // Identify pacing issues
  const pacingIssues = identifyPacingIssues(shots, durationProfile, emotionalRhythm, silenceAnalysis);
  
  // Generate recommendations
  const recommendations = generatePacingRecommendations(pacingIssues, overallTempo);
  
  return {
    overallTempo,
    shotDurationProfile: durationProfile,
    emotionalRhythm,
    silenceDistribution: silenceAnalysis,
    tensionCurve,
    pacingIssues,
    recommendations
  };
}

function analyzeDurationProfile(shots: SequencedShot[]): DurationProfile {
  const durations = shots.map(shot => shot.durationSeconds);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const sorted = [...durations].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  const variance = durations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...durations);
  const max = Math.max(...durations);
  
  // Determine distribution type
  let distribution: DurationProfile['distribution'] = 'normal';
  const cv = stdDev / mean; // coefficient of variation
  
  if (cv > 0.5) {
    distribution = 'erratic' as any;
  } else {
    // Check for bimodality
    const histogram = createHistogram(durations, 5);
    const peaks = countPeaks(histogram);
    if (peaks >= 2) {
      distribution = 'bimodal';
    } else if (mean > median * 1.2) {
      distribution = 'skewed';
    } else if (cv < 0.2) {
      distribution = 'uniform';
    }
  }
  
  return {
    mean,
    median,
    stdDev,
    min,
    max,
    distribution
  };
}

function createHistogram(data: number[], bins: number): number[] {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const binWidth = (max - min) / bins;
  const histogram = new Array(bins).fill(0);
  
  data.forEach(value => {
    const binIndex = Math.min(Math.floor((value - min) / binWidth), bins - 1);
    histogram[binIndex]++;
  });
  
  return histogram;
}

function countPeaks(histogram: number[]): number {
  let peaks = 0;
  for (let i = 1; i < histogram.length - 1; i++) {
    if (histogram[i] > histogram[i - 1] && histogram[i] > histogram[i + 1]) {
      peaks++;
    }
  }
  return peaks;
}

function determineTempo(profile: DurationProfile): TempoRating {
  const mean = profile.mean;
  const cv = profile.stdDev / profile.mean;
  
  if (cv > 0.7) {
    return 'erratic';
  } else if (mean > 15) {
    return 'very_slow';
  } else if (mean > 10) {
    return 'slow';
  } else if (mean > 6) {
    return 'medium';
  } else if (mean > 3) {
    return 'fast';
  } else {
    return 'very_fast';
  }
}

function analyzeEmotionalRhythm(shots: SequencedShot[], beats: EmotionalBeat[]): EmotionalRhythm {
  // Calculate beat frequency (beats per minute)
  const totalDuration = shots[shots.length - 1].endTimeSeconds;
  const beatFrequency = (beats.length / totalDuration) * 60;
  
  // Calculate intensity variation
  const intensities = beats.map(beat => beat.intensity);
  const intensityMean = intensities.reduce((a, b) => a + b, 0) / intensities.length;
  const intensityVariance = intensities.reduce((a, b) => a + Math.pow(b - intensityMean, 2), 0) / intensities.length;
  const intensityVariation = Math.sqrt(intensityVariance); // 0-1 scale
  
  // Calculate transition smoothness
  let smoothnessScore = 0;
  for (let i = 1; i < beats.length; i++) {
    const emotionalDiff = Math.abs(beats[i].intensity - beats[i - 1].intensity);
    const timeDiff = beats[i].timeStart - beats[i - 1].timeEnd;
    const smoothness = 1 - (emotionalDiff / timeDiff) * 10; // Normalize
    smoothnessScore += Math.max(0, smoothness);
  }
  const transitionSmoothness = smoothnessScore / (beats.length - 1);
  
  // Calculate peak alignment
  const emotionalPeaks = beats.filter((beat, i, arr) => {
    if (i === 0) return beat.intensity > (arr[i + 1]?.intensity || 0);
    if (i === arr.length - 1) return beat.intensity > arr[i - 1].intensity;
    return beat.intensity > arr[i - 1].intensity && beat.intensity > arr[i + 1].intensity;
  });
  
  const shotPeaks = shots.filter((shot, i, arr) => {
    if (i === 0) return shot.emotionalWeight > (arr[i + 1]?.emotionalWeight || 0);
    if (i === arr.length - 1) return shot.emotionalWeight > arr[i - 1].emotionalWeight;
    return shot.emotionalWeight > arr[i - 1].emotionalWeight && shot.emotionalWeight > arr[i + 1].emotionalWeight;
  });
  
  let alignmentScore = 0;
  emotionalPeaks.forEach(ePeak => {
    const closestShotPeak = shotPeaks.reduce((closest, sPeak) => {
      const eTime = (ePeak.timeStart + ePeak.timeEnd) / 2;
      const sTime = (sPeak.startTimeSeconds + sPeak.endTimeSeconds) / 2;
      const currentDist = Math.abs(eTime - sTime);
      const closestDist = Math.abs(eTime - (closest.startTimeSeconds + closest.endTimeSeconds) / 2);
      return currentDist < closestDist ? sPeak : closest;
    }, shotPeaks[0]);
    
    const eTime = (ePeak.timeStart + ePeak.timeEnd) / 2;
    const sTime = (closestShotPeak.startTimeSeconds + closestShotPeak.endTimeSeconds) / 2;
    const timeDiff = Math.abs(eTime - sTime);
    alignmentScore += Math.max(0, 1 - timeDiff / 5); // Within 5 seconds is good alignment
  });
  
  const peakAlignment = emotionalPeaks.length > 0 ? alignmentScore / emotionalPeaks.length : 0.5;
  
  return {
    beatFrequency,
    intensityVariation,
    transitionSmoothness,
    peakAlignment
  };
}

function analyzeSilenceDistribution(shots: SequencedShot[]): SilenceAnalysis {
  // Identify silent shots (minimal camera movement, low emotional intensity)
  const silentShots = shots.filter(shot => 
    shot.cameraSpecs.movement === 'static' && 
    shot.cameraSpecs.speed < 0.2 &&
    shot.emotionalWeight < 0.4
  );
  
  const totalSilenceSeconds = silentShots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const totalDuration = shots[shots.length - 1].endTimeSeconds;
  const silenceRatio = totalSilenceSeconds / totalDuration;
  
  const longestSilence = silentShots.length > 0 
    ? Math.max(...silentShots.map(s => s.durationSeconds))
    : 0;
  
  // Determine distribution pattern
  let distribution: SilenceAnalysis['distribution'] = 'dispersed';
  if (silentShots.length > 0) {
    const silentTimes = silentShots.map(s => s.startTimeSeconds);
    const gaps = [];
    for (let i = 1; i < silentTimes.length; i++) {
      gaps.push(silentTimes[i] - silentTimes[i - 1]);
    }
    
    if (gaps.length > 0) {
      const meanGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
      const gapVariance = gaps.reduce((a, b) => a + Math.pow(b - meanGap, 2), 0) / gaps.length;
      
      if (gapVariance < meanGap * 0.3) {
        distribution = 'rhythmic';
      } else if (silentShots.length / shots.length > 0.3) {
        distribution = 'clustered';
      }
    }
  }
  
  // Calculate effectiveness (silence should occur at emotional moments)
  let effectiveness = 0.5;
  silentShots.forEach(shot => {
    if (shot.emotionalIntent.includes('contemplation') || 
        shot.emotionalIntent.includes('introspection') ||
        shot.emotionalIntent.includes('decision')) {
      effectiveness += 0.1;
    }
    if (shot.emotionalWeight > 0.6) {
      effectiveness += 0.05; // Silence at high emotion can be powerful
    }
  });
  effectiveness = Math.min(effectiveness / silentShots.length, 1);
  
  return {
    totalSilenceSeconds,
    silenceRatio,
    longestSilence,
    distribution,
    effectiveness
  };
}

function calculateTensionCurve(shots: SequencedShot[], beats: EmotionalBeat[]): TensionPoint[] {
  const points: TensionPoint[] = [];
  const sampleRate = 2; // points per second
  const totalDuration = shots[shots.length - 1].endTimeSeconds;
  const totalSamples = Math.ceil(totalDuration * sampleRate);
  
  for (let i = 0; i <= totalSamples; i++) {
    const time = i / sampleRate;
    
    // Emotional tension
    let emotionalTension = 0;
    for (const beat of beats) {
      if (time >= beat.timeStart && time <= beat.timeEnd) {
        emotionalTension = beat.intensity;
        break;
      }
    }
    
    // Visual tension (from camera and shot type)
    let visualTension = 0;
    for (const shot of shots) {
      if (time >= shot.startTimeSeconds && time <= shot.endTimeSeconds) {
        visualTension = shot.emotionalWeight;
        
        // Camera movement adds tension
        if (shot.cameraSpecs.movement !== 'static') {
          visualTension += shot.cameraSpecs.speed * 0.2;
        }
        
        // Close shots add tension
        if (shot.shotType.includes('closeup')) {
          visualTension += 0.1;
        }
        
        break;
      }
    }
    
    // Temporal tension (pace of editing)
    let temporalTension = 0;
    const recentShots = shots.filter(s => 
      s.endTimeSeconds > time - 5 && s.startTimeSeconds < time
    );
    if (recentShots.length > 0) {
      const avgShotDuration = recentShots.reduce((sum, s) => sum + s.durationSeconds, 0) / recentShots.length;
      temporalTension = 1 - (avgShotDuration / 10); // Faster editing = more tension
    }
    
    // Combined tension
    const combinedTension = (emotionalTension * 0.5 + visualTension * 0.3 + temporalTension * 0.2);
    
    // Determine primary source
    let source: TensionPoint['source'] = 'combined';
    if (emotionalTension > visualTension && emotionalTension > temporalTension) {
      source = 'emotional';
    } else if (visualTension > emotionalTension && visualTension > temporalTension) {
      source = 'visual';
    } else if (temporalTension > emotionalTension && temporalTension > visualTension) {
      source = 'temporal';
    }
    
    points.push({
      timeSeconds: time,
      tension: Math.min(Math.max(combinedTension, 0), 1),
      source,
      description: getTensionDescription(combinedTension, source)
    });
  }
  
  return points;
}

function getTensionDescription(tension: number, source: string): string {
  if (tension < 0.3) return `Low ${source} tension`;
  if (tension < 0.6) return `Moderate ${source} tension`;
  if (tension < 0.8) return `High ${source} tension`;
  return `Intense ${source} tension`;
}

function identifyPacingIssues(
  shots: SequencedShot[],
  durationProfile: DurationProfile,
  emotionalRhythm: EmotionalRhythm,
  silenceAnalysis: SilenceAnalysis
): PacingIssue[] {
  const issues: PacingIssue[] = [];
  
  // Duration issues
  if (durationProfile.stdDev > durationProfile.mean * 0.7) {
    issues.push({
      type: 'duration',
      severity: 'high',
      description: 'Erratic shot duration distribution disrupts pacing',
      location: 'Throughout sequence',
      suggestedFix: 'Normalize shot durations around mean'
    });
  }
  
  if (durationProfile.stdDev > durationProfile.mean * 0.5) {
    issues.push({
      type: 'duration',
      severity: 'medium',
      description: 'High shot duration variation',
      location: 'Throughout sequence',
      suggestedFix: 'Reduce extreme duration differences'
    });
  }
  
  // Rhythm issues
  if (emotionalRhythm.beatFrequency < 2) {
    issues.push({
      type: 'rhythm',
      severity: 'medium',
      description: 'Low emotional beat frequency may feel stagnant',
      location: 'Throughout sequence',
      suggestedFix: 'Add more emotional variation'
    });
  }
  
  if (emotionalRhythm.beatFrequency > 8) {
    issues.push({
      type: 'rhythm',
      severity: 'medium',
      description: 'High emotional beat frequency may feel rushed',
      location: 'Throughout sequence',
      suggestedFix: 'Consolidate emotional beats'
    });
  }
  
  if (emotionalRhythm.peakAlignment < 0.4) {
    issues.push({
      type: 'rhythm',
      severity: 'high',
      description: 'Poor alignment between emotional and cinematic peaks',
      location: 'Throughout sequence',
      suggestedFix: 'Align shot selection with emotional beats'
    });
  }
  
  // Silence issues
  if (silenceAnalysis.silenceRatio > 0.5) {
    issues.push({
      type: 'silence',
      severity: 'medium',
      description: 'Excessive silence may slow pacing',
      location: 'Throughout sequence',
      suggestedFix: 'Reduce proportion of silent shots'
    });
  }
  
  if (silenceAnalysis.silenceRatio < 0.1 && shots.length > 5) {
    issues.push({
      type: 'silence',
      severity: 'low',
      description: 'Minimal silence may feel relentless',
      location: 'Throughout sequence',
      suggestedFix: 'Add strategic silent moments'
    });
  }
  
  if (silenceAnalysis.effectiveness < 0.3 && silenceAnalysis.silenceRatio > 0.2) {
    issues.push({
      type: 'silence',
      severity: 'medium',
      description: 'Silence not effectively serving emotional purpose',
      location: 'Silent shots',
      suggestedFix: 'Reposition silence to emotional moments'
    });
  }
  
  // Shot-specific issues
  for (let i = 0; i < shots.length; i++) {
    const shot = shots[i];
    
    // Very long shots
    if (shot.durationSeconds > 20) {
      issues.push({
        type: 'duration',
        severity: 'medium',
        description: `Very long shot (${shot.durationSeconds.toFixed(1)}s) may test audience patience`,
        location: `Shot ${i + 1} (${shot.startTimeSeconds.toFixed(1)}-${shot.endTimeSeconds.toFixed(1)}s)`,
        suggestedFix: 'Consider breaking into multiple shots or adding camera movement'
      });
    }
    
    // Very short shots
    if (shot.durationSeconds < 2 && i > 0 && i < shots.length - 1) {
      issues.push({
        type: 'duration',
        severity: 'low',
        description: `Very short shot (${shot.durationSeconds.toFixed(1)}s) may feel abrupt`,
        location: `Shot ${i + 1} (${shot.startTimeSeconds.toFixed(1)}-${shot.endTimeSeconds.toFixed(1)}s)`,
        suggestedFix: 'Extend duration or combine with adjacent shot'
      });
    }
  }
  
  return issues;
}

function generatePacingRecommendations(issues: PacingIssue[], tempo: TempoRating): string[] {
  const recommendations: string[] = [];
  
  // General tempo-based recommendations
  if (tempo === 'very_slow') {
    recommendations.push('Consider increasing pace with shorter shots or more camera movement');
  } else if (tempo === 'very_fast') {
    recommendations.push('Consider slowing pace with longer shots to allow emotional absorption');
  } else if (tempo === 'erratic') {
    recommendations.push('Standardize shot durations for more coherent pacing');
  }
  
  // Issue-specific recommendations
  const highSeverityIssues = issues.filter(i => i.severity === 'high');
  const mediumSeverityIssues = issues.filter(i => i.severity === 'medium');
  
  if (highSeverityIssues.length > 0) {
    recommendations.push('Address high-severity pacing issues for better flow');
  }
  
  if (mediumSeverityIssues.length > 3) {
    recommendations.push('Multiple pacing issues detected - consider comprehensive revision');
  }
  
  // Positive reinforcement for good pacing
  if (issues.length === 0) {
    recommendations.push('Pacing appears well-balanced and coherent');
  }
  
  return recommendations;
}

export function getPacingSummary(analysis: PacingAnalysis): string {
  return `
Pacing Analysis Summary:
Overall Tempo: ${analysis.overallTempo}
Shot Duration: ${analysis.shotDurationProfile.mean.toFixed(1)}s avg (±${analysis.shotDurationProfile.stdDev.toFixed(1)}s)
Emotional Rhythm: ${analysis.emotionalRhythm.beatFrequency.toFixed(1)} beats/min
Silence: ${(analysis.silenceDistribution.silenceRatio * 100).toFixed(0)}% of duration
Issues: ${analysis.pacingIssues.length} (${analysis.pacingIssues.filter(i => i.severity === 'high').length} high)
  `.trim();
}