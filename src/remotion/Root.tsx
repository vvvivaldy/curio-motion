import {Composition,registerRoot} from 'remotion';
import {scenes} from '../examples/scenes';
registerRoot(()=><>{Object.values(scenes).map(scene=><Composition key={scene.id} id={scene.id} component={scene.Component} {...scene.settings}/>)}</>);
