export interface DeliveryCategory {label:string;value:number;color:number}

/** This three-column example has a fixed 0–30 scale, not an arbitrary chart engine. */
export function createDeliveryData(categories:readonly DeliveryCategory[]) {
 if(categories.length!==3)throw new RangeError('Инфографика требует ровно 3 категории.');
 for(const category of categories)if(!Number.isInteger(category.value)||category.value<0||category.value>30)
  throw new RangeError('Количество доставок в каждой категории должно быть конечным целым числом от 0 до 30.');
 const total=categories.reduce((sum,category)=>sum+category.value,0);
 if(total===0)throw new RangeError('Сумма доставок должна быть больше нуля.');
 return {title:'Утренние доставки',unit:'доставки',categories:categories.map(category=>({
  label:category.label,value:category.value,sharePercent:category.value/total*100,color:category.color,
 })),total,note:'Учебные данные; не реальная статистика'};
}

/** At most one decimal place; whole percentages keep their original text. */
export const formatDeliveryShare=(value:number)=>`${Number(value.toFixed(1))}%`;

/** A tie has no single winner; the scene omits its winner annotation. */
export function findUniqueDeliveryMaximum(categories:readonly {value:number}[]) {
 const maximum=Math.max(...categories.map(category=>category.value));
 const winners=categories.flatMap((category,i)=>category.value===maximum?[i]:[]);
 return winners.length===1?winners[0]:null;
}

// Edit these three labels, values and colors. Sum and shares are calculated above.
// data-source.json preserves the original authoring input; it is not runtime data.
export const deliveryData=createDeliveryData([
 {label:'Пункт А',value:12,color:0x287f85},
 {label:'Пункт Б',value:18,color:0xd5a235},
 {label:'Пункт В',value:30,color:0xd36144},
]);
