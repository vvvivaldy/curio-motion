import { Application, Graphics, Container } from 'pixi.js';
import { pose } from './examples/pink-monkey/motion';
import { drawMonkey } from './examples/pink-monkey/illustration';
import { drawEnvironment } from './examples/pink-monkey/environment';

/** One code-drawn scene. No image assets, ticker, accumulated time or network API. */
export async function createStage(host: HTMLElement) {
  const app = new Application();
  await app.init({ width: 1280, height: 720, resolution: 1, antialias: true,
    autoStart: false, background: 0xe7e1d2, preference: 'webgl', preserveDrawingBuffer: true });
  app.stop();
  app.canvas.style.width = '100%';
  app.canvas.style.height = '100%';
  app.canvas.style.display = 'block';
  host.append(app.canvas);
  const back = new Graphics(), shadow = new Graphics(), character = new Container();
  const ink = new Graphics(), front = new Graphics();
  character.addChild(ink);
  app.stage.addChild(back, shadow, character, front);
  return {
    draw(frame: number) {
      if (!Number.isInteger(frame) || frame < 0 || frame > 287) throw Error('Frame must be an integer in 0..287');
      const q = pose(frame / 24);
      drawEnvironment(back, front, q);
      shadow.clear().ellipse(q.root[0], q.root[1] + 3, 70 * q.scale, 8).fill({ color: 0x3e4942, alpha: 0.15 });
      character.position.set(...q.root);
      character.scale.set(q.scale);
      character.rotation = 0;
      drawMonkey(ink, q);
      app.render();
      host.dataset.frame = String(frame);
      return q;
    },
    destroy() { app.destroy(true, { children: true }); },
  };
}
export type Stage = Awaited<ReturnType<typeof createStage>>;
