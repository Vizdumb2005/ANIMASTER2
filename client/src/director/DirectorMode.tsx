import { useState, useEffect, useCallback, useRef } from 'react';
import { sceneStore } from '../store/sceneStore';
import type { SceneGraph, SceneTone, ActorEmotion } from '@animaster/shared/scene';
import type { DirectorCommand } from './directorCommandParser';
import { parseDirectorCommand } from './directorCommandParser';
import { applyLiveMutation } from '../runtime/liveMutation/liveMutationEngine';

export default function DirectorMode() {
  const [open, setOpen] = useState(false);
  const [command, setCommand] = useState('');
  const [history, setHistory] = useState<Array<{ cmd: string; effect: string }>>([]);
  const [scene, setScene] = useState<SceneGraph>(sceneStore.getScene());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => sceneStore.onSceneChange(setScene), []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === '`' && e.ctrlKey) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  const executeCommand = useCallback(() => {
    const trimmed = command.trim();
    if (!trimmed) return;

    const parsed = parseDirectorCommand(trimmed, scene);
    const effect = applyLiveMutation(parsed, scene);

    setHistory((prev) => [...prev.slice(-19), { cmd: trimmed, effect }]);
    setCommand('');
  }, [command, scene]);

  if (!open) return null;

  const hasActors = scene.actors.length > 0;
  const currentTone = scene.cinematicGrammar?.tone ?? 'neutral';

  return (
    <div className="director-mode">
      <div className="director-header">
        <span className="director-title">Director Mode</span>
        <span className="director-tone">Tone: {currentTone}</span>
        <button className="director-close" onClick={() => setOpen(false)}>x</button>
      </div>

      <div className="director-suggestions">
        {hasActors && (
          <>
            <button className="director-quick" onClick={() => { setCommand('make the silence heavier'); }}>Heavier silence</button>
            <button className="director-quick" onClick={() => { setCommand('increase tension slowly'); }}>Build tension</button>
            <button className="director-quick" onClick={() => { setCommand('make the framing more intimate'); }}>Intimate framing</button>
            <button className="director-quick" onClick={() => { setCommand('push camera closer'); }}>Push in</button>
            <button className="director-quick" onClick={() => { setCommand('add uncomfortable silence'); }}>Uncomfortable silence</button>
            <button className="director-quick" onClick={() => { setCommand('create emotional distance'); }}>Emotional distance</button>
          </>
        )}
      </div>

      <div className="director-history">
        {history.map((entry, i) => (
          <div key={i} className="director-entry">
            <span className="director-cmd">&gt; {entry.cmd}</span>
            <span className="director-effect">{entry.effect}</span>
          </div>
        ))}
      </div>

      <div className="director-input-row">
        <input
          ref={inputRef}
          className="director-input"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') executeCommand(); }}
          placeholder="Direct the scene... (e.g. 'make it feel emotionally trapped')"
          spellCheck={false}
        />
        <button className="director-send" onClick={executeCommand}>Direct</button>
      </div>
    </div>
  );
}
