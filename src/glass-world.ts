import {createGlassRoute,routePoint,routeProject,terrainHeight,type Route} from './glass-route.ts';
import {yawBasis,type Vec3} from './glass-collision.ts';
export type GlassProp={id:string;kind:string;x:number;z:number;bottom:number;top:number;w:number;d:number;yaw:number;s:number;lateral:number;phase:number;period?:number;axis?:string;travel?:number;color?:string;wireFrom?:Vec3;wireTo?:Vec3};
export type GlassPart={center:Vec3;basis:Vec3[];half:number[];color:string;id:string;kind:string;support?:boolean;geometry?:'box'|'cone'|'gem'|'roof'};
export type GlassGap={x:number;z:number;yaw:number;w:number;d:number;s:number;bottom:number};
export type GlassCourse={stage:number;world:number;variation:number;title:string;route:Route;sections:{from:number;to:number;motif:string;width:number}[];obstacles:GlassProp[];gaps:GlassGap[];checkpoints:number[];finish:number;terrain:{x:number;z:number;step:number;columns:number;rows:number;heights:number[]}};
export const glassWorlds=[
 {name:'Kampung Kelok',color:'#9eae8c',stone:'#d2c4a8',accent:'#e9bd78'},
 {name:'Hutan Sungai',color:'#91b18a',stone:'#bbbe9b',accent:'#c8d39c'},
 {name:'Kota Bengkel',color:'#b5bba6',stone:'#c4b59e',accent:'#e2b65c'},
 {name:'Lembah Mesin',color:'#9eab93',stone:'#afa592',accent:'#d99c73'},
 {name:'Pelabuhan Asteroid',color:'#8999ba',stone:'#a6a4b6',accent:'#a9cde3'},
 {name:'Menara Orbit',color:'#9998b3',stone:'#b4abbc',accent:'#d2b4ed'}
];
const cache=new Map<number,GlassCourse>();
export function glassCourse(stage:number):GlassCourse{
 stage=Math.max(0,Math.min(59,Math.floor(stage)));if(cache.has(stage))return cache.get(stage)!;
 const world=Math.floor(stage/10),variation=stage%10,route=createGlassRoute(stage),forest=world===1||world===3,space=world>=4;
 const course:GlassCourse={stage,world,variation,title:`${glassWorlds[world].name} · ${variation+1}`,route,sections:[],obstacles:[],gaps:[],checkpoints:[.24,.49,.74,.97].map(t=>route.length*t),finish:route.length*.97,terrain:{x:0,z:0,step:2,columns:0,rows:0,heights:[]}};
 const advanced=stage>=20,axis=['forward','side','vertical'][variation%3],ferryS=route.length*.61;
 if(advanced&&axis==='vertical')for(const point of route.points){const t=Math.max(0,Math.min(1,(point.s-ferryS+2)/4));point.y+=3*t*t*(3-2*t);}
 const bounds=route.bounds,step=2,x=Math.floor(bounds.minX/step)*step,z=Math.floor(bounds.minZ/step)*step,columns=Math.ceil((bounds.maxX-x)/step)+1,rows=Math.ceil((bounds.maxZ-z)/step)+1;
 course.terrain={x,z,step,columns,rows,heights:Array.from({length:columns*rows},(_,i)=>terrainHeight(route,x+(i%columns)*step,z+Math.floor(i/columns)*step))};
 function add(kind:string,s:number,lateral:number,w:number,d:number,h:number,color?:string){const p=routePoint(route,s,lateral),bottom=groundHeight(course,p.x,p.z);const prop:GlassProp={id:`${stage}-${course.obstacles.length}`,kind,x:p.x,z:p.z,bottom,top:bottom+h,w,d,yaw:p.yaw,s,lateral,phase:stage*.71,color};course.obstacles.push(prop);return prop;}
 for(let i=0;i<4;i++)course.sections.push({from:route.length*i/4,to:route.length*(i+1)/4,motif:advanced&&i===2?'transport':advanced&&i===3?'hazards':forest?'woodland':'street',width:route.width});
 // Rintangan lingkungan berada di jalan; bukan dekorasi berbentuk aturan sudut.
 if(!forest&&!space){
  add('car',route.length*.13,-3.0,1.9,4.0,1.55,'#bd786c');add('car',route.length*.32,3.0,1.9,4.0,1.55,'#7799a7');
  for(const side of [-1,1])add('pole',route.length*.20,side*3.5,.28,.28,5.6);
  add('pole',route.length*.42,-1.4,.28,.28,5.6);add('pole',route.length*.42,2.9,.28,.28,5.6);
  add('car',route.length*.84,-3.1,1.9,4,1.55,'#baa374');
 }else{
  add(forest?'tree':'rock',route.length*.15,-2.9,forest?.65:1.4,forest?.65:1.5,forest?4:1.8);
  add(forest?'tree':'rock',route.length*.33,3.0,forest?.7:1.4,forest?.7:1.6,forest?4.3:1.9);
  add(forest?'log':'cargo',route.length*.42,-3.0,3.0,.85,.75);
  add(forest?'tree':'rock',route.length*.85,3.0,.8,.85,forest?4:1.5);
 }
 // Trotoar, tiang listrik, rumah dan hutan mengikuti tikungan yang sama.
 for(let s=3;s<route.length-4;s+=7.5)for(const side of [-1,1]){
  const lateral=side*(forest?6.4+(Math.floor(s)%3)*1.6:space?7.4:9.7+(Math.floor(s)%2)*2),p=routePoint(route,s,lateral),near=routeProject(route,p.x,p.z);
  if(near.distance<(!forest&&!space?8:5.5)||Math.abs(near.s-s)>9)continue;
  add(forest?'tree':space?'rock':'house',s,lateral,forest?.65:space?2.0:4.6,forest?.65:space?2:4.5,forest?4.5:space?2.2:3.8+(Math.floor(s)%3)*.6,['#d0bea6','#b6c2a4','#c8b2aa','#a8bec9'][Math.floor(s/7.5)%4]);
 }
 if(!forest&&!space)for(const side of [-1,1]){const p=routePoint(route,route.length*.07,side*8);if(routeProject(route,p.x,p.z).distance>6.5){add('tree',route.length*.07,side*8,.55,.55,4.3);add('rock',route.length*.10,side*8.5,1.2,1.0,.8);}}
 if(!forest&&!space)for(let s=2;s<route.length;s+=12)for(const side of [-1,1])add('pole',s,side*5.7,.22,.22,5.6);
 if(!forest&&!space){
  const poles=course.obstacles.filter(o=>o.kind==='pole'&&Math.abs(o.lateral)===5.7);
  for(const side of [-1,1]){const row=poles.filter(o=>Math.sign(o.lateral)===side).sort((a,b)=>a.s-b.s);for(let i=0;i<row.length-1;i++)for(const line of [-.5,.5]){
   const a=row[i],b=row[i+1];for(let j=0;j<4;j++){const point=(t:number)=>({x:a.x+(b.x-a.x)*t+Math.cos(a.yaw)*line,y:a.top-.2+(b.top-a.top)*t-Math.sin(t*Math.PI)*.28,z:a.z+(b.z-a.z)*t-Math.sin(a.yaw)*line}),from=point(j/4),to=point((j+1)/4);course.obstacles.push({id:`wire-${stage}-${i}-${side}-${line}-${j}`,kind:'wire',x:(from.x+to.x)/2,z:(from.z+to.z)/2,bottom:Math.min(from.y,to.y)-.015,top:Math.max(from.y,to.y)+.015,w:.03,d:Math.hypot(to.x-from.x,to.z-from.z),yaw:0,s:(a.s+b.s)/2,lateral:side*5.7,phase:0,wireFrom:from,wireTo:to});}
  }}
 }
 if(advanced){
  const p=routePoint(route,ferryS),gap:GlassGap={x:p.x,z:p.z,yaw:p.yaw,w:15,d:axis==='forward'?10:axis==='side'?6:4,s:ferryS,bottom:-7};course.gaps.push(gap);
  const platform=add('platform',ferryS,0,axis==='side'?7.4:8.2,axis==='forward'?6.4:8, .45);platform.axis=axis;platform.travel=axis==='vertical'?3:axis==='side'?4.8:5;platform.period=axis==='vertical'?9:11;
  // Pivot mempunyai penyangga nyata. Kepala/poros merupakan collider yang sama dengan model.
  const hammer=add(variation%2?'axe':'hammer',route.length*.79,0,1.7,1.15,4.7);hammer.period=variation%2?5.8:7.5;
  if(variation>=6){const second=add('axe',route.length*.89,0,1.6,.9,4.8);second.period=6.5;second.phase+=2;}
 }
 cache.set(stage,course);return course;
}
export function groundHeight(course:GlassCourse,x:number,z:number){
 const t=course.terrain;if(t.heights.length&&(x<t.x||z<t.z||x>t.x+(t.columns-1)*t.step||z>t.z+(t.rows-1)*t.step))return -7;if(!t.heights.length)return terrainHeight(course.route,x,z);
 const gx=Math.max(0,Math.min(t.columns-1.000001,(x-t.x)/t.step)),gz=Math.max(0,Math.min(t.rows-1.000001,(z-t.z)/t.step)),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz;
 const a=t.heights[iz*t.columns+ix],b=t.heights[iz*t.columns+ix+1],c=t.heights[(iz+1)*t.columns+ix],d=t.heights[(iz+1)*t.columns+ix+1];
 return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);
}
export function gapContains(gap:GlassGap,x:number,z:number,margin=0){const dx=x-gap.x,dz=z-gap.z,c=Math.cos(gap.yaw),s=Math.sin(gap.yaw);return Math.abs(c*dx-s*dz)<gap.w/2+margin&&Math.abs(s*dx+c*dz)<gap.d/2+margin;}
export function staticFloorAt(course:GlassCourse,x:number,z:number){return !course.gaps.some(g=>gapContains(g,x,z));}
export function platformPose(course:GlassCourse,o:GlassProp,time:number){
 const wave=(1-Math.cos(time*2*Math.PI/(o.period||10)))/2,offset=(wave*2-1)*(o.travel||0);
 const p=routePoint(course.route,o.s+(o.axis==='forward'?offset:0),o.axis==='side'?offset:0);
 const y=o.axis==='vertical'?routePoint(course.route,o.s-2.5).y+wave*(o.travel||3):groundHeight(course,p.x,p.z)+.06;
 return {x:p.x,y,z:p.z,yaw:p.yaw};
}
function localPoint(o:{x:number;z:number;yaw:number},x:number,y:number,z:number){return {x:o.x+Math.cos(o.yaw)*x+Math.sin(o.yaw)*z,y,z:o.z-Math.sin(o.yaw)*x+Math.cos(o.yaw)*z};}
export function propParts(course:GlassCourse,o:GlassProp,time:number):GlassPart[]{
 const parts:GlassPart[]=[],basis=yawBasis(o.yaw);
 if(o.kind==='wire'&&o.wireFrom&&o.wireTo){const a=o.wireFrom,b=o.wireTo,length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z),n={x:(b.x-a.x)/length,y:(b.y-a.y)/length,z:(b.z-a.z)/length},horizontal=Math.hypot(n.x,n.z),u={x:n.z/horizontal,y:0,z:-n.x/horizontal},v={x:n.y*u.z,y:n.z*u.x-n.x*u.z,z:-n.y*u.x};return [{center:{x:(a.x+b.x)/2,y:(a.y+b.y)/2,z:(a.z+b.z)/2},basis:[u,v,n],half:[.015,.015,length/2],color:'#34404a',id:o.id,kind:o.kind}];}

 const box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,extraBasis=basis)=>parts.push({center:localPoint(o,x,y,z),basis:extraBasis,half:[w/2,h/2,d/2],color,id:o.id,kind:o.kind});
 if(o.kind==='platform'){
  const p=platformPose(course,o,time),basis=yawBasis(p.yaw),add=(u:number,y:number,v:number,w:number,h:number,d:number,color:string,support=false)=>parts.push({center:localPoint(p,u,y,v),basis,half:[w/2,h/2,d/2],color,id:o.id,kind:o.kind,support});
  add(0,p.y-.225,0,o.w,.45,o.d,'#70858d',true);add(0,p.y-.34,0,o.w*.68,.5,o.d*.62,'#3b4b57');
  for(const side of [-1,1]){add(side*(o.w/2-.12),p.y+.3,0,.12,.6,o.d,'#b9a265');add(0,p.y-.04,side*(o.d/2-.12),o.w,.06,.18,'#dec788');}
  if(o.axis==='vertical'){const base=routePoint(course.route,o.s),low=routePoint(course.route,o.s-2.5).y;for(const side of [-1,1])parts.push({center:localPoint(base,side*4.6,low+1.7,0),basis:yawBasis(base.yaw),half:[.1,2.6,.2],color:'#596975',id:o.id,kind:o.kind});}
  return parts;
 }
 if(o.kind==='hammer'||o.kind==='axe'){
  const pivotY=o.bottom+4.6,angle=o.kind==='axe'?Math.sin(time*2*Math.PI/(o.period||6)+o.phase)*1.05:time*2*Math.PI/(o.period||7.5)+o.phase,L=3.5;
  const u={x:Math.cos(o.yaw)*Math.cos(angle),y:Math.sin(angle),z:-Math.sin(o.yaw)*Math.cos(angle)},v={x:-Math.cos(o.yaw)*Math.sin(angle),y:Math.cos(angle),z:Math.sin(o.yaw)*Math.sin(angle)},n=basis[2],rotation=[u,v,n];
  const part=(along:number,w:number,h:number,d:number,color:string,side=0)=>{const px=side*Math.cos(angle)+along*Math.sin(angle),py=pivotY+side*Math.sin(angle)-along*Math.cos(angle);box(px,py,0,w,h,d,color,rotation);};
  part(L/2,.18,L,.18,'#785d45');part(L,o.kind==='axe'?1.9:1.65,o.kind==='axe'?1.25:.95,o.kind==='axe'?.22:1.1,o.kind==='axe'?'#a7b6c1':'#996b49');
  for(const side of [-1,1])box(side*5.4,o.bottom+2.3,0,.28,4.6,.35,'#515c65');box(0,pivotY,0,11,.26,.35,'#515c65');return parts;
 }
 if(o.kind==='car'){
  box(0,o.bottom+.43,0,1.9,.65,4,o.color||'#a57b73');box(0,o.bottom+1.05,.05,1.6,.75,2.15,o.color||'#a57b73');
  for(const side of [-1,1])for(const z of [-1.25,1.25])box(side*.94,o.bottom+.28,z,.18,.55,.7,'#28333b');return parts;
 }
 if(o.kind==='pole'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,'#795d44');box(0,o.top-.4,0,1.65,.14,.18,'#795d44');return parts;}
 if(o.kind==='tree'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,'#785b3e');for(const [y,r,h,color] of [[o.top-.1,1.3,2.5,'#4d7951'],[o.top+1,.85,1.9,'#6b905e']] as const)parts.push({center:{x:o.x,y,z:o.z},basis,half:[r,h/2,r],color,id:o.id,kind:o.kind,geometry:'cone'});return parts;}
 if(o.kind==='house'){
  box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.color||'#d0bea6');box(0,o.top+.4,0,o.w+.35,1.1,o.d+.4,'#997062');parts[1].geometry='roof';return parts;
 }
 box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.kind==='log'?'#836448':o.kind==='rock'?'#7b8593':'#a29073');if(o.kind==='rock')parts[0].geometry='gem';return parts;
}
export function inPlatform(course:GlassCourse,o:GlassProp,time:number,x:number,z:number,margin=0){const p=platformPose(course,o,time),dx=x-p.x,dz=z-p.z,c=Math.cos(p.yaw),s=Math.sin(p.yaw);return Math.abs(c*dx-s*dz)<=o.w/2+margin&&Math.abs(s*dx+c*dz)<=o.d/2+margin;}

const staticCache=new WeakMap<GlassCourse,GlassPart[]>();
export function courseParts(course:GlassCourse,time:number){let stationary=staticCache.get(course);if(!stationary){stationary=course.obstacles.filter(o=>!['platform','hammer','axe'].includes(o.kind)).flatMap(o=>propParts(course,o,0));staticCache.set(course,stationary);}return stationary.concat(course.obstacles.filter(o=>['platform','hammer','axe'].includes(o.kind)).flatMap(o=>propParts(course,o,time)));}
