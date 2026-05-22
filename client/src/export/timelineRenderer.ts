// Timeline Renderer for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { CaptureSession, FrameData } from './frameCapture';
import { CinematicTimeline } from '../timeline/cinematicTimeline';
import { RuntimeShotController } from '../timeline/runtimeShotController';

export interface RenderConfig {
  outputFormat: 'mp4' | 'webm' | 'gif' | 'image_sequence';
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  quality: number; // 0-1
  includeAudio: boolean;
  audioTrack?: AudioTrackConfig;
  watermark?: WatermarkConfig;
  metadata?: RenderMetadata;
  duration: number; // seconds
}

export interface AudioTrackConfig {
  file: string; // URL or path
  volume: number; // 0-1
  syncOffset: number; // seconds
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export interface WatermarkConfig {
  text?: string;
  image?: string; // URL or base64
  position: 'top_left' | 'top_right' | 'bottom_left' | 'bottom_right' | 'center';
  opacity: number; // 0-1
  size: number; // 0-1 relative to frame
}

export interface RenderMetadata {
  title: string;
  description: string;
  creator: string;
  copyright: string;
  tags: string[];
}

export interface RenderProgress {
  currentFrame: number;
  totalFrames: number;
  progress: number; // 0-1
  status: 'idle' | 'rendering' | 'encoding' | 'complete' | 'error';
  estimatedTimeRemaining: number; // seconds
  currentOperation: string;
}

export interface RenderedOutput {
  id: string;
  format: string;
  url: string; // Blob URL or file path
  size: number; // bytes
  duration: number; // seconds
  resolution: string;
  frameRate: number;
  createdAt: number;
  metadata: RenderMetadata;
}

export class TimelineRenderer {
  private timeline: CinematicTimeline;
  private shotController: RuntimeShotController;
  private mediaRecorder: MediaRecorder | null = null;
  private mediaStream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private currentRender: RenderProgress | null = null;
  
  constructor(timeline: CinematicTimeline, shotController: RuntimeShotController) {
    this.timeline = timeline;
    this.shotController = shotController;
  }
  
  public async renderFromCapture(
    captureSession: CaptureSession,
    config: RenderConfig
  ): Promise<RenderedOutput> {
    this.currentRender = {
      currentFrame: 0,
      totalFrames: captureSession.frames.length,
      progress: 0,
      status: 'rendering',
      estimatedTimeRemaining: this.estimateRenderTime(captureSession, config),
      currentOperation: 'Initializing render...'
    };
    
    try {
      // Create canvas for rendering
      const canvas = document.createElement('canvas');
      canvas.width = config.resolution.width;
      canvas.height = config.resolution.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to create canvas context');
      }
      
      // Process frames
      const processedFrames: ImageData[] = [];
      
      for (let i = 0; i < captureSession.frames.length; i++) {
        this.updateRenderProgress(i, captureSession.frames.length, 'Processing frames...');
        
        const frame = captureSession.frames[i];
        const processedFrame = await this.processFrame(frame, canvas, ctx, config);
        processedFrames.push(processedFrame);
        
        // Add watermark if configured
        if (config.watermark) {
          await this.applyWatermark(processedFrame, config.watermark, ctx);
        }
      }
      
      // Encode to output format
      this.currentRender.status = 'encoding';
      this.currentRender.currentOperation = 'Encoding video...';
      
      const output = await this.encodeFrames(processedFrames, config, captureSession);
      
      this.currentRender.status = 'complete';
      this.currentRender.progress = 1;
      
      return output;
      
    } catch (error) {
      this.currentRender.status = 'error';
      this.currentRender.currentOperation = `Error: ${error}`;
      throw error;
    }
  }
  
  public async renderRealtime(config: RenderConfig): Promise<RenderedOutput> {
    // For realtime rendering, we need to capture from the live timeline
    // This is a simplified implementation
    
    this.currentRender = {
      currentFrame: 0,
      totalFrames: Math.ceil(config.duration * config.frameRate),
      progress: 0,
      status: 'rendering',
      estimatedTimeRemaining: config.duration * 2, // Rough estimate
      currentOperation: 'Starting realtime capture...'
    };
    
    try {
      // Setup media recorder (simplified - would need actual WebGL capture)
      const canvas = document.querySelector('canvas'); // Assuming Three.js canvas
      if (!canvas) {
        throw new Error('No canvas element found for capture');
      }
      
      // @ts-ignore - getCaptureStream may not exist in all browsers
      this.mediaStream = canvas.captureStream(config.frameRate);
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: this.getMimeType(config.outputFormat),
        videoBitsPerSecond: this.getBitrate(config.quality, config.resolution)
      });
      
      this.chunks = [];
      
      return new Promise((resolve, reject) => {
        if (!this.mediaRecorder) {
          reject(new Error('MediaRecorder not initialized'));
          return;
        }
        
        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.chunks.push(event.data);
          }
        };
        
        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.chunks, { type: this.getMimeType(config.outputFormat) });
          const url = URL.createObjectURL(blob);
          
          const output: RenderedOutput = {
            id: `render_${Date.now()}`,
            format: config.outputFormat,
            url,
            size: blob.size,
            duration: config.duration,
            resolution: `${config.resolution.width}x${config.resolution.height}`,
            frameRate: config.frameRate,
            createdAt: Date.now(),
            metadata: config.metadata || {
              title: 'Animaster Cinematic Short',
              description: 'Generated by Animaster Vertical Slice',
              creator: 'Animaster',
              copyright: '',
              tags: ['animaster', 'cinematic', 'short film']
            }
          };
          
          resolve(output);
        };
        
        this.mediaRecorder.onerror = (error) => {
          reject(error);
        };
        
        // Start recording
        this.mediaRecorder.start();
        
        // Stop after duration
        setTimeout(() => {
          if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
            this.mediaRecorder.stop();
          }
        }, config.duration * 1000);
        
        // Update progress
        const updateInterval = setInterval(() => {
          if (this.currentRender) {
            const elapsed = Date.now() - (this.currentRender as any).startTime;
            this.currentRender.progress = Math.min(elapsed / (config.duration * 1000), 0.99);
            this.currentRender.estimatedTimeRemaining = (config.duration * 1000 - elapsed) / 1000;
          }
        }, 100);
        
        // Cleanup
        setTimeout(() => {
          clearInterval(updateInterval);
        }, config.duration * 1000);
      });
      
    } catch (error) {
      this.currentRender.status = 'error';
      throw error;
    }
  }
  
  private async processFrame(
    frame: FrameData,
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    config: RenderConfig
  ): Promise<ImageData> {
    // Load image from frame data
    const image = await this.loadImage(frame.imageData);
    
    // Draw image to canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    
    // Add frame metadata overlay (optional)
    if (config.metadata?.title) {
      this.addMetadataOverlay(ctx, frame, config);
    }
    
    // Get image data
    return ctx.getImageData(0, 0, canvas.width, canvas.height);
  }
  
  private async loadImage(imageData: ImageData | string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      if (typeof imageData === 'string') {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageData;
      } else {
        // Convert ImageData to image
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Failed to create canvas context'));
          return;
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = canvas.toDataURL();
      }
    });
  }
  
  private addMetadataOverlay(
    ctx: CanvasRenderingContext2D,
    frame: FrameData,
    config: RenderConfig
  ): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Add subtle overlay for metadata
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, height - 60, width, 60);
    
    // Add text
    ctx.fillStyle = '#ffffff';
    ctx.font = '16px Arial';
    ctx.textAlign = 'left';
    
    const timeText = `Time: ${frame.timestamp.toFixed(1)}s`;
    ctx.fillText(timeText, 20, height - 40);
    
    const emotionText = `Emotion: ${frame.emotionalState.emotion} (${(frame.emotionalState.intensity * 100).toFixed(0)}%)`;
    ctx.fillText(emotionText, 20, height - 20);
    
    // Add shot info if available
    if (frame.shotId) {
      ctx.textAlign = 'right';
      const shotText = `Shot: ${frame.shotId}`;
      ctx.fillText(shotText, width - 20, height - 40);
      
      const frameText = `Frame: ${frame.frameNumber}`;
      ctx.fillText(frameText, width - 20, height - 20);
    }
  }
  
  private async applyWatermark(
    imageData: ImageData,
    watermark: WatermarkConfig,
    ctx: CanvasRenderingContext2D
  ): Promise<void> {
    ctx.putImageData(imageData, 0, 0);
    
    if (watermark.text) {
      this.applyTextWatermark(ctx, watermark);
    } else if (watermark.image) {
      await this.applyImageWatermark(ctx, watermark);
    }
  }
  
  private applyTextWatermark(ctx: CanvasRenderingContext2D, watermark: WatermarkConfig): void {
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Calculate position
    let x = 0, y = 0;
    const fontSize = Math.min(width, height) * watermark.size;
    
    ctx.font = `${fontSize}px Arial`;
    ctx.fillStyle = `rgba(255, 255, 255, ${watermark.opacity})`;
    ctx.textAlign = 'left';
    
    switch (watermark.position) {
      case 'top_left':
        x = 20;
        y = fontSize + 20;
        break;
      case 'top_right':
        x = width - 20;
        y = fontSize + 20;
        ctx.textAlign = 'right';
        break;
      case 'bottom_left':
        x = 20;
        y = height - 20;
        break;
      case 'bottom_right':
        x = width - 20;
        y = height - 20;
        ctx.textAlign = 'right';
        break;
      case 'center':
        x = width / 2;
        y = height / 2;
        ctx.textAlign = 'center';
        break;
    }
    
    ctx.fillText(watermark.text!, x, y);
  }
  
  private async applyImageWatermark(
    ctx: CanvasRenderingContext2D,
    watermark: WatermarkConfig
  ): Promise<void> {
    const img = await this.loadImage(watermark.image!);
    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    
    // Calculate size and position
    const size = Math.min(width, height) * watermark.size;
    let x = 0, y = 0;
    
    switch (watermark.position) {
      case 'top_left':
        x = 20;
        y = 20;
        break;
      case 'top_right':
        x = width - size - 20;
        y = 20;
        break;
      case 'bottom_left':
        x = 20;
        y = height - size - 20;
        break;
      case 'bottom_right':
        x = width - size - 20;
        y = height - size - 20;
        break;
      case 'center':
        x = (width - size) / 2;
        y = (height - size) / 2;
        break;
    }
    
    // Apply opacity
    ctx.globalAlpha = watermark.opacity;
    ctx.drawImage(img, x, y, size, size);
    ctx.globalAlpha = 1.0;
  }
  
  private async encodeFrames(
    frames: ImageData[],
    config: RenderConfig,
    captureSession: CaptureSession
  ): Promise<RenderedOutput> {
    // Simplified encoding - in real implementation, use WebCodecs API or ffmpeg.wasm
    
    // Create video from frames (simplified placeholder)
    const canvas = document.createElement('canvas');
    canvas.width = config.resolution.width;
    canvas.height = config.resolution.height;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) {
      throw new Error('Failed to create canvas context');
    }
    
    // Create a simple video by converting frames to GIF (simplified)
    // Note: Real implementation would use proper video encoding
    
    const gifFrames = frames.slice(0, Math.min(30, frames.length)); // Limit for demo
    
    // Create a data URL for the first frame as placeholder
    ctx.putImageData(gifFrames[0], 0, 0);
    const dataUrl = canvas.toDataURL('image/png');
    
    const output: RenderedOutput = {
      id: `render_${Date.now()}`,
      format: config.outputFormat,
      url: dataUrl,
      size: dataUrl.length * 2, // Rough estimate
      duration: captureSession.metadata.duration,
      resolution: `${config.resolution.width}x${config.resolution.height}`,
      frameRate: config.frameRate,
      createdAt: Date.now(),
      metadata: config.metadata || {
        title: 'Animaster Cinematic Short',
        description: 'Generated by Animaster Vertical Slice',
        creator: 'Animaster',
        copyright: '',
        tags: ['animaster', 'cinematic', 'short film']
      }
    };
    
    return output;
  }
  
  private getMimeType(format: string): string {
    const mimeTypes: Record<string, string> = {
      'mp4': 'video/mp4',
      'webm': 'video/webm',
      'gif': 'image/gif'
    };
    
    return mimeTypes[format] || 'video/webm';
  }
  
  private getBitrate(quality: number, resolution: { width: number; height: number }): number {
    const pixels = resolution.width * resolution.height;
    const baseBitrate = 1000000; // 1 Mbps for 720p
    
    // Scale bitrate based on resolution and quality
    const scale = (pixels / (1280 * 720)) * quality;
    return Math.floor(baseBitrate * scale);
  }
  
  private estimateRenderTime(captureSession: CaptureSession, config: RenderConfig): number {
    const frames = captureSession.frames.length;
    const frameProcessingTime = 0.05; // seconds per frame (estimated)
    const encodingTime = frames * 0.01; // seconds per frame (estimated)
    
    return (frames * frameProcessingTime) + encodingTime;
  }
  
  private updateRenderProgress(currentFrame: number, totalFrames: number, operation: string): void {
    if (this.currentRender) {
      this.currentRender.currentFrame = currentFrame;
      this.currentRender.totalFrames = totalFrames;
      this.currentRender.progress = currentFrame / totalFrames;
      this.currentRender.currentOperation = operation;
      
      // Update estimated time remaining
      if (currentFrame > 0) {
        const elapsed = Date.now() - (this.currentRender as any).startTime;
        const estimatedTotal = elapsed / this.currentRender.progress;
        this.currentRender.estimatedTimeRemaining = (estimatedTotal - elapsed) / 1000;
      }
    }
  }
  
  public getRenderProgress(): RenderProgress | null {
    return this.currentRender ? { ...this.currentRender } : null;
  }
  
  public cancelRender(): void {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
    
    if (this.currentRender) {
      this.currentRender.status = 'idle';
    }
    
    this.cleanup();
  }
  
  public cleanup(): void {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.mediaRecorder = null;
    this.chunks = [];
  }
  
  public getRenderSummary(): string {
    if (!this.currentRender) {
      return 'No active render';
    }
    
    const render = this.currentRender;
    
    return `
Render Status: ${render.status}
Progress: ${(render.progress * 100).toFixed(1)}%
Frames: ${render.currentFrame} / ${render.totalFrames}
Operation: ${render.currentOperation}
Estimated Time Remaining: ${render.estimatedTimeRemaining.toFixed(1)}s
  `.trim();
  }
}