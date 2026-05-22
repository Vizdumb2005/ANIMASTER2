// Shared types copied from shared directory to avoid cross-package import issues
// This is a temporary solution for TypeScript strict mode compatibility

export type SceneTone = 'neutral' | 'warm' | 'cool' | 'dramatic' | 'tense' | 'romantic' | 'mysterious' | 'nostalgic';
export type ActorEmotion = 'neutral' | 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'disgusted' | 'curious' | 'excited' | 'nervous' | 'determined' | 'relieved' | 'confused' | 'embarrassed' | 'proud' | 'jealous' | 'guilty' | 'hopeful' | 'lonely' | 'content' | 'amused' | 'disappointed' | 'frustrated' | 'grateful' | 'impressed' | 'inspired' | 'nostalgic' | 'optimistic' | 'peaceful' | 'satisfied' | 'skeptical' | 'sympathetic' | 'tender' | 'thoughtful' | 'triumphant' | 'uneasy' | 'whimsical' | 'yearning' | 'awestruck' | 'bittersweet' | 'melancholic' | 'playful' | 'serene' | 'suspenseful' | 'tense' | 'wistful' | 'wonder' | 'zealous' | 'awkward' | 'exhausted';

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
    angle: string;
    movement: string;
    lens: string;
    distance: number;
  };
  pacing: {
    duration: number;
    intensity: number;
    tensionCurve: number[];
  };
  atmosphere: {
    lighting: string;
    fogDensity: number;
    ambience: string[];
  };
  continuity: {
    previousShotRelation: string;
    transitionType:
      | 'cut'
      | 'fade'
      | 'dissolve'
      | 'whip_pan'
      | 'smash_cut'
      | 'silence_cut'
      | 'atmospheric_blend'
      | 'motion_continuation';
  };
}

export interface NarrativeState {
  currentTheme: string;
  emotionalTrajectory: string[];
  continuityTracker: Record<string, any>;
  motifOccurrences: Record<string, number>;
}

// Result type for functional error handling
export type Result<T, E> =
  | { ok: true; value: T }
  | { ok: false; error: E };

export function ok<T, E>(value: T): Result<T, E> {
  return { ok: true, value };
}

export function err<T, E>(error: E): Result<T, E> {
  return { ok: false, error };
}

export function isOk<T, E>(result: Result<T, E>): result is { ok: true; value: T } {
  return result.ok;
}

export function isErr<T, E>(result: Result<T, E>): result is { ok: false; error: E } {
  return !result.ok;
}

export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  return isOk(result) ? result.value : defaultValue;
}

export function map<T, U, E>(result: Result<T, E>, fn: (value: T) => U): Result<U, E> {
  return isOk(result) ? ok(fn(result.value)) : result;
}

export function andThen<T, U, E>(result: Result<T, E>, fn: (value: T) => Result<U, E>): Result<U, E> {
  return isOk(result) ? fn(result.value) : result;
}

export function wrap<T, E>(fn: () => T): () => Result<T, E> {
  return () => {
    try {
      return ok(fn());
    } catch (error) {
      return err(error as E);
    }
  };
}

export function wrapAsync<T, E>(fn: () => Promise<T>): () => Promise<Result<T, E>> {
  return async () => {
    try {
      return ok(await fn());
    } catch (error) {
      return err(error as E);
    }
  };
}