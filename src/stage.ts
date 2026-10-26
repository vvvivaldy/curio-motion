import { createPixiStage } from './core/stage';
import { pinkMonkeyScene } from './examples/pink-monkey/scene';

/** Preserve the example's existing entry point. */
export const createStage = (host: HTMLElement) => createPixiStage(host, pinkMonkeyScene);
export type Stage = Awaited<ReturnType<typeof createStage>>;
