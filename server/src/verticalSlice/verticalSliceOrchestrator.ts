// Vertical Slice Orchestrator for 1-minute cinematic shorts
// Phase 10: "The Last Train"

import { generateNarrativeArc, NarrativeArc } from '../narrative/narrativeArcGenerator.js';
import { generateEmotionalProgression, EmotionalTransition } from '../narrative/emotionalProgression.js';
import { analyzeEscalation, EscalationProfile } from '../narrative/cinematicEscalation.js';
import { planShotsFromArc, PlannedShot } from '../shots/shotPlanner.js';
import { sequenceShots, ShotSequence } from '../shots/shotSequencer.js';
import { planTransitions, TransitionPlan } from '../shots/transitionPlanner.js';
import { analyzePacing, PacingAnalysis } from '../shots/pacingPlanner.js';

export interface VerticalSliceFilm {
  id: string;
  title: string;
  prompt: string;
  narrativeArc: NarrativeArc;
  emotionalProgression: EmotionalTransition[];
  cinematicEscalation: EscalationProfile;
  shotPlan: PlannedShot[];
  shotSequence: ShotSequence;
  transitions: TransitionPlan[];
  pacingAnalysis: PacingAnalysis;
  metadata: FilmMetadata;
  createdAt: number;
  status: 'generating' | 'planned' | 'rendering' | 'complete' | 'error';
}

export interface FilmMetadata {
  durationSeconds: number;
  shotCount: number;
  emotionalBeats: number;
  transitionCount: number;
  pacingTempo: string;
  emotionalArc: string[];
  cinematicIntensity: number; // 0-1
  coherenceScore: number; // 0-1
}

export interface GenerationProgress {
  stage: 'narrative' | 'emotional' | 'escalation' | 'shot_planning' | 'sequencing' | 'transitions' | 'pacing' | 'complete';
  progress: number; // 0-1
  currentOperation: string;
  estimatedTimeRemaining: number; // seconds
  startTime: number;
}

export class VerticalSliceOrchestrator {
  private currentFilm: VerticalSliceFilm | null = null;
  private generationProgress: GenerationProgress | null = null;
  
  public async generateFilm(prompt: string): Promise<VerticalSliceFilm> {
    const filmId = `film_${Date.now()}`;
    
    this.currentFilm = {
      id: filmId,
      title: this.extractTitleFromPrompt(prompt),
      prompt,
      narrativeArc: {} as NarrativeArc,
      emotionalProgression: [],
      cinematicEscalation: {
        overallShape: 'linear',
        peakTime: 0.5,
        peakIntensity: 0.7,
        resolutionSlope: 0.3
      },
      shotPlan: [],
      shotSequence: {
        id: 'initial',
        shots: [],
        totalDurationSeconds: 0,
        emotionalArc: [],
        pacingProfile: {
          tempo: 'medium',
          shotDurationMean: 5,
          shotDurationStdDev: 2,
          transitionRatio: 0.1,
          silenceRatio: 0.2
        },
        continuityRules: []
      },
      transitions: [],
      pacingAnalysis: {
        overallTempo: 'medium',
        shotDurationProfile: {
          mean: 5,
          median: 5,
          stdDev: 2,
          min: 2,
          max: 10,
          distribution: 'normal'
        },
        emotionalRhythm: {
          beatFrequency: 0.5,
          intensityVariation: 0.3,
          transitionSmoothness: 0.8,
          peakAlignment: 0.7
        },
        silenceDistribution: {
          totalSilenceSeconds: 10,
          silenceRatio: 0.2,
          longestSilence: 5,
          distribution: 'dispersed',
          effectiveness: 0.6
        },
        tensionCurve: [],
        pacingIssues: [],
        recommendations: []
      },
      metadata: {
        durationSeconds: 0,
        shotCount: 0,
        emotionalBeats: 0,
        transitionCount: 0,
        pacingTempo: 'medium',
        emotionalArc: [],
        cinematicIntensity: 0.5,
        coherenceScore: 0.5
      },
      createdAt: Date.now(),
      status: 'generating'
    };
    
    this.generationProgress = {
      stage: 'narrative',
      progress: 0,
      currentOperation: 'Generating narrative arc...',
      estimatedTimeRemaining: 30,
      startTime: Date.now()
    };
    
    try {
      // 1. Generate narrative arc
      this.updateProgress(0.1, 'narrative', 'Generating narrative arc...');
      const narrativeArc = generateNarrativeArc(prompt);
      if (this.currentFilm) this.currentFilm.narrativeArc = narrativeArc;
      
      // 2. Generate emotional progression
      this.updateProgress(0.2, 'emotional', 'Generating emotional progression...');
      const emotionalProgression = generateEmotionalProgression(narrativeArc.emotionalProgression);
      if (this.currentFilm) this.currentFilm.emotionalProgression = emotionalProgression;
      
      // 3. Analyze cinematic escalation
      this.updateProgress(0.3, 'escalation', 'Analyzing cinematic escalation...');
      const cinematicEscalation = analyzeEscalation(
        narrativeArc.emotionalProgression,
        narrativeArc.shotSequence
      );
      if (this.currentFilm) this.currentFilm.cinematicEscalation = cinematicEscalation;
      
      // 4. Plan shots
      this.updateProgress(0.5, 'shot_planning', 'Planning shots...');
      const shotPlan = planShotsFromArc(
        narrativeArc.emotionalProgression,
        narrativeArc.shotSequence
      );
      if (this.currentFilm) this.currentFilm.shotPlan = shotPlan;
      
      // 5. Sequence shots
      this.updateProgress(0.6, 'sequencing', 'Sequencing shots...');
      const shotSequence = sequenceShots(
        shotPlan,
        narrativeArc.emotionalProgression
      );
      if (this.currentFilm) this.currentFilm.shotSequence = shotSequence;
      
      // 6. Plan transitions
      this.updateProgress(0.8, 'transitions', 'Planning transitions...');
      const transitions = planTransitions(shotSequence.shots);
      if (this.currentFilm) this.currentFilm.transitions = transitions;
      
      // 7. Analyze pacing
      this.updateProgress(0.9, 'pacing', 'Analyzing pacing...');
      const pacingAnalysis = analyzePacing(
        shotSequence.shots,
        transitions,
        narrativeArc.emotionalProgression
      );
      if (this.currentFilm) this.currentFilm.pacingAnalysis = pacingAnalysis;
      
      // 8. Update metadata
      this.updateProgress(0.95, 'complete', 'Finalizing film metadata...');
      this.updateFilmMetadata();
      
      // 9. Complete
      this.updateProgress(1, 'complete', 'Film generation complete!');
      if (this.currentFilm) this.currentFilm.status = 'planned';
      
      return this.currentFilm || this.createDefaultFilm();
      
    } catch (error) {
      if (this.currentFilm) this.currentFilm.status = 'error';
      this.generationProgress = null;
      throw error;
    }
  }
  
  private extractTitleFromPrompt(prompt: string): string {
    // Simple title extraction
    if (prompt.toLowerCase().includes('train') && prompt.toLowerCase().includes('station')) {
      return 'The Last Train';
    }
    
    // Extract first few words as title
    const words = prompt.split(' ');
    if (words.length >= 3) {
      return words.slice(0, 3).join(' ');
    }
    
    return 'Cinematic Short';
  }
  
  private updateFilmMetadata(): void {
    if (!this.currentFilm) return;
    
    const film = this.currentFilm;
    
    film.metadata = {
      durationSeconds: film.narrativeArc.durationSeconds,
      shotCount: film.shotPlan.length,
      emotionalBeats: film.narrativeArc.emotionalProgression.length,
      transitionCount: film.transitions.length,
      pacingTempo: film.pacingAnalysis.overallTempo,
      emotionalArc: film.narrativeArc.emotionalProgression.map(beat => beat.emotion),
      cinematicIntensity: film.cinematicEscalation.peakIntensity,
      coherenceScore: this.calculateCoherenceScore(film)
    };
  }
  
  private calculateCoherenceScore(film: VerticalSliceFilm): number {
    let score = 0.5; // Base score
    
    // Check emotional progression coherence
    const emotionalBeats = film.narrativeArc.emotionalProgression;
    let emotionalCoherence = 0;
    
    for (let i = 1; i < emotionalBeats.length; i++) {
      const timeGap = emotionalBeats[i].timeStart - emotionalBeats[i - 1].timeEnd;
      if (Math.abs(timeGap) < 0.5) {
        emotionalCoherence += 0.2;
      }
    }
    
    score += emotionalCoherence / (emotionalBeats.length - 1) * 0.3;
    
    // Check shot timing coherence
    const shotSequence = film.shotSequence;
    if (shotSequence.shots) {
      let timingCoherence = 0;
      
      for (let i = 1; i < shotSequence.shots.length; i++) {
        const timeGap = shotSequence.shots[i].startTimeSeconds - shotSequence.shots[i - 1].endTimeSeconds;
        if (Math.abs(timeGap) < 0.1) {
          timingCoherence += 0.2;
        }
      }
      
      score += timingCoherence / (shotSequence.shots.length - 1) * 0.2;
    }
    
    // Check pacing analysis
    const pacing = film.pacingAnalysis;
    if (pacing.pacingIssues && pacing.pacingIssues.length === 0) {
      score += 0.1;
    }
    
    return Math.min(Math.max(score, 0), 1);
  }
  
  private updateProgress(
    progress: number,
    stage: GenerationProgress['stage'],
    operation: string
  ): void {
    if (this.generationProgress) {
      this.generationProgress.progress = progress;
      this.generationProgress.stage = stage;
      this.generationProgress.currentOperation = operation;
      
      // Update estimated time remaining
      if (progress > 0) {
        const elapsed = Date.now() - this.generationProgress.startTime;
        const estimatedTotal = elapsed / progress;
        this.generationProgress.estimatedTimeRemaining = (estimatedTotal - elapsed) / 1000;
      }
    }
  }
  
  public getCurrentFilm(): VerticalSliceFilm | null {
    return this.currentFilm ? { ...this.currentFilm } : null;
  }
  
  public getGenerationProgress(): GenerationProgress | null {
    return this.generationProgress ? { ...this.generationProgress } : null;
  }
  
  public getFilmSummary(): string {
    if (!this.currentFilm) {
      return 'No film generated';
    }
    
    const film = this.currentFilm;
    
    return `
Film: ${film.title}
Status: ${film.status}
Duration: ${film.metadata.durationSeconds}s
Shots: ${film.metadata.shotCount}
Emotional Beats: ${film.metadata.emotionalBeats}
Transitions: ${film.metadata.transitionCount}
Pacing: ${film.metadata.pacingTempo}
Cinematic Intensity: ${(film.metadata.cinematicIntensity * 100).toFixed(0)}%
Coherence Score: ${(film.metadata.coherenceScore * 100).toFixed(0)}%
Emotional Arc: ${film.metadata.emotionalArc.join(' → ')}
  `.trim();
  }
  
  public getDetailedReport(): string {
    if (!this.currentFilm) {
      return 'No film generated';
    }
    
    const film = this.currentFilm;
    const report = [];
    
    report.push(`=== VERTICAL SLICE FILM REPORT ===`);
    report.push(`Title: ${film.title}`);
    report.push(`Prompt: ${film.prompt}`);
    report.push(`Generated: ${new Date(film.createdAt).toLocaleString()}`);
    report.push(``);
    
    report.push(`=== NARRATIVE ARC ===`);
    report.push(`Duration: ${film.narrativeArc.durationSeconds}s`);
    report.push(`Emotional Beats: ${film.narrativeArc.emotionalProgression.length}`);
    report.push(`Shots Planned: ${film.narrativeArc.shotSequence.length}`);
    report.push(``);
    
    report.push(`=== EMOTIONAL PROGRESSION ===`);
    film.narrativeArc.emotionalProgression.forEach((beat, i) => {
      report.push(`${i + 1}. ${beat.timeStart}-${beat.timeEnd}s: ${beat.emotion} (${beat.intensity}) - ${beat.description}`);
    });
    report.push(``);
    
    report.push(`=== SHOT SEQUENCE ===`);
    if (film.shotSequence.shots) {
      film.shotSequence.shots.forEach((shot, i: number) => {
        report.push(`${i + 1}. ${shot.shotType} (${shot.durationSeconds}s): ${shot.emotionalIntent} - ${shot.cameraSpecs.movement} camera`);
      });
    }
    report.push(``);
    
    report.push(`=== CINEMATIC ANALYSIS ===`);
    report.push(`Peak Intensity: ${(film.cinematicEscalation.peakIntensity * 100).toFixed(0)}% at ${film.cinematicEscalation.peakTime.toFixed(1)}s`);
    report.push(`Overall Shape: ${film.cinematicEscalation.overallShape}`);
    report.push(`Pacing Tempo: ${film.pacingAnalysis.overallTempo}`);
    report.push(`Average Shot Duration: ${film.pacingAnalysis.shotDurationProfile?.mean.toFixed(1)}s`);
    report.push(``);
    
    report.push(`=== METADATA ===`);
    report.push(`Coherence Score: ${(film.metadata.coherenceScore * 100).toFixed(0)}%`);
    report.push(`Status: ${film.status}`);
    
    return report.join('\n');
  }
  
  private createDefaultFilm(): VerticalSliceFilm {
    return {
      id: `film_${Date.now()}`,
      title: 'Default Film',
      prompt: '',
      narrativeArc: {} as NarrativeArc,
      emotionalProgression: [],
      cinematicEscalation: {
        overallShape: 'linear',
        peakTime: 0.5,
        peakIntensity: 0.7,
        resolutionSlope: 0.3
      },
      shotPlan: [],
      shotSequence: {
        id: 'default',
        shots: [],
        totalDurationSeconds: 0,
        emotionalArc: [],
        pacingProfile: {
          tempo: 'medium',
          shotDurationMean: 5,
          shotDurationStdDev: 2,
          transitionRatio: 0.1,
          silenceRatio: 0.2
        },
        continuityRules: []
      },
      transitions: [],
      pacingAnalysis: {
        overallTempo: 'medium',
        shotDurationProfile: {
          mean: 5,
          median: 5,
          stdDev: 2,
          min: 2,
          max: 10,
          distribution: 'normal'
        },
        emotionalRhythm: {
          beatFrequency: 0.5,
          intensityVariation: 0.3,
          transitionSmoothness: 0.8,
          peakAlignment: 0.7
        },
        silenceDistribution: {
          totalSilenceSeconds: 10,
          silenceRatio: 0.2,
          longestSilence: 5,
          distribution: 'dispersed',
          effectiveness: 0.6
        },
        tensionCurve: [],
        pacingIssues: [],
        recommendations: []
      },
      metadata: {
        durationSeconds: 0,
        shotCount: 0,
        emotionalBeats: 0,
        transitionCount: 0,
        pacingTempo: 'medium',
        emotionalArc: [],
        cinematicIntensity: 0.5,
        coherenceScore: 0.5
      },
      createdAt: Date.now(),
      status: 'error'
    };
  }

  public reset(): void {
    this.currentFilm = null;
    this.generationProgress = null;
  }
  
  public validateFilmCoherence(): { valid: boolean; issues: string[] } {
    if (!this.currentFilm) {
      return { valid: false, issues: ['No film generated'] };
    }
    
    const film = this.currentFilm;
    const issues: string[] = [];
    
    // Check duration consistency
    const totalShotTime = film.shotPlan.reduce((sum: number, shot) => sum + shot.durationSeconds, 0);
    const durationDiff = Math.abs(totalShotTime - film.narrativeArc.durationSeconds);
    
    if (durationDiff > 2) {
      issues.push(`Shot duration total (${totalShotTime.toFixed(1)}s) doesn't match film duration (${film.narrativeArc.durationSeconds}s)`);
    }
    
    // Check emotional beat continuity
    const emotionalBeats = film.narrativeArc.emotionalProgression;
    for (let i = 1; i < emotionalBeats.length; i++) {
      const gap = emotionalBeats[i].timeStart - emotionalBeats[i - 1].timeEnd;
      if (Math.abs(gap) > 0.5) {
        issues.push(`Emotional beat gap between ${emotionalBeats[i - 1].timeEnd}s and ${emotionalBeats[i].timeStart}s`);
      }
    }
    
    // Check pacing issues
    if (film.pacingAnalysis.pacingIssues && film.pacingAnalysis.pacingIssues.length > 0) {
      const highSeverity = film.pacingAnalysis.pacingIssues.filter((issue) => issue.severity === 'high');
      if (highSeverity.length > 0) {
        issues.push(`${highSeverity.length} high-severity pacing issues detected`);
      }
    }
    
    return {
      valid: issues.length === 0,
      issues
    };
  }
}