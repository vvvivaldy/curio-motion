import { Application, type Container } from 'pixi.js';
import { evaluateFrame, validateTimeline, type FrameContext, type Timeline } from './time';

export interface SceneSettings extends Timeline {
  readonly width: number;
  readonly height: number;
  readonly background: number;
}

/** The example supplies its pose, display objects and drawing order. */
export interface SceneDefinition<Pose, Drawing> {
  readonly settings: SceneSettings;
  readonly pose: (time: number) => Pose;
  readonly createDrawing: (root: Container) => Drawing;
  readonly draw: (drawing: Drawing, pose: Pose, context: FrameContext) => void;
}

/** A stopped Pixi stage. Remotion or the caller supplies each integer frame. */
export async function createPixiStage<Pose, Drawing>(host: HTMLElement, scene: SceneDefinition<Pose, Drawing>) {
  const settings = { ...scene.settings };
  validateTimeline(settings);
  for (const size of [settings.width, settings.height]) {
    if (!Number.isSafeInteger(size) || size <= 0) throw new RangeError('Canvas dimensions must be positive safe integers');
  }
  const app = new Application();
  await app.init({ width: settings.width, height: settings.height, resolution: 1, antialias: true,
    autoStart: false, background: settings.background, preference: 'webgl', preserveDrawingBuffer: true });
  app.stop();
  app.canvas.style.width = '100%';
  app.canvas.style.height = '100%';
  app.canvas.style.display = 'block';
  host.append(app.canvas);
  let drawing: Drawing;
  try {
    drawing = scene.createDrawing(app.stage);
  } catch (error) {
    app.destroy(true, { children: true });
    throw error;
  }
  return {
    draw(frame: number) {
      const sample = evaluateFrame(settings, scene.pose, frame);
      scene.draw(drawing, sample.pose, sample);
      app.render();
      host.dataset.frame = String(frame);
      return sample.pose;
    },
    destroy() { app.destroy(true, { children: true }); },
  };
}
