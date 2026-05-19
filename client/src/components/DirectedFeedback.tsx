// Directed Scene Feedback Display
// Shows visual feedback overlay for directing commands

import { useState, useEffect } from 'react';
import { sceneStore } from '../store/sceneStore';
import { captureSceneSnapshot, type SceneSnapshot, computeFeedback, type CinematicFeedback } from '../runtime/liveMutation/feedbackSystem';

interface FeedbackEntry {
  command: string;
  effect: string;
  feedback: CinematicFeedback;
  timestamp: number;
}

interface DirectedFeedbackProps {
  maxEntries?: number;
}

export default function DirectedFeedback({ maxEntries = 3 }: DirectedFeedbackProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [scene, setScene] = useState(sceneStore.getScene());
  const [previousSnapshot, setPreviousSnapshot] = useState<SceneSnapshot | null>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  // Subscribe to mutation events to capture feedback
  useEffect(() => {
    const handleMutation = (command: string, effect: string) => {
      const currentSnapshot = captureSceneSnapshot(scene);
      let feedback: CinematicFeedback | null = null;
      
      if (previousSnapshot) {
        feedback = computeFeedback(previousSnapshot, currentSnapshot);
      }

      const newEntry: FeedbackEntry = {
        command,
        effect,
        feedback: feedback ?? {
          emotionalShift: 0,
          pacingShift: 0,
          cinematographyShift: 0,
          atmosphereShift: 0,
          relationalShift: 0,
          overallImpact: 0,
          description: effect
        },
        timestamp: Date.now()
      };

      setEntries((prev) => [newEntry, ...prev].slice(0, maxEntries));
      setPreviousSnapshot(currentSnapshot);
    };

    // Listen for mutation events from liveMutationEngine
    window.addEventListener('scene:mutate', handleMutation as EventListener);
    return () => window.removeEventListener('scene:mutate', handleMutation as EventListener);
  }, [scene, previousSnapshot, maxEntries]);

  if (!visible || entries.length === 0) return null;

  const getShiftIndicator = (value: number): string => {
    if (value > 0.15) return '↑';
    if (value < -0.15) return '↓';
    return '→';
  };

  const getShiftPercent = (value: number): number => Math.round(Math.abs(value) * 100);

  return (
    <div className="directed-feedback">
      <div className="df-header">
        <span className="df-title">Directed Scene</span>
        <button className="df-toggle" onClick={() => setVisible(!visible)}>
          {visible ? '−' : '+'}
        </button>
      </div>

      {visible && (
        <div className="df-entries">
          {entries.map((entry, i) => (
            <div key={entry.timestamp} className="df-entry">
              <div className="df-command">&gt; {entry.command}</div>
              <div className="df-effect">{entry.effect}</div>
              
              <div className="df-indicators">
                {entry.feedback.emotionalShift !== 0 && (
                  <span className={`df-shift ${entry.feedback.emotionalShift > 0 ? 'df-up' : 'df-down'}`}>
                    Emotion {getShiftIndicator(entry.feedback.emotionalShift)} {getShiftPercent(entry.feedback.emotionalShift)}%
                  </span>
                )}
                {entry.feedback.pacingShift !== 0 && (
                  <span className={`df-shift ${entry.feedback.pacingShift > 0 ? 'df-up' : 'df-down'}`}>
                    Rhythm {getShiftIndicator(entry.feedback.pacingShift)} {getShiftPercent(entry.feedback.pacingShift)}%
                  </span>
                )}
                {entry.feedback.atmosphereShift !== 0 && (
                  <span className={`df-shift ${entry.feedback.atmosphereShift > 0 ? 'df-up' : 'df-down'}`}>
                    Atmos {getShiftIndicator(entry.feedback.atmosphereShift)} {getShiftPercent(entry.feedback.atmosphereShift)}%
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}