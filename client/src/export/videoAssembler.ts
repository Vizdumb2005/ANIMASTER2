// Video Assembler for 1-minute cinematic shorts
// Phase 10: Vertical Slice

import { RenderedOutput } from './timelineRenderer';
import { CaptureSession } from './frameCapture';

export interface AssemblyConfig {
  outputFormat: 'mp4' | 'webm' | 'gif' | 'mov';
  resolution: {
    width: number;
    height: number;
  };
  frameRate: number;
  quality: 'low' | 'medium' | 'high' | 'ultra';
  audio: AudioAssemblyConfig;
  chapters: ChapterMarker[];
  credits: CreditsConfig;
  exportOptions: ExportOptions;
}

export interface AudioAssemblyConfig {
  tracks: AudioTrack[];
  mix: AudioMixConfig;
  normalization: boolean;
  loudnessTarget: number; // LUFS
}

export interface AudioTrack {
  id: string;
  type: 'dialogue' | 'music' | 'sfx' | 'ambience';
  file: string; // URL or blob
  volume: number; // 0-1
  pan: number; // -1 to 1
  startTime: number; // seconds
  duration: number; // seconds
  fadeIn: number; // seconds
  fadeOut: number; // seconds
}

export interface AudioMixConfig {
  dialogueLevel: number; // 0-1
  musicLevel: number; // 0-1
  sfxLevel: number; // 0-1
  ambienceLevel: number; // 0-1
  ducking: boolean; // auto-duck music for dialogue
  compression: boolean;
}

export interface ChapterMarker {
  time: number; // seconds
  title: string;
  description?: string;
}

export interface CreditsConfig {
  show: boolean;
  duration: number; // seconds
  style: 'minimal' | 'standard' | 'cinematic';
  content: CreditEntry[];
}

export interface CreditEntry {
  role: string;
  name: string;
  order: number;
}

export interface ExportOptions {
  filename: string;
  includeMetadata: boolean;
  watermark: boolean;
  optimizeFor: 'web' | 'mobile' | 'desktop' | 'social';
  splitChapters: boolean;
}

export interface AssemblyProgress {
  stage: 'preparing' | 'processing_video' | 'processing_audio' | 'mixing' | 'encoding' | 'finalizing';
  progress: number; // 0-1
  currentOperation: string;
  estimatedTimeRemaining: number; // seconds
  status: 'idle' | 'working' | 'complete' | 'error';
}

export interface AssembledVideo {
  id: string;
  format: string;
  url: string; // Blob URL or file path
  size: number; // bytes
  duration: number; // seconds
  resolution: string;
  frameRate: number;
  chapters: ChapterMarker[];
  metadata: VideoMetadata;
  createdAt: number;
}

export interface VideoMetadata {
  title: string;
  description: string;
  creator: string;
  copyright: string;
  created: string;
  software: string;
  tags: string[];
  chapters: ChapterMetadata[];
}

export interface ChapterMetadata {
  startTime: number;
  title: string;
}

export class VideoAssembler {
  private audioContext: AudioContext | null = null;
  private currentAssembly: AssemblyProgress | null = null;
  
  constructor() {
    // Initialize audio context on user interaction
    this.initializeAudioContext();
  }
  
  private initializeAudioContext(): void {
    // AudioContext must be created after user interaction
    // We'll create it lazily when needed
  }
  
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }
  
  public async assembleVideo(
    renderedOutput: RenderedOutput,
    captureSession: CaptureSession,
    config: AssemblyConfig
  ): Promise<AssembledVideo> {
    this.currentAssembly = {
      stage: 'preparing',
      progress: 0,
      currentOperation: 'Initializing video assembly...',
      estimatedTimeRemaining: this.estimateAssemblyTime(captureSession, config),
      status: 'working'
    };
    
    try {
      // Update progress
      this.updateAssemblyProgress(0.1, 'preparing', 'Preparing assets...');
      
      // Process video
      this.updateAssemblyProgress(0.3, 'processing_video', 'Processing video frames...');
      const processedVideo = await this.processVideo(renderedOutput, config);
      
      // Process audio
      this.updateAssemblyProgress(0.5, 'processing_audio', 'Processing audio tracks...');
      const processedAudio = await this.processAudio(config.audio);
      
      // Mix audio and video
      this.updateAssemblyProgress(0.7, 'mixing', 'Mixing audio and video...');
      const mixedMedia = await this.mixMedia(processedVideo, processedAudio, config);
      
      // Encode final video
      this.updateAssemblyProgress(0.8, 'encoding', 'Encoding final video...');
      const encodedVideo = await this.encodeVideo(mixedMedia, config);
      
      // Add credits if configured
      this.updateAssemblyProgress(0.9, 'finalizing', 'Adding credits and finalizing...');
      const finalVideo = await this.addCredits(encodedVideo, config.credits);
      
      // Create metadata
      const metadata = this.createVideoMetadata(captureSession, config);
      
      // Create assembled video object
      const assembledVideo: AssembledVideo = {
        id: `video_${Date.now()}`,
        format: config.outputFormat,
        url: finalVideo.url,
        size: finalVideo.size,
        duration: captureSession.metadata.duration + (config.credits.show ? config.credits.duration : 0),
        resolution: `${config.resolution.width}x${config.resolution.height}`,
        frameRate: config.frameRate,
        chapters: config.chapters,
        metadata,
        createdAt: Date.now()
      };
      
      this.currentAssembly.status = 'complete';
      this.currentAssembly.progress = 1;
      
      return assembledVideo;
      
    } catch (error) {
      this.currentAssembly.status = 'error';
      this.currentAssembly.currentOperation = `Error: ${error}`;
      throw error;
    }
  }
  
  private estimateAssemblyTime(captureSession: CaptureSession, config: AssemblyConfig): number {
    const frames = captureSession.frames.length;
    const audioTracks = config.audio.tracks.length;
    
    // Rough estimates
    const videoProcessingTime = frames * 0.02; // 20ms per frame
    const audioProcessingTime = audioTracks * 2; // 2 seconds per track
    const encodingTime = frames * 0.01; // 10ms per frame
    
    return videoProcessingTime + audioProcessingTime + encodingTime;
  }
  
  private async processVideo(
    renderedOutput: RenderedOutput,
    config: AssemblyConfig
  ): Promise<ProcessedVideo> {
    // In a real implementation, this would:
    // 1. Decode the rendered output
    // 2. Apply quality settings
    // 3. Resize if needed
    // 4. Apply any video filters
    
    // For this simplified version, we'll just pass through
    return {
      source: renderedOutput.url,
      duration: renderedOutput.duration,
      frameRate: renderedOutput.frameRate,
      resolution: renderedOutput.resolution
    };
  }
  
  private async processAudio(audioConfig: AudioAssemblyConfig): Promise<ProcessedAudio> {
    const audioContext = this.getAudioContext();
    const processedTracks: ProcessedAudioTrack[] = [];
    
    for (const track of audioConfig.tracks) {
      this.updateAssemblyProgress(
        undefined,
        'processing_audio',
        `Processing audio track: ${track.id}`
      );
      
      try {
        // Load audio file
        const response = await fetch(track.file);
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        
        // Apply volume and pan
        const gainNode = audioContext.createGain();
        const pannerNode = audioContext.createStereoPanner();
        
        gainNode.gain.value = track.volume;
        pannerNode.pan.value = track.pan;
        
        // Apply fade in/out
        if (track.fadeIn > 0) {
          gainNode.gain.setValueAtTime(0, audioContext.currentTime);
          gainNode.gain.linearRampToValueAtTime(
            track.volume,
            audioContext.currentTime + track.fadeIn
          );
        }
        
        if (track.fadeOut > 0) {
          const fadeOutStart = audioContext.currentTime + track.duration - track.fadeOut;
          gainNode.gain.setValueAtTime(track.volume, fadeOutStart);
          gainNode.gain.linearRampToValueAtTime(0, fadeOutStart + track.fadeOut);
        }
        
        processedTracks.push({
          buffer: audioBuffer,
          gainNode,
          pannerNode,
          startTime: track.startTime,
          duration: track.duration,
          type: track.type
        });
        
      } catch (error) {
        console.warn(`Failed to process audio track ${track.id}:`, error);
      }
    }
    
    return {
      tracks: processedTracks,
      mixConfig: audioConfig.mix,
      normalization: audioConfig.normalization,
      loudnessTarget: audioConfig.loudnessTarget
    };
  }
  
  private async mixMedia(
    video: ProcessedVideo,
    audio: ProcessedAudio,
    config: AssemblyConfig
  ): Promise<MixedMedia> {
    const audioContext = this.getAudioContext();
    
    // Create destination node for mixed audio
    const destination = audioContext.createMediaStreamDestination();
    
    // Mix audio tracks
    let masterGain = 1.0;
    
    if (audio.normalization) {
      // Calculate loudness and adjust gain (simplified)
      const loudness = this.estimateLoudness(audio.tracks);
      const gainAdjustment = audio.loudnessTarget / loudness;
      masterGain = Math.min(gainAdjustment, 2.0); // Limit to +6dB
    }
    
    // Apply track-specific levels from mix config
    audio.tracks.forEach(track => {
      let trackGain = masterGain;
      
      switch (track.type) {
        case 'dialogue':
          trackGain *= audio.mixConfig.dialogueLevel;
          break;
        case 'music':
          trackGain *= audio.mixConfig.musicLevel;
          // Apply ducking if enabled
          if (audio.mixConfig.ducking) {
            // Simplified ducking - in real implementation, would use compressor
            trackGain *= 0.7;
          }
          break;
        case 'sfx':
          trackGain *= audio.mixConfig.sfxLevel;
          break;
        case 'ambience':
          trackGain *= audio.mixConfig.ambienceLevel;
          break;
      }
      
      track.gainNode.gain.value *= trackGain;
      
      // Connect track to destination
      const source = audioContext.createBufferSource();
      source.buffer = track.buffer;
      source.connect(track.gainNode);
      track.gainNode.connect(track.pannerNode);
      track.pannerNode.connect(destination);
      
      // Schedule playback
      source.start(audioContext.currentTime + track.startTime);
    });
    
    // Apply compression if enabled
    if (audio.mixConfig.compression) {
      // Simplified compression - real implementation would use DynamicsCompressorNode
      const compressor = audioContext.createDynamicsCompressor();
      compressor.threshold.value = -24;
      compressor.knee.value = 30;
      compressor.ratio.value = 12;
      compressor.attack.value = 0.003;
      compressor.release.value = 0.25;
      
      // In real implementation, connect through compressor
    }
    
    return {
      videoSource: video.source,
      audioStream: destination.stream,
      duration: video.duration,
      frameRate: video.frameRate,
      resolution: video.resolution
    };
  }
  
  private estimateLoudness(tracks: ProcessedAudioTrack[]): number {
    // Simplified loudness estimation
    // Real implementation would use proper LUFS measurement
    
    let totalLoudness = 0;
    let totalDuration = 0;
    
    tracks.forEach(track => {
      const buffer = track.buffer;
      const data = buffer.getChannelData(0);
      let sum = 0;
      
      // Calculate RMS
      for (let i = 0; i < data.length; i++) {
        sum += data[i] * data[i];
      }
      
      const rms = Math.sqrt(sum / data.length);
      const loudness = 20 * Math.log10(rms); // Convert to dB
      
      totalLoudness += loudness * track.duration;
      totalDuration += track.duration;
    });
    
    return totalDuration > 0 ? totalLoudness / totalDuration : -24; // Default -24 LUFS
  }
  
  private async encodeVideo(
    media: MixedMedia,
    config: AssemblyConfig
  ): Promise<EncodedVideo> {
    // Simplified encoding - real implementation would use MediaRecorder or WebCodecs
    
    // Create video element with media
    const video = document.createElement('video');
    video.width = parseInt(media.resolution.split('x')[0]);
    video.height = parseInt(media.resolution.split('x')[1]);
    video.src = media.videoSource;
    
    // Create MediaRecorder for encoding
    const stream = new MediaStream();
    // Add video track (simplified - would need actual video track)
    // Add audio track
    if (media.audioStream) {
      media.audioStream.getAudioTracks().forEach(track => {
        stream.addTrack(track);
      });
    }
    
    const mimeType = this.getVideoMimeType(config.outputFormat, config.quality);
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: this.getVideoBitrate(config.quality, config.resolution)
    });
    
    const chunks: Blob[] = [];
    
    return new Promise((resolve, reject) => {
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        
        resolve({
          url,
          size: blob.size,
          format: config.outputFormat,
          mimeType
        });
      };
      
      mediaRecorder.onerror = (error) => {
        reject(error);
      };
      
      // Start recording
      mediaRecorder.start();
      
      // Stop after duration
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, media.duration * 1000);
    });
  }
  
  private async addCredits(
    video: EncodedVideo,
    creditsConfig: CreditsConfig
  ): Promise<EncodedVideo> {
    if (!creditsConfig.show) {
      return video;
    }
    
    // Simplified credits addition
    // Real implementation would render credits overlay
    
    console.log('Adding credits:', creditsConfig);
    
    // For now, just return the original video
    return video;
  }
  
  private createVideoMetadata(
    captureSession: CaptureSession,
    config: AssemblyConfig
  ): VideoMetadata {
    const chapters: ChapterMetadata[] = config.chapters.map(chapter => ({
      startTime: chapter.time,
      title: chapter.title
    }));
    
    return {
      title: config.exportOptions.filename.replace(/\.[^/.]+$/, ""), // Remove extension
      description: `Cinematic short generated by Animaster. Emotional arc: ${captureSession.metadata.emotionalArc.join(' → ')}`,
      creator: 'Animaster Vertical Slice',
      copyright: `© ${new Date().getFullYear()} Animaster`,
      created: new Date().toISOString(),
      software: 'Animaster Phase 10',
      tags: ['animaster', 'cinematic', 'short film', 'vertical slice', ...config.exportOptions.optimizeFor.split('_')],
      chapters
    };
  }
  
  private getVideoMimeType(format: string, quality: string): string {
    const mimeTypes: Record<string, Record<string, string>> = {
      'mp4': {
        'low': 'video/mp4; codecs="avc1.42E01E"',
        'medium': 'video/mp4; codecs="avc1.42E01E"',
        'high': 'video/mp4; codecs="avc1.640028"',
        'ultra': 'video/mp4; codecs="avc1.640028"'
      },
      'webm': {
        'low': 'video/webm; codecs="vp8, opus"',
        'medium': 'video/webm; codecs="vp9, opus"',
        'high': 'video/webm; codecs="vp9, opus"',
        'ultra': 'video/webm; codecs="vp9, opus"'
      }
    };
    
    return mimeTypes[format]?.[quality] || 'video/webm; codecs="vp9, opus"';
  }
  
  private getVideoBitrate(quality: string, resolution: { width: number; height: number }): number {
    const baseBitrates: Record<string, number> = {
      'low': 500000,    // 0.5 Mbps
      'medium': 1000000, // 1 Mbps
      'high': 2500000,   // 2.5 Mbps
      'ultra': 5000000   // 5 Mbps
    };
    
    const baseBitrate = baseBitrates[quality] || 1000000;
    const pixels = resolution.width * resolution.height;
    const scale = pixels / (1920 * 1080); // Scale relative to 1080p
    
    return Math.floor(baseBitrate * scale);
  }
  
  private updateAssemblyProgress(
    progress?: number,
    stage?: AssemblyProgress['stage'],
    operation?: string
  ): void {
    if (this.currentAssembly) {
      if (progress !== undefined) {
        this.currentAssembly.progress = progress;
      }
      if (stage !== undefined) {
        this.currentAssembly.stage = stage;
      }
      if (operation !== undefined) {
        this.currentAssembly.currentOperation = operation;
      }
      
      // Update estimated time remaining
      if (this.currentAssembly.progress > 0) {
        const elapsed = Date.now() - (this.currentAssembly as any).startTime;
        const estimatedTotal = elapsed / this.currentAssembly.progress;
        this.currentAssembly.estimatedTimeRemaining = (estimatedTotal - elapsed) / 1000;
      }
    }
  }
  
  public getAssemblyProgress(): AssemblyProgress | null {
    return this.currentAssembly ? { ...this.currentAssembly } : null;
  }
  
  public cancelAssembly(): void {
    if (this.currentAssembly) {
      this.currentAssembly.status = 'idle';
    }
    
    if (this.audioContext && this.audioContext.state !== 'closed') {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
  
  public async downloadVideo(video: AssembledVideo, filename?: string): Promise<void> {
    const link = document.createElement('a');
    link.href = video.url;
    link.download = filename || `${video.metadata.title}.${video.format}`;
    link.click();
    
    // Clean up blob URL after download
    setTimeout(() => {
      URL.revokeObjectURL(video.url);
    }, 1000);
  }
  
  public getAssemblySummary(): string {
    if (!this.currentAssembly) {
      return 'No active assembly';
    }
    
    const assembly = this.currentAssembly;
    
    return `
Assembly Status: ${assembly.status}
Stage: ${assembly.stage}
Progress: ${(assembly.progress * 100).toFixed(1)}%
Current Operation: ${assembly.currentOperation}
Estimated Time Remaining: ${assembly.estimatedTimeRemaining.toFixed(1)}s
  `.trim();
  }
}

// Type definitions for internal use
interface ProcessedVideo {
  source: string;
  duration: number;
  frameRate: number;
  resolution: string;
}

interface ProcessedAudioTrack {
  buffer: AudioBuffer;
  gainNode: GainNode;
  pannerNode: StereoPannerNode;
  startTime: number;
  duration: number;
  type: string;
}

interface ProcessedAudio {
  tracks: ProcessedAudioTrack[];
  mixConfig: AudioMixConfig;
  normalization: boolean;
  loudnessTarget: number;
}

interface MixedMedia {
  videoSource: string;
  audioStream: MediaStream | null;
  duration: number;
  frameRate: number;
  resolution: string;
}

interface EncodedVideo {
  url: string;
  size: number;
  format: string;
  mimeType: string;
}