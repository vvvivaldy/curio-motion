import { Composition, registerRoot } from 'remotion';
import {scenes} from '../examples/scenes';
registerRoot(()=><>{Object.values(scenes).map(({id,Component,settings})=><Composition key={id} id={id} component={Component} {...settings}/>)}</>);
