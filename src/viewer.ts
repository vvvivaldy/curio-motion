import { exampleChoice } from './example-choice';
import { examples } from './examples/metadata';
import {renderExampleNavigation} from './example-navigation';
renderExampleNavigation('viewer.html');
// Code display is optional viewer tooling, independent of the renderer registry.
const modules=import.meta.glob<string>('./examples/*/*.ts',{query:'?raw',import:'default',eager:true});
const key=exampleChoice(location.search),example=examples[key];
const sourceExample=key==='cat-picture-story-v3'?'cat-picture-story':key;
const source=(names:string[])=>names.map(name=>modules[`./examples/${sourceExample}/${name}.ts`]).find(Boolean)??'This example has no separate source file for this section.';
const sources=key==='cat-picture-story-v3'?[source(['run-v3']),source(['spatial-model']),source(['environment'])]:[source(['motion','scene']),source(['illustration','model','scene']),source(['environment','scene','illustration'])];
const video=document.querySelector<HTMLVideoElement>('#v')!,seek=document.querySelector<HTMLInputElement>('#seek')!,counter=document.querySelector('#f')!;
const last=example.settings.durationInFrames-1;
if(key==='cat-picture-story-v3')video.muted=false;
if(example.film)video.src=example.film;
else{video.hidden=true;for(const id of ['play','pause','replay','seek'])(document.getElementById(id) as HTMLButtonElement|HTMLInputElement).disabled=true;}
video.style.aspectRatio=`${example.settings.width} / ${example.settings.height}`;
seek.max=String(last);counter.textContent=`0 / ${last}`;
document.querySelector('#example-title')!.textContent=example.title;
document.querySelector('#description')!.textContent=example.description;
document.querySelector('#format')!.textContent=`${example.settings.durationInFrames/example.settings.fps} seconds · ${example.settings.width}×${example.settings.height} · ${example.settings.fps} fps · ${key==='cat-picture-story-v3'?'recorded sound':'audio' in example&&example.audio?'sound':'silent'}.`;
video.controls='audio' in example&&example.audio===true;
const refImage=document.querySelector<HTMLImageElement>('#reference')!,refVideo=document.querySelector<HTMLVideoElement>('#reference-video')!;
const wholeReference=example.reference,videoReference=wholeReference?/\.(mp4|webm|mov)$/i.test(wholeReference):false;
refImage.hidden=!wholeReference||videoReference;refVideo.hidden=!wholeReference||!videoReference;
if(!wholeReference){refImage.removeAttribute('src');refVideo.removeAttribute('src');document.querySelector('#reference-note')!.textContent='Whole authoring references remain private; this vector scene runs without them.';}
else if(videoReference){
 refVideo.src=wholeReference;
 refVideo.addEventListener('error',()=>{refVideo.hidden=true;document.querySelector('#reference-note')!.textContent='The whole user-provided video is kept locally and is not bundled. Its hash and action brief are recorded in reference/serious-boar.';});
}else refImage.src=wholeReference;
const download=document.querySelector<HTMLAnchorElement>('#download')!;download.href=example.film;download.hidden=!example.film;
for(const id of ['player-link','direct-link'])document.querySelector<HTMLAnchorElement>(`#${id}`)!.search=`?example=${key}`;
for(const link of Array.from(document.querySelectorAll<HTMLAnchorElement>('[data-example]')))if(link.dataset.example===key)link.setAttribute('aria-current','page');
document.querySelector('#motion')!.textContent=sources[0];
document.querySelector('#art')!.textContent=sources[1];
document.querySelector('#environment')!.textContent=sources[2];
document.querySelector('#play')!.addEventListener('click',()=>void video.play());
document.querySelector('#pause')!.addEventListener('click',()=>video.pause());
document.querySelector('#replay')!.addEventListener('click',()=>{video.currentTime=0;void video.play();});
seek.addEventListener('input',()=>{video.pause();video.currentTime=+seek.value/example.settings.fps;counter.textContent=`${seek.value} / ${last}`;});
video.addEventListener('timeupdate',()=>{seek.value=String(Math.min(last,Math.floor(video.currentTime*example.settings.fps)));counter.textContent=`${seek.value} / ${last}`;});
