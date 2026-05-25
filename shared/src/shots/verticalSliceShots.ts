// Vertical Slice Shot Types for 1-minute cinematic shorts
// Phase 10: "The Last Train"

import { CinematicShot, ShotType } from '../cinematicShots';

export interface VerticalSliceShot extends CinematicShot {
  verticalSliceRole: ShotRole;
  emotionalRequirements: EmotionalRequirement[];
  atmosphericDependencies: AtmosphericDependency[];
  characterBlocking: CharacterBlocking[];
  timingConstraints: TimingConstraint;
}

export type ShotRole = 
  | 'establishing_isolation'
  | 'emotional_introspection'
  | 'tension_build'
  | 'climax_reveal'
  | 'resolution_hold'
  | 'atmospheric_anchor'
  | 'character_reveal'
  | 'environmental_storytelling';

export interface EmotionalRequirement {
  emotion: string;
  minimumIntensity: number;
  maximumIntensity: number;
  timingBias: 'early' | 'mid' | 'late' | 'any';
}

export interface AtmosphericDependency {
  effect: string;
  intensity: number; // 0-1
  timing: 'start' | 'throughout' | 'end' | 'peak';
}

export interface CharacterBlocking {
  actorId: string;
  position: 'center' | 'left' | 'right' | 'background' | 'foreground';
  facing: 'camera' | 'left' | 'right' | 'away';
  posture: 'standing' | 'sitting' | 'leaning' | 'pacing';
  emotionalState: string;
}

export interface TimingConstraint {
  minimumDuration: number; // seconds
  maximumDuration: number; // seconds
  idealDuration: number; // seconds
  transitionIn: string;
  transitionOut: string;
}

// Shot definitions for "The Last Train"
export const VERTICAL_SLICE_SHOTS: Record<string, VerticalSliceShot> = {
  // Shot 1: Establishing Isolation
  establishing_isolation: {
    id: 'vs_establishing_isolation',
    shotType: 'establishing',
    emotionalIntent: 'loneliness',
    narrativePurpose: 'Establish empty station atmosphere and character isolation',
    framing: {
      composition: 'negative_space',
      ruleOfThirds: true,
      depthBias: 0.8,
      focalPriority: ['character', 'empty_space', 'rain']
    },
    camera: {
      angle: 'high',
      movement: 'static',
      lens: 'wide_angle',
      distance: 0.9
    },
    pacing: {
      duration: 8,
      intensity: 0.3,
      tensionCurve: [0.2, 0.3, 0.3, 0.2]
    },
    atmosphere: {
      lighting: 'moonlit',
      fogDensity: 0.6,
      ambience: ['rain_heavy', 'distant_thunder']
    },
    continuity: {
      previousShotRelation: 'none',
      transitionType: 'fade'
    },
    verticalSliceRole: 'establishing_isolation',
    emotionalRequirements: [
      {
        emotion: 'loneliness',
        minimumIntensity: 0.6,
        maximumIntensity: 0.8,
        timingBias: 'early'
      }
    ],
    atmosphericDependencies: [
      {
        effect: 'rain',
        intensity: 0.7,
        timing: 'throughout'
      },
      {
        effect: 'fog',
        intensity: 0.5,
        timing: 'throughout'
      }
    ],
    characterBlocking: [
      {
        actorId: 'man',
        position: 'center',
        facing: 'away',
        posture: 'standing',
        emotionalState: 'lonely'
      }
    ],
    timingConstraints: {
      minimumDuration: 5,
      maximumDuration: 12,
      idealDuration: 8,
      transitionIn: 'fade_from_black',
      transitionOut: 'slow_dissolve'
    }
  },
  
  // Shot 2: Emotional Introspection
  emotional_introspection: {
    id: 'vs_emotional_introspection',
    shotType: 'closeup',
    emotionalIntent: 'melancholy',
    narrativePurpose: 'Reveal internal emotional state through intimate framing',
    framing: {
      composition: 'center',
      ruleOfThirds: false,
      depthBias: 0.3,
      focalPriority: ['character_face', 'eyes']
    },
    camera: {
      angle: 'eye_level',
      movement: 'subtle_drift',
      lens: 'prime',
      distance: 0.3
    },
    pacing: {
      duration: 7,
      intensity: 0.6,
      tensionCurve: [0.5, 0.6, 0.6, 0.5]
    },
    atmosphere: {
      lighting: 'practical',
      fogDensity: 0.3,
      ambience: ['rain_medium', 'station_hum']
    },
    continuity: {
      previousShotRelation: 'emotional_progression',
      transitionType: 'dissolve'
    },
    verticalSliceRole: 'emotional_introspection',
    emotionalRequirements: [
      {
        emotion: 'melancholy',
        minimumIntensity: 0.5,
        maximumIntensity: 0.8,
        timingBias: 'mid'
      },
      {
        emotion: 'regret',
        minimumIntensity: 0.3,
        maximumIntensity: 0.6,
        timingBias: 'mid'
      }
    ],
    atmosphericDependencies: [
      {
        effect: 'rain_reflections',
        intensity: 0.4,
        timing: 'throughout'
      },
      {
        effect: 'face_lighting',
        intensity: 0.6,
        timing: 'throughout'
      }
    ],
    characterBlocking: [
      {
        actorId: 'man',
        position: 'center',
        facing: 'camera',
        posture: 'standing',
        emotionalState: 'contemplative'
      }
    ],
    timingConstraints: {
      minimumDuration: 4,
      maximumDuration: 10,
      idealDuration: 7,
      transitionIn: 'dissolve',
      transitionOut: 'cut'
    }
  },
  
  // Shot 3: Tension Build
  tension_build: {
    id: 'vs_tension_build',
    shotType: 'medium',
    emotionalIntent: 'anticipation',
    narrativePurpose: 'Build tension through character observation and environmental cues',
    framing: {
      composition: 'asymmetric',
      ruleOfThirds: true,
      depthBias: 0.6,
      focalPriority: ['character', 'tracks', 'horizon']
    },
    camera: {
      angle: 'low',
      movement: 'slow_pan',
      lens: 'normal',
      distance: 0.5
    },
    pacing: {
      duration: 10,
      intensity: 0.7,
      tensionCurve: [0.6, 0.7, 0.8, 0.7]
    },
    atmosphere: {
      lighting: 'dramatic_spot',
      fogDensity: 0.4,
      ambience: ['rain_light', 'distant_train']
    },
    continuity: {
      previousShotRelation: 'temporal_progression',
      transitionType: 'cut'
    },
    verticalSliceRole: 'tension_build',
    emotionalRequirements: [
      {
        emotion: 'anticipation',
        minimumIntensity: 0.5,
        maximumIntensity: 0.8,
        timingBias: 'mid'
      },
      {
        emotion: 'tension',
        minimumIntensity: 0.4,
        maximumIntensity: 0.7,
        timingBias: 'late'
      }
    ],
    atmosphericDependencies: [
      {
        effect: 'train_light_glow',
        intensity: 0.3,
        timing: 'end'
      },
      {
        effect: 'rain',
        intensity: 0.5,
        timing: 'throughout'
      }
    ],
    characterBlocking: [
      {
        actorId: 'man',
        position: 'left',
        facing: 'right',
        posture: 'standing',
        emotionalState: 'waiting'
      }
    ],
    timingConstraints: {
      minimumDuration: 6,
      maximumDuration: 15,
      idealDuration: 10,
      transitionIn: 'cut',
      transitionOut: 'atmospheric_blend'
    }
  },
  
  // Shot 4: Climax Reveal
  climax_reveal: {
    id: 'vs_climax_reveal',
    shotType: 'tracking',
    emotionalIntent: 'arrival',
    narrativePurpose: 'Reveal train arrival as emotional and narrative climax',
    framing: {
      composition: 'depth_layering',
      ruleOfThirds: true,
      depthBias: 0.9,
      focalPriority: ['train_lights', 'character', 'tracks']
    },
    camera: {
      angle: 'eye_level',
      movement: 'push_in',
      lens: 'anamorphic',
      distance: 0.7
    },
    pacing: {
      duration: 8,
      intensity: 0.9,
      tensionCurve: [0.7, 0.8, 0.9, 0.8]
    },
    atmosphere: {
      lighting: 'neon_glow',
      fogDensity: 0.7,
      ambience: ['train_approach', 'rain_heavy', 'brake_squeal']
    },
    continuity: {
      previousShotRelation: 'climax_build',
      transitionType: 'smash_cut'
    },
    verticalSliceRole: 'climax_reveal',
    emotionalRequirements: [
      {
        emotion: 'arrival',
        minimumIntensity: 0.8,
        maximumIntensity: 1.0,
        timingBias: 'late'
      },
      {
        emotion: 'decision',
        minimumIntensity: 0.6,
        maximumIntensity: 0.9,
        timingBias: 'late'
      }
    ],
    atmosphericDependencies: [
      {
        effect: 'train_light_glow',
        intensity: 0.9,
        timing: 'peak'
      },
      {
        effect: 'rain',
        intensity: 0.8,
        timing: 'throughout'
      },
      {
        effect: 'fog_illumination',
        intensity: 0.7,
        timing: 'peak'
      }
    ],
    characterBlocking: [
      {
        actorId: 'man',
        position: 'center',
        facing: 'camera',
        posture: 'standing',
        emotionalState: 'frozen'
      }
    ],
    timingConstraints: {
      minimumDuration: 5,
      maximumDuration: 12,
      idealDuration: 8,
      transitionIn: 'tension_cut',
      transitionOut: 'silence_cut'
    }
  },
  
  // Shot 5: Resolution Hold
  resolution_hold: {
    id: 'vs_resolution_hold',
    shotType: 'wide',
    emotionalIntent: 'unresolved',
    narrativePurpose: 'Hold on emotional resolution and lingering atmosphere',
    framing: {
      composition: 'negative_space',
      ruleOfThirds: true,
      depthBias: 0.8,
      focalPriority: ['character', 'empty_tracks', 'station']
    },
    camera: {
      angle: 'high',
      movement: 'static',
      lens: 'wide_angle',
      distance: 0.9
    },
    pacing: {
      duration: 4,
      intensity: 0.4,
      tensionCurve: [0.5, 0.4, 0.3, 0.2]
    },
    atmosphere: {
      lighting: 'moonlit',
      fogDensity: 0.6,
      ambience: ['rain_light', 'distant_train_fade']
    },
    continuity: {
      previousShotRelation: 'emotional_resolution',
      transitionType: 'fade'
    },
    verticalSliceRole: 'resolution_hold',
    emotionalRequirements: [
      {
        emotion: 'unresolved',
        minimumIntensity: 0.3,
        maximumIntensity: 0.6,
        timingBias: 'late'
      },
      {
        emotion: 'loneliness',
        minimumIntensity: 0.4,
        maximumIntensity: 0.7,
        timingBias: 'late'
      }
    ],
    atmosphericDependencies: [
      {
        effect: 'rain',
        intensity: 0.5,
        timing: 'throughout'
      },
      {
        effect: 'fog',
        intensity: 0.6,
        timing: 'throughout'
      }
    ],
    characterBlocking: [
      {
        actorId: 'man',
        position: 'center',
        facing: 'away',
        posture: 'standing',
        emotionalState: 'resigned'
      }
    ],
    timingConstraints: {
      minimumDuration: 3,
      maximumDuration: 8,
      idealDuration: 4,
      transitionIn: 'silence_cut',
      transitionOut: 'fade_to_black'
    }
  }
};

export function getShotForRole(role: ShotRole): VerticalSliceShot {
  return VERTICAL_SLICE_SHOTS[role];
}

export function getAllVerticalSliceShots(): VerticalSliceShot[] {
  return Object.values(VERTICAL_SLICE_SHOTS);
}

export function getShotsForEmotion(emotion: string, minIntensity: number = 0): VerticalSliceShot[] {
  return Object.values(VERTICAL_SLICE_SHOTS).filter(shot =>
    shot.emotionalRequirements.some(req =>
      req.emotion === emotion && req.minimumIntensity >= minIntensity
    )
  );
}

export function validateShotTiming(shot: VerticalSliceShot, currentTime: number, totalDuration: number): boolean {
  const timingBias = shot.emotionalRequirements[0]?.timingBias;
  if (!timingBias || timingBias === 'any') return true;
  
  const timeRatio = currentTime / totalDuration;
  
  switch (timingBias) {
    case 'early':
      return timeRatio < 0.33;
    case 'mid':
      return timeRatio >= 0.33 && timeRatio < 0.66;
    case 'late':
      return timeRatio >= 0.66;
    default:
      return true;
  }
}

export function getShotCompatibility(shotA: VerticalSliceShot, shotB: VerticalSliceShot): number {
  let compatibility = 0.5; // Base compatibility
  
  // Emotional compatibility
  const emotionsA = shotA.emotionalRequirements.map(r => r.emotion);
  const emotionsB = shotB.emotionalRequirements.map(r => r.emotion);
  const emotionalOverlap = emotionsA.filter(e => emotionsB.includes(e)).length;
  compatibility += emotionalOverlap * 0.1;
  
  // Atmospheric compatibility
  const effectsA = shotA.atmosphericDependencies.map(d => d.effect);
  const effectsB = shotB.atmosphericDependencies.map(d => d.effect);
  const effectOverlap = effectsA.filter(e => effectsB.includes(e)).length;
  compatibility += effectOverlap * 0.05;
  
  // Pacing compatibility
  const pacingDiff = Math.abs(shotA.pacing.intensity - shotB.pacing.intensity);
  compatibility -= pacingDiff * 0.2;
  
  // Role progression compatibility
  const roleOrder = ['establishing_isolation', 'emotional_introspection', 'tension_build', 'climax_reveal', 'resolution_hold'];
  const indexA = roleOrder.indexOf(shotA.verticalSliceRole);
  const indexB = roleOrder.indexOf(shotB.verticalSliceRole);
  
  if (indexA !== -1 && indexB !== -1) {
    const roleProgression = indexB - indexA;
    if (roleProgression === 1) {
      compatibility += 0.2; // Natural progression
    } else if (roleProgression > 1) {
      compatibility -= 0.1; // Skipped roles
    } else if (roleProgression < 0) {
      compatibility -= 0.3; // Backwards progression
    }
  }
  
  return Math.min(Math.max(compatibility, 0), 1);
}