import {tween} from '../../core/time';
import {deliveryData} from './data';
export const chart={left:125,right:856,zero:549,pixelsPerDelivery:10,centers:[253,488,723],width:126};
export function infographicPose(t:number){
 const growth=tween(t,1.45,4.25),accent=tween(t,6.4,6.75)*(1-tween(t,7.65,8.1));
 return {t,title:tween(t,0,.7),axis:tween(t,.6,1.35),growth,totals:tween(t,4.6,5.25),accent,
 bars:deliveryData.categories.map((c,i)=>({...c,x:chart.centers[i],height:c.value*chart.pixelsPerDelivery*growth,valueShown:Math.round(c.value*growth)}))};
}
export type InfographicPose=ReturnType<typeof infographicPose>;
