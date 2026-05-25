// Phase 8 — Task Group 5: Shot Language System

export type ShotStyle =
  | 'intimate_closeup'
  | 'oppressive_wide'
  | 'lonely_isolation'
  | 'restrained_observer'
  | 'anxious_handheld'
  | 'emotional_push_in'
  | 'detached_surveillance'
  | 'vulnerable_profile'
  | 'emotional_over_shoulder'
  | 'confrontation_two_shot'
  | 'claustrophobic_tight'
  | 'melancholic_drift';

export interface ShotDefinition {
  style: ShotStyle;
  label: string;
  description: string;
  cameraMode: string;
  zoomRange: { min: number; max: number };
  transitionSpeed: number;
  framingIntent: string;
  emotionalWeight: number;
  preferredTones: string[];
}

export const SHOT_LIBRARY: ShotDefinition[] = [
  {
    style: 'intimate_closeup',
    label: 'Intimate Close-Up',
    description: 'Tight framing on a single subject, revealing emotional detail',
    cameraMode: 'close_up',
    zoomRange: { min: 1.4, max: 2.0 },
    transitionSpeed: 0.4,
    framingIntent: 'isolate',
    emotionalWeight: 0.9,
    preferredTones: ['romantic', 'sad', 'lonely'],
  },
  {
    style: 'oppressive_wide',
    label: 'Oppressive Wide Shot',
    description: 'Wide frame emphasizing emptiness and character smallness',
    cameraMode: 'wide_shot',
    zoomRange: { min: 0.5, max: 0.8 },
    transitionSpeed: 0.3,
    framingIntent: 'observe',
    emotionalWeight: 0.7,
    preferredTones: ['lonely', 'tense', 'threatening'],
  },
  {
    style: 'lonely_isolation',
    label: 'Lonely Isolation Frame',
    description: 'Character framed with maximum negative space',
    cameraMode: 'wide_shot',
    zoomRange: { min: 0.6, max: 0.9 },
    transitionSpeed: 0.2,
    framingIntent: 'isolate',
    emotionalWeight: 0.85,
    preferredTones: ['lonely', 'sad'],
  },
  {
    style: 'restrained_observer',
    label: 'Restrained Observer',
    description: 'Static camera maintaining distance, documentary feel',
    cameraMode: 'static',
    zoomRange: { min: 0.8, max: 1.1 },
    transitionSpeed: 0.15,
    framingIntent: 'observe',
    emotionalWeight: 0.4,
    preferredTones: ['neutral', 'awkward', 'tense'],
  },
  {
    style: 'anxious_handheld',
    label: 'Anxious Handheld',
    description: 'Slight camera shake creating unease and instability',
    cameraMode: 'follow',
    zoomRange: { min: 0.9, max: 1.3 },
    transitionSpeed: 0.7,
    framingIntent: 'follow',
    emotionalWeight: 0.75,
    preferredTones: ['tense', 'energetic', 'threatening'],
  },
  {
    style: 'emotional_push_in',
    label: 'Emotional Push-In',
    description: 'Slow camera movement toward subject during emotional peak',
    cameraMode: 'dramatic_zoom',
    zoomRange: { min: 1.0, max: 1.8 },
    transitionSpeed: 0.25,
    framingIntent: 'emphasize',
    emotionalWeight: 0.95,
    preferredTones: ['sad', 'romantic', 'tense'],
  },
  {
    style: 'detached_surveillance',
    label: 'Detached Surveillance',
    description: 'High or distant angle suggesting observation without engagement',
    cameraMode: 'static',
    zoomRange: { min: 0.6, max: 0.85 },
    transitionSpeed: 0.1,
    framingIntent: 'observe',
    emotionalWeight: 0.3,
    preferredTones: ['tense', 'threatening', 'neutral'],
  },
  {
    style: 'vulnerable_profile',
    label: 'Vulnerable Profile Shot',
    description: 'Side framing exposing character vulnerability',
    cameraMode: 'close_up',
    zoomRange: { min: 1.1, max: 1.5 },
    transitionSpeed: 0.35,
    framingIntent: 'isolate',
    emotionalWeight: 0.8,
    preferredTones: ['sad', 'lonely', 'awkward'],
  },
  {
    style: 'emotional_over_shoulder',
    label: 'Emotional Over-the-Shoulder',
    description: 'Shot from behind one character looking at another',
    cameraMode: 'over_the_shoulder',
    zoomRange: { min: 1.0, max: 1.4 },
    transitionSpeed: 0.45,
    framingIntent: 'confront',
    emotionalWeight: 0.7,
    preferredTones: ['tense', 'romantic', 'awkward'],
  },
  {
    style: 'confrontation_two_shot',
    label: 'Confrontation Two-Shot',
    description: 'Both characters framed in compressed space',
    cameraMode: 'tension',
    zoomRange: { min: 0.9, max: 1.2 },
    transitionSpeed: 0.5,
    framingIntent: 'compress',
    emotionalWeight: 0.85,
    preferredTones: ['tense', 'threatening'],
  },
  {
    style: 'claustrophobic_tight',
    label: 'Claustrophobic Tight',
    description: 'Extremely close framing creating sense of being trapped',
    cameraMode: 'close_up',
    zoomRange: { min: 1.6, max: 2.2 },
    transitionSpeed: 0.3,
    framingIntent: 'compress',
    emotionalWeight: 0.9,
    preferredTones: ['tense', 'threatening', 'awkward'],
  },
  {
    style: 'melancholic_drift',
    label: 'Melancholic Drift',
    description: 'Slow lateral movement suggesting emotional detachment',
    cameraMode: 'follow',
    zoomRange: { min: 0.8, max: 1.1 },
    transitionSpeed: 0.15,
    framingIntent: 'observe',
    emotionalWeight: 0.65,
    preferredTones: ['sad', 'lonely'],
  },
];

export function getShotForTone(tone: string): ShotDefinition {
  const matches = SHOT_LIBRARY.filter((s) => s.preferredTones.includes(tone));
  if (matches.length === 0) return SHOT_LIBRARY[3]; // restrained_observer
  return matches[Math.floor(Math.random() * matches.length)];
}

export function getShotByStyle(style: ShotStyle): ShotDefinition | undefined {
  return SHOT_LIBRARY.find((s) => s.style === style);
}

export function getAllShotStyles(): ShotDefinition[] {
  return [...SHOT_LIBRARY];
}

// Phase 9 - Shot-Based storytelling & narrative sequencing system

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
    transitionType:
      | 'cut'          // hard cut — abrupt change
      | 'fade'         // fade to/from black
      | 'dissolve'     // cross-dissolve overlap
      | 'whip_pan'     // fast lateral pan
      | 'smash_cut'    // jarring emotional punctuation
      | 'silence_cut'  // cut into silence/stillness
      | 'atmospheric_blend' // gradual atmospheric crossfade
      | 'motion_continuation'; // camera carries motion across cut
  };
}

export interface ContinuityTrackerEntry {
  initialX: number;
  initialY: number;
  screenSide: 'left' | 'right';
}

export interface NarrativeState {
  currentTheme: string;
  emotionalTrajectory: string[];
  continuityTracker: Record<string, ContinuityTrackerEntry>;
  motifOccurrences: Record<string, number>;
}

// Section 7 — Audio Atmosphere System
export interface AtmosphereAudio {
  ambience: string[];     // e.g. ['rain_heavy', 'distant_thunder', 'fluorescent_hum']
  intensity: number;      // 0 to 1 — how prominent the sound is
  spatialDepth: number;   // 0 to 1 — near (0) to far/environmental (1)
  emotionalTone: string;  // e.g. 'grief', 'tension', 'isolation', 'warmth'
}

