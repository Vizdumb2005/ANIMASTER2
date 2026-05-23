// Shot Planner for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { EmotionalBeat, ShotSegment } from '../narrative/narrativeArcGenerator.js';
import { CinematicShot, ShotType } from '../../../shared/src/cinematicShots.js';

export interface PlannedShot {
  id: string;
  shotType: ShotType;
  emotionalIntent: string;
  narrativePurpose: string;
  durationSeconds: number;
  cameraSpecs: CameraSpecs;
  framing: FramingSpecs;
  transition: TransitionSpecs;
  emotionalWeight: number; // 0-1
}

export interface CameraSpecs {
  angle: 'low' | 'eye_level' | 'high' | 'dutch';
  movement: 'static' | 'pan' | 'tilt' | 'tracking' | 'push_in' | 'pull_back' | 'handheld';
  lens: 'wide' | 'normal' | 'telephoto' | 'anamorphic';
  distance: number; // 0-1, 0=close, 1=far
  speed: number; // 0-1, movement speed
}

export interface FramingSpecs {
  composition: 'rule_of_thirds' | 'center' | 'asymmetric' | 'negative_space' | 'foreground_frame';
  focalPriority: string[]; // actor IDs or 'environment'
  depthBias: number; // 0-1, 0=flat, 1=deep
  headroom: number; // 0-1, space above head
  lookRoom: number; // 0-1, space in direction of gaze
}

export interface TransitionSpecs {
  type: 'cut' | 'fade' | 'dissolve' | 'whip_pan' | 'smash_cut' | 'silence_cut' | 'atmospheric_blend';
  durationSeconds: number;
  emotionalEffect: string;
  timing: 'precise' | 'overlap' | 'gap';
}

export function planShotsFromArc(
  emotionalBeats: EmotionalBeat[],
  shotSegments: ShotSegment[]
): PlannedShot[] {
  const plannedShots: PlannedShot[] = [];
  
  for (let i = 0; i < shotSegments.length; i++) {
    const segment = shotSegments[i];
    const emotionalContext = getEmotionalContextForSegment(emotionalBeats, segment);
    
    const shot: PlannedShot = {
      id: `shot_${i + 1}_${Date.now()}`,
      shotType: mapShotType(segment.shotType),
      emotionalIntent: segment.emotionalIntent,
      narrativePurpose: getNarrativePurpose(segment, emotionalContext),
      durationSeconds: segment.durationSeconds,
      cameraSpecs: generateCameraSpecs(segment, emotionalContext),
      framing: generateFramingSpecs(segment, emotionalContext),
      transition: generateTransitionSpecs(segment, i, shotSegments.length),
      emotionalWeight: emotionalContext.intensity
    };
    
    plannedShots.push(shot);
  }
  
  return plannedShots;
}

function getEmotionalContextForSegment(
  beats: EmotionalBeat[],
  segment: ShotSegment
): { emotion: string; intensity: number; description: string } {
  const segmentMidpoint = (segment.timeStart + segment.timeEnd) / 2;
  
  // Find the beat that contains the segment midpoint
  for (const beat of beats) {
    if (segmentMidpoint >= beat.timeStart && segmentMidpoint <= beat.timeEnd) {
      return {
        emotion: beat.emotion,
        intensity: beat.intensity,
        description: beat.description
      };
    }
  }
  
  // Fallback to nearest beat
  const nearestBeat = beats.reduce((nearest, beat) => {
    const beatMidpoint = (beat.timeStart + beat.timeEnd) / 2;
    const currentDistance = Math.abs(beatMidpoint - segmentMidpoint);
    const nearestDistance = Math.abs((nearest.timeStart + nearest.timeEnd) / 2 - segmentMidpoint);
    return currentDistance < nearestDistance ? beat : nearest;
  }, beats[0]);
  
  return {
    emotion: nearestBeat.emotion,
    intensity: nearestBeat.intensity,
    description: nearestBeat.description
  };
}

function mapShotType(shotType: string): ShotType {
  const typeMap: Record<string, ShotType> = {
    'establishing': 'establishing',
    'wide': 'wide',
    'medium': 'medium',
    'closeup': 'closeup',
    'extreme_closeup': 'extreme_closeup',
    'tracking': 'tracking',
    'insert': 'insert',
    'isolation': 'isolation',
    'reaction': 'reaction',
    'overhead': 'overhead'
  };
  
  return typeMap[shotType] || 'medium';
}

function getNarrativePurpose(segment: ShotSegment, context: { emotion: string; intensity: number; description: string }): string {
  const purposes: Record<string, string> = {
    'establishing': `Establish ${context.emotion} atmosphere in empty station`,
    'wide': `Emphasize character isolation through negative space`,
    'medium': `Observe ${context.emotion} through restrained framing`,
    'closeup': `Reveal internal ${context.emotion} through intimate framing`,
    'tracking': `Build ${context.emotion} through camera movement`,
    'insert': `Highlight detail contributing to ${context.emotion}`
  };
  
  return purposes[segment.shotType] || `Convey ${context.emotion} through ${segment.shotType} shot`;
}

function generateCameraSpecs(segment: ShotSegment, context: { emotion: string; intensity: number; description: string }): CameraSpecs {
  const specs: CameraSpecs = {
    angle: 'eye_level',
    movement: 'static',
    lens: 'normal',
    distance: 0.5,
    speed: 0.3
  };
  
  // Set angle based on emotional intent
  if (context.emotion.includes('lonely') || context.emotion.includes('isolation')) {
    specs.angle = 'high';
  } else if (context.emotion.includes('tension') || context.emotion.includes('anticipation')) {
    specs.angle = 'low';
  }
  
  // Set movement based on shot type and emotion
  if (segment.cameraMovement.includes('drift')) {
    specs.movement = 'pan';
    specs.speed = 0.2;
  } else if (segment.cameraMovement.includes('push')) {
    specs.movement = 'push_in';
    specs.speed = 0.15;
  } else if (segment.cameraMovement.includes('handheld')) {
    specs.movement = 'handheld';
    specs.speed = 0.4;
  } else if (segment.cameraMovement.includes('pan')) {
    specs.movement = 'pan';
    specs.speed = 0.3;
  }
  
  // Set lens and distance based on shot type
  if (segment.shotType.includes('closeup')) {
    specs.lens = 'telephoto';
    specs.distance = 0.2;
  } else if (segment.shotType.includes('wide') || segment.shotType.includes('establishing')) {
    specs.lens = 'wide';
    specs.distance = 0.8;
  }
  
  // Adjust for emotional intensity
  if (context.intensity > 0.7) {
    specs.speed *= 1.3;
    if (specs.angle === 'eye_level') specs.angle = 'dutch';
  }
  
  return specs;
}

function generateFramingSpecs(segment: ShotSegment, context: { emotion: string; intensity: number; description: string }): FramingSpecs {
  const specs: FramingSpecs = {
    composition: 'rule_of_thirds',
    focalPriority: ['character'],
    depthBias: 0.5,
    headroom: 0.3,
    lookRoom: 0.4
  };
  
  // Set composition based on emotional intent
  if (segment.emotionalIntent.includes('isolation') || segment.emotionalIntent.includes('loneliness')) {
    specs.composition = 'negative_space';
    specs.focalPriority = ['character', 'empty_space'];
  } else if (segment.emotionalIntent.includes('introspection')) {
    specs.composition = 'center';
    specs.focalPriority = ['character_face'];
  } else if (segment.emotionalIntent.includes('anticipation')) {
    specs.composition = 'asymmetric';
    specs.focalPriority = ['character', 'horizon'];
  }
  
  // Set depth based on shot type
  if (segment.shotType.includes('closeup')) {
    specs.depthBias = 0.2;
    specs.headroom = 0.1;
  } else if (segment.shotType.includes('wide')) {
    specs.depthBias = 0.8;
    specs.headroom = 0.5;
  }
  
  // Set look room based on emotional direction
  if (context.emotion.includes('anticipation')) {
    specs.lookRoom = 0.7; // More space in direction of gaze
  } else if (context.emotion.includes('withdrawal')) {
    specs.lookRoom = 0.2; // Less space, feeling trapped
  }
  
  return specs;
}

function generateTransitionSpecs(
  segment: ShotSegment,
  index: number,
  totalShots: number
): TransitionSpecs {
  const isFirstShot = index === 0;
  const isLastShot = index === totalShots - 1;
  
  let type: TransitionSpecs['type'] = 'cut';
  let duration = 0.1;
  let emotionalEffect = 'standard cut';
  let timing: TransitionSpecs['timing'] = 'precise';
  
  // Use segment's transition if specified
  if (segment.transitionToNext) {
    const transitionMap: Record<string, TransitionSpecs['type']> = {
      'slow fade': 'fade',
      'cut': 'cut',
      'slow push in': 'dissolve',
      'atmospheric blend': 'atmospheric_blend',
      'tension cut': 'smash_cut',
      'silence cut': 'silence_cut',
      'fade out': 'fade'
    };
    
    type = transitionMap[segment.transitionToNext] || 'cut';
  }
  
  // Adjust based on position in sequence
  if (isFirstShot) {
    emotionalEffect = 'establishing entrance';
  } else if (isLastShot) {
    type = 'fade';
    duration = 2.0;
    emotionalEffect = 'emotional resolution';
    timing = 'overlap';
  } else if (segment.emotionalIntent.includes('tension') || segment.emotionalIntent.includes('anticipation')) {
    type = 'smash_cut';
    duration = 0.05;
    emotionalEffect = 'emotional punctuation';
  } else if (segment.emotionalIntent.includes('melancholy') || segment.emotionalIntent.includes('loneliness')) {
    type = 'dissolve';
    duration = 1.0;
    emotionalEffect = 'emotional blending';
    timing = 'overlap';
  }
  
  // Set duration based on type
  const durationMap: Record<TransitionSpecs['type'], number> = {
    'cut': 0.1,
    'fade': 1.5,
    'dissolve': 1.0,
    'whip_pan': 0.3,
    'smash_cut': 0.05,
    'silence_cut': 0.2,
    'atmospheric_blend': 2.0
  };
  
  duration = durationMap[type] || 0.1;
  
  return {
    type,
    durationSeconds: duration,
    emotionalEffect,
    timing
  };
}

export function validateShotContinuity(shots: PlannedShot[]): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  
  // Check for jarring transitions
  for (let i = 1; i < shots.length; i++) {
    const prev = shots[i - 1];
    const curr = shots[i];
    
    // Check for extreme camera angle changes
    const angleChanges: Record<string, number> = {
      'low->high': 2,
      'high->low': 2,
      'eye_level->dutch': 1.5,
      'dutch->eye_level': 1.5
    };
    
    const angleKey = `${prev.cameraSpecs.angle}->${curr.cameraSpecs.angle}`;
    if (angleChanges[angleKey] && prev.transition.type === 'cut') {
      issues.push(`Jarring camera angle change: ${angleKey} with cut transition`);
    }
    
    // Check for extreme focal length changes
    const focalChange = Math.abs(prev.cameraSpecs.distance - curr.cameraSpecs.distance);
    if (focalChange > 0.6 && prev.transition.type === 'cut') {
      issues.push(`Extreme focal length change (${focalChange.toFixed(2)}) with cut transition`);
    }
    
    // Check emotional coherence
    const emotionalShift = Math.abs(prev.emotionalWeight - curr.emotionalWeight);
    if (emotionalShift > 0.5 && prev.transition.type === 'cut') {
      issues.push(`Abrupt emotional shift (${emotionalShift.toFixed(2)}) with cut transition`);
    }
  }
  
  // Check overall pacing
  const totalDuration = shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const averageShotDuration = totalDuration / shots.length;
  
  if (averageShotDuration < 3) {
    issues.push(`Fast average shot duration (${averageShotDuration.toFixed(1)}s) may feel rushed`);
  }
  
  if (averageShotDuration > 15) {
    issues.push(`Slow average shot duration (${averageShotDuration.toFixed(1)}s) may feel stagnant`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

export function getShotPlanSummary(shots: PlannedShot[]): string {
  const totalDuration = shots.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  const shotTypes = shots.reduce((acc, shot) => {
    acc[shot.shotType] = (acc[shot.shotType] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const typeSummary = Object.entries(shotTypes)
    .map(([type, count]) => `${type}: ${count}`)
    .join(', ');
  
  return `
Shot Plan Summary:
Total Shots: ${shots.length}
Total Duration: ${totalDuration.toFixed(1)}s
Average Shot Length: ${(totalDuration / shots.length).toFixed(1)}s
Shot Types: ${typeSummary}
  `.trim();
}