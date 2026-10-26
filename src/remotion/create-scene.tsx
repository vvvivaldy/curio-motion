import { useEffect, useMemo, useRef } from 'react';
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { createPixiStage, type SceneDefinition } from '../core/stage';

/** One bridge for any typed code scene. Remotion owns time, dimensions and export. */
export function createRemotionScene<Pose, Drawing>(scene: SceneDefinition<Pose, Drawing>) {
  const { settings } = scene;
  return function CodeScene() {
    const frame = useCurrentFrame();
    const host = useRef<HTMLDivElement>(null);
    const stage = useRef<ReturnType<typeof createPixiStage<Pose, Drawing>> | null>(null);
    const handle = useMemo(() => delayRender(`Pixi frame ${frame}`), [frame]);
    useEffect(() => {
      const pending = createPixiStage(host.current!, scene);
      stage.current = pending;
      return () => { void pending.then(instance => instance.destroy()).catch(() => {}); };
    }, []);
    useEffect(() => {
      let current = true;
      void stage.current!.then(instance => {
        if (current) instance.draw(frame);
        continueRender(handle);
      }).catch(error => cancelRender(error));
      return () => { current = false; continueRender(handle); };
    }, [frame, handle]);
    return <AbsoluteFill style={{ backgroundColor: `#${settings.background.toString(16).padStart(6, '0')}` }}>
      <div ref={host} data-testid="code-scene" style={{ width: settings.width, height: settings.height }} />
    </AbsoluteFill>;
  };
}
