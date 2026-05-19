import type { SceneGraph, SceneTone, ActorEmotion, CameraMode } from '@animaster/shared/scene';

export type DirectorCommandType =
  | 'tone'
  | 'emotion'
  | 'camera'
  | 'atmosphere'
  | 'pacing'
  | 'relationship'
  | 'spacing'
  | 'lighting'
  | 'style'
  | 'compound';

export interface DirectorCommand {
  type: DirectorCommandType;
  rawInput: string;
  tone?: SceneTone;
  emotion?: { target: string; emotion: ActorEmotion; intensity: number };
  camera?: { mode?: CameraMode; push?: number; speed?: number };
  atmosphere?: { effect?: string; intensity?: number };
  pacing?: { tempo?: 'slow' | 'medium' | 'fast'; pauseWeight?: number };
  spacing?: { delta: number; intent: string };
  lighting?: { tint?: string; ambientDelta?: number };
  subCommands?: DirectorCommand[];
}

const TONE_PATTERNS: Array<{ pattern: RegExp; tone: SceneTone }> = [
  { pattern: /lonely|lonelier|isolation|isolated|alone/i, tone: 'lonely' },
  { pattern: /tense|tension|pressure|pressured|trapped|claustrophobic/i, tone: 'tense' },
  { pattern: /sad|melanchol|sorrow|grief|depressed/i, tone: 'sad' },
  { pattern: /awkward|uncomfortable|uneasy/i, tone: 'awkward' },
  { pattern: /romantic|intimate|tender|love/i, tone: 'romantic' },
  { pattern: /energetic|chaotic|frantic|urgent/i, tone: 'energetic' },
  { pattern: /threatening|menacing|danger/i, tone: 'threatening' },
];

const EMOTION_PATTERNS: Array<{ pattern: RegExp; emotion: ActorEmotion }> = [
  { pattern: /nervous|anxious|fidget/i, emotion: 'nervous' },
  { pattern: /sad|cry|weep|sorrow/i, emotion: 'sad' },
  { pattern: /happy|smile|joy/i, emotion: 'happy' },
  { pattern: /angry|furious|rage/i, emotion: 'angry' },
  { pattern: /exhaust|tired|weary/i, emotion: 'exhausted' },
  { pattern: /excited|thrill/i, emotion: 'excited' },
  { pattern: /awkward|embarrass/i, emotion: 'awkward' },
];

const CAMERA_PATTERNS: Array<{ pattern: RegExp; mode: CameraMode; push: number }> = [
  { pattern: /push.*closer|push.*in|move.*closer|camera.*closer/i, mode: 'close_up', push: 0.3 },
  { pattern: /pull.*back|pull.*out|widen.*shot|wider/i, mode: 'wide_shot', push: -0.3 },
  { pattern: /close.*up|intimate.*frame|intimate.*framing/i, mode: 'close_up', push: 0.2 },
  { pattern: /wide.*shot|establish/i, mode: 'wide_shot', push: -0.2 },
  { pattern: /follow|track/i, mode: 'follow', push: 0 },
  { pattern: /dramatic.*zoom|zoom.*in/i, mode: 'dramatic_zoom', push: 0.4 },
  { pattern: /over.*shoulder/i, mode: 'over_the_shoulder', push: 0.1 },
  { pattern: /hold.*shot|hold.*longer|linger/i, mode: 'static', push: 0 },
];

export function parseDirectorCommand(input: string, scene: SceneGraph): DirectorCommand {
  const cmd: DirectorCommand = { type: 'compound', rawInput: input, subCommands: [] };

  // Detect tone
  for (const { pattern, tone } of TONE_PATTERNS) {
    if (pattern.test(input)) {
      cmd.subCommands!.push({ type: 'tone', rawInput: input, tone });
      break;
    }
  }

  // Detect emotional direction for actors
  if (scene.actors.length > 0) {
    for (const { pattern, emotion } of EMOTION_PATTERNS) {
      if (pattern.test(input)) {
        const actorTarget = resolveActorTarget(input, scene);
        const intensity = /intensely|very|extremely|deeply/i.test(input) ? 1.0 : 0.8;
        cmd.subCommands!.push({
          type: 'emotion',
          rawInput: input,
          emotion: { target: actorTarget, emotion, intensity }
        });
        break;
      }
    }
  }

  // Detect camera direction
  for (const { pattern, mode, push } of CAMERA_PATTERNS) {
    if (pattern.test(input)) {
      const speed = /slowly|slow|gentle|gradual/i.test(input) ? 0.3 : /quickly|fast|snap/i.test(input) ? 1.0 : 0.6;
      cmd.subCommands!.push({ type: 'camera', rawInput: input, camera: { mode, push, speed } });
      break;
    }
  }

  // Detect atmosphere
  if (/silence|silent|quiet/i.test(input)) {
    const weight = /heavy|heavier|oppressive|uncomfortable/i.test(input) ? 0.9 : 0.6;
    cmd.subCommands!.push({ type: 'pacing', rawInput: input, pacing: { tempo: 'slow', pauseWeight: weight } });
  }
  if (/rain|storm/i.test(input)) {
    cmd.subCommands!.push({ type: 'atmosphere', rawInput: input, atmosphere: { effect: 'rain', intensity: 0.8 } });
  }
  if (/fog|haze|mist/i.test(input)) {
    cmd.subCommands!.push({ type: 'atmosphere', rawInput: input, atmosphere: { effect: 'fog', intensity: 0.7 } });
  }
  if (/flicker|strobe/i.test(input)) {
    cmd.subCommands!.push({ type: 'atmosphere', rawInput: input, atmosphere: { effect: 'flicker', intensity: 0.6 } });
  }

  // Detect spacing / emotional distance
  if (/emotional.*distance|distance.*between|further.*apart|move.*apart/i.test(input)) {
    cmd.subCommands!.push({ type: 'spacing', rawInput: input, spacing: { delta: 80, intent: 'distance' } });
  } else if (/closer.*together|bring.*closer|reduce.*distance/i.test(input)) {
    cmd.subCommands!.push({ type: 'spacing', rawInput: input, spacing: { delta: -60, intent: 'closeness' } });
  }

  // Detect lighting
  if (/colder|cold.*light|blue.*light/i.test(input)) {
    cmd.subCommands!.push({ type: 'lighting', rawInput: input, lighting: { tint: 'cold', ambientDelta: -0.15 } });
  } else if (/warmer|warm.*light|golden/i.test(input)) {
    cmd.subCommands!.push({ type: 'lighting', rawInput: input, lighting: { tint: 'warm', ambientDelta: 0.1 } });
  } else if (/darker|dim/i.test(input)) {
    cmd.subCommands!.push({ type: 'lighting', rawInput: input, lighting: { ambientDelta: -0.25 } });
  } else if (/brighter|bright/i.test(input)) {
    cmd.subCommands!.push({ type: 'lighting', rawInput: input, lighting: { ambientDelta: 0.2 } });
  }

  // Detect pacing
  if (/slow.*down|slower|decelerate/i.test(input)) {
    cmd.subCommands!.push({ type: 'pacing', rawInput: input, pacing: { tempo: 'slow' } });
  } else if (/speed.*up|faster|accelerate/i.test(input)) {
    cmd.subCommands!.push({ type: 'pacing', rawInput: input, pacing: { tempo: 'fast' } });
  }

  // If only one sub-command, simplify
  if (cmd.subCommands!.length === 1) {
    return cmd.subCommands![0];
  }
  if (cmd.subCommands!.length === 0) {
    // Fallback: treat as a tone/mood shift attempt
    return { type: 'tone', rawInput: input };
  }

  return cmd;
}

function resolveActorTarget(input: string, scene: SceneGraph): string {
  // Check for actor label mentions
  for (const actor of scene.actors) {
    if (input.toLowerCase().includes(actor.label.toLowerCase())) {
      return actor.id;
    }
  }
  // Check for pronouns
  if (/\bher\b|\bshe\b/i.test(input) && scene.actors.length >= 2) return scene.actors[1].id;
  if (/\bhim\b|\bhe\b/i.test(input) && scene.actors.length >= 1) return scene.actors[0].id;
  // Default to first actor
  return scene.actors[0]?.id ?? '';
}
