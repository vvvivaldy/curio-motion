import catMotion from './examples/black-cat-chair/motion.ts?raw';
import catDesign from './examples/black-cat-chair/design.ts?raw';
import catScene from './examples/black-cat-chair/scene.ts?raw';
import catLayout from './examples/black-cat-chair/layout.ts?raw';
import { exampleChoice } from './example-choice';
import { examples } from './examples/metadata';
import monkeyMotion from './examples/pink-monkey/motion.ts?raw';
import monkeyArt from './examples/pink-monkey/illustration.ts?raw';
import monkeyEnvironment from './examples/pink-monkey/environment.ts?raw';
import robotMotion from './examples/amber-robot/motion.ts?raw';
import robotArt from './examples/amber-robot/illustration.ts?raw';
const key=exampleChoice(location.search),example=examples[key];
const sources={
 'pink-monkey':{motion:monkeyMotion,art:monkeyArt,environment:monkeyEnvironment},
 'amber-robot':{motion:robotMotion,art:robotArt,environment:'Garden and bench are authored in illustration.ts. The bench, handle and spout share pose contact geometry.'},
 'black-cat-chair':{motion:catMotion,art:catDesign+'\n\n'+catScene,environment:catLayout+'\n\n'+catScene},
}[key];
const video=document.querySelector<HTMLVideoElement>('#v')!,seek=document.querySelector<HTMLInputElement>('#seek')!,counter=document.querySelector('#f')!;
const last=example.settings.durationInFrames-1;
video.src=example.film;video.style.aspectRatio=`${example.settings.width} / ${example.settings.height}`;
seek.max=String(last);counter.textContent=`0 / ${last}`;
document.querySelector('#example-title')!.textContent=example.title;
document.querySelector('#description')!.textContent=example.description;
document.querySelector('#format')!.textContent=`${example.settings.durationInFrames/example.settings.fps} seconds · ${example.settings.width}×${example.settings.height} · ${example.settings.fps} fps · silent.`;
const reference=document.querySelector<HTMLImageElement>('#reference')!;
if(example.reference){reference.src=example.reference;reference.hidden=false;}
else{
 reference.hidden=true;
 reference.removeAttribute('src');
 document.querySelector('#reference-note')!.textContent='The whole reference photograph is private and is not included. This vector example runs without it.';
}
document.querySelector<HTMLAnchorElement>('#download')!.href=example.film;
for(const id of ['player-link','direct-link'])document.querySelector<HTMLAnchorElement>(`#${id}`)!.search=`?example=${key}`;
for(const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-example]')))if(link.dataset.example===key)link.setAttribute('aria-current','page');
document.querySelector('#motion')!.textContent=sources.motion;
document.querySelector('#art')!.textContent=sources.art;
document.querySelector('#environment')!.textContent=sources.environment;
document.querySelector('#play')!.addEventListener('click',()=>void video.play());
document.querySelector('#pause')!.addEventListener('click',()=>video.pause());
document.querySelector('#replay')!.addEventListener('click',()=>{video.currentTime=0;void video.play();});
seek.addEventListener('input',()=>{video.pause();video.currentTime=+seek.value/example.settings.fps;counter.textContent=`${seek.value} / ${last}`;});
video.addEventListener('timeupdate',()=>{seek.value=String(Math.min(last,Math.floor(video.currentTime*example.settings.fps)));counter.textContent=`${seek.value} / ${last}`;});
