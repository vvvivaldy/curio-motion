import {examples} from './examples/metadata';
/** Viewer navigation only; new metadata entries need no extra HTML branch. */
export function renderExampleNavigation(page:'viewer.html'|'player.html'){
 const nav=document.querySelector<HTMLElement>('nav[aria-label="Examples"]');if(!nav)return;
 nav.replaceChildren();
 const beta=document.createElement('details');
 const summary=document.createElement('summary');summary.textContent='Бета · ранние пробы';beta.append(summary);
 for(const [key,example] of Object.entries(examples)){
  if('hidden' in example&&example.hidden)continue;
  const container:HTMLElement='beta' in example&&example.beta?beta:nav;
  if(container===nav&&nav.childNodes.length)nav.append(' · ');
  const link=document.createElement('a');link.href=`${page}?example=${key}`;link.dataset.example=key;link.textContent=example.title;container.append(link);
 }
 if(beta.childNodes.length>1)nav.append(beta);
 document.getElementById('beta-notice')?.remove();
 const selected=new URLSearchParams(location.search).get('example');
 const example=selected?examples[selected as keyof typeof examples]:undefined;
 if(example&&'beta' in example&&example.beta){
  beta.open=true;
  const notice=document.createElement('p');notice.id='beta-notice';notice.setAttribute('role','note');
  notice.textContent='Бета: историческая проба до релиза 1.0. Она сохранена для изучения механизмов и не входит в актуальную витрину качества.';
  nav.after(notice);
 }
}
