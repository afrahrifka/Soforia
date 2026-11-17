import {challengeExtent,encounterGap,posture} from './glass-pacing.ts';
import {glassLevel} from './glass-levels.ts';
export type RoutePoint={x:number;y:number;z:number;s:number;yaw:number};
export type Route={headings:number[];points:RoutePoint[];length:number;dockS:number;encounters:number[];checkpoints:number[];width:number;bounds:{minX:number;maxX:number;minZ:number;maxZ:number}};
// Jalur terbuka dengan persimpangan/tekukan, bukan empat loop yang diulang.
export function createGlassRoute(stage:number):Route{
 const level=glassLevel(stage),directions=level.headings,vertices=[{x:0,z:6}],resolved:number[]=[],centers:{x:number;z:number}[]=[],rests:{x:number;z:number}[]=[];
 for(const [i,segment] of level.segments.entries()){
  const from=vertices.at(-1)!,distances:number[]=[];
  let distance=challengeExtent(segment.challenges[0],i).before+(i===0?9:posture(segment.challenges[0])==='thread'?11:5);
  for(let j=0;j<segment.challenges.length;j++){if(j)distance+=encounterGap(segment.challenges[j-1],segment.challenges[j],stage,i);distances.push(distance);}
  const tail=challengeExtent(segment.challenges.at(-1)!,i).after,recovery=posture(segment.challenges.at(-1)!)==='thread'?8:3.5,rest=distance+tail+recovery,length=rest+2.7,desired=directions[i]*Math.PI/2;
  const previous=resolved.at(-1)??desired,choices=[0,.25,-.25,.5,-.5,.9,-.9,1.3,-1.3].map(d=>desired+d).concat([previous,previous+.5,previous-.5]);
  let angle=desired,best=-Infinity;
  for(const candidate of choices){if(Math.abs(Math.atan2(Math.sin(candidate-previous),Math.cos(candidate-previous)))>2.4)continue;
   let clearance=Infinity;for(let d=2.5;d<=length;d+=2.5){const x=from.x+Math.sin(candidate)*d,z=from.z-Math.cos(candidate)*d;for(let j=0;j<i-1;j++){const a=vertices[j],b=vertices[j+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz)));clearance=Math.min(clearance,Math.hypot(x-a.x-dx*t,z-a.z-dz*t));}}
   if(clearance>best){best=clearance;angle=candidate;}if(clearance>=16.5){angle=candidate;break;}
  }
  resolved.push(angle);for(const d of distances)centers.push({x:from.x+Math.sin(angle)*d,z:from.z-Math.cos(angle)*d});
  rests.push({x:from.x+Math.sin(angle)*rest,z:from.z-Math.cos(angle)*rest});vertices.push({x:from.x+Math.sin(angle)*length,z:from.z-Math.cos(angle)*length});
 }
 const raw:{x:number;y:number;z:number}[]=[],rise=[1.2,2.0,3.2,6,2.4,4.5][level.biome],corner=3;
 const addLine=(a:{x:number;z:number},b:{x:number;z:number})=>{const n=Math.max(1,Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.5));for(let i=0;i<n;i++)raw.push({x:a.x+(b.x-a.x)*i/n,z:a.z+(b.z-a.z)*i/n,y:0});};
 let start=vertices[0];for(let i=1;i<vertices.length;i++){const v=vertices[i],prior=vertices[i-1];if(i===vertices.length-1){addLine(start,v);raw.push({...v,y:0});break;}const next=vertices[i+1],priorLength=Math.hypot(prior.x-v.x,prior.z-v.z),nextLength=Math.hypot(next.x-v.x,next.z-v.z),a={x:v.x+(prior.x-v.x)/priorLength*corner,z:v.z+(prior.z-v.z)/priorLength*corner},b={x:v.x+(next.x-v.x)/nextLength*corner,z:v.z+(next.z-v.z)/nextLength*corner};addLine(start,a);for(let j=0;j<20;j++){const t=j/20;raw.push({x:(1-t)**2*a.x+2*(1-t)*t*v.x+t*t*b.x,z:(1-t)**2*a.z+2*(1-t)*t*v.z+t*t*b.z,y:0});}start=b;}
 const points:RoutePoint[]=[];let s=0;for(let i=0;i<raw.length;i++){if(i)s+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z);const a=raw[Math.max(0,i-1)],b=raw[Math.min(raw.length-1,i+1)];points.push({...raw[i],s,yaw:Math.atan2(-(b.x-a.x),-(b.z-a.z))});}
 const closest=(center:{x:number;z:number})=>points.reduce((best,p,i)=>Math.hypot(p.x-center.x,p.z-center.z)<Math.hypot(points[best].x-center.x,points[best].z-center.z)?i:best,0);
 const encounterIndices=centers.map(closest),restIndices=rests.map(closest),oldS=points.map(p=>p.s),restsS=restIndices.map(i=>oldS[i]);
 // Kelokan kecil berada di dalam rangkaian, bukan hanya di ujung koridor panjang.
 for(const p of points){const clearance=Math.min(...encounterIndices.map(v=>Math.abs(p.s-oldS[v])-10),...restsS.map(v=>Math.abs(p.s-v)-8),p.s-5,s-p.s-3),fade=Math.max(0,Math.min(1,clearance/5)),wave=Math.sin(p.s/8+stage*.7)*.35*fade;p.x+=Math.cos(p.yaw)*wave;p.z-=Math.sin(p.yaw)*wave;}
 s=0;for(let i=0;i<points.length;i++){if(i)s+=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);points[i].s=s;const a=points[Math.max(0,i-1)],b=points[Math.min(points.length-1,i+1)];points[i].yaw=Math.atan2(-(b.x-a.x),-(b.z-a.z));}
 for(const p of points){const t=p.s/s;p.y=t*rise*level.grade+Math.sin(t*Math.PI*2)*(stage%3)*.32;}
 // Dermaga jembatan putar harus setinggi dek pada kedua sisi, bukan anak tangga di lereng.
 const heights=points.map(p=>p.y);for(const [j,kind] of level.challenges.entries())if(kind==='turntable'){const center=points[encounterIndices[j]];for(const [i,p] of points.entries()){const t=Math.max(0,Math.min(1,(12-Math.abs(p.s-center.s))/5)),blend=t*t*(3-2*t);p.y=heights[i]+(heights[encounterIndices[j]]-heights[i])*blend;}}
 const encounters=encounterIndices.map(i=>points[i].s),checkpoints=restIndices.map(i=>points[i].s);
 return {headings:resolved.map(a=>a/(Math.PI/2)),points,length:s,dockS:encounters[2],encounters,checkpoints,width:6.4,bounds:{minX:Math.min(...points.map(p=>p.x))-24,maxX:Math.max(...points.map(p=>p.x))+24,minZ:Math.min(...points.map(p=>p.z))-24,maxZ:Math.max(...points.map(p=>p.z))+24}};
}
export function routePoint(route:Route,s:number,lateral=0):RoutePoint{
 if(s<0||s>route.length){const p=s<0?route.points[0]:route.points.at(-1)!,distance=s-p.s;return {...p,x:p.x-Math.sin(p.yaw)*distance+Math.cos(p.yaw)*lateral,z:p.z-Math.cos(p.yaw)*distance-Math.sin(p.yaw)*lateral,s};}
 let low=0,high=route.points.length-1;while(low+1<high){const mid=(low+high)>>1;if(route.points[mid].s<s)low=mid;else high=mid;}const a=route.points[low],b=route.points[high],t=(s-a.s)/Math.max(.00001,b.s-a.s),yaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*t;
 return {x:a.x+(b.x-a.x)*t+Math.cos(yaw)*lateral,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t-Math.sin(yaw)*lateral,s,yaw};
}
const projectionAll=new WeakMap<Route,number[]>();
const projectionIndex=new WeakMap<Route,Map<string,number[]>>();
export function routeProject(route:Route,x:number,z:number){
 let cells=projectionIndex.get(route);const size=12;if(!cells){cells=new Map();for(let i=0;i<route.points.length-1;i++){const a=route.points[i],b=route.points[i+1];for(let u=Math.floor((Math.min(a.x,b.x)-12)/size);u<=Math.floor((Math.max(a.x,b.x)+12)/size);u++)for(let v=Math.floor((Math.min(a.z,b.z)-12)/size);v<=Math.floor((Math.max(a.z,b.z)+12)/size);v++){const key=`${u},${v}`,list=cells.get(key)||[];list.push(i);cells.set(key,list);}}projectionIndex.set(route,cells);projectionAll.set(route,route.points.slice(0,-1).map((_,i)=>i));}
 const candidates=cells.get(`${Math.floor(x/size)},${Math.floor(z/size)}`)||[],all=projectionAll.get(route)!;
 return project(candidates.length?candidates:all,candidates.length>0);
 function project(indices:number[],partial:boolean){let best={s:0,lateral:0,distance:Infinity,x:route.points[0].x,z:route.points[0].z,y:route.points[0].y,yaw:0};for(const i of indices){const a=route.points[i],b=route.points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1))),px=a.x+dx*t,pz=a.z+dz*t,distance=Math.hypot(x-px,z-pz);if(distance<best.distance){const yaw=Math.atan2(-dx,-dz);best={s:a.s+(b.s-a.s)*t,lateral:(x-px)*Math.cos(yaw)-(z-pz)*Math.sin(yaw),distance,x:px,z:pz,y:a.y+(b.y-a.y)*t,yaw};}}return partial&&best.distance>12?project(all,false):best;}
}
export function terrainHeight(route:Route,x:number,z:number){const near=routeProject(route,x,z),shoulder=Math.max(0,Math.min(1,(near.distance-5)/12));return near.y+shoulder*(Math.sin(x*.16)*Math.cos(z*.11)*.45-.08);}
export function routeControls(yaw:number,x:number,y:number){return {x:Math.cos(yaw)*x+Math.sin(yaw)*y,z:-Math.sin(yaw)*x+Math.cos(yaw)*y};}
