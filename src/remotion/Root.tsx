import { pinkMonkeySettings as settings } from '../examples/pink-monkey/scene';
import { Composition, registerRoot } from 'remotion';
import { MonkeyScene } from './Scene';
registerRoot(() => <Composition id="PinkMonkey" component={MonkeyScene}
  durationInFrames={settings.durationInFrames} fps={settings.fps} width={settings.width} height={settings.height} />);
