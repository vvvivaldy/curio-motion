import type {Point2,Vec3} from '../../core/spatial';
export type ViewId='A'|'B';
export interface CameraFrame{readonly yaw:number;readonly elevation:number;readonly scale:number;readonly origin:readonly [number,number]}
export type StoryView=ViewId|CameraFrame;
export const viewCamera=(view:StoryView):CameraFrame=>typeof view==='string'?cameras[view]:view;
export const cameras={A:{yaw:-.22,elevation:.30,scale:1.18,origin:[640,622] as Point2},B:{yaw:.38,elevation:.14,scale:1.18,origin:[640,615] as Point2}} as const;
/** Example-local orthographic room staging; both views project the SAME world
 * points. Y is height, Z points toward the viewer, floor is always worldY0. */
export function viewPoint([x,y,z]:Vec3,view:StoryView):Point2{
 const c=viewCamera(view),cos=Math.cos(c.yaw),sin=Math.sin(c.yaw),horizontal=x*cos+z*sin,depth=-x*sin+z*cos;
 return[c.origin[0]+horizontal*c.scale,c.origin[1]-y*c.scale+depth*c.elevation*c.scale];
}
export function viewDepth([x,_y,z]:Vec3,view:StoryView){const c=viewCamera(view);return-x*Math.sin(c.yaw)+z*Math.cos(c.yaw);}
export const room={left:-1800,right:1800,back:-210,front:1800,height:1000};
export const storyChair={left:40,right:210,back:-175,front:-55,seatY:128,topY:258,
 grips:[[150,128,-55],[40,128,-55]] as [Vec3,Vec3],
 seat:[[40,128,-175],[210,128,-175],[210,128,-55],[40,128,-55]] as Vec3[],
 legs:[{x:49,z:-165,h:252},{x:201,z:-165,h:252},{x:53,z:-65,h:120},{x:197,z:-65,h:120}]};
/** These exact boxes are consumed by the chair drawing and the contact audit.
 * Backrest deformation is the existing finite environment shear above seatY. */
export const chairParts={
 seat:{origin:[storyChair.left,118,storyChair.back] as Vec3,size:[storyChair.right-storyChair.left,10,storyChair.front-storyChair.back] as Vec3},
 backrest:{origin:[storyChair.left+5,158,storyChair.back+5] as Vec3,size:[storyChair.right-storyChair.left-10,87,12] as Vec3},
 legs:storyChair.legs.map(l=>({origin:[l.x-6,0,l.z-5] as Vec3,size:[12,l.h,10] as Vec3}))
};
export const clock={x:-285,y:330,z:room.back+2,width:86,height:164};
export const picture={x:355,y:350,z:room.back+4,width:172,height:112,frame:13};
export function boxFaces(x:number,y:number,z:number,w:number,h:number,d:number){
 const point=(a:number,b:number,c:number):Vec3=>[x+a,y+b,z+c];
 return{front:[point(0,0,d),point(w,0,d),point(w,h,d),point(0,h,d)],back:[point(0,0,0),point(w,0,0),point(w,h,0),point(0,h,0)],left:[point(0,0,0),point(0,0,d),point(0,h,d),point(0,h,0)],right:[point(w,0,d),point(w,0,0),point(w,h,0),point(w,h,d)],top:[point(0,h,0),point(w,h,0),point(w,h,d),point(0,h,d)]};
}
