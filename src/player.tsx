import { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { Player, type PlayerRef } from '@remotion/player';
import {scenes} from './examples/scenes';
import { exampleChoice } from './example-choice';
const {settings,Component:Scene}=scenes[exampleChoice(location.search)];
function Preview() {
  const player = useRef<PlayerRef>(null);
  useEffect(() => { Object.assign(window, { curioPlayer: player.current }); }, []);
  return <Player ref={player} component={Scene} durationInFrames={settings.durationInFrames} fps={settings.fps}
    compositionWidth={settings.width} compositionHeight={settings.height} controls loop
    style={{ width: '100%', aspectRatio: `${settings.width} / ${settings.height}` }} />;
}
createRoot(document.querySelector('#player')!).render(<Preview />);

for (const id of ['viewer-link','direct-link']) document.querySelector<HTMLAnchorElement>(`#${id}`)!.search = location.search;
