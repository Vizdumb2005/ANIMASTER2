// Frame Capture System for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { CinematicTimeline } from '../timeline/cinematicTimeline';
import { RuntimeShotController } from '../timeline/runtimeShotController';

export interface CaptureConfig {
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number; // fps
  quality: number; // 0-1
  format: 'png' | 'jpeg' | 'webp';
  includeAudio: boolean;
  captureMode: 'realtime' | 'offline';
}

export interface FrameData {
  frameNumber: number;
  timestamp: number; // seconds
  imageData: ImageData | string; // Base64 or ImageData
  shotId: string | null;
  emotionalState: EmotionalState;
  cinematicParameters: CinematicParameters;
}

export interface EmotionalState {
  emotion: string;
  intensity: number;
}

export interface CinematicParameters {
  cameraTightness: number;
  movementEnergy: number;
  editingPace: number;
}

export interface CaptureSession {
  id: string;
  config: CaptureConfig;
  frames: FrameData[];
  startTime: number;
  endTime: number | null;
  status: 'idle' | 'capturing' | 'processing' | 'complete' | 'error';
  progress: number; // 0-1
  metadata: CaptureMetadata;
}

export interface CaptureMetadata {
  totalFrames: number;
  estimatedSize: number; // bytes
  duration: number; // seconds
  shotCount: number;
  emotionalArc: string[];
}

export class FrameCaptureSystem {
  private timeline: CinematicTimeline;
  private shotController: RuntimeShotController;
  private currentSession: CaptureSession | null = null;
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  
  constructor(timeline: CinematicTimeline, shotController: RuntimeShotController) {
    this.timeline = timeline;
    this.shotController = shotController;
  }
  
  public initializeCanvas(width: number = 1920, height: number = 1080): void {
    // Create offscreen canvas for capture
    this.canvas = document.createElement('canvas');
    this.canvas.width = width;
    this.canvas.height = height;
    this.context = this.canvas.getContext('2d');
    
    if (!this.context) {
      throw new Error('Failed to create canvas context for frame capture');
    }
  }
  
  public startCapture(config: CaptureConfig): CaptureSession {
    if (this.currentSession && this.currentSession.status === 'capturing') {
      throw new Error('Capture already in progress');
    }
    
    // Initialize canvas if needed
    if (!this.canvas) {
      this.initializeCanvas(config.resolution.width, config.resolution.height);
    }
    
    // Calculate total frames
    const totalFrames = Math.ceil(config.duration * config.frameRate);
    const estimatedSize = this.estimateFileSize(totalFrames, config);
    
    const session: CaptureSession = {
      id: `capture_${Date.now()}`,
      config,
      frames: [],
      startTime: Date.now(),
      endTime: null,
      status: 'capturing',
      progress: 0,
      metadata: {
        totalFrames,
        estimatedSize,
        duration: config.duration,
        shotCount: 0, // Will be updated during capture
        emotionalArc: []
      }
    };
    
    this.currentSession = session;
    
    // Start capture loop
    this.captureLoop();
    
    return session;
  }
  
  private estimateFileSize(totalFrames: number, config: CaptureConfig): number {
    // Rough estimation based on format and quality
    const baseSizePerFrame: Record<CaptureConfig['format'], number> = {
      'png': 500000, // ~500KB per frame
      'jpeg': 100000, // ~100KB per frame
      'webp': 80000   // ~80KB per frame
    };
    
    const baseSize = baseSizePerFrame[config.format] || 200000;
    const qualityFactor = config.quality;
    const resolutionFactor = (config.resolution.width * config.resolution.height) / (1920 * 1080);
    
    return Math.floor(totalFrames * baseSize * qualityFactor * resolutionFactor);
  }
  
  private async captureLoop(): Promise<void> {
    if (!this.currentSession || this.currentSession.status !== 'capturing') {
      return;
    }
    
    const session = this.currentSession;
    const config = session.config;
    const frameInterval = 1000 / config.frameRate; // ms per frame
    
    let frameNumber = 0;
    const totalFrames = session.metadata.totalFrames;
    
    // Reset timeline to start
    this.timeline.stop();
    
    // Capture frames
    while (frameNumber < totalFrames && session.status === 'capturing') {
      const timestamp = frameNumber / config.frameRate;
      
      // Seek to correct time
      this.timeline.seek(timestamp);
      
      // Update systems
      this.timeline.update(0); // Force update without time delta
      this.shotController.update(0);
      
      // Capture frame
      await this.captureFrame(frameNumber, timestamp);
      
      // Update progress
      frameNumber++;
      session.progress = frameNumber / totalFrames;
      
      // Add small delay for realtime capture
      if (config.captureMode === 'realtime') {
        await this.delay(frameInterval);
      }
    }
    
    // Complete session
    if (session.status === 'capturing') {
      session.status = 'complete';
      session.endTime = Date.now();
      session.progress = 1;
      
      // Update metadata
      this.updateSessionMetadata(session);
    }
  }
  
  private async captureFrame(frameNumber: number, timestamp: number): Promise<void> {
    if (!this.currentSession || !this.canvas || !this.context) {
      return;
    }
    
    const session = this.currentSession;
    
    try {
      // Get current render from Three.js scene (simplified - in real implementation, 
      // this would capture from the WebGL renderer)
      // For now, we'll create a placeholder frame
      const imageData = await this.createPlaceholderFrame();
      
      // Get current emotional state
      const timelineState = this.timeline.getState();
      const emotionalState: EmotionalState = {
        emotion: timelineState.emotionalState.primaryEmotion,
        intensity: timelineState.emotionalState.intensity
      };
      
      // Get cinematic parameters
      const cinematicParameters: CinematicParameters = {
        cameraTightness: timelineState.cinematicParameters.cameraTightness,
        movementEnergy: timelineState.cinematicParameters.movementEnergy,
        editingPace: timelineState.cinematicParameters.editingPace
      };
      
      // Get current shot
      const currentShot = this.timeline.getCurrentShot();
      
      const frameData: FrameData = {
        frameNumber,
        timestamp,
        imageData,
        shotId: currentShot?.id || null,
        emotionalState,
        cinematicParameters
      };
      
      session.frames.push(frameData);
      
    } catch (error) {
      console.error('Error capturing frame:', error);
      session.status = 'error';
    }
  }
  
  private async createPlaceholderFrame(): Promise<string> {
    if (!this.canvas || !this.context) {
      throw new Error('Canvas not initialized');
    }
    
    const ctx = this.context;
    const width = this.canvas.width;
    const height = this.canvas.height;
    
    // Clear canvas
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, width, height);
    
    // Draw gradient background
    const gradient = ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#16213e');
    gradient.addColorStop(1, '#0f3460');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw cinematic frame
    ctx.strokeStyle = '#e94560';
    ctx.lineWidth = 4;
    ctx.strokeRect(50, 50, width - 100, height - 100);
    
    // Draw frame info
    const shotState = this.shotController.getCurrentShotState();
    const timelineState = this.timeline.getState();
    
    ctx.fillStyle = '#ffffff';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    
    const timeText = `Time: ${timelineState.currentTimeSeconds.toFixed(1)}s`;
    ctx.fillText(timeText, width / 2, height / 2 - 60);
    
    if (shotState) {
      const shotText = `Shot: ${shotState.shot.shotType}`;
      ctx.fillText(shotText, width / 2, height / 2 - 30);
      
      const emotionText = `Emotion: ${shotState.shot.emotionalIntent}`;
      ctx.fillText(emotionText, width / 2, height / 2);
    }
    
    const frameText = `Frame: ${this.currentSession?.frames.length || 0}`;
    ctx.fillText(frameText, width / 2, height / 2 + 30);
    
    // Convert to base64
    return this.canvas.toDataURL(`image/${this.currentSession?.config.format || 'png'}`);
  }
  
  private updateSessionMetadata(session: CaptureSession): void {
    // Count unique shots
    const shotIds = new Set(session.frames.map(frame => frame.shotId).filter(id => id !== null));
    session.metadata.shotCount = shotIds.size;
    
    // Extract emotional arc
    const emotions = session.frames
      .map(frame => frame.emotionalState.emotion)
      .filter((emotion, index, arr) => index === 0 || emotion !== arr[index - 1]);
    
    session.metadata.emotionalArc = emotions;
  }
  
  public pauseCapture(): void {
    if (this.currentSession && this.currentSession.status === 'capturing') {
      this.currentSession.status = 'idle';
    }
  }
  
  public resumeCapture(): void {
    if (this.currentSession && this.currentSession.status === 'idle') {
      this.currentSession.status = 'capturing';
      this.captureLoop();
    }
  }
  
  public stopCapture(): void {
    if (this.currentSession) {
      this.currentSession.status = 'complete';
      this.currentSession.endTime = Date.now();
    }
  }
  
  public getCurrentSession(): CaptureSession | null {
    return this.currentSession ? { ...this.currentSession } : null;
  }
  
  public getFrame(frameNumber: number): FrameData | null {
    if (!this.currentSession) return null;
    return this.currentSession.frames[frameNumber] || null;
  }
  
  public getFramesInRange(startFrame: number, endFrame: number): FrameData[] {
    if (!this.currentSession) return [];
    return this.currentSession.frames.slice(startFrame, endFrame + 1);
  }
  
  public async exportFrames(format: 'png' | 'jpeg' | 'webp' = 'png'): Promise<Blob[]> {
    if (!this.currentSession) {
      throw new Error('No capture session');
    }
    
    const frames = this.currentSession.frames;
    const blobs: Blob[] = [];
    
    for (const frame of frames) {
      if (typeof frame.imageData === 'string') {
        // Convert base64 to blob
        const base64Data = frame.imageData.split(',')[1];
        const byteCharacters = atob(base64Data);
        const byteArrays = [];
        
        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
          const slice = byteCharacters.slice(offset, offset + 512);
          const byteNumbers = new Array(slice.length);
          
          for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          byteArrays.push(byteArray);
        }
        
        const blob = new Blob(byteArrays, { type: `image/${format}` });
        blobs.push(blob);
      }
    }
    
    return blobs;
  }
  
  public getCaptureSummary(): string {
    if (!this.currentSession) {
      return 'No active capture session';
    }
    
    const session = this.currentSession;
    const duration = session.endTime 
      ? ((session.endTime - session.startTime) / 1000).toFixed(1)
      : 'in progress';
    
    return `
Capture Session: ${session.id}
Status: ${session.status}
Progress: ${(session.progress * 100).toFixed(1)}%
Frames: ${session.frames.length} / ${session.metadata.totalFrames}
Duration: ${duration}s
Resolution: ${session.config.resolution.width}x${session.config.resolution.height}
Frame Rate: ${session.config.frameRate}fps
Estimated Size: ${(session.metadata.estimatedSize / 1024 / 1024).toFixed(2)}MB
Shots Captured: ${session.metadata.shotCount}
  `.trim();
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  public cleanup(): void {
    if (this.currentSession) {
      this.currentSession.status = 'complete';
    }
    this.currentSession = null;
  }
}