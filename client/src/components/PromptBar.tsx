import { FormEvent, useState } from 'react';
import { interpretScene } from '../services/interpretService';
import { mutateScene } from '../services/mutateService';
import { sceneStore } from '../store/sceneStore';
import { initActorJoints } from '../runtime/initActorJoints';
import PromptSuggestions from './PromptSuggestions';

export default function PromptBar() {
  const [prompt, setPrompt] = useState('');
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
      const currentScene = sceneStore.getScene();
      const hasExistingScene = currentScene.actors.length > 0 && currentScene.version > 0;

      const directing = sceneStore.getDirectingContext();
      if (hasExistingScene) {
        const patch = await mutateScene(trimmedPrompt, currentScene, directing);
        sceneStore.applyPatch(patch, trimmedPrompt);
      } else {
        const scene = await interpretScene(trimmedPrompt, directing);
        for (const actor of scene.actors) {
          actor.joints = initActorJoints(actor.position);
        }
        sceneStore.setScene(scene);
      }
    } catch (submissionError) {
      setError(submissionError instanceof Error ? submissionError.message : 'Unable to interpret prompt');
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form className="prompt-bar" onSubmit={handleSubmit}>
      <label className="prompt-label" htmlFor="prompt-input">
        {sceneStore.getScene().version > 0 ? 'Direct the scene' : 'Describe a scene'}
      </label>
      <PromptSuggestions onSelect={(s) => setPrompt(s)} />
      <div className="prompt-row">
        <input
          id="prompt-input"
          className="prompt-input"
          value={prompt}
          onChange={(event) => setPrompt(event.target.value)}
          placeholder="A lonely man waits outside a hospital in the rain at night..."
          spellCheck={false}
        />
        <button className="prompt-button" type="submit" disabled={isLoading}>
          {isLoading ? 'Creating…' : sceneStore.getScene().version > 0 ? 'Direct' : 'Create Scene'}
        </button>
      </div>
      <p className="prompt-help">
        {sceneStore.getScene().version > 0
          ? 'Scene exists — edits will mutate the current scene.'
          : 'The first prompt creates a new scene from scratch.'}
      </p>
      {error ? <p className="prompt-error">{error}</p> : null}
    </form>
  );
}
