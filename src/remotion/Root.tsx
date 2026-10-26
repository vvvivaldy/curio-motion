import { Composition, registerRoot } from 'remotion';
import { MonkeyScene } from './Scene';
registerRoot(() => <Composition id="PinkMonkey" component={MonkeyScene}
  durationInFrames={288} fps={24} width={1280} height={720} />);
