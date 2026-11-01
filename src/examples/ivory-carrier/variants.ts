import {defaultDesign,type CarrierDesign} from './motion';
// Prospective finite stress cases, not a promise of arbitrary proportions.
export const carrierVariants=[
 {key:'carrier-short',id:'CarrierShort',title:'Рост −12%',design:{...defaultDesign,heightScale:.88}},
 {key:'carrier-tall',id:'CarrierTall',title:'Рост +12%',design:{...defaultDesign,heightScale:1.12}},
 {key:'carrier-small-box',id:'CarrierSmallBox',title:'Коробка −20%',design:{...defaultDesign,boxScale:.8}},
 {key:'carrier-large-box',id:'CarrierLargeBox',title:'Коробка +20%',design:{...defaultDesign,boxScale:1.2}},
 {key:'carrier-low-table',id:'CarrierLowTable',title:'Стол 126 px',design:{...defaultDesign,tableHeight:126}},
 {key:'carrier-high-table',id:'CarrierHighTable',title:'Стол 180 px',design:{...defaultDesign,tableHeight:180}},
 {key:'carrier-short-large-high',id:'CarrierShortLargeHigh',title:'Низкий / большая / высокий',design:{heightScale:.88,boxScale:1.2,tableHeight:180}},
 {key:'carrier-tall-small-low',id:'CarrierTallSmallLow',title:'Высокий / маленькая / низкий',design:{heightScale:1.12,boxScale:.8,tableHeight:126}},
] as const satisfies readonly {key:string;id:string;title:string;design:CarrierDesign}[];
