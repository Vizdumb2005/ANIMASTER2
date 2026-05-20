// Vertical Slice Film Component for 1-minute cinematic shorts
// Phase 10: "The Last Train"

import React, { useState, useEffect, useRef } from 'react';
import { CinematicTimeline } from '../timeline/cinematicTimeline';
import { BeatScheduler } from '../timeline/beatScheduler';
import { RuntimeShotController } from '../timeline/runtimeShotController';
import { FrameCaptureSystem } from '../export/frameCapture';
import { TimelineRenderer } from '../export/timelineRenderer';
import { VideoAssembler } from '../export/videoAssembler';

interface VerticalSliceFilmProps {
  prompt?: string;
  onFilmComplete?: (filmData: any) => void;
  onProgressUpdate?: (progress: number, stage: string) => void;
}

export const VerticalSliceFilm: React.FC<VerticalSliceFilmProps> = ({
  prompt = "A lonely man waits at an empty train station at night during rain.",
  onFilmComplete,
  onProgressUpdate
}) => {
  const [filmState, setFilmState] = useState<'idle' | 'generating' | 'playing' | 'paused' | 'capturing' | 'rendering' | 'complete'>('idle');
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(60);
  const [currentShot, setCurrentShot] = useState<string>('');
  const [currentEmotion, setCurrentEmotion] = useState<string>('');
  const [emotionIntensity, setEmotionIntensity] = useState(0);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [renderProgress, setRenderProgress] = useState(0);
  
  const timelineRef = useRef<CinematicTimeline | null>(null);
  const beatSchedulerRef = useRef<BeatScheduler | null>(null);
  const shotControllerRef = useRef<RuntimeShotController | null>(null);
  const frameCaptureRef = useRef<FrameCaptureSystem | null>(null);
  const timelineRendererRef = useRef<TimelineRenderer | null>(null);
  const videoAssemblerRef = useRef<VideoAssembler | null>(null);
  
  const animationFrameRef = useRef<number>();
  const lastUpdateTimeRef = useRef<number>(0);
  
  // Initialize systems
  useEffect(() => {
    // This would be replaced with actual data from server
    const mockShots = [
      {
        id: 'shot_1',
        shotType: 'establishing',
        emotionalIntent: 'isolation',
        narrativePurpose: 'Establish empty station atmosphere',
        durationSeconds: 8,
        cameraSpecs: {
          angle: 'high',
          movement: 'static',
          lens: 'wide',
          distance: 0.9,
          speed: 0.1
        },
        framing: {
          composition: 'negative_space',
          focalPriority: ['character', 'empty_space'],
          depthBias: 0.8,
          headroom: 0.5,
          lookRoom: 0.4
        },
        transition: {
          type: 'fade',
          durationSeconds: 1.5,
          emotionalEffect: 'establishing entrance',
          timing: 'precise'
        },
        emotionalWeight: 0.6,
        sequencePosition: 1,
        startTimeSeconds: 0,
        endTimeSeconds: 8,
        emotionalContext: {
          primaryEmotion: 'loneliness',
          intensity: 0.6,
          physicalManifestation: 'slumped shoulders',
          gazeDirection: 'downward'
        }
      },
      {
        id: 'shot_2',
        shotType: 'medium',
        emotionalIntent: 'observation',
        narrativePurpose: 'Observe character waiting',
        durationSeconds: 7,
        cameraSpecs: {
          angle: 'eye_level',
          movement: 'subtle_drift',
          lens: 'normal',
          distance: 0.5,
          speed: 0.2
        },
        framing: {
          composition: 'rule_of_thirds',
          focalPriority: ['character'],
          depthBias: 0.5,
          headroom: 0.3,
          lookRoom: 0.5
        },
        transition: {
          type: 'cut',
          durationSeconds: 0.1,
          emotionalEffect: 'standard cut',
          timing: 'precise'
        },
        emotionalWeight: 0.4,
        sequencePosition: 2,
        startTimeSeconds: 8,
        endTimeSeconds: 15,
        emotionalContext: {
          primaryEmotion: 'anticipation',
          intensity: 0.4,
          physicalManifestation: 'checking watch',
          gazeDirection: 'horizon'
        }
      },
      {
        id: 'shot_3',
        shotType: 'closeup',
        emotionalIntent: 'introspection',
        narrativePurpose: 'Reveal internal emotion',
        durationSeconds: 7,
        cameraSpecs: {
          angle: 'eye_level',
          movement: 'static',
          lens: 'telephoto',
          distance: 0.3,
          speed: 0.1
        },
        framing: {
          composition: 'center',
          focalPriority: ['character_face'],
          depthBias: 0.3,
          headroom: 0.1,
          lookRoom: 0.3
        },
        transition: {
          type: 'slow_push_in',
          durationSeconds: 1.0,
          emotionalEffect: 'emotional blending',
          timing: 'overlap'
        },
        emotionalWeight: 0.7,
        sequencePosition: 3,
        startTimeSeconds: 15,
        endTimeSeconds: 22,
        emotionalContext: {
          primaryEmotion: 'melancholy',
          intensity: 0.7,
          physicalManifestation: 'stillness',
          gazeDirection: 'middle distance'
        }
      }
    ];
    
    const mockTransitions = [
      {
        fromShotId: 'shot_1',
        toShotId: 'shot_2',
        type: 'fade',
        durationSeconds: 1.5,
        emotionalEffect: {
          primaryEmotion: 'loneliness',
          intensityChange: -0.2,
          pacingEffect: 'maintains',
          narrativePurpose: 'Transition to observation'
        }
      },
      {
        fromShotId: 'shot_2',
        toShotId: 'shot_3',
        type: 'dissolve',
        durationSeconds: 1.0,
        emotionalEffect: {
          primaryEmotion: 'melancholy',
          intensityChange: 0.3,
          pacingEffect: 'decelerates',
          narrativePurpose: 'Transition to introspection'
        }
      }
    ];
    
    const mockEmotionalBeats = [
      {
        timeStart: 0,
        timeEnd: 10,
        emotion: 'loneliness',
        intensity: 0.6,
        description: 'Establishing isolation',
        cinematicPurpose: 'Set emotional tone'
      },
      {
        timeStart: 10,
        timeEnd: 25,
        emotion: 'anticipation',
        intensity: 0.4,
        description: 'Subtle waiting',
        cinematicPurpose: 'Build tension'
      },
      {
        timeStart: 25,
        timeEnd: 40,
        emotion: 'melancholy',
        intensity: 0.7,
        description: 'Deepening regret',
        cinematicPurpose: 'Emotional depth'
      }
    ];
    
    // Initialize systems
    const timeline = new CinematicTimeline(mockShots as any, mockTransitions as any, mockEmotionalBeats as any);
    const beatScheduler = new BeatScheduler(mockEmotionalBeats as any, mockShots as any);
    const shotController = new RuntimeShotController(timeline, beatScheduler);
    const frameCapture = new FrameCaptureSystem(timeline, shotController);
    const timelineRenderer = new TimelineRenderer(timeline, shotController);
    const videoAssembler = new VideoAssembler();
    
    timelineRef.current = timeline;
    beatSchedulerRef.current = beatScheduler;
    shotControllerRef.current = shotController;
    frameCaptureRef.current = frameCapture;
    timelineRendererRef.current = timelineRenderer;
    videoAssemblerRef.current = videoAssembler;
    
    // Set initial state
    const initialState = timeline.getState();
    setCurrentTime(initialState.currentTimeSeconds);
    setTotalDuration(initialState.totalDurationSeconds);
    setCurrentShot(initialState.currentShotIndex >= 0 ? mockShots[initialState.currentShotIndex].shotType : '');
    setCurrentEmotion(initialState.emotionalState.primaryEmotion);
    setEmotionIntensity(initialState.emotionalState.intensity);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      frameCaptureRef.current?.cleanup();
      timelineRendererRef.current?.cleanup();
    };
  }, []);
  
  // Animation loop
  const updateLoop = (timestamp: number) => {
    if (!lastUpdateTimeRef.current) {
      lastUpdateTimeRef.current = timestamp;
    }
    
    const deltaTime = (timestamp - lastUpdateTimeRef.current) / 1000; // Convert to seconds
    lastUpdateTimeRef.current = timestamp;
    
    if (timelineRef.current && shotControllerRef.current && beatSchedulerRef.current) {
      timelineRef.current.update(deltaTime);
      shotControllerRef.current.update(deltaTime);
      beatSchedulerRef.current.update(timelineRef.current.getState().currentTimeSeconds);
      
      const state = timelineRef.current.getState();
      setCurrentTime(state.currentTimeSeconds);
      
      const currentShotObj = timelineRef.current.getCurrentShot();
      setCurrentShot(currentShotObj?.shotType || '');
      
      setCurrentEmotion(state.emotionalState.primaryEmotion);
      setEmotionIntensity(state.emotionalState.intensity);
      
      onProgressUpdate?.(state.currentTimeSeconds / state.totalDurationSeconds, 'playing');
    }
    
    if (filmState === 'playing') {
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    }
  };
  
  // Start/stop animation based on film state
  useEffect(() => {
    if (filmState === 'playing') {
      lastUpdateTimeRef.current = 0;
      animationFrameRef.current = requestAnimationFrame(updateLoop);
    } else if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [filmState]);
  
  const handleGenerateFilm = async () => {
    setFilmState('generating');
    onProgressUpdate?.(0, 'generating');
    
    // Simulate film generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setFilmState('idle');
    onProgressUpdate?.(1, 'generated');
  };
  
  const handlePlay = () => {
    if (timelineRef.current) {
      timelineRef.current.play();
      setFilmState('playing');
    }
  };
  
  const handlePause = () => {
    if (timelineRef.current) {
      timelineRef.current.pause();
      setFilmState('paused');
    }
  };
  
  const handleStop = () => {
    if (timelineRef.current) {
      timelineRef.current.stop();
      setFilmState('idle');
      setCurrentTime(0);
    }
  };
  
  const handleSeek = (time: number) => {
    if (timelineRef.current) {
      timelineRef.current.seek(time);
      setCurrentTime(time);
    }
  };
  
  const handleCapture = async () => {
    if (!frameCaptureRef.current) return;
    
    setFilmState('capturing');
    
    const config = {
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      quality: 0.8,
      format: 'png' as const,
      includeAudio: false,
      captureMode: 'offline' as const,
      duration: totalDuration
    };
    
    const session = frameCaptureRef.current.startCapture(config);
    
    // Monitor capture progress
    const checkProgress = setInterval(() => {
      const currentSession = frameCaptureRef.current?.getCurrentSession();
      if (currentSession) {
        setCaptureProgress(currentSession.progress);
        onProgressUpdate?.(currentSession.progress, 'capturing');
        
        if (currentSession.status === 'complete') {
          clearInterval(checkProgress);
          setFilmState('idle');
          onProgressUpdate?.(1, 'captured');
        }
      }
    }, 100);
  };
  
  const handleRender = async () => {
    if (!timelineRendererRef.current || !frameCaptureRef.current) return;
    
    setFilmState('rendering');
    
    const captureSession = frameCaptureRef.current.getCurrentSession();
    if (!captureSession) {
      console.error('No capture session found');
      return;
    }
    
    const config = {
      outputFormat: 'mp4' as const,
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      quality: 0.8,
      includeAudio: false,
      metadata: {
        title: 'The Last Train',
        description: 'A lonely man waits at an empty train station at night during rain.',
        creator: 'Animaster',
        copyright: '',
        tags: ['animaster', 'cinematic', 'short film']
      }
    };
    
    try {
      const output = await timelineRendererRef.current.renderFromCapture(captureSession, config);
      
      // Monitor render progress
      const checkProgress = setInterval(() => {
        const progress = timelineRendererRef.current?.getRenderProgress();
        if (progress) {
          setRenderProgress(progress.progress);
          onProgressUpdate?.(progress.progress, 'rendering');
          
          if (progress.status === 'complete') {
            clearInterval(checkProgress);
            setFilmState('complete');
            onProgressUpdate?.(1, 'rendered');
            
            // Notify completion
            onFilmComplete?.({
              url: output.url,
              duration: output.duration,
              format: output.format,
              resolution: output.resolution
            });
          }
        }
      }, 100);
      
    } catch (error) {
      console.error('Render failed:', error);
      setFilmState('idle');
    }
  };
  
  const handleExport = async () => {
    if (!videoAssemblerRef.current || !frameCaptureRef.current) return;
    
    const captureSession = frameCaptureRef.current.getCurrentSession();
    if (!captureSession) {
      console.error('No capture session found');
      return;
    }
    
    // Create a mock rendered output for demonstration
    const mockRenderedOutput = {
      id: 'mock_output',
      format: 'mp4',
      url: 'data:video/mp4;base64,mock',
      size: 1024 * 1024 * 10, // 10MB
      duration: totalDuration,
      resolution: '1920x1080',
      frameRate: 30,
      createdAt: Date.now(),
      metadata: {
        title: 'The Last Train',
        description: 'Generated by Animaster',
        creator: 'Animaster',
        copyright: '',
        tags: []
      }
    };
    
    const config = {
      outputFormat: 'mp4' as const,
      resolution: { width: 1920, height: 1080 },
      frameRate: 30,
      quality: 'high' as const,
      audio: {
        tracks: [],
        mix: {
          dialogueLevel: 1,
          musicLevel: 0.7,
          sfxLevel: 0.8,
          ambienceLevel: 0.6,
          ducking: true,
          compression: true
        },
        normalization: true,
        loudnessTarget: -16
      },
      chapters: [
        { time: 0, title: 'Establishing Isolation' },
        { time: 15, title: 'Emotional Introspection' },
        { time: 40, title: 'Climax Arrival' }
      ],
      credits: {
        show: true,
        duration: 5,
        style: 'minimal' as const,
        content: [
          { role: 'Directed by', name: 'Animaster AI', order: 1 },
          { role: 'Cinematography', name: 'Procedural System', order: 2 }
        ]
      },
      exportOptions: {
        filename: 'the_last_train.mp4',
        includeMetadata: true,
        watermark: true,
        optimizeFor: 'web' as const,
        splitChapters: false
      }
    };
    
    try {
      const assembledVideo = await videoAssemblerRef.current.assembleVideo(
        mockRenderedOutput,
        captureSession,
        config
      );
      
      // Download the video
      await videoAssemblerRef.current.downloadVideo(assembledVideo);
      
    } catch (error) {
      console.error('Export failed:', error);
    }
  };
  
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className="vertical-slice-film">
      <div className="film-header">
        <h2>Vertical Slice: "The Last Train"</h2>
        <p className="film-prompt">{prompt}</p>
      </div>
      
      <div className="film-controls">
        <div className="control-group">
          <button 
            onClick={handleGenerateFilm}
            disabled={filmState !== 'idle'}
            className="btn btn-primary"
          >
            Generate Film
          </button>
          
          <button 
            onClick={handlePlay}
            disabled={filmState === 'playing' || filmState === 'capturing' || filmState === 'rendering'}
            className="btn btn-success"
          >
            Play
          </button>
          
          <button 
            onClick={handlePause}
            disabled={filmState !== 'playing'}
            className="btn btn-warning"
          >
            Pause
          </button>
          
          <button 
            onClick={handleStop}
            className="btn btn-danger"
          >
            Stop
          </button>
        </div>
        
        <div className="control-group">
          <button 
            onClick={handleCapture}
            disabled={filmState !== 'idle' && filmState !== 'paused'}
            className="btn btn-info"
          >
            Capture Frames
          </button>
          
          <button 
            onClick={handleRender}
            disabled={filmState !== 'idle' || captureProgress === 0}
            className="btn btn-secondary"
          >
            Render Video
          </button>
          
          <button 
            onClick={handleExport}
            disabled={filmState !== 'complete'}
            className="btn btn-success"
          >
            Export Film
          </button>
        </div>
      </div>
      
      <div className="film-timeline">
        <div className="timeline-bar">
          <div 
            className="timeline-progress"
            style={{ width: `${(currentTime / totalDuration) * 100}%` }}
          />
          <input
            type="range"
            min="0"
            max={totalDuration}
            value={currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="timeline-slider"
          />
        </div>
        <div className="timeline-info">
          <span>{formatTime(currentTime)} / {formatTime(totalDuration)}</span>
          <span>Shot: {currentShot}</span>
          <span>Emotion: {currentEmotion} ({(emotionIntensity * 100).toFixed(0)}%)</span>
        </div>
      </div>
      
      <div className="film-status">
        <div className="status-indicator">
          <span className={`status-dot status-${filmState}`} />
          <span className="status-text">Status: {filmState.toUpperCase()}</span>
        </div>
        
        {filmState === 'capturing' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${captureProgress * 100}%` }}
              />
            </div>
            <span className="progress-text">
              Capturing: {(captureProgress * 100).toFixed(1)}%
            </span>
          </div>
        )}
        
        {filmState === 'rendering' && (
          <div className="progress-container">
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${renderProgress * 100}%` }}
              />
            </div>
            <span className="progress-text">
              Rendering: {(renderProgress * 100).toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      <div className="film-preview">
        <div className="preview-placeholder">
          <div className="preview-content">
            <div className="shot-indicator">{currentShot}</div>
            <div className="emotion-indicator">{currentEmotion}</div>
            <div className="time-indicator">{formatTime(currentTime)}</div>
          </div>
        </div>
      </div>
      
      <div className="film-stats">
        <div className="stat-card">
          <h4>Cinematic Parameters</h4>
          <div className="stat-grid">
            <div className="stat-item">
              <span className="stat-label">Shot Duration</span>
              <span className="stat-value">8.0s avg</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Emotional Beats</span>
              <span className="stat-value">5</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Transitions</span>
              <span className="stat-value">7</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Pacing</span>
              <span className="stat-value">Slow</span>
            </div>
          </div>
        </div>
        
        <div className="stat-card">
          <h4>Emotional Arc</h4>
          <div className="emotion-arc">
            <div className="arc-point" style={{ left: '0%' }}>
              <span className="arc-emotion">Loneliness</span>
              <span className="arc-time">0s</span>
            </div>
            <div className="arc-point" style={{ left: '25%' }}>
              <span className="arc-emotion">Anticipation</span>
              <span className="arc-time">15s</span>
            </div>
            <div className="arc-point" style={{ left: '50%' }}>
              <span className="arc-emotion">Melancholy</span>
              <span className="arc-time">30s</span>
            </div>
            <div className="arc-point" style={{ left: '75%' }}>
              <span className="arc-emotion">Tension</span>
              <span className="arc-time">45s</span>
            </div>
            <div className="arc-point" style={{ left: '100%' }}>
              <span className="arc-emotion">Unresolved</span>
              <span className="arc-time">60s</span>
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .vertical-slice-film {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #1a1a2e;
          color: #ffffff;
          border-radius: 8px;
        }
        
        .film-header {
          text-align: center;
          margin-bottom: 30px;
        }
        
        .film-header h2 {
          margin: 0 0 10px 0;
          color: #e94560;
        }
        
        .film-prompt {
          font-style: italic;
          color: #a9b7c6;
          max-width: 800px;
          margin: 0 auto;
        }
        
        .film-controls {
          display: flex;
          flex-wrap: wrap;
          gap: 15px;
          margin-bottom: 30px;
          justify-content: center;
        }
        
        .control-group {
          display: flex;
          gap: 10px;
        }
        
        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s;
        }
        
        .btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        
        .btn-primary {
          background: #0f3460;
          color: white;
        }
        
        .btn-success {
          background: #2a9d8f;
          color: white;
        }
        
        .btn-warning {
          background: #e9c46a;
          color: #333;
        }
        
        .btn-danger {
          background: #e63946;
          color: white;
        }
        
        .btn-info {
          background: #457b9d;
          color: white;
        }
        
        .btn-secondary {
          background: #6c757d;
          color: white;
        }
        
        .film-timeline {
          background: #16213e;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .timeline-bar {
          position: relative;
          height: 30px;
          background: #0f3460;
          border-radius: 4px;
          margin-bottom: 10px;
          overflow: hidden;
        }
        
        .timeline-progress {
          position: absolute;
          height: 100%;
          background: #e94560;
          transition: width 0.1s;
        }
        
        .timeline-slider {
          position: absolute;
          width: 100%;
          height: 100%;
          opacity: 0;
          cursor: pointer;
        }
        
        .timeline-info {
          display: flex;
          justify-content: space-between;
          font-size: 14px;
          color: #a9b7c6;
        }
        
        .film-status {
          background: #16213e;
          border-radius: 8px;
          padding: 20px;
          margin-bottom: 30px;
        }
        
        .status-indicator {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 15px;
        }
        
        .status-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
        }
        
        .status-idle { background: #6c757d; }
        .status-generating { background: #e9c46a; animation: pulse 1s infinite; }
        .status-playing { background: #2a9d8f; }
        .status-paused { background: #e9c46a; }
        .status-capturing { background: #457b9d; animation: pulse 1s infinite; }
        .status-rendering { background: #9d4edd; animation: pulse 1s infinite; }
        .status-complete { background: #2a9d8f; }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        .progress-container {
          margin-top: 10px;
        }
        
        .progress-bar {
          height: 10px;
          background: #0f3460;
          border-radius: 5px;
          overflow: hidden;
          margin-bottom: 5px;
        }
        
        .progress-fill {
          height: 100%;
          background: #e94560;
          transition: width 0.3s;
        }
        
        .progress-text {
          font-size: 14px;
          color: #a9b7c6;
        }
        
        .film-preview {
          background: #0f3460;
          border-radius: 8px;
          padding: 30px;
          margin-bottom: 30px;
          text-align: center;
        }
        
        .preview-placeholder {
          width: 100%;
          height: 400px;
          background: linear-gradient(135deg, #16213e 0%, #0f3460 100%);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          overflow: hidden;
        }
        
        .preview-placeholder::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: 
            radial-gradient(circle at 20% 30%, rgba(233, 69, 96, 0.1) 0%, transparent 50%),
            radial-gradient(circle at 80% 70%, rgba(42, 157, 143, 0.1) 0%, transparent 50%);
        }
        
        .preview-content {
          position: relative;
          z-index: 1;
          color: white;
        }
        
        .shot-indicator {
          font-size: 24px;
          font-weight: bold;
          margin-bottom: 10px;
          color: #e94560;
        }
        
        .emotion-indicator {
          font-size: 20px;
          margin-bottom: 10px;
          color: #2a9d8f;
        }
        
        .time-indicator {
          font-size: 18px;
          color: #a9b7c6;
        }
        
        .film-stats {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .stat-card {
          background: #16213e;
          border-radius: 8px;
          padding: 20px;
        }
        
        .stat-card h4 {
          margin: 0 0 15px 0;
          color: #e94560;
        }
        
        .stat-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        
        .stat-item {
          display: flex;
          flex-direction: column;
        }
        
        .stat-label {
          font-size: 12px;
          color: #a9b7c6;
          margin-bottom: 2px;
        }
        
        .stat-value {
          font-size: 16px;
          font-weight: 600;
          color: white;
        }
        
        .emotion-arc {
          position: relative;
          height: 60px;
          background: #0f3460;
          border-radius: 4px;
          margin-top: 10px;
        }
        
        .arc-point {
          position: absolute;
          top: 50%;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
        }
        
        .arc-emotion {
          font-size: 12px;
          color: #e94560;
          margin-bottom: 2px;
        }
        
        .arc-time {
          font-size: 10px;
          color: #a9b7c6;
        }
        
        @media (max-width: 768px) {
          .film-stats {
            grid-template-columns: 1fr;
          }
          
          .film-controls {
            flex-direction: column;
            align-items: center;
          }
          
          .control-group {
            flex-wrap: wrap;
            justify-content: center;
          }
        }
      `}</style>
    </div>
  );
};