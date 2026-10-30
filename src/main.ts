import {scenes} from './examples/scenes';
import {exampleChoice} from './example-choice';
const scene=scenes[exampleChoice(location.search)];
const stage=await scene.createStage(document.body);
function render(frame:number){
 return {frame,pose:stage.draw(frame),graphicsOnly:true,textureAssetCount:0};
}
Object.assign(window,{demo:{render,pose:scene.pose,settings:scene.settings}});
render(0);
document.documentElement.dataset.ready='1';
