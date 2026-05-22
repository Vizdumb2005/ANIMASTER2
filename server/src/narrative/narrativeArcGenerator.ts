// Narrative Arc Generator for 1-minute cinematic shorts
// Phase 10: Vertical Slice - "The Last Train"

import { SceneTone } from '../types/sharedTypes.js';

export interface NarrativeArc {
  id: string;
  title: string;
  prompt: string;
  durationSeconds: number;
  emotionalProgression: EmotionalBeat[];
  shotSequence: ShotSegment[];
  atmosphereProgression: AtmosphereSegment[];
  pacingProfile: PacingProfile;
}

export interface EmotionalBeat {
  timeStart: number; // seconds
  timeEnd: number;   // seconds
  emotion: string;
  intensity: number; // 0-1
  description: string;
  cinematicPurpose: string;
}

export interface ShotSegment {
  timeStart: number;
  timeEnd: number;
  shotType: string;
  emotionalIntent: string;
  cameraMovement: string;
  framing: string;
  durationSeconds: number;
  transitionToNext: string;
}

export interface AtmosphereSegment {
  timeStart: number;
  timeEnd: number;
  effects: string[];
  lightingTint: string;
  ambientIntensity: number;
  weatherIntensity: number; // 0-1
}

export interface PacingProfile {
  overallTempo: 'slow' | 'medium' | 'fast';
  beatSpacing: number; // average seconds between emotional beats
  silenceRatio: number; // 0-1, proportion of silence/stillness
  tensionCurve: number[]; // tension values at 0%, 25%, 50%, 75%, 100% of duration
}

export function generateNarrativeArc(prompt: string): NarrativeArc {
  // For Phase 10, we'll generate a fixed arc for "The Last Train"
  // In a real implementation, this would use AI to generate from prompt
  
  if (prompt.toLowerCase().includes('train') || prompt.toLowerCase().includes('station')) {
    return generateTheLastTrainArc();
  }
  
  // Default fallback - lonely isolation arc
  return generateLonelyIsolationArc(prompt);
}

function generateTheLastTrainArc(): NarrativeArc {
  const arcId = `train_${Date.now()}`;
  const duration = 60; // 1 minute
  
  return {
    id: arcId,
    title: "The Last Train",
    prompt: "A lonely man waits at an empty train station at night during rain.",
    durationSeconds: duration,
    
    emotionalProgression: [
      {
        timeStart: 0,
        timeEnd: 10,
        emotion: "loneliness",
        intensity: 0.6,
        description: "Establishing isolation - man alone in empty station",
        cinematicPurpose: "Establish emotional baseline and setting"
      },
      {
        timeStart: 10,
        timeEnd: 25,
        emotion: "anticipation",
        intensity: 0.4,
        description: "Subtle waiting - checking watch, looking down tracks",
        cinematicPurpose: "Build subtle tension through waiting"
      },
      {
        timeStart: 25,
        timeEnd: 40,
        emotion: "melancholy",
        intensity: 0.7,
        description: "Deepening regret - memories surface through stillness",
        cinematicPurpose: "Emotional depth through character introspection"
      },
      {
        timeStart: 40,
        timeEnd: 52,
        emotion: "tension",
        intensity: 0.8,
        description: "Train approach - distant lights, growing sound",
        cinematicPurpose: "Climax through environmental change"
      },
      {
        timeStart: 52,
        timeEnd: 60,
        emotion: "unresolved",
        intensity: 0.5,
        description: "Train passes - man remains, decision unmade",
        cinematicPurpose: "Open-ended emotional resolution"
      }
    ],
    
    shotSequence: [
      {
        timeStart: 0,
        timeEnd: 8,
        shotType: "establishing",
        emotionalIntent: "isolation",
        cameraMovement: "static",
        framing: "wide negative space",
        durationSeconds: 8,
        transitionToNext: "slow fade"
      },
      {
        timeStart: 8,
        timeEnd: 15,
        shotType: "medium",
        emotionalIntent: "observation",
        cameraMovement: "subtle drift",
        framing: "rule of thirds left",
        durationSeconds: 7,
        transitionToNext: "cut"
      },
      {
        timeStart: 15,
        timeEnd: 22,
        shotType: "closeup",
        emotionalIntent: "introspection",
        cameraMovement: "static",
        framing: "tight profile",
        durationSeconds: 7,
        transitionToNext: "slow push in"
      },
      {
        timeStart: 22,
        timeEnd: 30,
        shotType: "insert",
        emotionalIntent: "detail",
        cameraMovement: "static",
        framing: "extreme closeup",
        durationSeconds: 8,
        transitionToNext: "cut"
      },
      {
        timeStart: 30,
        timeEnd: 40,
        shotType: "wide",
        emotionalIntent: "loneliness",
        cameraMovement: "slow pan",
        framing: "empty tracks",
        durationSeconds: 10,
        transitionToNext: "atmospheric blend"
      },
      {
        timeStart: 40,
        timeEnd: 48,
        shotType: "tracking",
        emotionalIntent: "anticipation",
        cameraMovement: "slow push",
        framing: "distant lights",
        durationSeconds: 8,
        transitionToNext: "tension cut"
      },
      {
        timeStart: 48,
        timeEnd: 56,
        shotType: "medium",
        emotionalIntent: "decision",
        cameraMovement: "handheld",
        framing: "over shoulder",
        durationSeconds: 8,
        transitionToNext: "silence cut"
      },
      {
        timeStart: 56,
        timeEnd: 60,
        shotType: "establishing",
        emotionalIntent: "resolution",
        cameraMovement: "static",
        framing: "wide isolation",
        durationSeconds: 4,
        transitionToNext: "fade out"
      }
    ],
    
    atmosphereProgression: [
      {
        timeStart: 0,
        timeEnd: 20,
        effects: ["rain", "fog", "puddle_reflections"],
        lightingTint: "#2a3b5c",
        ambientIntensity: 0.3,
        weatherIntensity: 0.6
      },
      {
        timeStart: 20,
        timeEnd: 40,
        effects: ["rain", "fog", "flickering_lights"],
        lightingTint: "#1e2d4a",
        ambientIntensity: 0.25,
        weatherIntensity: 0.7
      },
      {
        timeStart: 40,
        timeEnd: 52,
        effects: ["rain", "train_light_glow", "fog"],
        lightingTint: "#3a4c7a",
        ambientIntensity: 0.4,
        weatherIntensity: 0.8
      },
      {
        timeStart: 52,
        timeEnd: 60,
        effects: ["rain", "fog", "drifting_particles"],
        lightingTint: "#1a2438",
        ambientIntensity: 0.2,
        weatherIntensity: 0.5
      }
    ],
    
    pacingProfile: {
      overallTempo: "slow",
      beatSpacing: 12,
      silenceRatio: 0.4,
      tensionCurve: [0.3, 0.4, 0.6, 0.8, 0.5]
    }
  };
}

function generateLonelyIsolationArc(prompt: string): NarrativeArc {
  const arcId = `isolation_${Date.now()}`;
  const duration = 60;
  
  return {
    id: arcId,
    title: "Lonely Isolation",
    prompt: prompt,
    durationSeconds: duration,
    
    emotionalProgression: [
      {
        timeStart: 0,
        timeEnd: 15,
        emotion: "isolation",
        intensity: 0.7,
        description: "Establishing loneliness in empty space",
        cinematicPurpose: "Set emotional tone"
      },
      {
        timeStart: 15,
        timeEnd: 35,
        emotion: "contemplation",
        intensity: 0.5,
        description: "Internal reflection and memory",
        cinematicPurpose: "Character depth development"
      },
      {
        timeStart: 35,
        timeEnd: 50,
        emotion: "yearning",
        intensity: 0.8,
        description: "Desire for connection or change",
        cinematicPurpose: "Emotional climax"
      },
      {
        timeStart: 50,
        timeEnd: 60,
        emotion: "acceptance",
        intensity: 0.4,
        description: "Quiet resolution to solitude",
        cinematicPurpose: "Emotional resolution"
      }
    ],
    
    shotSequence: [
      {
        timeStart: 0,
        timeEnd: 12,
        shotType: "establishing",
        emotionalIntent: "isolation",
        cameraMovement: "static",
        framing: "wide negative space",
        durationSeconds: 12,
        transitionToNext: "slow fade"
      },
      {
        timeStart: 12,
        timeEnd: 25,
        shotType: "medium",
        emotionalIntent: "observation",
        cameraMovement: "subtle drift",
        framing: "rule of thirds",
        durationSeconds: 13,
        transitionToNext: "cut"
      },
      {
        timeStart: 25,
        timeEnd: 40,
        shotType: "closeup",
        emotionalIntent: "introspection",
        cameraMovement: "slow push in",
        framing: "tight",
        durationSeconds: 15,
        transitionToNext: "slow push in"
      },
      {
        timeStart: 40,
        timeEnd: 52,
        shotType: "wide",
        emotionalIntent: "loneliness",
        cameraMovement: "static",
        framing: "empty space",
        durationSeconds: 12,
        transitionToNext: "atmospheric blend"
      },
      {
        timeStart: 52,
        timeEnd: 60,
        shotType: "establishing",
        emotionalIntent: "resolution",
        cameraMovement: "static",
        framing: "wide isolation",
        durationSeconds: 8,
        transitionToNext: "fade out"
      }
    ],
    
    atmosphereProgression: [
      {
        timeStart: 0,
        timeEnd: 60,
        effects: ["fog", "drifting_particles"],
        lightingTint: "#2a3b5c",
        ambientIntensity: 0.3,
        weatherIntensity: 0.3
      }
    ],
    
    pacingProfile: {
      overallTempo: "slow",
      beatSpacing: 15,
      silenceRatio: 0.5,
      tensionCurve: [0.3, 0.5, 0.7, 0.8, 0.4]
    }
  };
}

export function validateArcCoherence(arc: NarrativeArc): string[] {
  const warnings: string[] = [];
  
  // Check duration matches sum of shot durations
  const totalShotTime = arc.shotSequence.reduce((sum, shot) => sum + shot.durationSeconds, 0);
  if (Math.abs(totalShotTime - arc.durationSeconds) > 2) {
    warnings.push(`Shot sequence duration (${totalShotTime}s) doesn't match arc duration (${arc.durationSeconds}s)`);
  }
  
  // Check emotional progression continuity
  for (let i = 1; i < arc.emotionalProgression.length; i++) {
    const prev = arc.emotionalProgression[i - 1];
    const curr = arc.emotionalProgression[i];
    
    if (prev.timeEnd !== curr.timeStart) {
      warnings.push(`Emotional beat gap between ${prev.timeEnd}s and ${curr.timeStart}s`);
    }
  }
  
  // Check shot sequence continuity
  for (let i = 1; i < arc.shotSequence.length; i++) {
    const prev = arc.shotSequence[i - 1];
    const curr = arc.shotSequence[i];
    
    if (Math.abs(prev.timeEnd - curr.timeStart) > 0.5) {
      warnings.push(`Shot timing gap between ${prev.timeEnd}s and ${curr.timeStart}s`);
    }
  }
  
  return warnings;
}

export function getArcSummary(arc: NarrativeArc): string {
  return `
Narrative Arc: ${arc.title}
Duration: ${arc.durationSeconds} seconds
Emotional Beats: ${arc.emotionalProgression.length}
Shots: ${arc.shotSequence.length}
Pacing: ${arc.pacingProfile.overallTempo} tempo, ${arc.pacingProfile.silenceRatio.toFixed(2)} silence ratio
  `.trim();
}