import { useEffect, useState } from 'react';
import { sceneStore } from '../store/sceneStore';

const EMPTY_SUGGESTIONS = [
  'A lonely man waits outside a hospital in the rain at night',
  'Two strangers argue on a rooftop at dusk',
  'A nervous woman sits alone in a subway station',
  'A man confronts his friend in a dark hallway',
  'A tired person sits on a park bench at night',
];

const TONE_SUGGESTIONS: Record<string, string[]> = {
  lonely: ['add rain', 'push camera farther', 'add more silence', 'make it colder', 'slow down pacing'],
  sad: ['add fog', 'make it more distant', 'add flickering light', 'push camera farther', 'slow down'],
  tense: ['escalate tension', 'add confrontation', 'push camera closer', 'speed up pacing', 'add flickering light'],
  nervous: ['add more tension', 'make him more anxious', 'add wind', 'push camera closer', 'speed up slightly'],
  awkward: ['add more silence', 'make it more uncomfortable', 'add distance between them', 'slow down pacing'],
  threatening: ['make it darker', 'push camera closer', 'escalate tension', 'add rain', 'add fog'],
  romantic: ['make it warmer', 'slow down', 'push camera closer', 'add soft light', 'make it more intimate'],
  energetic: ['speed up pacing', 'add more energy', 'make it brighter', 'add excitement'],
  neutral: ['make it lonely', 'add tension', 'make it sadder', 'add rain', 'change to rooftop'],
};

export default function PromptSuggestions({ onSelect }: { onSelect: (suggestion: string) => void }) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const interval = setInterval(() => {
      const scene = sceneStore.getScene();
      if (scene.version === 0 || scene.actors.length === 0) {
        setSuggestions(EMPTY_SUGGESTIONS.slice(0, 3));
      } else {
        const tone = scene.cinematicGrammar?.tone ?? 'neutral';
        const toneSugs = TONE_SUGGESTIONS[tone] ?? TONE_SUGGESTIONS['neutral'];
        setSuggestions(toneSugs.slice(0, 4));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  if (suggestions.length === 0) return null;

  return (
    <div className="prompt-suggestions">
      {suggestions.map((s, i) => (
        <button key={i} className="suggestion-chip" onClick={() => onSelect(s)}>
          {s}
        </button>
      ))}
    </div>
  );
}
