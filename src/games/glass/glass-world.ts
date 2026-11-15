import {createGlassRoute,routePoint,routeProject,terrainHeight,type Route} from './glass-route.ts';
import {yawBasis,type Vec3} from './glass-collision.ts';
import {glassLevel,glassMovingKinds,type GlassChallenge} from './glass-levels.ts';
export type GlassProp={id:string;kind:string;x:number;z:number;bottom:number;top:number;w:number;d:number;yaw:number;s:number;lateral:number;phase:number;period?:number;axis?:string;travel?:number;color?:string;wireFrom?:Vec3;wireTo?:Vec3};
export type GlassPart={center:Vec3;basis:Vec3[];half:number[];color:string;id:string;kind:string;support?:boolean;geometry?:'box'|'cone'|'gem'|'roof'};
export type GlassGap={x:number;z:number;yaw:number;w:number;d:number;s:number;bottom:number};
export type GlassEncounter={kind:GlassChallenge;s:number;from:number;to:number;props:string[]};
export type GlassCourse={stage:number;world:number;variation:number;title:string;route:Route;sections:{from:number;to:number;motif:string;width:number}[];obstacles:GlassProp[];encounters:GlassEncounter[];gaps:GlassGap[];checkpoints:number[];finish:number;terrain:{x:number;z:number;step:number;columns:number;rows:number;heights:number[]}};
export const glassWorlds=[
 {name:'Kota Pesisir',color:'#92bca5',stone:'#d8c8ac',accent:'#f0be64',sky:'#a6d9ef',ground:'#c3c8a2',road:'#526473'},
 {name:'Rimba Sungai',color:'#2a8463',stone:'#8f9b69',accent:'#e2ac5d',sky:'#85b9ad',ground:'#467c52',road:'#ac8760'},
 {name:'Pabrik Tembaga',color:'#946e68',stone:'#66545a',accent:'#f9a448',sky:'#c9a18c',ground:'#8d7e78',road:'#394551'},
 {name:'Ngarai Merah',color:'#ba7753',stone:'#ca895b',accent:'#f7d18c',sky:'#f0c6a0',ground:'#d59869',road:'#9c634b'},
 {name:'Dok Orbital',color:'#7484be',stone:'#697c9b',accent:'#9ee4f2',sky:'#101730',ground:'#3f4e70',road:'#62799d'},
 {name:'Gletser Senja',color:'#a1c9d9',stone:'#7187b0',accent:'#eec3eb',sky:'#6e779f',ground:'#d8e7eb',road:'#a0bacd'}
];
const cache=new Map<number,GlassCourse>();
export function corridorHalfWidth(course:GlassCourse,s:number){let width=3.2;for(const e of course.encounters){const delta=Math.abs(s-e.s);if(e.kind==='roll'){const t=Math.max(0,Math.min(1,(delta-4)/5));width=Math.min(width,.675+2.525*t*t*(3-2*t));}else if(['ferry','sideFerry','lift'].includes(e.kind)){const wide=e.kind==='sideFerry'?6:5.2,t=Math.max(0,Math.min(1,(12-delta)/4));if(t>0)width=Math.max(width,3.2+(wide-3.2)*t*t*(3-2*t));}}return width;}
export function glassCourse(stage:number):GlassCourse{
 stage=Math.max(0,Math.min(59,Math.floor(stage)));if(cache.has(stage))return cache.get(stage)!;
 const level=glassLevel(stage),world=level.biome,variation=Math.floor(stage/6),route=createGlassRoute(stage),theme=glassWorlds[world];
 const encounters=level.challenges.map((kind,i)=>({kind,s:route.encounters[i],from:route.encounters[i]-10,to:route.encounters[i]+10,props:[]}));
 const course:GlassCourse={stage,world,variation,title:level.name,route,sections:[],obstacles:[],encounters,gaps:[],checkpoints:[],finish:0,terrain:{x:0,z:0,step:1,columns:0,rows:0,heights:[]}};
 for(const e of encounters)if(e.kind==='lift')for(const p of route.points){const t=Math.max(0,Math.min(1,(p.s-e.s+2)/4));p.y+=3*t*t*(3-2*t);}
 const bounds=route.bounds,step=1.5,x=Math.floor(bounds.minX/step)*step,z=Math.floor(bounds.minZ/step)*step,columns=Math.ceil((bounds.maxX-x)/step)+1,rows=Math.ceil((bounds.maxZ-z)/step)+1;
 course.terrain={x,z,step,columns,rows,heights:Array.from({length:columns*rows},(_,i)=>terrainHeight(route,x+(i%columns)*step,z+Math.floor(i/columns)*step))};
 function add(kind:string,s:number,lateral:number,w:number,d:number,h:number,color?:string){const p=routePoint(route,s,lateral),bottom=groundHeight(course,p.x,p.z);const o:GlassProp={id:`${stage}-${course.obstacles.length}`,kind,x:p.x,z:p.z,bottom,top:bottom+h,w,d,yaw:p.yaw,s,lateral,phase:stage*.71,color};course.obstacles.push(o);return o;}
 for(const [i,e] of encounters.entries()){
  const count=course.obstacles.length;
  if(['ferry','sideFerry','lift'].includes(e.kind)){
   const p=routePoint(route,e.s),axis=e.kind==='lift'?'vertical':e.kind==='sideFerry'?'side':'forward';course.gaps.push({x:p.x,z:p.z,yaw:p.yaw,w:(e.kind==='sideFerry'?14:12),d:axis==='vertical'?4:10,s:e.s,bottom:-7});
   const o=add('platform',e.s,0,axis==='side'?6.4:8.2,axis==='side'?8.2:axis==='forward'?6.4:8,.45);o.axis=axis;o.travel=axis==='vertical'?3:5;o.period=(axis==='vertical'?9:11)/level.tempo;
  }else if(e.kind==='stepping'){
   const o=add('stepping',e.s,0,6.4,3.2,.3);for(const shift of [-2.3,2.3]){const p=routePoint(route,e.s+shift);course.gaps.push({x:p.x,z:p.z,yaw:p.yaw,w:8,d:1.4,s:e.s+shift,bottom:-7});}
  }else{const o=add(({raise:'pallet',duck:'awning',jump:'hurdle',split:'splitRack',roll:'alley',ferry:'platform',sideFerry:'platform',lift:'platform'} as Record<string,string>)[e.kind]||e.kind,e.s,0,6.4,e.kind==='roll'?8:1,4,theme.accent);o.period=({hammer:7.5,axe:5.8,sweeper:6.8,crusher:6.2,traffic:7.0,logSwing:6.0,zipper:8.5} as Record<string,number>)[e.kind];if(o.period)o.period/=level.tempo;o.phase=i*1.1+stage*.31;}
  e.props=course.obstacles.slice(count).map(o=>o.id);course.sections.push({from:i?course.checkpoints[i-1]:0,to:e.s+10,motif:e.kind,width:6.4});course.checkpoints.push(e.s+10);
 }
 course.finish=course.checkpoints.at(-1)!;
 // Batas berupa parapet, tebing dan panel padat. Tidak ada daratan kosong untuk melewati rintangan.
 for(let s=-1;s<route.length+.5;s+=1.4)for(const side of [-1,1]){
  const end=Math.min(route.length+.5,s+1.4),a=routePoint(route,s,side*corridorHalfWidth(course,s)),b=routePoint(route,end,side*corridorHalfWidth(course,end)),mid=(s+end)/2,narrow=encounters.some(e=>e.kind==='roll'&&Math.abs(e.s-mid)<8.5),p=add('boundary',mid,0,.30,Math.hypot(b.x-a.x,b.z-a.z)+.12,narrow?3.6:1.65,theme.stone);p.x=(a.x+b.x)/2;p.z=(a.z+b.z)/2;p.yaw=Math.atan2(-(b.x-a.x),-(b.z-a.z));p.bottom=Math.min(groundHeight(course,a.x,a.z),groundHeight(course,b.x,b.z))-.05;p.top=Math.max(groundHeight(course,a.x,a.z),groundHeight(course,b.x,b.z))+(narrow?3.6:1.65);
 }
 add('boundary',-1,0,7,.30,1.65,theme.stone);add('boundary',route.length+.5,0,7,.30,1.65,theme.stone);
 const sceneryStart=course.obstacles.length;
 // Identitas bioma berganti setiap stage, dengan bentuk lingkungan berbeda.
 for(let s=4;s<route.length;s+=7)for(const side of [-1,1]){
  const lateral=side*(world===1?7:world===3?8.5:10),point=routePoint(route,s,lateral);if(routeProject(route,point.x,point.z).distance<5.5)continue;
  if(world===0){add('house',s,lateral,4.8,5,3.8+(Math.floor(s)%3),['#dfbe98','#9dc9c4','#c6adcc'][Math.floor(s/7)%3]);if(side===1)add('pole',s,6.5,.22,.22,5.8);}
  else if(world===1)add('tree',s,lateral,.7,.7,5+(Math.floor(s)%3));
  else if(world===2)add('factory',s,lateral,4.8,5,5+(Math.floor(s)%3),'#a67659');
  else if(world===3)add('mesa',s,lateral,4.4,5,5+(Math.floor(s)%4),'#b66f4a');
  else if(world===4)add('antenna',s,lateral,1.0,1,5.5,'#8094b5');
  else add('ice',s,lateral,3,3,4+(Math.floor(s)%3),'#b2d9e6');
 }
 if(world===0){add('car',route.length*.08,-8,1.9,4,1.5,'#c28074');add('tree',route.length*.08,8,.6,.6,4.5);add('rock',route.length*.12,8,1.3,1.2,.9);}
 // Ukuran benda ikut diperhitungkan, bukan hanya pusatnya: tebing/rumah
 // pada tikungan tidak boleh menembus parapet dan menjepit jalur yang dirancang.
 course.obstacles=course.obstacles.filter((o,i)=>{if(i<sceneryStart)return true;const near=routeProject(route,o.x,o.z),radius=Math.max(Math.hypot(o.w,o.d)/2,o.kind==='tree'?1.8:o.kind==='pole'?.9:0);return near.distance>corridorHalfWidth(course,near.s)+radius+.5;});
 cache.set(stage,course);return course;
}
export function groundHeight(course:GlassCourse,x:number,z:number){const t=course.terrain;if(t.heights.length&&(x<t.x||z<t.z||x>t.x+(t.columns-1)*t.step||z>t.z+(t.rows-1)*t.step))return -7;if(!t.heights.length)return terrainHeight(course.route,x,z);const gx=Math.max(0,Math.min(t.columns-1.000001,(x-t.x)/t.step)),gz=Math.max(0,Math.min(t.rows-1.000001,(z-t.z)/t.step)),ix=Math.floor(gx),iz=Math.floor(gz),u=gx-ix,v=gz-iz;const a=t.heights[iz*t.columns+ix],b=t.heights[iz*t.columns+ix+1],c=t.heights[(iz+1)*t.columns+ix],d=t.heights[(iz+1)*t.columns+ix+1];return u+v<=1?a+(b-a)*u+(c-a)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
export function gapContains(gap:GlassGap,x:number,z:number,margin=0){const dx=x-gap.x,dz=z-gap.z,c=Math.cos(gap.yaw),s=Math.sin(gap.yaw);return Math.abs(c*dx-s*dz)<gap.w/2+margin&&Math.abs(s*dx+c*dz)<gap.d/2+margin;}
export function staticFloorAt(course:GlassCourse,x:number,z:number){return !course.gaps.some(g=>gapContains(g,x,z));}
export function platformPose(course:GlassCourse,o:GlassProp,time:number){const wave=(1-Math.cos(time*2*Math.PI/(o.period||10)))/2,offset=(wave*2-1)*(o.travel||0),p=routePoint(course.route,o.s+(o.axis!=='vertical'?offset:0)),low=routePoint(course.route,o.s-3),high=routePoint(course.route,o.s+3),y=o.axis==='vertical'?groundHeight(course,low.x,low.z)+wave*(groundHeight(course,high.x,high.z)-groundHeight(course,low.x,low.z)):groundHeight(course,p.x,p.z)+.06;return {x:p.x,y,z:p.z,yaw:p.yaw+(o.axis==='side'?Math.PI/2:0)};}
function localPoint(o:{x:number;z:number;yaw:number},x:number,y:number,z:number){return {x:o.x+Math.cos(o.yaw)*x+Math.sin(o.yaw)*z,y,z:o.z-Math.sin(o.yaw)*x+Math.cos(o.yaw)*z};}
export function propParts(course:GlassCourse,o:GlassProp,time:number):GlassPart[]{
 const parts:GlassPart[]=[],basis=yawBasis(o.yaw),box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,axes=basis)=>parts.push({center:localPoint(o,x,y,z),basis:axes,half:[w/2,h/2,d/2],color,id:o.id,kind:o.kind});
 if(o.kind==='alley')return parts;
 if(o.kind==='pallet'){box(0,o.bottom+.875,0,4.4,1.75,1.6,['#b28b60','#6c583e','#b98757','#b16f4c','#7185a7','#adcddc'][course.world]);for(const side of [-1,1])box(side*1.8,o.bottom+.88,0,.08,1.8,1.7,'#415468');return parts;}
 if(o.kind==='awning'){box(0,o.bottom+1.14,0,6.4,.42,1.4,o.color||'#be8b68');for(const side of [-1,1])box(side*3.4,o.bottom+1.9,0,.18,3.8,.20,'#655d52');return parts;}
 if(o.kind==='hurdle'){box(0,o.bottom+.325,0,6.4,.65,.5,course.world===1?'#796044':o.color||'#c2a873');parts[0].support=true;return parts;}
 if(o.kind==='splitRack'){box(-1.9,o.bottom+1.26,0,2.6,.42,1.4,'#8d7768');box(1.375,o.bottom+.75,0,1.65,1.5,1.4,'#9f825e');for(const side of [-1,1])box(side*3.4,o.bottom+1.4,0,.18,2.8,.2,'#52636d');return parts;}
 if(o.kind==='platform'){
  const p=platformPose(course,o,time),axes=yawBasis(p.yaw),add=(u:number,y:number,v:number,w:number,h:number,d:number,color:string,support=false)=>parts.push({center:localPoint(p,u,y,v),basis:axes,half:[w/2,h/2,d/2],color,id:o.id,kind:o.kind,support});
  add(0,p.y-.225,0,o.w,.45,o.d,'#768d96',true);add(0,p.y-.34,0,o.w*.68,.5,o.d*.62,'#3b4b57');for(const side of [-1,1]){if(o.axis==='side'){add(0,p.y+.3,side*(o.d/2-.12),o.w,.6,.12,'#d4ad63');add(side*(o.w/2-.12),p.y-.04,0,.18,.06,o.d,'#dfc98c');}else{add(side*(o.w/2-.12),p.y+.3,0,.12,.6,o.d,'#d4ad63');add(0,p.y-.04,side*(o.d/2-.12),o.w,.06,.18,'#dfc98c');}}
  if(o.axis==='vertical'){const low=routePoint(course.route,o.s-2.5).y;for(const side of [-1,1])parts.push({center:localPoint(o,side*4.6,low+1.7,0),basis,half:[.1,2.6,.2],color:'#596975',id:o.id,kind:o.kind});}return parts;
 }
 if(['hammer','axe','logSwing'].includes(o.kind)){
  const pivotY=o.bottom+4.5,angle=o.kind==='hammer'?time*2*Math.PI/(o.period||7.5)+o.phase:Math.sin(time*2*Math.PI/(o.period||6)+o.phase)*(o.kind==='logSwing'?1.35:1.05),L=3.5,u={x:Math.cos(o.yaw)*Math.cos(angle),y:Math.sin(angle),z:-Math.sin(o.yaw)*Math.cos(angle)},v={x:-Math.cos(o.yaw)*Math.sin(angle),y:Math.cos(angle),z:Math.sin(o.yaw)*Math.sin(angle)},n=basis[2],axes=[u,v,n];
  const part=(along:number,w:number,h:number,d:number,color:string)=>box(along*Math.sin(angle),pivotY-along*Math.cos(angle),0,w,h,d,color,axes);
  part(L/2,.18,L,.18,'#785d45');part(L,o.kind==='logSwing'?2.8:o.kind==='axe'?1.9:1.65,o.kind==='axe'?1.25:.95,o.kind==='axe'?.25:1.1,o.kind==='axe'?'#b4c6d0':'#9c6c47');for(const side of [-1,1])box(side*3.5,o.bottom+2.25,0,.25,4.5,.3,'#52616a');box(0,pivotY,0,7.2,.25,.3,'#52616a');return parts;
 }
 if(o.kind==='stepping'){box(0,o.bottom-.12,0,6.4,.24,3.2,course.world===1?'#8b6b45':'#a4a39a');for(const side of [-1,1])box(side*2.2,(o.bottom-7)/2,0,.65,o.bottom+7,.8,'#827a68');parts.forEach(part=>part.support=true);return parts;}
 if(o.kind==='zipper'){const wave=(1-Math.cos(time*2*Math.PI/(o.period||8.5)+o.phase))/2;for(const side of [-1,1]){const y=o.bottom+.30+(side===-1?wave:1-wave)*3.4;box(side*1.6,y,0,3.1,.55,1.3,side===-1?'#b97d63':'#6e9eaa');box(side*1.6,(y+o.bottom+4.8)/2,0,.2,o.bottom+4.8-y,.2,'#879ba2');}for(const side of [-1,1])box(side*3.5,o.bottom+2.4,0,.28,4.8,.35,'#596b73');box(0,o.bottom+4.8,0,7.3,.30,.45,'#596b73');return parts;}
 if(o.kind==='sweeper'){const angle=time*2*Math.PI/(o.period||7)+o.phase,axes=yawBasis(o.yaw+angle);box(0,o.bottom+.48,0,6.0,.28,.28,'#d5a263',axes);box(0,o.bottom+.28,0,.48,.55,.48,'#536776');return parts;}
 if(o.kind==='crusher'){const wave=(1-Math.cos(time*2*Math.PI/(o.period||6)+o.phase))/2,y=o.bottom+.30+wave*3.4;box(0,y,0,6.3,.55,1.3,'#c19061');box(0,(y+o.bottom+4.8)/2,0,.24,o.bottom+4.8-y,.24,'#81979e');for(const side of [-1,1])box(side*3.5,o.bottom+2.4,0,.28,4.8,.35,'#596b73');box(0,o.bottom+4.8,0,7.3,.30,.45,'#596b73');return parts;}
 if(o.kind==='traffic'){const x=Math.sin(time*2*Math.PI/(o.period||7)+o.phase)*4.4;box(x,o.bottom+.65,0,1.8,1.3,2.5,'#b17b60');box(x,o.bottom+1.5,-.65,1.4,.5,1.1,'#87b8c6');for(const side of [-1,1])box(x+side*.9,o.bottom+.25,0,.22,.5,1.9,'#34424c');return parts;}
 if(o.kind==='car'){box(0,o.bottom+.43,0,1.9,.65,4,o.color||'#b57a72');box(0,o.bottom+1.05,.05,1.6,.75,2.15,o.color||'#b57a72');for(const side of [-1,1])for(const z of [-1.25,1.25])box(side*.94,o.bottom+.28,z,.18,.55,.7,'#28333b');return parts;}
 if(o.kind==='pole'||o.kind==='antenna'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.kind==='antenna'?'#8a9db7':'#795d44');box(0,o.top-.4,0,o.kind==='antenna'?3:1.65,.14,.25,'#8b9da4');if(o.kind==='antenna')box(0,o.top,0,1.6,.8,.18,'#a2cfe1');return parts;}
 if(o.kind==='tree'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,'#6c513d');for(const [y,r,h,color] of [[o.top-.1,1.8,3.0,'#215e4f'],[o.top+1.1,1.4,2.2,'#3b8962']] as const)parts.push({center:{x:o.x,y,z:o.z},basis,half:[r,h/2,r],color,id:o.id,kind:o.kind,geometry:'cone'});return parts;}
 if(o.kind==='house'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.color||'#d0bea6');box(0,o.top+.4,0,o.w+.35,1.1,o.d+.4,'#997062');parts[1].geometry='roof';return parts;}
 if(o.kind==='factory'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,'#9c765d');box(0,o.top+.2,0,o.w+.2,.4,o.d+.2,'#53626a');for(const side of [-1,1])box(side*1.4,o.top+1.2,0,.55,2.0,.55,'#5a6975');return parts;}
 box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.color||'#8a8e93');if(['ice','rock','mesa'].includes(o.kind))parts[0].geometry=o.kind==='mesa'?'box':'gem';return parts;
}
export function inPlatform(course:GlassCourse,o:GlassProp,time:number,x:number,z:number,margin=0){const p=platformPose(course,o,time),dx=x-p.x,dz=z-p.z,c=Math.cos(p.yaw),s=Math.sin(p.yaw);return Math.abs(c*dx-s*dz)<=o.w/2+margin&&Math.abs(s*dx+c*dz)<=o.d/2+margin;}
const staticCache=new WeakMap<GlassCourse,GlassPart[]>();
export function courseParts(course:GlassCourse,time:number){let stationary=staticCache.get(course);if(!stationary){stationary=course.obstacles.filter(o=>!glassMovingKinds.has(o.kind)).flatMap(o=>propParts(course,o,0));staticCache.set(course,stationary);}return stationary.concat(course.obstacles.filter(o=>glassMovingKinds.has(o.kind)).flatMap(o=>propParts(course,o,time)));}
