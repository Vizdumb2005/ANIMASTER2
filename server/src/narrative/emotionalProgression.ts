// Emotional Progression System for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { ActorEmotion } from '../../../shared/src/scene.js';
import { EmotionalBeat } from './narrativeArcGenerator.js';

export interface EmotionalState {
  emotion: ActorEmotion;
  intensity: number; // 0-1
  physicalManifestation: string;
  gazeDirection: string;
  posture: string;
  breathingRate: 'slow' | 'normal' | 'fast';
}

export interface EmotionalTransition {
  from: EmotionalState;
  to: EmotionalState;
  durationSeconds: number;
  transitionCurve: 'linear' | 'ease_in' | 'ease_out' | 'sigmoid';
  physicalTransition: string;
}

export function generateEmotionalProgression(beats: EmotionalBeat[]): EmotionalTransition[] {
  const transitions: EmotionalTransition[] = [];
  
  // Convert emotional beats to emotional states
  const emotionalStates = beats.map(beat => ({
    emotion: mapEmotionStringToActorEmotion(beat.emotion),
    intensity: beat.intensity,
    physicalManifestation: getPhysicalManifestation(beat.emotion, beat.intensity),
    gazeDirection: getGazeDirection(beat.emotion, beat.intensity),
    posture: getPosture(beat.emotion, beat.intensity),
    breathingRate: getBreathingRate(beat.emotion, beat.intensity)
  }));
  
  // Create transitions between states
  for (let i = 0; i < emotionalStates.length - 1; i++) {
    const fromState = emotionalStates[i];
    const toState = emotionalStates[i + 1];
    const beatDuration = beats[i + 1].timeStart - beats[i].timeStart;
    
    transitions.push({
      from: fromState,
      to: toState,
      durationSeconds: beatDuration,
      transitionCurve: getTransitionCurve(beats[i].emotion, beats[i + 1].emotion),
      physicalTransition: getPhysicalTransition(fromState, toState)
    });
  }
  
  return transitions;
}

function mapEmotionStringToActorEmotion(emotion: string): ActorEmotion {
  const emotionMap: Record<string, ActorEmotion> = {
    'loneliness': 'sad',
    'anticipation': 'nervous',
    'melancholy': 'sad',
    'tension': 'nervous',
    'unresolved': 'neutral',
    'isolation': 'sad',
    'contemplation': 'neutral',
    'yearning': 'excited',
    'acceptance': 'neutral',
    'sad': 'sad',
    'happy': 'happy',
    'nervous': 'nervous',
    'excited': 'excited',
    'awkward': 'awkward',
    'angry': 'angry',
    'exhausted': 'exhausted'
  };
  
  return emotionMap[emotion.toLowerCase()] || 'neutral';
}

function getPhysicalManifestation(emotion: string, intensity: number): string {
  const manifestations: Record<string, string[]> = {
    'loneliness': ['slumped shoulders', 'slow movements', 'downward gaze'],
    'anticipation': ['fidgeting hands', 'checking watch', 'shifting weight'],
    'melancholy': ['stillness', 'deep breaths', 'distant gaze'],
    'tension': ['tense shoulders', 'clenched hands', 'rapid eye movement'],
    'unresolved': ['hesitant posture', 'uncertain stance', 'glancing around'],
    'sad': ['drooping posture', 'slow movements', 'downcast eyes'],
    'nervous': ['fidgeting', 'quick glances', 'restless shifting'],
    'neutral': ['relaxed posture', 'steady breathing', 'calm gaze']
  };
  
  const base = manifestations[emotion] || ['neutral posture'];
  const intensityModifier = intensity > 0.7 ? 'pronounced ' : intensity < 0.3 ? 'subtle ' : '';
  return intensityModifier + base[Math.floor(Math.random() * base.length)];
}

function getGazeDirection(emotion: string, intensity: number): string {
  const gazeMap: Record<string, string[]> = {
    'loneliness': ['downward', 'distant', 'empty space'],
    'anticipation': ['horizon', 'expected direction', 'checking multiple points'],
    'melancholy': ['middle distance', 'memory focus', 'internal gaze'],
    'tension': ['rapid scanning', 'fixed on threat', 'avoidant'],
    'unresolved': ['uncertain direction', 'shifting focus', 'avoiding decision point']
  };
  
  const base = gazeMap[emotion] || ['forward'];
  return base[Math.floor(Math.random() * base.length)];
}

function getPosture(emotion: string, intensity: number): string {
  const postureMap: Record<string, string[]> = {
    'loneliness': ['closed', 'withdrawn', 'protective'],
    'anticipation': ['leaning forward', 'ready stance', 'alert'],
    'melancholy': ['heavy', 'weighted', 'still'],
    'tension': ['tight', 'braced', 'defensive'],
    'unresolved': ['hesitant', 'uncommitted', 'transitional']
  };
  
  const base = postureMap[emotion] || ['neutral'];
  const intensityLevel = intensity > 0.7 ? 'strongly ' : intensity < 0.3 ? 'slightly ' : '';
  return intensityLevel + base[Math.floor(Math.random() * base.length)];
}

function getBreathingRate(emotion: string, intensity: number): 'slow' | 'normal' | 'fast' {
  const breathingMap: Record<string, 'slow' | 'normal' | 'fast'> = {
    'loneliness': 'slow',
    'anticipation': intensity > 0.5 ? 'fast' : 'normal',
    'melancholy': 'slow',
    'tension': 'fast',
    'unresolved': 'normal',
    'sad': 'slow',
    'nervous': 'fast',
    'excited': 'fast'
  };
  
  return breathingMap[emotion] || 'normal';
}

function getTransitionCurve(fromEmotion: string, toEmotion: string): 'linear' | 'ease_in' | 'ease_out' | 'sigmoid' {
  // Emotional transitions have different curves based on the emotional shift
  const intenseTransitions = ['tension', 'anticipation', 'excited'];
  const gentleTransitions = ['loneliness', 'melancholy', 'sad'];
  
  const fromIntense = intenseTransitions.includes(fromEmotion);
  const toIntense = intenseTransitions.includes(toEmotion);
  const fromGentle = gentleTransitions.includes(fromEmotion);
  const toGentle = gentleTransitions.includes(toEmotion);
  
  if (fromIntense && toGentle) return 'ease_out'; // Intense to gentle
  if (fromGentle && toIntense) return 'ease_in';  // Gentle to intense
  if (fromIntense && toIntense) return 'sigmoid'; // Intense to intense
  return 'linear'; // Default
}

function getPhysicalTransition(from: EmotionalState, to: EmotionalState): string {
  const transitions: Record<string, string> = {
    'sad->nervous': 'gradual tension building in shoulders',
    'nervous->sad': 'release of tension into heaviness',
    'neutral->sad': 'slow sinking into melancholy',
    'sad->neutral': 'gradual re-engagement with surroundings',
    'nervous->excited': 'energy conversion from anxiety to anticipation',
    'excited->nervous': 'anticipation turning to anxiety'
  };
  
  const key = `${from.emotion}->${to.emotion}`;
  return transitions[key] || 'natural emotional shift';
}

export function calculateEmotionalIntensityAtTime(
  transitions: EmotionalTransition[],
  timeSeconds: number
): { emotion: ActorEmotion; intensity: number } {
  if (transitions.length === 0) {
    return { emotion: 'neutral', intensity: 0.5 };
  }
  
  // Find which transition we're in
  let accumulatedTime = 0;
  for (const transition of transitions) {
    if (timeSeconds >= accumulatedTime && timeSeconds <= accumulatedTime + transition.durationSeconds) {
      const progress = (timeSeconds - accumulatedTime) / transition.durationSeconds;
      
      // Apply transition curve
      let easedProgress = progress;
      switch (transition.transitionCurve) {
        case 'ease_in':
          easedProgress = progress * progress;
          break;
        case 'ease_out':
          easedProgress = 1 - (1 - progress) * (1 - progress);
          break;
        case 'sigmoid':
          easedProgress = 0.5 - 0.5 * Math.cos(Math.PI * progress);
          break;
      }
      
      const intensity = transition.from.intensity + 
        (transition.to.intensity - transition.from.intensity) * easedProgress;
      
      return {
        emotion: progress > 0.5 ? transition.to.emotion : transition.from.emotion,
        intensity
      };
    }
    accumulatedTime += transition.durationSeconds;
  }
  
  // If past all transitions, return the final state
  const lastTransition = transitions[transitions.length - 1];
  return {
    emotion: lastTransition.to.emotion,
    intensity: lastTransition.to.intensity
  };
}

export function getEmotionalStateDescription(state: EmotionalState): string {
  return `
Emotion: ${state.emotion}
Intensity: ${(state.intensity * 100).toFixed(0)}%
Physical: ${state.physicalManifestation}
Gaze: ${state.gazeDirection}
Posture: ${state.posture}
Breathing: ${state.breathingRate}
  `.trim();
}