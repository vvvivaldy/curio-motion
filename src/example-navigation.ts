import {examples} from './examples/metadata';
/** Viewer navigation only; new metadata entries need no extra HTML branch. */
export function renderExampleNavigation(page:'viewer.html'|'player.html'){
 const nav=document.querySelector('nav[aria-label="Examples"]');if(!nav)return;
 nav.replaceChildren();
 for(const [key,example] of Object.entries(examples)){
  if('hidden' in example&&example.hidden)continue;
  if(nav.childNodes.length)nav.append(' · ');
  const link=document.createElement('a');link.href=`${page}?example=${key}`;link.dataset.example=key;link.textContent=example.title;nav.append(link);
 }
}
