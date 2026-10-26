import { pinkMonkeySettings as settings } from './examples/pink-monkey/scene';
import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import { MonkeyScene } from './remotion/Scene';
function Preview() {
  const player = useRef<PlayerRef>(null);
  useEffect(() => { Object.assign(window, { curioPlayer: player.current }); }, []);
  return <Player ref={player} component={MonkeyScene} durationInFrames={settings.durationInFrames} fps={settings.fps}
    compositionWidth={settings.width} compositionHeight={settings.height} controls loop
    style={{ width: '100%', aspectRatio: '16 / 9' }} />;
}
createRoot(document.querySelector('#player')!).render(<Preview />);
