// Vertical Slice Index
// Phase 10: "The Last Train"

export { VerticalSliceFilm } from './VerticalSliceFilm';

// Re-export timeline systems
export { CinematicTimeline } from '../timeline/cinematicTimeline';
export { BeatScheduler } from '../timeline/beatScheduler';
export { RuntimeShotController } from '../timeline/runtimeShotController';

// Re-export export systems
export { FrameCaptureSystem } from '../export/frameCapture';
export { TimelineRenderer } from '../export/timelineRenderer';
export { VideoAssembler } from '../export/videoAssembler';

// Types
export type { TimelineState, EmotionalState, CinematicParameters } from '../timeline/cinematicTimeline';
export type { ScheduledBeat, CinematicResponse } from '../timeline/beatScheduler';
export type { ShotRuntimeState, CinematicParameters as ShotCinematicParameters } from '../timeline/runtimeShotController';
export type { CaptureSession, FrameData, CaptureConfig } from '../export/frameCapture';
export type { RenderConfig, RenderProgress, RenderedOutput } from '../export/timelineRenderer';
export type { AssemblyConfig, AssembledVideo, AssemblyProgress } from '../export/videoAssembler';

// Vertical Slice Constants
export const VERTICAL_SLICE_CONFIG = {
  TITLE: "The Last Train",
  DURATION: 60, // seconds
  TARGET_SHOTS: 8,
  TARGET_EMOTIONAL_BEATS: 5,
  TARGET_TRANSITIONS: 7,
  RESOLUTION: { width: 1920, height: 1080 },
  FRAME_RATE: 30,
  OUTPUT_FORMATS: ['mp4', 'webm', 'gif'] as const,
  EMOTIONAL_ARC: ['loneliness', 'anticipation', 'melancholy', 'tension', 'unresolved'] as const,
  SHOT_TYPES: ['establishing', 'wide', 'medium', 'closeup', 'tracking', 'insert', 'isolation'] as const,
  TRANSITION_TYPES: ['cut', 'fade', 'dissolve', 'whip_pan', 'smash_cut', 'silence_cut', 'atmospheric_blend'] as const
} as const;

// Utility functions
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function calculateProgress(current: number, total: number): number {
  return total > 0 ? current / total : 0;
}

export function getEmotionalColor(emotion: string): string {
  const colorMap: Record<string, string> = {
    'loneliness': '#4a6fa5',
    'anticipation': '#e9c46a',
    'melancholy': '#6d597a',
    'tension': '#e63946',
    'unresolved': '#a9b7c6',
    'neutral': '#6c757d'
  };
  
  return colorMap[emotion] || '#6c757d';
}

export function getShotTypeIcon(shotType: string): string {
  const iconMap: Record<string, string> = {
    'establishing': '🌆',
    'wide': '📷',
    'medium': '🎥',
    'closeup': '👁️',
    'tracking': '🎬',
    'insert': '🔍',
    'isolation': '👤'
  };
  
  return iconMap[shotType] || '🎬';
}

export interface VerticalSliceConfig {
  title: string;
  duration: number;
  shotCount: number;
  emotionalBeats: number;
  resolution?: { width: number; height: number };
  frameRate?: number;
  outputFormats?: readonly string[];
  emotionalArc?: readonly string[];
  shotTypes?: readonly string[];
  transitionTypes?: readonly string[];
}

// Vertical Slice validation
export function validateVerticalSliceConfig(config: VerticalSliceConfig): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (!config.title || config.title.trim() === '') {
    errors.push('Title is required');
  }
  
  if (config.duration < 30 || config.duration > 120) {
    errors.push('Duration must be between 30 and 120 seconds');
  }
  
  if (config.shotCount < 3) {
    errors.push('Minimum 3 shots required');
  }
  
  if (config.emotionalBeats < 2) {
    errors.push('Minimum 2 emotional beats required');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Default film configuration for "The Last Train"
export const DEFAULT_FILM_CONFIG = {
  title: "The Last Train",
  prompt: "A lonely man waits at an empty train station at night during rain.",
  duration: 60,
  emotionalArc: [
    { time: 0, emotion: 'loneliness', intensity: 0.6 },
    { time: 15, emotion: 'anticipation', intensity: 0.4 },
    { time: 30, emotion: 'melancholy', intensity: 0.7 },
    { time: 45, emotion: 'tension', intensity: 0.8 },
    { time: 55, emotion: 'unresolved', intensity: 0.5 }
  ],
  shots: [
    { type: 'establishing', duration: 8, emotion: 'loneliness' },
    { type: 'medium', duration: 7, emotion: 'anticipation' },
    { type: 'closeup', duration: 7, emotion: 'melancholy' },
    { type: 'wide', duration: 10, emotion: 'loneliness' },
    { type: 'tracking', duration: 8, emotion: 'tension' },
    { type: 'medium', duration: 8, emotion: 'decision' },
    { type: 'establishing', duration: 4, emotion: 'unresolved' }
  ],
  atmosphere: {
    effects: ['rain', 'fog', 'puddle_reflections'],
    lighting: 'moonlit',
    audio: ['rain_heavy', 'distant_thunder', 'station_hum']
  }
} as const;