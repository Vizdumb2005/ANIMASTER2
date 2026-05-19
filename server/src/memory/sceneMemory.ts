// Phase 7 — Task Group 5: Scene Memory System

export interface SceneMemoryEntry {
  id: string;
  prompt: string;
  timestamp: number;
  tone: string;
  environment: string;
  actorCount: number;
  emotionalPeak: number;
  effects: string[];
  keyMoments: string[];
}

export interface EmotionalMemoryState {
  dominantEmotion: string;
  emotionalHistory: Array<{ emotion: string; intensity: number; timestamp: number }>;
  sustainedTensionMs: number;
  lastPeakIntensity: number;
  cumulativeEmotionalWeight: number;
}

export interface ContinuityMemoryState {
  environmentHistory: string[];
  toneHistory: string[];
  effectHistory: string[];
  relationshipEvolution: Array<{ actorAId: string; actorBId: string; typeHistory: string[] }>;
  unresolvedTensions: string[];
  activeMotifs: string[];
}

class SceneMemory {
  private entries: SceneMemoryEntry[] = [];
  private emotionalState: EmotionalMemoryState = {
    dominantEmotion: 'neutral',
    emotionalHistory: [],
    sustainedTensionMs: 0,
    lastPeakIntensity: 0,
    cumulativeEmotionalWeight: 0
  };
  private continuityState: ContinuityMemoryState = {
    environmentHistory: [],
    toneHistory: [],
    effectHistory: [],
    relationshipEvolution: [],
    unresolvedTensions: [],
    activeMotifs: []
  };

  recordScene(entry: SceneMemoryEntry): void {
    this.entries.push(entry);

    // Update emotional memory
    this.emotionalState.emotionalHistory.push({
      emotion: entry.tone,
      intensity: entry.emotionalPeak,
      timestamp: entry.timestamp
    });
    if (entry.emotionalPeak > this.emotionalState.lastPeakIntensity) {
      this.emotionalState.lastPeakIntensity = entry.emotionalPeak;
    }
    this.emotionalState.cumulativeEmotionalWeight += entry.emotionalPeak;
    this.emotionalState.dominantEmotion = this.computeDominantEmotion();

    // Update continuity memory
    this.continuityState.environmentHistory.push(entry.environment);
    this.continuityState.toneHistory.push(entry.tone);
    for (const effect of entry.effects) {
      if (effect !== 'none' && !this.continuityState.effectHistory.includes(effect)) {
        this.continuityState.effectHistory.push(effect);
      }
    }
  }

  recordTension(durationMs: number): void {
    this.emotionalState.sustainedTensionMs += durationMs;
  }

  addUnresolvedTension(tension: string): void {
    if (!this.continuityState.unresolvedTensions.includes(tension)) {
      this.continuityState.unresolvedTensions.push(tension);
    }
  }

  resolveTension(tension: string): void {
    this.continuityState.unresolvedTensions = this.continuityState.unresolvedTensions.filter(t => t !== tension);
  }

  addMotif(motif: string): void {
    if (!this.continuityState.activeMotifs.includes(motif)) {
      this.continuityState.activeMotifs.push(motif);
    }
  }

  recordRelationshipChange(actorAId: string, actorBId: string, newType: string): void {
    const existing = this.continuityState.relationshipEvolution.find(
      r => (r.actorAId === actorAId && r.actorBId === actorBId) || (r.actorAId === actorBId && r.actorBId === actorAId)
    );
    if (existing) {
      existing.typeHistory.push(newType);
    } else {
      this.continuityState.relationshipEvolution.push({
        actorAId,
        actorBId,
        typeHistory: [newType]
      });
    }
  }

  getEntries(): SceneMemoryEntry[] {
    return [...this.entries];
  }

  getEmotionalState(): EmotionalMemoryState {
    return { ...this.emotionalState };
  }

  getContinuityState(): ContinuityMemoryState {
    return {
      ...this.continuityState,
      environmentHistory: [...this.continuityState.environmentHistory],
      toneHistory: [...this.continuityState.toneHistory],
      effectHistory: [...this.continuityState.effectHistory],
      unresolvedTensions: [...this.continuityState.unresolvedTensions],
      activeMotifs: [...this.continuityState.activeMotifs]
    };
  }

  getRecentHistory(count: number = 5): SceneMemoryEntry[] {
    return this.entries.slice(-count);
  }

  hasEmotionalPattern(emotion: string, minOccurrences: number): boolean {
    const count = this.emotionalState.emotionalHistory.filter(h => h.emotion === emotion).length;
    return count >= minOccurrences;
  }

  getSustainedTensionMs(): number {
    return this.emotionalState.sustainedTensionMs;
  }

  clear(): void {
    this.entries = [];
    this.emotionalState = {
      dominantEmotion: 'neutral',
      emotionalHistory: [],
      sustainedTensionMs: 0,
      lastPeakIntensity: 0,
      cumulativeEmotionalWeight: 0
    };
    this.continuityState = {
      environmentHistory: [],
      toneHistory: [],
      effectHistory: [],
      relationshipEvolution: [],
      unresolvedTensions: [],
      activeMotifs: []
    };
  }

  private computeDominantEmotion(): string {
    const recent = this.emotionalState.emotionalHistory.slice(-5);
    if (recent.length === 0) return 'neutral';

    const counts: Record<string, number> = {};
    for (const h of recent) {
      counts[h.emotion] = (counts[h.emotion] ?? 0) + h.intensity;
    }

    let max = 0;
    let dominant = 'neutral';
    for (const [emotion, weight] of Object.entries(counts)) {
      if (weight > max) {
        max = weight;
        dominant = emotion;
      }
    }
    return dominant;
  }
}

export const sceneMemory = new SceneMemory();
