// Cinematic Timeline for 1-minute shorts
// Phase 10: Vertical Slice

import { SequencedShot } from '../../../server/src/shots/shotSequencer';
import { TransitionPlan } from '../../../server/src/shots/transitionPlanner';
import { EmotionalBeat } from '../../../server/src/narrative/narrativeArcGenerator';

export interface TimelineState {
  currentTimeSeconds: number;
  totalDurationSeconds: number;
  isPlaying: boolean;
  playbackSpeed: number; // 0.5, 1.0, 2.0
  currentShotIndex: number;
  currentTransitionIndex: number | null;
  emotionalState: EmotionalState;
  cinematicParameters: CinematicParameters;
}

export interface EmotionalState {
  primaryEmotion: string;
  intensity: number; // 0-1
  physicalManifestation: string;
  gazeDirection: string;
  breathingRate: 'slow' | 'normal' | 'fast';
}

export interface CinematicParameters {
  cameraTightness: number; // 0-1
  movementEnergy: number; // 0-1
  editingPace: number; // 0-1
  audioDensity: number; // 0-1
  visualComplexity: number; // 0-1
}

export interface TimelineEvent {
  timeSeconds: number;
  type: 'shot_start' | 'shot_end' | 'transition_start' | 'transition_end' | 'emotional_beat' | 'atmosphere_change';
  data: any;
}

export class CinematicTimeline {
  private shots: SequencedShot[];
  private transitions: TransitionPlan[];
  private emotionalBeats: EmotionalBeat[];
  private events: TimelineEvent[] = [];
  private state: TimelineState;
  
  constructor(
    shots: SequencedShot[],
    transitions: TransitionPlan[],
    emotionalBeats: EmotionalBeat[]
  ) {
    this.shots = shots;
    this.transitions = transitions;
    this.emotionalBeats = emotionalBeats;
    
    // Build event timeline
    this.buildEventTimeline();
    
    // Initialize state
    this.state = {
      currentTimeSeconds: 0,
      totalDurationSeconds: shots[shots.length - 1]?.endTimeSeconds || 60,
      isPlaying: false,
      playbackSpeed: 1.0,
      currentShotIndex: 0,
      currentTransitionIndex: null,
      emotionalState: this.getEmotionalStateAtTime(0),
      cinematicParameters: this.getCinematicParametersAtTime(0)
    };
  }
  
  private buildEventTimeline(): void {
    // Add shot events
    this.shots.forEach((shot, index) => {
      this.events.push({
        timeSeconds: shot.startTimeSeconds,
        type: 'shot_start',
        data: { shot, index }
      });
      
      this.events.push({
        timeSeconds: shot.endTimeSeconds,
        type: 'shot_end',
        data: { shot, index }
      });
    });
    
    // Add transition events
    this.transitions.forEach((transition, index) => {
      const fromShot = this.shots.find(s => s.id === transition.fromShotId);
      if (fromShot) {
        this.events.push({
          timeSeconds: fromShot.endTimeSeconds - transition.durationSeconds,
          type: 'transition_start',
          data: { transition, index }
        });
        
        this.events.push({
          timeSeconds: fromShot.endTimeSeconds,
          type: 'transition_end',
          data: { transition, index }
        });
      }
    });
    
    // Add emotional beat events
    this.emotionalBeats.forEach((beat, index) => {
      this.events.push({
        timeSeconds: beat.timeStart,
        type: 'emotional_beat',
        data: { beat, index }
      });
    });
    
    // Sort events by time
    this.events.sort((a, b) => a.timeSeconds - b.timeSeconds);
  }
  
  public update(deltaTimeSeconds: number): void {
    if (!this.state.isPlaying) return;
    
    const previousTime = this.state.currentTimeSeconds;
    this.state.currentTimeSeconds += deltaTimeSeconds * this.state.playbackSpeed;
    
    // Clamp to timeline bounds
    if (this.state.currentTimeSeconds < 0) {
      this.state.currentTimeSeconds = 0;
    } else if (this.state.currentTimeSeconds > this.state.totalDurationSeconds) {
      this.state.currentTimeSeconds = this.state.totalDurationSeconds;
      this.state.isPlaying = false;
    }
    
    // Update current shot index
    this.updateCurrentShot();
    
    // Update current transition index
    this.updateCurrentTransition();
    
    // Update emotional state
    this.state.emotionalState = this.getEmotionalStateAtTime(this.state.currentTimeSeconds);
    
    // Update cinematic parameters
    this.state.cinematicParameters = this.getCinematicParametersAtTime(this.state.currentTimeSeconds);
    
    // Trigger events between previous time and current time
    this.triggerEventsBetween(previousTime, this.state.currentTimeSeconds);
  }
  
  private updateCurrentShot(): void {
    for (let i = 0; i < this.shots.length; i++) {
      const shot = this.shots[i];
      if (this.state.currentTimeSeconds >= shot.startTimeSeconds && 
          this.state.currentTimeSeconds <= shot.endTimeSeconds) {
        this.state.currentShotIndex = i;
        return;
      }
    }
    
    // If not in any shot, find nearest
    if (this.state.currentTimeSeconds < this.shots[0].startTimeSeconds) {
      this.state.currentShotIndex = 0;
    } else if (this.state.currentTimeSeconds > this.shots[this.shots.length - 1].endTimeSeconds) {
      this.state.currentShotIndex = this.shots.length - 1;
    }
  }
  
  private updateCurrentTransition(): void {
    this.state.currentTransitionIndex = null;
    
    for (let i = 0; i < this.transitions.length; i++) {
      const transition = this.transitions[i];
      const fromShot = this.shots.find(s => s.id === transition.fromShotId);
      
      if (fromShot) {
        const transitionStart = fromShot.endTimeSeconds - transition.durationSeconds;
        const transitionEnd = fromShot.endTimeSeconds;
        
        if (this.state.currentTimeSeconds >= transitionStart && 
            this.state.currentTimeSeconds <= transitionEnd) {
          this.state.currentTransitionIndex = i;
          return;
        }
      }
    }
  }
  
  private getEmotionalStateAtTime(timeSeconds: number): EmotionalState {
    // Find current emotional beat
    let currentBeat: EmotionalBeat | null = null;
    for (const beat of this.emotionalBeats) {
      if (timeSeconds >= beat.timeStart && timeSeconds <= beat.timeEnd) {
        currentBeat = beat;
        break;
      }
    }
    
    if (!currentBeat) {
      // Find nearest beat
      currentBeat = this.emotionalBeats.reduce((nearest, beat) => {
        const beatMid = (beat.timeStart + beat.timeEnd) / 2;
        const currentDist = Math.abs(beatMid - timeSeconds);
        const nearestDist = Math.abs((nearest.timeStart + nearest.timeEnd) / 2 - timeSeconds);
        return currentDist < nearestDist ? beat : nearest;
      }, this.emotionalBeats[0]);
    }
    
    // Get physical manifestation based on emotion and intensity
    const physicalManifestation = this.getPhysicalManifestation(currentBeat.emotion, currentBeat.intensity);
    const gazeDirection = this.getGazeDirection(currentBeat.emotion);
    const breathingRate = this.getBreathingRate(currentBeat.emotion, currentBeat.intensity);
    
    return {
      primaryEmotion: currentBeat.emotion,
      intensity: currentBeat.intensity,
      physicalManifestation,
      gazeDirection,
      breathingRate
    };
  }
  
  private getPhysicalManifestation(emotion: string, intensity: number): string {
    const manifestations: Record<string, string[]> = {
      'loneliness': ['slumped shoulders', 'slow movements', 'downward gaze'],
      'anticipation': ['fidgeting hands', 'checking watch', 'shifting weight'],
      'melancholy': ['stillness', 'deep breaths', 'distant gaze'],
      'tension': ['tense shoulders', 'clenched hands', 'rapid eye movement'],
      'unresolved': ['hesitant posture', 'uncertain stance', 'glancing around']
    };
    
    const options = manifestations[emotion] || ['neutral posture'];
    const intensityMod = intensity > 0.7 ? 'pronounced ' : intensity < 0.3 ? 'subtle ' : '';
    return intensityMod + options[Math.floor(Math.random() * options.length)];
  }
  
  private getGazeDirection(emotion: string): string {
    const gazeMap: Record<string, string[]> = {
      'loneliness': ['downward', 'distant', 'empty space'],
      'anticipation': ['horizon', 'expected direction', 'checking points'],
      'melancholy': ['middle distance', 'memory focus', 'internal'],
      'tension': ['scanning', 'fixed on threat', 'avoidant'],
      'unresolved': ['uncertain', 'shifting', 'avoiding decision']
    };
    
    const options = gazeMap[emotion] || ['forward'];
    return options[Math.floor(Math.random() * options.length)];
  }
  
  private getBreathingRate(emotion: string, intensity: number): 'slow' | 'normal' | 'fast' {
    const breathingMap: Record<string, 'slow' | 'normal' | 'fast'> = {
      'loneliness': 'slow',
      'anticipation': intensity > 0.5 ? 'fast' : 'normal',
      'melancholy': 'slow',
      'tension': 'fast',
      'unresolved': 'normal'
    };
    
    return breathingMap[emotion] || 'normal';
  }
  
  private getCinematicParametersAtTime(timeSeconds: number): CinematicParameters {
    // Find current shot
    let currentShot: SequencedShot | null = null;
    for (const shot of this.shots) {
      if (timeSeconds >= shot.startTimeSeconds && timeSeconds <= shot.endTimeSeconds) {
        currentShot = shot;
        break;
      }
    }
    
    if (!currentShot) {
      return {
        cameraTightness: 0.5,
        movementEnergy: 0.3,
        editingPace: 0.4,
        audioDensity: 0.5,
        visualComplexity: 0.5
      };
    }
    
    // Calculate parameters based on shot
    const cameraTightness = 1 - currentShot.cameraSpecs.distance; // 0=wide, 1=close
    const movementEnergy = currentShot.cameraSpecs.speed;
    
    // Editing pace based on shot duration (shorter = faster editing)
    const editingPace = 1 - (currentShot.durationSeconds / 15); // Normalize to 0-1
    
    // Audio density based on emotional intensity
    const audioDensity = currentShot.emotionalWeight * 0.7 + 0.3;
    
    // Visual complexity based on shot type and framing
    let visualComplexity = 0.5;
    if (currentShot.shotType.includes('closeup')) visualComplexity += 0.2;
    if (currentShot.framing.depthBias > 0.7) visualComplexity += 0.1;
    if (currentShot.framing.focalPriority.length > 1) visualComplexity += 0.1;
    
    // Adjust for transition if in one
    if (this.state.currentTransitionIndex !== null) {
      const transition = this.transitions[this.state.currentTransitionIndex];
      const transitionProgress = this.getTransitionProgress(timeSeconds, transition);
      
      // Blend parameters during transition
      const nextShot = this.shots.find(s => s.id === transition.toShotId);
      if (nextShot) {
        const nextTightness = 1 - nextShot.cameraSpecs.distance;
        const nextMovement = nextShot.cameraSpecs.speed;
        const nextEditing = 1 - (nextShot.durationSeconds / 15);
        const nextAudio = nextShot.emotionalWeight * 0.7 + 0.3;
        
        cameraTightness = cameraTightness * (1 - transitionProgress) + nextTightness * transitionProgress;
        movementEnergy = movementEnergy * (1 - transitionProgress) + nextMovement * transitionProgress;
        editingPace = editingPace * (1 - transitionProgress) + nextEditing * transitionProgress;
        audioDensity = audioDensity * (1 - transitionProgress) + nextAudio * transitionProgress;
      }
    }
    
    return {
      cameraTightness: Math.min(Math.max(cameraTightness, 0), 1),
      movementEnergy: Math.min(Math.max(movementEnergy, 0), 1),
      editingPace: Math.min(Math.max(editingPace, 0), 1),
      audioDensity: Math.min(Math.max(audioDensity, 0), 1),
      visualComplexity: Math.min(Math.max(visualComplexity, 0), 1)
    };
  }
  
  private getTransitionProgress(timeSeconds: number, transition: TransitionPlan): number {
    const fromShot = this.shots.find(s => s.id === transition.fromShotId);
    if (!fromShot) return 0;
    
    const transitionStart = fromShot.endTimeSeconds - transition.durationSeconds;
    const transitionEnd = fromShot.endTimeSeconds;
    
    if (timeSeconds < transitionStart) return 0;
    if (timeSeconds > transitionEnd) return 1;
    
    return (timeSeconds - transitionStart) / transition.durationSeconds;
  }
  
  private triggerEventsBetween(startTime: number, endTime: number): void {
    const eventsToTrigger = this.events.filter(event => 
      event.timeSeconds > startTime && event.timeSeconds <= endTime
    );
    
    eventsToTrigger.forEach(event => {
      this.handleEvent(event);
    });
  }
  
  private handleEvent(event: TimelineEvent): void {
    switch (event.type) {
      case 'shot_start':
        console.log(`Shot ${event.data.index + 1} started: ${event.data.shot.shotType}`);
        break;
        
      case 'shot_end':
        console.log(`Shot ${event.data.index + 1} ended: ${event.data.shot.shotType}`);
        break;
        
      case 'transition_start':
        console.log(`Transition started: ${event.data.transition.type}`);
        break;
        
      case 'transition_end':
        console.log(`Transition ended: ${event.data.transition.type}`);
        break;
        
      case 'emotional_beat':
        console.log(`Emotional beat: ${event.data.beat.emotion} (${event.data.beat.intensity})`);
        break;
    }
  }
  
  // Public API
  public play(): void {
    this.state.isPlaying = true;
  }
  
  public pause(): void {
    this.state.isPlaying = false;
  }
  
  public stop(): void {
    this.state.isPlaying = false;
    this.state.currentTimeSeconds = 0;
    this.updateCurrentShot();
    this.updateCurrentTransition();
  }
  
  public seek(timeSeconds: number): void {
    this.state.currentTimeSeconds = Math.max(0, Math.min(timeSeconds, this.state.totalDurationSeconds));
    this.updateCurrentShot();
    this.updateCurrentTransition();
    this.state.emotionalState = this.getEmotionalStateAtTime(this.state.currentTimeSeconds);
    this.state.cinematicParameters = this.getCinematicParametersAtTime(this.state.currentTimeSeconds);
  }
  
  public setPlaybackSpeed(speed: number): void {
    this.state.playbackSpeed = Math.max(0.1, Math.min(speed, 4.0));
  }
  
  public getCurrentShot(): SequencedShot | null {
    return this.shots[this.state.currentShotIndex] || null;
  }
  
  public getCurrentTransition(): TransitionPlan | null {
    if (this.state.currentTransitionIndex === null) return null;
    return this.transitions[this.state.currentTransitionIndex] || null;
  }
  
  public getState(): TimelineState {
    return { ...this.state };
  }
  
  public getTimelineProgress(): number {
    return this.state.currentTimeSeconds / this.state.totalDurationSeconds;
  }
  
  public getEvents(): TimelineEvent[] {
    return [...this.events];
  }
  
  public getShotAtTime(timeSeconds: number): SequencedShot | null {
    for (const shot of this.shots) {
      if (timeSeconds >= shot.startTimeSeconds && timeSeconds <= shot.endTimeSeconds) {
        return shot;
      }
    }
    return null;
  }
  
  public getTransitionAtTime(timeSeconds: number): TransitionPlan | null {
    for (const transition of this.transitions) {
      const fromShot = this.shots.find(s => s.id === transition.fromShotId);
      if (fromShot) {
        const transitionStart = fromShot.endTimeSeconds - transition.durationSeconds;
        const transitionEnd = fromShot.endTimeSeconds;
        
        if (timeSeconds >= transitionStart && timeSeconds <= transitionEnd) {
          return transition;
        }
      }
    }
    return null;
  }
  
  public getTimelineSummary(): string {
    const currentShot = this.getCurrentShot();
    const currentTransition = this.getCurrentTransition();
    
    return `
Timeline State:
Time: ${this.state.currentTimeSeconds.toFixed(1)}s / ${this.state.totalDurationSeconds.toFixed(1)}s
Playing: ${this.state.isPlaying}
Current Shot: ${currentShot ? `${currentShot.shotType} (${currentShot.sequencePosition}/${this.shots.length})` : 'None'}
Current Transition: ${currentTransition ? currentTransition.type : 'None'}
Emotion: ${this.state.emotionalState.primaryEmotion} (${(this.state.emotionalState.intensity * 100).toFixed(0)}%)
  `.trim();
  }
}