// Phase 8 — Task Group 8: Cinematic Memory System

export interface EmotionalMotif {
  id: string;
  emotion: string;
  intensity: number;
  recurringCount: number;
  firstSeenAt: number;
  lastSeenAt: number;
}

export interface VisualMotif {
  id: string;
  type: 'lighting' | 'atmosphere' | 'camera' | 'spacing';
  description: string;
  value: string;
  recurringCount: number;
}

export interface PacingPattern {
  averageTempo: string;
  tempoHistory: string[];
  pauseFrequencyAverage: number;
  pacingShifts: number;
}

export interface RelationshipEvolution {
  actorAId: string;
  actorBId: string;
  typeHistory: string[];
  spacingHistory: number[];
  tensionHistory: number[];
  gazePatterns: string[];
}

export interface CameraLanguageEvolution {
  modeHistory: string[];
  zoomHistory: number[];
  preferredFraming: string;
  transitionPatterns: string[];
}

export interface CinematicMemoryState {
  emotionalMotifs: EmotionalMotif[];
  visualMotifs: VisualMotif[];
  pacingPattern: PacingPattern;
  relationshipEvolutions: RelationshipEvolution[];
  cameraEvolution: CameraLanguageEvolution;
  sceneCount: number;
  totalRuntimeMs: number;
}

class CinematicMemory {
  private state: CinematicMemoryState = {
    emotionalMotifs: [],
    visualMotifs: [],
    pacingPattern: {
      averageTempo: 'medium',
      tempoHistory: [],
      pauseFrequencyAverage: 4,
      pacingShifts: 0,
    },
    relationshipEvolutions: [],
    cameraEvolution: {
      modeHistory: [],
      zoomHistory: [],
      preferredFraming: 'observe',
      transitionPatterns: [],
    },
    sceneCount: 0,
    totalRuntimeMs: 0,
  };

  recordEmotionalMoment(emotion: string, intensity: number, timestamp: number): void {
    const existing = this.state.emotionalMotifs.find((m) => m.emotion === emotion);
    if (existing) {
      existing.recurringCount += 1;
      existing.lastSeenAt = timestamp;
      existing.intensity = Math.max(existing.intensity, intensity);
    } else {
      this.state.emotionalMotifs.push({
        id: `motif_${this.state.emotionalMotifs.length + 1}`,
        emotion,
        intensity,
        recurringCount: 1,
        firstSeenAt: timestamp,
        lastSeenAt: timestamp,
      });
    }
  }

  recordVisualMotif(type: VisualMotif['type'], description: string, value: string): void {
    const existing = this.state.visualMotifs.find((m) => m.type === type && m.value === value);
    if (existing) {
      existing.recurringCount += 1;
    } else {
      this.state.visualMotifs.push({
        id: `visual_${this.state.visualMotifs.length + 1}`,
        type,
        description,
        value,
        recurringCount: 1,
      });
    }
  }

  recordPacing(tempo: string, pauseFrequency: number): void {
    this.state.pacingPattern.tempoHistory.push(tempo);
    if (this.state.pacingPattern.tempoHistory.length > 1) {
      const prev = this.state.pacingPattern.tempoHistory[this.state.pacingPattern.tempoHistory.length - 2];
      if (prev !== tempo) this.state.pacingPattern.pacingShifts += 1;
    }
    const tempoCount: Record<string, number> = {};
    for (const t of this.state.pacingPattern.tempoHistory.slice(-10)) {
      tempoCount[t] = (tempoCount[t] ?? 0) + 1;
    }
    let maxCount = 0;
    for (const [t, count] of Object.entries(tempoCount)) {
      if (count > maxCount) {
        maxCount = count;
        this.state.pacingPattern.averageTempo = t;
      }
    }
    const recentPauses = [...this.state.pacingPattern.tempoHistory.slice(-5)];
    this.state.pacingPattern.pauseFrequencyAverage = pauseFrequency;
  }

  recordRelationshipState(actorAId: string, actorBId: string, type: string, spacing: number, tension: number): void {
    let evolution = this.state.relationshipEvolutions.find(
      (r) => (r.actorAId === actorAId && r.actorBId === actorBId) || (r.actorAId === actorBId && r.actorBId === actorAId)
    );
    if (!evolution) {
      evolution = { actorAId, actorBId, typeHistory: [], spacingHistory: [], tensionHistory: [], gazePatterns: [] };
      this.state.relationshipEvolutions.push(evolution);
    }
    evolution.typeHistory.push(type);
    evolution.spacingHistory.push(spacing);
    evolution.tensionHistory.push(tension);
  }

  recordCameraState(mode: string, zoom: number, framingIntent: string): void {
    this.state.cameraEvolution.modeHistory.push(mode);
    this.state.cameraEvolution.zoomHistory.push(zoom);
    if (framingIntent) this.state.cameraEvolution.preferredFraming = framingIntent;
  }

  incrementSceneCount(): void {
    this.state.sceneCount += 1;
  }

  addRuntimeMs(ms: number): void {
    this.state.totalRuntimeMs += ms;
  }

  getRecurringEmotions(minOccurrences: number = 2): EmotionalMotif[] {
    return this.state.emotionalMotifs.filter((m) => m.recurringCount >= minOccurrences);
  }

  getRelationshipHistory(actorAId: string, actorBId: string): RelationshipEvolution | undefined {
    return this.state.relationshipEvolutions.find(
      (r) => (r.actorAId === actorAId && r.actorBId === actorBId) || (r.actorAId === actorBId && r.actorBId === actorAId)
    );
  }

  shouldPreserveSpacing(actorAId: string, actorBId: string): boolean {
    const history = this.getRelationshipHistory(actorAId, actorBId);
    if (!history || history.spacingHistory.length < 2) return false;
    const recent = history.spacingHistory.slice(-3);
    const avg = recent.reduce((sum, v) => sum + v, 0) / recent.length;
    return avg > 120;
  }

  shouldPreserveGaze(actorAId: string, actorBId: string): boolean {
    const history = this.getRelationshipHistory(actorAId, actorBId);
    if (!history) return false;
    const recentTypes = history.typeHistory.slice(-3);
    return recentTypes.includes('avoiding') || recentTypes.includes('stranger');
  }

  getState(): CinematicMemoryState {
    return structuredClone(this.state);
  }

  clear(): void {
    this.state = {
      emotionalMotifs: [],
      visualMotifs: [],
      pacingPattern: { averageTempo: 'medium', tempoHistory: [], pauseFrequencyAverage: 4, pacingShifts: 0 },
      relationshipEvolutions: [],
      cameraEvolution: { modeHistory: [], zoomHistory: [], preferredFraming: 'observe', transitionPatterns: [] },
      sceneCount: 0,
      totalRuntimeMs: 0,
    };
  }
}

export const cinematicMemory = new CinematicMemory();
