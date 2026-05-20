// Transition Planner for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { SequencedShot } from './shotSequencer.js';

export interface TransitionPlan {
  fromShotId: string;
  toShotId: string;
  type: TransitionType;
  durationSeconds: number;
  emotionalEffect: EmotionalEffect;
  visualParameters: VisualParameters;
  audioParameters?: AudioParameters;
  continuityChecks: ContinuityCheck[];
}

export type TransitionType = 
  | 'hard_cut'
  | 'soft_cut'
  | 'cross_dissolve'
  | 'fade_to_black'
  | 'fade_from_black'
  | 'fade_to_white'
  | 'wipe'
  | 'iris'
  | 'smash_cut'
  | 'j_cut' // audio leads video
  | 'l_cut' // video leads audio
  | 'match_cut'
  | 'invisible_cut'
  | 'whip_pan'
  | 'digital_zoom';

export interface EmotionalEffect {
  primaryEmotion: string;
  secondaryEmotion?: string;
  intensityChange: number; // -1 to 1
  pacingEffect: 'accelerates' | 'decelerates' | 'maintains';
  narrativePurpose: string;
}

export interface VisualParameters {
  blendMode?: 'normal' | 'add' | 'multiply' | 'screen';
  colorGradeTransition?: boolean;
  motionBlur?: number; // 0-1
  temporalOffset?: number; // seconds
  spatialAlignment?: 'center' | 'edge' | 'follow_motion';
}

export interface AudioParameters {
  crossfadeDuration: number;
  ambientContinuity: boolean;
  soundBridge?: boolean; // sound from next shot starts early
  silenceBreak?: boolean; // moment of silence at cut
}

export interface ContinuityCheck {
  type: 'spatial' | 'temporal' | 'visual' | 'emotional';
  passed: boolean;
  issue?: string;
  fixApplied?: boolean;
}

export function planTransitions(shots: SequencedShot[]): TransitionPlan[] {
  const transitions: TransitionPlan[] = [];
  
  for (let i = 0; i < shots.length - 1; i++) {
    const fromShot = shots[i];
    const toShot = shots[i + 1];
    
    const transition = createTransitionPlan(fromShot, toShot, i, shots.length);
    transitions.push(transition);
  }
  
  return transitions;
}

function createTransitionPlan(
  fromShot: SequencedShot,
  toShot: SequencedShot,
  position: number,
  totalShots: number
): TransitionPlan {
  // Determine transition type based on shot relationship
  const transitionType = determineTransitionType(fromShot, toShot, position, totalShots);
  
  // Determine duration based on type and emotional context
  const duration = calculateTransitionDuration(transitionType, fromShot, toShot);
  
  // Analyze emotional effect
  const emotionalEffect = analyzeEmotionalEffect(fromShot, toShot, transitionType);
  
  // Set visual parameters
  const visualParameters = determineVisualParameters(transitionType, fromShot, toShot);
  
  // Set audio parameters
  const audioParameters = determineAudioParameters(transitionType, fromShot, toShot);
  
  // Perform continuity checks
  const continuityChecks = performContinuityChecks(fromShot, toShot, transitionType);
  
  return {
    fromShotId: fromShot.id,
    toShotId: toShot.id,
    type: transitionType,
    durationSeconds: duration,
    emotionalEffect,
    visualParameters,
    audioParameters,
    continuityChecks
  };
}

function determineTransitionType(
  fromShot: SequencedShot,
  toShot: SequencedShot,
  position: number,
  totalShots: number
): TransitionType {
  const isFirstTransition = position === 0;
  const isLastTransition = position === totalShots - 2;
  
  // Special cases for beginning and end
  if (isFirstTransition) {
    return 'fade_from_black';
  }
  
  if (isLastTransition) {
    return 'fade_to_black';
  }
  
  // Analyze shot relationship
  const emotionalDiff = Math.abs(fromShot.emotionalWeight - toShot.emotionalWeight);
  const cameraAngleDiff = fromShot.cameraSpecs.angle !== toShot.cameraSpecs.angle;
  const shotTypeDiff = fromShot.shotType !== toShot.shotType;
  
  // Emotional intensity-based transitions
  if (emotionalDiff > 0.6) {
    return 'smash_cut'; // For dramatic emotional shifts
  }
  
  if (emotionalDiff < 0.2 && fromShot.emotionalContext.primaryEmotion === toShot.emotionalContext.primaryEmotion) {
    return 'cross_dissolve'; // For smooth emotional continuity
  }
  
  // Camera movement-based transitions
  if (fromShot.cameraSpecs.movement === 'pan' && toShot.cameraSpecs.movement === 'pan') {
    return 'whip_pan'; // For continuous panning motion
  }
  
  if (fromShot.cameraSpecs.movement.includes('push') && toShot.cameraSpecs.movement.includes('pull')) {
    return 'match_cut'; // For complementary camera movements
  }
  
  // Shot type-based transitions
  if (shotTypeDiff && cameraAngleDiff) {
    return 'hard_cut'; // For significant visual changes
  }
  
  if (!shotTypeDiff && !cameraAngleDiff && emotionalDiff < 0.3) {
    return 'invisible_cut'; // For seamless continuity
  }
  
  // Default based on emotional intent
  if (fromShot.emotionalIntent.includes('tension') || toShot.emotionalIntent.includes('tension')) {
    return 'hard_cut';
  }
  
  if (fromShot.emotionalIntent.includes('melancholy') || toShot.emotionalIntent.includes('melancholy')) {
    return 'cross_dissolve';
  }
  
  return 'soft_cut';
}

function calculateTransitionDuration(
  type: TransitionType,
  fromShot: SequencedShot,
  toShot: SequencedShot
): number {
  const baseDurations: Record<TransitionType, number> = {
    'hard_cut': 0.0,
    'soft_cut': 0.1,
    'cross_dissolve': 1.0,
    'fade_to_black': 1.5,
    'fade_from_black': 1.5,
    'fade_to_white': 1.5,
    'wipe': 0.5,
    'iris': 0.8,
    'smash_cut': 0.05,
    'j_cut': 0.3,
    'l_cut': 0.3,
    'match_cut': 0.2,
    'invisible_cut': 0.0,
    'whip_pan': 0.3,
    'digital_zoom': 0.4
  };
  
  let duration = baseDurations[type] || 0.1;
  
  // Adjust based on emotional context
  const emotionalDiff = Math.abs(fromShot.emotionalWeight - toShot.emotionalWeight);
  
  if (type === 'cross_dissolve') {
    // Longer dissolves for smoother emotional transitions
    if (emotionalDiff < 0.2) {
      duration = 1.5;
    } else if (emotionalDiff > 0.5) {
      duration = 0.5; // Shorter for emotional shifts
    }
  }
  
  // Adjust based on shot duration
  const avgShotDuration = (fromShot.durationSeconds + toShot.durationSeconds) / 2;
  if (avgShotDuration < 5 && duration > 1.0) {
    duration = Math.min(duration, avgShotDuration * 0.2); // Don't let transition dominate short shots
  }
  
  return duration;
}

function analyzeEmotionalEffect(
  fromShot: SequencedShot,
  toShot: SequencedShot,
  transitionType: TransitionType
): EmotionalEffect {
  const emotionalDiff = toShot.emotionalWeight - fromShot.emotionalWeight;
  
  let pacingEffect: EmotionalEffect['pacingEffect'] = 'maintains';
  if (emotionalDiff > 0.3) {
    pacingEffect = 'accelerates';
  } else if (emotionalDiff < -0.3) {
    pacingEffect = 'decelerates';
  }
  
  let narrativePurpose = '';
  if (transitionType === 'smash_cut') {
    narrativePurpose = 'Emotional punctuation and intensity shift';
  } else if (transitionType === 'cross_dissolve') {
    narrativePurpose = 'Smooth emotional blending and continuity';
  } else if (transitionType === 'hard_cut') {
    narrativePurpose = 'Clear separation of emotional states';
  } else if (transitionType === 'fade_to_black' || transitionType === 'fade_from_black') {
    narrativePurpose = 'Narrative chapter marker';
  } else {
    narrativePurpose = 'Standard scene progression';
  }
  
  return {
    primaryEmotion: toShot.emotionalContext.primaryEmotion,
    intensityChange: emotionalDiff,
    pacingEffect,
    narrativePurpose
  };
}

function determineVisualParameters(
  transitionType: TransitionType,
  fromShot: SequencedShot,
  toShot: SequencedShot
): VisualParameters {
  const params: VisualParameters = {};
  
  switch (transitionType) {
    case 'cross_dissolve':
      params.blendMode = 'normal';
      params.colorGradeTransition = true;
      params.motionBlur = 0.3;
      break;
      
    case 'whip_pan':
      params.motionBlur = 0.8;
      params.spatialAlignment = 'follow_motion';
      break;
      
    case 'smash_cut':
      params.motionBlur = 0.1;
      params.temporalOffset = 0.02;
      break;
      
    case 'match_cut':
      params.spatialAlignment = 'center';
      params.colorGradeTransition = true;
      break;
      
    case 'fade_to_black':
    case 'fade_from_black':
      params.blendMode = 'multiply';
      break;
  }
  
  // Add emotional influence
  if (fromShot.emotionalWeight > 0.7 || toShot.emotionalWeight > 0.7) {
    params.motionBlur = Math.max(params.motionBlur || 0, 0.5);
  }
  
  return params;
}

function determineAudioParameters(
  transitionType: TransitionType,
  fromShot: SequencedShot,
  toShot: SequencedShot
): AudioParameters | undefined {
  if (transitionType === 'hard_cut' || transitionType === 'smash_cut') {
    return {
      crossfadeDuration: 0.1,
      ambientContinuity: true,
      silenceBreak: emotionalShiftRequiresSilence(fromShot, toShot)
    };
  }
  
  if (transitionType === 'j_cut') {
    return {
      crossfadeDuration: 0.5,
      ambientContinuity: true,
      soundBridge: true
    };
  }
  
  if (transitionType === 'l_cut') {
    return {
      crossfadeDuration: 0.5,
      ambientContinuity: true,
      soundBridge: false
    };
  }
  
  if (transitionType === 'cross_dissolve') {
    return {
      crossfadeDuration: 1.0,
      ambientContinuity: true
    };
  }
  
  return undefined;
}

function emotionalShiftRequiresSilence(fromShot: SequencedShot, toShot: SequencedShot): boolean {
  const emotionalDiff = Math.abs(fromShot.emotionalWeight - toShot.emotionalWeight);
  const emotionChange = fromShot.emotionalContext.primaryEmotion !== toShot.emotionalContext.primaryEmotion;
  
  return emotionalDiff > 0.5 && emotionChange;
}

function performContinuityChecks(
  fromShot: SequencedShot,
  toShot: SequencedShot,
  transitionType: TransitionType
): ContinuityCheck[] {
  const checks: ContinuityCheck[] = [];
  
  // Spatial continuity check
  const spatialCheck: ContinuityCheck = {
    type: 'spatial',
    passed: true,
    issue: undefined,
    fixApplied: false
  };
  
  if (fromShot.cameraSpecs.angle === 'low' && toShot.cameraSpecs.angle === 'high' && 
      transitionType === 'hard_cut') {
    spatialCheck.passed = false;
    spatialCheck.issue = 'Jarring camera angle change (low to high) with hard cut';
    spatialCheck.fixApplied = transitionType !== 'hard_cut';
  }
  
  checks.push(spatialCheck);
  
  // Temporal continuity check
  const temporalCheck: ContinuityCheck = {
    type: 'temporal',
    passed: true,
    issue: undefined,
    fixApplied: false
  };
  
  const timeGap = toShot.startTimeSeconds - fromShot.endTimeSeconds;
  if (Math.abs(timeGap) > 0.1) {
    temporalCheck.passed = false;
    temporalCheck.issue = `Temporal gap of ${timeGap.toFixed(2)}s between shots`;
  }
  
  checks.push(temporalCheck);
  
  // Visual continuity check
  const visualCheck: ContinuityCheck = {
    type: 'visual',
    passed: true,
    issue: undefined,
    fixApplied: false
  };
  
  const focalChange = Math.abs(fromShot.cameraSpecs.distance - toShot.cameraSpecs.distance);
  if (focalChange > 0.6 && transitionType === 'hard_cut') {
    visualCheck.passed = false;
    visualCheck.issue = `Extreme focal length change (Δ=${focalChange.toFixed(2)}) with hard cut`;
    visualCheck.fixApplied = transitionType !== 'hard_cut';
  }
  
  checks.push(visualCheck);
  
  // Emotional continuity check
  const emotionalCheck: ContinuityCheck = {
    type: 'emotional',
    passed: true,
    issue: undefined,
    fixApplied: false
  };
  
  const emotionalDiff = Math.abs(fromShot.emotionalWeight - toShot.emotionalWeight);
  if (emotionalDiff > 0.5 && transitionType === 'hard_cut') {
    emotionalCheck.passed = false;
    emotionalCheck.issue = `Abrupt emotional shift (Δ=${emotionalDiff.toFixed(2)}) with hard cut`;
    emotionalCheck.fixApplied = transitionType !== 'hard_cut';
  }
  
  checks.push(emotionalCheck);
  
  return checks;
}

export function validateTransitionPlan(plan: TransitionPlan): { valid: boolean; warnings: string[] } {
  const warnings: string[] = [];
  
  // Check transition duration appropriateness
  if (plan.durationSeconds > 3) {
    warnings.push(`Long transition duration (${plan.durationSeconds}s) may disrupt pacing`);
  }
  
  if (plan.type === 'hard_cut' && plan.durationSeconds > 0) {
    warnings.push(`Hard cut with non-zero duration (${plan.durationSeconds}s)`);
  }
  
  // Check continuity issues
  const failedChecks = plan.continuityChecks.filter(check => !check.passed && !check.fixApplied);
  failedChecks.forEach(check => {
    warnings.push(`Continuity issue: ${check.issue}`);
  });
  
  // Check emotional effect coherence
  if (Math.abs(plan.emotionalEffect.intensityChange) > 0.7 && 
      (plan.type === 'cross_dissolve' || plan.type === 'fade_to_black')) {
    warnings.push(`Major emotional shift (Δ=${plan.emotionalEffect.intensityChange.toFixed(2)}) with smooth transition`);
  }
  
  return {
    valid: warnings.length === 0,
    warnings
  };
}

export function getTransitionSummary(transitions: TransitionPlan[]): string {
  const typeCounts = transitions.reduce((acc, t) => {
    acc[t.type] = (acc[t.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const typeSummary = Object.entries(typeCounts)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
  
  const avgDuration = transitions.reduce((sum, t) => sum + t.durationSeconds, 0) / transitions.length;
  const continuityIssues = transitions.reduce((sum, t) => 
    sum + t.continuityChecks.filter(c => !c.passed).length, 0);
  
  return `
Transition Plan Summary:
Total Transitions: ${transitions.length}
Transition Types: ${typeSummary}
Average Duration: ${avgDuration.toFixed(2)}s
Continuity Issues: ${continuityIssues}
  `.trim();
}