import { useEffect, useRef } from 'react';
import { Application, Container } from 'pixi.js';
import { sceneStore } from '../store/sceneStore';
import { startTickLoop } from '../runtime/tickLoop';
import { evaluateActor } from '../runtime/actorEvaluator';
import { clearAndRedrawScene } from '../renderer/sceneRenderer';

export default function CanvasView() {
  const hostRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const host = hostRef.current;
    if (!host) {
      return;
    }

    const app = new Application();
    const backgroundLayer = new Container();
    const actorLayer = new Container();
    const uiLayer = new Container();
    let stopLoop = () => {};
    let unsubscribe = () => {};
    let disposed = false;

    const boot = async () => {
      await app.init({
        resizeTo: host,
        antialias: true,
        backgroundAlpha: 0,
        resolution: Math.max(window.devicePixelRatio || 1, 1)
      });

      if (disposed) {
        app.destroy(true);
        return;
      }

      host.replaceChildren(app.canvas);
      app.stage.addChild(backgroundLayer, actorLayer, uiLayer);

      const redraw = () => {
        clearAndRedrawScene({
          backgroundLayer,
          actorLayer,
          uiLayer,
          scene: sceneStore.getScene(),
          width: app.renderer.width,
          height: app.renderer.height
        });
      };

      unsubscribe = sceneStore.onSceneChange(redraw);
      redraw();

      stopLoop = startTickLoop((deltaMs) => {
        sceneStore.mutateScene((scene) => {
          scene.actors = scene.actors.map((actor) => evaluateActor(actor, deltaMs, scene));
        });
      });
    };

    void boot();

    return () => {
      disposed = true;
      stopLoop();
      unsubscribe();
      app.destroy(true);
    };
  }, []);

  return <div className="canvas-view" ref={hostRef} />;
}