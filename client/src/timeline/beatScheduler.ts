// Beat Scheduler for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { EmotionalBeat } from '../../../server/src/narrative/narrativeArcGenerator';
import { SequencedShot } from '../../../server/src/shots/shotSequencer';

export interface ScheduledBeat {
  beat: EmotionalBeat;
  scheduledTime: number; // seconds
  actualTime: number | null; // seconds when actually triggered
  status: 'pending' | 'active' | 'completed' | 'missed';
  shotContext: ShotContext | null;
  emotionalImpact: number; // 0-1, expected impact
  cinematicResponse: CinematicResponse;
}

export interface ShotContext {
  shotId: string;
  shotType: string;
  emotionalIntent: string;
  cameraMovement: string;
  durationRemaining: number;
}

export interface CinematicResponse {
  cameraAdjustment: CameraAdjustment | null;
  lightingAdjustment: LightingAdjustment | null;
  audioAdjustment: AudioAdjustment | null;
  actorAdjustment: ActorAdjustment | null;
}

export interface CameraAdjustment {
  type: 'push_in' | 'pull_back' | 'reframe' | 'hold' | 'drift';
  intensity: number; // 0-1
  duration: number; // seconds
}

export interface LightingAdjustment {
  type: 'intensity_change' | 'color_shift' | 'contrast_boost';
  value: number; // 0-1 or color value
  duration: number; // seconds
}

export interface AudioAdjustment {
  type: 'volume_change' | 'filter_add' | 'silence' | 'sound_effect';
  value: number; // 0-1 or effect parameter
  duration: number; // seconds
}

export interface ActorAdjustment {
  type: 'posture_change' | 'gaze_shift' | 'movement_pause' | 'emotional_shift';
  value: string; // specific adjustment
  duration: number; // seconds
}

export class BeatScheduler {
  private beats: EmotionalBeat[];
  private shots: SequencedShot[];
  private scheduledBeats: ScheduledBeat[] = [];
  private currentTime: number = 0;
  private activeBeats: ScheduledBeat[] = [];
  private completedBeats: ScheduledBeat[] = [];
  
  constructor(beats: EmotionalBeat[], shots: SequencedShot[]) {
    this.beats = beats;
    this.shots = shots;
    this.scheduleBeats();
  }
  
  private scheduleBeats(): void {
    this.scheduledBeats = this.beats.map(beat => {
      const shotContext = this.getShotContextAtTime(beat.timeStart);
      const cinematicResponse = this.generateCinematicResponse(beat, shotContext);
      
      return {
        beat,
        scheduledTime: beat.timeStart,
        actualTime: null,
        status: 'pending',
        shotContext,
        emotionalImpact: beat.intensity,
        cinematicResponse
      };
    });
    
    // Sort by scheduled time
    this.scheduledBeats.sort((a, b) => a.scheduledTime - b.scheduledTime);
  }
  
  private getShotContextAtTime(timeSeconds: number): ShotContext | null {
    for (const shot of this.shots) {
      if (timeSeconds >= shot.startTimeSeconds && timeSeconds <= shot.endTimeSeconds) {
        const durationRemaining = shot.endTimeSeconds - timeSeconds;
        
        return {
          shotId: shot.id,
          shotType: shot.shotType,
          emotionalIntent: shot.emotionalIntent,
          cameraMovement: shot.cameraSpecs.movement,
          durationRemaining
        };
      }
    }
    return null;
  }
  
  private generateCinematicResponse(beat: EmotionalBeat, shotContext: ShotContext | null): CinematicResponse {
    const response: CinematicResponse = {
      cameraAdjustment: null,
      lightingAdjustment: null,
      audioAdjustment: null,
      actorAdjustment: null
    };
    
    // Generate camera adjustment based on emotion and intensity
    response.cameraAdjustment = this.generateCameraAdjustment(beat, shotContext);
    
    // Generate lighting adjustment
    response.lightingAdjustment = this.generateLightingAdjustment(beat);
    
    // Generate audio adjustment
    response.audioAdjustment = this.generateAudioAdjustment(beat);
    
    // Generate actor adjustment
    response.actorAdjustment = this.generateActorAdjustment(beat);
    
    return response;
  }
  
  private generateCameraAdjustment(beat: EmotionalBeat, shotContext: ShotContext | null): CameraAdjustment | null {
    if (!shotContext) return null;
    
    const adjustments: Record<string, CameraAdjustment> = {
      'loneliness': {
        type: 'hold',
        intensity: 0.3,
        duration: 3
      },
      'anticipation': {
        type: 'push_in',
        intensity: 0.6,
        duration: 4
      },
      'melancholy': {
        type: 'drift',
        intensity: 0.4,
        duration: 5
      },
      'tension': {
        type: 'reframe',
        intensity: 0.7,
        duration: 2
      },
      'unresolved': {
        type: 'pull_back',
        intensity: 0.5,
        duration: 3
      }
    };
    
    const baseAdjustment = adjustments[beat.emotion] || {
      type: 'hold',
      intensity: 0.3,
      duration: 3
    };
    
    // Adjust intensity based on beat intensity
    baseAdjustment.intensity *= beat.intensity;
    
    // Adjust based on shot context
    if (shotContext.cameraMovement === 'static') {
      baseAdjustment.type = 'push_in';
    } else if (shotContext.cameraMovement.includes('pan')) {
      baseAdjustment.type = 'drift';
    }
    
    return baseAdjustment;
  }
  
  private generateLightingAdjustment(beat: EmotionalBeat): LightingAdjustment | null {
    const adjustments: Record<string, LightingAdjustment> = {
      'loneliness': {
        type: 'color_shift',
        value: 0.3, // towards blue
        duration: 4
      },
      'anticipation': {
        type: 'intensity_change',
        value: 0.7, // increase
        duration: 3
      },
      'melancholy': {
        type: 'contrast_boost',
        value: 0.4,
        duration: 5
      },
      'tension': {
        type: 'intensity_change',
        value: 0.8, // dramatic increase
        duration: 2
      }
    };
    
    return adjustments[beat.emotion] || null;
  }
  
  private generateAudioAdjustment(beat: EmotionalBeat): AudioAdjustment | null {
    const adjustments: Record<string, AudioAdjustment> = {
      'loneliness': {
        type: 'silence',
        value: 0.8, // 80% reduction
        duration: 3
      },
      'anticipation': {
        type: 'volume_change',
        value: 0.6, // 60% increase
        duration: 4
      },
      'melancholy': {
        type: 'filter_add',
        value: 0.5, // low-pass filter
        duration: 5
      },
      'tension': {
        type: 'sound_effect',
        value: 0.9, // tension sound
        duration: 2
      }
    };
    
    return adjustments[beat.emotion] || null;
  }
  
  private generateActorAdjustment(beat: EmotionalBeat): ActorAdjustment | null {
    const adjustments: Record<string, ActorAdjustment> = {
      'loneliness': {
        type: 'posture_change',
        value: 'slump shoulders',
        duration: 2
      },
      'anticipation': {
        type: 'gaze_shift',
        value: 'look at horizon',
        duration: 3
      },
      'melancholy': {
        type: 'movement_pause',
        value: 'complete stillness',
        duration: 4
      },
      'tension': {
        type: 'emotional_shift',
        value: 'tense up',
        duration: 2
      }
    };
    
    return adjustments[beat.emotion] || null;
  }
  
  public update(currentTime: number): void {
    this.currentTime = currentTime;
    
    // Check for beats to activate
    const beatsToActivate = this.scheduledBeats.filter(
      beat => beat.status === 'pending' && currentTime >= beat.scheduledTime
    );
    
    beatsToActivate.forEach(beat => {
      beat.status = 'active';
      beat.actualTime = currentTime;
      this.activeBeats.push(beat);
      this.triggerBeat(beat);
    });
    
    // Check for active beats to complete
    const beatsToComplete: ScheduledBeat[] = [];
    this.activeBeats.forEach((beat, index) => {
      const beatDuration = beat.beat.timeEnd - beat.beat.timeStart;
      if (currentTime >= beat.scheduledTime + beatDuration) {
        beat.status = 'completed';
        beatsToComplete.push(beat);
      }
    });
    
    // Move completed beats
    beatsToComplete.forEach(beat => {
      const index = this.activeBeats.indexOf(beat);
      if (index > -1) {
        this.activeBeats.splice(index, 1);
        this.completedBeats.push(beat);
        this.completeBeat(beat);
      }
    });
    
    // Check for missed beats (if we jumped time)
    const missedBeats = this.scheduledBeats.filter(
      beat => beat.status === 'pending' && currentTime > beat.beat.timeEnd
    );
    
    missedBeats.forEach(beat => {
      beat.status = 'missed';
      beat.actualTime = null;
      this.missBeat(beat);
    });
  }
  
  private triggerBeat(beat: ScheduledBeat): void {
    console.log(`Beat triggered: ${beat.beat.emotion} at ${beat.actualTime?.toFixed(1)}s`);
    console.log(`Impact: ${(beat.emotionalImpact * 100).toFixed(0)}%`);
    
    if (beat.cinematicResponse.cameraAdjustment) {
      console.log(`Camera: ${beat.cinematicResponse.cameraAdjustment.type} (${beat.cinematicResponse.cameraAdjustment.intensity})`);
    }
    
    if (beat.cinematicResponse.lightingAdjustment) {
      console.log(`Lighting: ${beat.cinematicResponse.lightingAdjustment.type}`);
    }
    
    if (beat.shotContext) {
      console.log(`Shot context: ${beat.shotContext.shotType} - ${beat.shotContext.emotionalIntent}`);
    }
  }
  
  private completeBeat(beat: ScheduledBeat): void {
    console.log(`Beat completed: ${beat.beat.emotion}`);
  }
  
  private missBeat(beat: ScheduledBeat): void {
    console.log(`Beat missed: ${beat.beat.emotion} (scheduled at ${beat.scheduledTime}s)`);
  }
  
  public getActiveBeats(): ScheduledBeat[] {
    return [...this.activeBeats];
  }
  
  public getPendingBeats(): ScheduledBeat[] {
    return this.scheduledBeats.filter(beat => beat.status === 'pending');
  }
  
  public getCompletedBeats(): ScheduledBeat[] {
    return [...this.completedBeats];
  }
  
  public getMissedBeats(): ScheduledBeat[] {
    return this.scheduledBeats.filter(beat => beat.status === 'missed');
  }
  
  public getNextBeat(): ScheduledBeat | null {
    const pending = this.getPendingBeats();
    return pending.length > 0 ? pending[0] : null;
  }
  
  public getBeatAtTime(timeSeconds: number): ScheduledBeat | null {
    return this.scheduledBeats.find(beat => 
      timeSeconds >= beat.beat.timeStart && timeSeconds <= beat.beat.timeEnd
    ) || null;
  }
  
  public getBeatsInRange(startTime: number, endTime: number): ScheduledBeat[] {
    return this.scheduledBeats.filter(beat => 
      (beat.beat.timeStart >= startTime && beat.beat.timeStart <= endTime) ||
      (beat.beat.timeEnd >= startTime && beat.beat.timeEnd <= endTime) ||
      (beat.beat.timeStart <= startTime && beat.beat.timeEnd >= endTime)
    );
  }
  
  public getBeatDensity(timeWindow: number = 10): number {
    // Returns beats per minute in the given time window around current time
    const windowStart = Math.max(0, this.currentTime - timeWindow / 2);
    const windowEnd = this.currentTime + timeWindow / 2;
    
    const beatsInWindow = this.getBeatsInRange(windowStart, windowEnd);
    const beatsPerMinute = (beatsInWindow.length / timeWindow) * 60;
    
    return beatsPerMinute;
  }
  
  public getEmotionalIntensityAtTime(timeSeconds: number): number {
    const beat = this.getBeatAtTime(timeSeconds);
    if (beat) {
      return beat.beat.intensity;
    }
    
    // If no beat at exact time, find nearest
    const allBeats = [...this.scheduledBeats];
    const nearestBeat = allBeats.reduce((nearest, current) => {
      const currentMid = (current.beat.timeStart + current.beat.timeEnd) / 2;
      const nearestMid = (nearest.beat.timeStart + nearest.beat.timeEnd) / 2;
      const currentDist = Math.abs(currentMid - timeSeconds);
      const nearestDist = Math.abs(nearestMid - timeSeconds);
      return currentDist < nearestDist ? current : nearest;
    }, allBeats[0]);
    
    return nearestBeat?.beat.intensity || 0.5;
  }
  
  public getCurrentEmotionalState(): { emotion: string; intensity: number } | null {
    const activeBeat = this.activeBeats[0];
    if (activeBeat) {
      return {
        emotion: activeBeat.beat.emotion,
        intensity: activeBeat.beat.intensity
      };
    }
    
    const beat = this.getBeatAtTime(this.currentTime);
    if (beat) {
      return {
        emotion: beat.beat.emotion,
        intensity: beat.beat.intensity
      };
    }
    
    return null;
  }
  
  public getBeatScheduleSummary(): string {
    const total = this.scheduledBeats.length;
    const active = this.activeBeats.length;
    const pending = this.getPendingBeats().length;
    const completed = this.completedBeats.length;
    const missed = this.getMissedBeats().length;
    
    const nextBeat = this.getNextBeat();
    const nextBeatTime = nextBeat ? `${nextBeat.scheduledTime.toFixed(1)}s` : 'None';
    
    const density = this.getBeatDensity();
    
    return `
Beat Schedule Summary:
Total Beats: ${total}
Active: ${active}, Pending: ${pending}, Completed: ${completed}, Missed: ${missed}
Next Beat: ${nextBeatTime}
Beat Density: ${density.toFixed(1)} beats/min
Current Emotion: ${this.getCurrentEmotionalState()?.emotion || 'None'}
  `.trim();
  }
  
  public reset(): void {
    this.currentTime = 0;
    this.activeBeats = [];
    this.completedBeats = [];
    
    this.scheduledBeats.forEach(beat => {
      beat.status = 'pending';
      beat.actualTime = null;
    });
  }
}