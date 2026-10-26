import { pinkMonkeySettings as settings } from '../examples/pink-monkey/scene';
import { useEffect, useMemo, useRef } from 'react';
import { AbsoluteFill, cancelRender, continueRender, delayRender, useCurrentFrame } from 'remotion';
import { createStage, type Stage } from '../stage';

/** Remotion owns time. Pixi only draws this exact frame into its native canvas. */
export function MonkeyScene() {
  const frame = useCurrentFrame();
  const host = useRef<HTMLDivElement>(null);
  const stage = useRef<Promise<Stage> | null>(null);
  const handle = useMemo(() => delayRender(`Pixi frame ${frame}`), [frame]);
  useEffect(() => {
    stage.current = createStage(host.current!);
    const pending = stage.current;
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
  return <AbsoluteFill style={{ backgroundColor: '#e7e1d2' }}>
    <div ref={host} data-testid="code-scene" style={{ width: settings.width, height: settings.height }} />
  </AbsoluteFill>;
}
