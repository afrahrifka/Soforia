import {routePoint,routeProject} from './glass-route.ts';
import {groundHeight,courseParts,type GlassCourse,type GlassPart} from './glass-world.ts';
export type GlassCamera={x:number;y:number;z:number;targetX:number;targetY:number;targetZ:number;yaw:number;heading:number;distance:number;occluded:boolean};
function rayBox(from:{x:number;y:number;z:number},to:{x:number;y:number;z:number},part:GlassPart){
 let enter=0,exit=1;const delta={x:to.x-from.x,y:to.y-from.y,z:to.z-from.z},offset={x:from.x-part.center.x,y:from.y-part.center.y,z:from.z-part.center.z};
 for(let i=0;i<3;i++){const axis=part.basis[i],p=offset.x*axis.x+offset.y*axis.y+offset.z*axis.z,v=delta.x*axis.x+delta.y*axis.y+delta.z*axis.z,h=part.half[i]+.25;if(Math.abs(v)<1e-8){if(Math.abs(p)>h)return null;continue;}let a=(-h-p)/v,b=(h-p)/v;if(a>b)[a,b]=[b,a];enter=Math.max(enter,a);exit=Math.min(exit,b);if(enter>exit)return null;}
 return enter>0&&enter<1?enter:null;
}
export function planGlassCamera(g:any,course:GlassCourse,dt:number,cut=false):GlassCamera{
 const [a,b]=g.players,cx=(a.x+b.x)/2,cz=(a.z+b.z)/2,foot=(a.y+b.y)/2,near=routeProject(course.route,cx,cz),ahead=routePoint(course.route,near.s+6);
 const desired=near.yaw+Math.atan2(Math.sin(ahead.yaw-near.yaw),Math.cos(ahead.yaw-near.yaw))*.7,previous=g.camera as GlassCamera|undefined;
 const heading=cut||!previous?desired:previous.heading+Math.atan2(Math.sin(desired-previous.heading),Math.cos(desired-previous.heading))*(1-Math.exp(-2.8*dt));
 const separation=Math.hypot(a.x-b.x,a.z-b.z),curvature=Math.abs(Math.atan2(Math.sin(ahead.yaw-near.yaw),Math.cos(ahead.yaw-near.yaw))),distance=Math.max(9.5,Math.min(16,10+Math.max(0,separation-3.6)*1.2+curvature*2));
 const forward={x:-Math.sin(heading),z:-Math.cos(heading)},target={x:cx+forward.x*2,y:foot+1.2,z:cz+forward.z*2};
 let position={x:cx-forward.x*distance,y:foot+5.4+curvature*.9,z:cz-forward.z*distance},closest=1;
 for(const part of courseParts(course,g.elapsed||0)){if(part.kind==='wire')continue;if(Math.hypot(part.center.x-cx,part.center.z-cz)>distance+9)continue;const t=rayBox(target,position,part);if(t!==null)closest=Math.min(closest,t);}
 const occluded=closest<1;if(occluded){const t=Math.max(.38,closest-.08);position={x:target.x+(position.x-target.x)*t,y:target.y+(position.y-target.y)*t+1,z:target.z+(position.z-target.z)*t};}
 position.y=Math.max(position.y,groundHeight(course,position.x,position.z)+1.5);
 const blend=cut||!previous?1:1-Math.exp(-5.5*dt),mix=(a:number,b:number)=>a+(b-a)*blend;
 const camera:GlassCamera={x:mix(previous?.x??position.x,position.x),y:mix(previous?.y??position.y,position.y),z:mix(previous?.z??position.z,position.z),targetX:mix(previous?.targetX??target.x,target.x),targetY:mix(previous?.targetY??target.y,target.y),targetZ:mix(previous?.targetZ??target.z,target.z),yaw:0,heading,distance,occluded};
 camera.yaw=Math.atan2(-(camera.targetX-camera.x),-(camera.targetZ-camera.z));return camera;
}
