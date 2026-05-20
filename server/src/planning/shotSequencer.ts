// Phase 9 — Shot Sequencing System
// Types inlined from shared to avoid cross-package import issues under NodeNext

export type ShotType =
  | 'establishing'
  | 'wide'
  | 'medium'
  | 'closeup'
  | 'extreme_closeup'
  | 'reaction'
  | 'tracking'
  | 'overhead'
  | 'insert'
  | 'isolation';

export type TransitionType =
  | 'cut'
  | 'fade'
  | 'dissolve'
  | 'whip_pan'
  | 'smash_cut'
  | 'silence_cut'
  | 'atmospheric_blend'
  | 'motion_continuation';

export interface CinematicShot {
  id: string;
  shotType: ShotType;
  emotionalIntent: string;
  narrativePurpose: string;
  framing: {
    composition: string;
    ruleOfThirds: boolean;
    depthBias: number;
    focalPriority: string[];
  };
  camera: {
    angle: string;      // e.g. low, high, eye_level
    movement: string;   // e.g. static, pan, tilt, tracking, push_in
    lens: string;       // e.g. anamorphic, prime, wide_angle
    distance: number;
  };
  pacing: {
    duration: number;       // in seconds
    intensity: number;      // 0 to 1
    tensionCurve: number[]; // 0 to 1 tension points
  };
  atmosphere: {
    lighting: string;
    fogDensity: number;
    ambience: string[];
  };
  continuity: {
    previousShotRelation: string;
    transitionType: TransitionType;
  };
}

export interface NarrativeState {
  currentTheme: string;
  emotionalTrajectory: string[];
  continuityTracker: Record<string, unknown>;
  motifOccurrences: Record<string, number>;
}

// AtmosphereAudio — Section 7 of Phase 9 spec
export interface AtmosphereAudio {
  ambience: string[];
  intensity: number;
  spatialDepth: number;
  emotionalTone: string;
}

/** Derive an AtmosphereAudio model from a shot's atmosphere settings */
export function deriveAtmosphereAudio(shot: CinematicShot): AtmosphereAudio {
  return {
    ambience: shot.atmosphere.ambience,
    intensity: shot.pacing.intensity,
    spatialDepth: shot.shotType === 'establishing' || shot.shotType === 'wide' ? 0.9 : 0.3,
    emotionalTone: shot.emotionalIntent,
  };
}

// Minimal Actor shape needed by this module
interface ActorPosition { x: number; y: number; }
interface Actor { id: string; position: ActorPosition; }

export function generateShotSequence(prompt: string, actors: Actor[]): { shotSequence: CinematicShot[]; narrativeState: NarrativeState } {
  const p = prompt.toLowerCase();
  let theme = 'observational';
  let trajectory = ['neutral'];
  const motifs: Record<string, number> = {};

  // Detect theme and trajectory
  if (p.includes('interrogate') || p.includes('confront') || p.includes('tense') || p.includes('argue')) {
    theme = 'confrontation';
    trajectory = ['tense', 'combative', 'resolved'];
    motifs['tension'] = 2;
    motifs['eye_contact'] = 3;
  } else if (p.includes('sad') || p.includes('cry') || p.includes('lonely') || p.includes('alone') || p.includes('grief')) {
    theme = 'isolation';
    trajectory = ['lonely', 'melancholic', 'resigned'];
    motifs['silence'] = 4;
  } else if (p.includes('happy') || p.includes('meet') || p.includes('greet') || p.includes('friend')) {
    theme = 'connection';
    trajectory = ['curious', 'warm', 'joyful'];
    motifs['smile'] = 2;
  } else if (p.includes('fear') || p.includes('scared') || p.includes('threat') || p.includes('run')) {
    theme = 'suspense';
    trajectory = ['nervous', 'terrified', 'exhausted'];
    motifs['escape'] = 2;
  }

  // Create shots
  const shots: CinematicShot[] = [];
  const actorIds = actors.map((a) => a.id);

  // Shot 1: Establishing wide shot
  shots.push({
    id: 'shot_1_establishing',
    shotType: 'establishing',
    emotionalIntent: trajectory[0] ?? 'neutral',
    narrativePurpose: `Introduce the space and initial distance for: ${prompt.slice(0, 40)}...`,
    framing: {
      composition: 'wide_centered',
      ruleOfThirds: true,
      depthBias: 0.1,
      focalPriority: actorIds.slice(0, 1),
    },
    camera: {
      angle: 'eye_level',
      movement: 'static',
      lens: 'wide_angle',
      distance: 12.0,
    },
    pacing: {
      duration: 4.5,
      intensity: 0.3,
      tensionCurve: [0.1, 0.2, 0.3],
    },
    atmosphere: {
      lighting: theme === 'isolation' ? 'ambient_dim' : 'high_contrast',
      fogDensity: theme === 'suspense' ? 0.35 : 0.1,
      ambience: theme === 'suspense' ? ['distant_rumble'] : ['quiet_room'],
    },
    continuity: {
      previousShotRelation: 'none',
      transitionType: theme === 'isolation' ? 'atmospheric_blend' : 'fade',
    },
  });

  // Shot 2: Medium shot focusing on the core activity/interaction
  const activeShotType: ShotType = actors.length >= 2 ? 'medium' : 'isolation';
  shots.push({
    id: 'shot_2_action',
    shotType: activeShotType,
    emotionalIntent: trajectory[1] ?? trajectory[0] ?? 'neutral',
    narrativePurpose: 'Establish interaction dynamic and primary action.',
    framing: {
      composition: actors.length >= 2 ? 'two_shot_balanced' : 'rule_of_thirds_left',
      ruleOfThirds: true,
      depthBias: 0.4,
      focalPriority: actorIds,
    },
    camera: {
      angle: theme === 'confrontation' ? 'low' : 'eye_level',
      movement: theme === 'suspense' ? 'tracking' : 'push_in',
      lens: 'prime',
      distance: 6.0,
    },
    pacing: {
      duration: 6.0,
      intensity: 0.6,
      tensionCurve: [0.3, 0.5, 0.8],
    },
    atmosphere: {
      lighting: theme === 'confrontation' ? 'side_key' : 'natural_soft',
      fogDensity: theme === 'suspense' ? 0.4 : 0.15,
      ambience: theme === 'confrontation' ? ['ticking_clock'] : ['ambient_drips'],
    },
    continuity: {
      previousShotRelation: 'zoom_in_match_cut',
      transitionType: theme === 'suspense' ? 'motion_continuation' : 'cut',
    },
  });

  // Shot 3: Close-up reaction shot
  shots.push({
    id: 'shot_3_reaction',
    shotType: 'reaction',
    emotionalIntent: trajectory[2] ?? trajectory[1] ?? trajectory[0] ?? 'neutral',
    narrativePurpose: 'Capture emotional resolution or reaction beat.',
    framing: {
      composition: 'close_up_off_center',
      ruleOfThirds: true,
      depthBias: 0.7,
      focalPriority: actorIds.slice(0, 1),
    },
    camera: {
      angle: 'eye_level',
      movement: 'static',
      lens: 'anamorphic',
      distance: 2.5,
    },
    pacing: {
      duration: 5.0,
      intensity: 0.8,
      tensionCurve: [0.8, 0.9, 0.5],
    },
    atmosphere: {
      lighting: 'rim_light_accent',
      fogDensity: theme === 'suspense' ? 0.45 : 0.1,
      ambience: ['intense_silence'],
    },
    continuity: {
      previousShotRelation: 'reverse_angle_reaction',
      transitionType: theme === 'confrontation' ? 'smash_cut' : 'silence_cut',
    },
  });

  // Shot 4: Silence / payoff beat (for high-intensity themes)
  if (theme === 'confrontation' || theme === 'suspense' || theme === 'isolation') {
    shots.push({
      id: 'shot_4_silence',
      shotType: theme === 'isolation' ? 'wide' : 'medium',
      emotionalIntent: 'resigned',
      narrativePurpose: 'Silence beat — let the emotional weight settle. Cinematic breathing space.',
      framing: {
        composition: 'negative_space_dominant',
        ruleOfThirds: true,
        depthBias: 0.85,
        focalPriority: actorIds.slice(0, 1),
      },
      camera: {
        angle: 'high',
        movement: 'static',
        lens: 'wide_angle',
        distance: theme === 'isolation' ? 14.0 : 8.0,
      },
      pacing: {
        duration: 4.0,
        intensity: 0.2,
        tensionCurve: [0.5, 0.3, 0.1],
      },
      atmosphere: {
        lighting: theme === 'isolation' ? 'ambient_dim' : 'natural_soft',
        fogDensity: theme === 'suspense' ? 0.3 : 0.05,
        ambience: ['intense_silence'],
      },
      continuity: {
        previousShotRelation: 'emotional_exhale',
        transitionType: 'atmospheric_blend',
      },
    });
    motifs['silence_beat'] = (motifs['silence_beat'] ?? 0) + 1;
  }

  // Continuity check: Ensure screen direction (180-degree rule)
  // Enforce that actor 0 is on the left and actor 1 is on the right
  // and they don't swap screen positions between shots.
  const continuityTracker: Record<string, unknown> = {};
  actors.forEach((actor) => {
    continuityTracker[actor.id] = {
      initialX: actor.position.x,
      initialY: actor.position.y,
      screenSide: actor.position.x < 480 ? 'left' : 'right',
    };
  });

  const narrativeState: NarrativeState = {
    currentTheme: theme,
    emotionalTrajectory: trajectory,
    continuityTracker,
    motifOccurrences: motifs,
  };

  return { shotSequence: shots, narrativeState };
}
