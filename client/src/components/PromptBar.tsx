import { FormEvent, useState } from 'react';
import { interpretScene } from '../services/interpretService';
import { sceneStore } from '../store/sceneStore';

export default function PromptBar() {
  const [prompt, setPrompt] = useState('A sad stickman walks into a room and sits.');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const trimmedPrompt = prompt.trim();
    if (!trimmedPrompt || isLoading) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const scene = await interpretScene(trimmedPrompt);
      sceneStore.setScene(scene);
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to interpret prompt');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="prompt-bar" onSubmit={handleSubmit}>
      <label className="prompt-label" htmlFor="prompt-input">
        Describe a scene
      </label>
      <div className="prompt-row">
        <input
          id="prompt-input"
          className="prompt-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="A sad stickman walks into a room and sits."
          spellCheck={false}
        />
        <button className="prompt-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Interpreting…' : 'Generate'}
        </button>
      </div>
      <p className="prompt-help">The first task uses the server to turn plain language into a SceneGraph.</p>
      {error ? <p className="prompt-error">{error}</p> : null}
    </form>
  );
}
