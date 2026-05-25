// Shot Sequencer for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { PlannedShot, CameraSpecs, FramingSpecs, TransitionSpecs } from './shotPlanner.js';
import { EmotionalBeat } from '../narrative/narrativeArcGenerator.js';
import { ShotType } from '../types/sharedTypes.js';

export interface ShotSequence {
  id: string;
  shots: SequencedShot[];
  totalDurationSeconds: number;
  emotionalArc: EmotionalArcPoint[];
  pacingProfile: PacingProfile;
  continuityRules: ContinuityRule[];
}

export interface SequencedShot extends PlannedShot {
  sequencePosition: number;
  startTimeSeconds: number;
  endTimeSeconds: number;
  transitionStartTime?: number;
  transitionEndTime?: number;
  emotionalContext: EmotionalContext;
  durationSeconds: number;
  cameraSpecs: CameraSpecs;
  emotionalWeight: number;
  transition: TransitionSpecs;
  shotType: ShotType;
  emotionalIntent: string;
}

export interface EmotionalArcPoint {
  timeSeconds: number;
  emotion: string;
  intensity: number;
  shotInfluence: number; // 0-1, how much shot affects emotion
}

export interface PacingProfile {
  tempo: 'very_slow' | 'slow' | 'medium' | 'fast' | 'very_fast';
  shotDurationMean: number;
  shotDurationStdDev: number;
  transitionRatio: number; // proportion of time spent in transitions
  silenceRatio: number; // proportion of time with minimal movement
}

export interface ContinuityRule {
  type: 'spatial' | 'temporal' | 'emotional' | 'visual';
  description: string;
  enforced: boolean;
}

export interface EmotionalContext {
  primaryEmotion: string;
  secondaryEmotion?: string;
  intensity: number;
  physicalManifestation: string;
  gazeDirection: string;
}

export function sequenceShots(
  plannedShots: PlannedShot[],
  emotionalBeats: EmotionalBeat[]
): ShotSequence {
  const sequenceId = `sequence_${Date.now()}`;
  const sequencedShots: SequencedShot[] = [];
  
  let currentTime = 0;
  
  // Sequence each shot with timing
  for (let i = 0; i < plannedShots.length; i++) {
    const shot = plannedShots[i];
    const emotionalContext = getEmotionalContextForTime(emotionalBeats, currentTime);
    
    const sequencedShot: SequencedShot = {
      ...shot,
      sequencePosition: i + 1,
      startTimeSeconds: currentTime,
      endTimeSeconds: currentTime + shot.durationSeconds,
      emotionalContext,
      transitionStartTime: currentTime + shot.durationSeconds - shot.transition.durationSeconds,
      transitionEndTime: currentTime + shot.durationSeconds
    };
    
    sequencedShots.push(sequencedShot);
    currentTime += shot.durationSeconds;
  }
  
  // Calculate emotional arc points
  const emotionalArc = calculateEmotionalArc(sequencedShots, emotionalBeats);
  
  // Analyze pacing
  const pacingProfile = analyzePacing(sequencedShots);
  
  // Generate continuity rules
  const continuityRules = generateContinuityRules(sequencedShots);
  
  return {
    id: sequenceId,
    shots: sequencedShots,
    totalDurationSeconds: currentTime,
    emotionalArc,
    pacingProfile,
    continuityRules
  };
}

function getEmotionalContextForTime(
  beats: EmotionalBeat[],
  timeSeconds: number
): EmotionalContext {
  // Find the beat that contains this time
  for (const beat of beats) {
    if (timeSeconds >= beat.timeStart && timeSeconds <= beat.timeEnd) {
      return {
        primaryEmotion: beat.emotion,
        intensity: beat.intensity,
        physicalManifestation: getPhysicalManifestationForEmotion(beat.emotion, beat.intensity),
        gazeDirection: getGazeDirectionForEmotion(beat.emotion)
      };
    }
  }
  
  // Fallback to nearest beat
  const nearestBeat = beats.reduce((nearest, beat) => {
    const beatMid = (beat.timeStart + beat.timeEnd) / 2;
    const currentDist = Math.abs(beatMid - timeSeconds);
    const nearestDist = Math.abs((nearest.timeStart + nearest.timeEnd) / 2 - timeSeconds);
    return currentDist < nearestDist ? beat : nearest;
  }, beats[0]);
  
  return {
    primaryEmotion: nearestBeat.emotion,
    intensity: nearestBeat.intensity,
    physicalManifestation: getPhysicalManifestationForEmotion(nearestBeat.emotion, nearestBeat.intensity),
    gazeDirection: getGazeDirectionForEmotion(nearestBeat.emotion)
  };
}

function getPhysicalManifestationForEmotion(emotion: string, intensity: number): string {
  const manifestations: Record<string, string[]> = {
    'loneliness': ['slumped shoulders', 'slow movements', 'downward gaze'],
    'anticipation': ['fidgeting hands', 'checking watch', 'shifting weight'],
    'melancholy': ['stillness', 'deep breaths', 'distant gaze'],
    'tension': ['tense shoulders', 'clenched hands', 'rapid eye movement'],
    'unresolved': ['hesitant posture', 'uncertain stance', 'glancing around']
  };
  
  const options = manifestations[emotion] || ['neutral posture'];
  const intensityMod = intensity > 0.7 ? 'pronounced ' : intensity < 0.3 ? 'subtle ' : '';
  return intensityMod + options[Math.floor(Math.random() * options.length)];
}

function getGazeDirectionForEmotion(emotion: string): string {
  const gazeMap: Record<string, string[]> = {
    'loneliness': ['downward', 'distant', 'empty space'],
    'anticipation': ['horizon', 'expected direction', 'checking points'],
    'melancholy': ['middle distance', 'memory focus', 'internal'],
    'tension': ['scanning', 'fixed on threat', 'avoidant'],
    'unresolved': ['uncertain', 'shifting', 'avoiding decision']
  };
  
  const options = gazeMap[emotion] || ['forward'];
  return options[Math.floor(Math.random() * options.length)];
}

function calculateEmotionalArc(
  shots: SequencedShot[],
  beats: EmotionalBeat[]
): EmotionalArcPoint[] {
  const arcPoints: EmotionalArcPoint[] = [];
  const sampleRate = 2; // points per second
  
  const totalDuration = shots[shots.length - 1].endTimeSeconds;
  const totalSamples = Math.ceil(totalDuration * sampleRate);
  
  for (let i = 0; i <= totalSamples; i++) {
    const time = i / sampleRate;
    
    // Find emotional beat at this time
    let emotion = 'neutral';
    let intensity = 0.5;
    
    for (const beat of beats) {
      if (time >= beat.timeStart && time <= beat.timeEnd) {
        emotion = beat.emotion;
        intensity = beat.intensity;
        break;
      }
    }
    
    // Find shot influence (closeness to shot center)
    let shotInfluence = 0;
    for (const shot of shots) {
      const shotCenter = (shot.startTimeSeconds + shot.endTimeSeconds) / 2;
      const distance = Math.abs(time - shotCenter);
      const shotDuration = shot.durationSeconds;
      
      // Influence is highest at shot center, decreases toward edges
      const influence = Math.max(0, 1 - (distance / (shotDuration / 2)));
      shotInfluence = Math.max(shotInfluence, influence);
    }
    
    arcPoints.push({
      timeSeconds: time,
      emotion,
      intensity,
      shotInfluence
    });
  }
  
  return arcPoints;
}

function analyzePacing(shots: SequencedShot[]): PacingProfile {
  const durations = shots.map(shot => shot.durationSeconds);
  const mean = durations.reduce((a, b) => a + b, 0) / durations.length;
  const variance = durations.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / durations.length;
  const stdDev = Math.sqrt(variance);
  
  // Calculate transition time ratio
  const totalTransitionTime = shots.reduce((sum, shot) => 
    sum + (shot.transition.durationSeconds || 0), 0);
  const totalDuration = shots[shots.length - 1].endTimeSeconds;
  const transitionRatio = totalTransitionTime / totalDuration;
  
  // Calculate silence ratio (shots with minimal movement)
  const silentShots = shots.filter(shot => 
    shot.cameraSpecs.movement === 'static' && 
    shot.cameraSpecs.speed < 0.2
  );
  const silentTime = silentShots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const silenceRatio = silentTime / totalDuration;
  
  // Determine tempo based on average shot duration
  let tempo: PacingProfile['tempo'] = 'medium';
  if (mean < 3) tempo = 'very_fast';
  else if (mean < 6) tempo = 'fast';
  else if (mean < 10) tempo = 'medium';
  else if (mean < 15) tempo = 'slow';
  else tempo = 'very_slow';
  
  return {
    tempo,
    shotDurationMean: mean,
    shotDurationStdDev: stdDev,
    transitionRatio,
    silenceRatio
  };
}

function generateContinuityRules(shots: SequencedShot[]): ContinuityRule[] {
  const rules: ContinuityRule[] = [];
  
  // Spatial continuity
  rules.push({
    type: 'spatial',
    description: 'Maintain consistent screen direction for character movement',
    enforced: true
  });
  
  rules.push({
    type: 'spatial',
    description: 'Preserve spatial relationships between shots in same location',
    enforced: true
  });
  
  // Temporal continuity
  rules.push({
    type: 'temporal',
    description: 'Maintain consistent time flow between sequential shots',
    enforced: true
  });
  
  // Emotional continuity
  rules.push({
    type: 'emotional',
    description: 'Ensure emotional progression follows narrative arc',
    enforced: true
  });
  
  // Visual continuity
  rules.push({
    type: 'visual',
    description: 'Maintain consistent lighting and color palette',
    enforced: true
  });
  
  rules.push({
    type: 'visual',
    description: 'Preserve atmospheric effects continuity (rain, fog intensity)',
    enforced: true
  });
  
  // Shot-specific rules
  for (let i = 1; i < shots.length; i++) {
    const prev = shots[i - 1];
    const curr = shots[i];
    
    // Check for extreme camera angle changes
    if ((prev.cameraSpecs.angle === 'low' && curr.cameraSpecs.angle === 'high') ||
        (prev.cameraSpecs.angle === 'high' && curr.cameraSpecs.angle === 'low')) {
      rules.push({
        type: 'visual',
        description: `Mitigate jarring angle change from ${prev.cameraSpecs.angle} to ${curr.cameraSpecs.angle} between shots ${i} and ${i + 1}`,
        enforced: false
      });
    }
    
    // Check for emotional jumps
    const emotionalDiff = Math.abs(prev.emotionalWeight - curr.emotionalWeight);
    if (emotionalDiff > 0.5 && prev.transition.type === 'cut') {
      rules.push({
        type: 'emotional',
        description: `Smooth emotional transition between shots ${i} and ${i + 1} (Δ=${emotionalDiff.toFixed(2)})`,
        enforced: false
      });
    }
  }
  
  return rules;
}

export function validateSequenceContinuity(sequence: ShotSequence): { valid: boolean; violations: string[] } {
  const violations: string[] = [];
  
  // Check temporal continuity
  for (let i = 1; i < sequence.shots.length; i++) {
    const prev = sequence.shots[i - 1];
    const curr = sequence.shots[i];
    
    // Check for time gaps or overlaps
    const gap = curr.startTimeSeconds - prev.endTimeSeconds;
    if (Math.abs(gap) > 0.1) {
      violations.push(`Temporal discontinuity between shots ${i} and ${i + 1}: ${gap.toFixed(2)}s gap`);
    }
    
    // Check for spatial continuity violations
    if (prev.cameraSpecs.angle === 'low' && curr.cameraSpecs.angle === 'high' && 
        prev.transition.type === 'cut') {
      violations.push(`Spatial discontinuity: jarring angle change (low->high) with cut transition`);
    }
  }
  
  // Check emotional arc coherence
  const emotionalChanges = sequence.emotionalArc.filter((point, idx, arr) => 
    idx > 0 && Math.abs(point.intensity - arr[idx - 1].intensity) > 0.4
  );
  
  if (emotionalChanges.length > 3) {
    violations.push(`Excessive emotional volatility: ${emotionalChanges.length} sharp intensity changes`);
  }
  
  // Check pacing consistency
  if (sequence.pacingProfile.shotDurationStdDev > sequence.pacingProfile.shotDurationMean * 0.8) {
    violations.push(`Inconsistent pacing: high shot duration variation (std dev = ${sequence.pacingProfile.shotDurationStdDev.toFixed(1)}s)`);
  }
  
  return {
    valid: violations.length === 0,
    violations
  };
}

export function getSequenceTimeline(sequence: ShotSequence): string {
  const timeline = sequence.shots.map(shot => 
    `${shot.sequencePosition}. ${shot.shotType} (${shot.durationSeconds.toFixed(1)}s): ${shot.emotionalIntent}`
  ).join('\n');
  
  return `
Shot Sequence Timeline:
${timeline}

Total Duration: ${sequence.totalDurationSeconds.toFixed(1)}s
Pacing: ${sequence.pacingProfile.tempo} (avg shot: ${sequence.pacingProfile.shotDurationMean.toFixed(1)}s)
Continuity Rules: ${sequence.continuityRules.filter(r => r.enforced).length} enforced
  `.trim();
}