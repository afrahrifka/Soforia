import {glassLevel} from './glass-levels.ts';
export type RoutePoint={x:number;y:number;z:number;s:number;yaw:number};
export type Route={points:RoutePoint[];length:number;dockS:number;encounters:number[];width:number;bounds:{minX:number;maxX:number;minZ:number;maxZ:number}};
// Jalur terbuka dengan persimpangan/tekukan, bukan empat loop yang diulang.
const turns=[[0,0,1,0,1],[0,1,0,1,0],[0,-1,0,-1,0],[0,1,1,0,0],[0,-1,-1,0,0],[0,0,-1,0,1],[0,1,0,-1,0],[0,-1,0,1,0],[0,1,2,1,0],[0,-1,2,-1,0],[0,0,0,1,1],[0,1,0,0,-1]];
export function createGlassRoute(stage:number):Route{
 const level=glassLevel(stage),directions=turns[level.route],length=28+(Math.floor(stage/12)%3)*2,vertices=[{x:0,z:6}],centers:{x:number;z:number}[]=[];
 for(let i=0;i<level.challenges.length;i++){const from=vertices.at(-1)!,angle=directions[i]*Math.PI/2,to={x:from.x+Math.sin(angle)*length,z:from.z-Math.cos(angle)*length};centers.push({x:(from.x+to.x)/2,z:(from.z+to.z)/2});vertices.push(to);}
 const raw:{x:number;y:number;z:number}[]=[],rise=[1.2,2.0,3.2,6,2.4,4.5][level.biome],corner=4;
 const addLine=(a:{x:number;z:number},b:{x:number;z:number})=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.5));for(let i=0;i<n;i++)raw.push({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n,y:0});};
 let start=vertices[0];for(let i=1;i<vertices.length;i++){const v=vertices[i],prior=vertices[i-1];if(i===vertices.length-1){addLine(start,v);raw.push({...v,y:0});break;}const next=vertices[i+1],a={x:v.x+(prior.x-v.x)/length*corner,z:v.z+(prior.z-v.z)/length*corner},b={x:v.x+(next.x-v.x)/length*corner,z:v.z+(next.z-v.z)/length*corner};addLine(start,a);for(let j=0;j<20;j++){const t=j/20;raw.push({x:(1-t)**2*a.x+2*(1-t)*t*v.x+t*t*b.x,z:(1-t)**2*a.z+2*(1-t)*t*v.z+t*t*b.z,y:0});}start=b;}
 const points:RoutePoint[]=[];let s=0;for(let i=0;i<raw.length;i++){if(i)s+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z);const a=raw[Math.max(0,i-1)],b=raw[Math.min(raw.length-1,i+1)];points.push({...raw[i],s,yaw:Math.atan2(-(b.x-a.x),-(b.z-a.z))});}for(const p of points)p.y=p.s/s*rise;
 const encounters=centers.map(center=>points.reduce((best,p)=>Math.hypot(p.x-center.x,p.z-center.z)<Math.hypot(best.x-center.x,best.z-center.z)?p:best,points[0]).s);
 return {points,length:s,dockS:encounters[2],encounters,width:6.4,bounds:{minX:Math.min(...raw.map(p=>p.x))-24,maxX:Math.max(...raw.map(p=>p.x))+24,minZ:Math.min(...raw.map(p=>p.z))-24,maxZ:Math.max(...raw.map(p=>p.z))+24}};
}
export function routePoint(route:Route,s:number,lateral=0):RoutePoint{
 if(s<0||s>route.length){const p=s<0?route.points[0]:route.points.at(-1)!,distance=s-p.s;return {...p,x:p.x-Math.sin(p.yaw)*distance+Math.cos(p.yaw)*lateral,z:p.z-Math.cos(p.yaw)*distance-Math.sin(p.yaw)*lateral,s};}
 let low=0,high=route.points.length-1;while(low+1<high){const mid=(low+high)>>1;if(route.points[mid].s<s)low=mid;else high=mid;}const a=route.points[low],b=route.points[high],t=(s-a.s)/Math.max(.00001,b.s-a.s),yaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*t;
 return {x:a.x+(b.x-a.x)*t+Math.cos(yaw)*lateral,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t-Math.sin(yaw)*lateral,s,yaw};
}
export function routeProject(route:Route,x:number,z:number){let best={s:0,lateral:0,distance:Infinity,x:route.points[0].x,z:route.points[0].z,y:route.points[0].y,yaw:0};for(let i=0;i<route.points.length-1;i++){const a=route.points[i],b=route.points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1))),px=a.x+dx*t,pz=a.z+dz*t,distance=Math.hypot(x-px,z-pz);if(distance<best.distance){const yaw=Math.atan2(-dx,-dz);best={s:a.s+(b.s-a.s)*t,lateral:(x-px)*Math.cos(yaw)-(z-pz)*Math.sin(yaw),distance,x:px,z:pz,y:a.y+(b.y-a.y)*t,yaw};}}return best;}
export function terrainHeight(route:Route,x:number,z:number){const near=routeProject(route,x,z),shoulder=Math.max(0,Math.min(1,(near.distance-5)/12));return near.y+shoulder*(Math.sin(x*.16)*Math.cos(z*.11)*.45-.08);}
export function routeControls(yaw:number,x:number,y:number){return {x:Math.cos(yaw)*x+Math.sin(yaw)*y,z:-Math.sin(yaw)*x+Math.cos(yaw)*y};}
