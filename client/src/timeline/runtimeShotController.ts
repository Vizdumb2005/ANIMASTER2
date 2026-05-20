// Runtime Shot Controller for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { SequencedShot } from '../../../server/src/shots/shotSequencer';
import { TransitionPlan } from '../../../server/src/shots/transitionPlanner';
import { CinematicTimeline } from './cinematicTimeline';
import { BeatScheduler } from './beatScheduler';

export interface ShotRuntimeState {
  shot: SequencedShot;
  startTime: number;
  endTime: number;
  elapsedTime: number;
  remainingTime: number;
  progress: number; // 0-1
  isActive: boolean;
  isTransitioning: boolean;
  transitionProgress: number; // 0-1 if transitioning
  cinematicParameters: CinematicParameters;
  actorStates: ActorState[];
}

export interface CinematicParameters {
  cameraPosition: CameraPosition;
  cameraMovement: CameraMovement;
  lighting: LightingState;
  atmosphere: AtmosphereState;
  audio: AudioState;
}

export interface CameraPosition {
  x: number;
  y: number;
  zoom: number;
  angle: number; // degrees
}

export interface CameraMovement {
  type: 'static' | 'pan' | 'tilt' | 'tracking' | 'push_in' | 'pull_back';
  speed: number; // 0-1
  target: CameraPosition | null;
}

export interface LightingState {
  intensity: number; // 0-1
  color: string; // hex
  direction: number; // degrees
  quality: 'hard' | 'soft' | 'diffuse';
}

export interface AtmosphereState {
  fogDensity: number; // 0-1
  rainIntensity: number; // 0-1
  particleDensity: number; // 0-1
  windStrength: number; // 0-1
}

export interface AudioState {
  volume: number; // 0-1
  ambience: string[];
  music: string | null;
  soundEffects: string[];
}

export interface ActorState {
  actorId: string;
  position: { x: number; y: number };
  emotion: string;
  intensity: number; // 0-1
  posture: string;
  gazeDirection: string;
  movement: ActorMovement;
}

export interface ActorMovement {
  type: 'idle' | 'walking' | 'sitting' | 'pacing' | 'still';
  speed: number; // 0-1
  target: { x: number; y: number } | null;
}

export class RuntimeShotController {
  private timeline: CinematicTimeline;
  private beatScheduler: BeatScheduler;
  private currentShotState: ShotRuntimeState | null = null;
  private shotHistory: ShotRuntimeState[] = [];
  private transitionState: TransitionState | null = null;
  
  constructor(timeline: CinematicTimeline, beatScheduler: BeatScheduler) {
    this.timeline = timeline;
    this.beatScheduler = beatScheduler;
  }
  
  public update(deltaTimeSeconds: number): void {
    // Update timeline
    this.timeline.update(deltaTimeSeconds);
    
    // Update beat scheduler
    this.beatScheduler.update(this.timeline.getState().currentTimeSeconds);
    
    // Update current shot state
    this.updateCurrentShotState();
    
    // Update transition state if applicable
    this.updateTransitionState();
    
    // Apply beat influences
    this.applyBeatInfluences();
  }
  
  private updateCurrentShotState(): void {
    const timelineState = this.timeline.getState();
    const currentShot = this.timeline.getCurrentShot();
    
    if (!currentShot) {
      this.currentShotState = null;
      return;
    }
    
    // Check if we need to create a new shot state
    if (!this.currentShotState || this.currentShotState.shot.id !== currentShot.id) {
      this.currentShotState = this.createShotRuntimeState(currentShot, timelineState.currentTimeSeconds);
      this.shotHistory.push(this.currentShotState);
    } else {
      // Update existing shot state
      this.updateShotRuntimeState(this.currentShotState, timelineState.currentTimeSeconds);
    }
  }
  
  private createShotRuntimeState(shot: SequencedShot, currentTime: number): ShotRuntimeState {
    const elapsedTime = currentTime - shot.startTimeSeconds;
    const totalTime = shot.durationSeconds;
    
    return {
      shot,
      startTime: shot.startTimeSeconds,
      endTime: shot.endTimeSeconds,
      elapsedTime,
      remainingTime: totalTime - elapsedTime,
      progress: elapsedTime / totalTime,
      isActive: true,
      isTransitioning: false,
      transitionProgress: 0,
      cinematicParameters: this.generateCinematicParameters(shot, elapsedTime),
      actorStates: this.generateActorStates(shot, elapsedTime)
    };
  }
  
  private updateShotRuntimeState(state: ShotRuntimeState, currentTime: number): void {
    state.elapsedTime = currentTime - state.startTime;
    state.remainingTime = state.endTime - currentTime;
    state.progress = state.elapsedTime / state.shot.durationSeconds;
    
    // Update cinematic parameters based on progress
    state.cinematicParameters = this.updateCinematicParameters(
      state.cinematicParameters,
      state.shot,
      state.elapsedTime,
      state.progress
    );
    
    // Update actor states
    state.actorStates = this.updateActorStates(
      state.actorStates,
      state.shot,
      state.elapsedTime,
      state.progress
    );
    
    // Check for transition
    const transition = this.timeline.getCurrentTransition();
    if (transition && transition.fromShotId === state.shot.id) {
      state.isTransitioning = true;
      const transitionStart = state.endTime - transition.durationSeconds;
      state.transitionProgress = (currentTime - transitionStart) / transition.durationSeconds;
    } else {
      state.isTransitioning = false;
      state.transitionProgress = 0;
    }
  }
  
  private generateCinematicParameters(shot: SequencedShot, elapsedTime: number): CinematicParameters {
    // Initial camera position based on shot framing
    const cameraPosition: CameraPosition = {
      x: this.calculateCameraX(shot),
      y: this.calculateCameraY(shot),
      zoom: this.calculateCameraZoom(shot),
      angle: this.calculateCameraAngle(shot)
    };
    
    // Camera movement based on shot specs
    const cameraMovement: CameraMovement = {
      type: shot.cameraSpecs.movement as any,
      speed: shot.cameraSpecs.speed,
      target: this.calculateCameraTarget(shot, cameraPosition)
    };
    
    // Lighting based on shot atmosphere
    const lighting: LightingState = {
      intensity: 0.7,
      color: '#2a3b5c', // Default night blue
      direction: 45,
      quality: 'soft'
    };
    
    // Atmosphere based on shot requirements
    const atmosphere: AtmosphereState = {
      fogDensity: 0.6,
      rainIntensity: 0.7,
      particleDensity: 0.3,
      windStrength: 0.2
    };
    
    // Audio based on emotional intent
    const audio: AudioState = {
      volume: 0.8,
      ambience: ['rain_heavy', 'distant_thunder'],
      music: null,
      soundEffects: []
    };
    
    return {
      cameraPosition,
      cameraMovement,
      lighting,
      atmosphere,
      audio
    };
  }
  
  private calculateCameraX(shot: SequencedShot): number {
    // Simplified calculation based on framing
    switch (shot.framing.composition) {
      case 'rule_of_thirds':
        return 0.33; // Left third
      case 'center':
        return 0.5;
      case 'asymmetric':
        return 0.25;
      case 'negative_space':
        return 0.4;
      default:
        return 0.5;
    }
  }
  
  private calculateCameraY(shot: SequencedShot): number {
    // Camera height based on angle
    switch (shot.cameraSpecs.angle) {
      case 'low':
        return 0.3;
      case 'high':
        return 0.7;
      case 'eye_level':
        return 0.5;
      case 'dutch':
        return 0.5;
      default:
        return 0.5;
    }
  }
  
  private calculateCameraZoom(shot: SequencedShot): number {
    // Convert distance (0-1) to zoom (0.5-2.0)
    return 0.5 + shot.cameraSpecs.distance * 1.5;
  }
  
  private calculateCameraAngle(shot: SequencedShot): number {
    switch (shot.cameraSpecs.angle) {
      case 'dutch':
        return 15; // Dutch angle tilt
      default:
        return 0;
    }
  }
  
  private calculateCameraTarget(shot: SequencedShot, currentPosition: CameraPosition): CameraPosition | null {
    if (shot.cameraSpecs.movement === 'static') {
      return null;
    }
    
    // Calculate target based on movement type
    const target: CameraPosition = { ...currentPosition };
    
    switch (shot.cameraSpecs.movement) {
      case 'push_in':
        target.zoom *= 1.5;
        break;
      case 'pull_back':
        target.zoom *= 0.7;
        break;
      case 'pan':
        target.x += 0.3;
        break;
      case 'tracking':
        target.x += 0.2;
        target.y += 0.1;
        break;
    }
    
    return target;
  }
  
  private generateActorStates(shot: SequencedShot, elapsedTime: number): ActorState[] {
    // For "The Last Train", we have one actor
    const actorState: ActorState = {
      actorId: 'man',
      position: { x: 0.5, y: 0.5 }, // Center of frame
      emotion: shot.emotionalContext.primaryEmotion,
      intensity: shot.emotionalContext.intensity,
      posture: this.getPostureForEmotion(shot.emotionalContext.primaryEmotion),
      gazeDirection: shot.emotionalContext.gazeDirection,
      movement: {
        type: this.getMovementTypeForEmotion(shot.emotionalContext.primaryEmotion),
        speed: 0.1,
        target: null
      }
    };
    
    return [actorState];
  }
  
  private getPostureForEmotion(emotion: string): string {
    const postures: Record<string, string> = {
      'loneliness': 'slumped',
      'anticipation': 'alert',
      'melancholy': 'heavy',
      'tension': 'tense',
      'unresolved': 'hesitant'
    };
    
    return postures[emotion] || 'neutral';
  }
  
  private getMovementTypeForEmotion(emotion: string): ActorMovement['type'] {
    const movements: Record<string, ActorMovement['type']> = {
      'loneliness': 'still',
      'anticipation': 'pacing',
      'melancholy': 'idle',
      'tension': 'still',
      'unresolved': 'idle'
    };
    
    return movements[emotion] || 'idle';
  }
  
  private updateCinematicParameters(
    parameters: CinematicParameters,
    shot: SequencedShot,
    elapsedTime: number,
    progress: number
  ): CinematicParameters {
    const updated = { ...parameters };
    
    // Update camera movement progress
    if (updated.cameraMovement.target) {
      const moveProgress = Math.min(progress * 2, 1); // Camera moves in first half of shot
      updated.cameraPosition.x = this.lerp(
        parameters.cameraPosition.x,
        updated.cameraMovement.target.x,
        moveProgress
      );
      updated.cameraPosition.y = this.lerp(
        parameters.cameraPosition.y,
        updated.cameraMovement.target.y,
        moveProgress
      );
      updated.cameraPosition.zoom = this.lerp(
        parameters.cameraPosition.zoom,
        updated.cameraMovement.target.zoom,
        moveProgress
      );
    }
    
    // Update lighting based on emotional progression
    updated.lighting.intensity = 0.5 + shot.emotionalWeight * 0.3;
    
    // Update atmosphere based on shot progress
    if (shot.emotionalIntent.includes('tension') || shot.emotionalIntent.includes('anticipation')) {
      updated.atmosphere.fogDensity = 0.4 + progress * 0.3;
    }
    
    return updated;
  }
  
  private updateActorStates(
    states: ActorState[],
    shot: SequencedShot,
    elapsedTime: number,
    progress: number
  ): ActorState[] {
    return states.map(state => {
      const updated = { ...state };
      
      // Update emotion intensity based on shot progress
      updated.intensity = shot.emotionalWeight;
      
      // Add subtle movement based on emotion
      if (state.movement.type === 'pacing') {
        const paceCycle = Math.sin(elapsedTime * 2) * 0.1;
        updated.position.x = 0.5 + paceCycle;
      } else if (state.movement.type === 'idle') {
        const idleCycle = Math.sin(elapsedTime * 0.5) * 0.02;
        updated.position.y = 0.5 + idleCycle;
      }
      
      return updated;
    });
  }
  
  private lerp(start: number, end: number, t: number): number {
    return start + (end - start) * t;
  }
  
  private updateTransitionState(): void {
    const transition = this.timeline.getCurrentTransition();
    
    if (!transition) {
      this.transitionState = null;
      return;
    }
    
    if (!this.transitionState || this.transitionState.transition.id !== transition.fromShotId) {
      this.transitionState = {
        transition,
        progress: 0,
        fromShot: this.currentShotState,
        toShot: this.getShotById(transition.toShotId)
      };
    } else {
      // Update transition progress
      const timelineState = this.timeline.getState();
      const fromShot = this.getShotById(transition.fromShotId);
      if (fromShot) {
        const transitionStart = fromShot.endTimeSeconds - transition.durationSeconds;
        this.transitionState.progress = (timelineState.currentTimeSeconds - transitionStart) / transition.durationSeconds;
      }
    }
  }
  
  private getShotById(shotId: string): SequencedShot | null {
    const timelineState = this.timeline.getState();
    const shots = (this.timeline as any).shots; // Access private field
    return shots.find((s: SequencedShot) => s.id === shotId) || null;
  }
  
  private applyBeatInfluences(): void {
    const activeBeats = this.beatScheduler.getActiveBeats();
    
    if (!this.currentShotState || activeBeats.length === 0) {
      return;
    }
    
    activeBeats.forEach(beat => {
      const response = beat.cinematicResponse;
      
      // Apply camera adjustment
      if (response.cameraAdjustment && this.currentShotState) {
        this.applyCameraAdjustment(response.cameraAdjustment);
      }
      
      // Apply lighting adjustment
      if (response.lightingAdjustment && this.currentShotState) {
        this.applyLightingAdjustment(response.lightingAdjustment);
      }
      
      // Apply actor adjustment
      if (response.actorAdjustment && this.currentShotState) {
        this.applyActorAdjustment(response.actorAdjustment);
      }
    });
  }
  
  private applyCameraAdjustment(adjustment: any): void {
    if (!this.currentShotState) return;
    
    switch (adjustment.type) {
      case 'push_in':
        this.currentShotState.cinematicParameters.cameraPosition.zoom *= (1 + adjustment.intensity * 0.3);
        break;
      case 'pull_back':
        this.currentShotState.cinematicParameters.cameraPosition.zoom *= (1 - adjustment.intensity * 0.3);
        break;
      case 'reframe':
        this.currentShotState.cinematicParameters.cameraPosition.x += adjustment.intensity * 0.1;
        break;
      case 'drift':
        this.currentShotState.cinematicParameters.cameraPosition.y += Math.sin(Date.now() * 0.001) * adjustment.intensity * 0.05;
        break;
    }
  }
  
  private applyLightingAdjustment(adjustment: any): void {
    if (!this.currentShotState) return;
    
    switch (adjustment.type) {
      case 'intensity_change':
        this.currentShotState.cinematicParameters.lighting.intensity *= (1 + adjustment.value);
        break;
      case 'color_shift':
        // Simplified color shift towards blue
        this.currentShotState.cinematicParameters.lighting.color = '#1e2d4a';
        break;
      case 'contrast_boost':
        // Would affect post-processing in real implementation
        break;
    }
  }
  
  private applyActorAdjustment(adjustment: any): void {
    if (!this.currentShotState || this.currentShotState.actorStates.length === 0) return;
    
    const actor = this.currentShotState.actorStates[0];
    
    switch (adjustment.type) {
      case 'posture_change':
        actor.posture = adjustment.value;
        break;
      case 'gaze_shift':
        actor.gazeDirection = adjustment.value;
        break;
      case 'movement_pause':
        actor.movement.type = 'still';
        actor.movement.speed = 0;
        break;
      case 'emotional_shift':
        actor.emotion = adjustment.value;
        actor.intensity = Math.min(actor.intensity * 1.2, 1);
        break;
    }
  }
  
  // Public API
  public getCurrentShotState(): ShotRuntimeState | null {
    return this.currentShotState ? { ...this.currentShotState } : null;
  }
  
  public getTransitionState(): TransitionState | null {
    return this.transitionState ? { ...this.transitionState } : null;
  }
  
  public getShotHistory(): ShotRuntimeState[] {
    return [...this.shotHistory];
  }
  
  public getRuntimeSummary(): string {
    const shotState = this.currentShotState;
    const transitionState = this.transitionState;
    const activeBeats = this.beatScheduler.getActiveBeats();
    
    if (!shotState) {
      return 'No active shot';
    }
    
    const shotInfo = `
Current Shot: ${shotState.shot.shotType} (${shotState.shot.sequencePosition})
Progress: ${(shotState.progress * 100).toFixed(0)}%
Emotion: ${shotState.shot.emotionalIntent} (${(shotState.shot.emotionalWeight * 100).toFixed(0)}%)
Camera: ${shotState.cinematicParameters.cameraMovement.type} at ${shotState.cinematicParameters.cameraMovement.speed.toFixed(2)} speed
  `.trim();
    
    const transitionInfo = transitionState ? `
Transition: ${transitionState.transition.type} (${(transitionState.progress * 100).toFixed(0)}%)
  `.trim() : 'No active transition';
    
    const beatInfo = activeBeats.length > 0 ? `
Active Beats: ${activeBeats.map(b => b.beat.emotion).join(', ')}
  `.trim() : 'No active beats';
    
    return `${shotInfo}\n${transitionInfo}\n${beatInfo}`;
  }
  
  public reset(): void {
    this.currentShotState = null;
    this.shotHistory = [];
    this.transitionState = null;
    this.beatScheduler.reset();
  }
}

interface TransitionState {
  transition: TransitionPlan;
  progress: number; // 0-1
  fromShot: ShotRuntimeState | null;
  toShot: SequencedShot | null;
}