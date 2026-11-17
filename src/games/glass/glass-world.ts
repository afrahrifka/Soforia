import {challengeExtent,weaveOffset} from './glass-pacing.ts';
import {rng} from '../../shared/random.ts';
import {createGlassRoute,routePoint,routeProject,terrainHeight,type Route} from './glass-route.ts';
import {yawBasis,GLASS_BODY_RADIUS,WORLD_BASIS,obbOverlap,obbHullOverlap,type Vec3} from './glass-collision.ts';
import {glassLevel,glassMovingKinds,type GlassChallenge} from './glass-levels.ts';
export type GlassProp={id:string;kind:string;x:number;z:number;bottom:number;top:number;w:number;d:number;yaw:number;s:number;lateral:number;phase:number;period?:number;axis?:string;travel?:number;color?:string;wireFrom?:Vec3;wireTo?:Vec3};
export type GlassPart={center:Vec3;basis:Vec3[];half:number[];color:string;id:string;kind:string;support?:boolean;geometry?:'box'|'cone'|'gem'|'roof'};
export type GlassGap={x:number;z:number;yaw:number;w:number;d:number;s:number;bottom:number};
export type GlassEncounter={kind:GlassChallenge;group:number;s:number;from:number;to:number;props:string[]};
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
export function corridorHalfWidth(course:GlassCourse,s:number){const a=routePoint(course.route,s-7).yaw,b=routePoint(course.route,s+7).yaw,bend=Math.abs(Math.atan2(Math.sin(b-a),Math.cos(b-a))),turn=Math.min(1,bend/.7);let width=3.2+1.5*turn*turn*(3-2*turn),transport=0;for(const e of course.encounters){const delta=Math.abs(s-e.s);if(['roll','threadHop','threadBridge','threadHammer'].includes(e.kind)){const t=Math.max(0,Math.min(1,(delta-4)/5));width=Math.min(width,.675+2.525*t*t*(3-2*t));}else if(['ferry','sideFerry','lift','turntable'].includes(e.kind)){const radius=challengeExtent(e.kind,e.group).before,wide=e.kind==='sideFerry'?6:5.2,t=Math.max(0,Math.min(1,(radius+2.4-delta)/1.9));if(t>0)transport=Math.max(transport,3.2+(wide-3.2)*t*t*(3-2*t));}}for(const e of course.encounters)if(['raise','split','tiltWeave'].includes(e.kind)&&Math.abs(s-e.s)<3)width=Math.max(width,3.5);return Math.max(width,transport);}
export function glassCourse(stage:number):GlassCourse{
 stage=Math.max(0,Math.min(59,Math.floor(stage)));if(cache.has(stage))return cache.get(stage)!;
 const level=glassLevel(stage),world=level.biome,variation=Math.floor(stage/6),route=createGlassRoute(stage),theme=glassWorlds[world];
 let encounterIndex=0;const encounters=level.segments.flatMap((segment,group)=>segment.challenges.map(kind=>{const s=route.encounters[encounterIndex++];return {kind,group,s,from:s-challengeExtent(kind,group).before,to:s+challengeExtent(kind,group).after,props:[] as string[]};}));
 const course:GlassCourse={stage,world,variation,title:level.name,route,sections:[],obstacles:[],encounters,gaps:[],checkpoints:[...route.checkpoints],finish:route.checkpoints.at(-1)!,terrain:{x:0,z:0,step:1,columns:0,rows:0,heights:[]}};
 for(const e of encounters)if(e.kind==='lift')for(const p of route.points){const t=Math.max(0,Math.min(1,(p.s-e.s+2)/4));p.y+=3*t*t*(3-2*t);}
 const bounds=route.bounds,step=1.5,x=Math.floor(bounds.minX/step)*step,z=Math.floor(bounds.minZ/step)*step,columns=Math.ceil((bounds.maxX-x)/step)+1,rows=Math.ceil((bounds.maxZ-z)/step)+1;
 course.terrain={x,z,step,columns,rows,heights:Array.from({length:columns*rows},(_,i)=>terrainHeight(route,x+(i%columns)*step,z+Math.floor(i/columns)*step))};
 function add(kind:string,s:number,lateral:number,w:number,d:number,h:number,color?:string){const p=routePoint(route,s,lateral),bottom=groundHeight(course,p.x,p.z);const o:GlassProp={id:`${stage}-${course.obstacles.length}`,kind,x:p.x,z:p.z,bottom,top:bottom+h,w,d,yaw:p.yaw,s,lateral,phase:stage*.71,color};course.obstacles.push(o);return o;}
 for(const [i,e] of encounters.entries()){
  const count=course.obstacles.length;
  if(e.kind==='weave'){
   for(const shift of [-6,0,6]){const o=add('weaveFrame',e.s+shift,weaveOffset(shift,stage),6.4,1,3.6,theme.accent);o.travel=1.9;}
  }else if(e.kind==='tiltWeave'){
   for(const shift of [-4,4]){const o=add('splitRack',e.s+shift,0,6.4,1.4,4,theme.accent);if(shift>0)o.yaw+=Math.PI;}
  }else if(e.kind==='turntable'){
   const p=routePoint(route,e.s);course.gaps.push({x:p.x,z:p.z,yaw:p.yaw,w:12,d:5.4,s:e.s,bottom:-7});const o=add('platform',e.s,0,8.2,3.2,.45);o.axis='rotary';o.travel=0;o.period=13/level.tempo;o.phase=i*.8;
  }else if(e.kind==='threadHop'){
   for(const shift of e.group>=2?[-3.2,0,3.2]:[-2,2]){const o=add('hurdle',e.s+shift,0,1.5,.4,.55,theme.stone);o.travel=.5;}
  }else if(e.kind==='threadBridge'){
   const long=e.group>=2;for(const shift of long?[-3.6,0,3.6]:[0])add('stepping',e.s+shift,0,1.5,long?2.2:3.2,.3);for(const shift of long?[-5.4,-1.8,1.8,5.4]:[-2.3,2.3]){const p=routePoint(route,e.s+shift);course.gaps.push({x:p.x,z:p.z,yaw:p.yaw,w:8,d:1.4,s:e.s+shift,bottom:-7});}
  }else if(e.kind==='threadHammer'){
   const o=add('hammer',e.s,0,6.4,1,4,theme.accent);o.period=7.8/level.tempo;o.phase=i*1.1+stage*.31;
  }else if(['ferry','sideFerry','lift','turntable'].includes(e.kind)){
   const p=routePoint(route,e.s),axis=e.kind==='lift'?'vertical':e.kind==='sideFerry'?'side':'forward';course.gaps.push({x:p.x,z:p.z,yaw:p.yaw,w:(e.kind==='sideFerry'?14:12),d:axis==='vertical'?4:10,s:e.s,bottom:-7});
   const o=add('platform',e.s,0,axis==='side'?6.4:8.2,axis==='side'?8.2:axis==='forward'?6.4:8,.45);o.axis=axis;o.travel=axis==='vertical'?3:5;o.period=(axis==='vertical'?9:11)/level.tempo;
  }else if(e.kind==='stepping'){
   const o=add('stepping',e.s,0,6.4,3.2,.3);for(const shift of [-2.3,2.3]){const p=routePoint(route,e.s+shift);course.gaps.push({x:p.x,z:p.z,yaw:p.yaw,w:8,d:1.4,s:e.s+shift,bottom:-7});}
  }else{const o=add(({raise:'pallet',duck:'awning',jump:'hurdle',split:'splitRack',roll:'alley',ferry:'platform',sideFerry:'platform',lift:'platform'} as Record<string,string>)[e.kind]||e.kind,e.s,0,6.4,e.kind==='roll'?8:1,4,theme.accent);o.period=({hammer:7.5,axe:5.8,sweeper:6.8,crusher:6.2,traffic:7.0,logSwing:6.0,zipper:10.5,iris:14,scissor:12,breathing:13} as Record<string,number>)[e.kind];if(o.period)o.period/=level.tempo;o.phase=i*1.1+stage*.31;}
  if(['threadHop','threadBridge','threadHammer'].includes(e.kind))add('alley',e.s,0,6.4,8,4.8,theme.stone);
  e.props=course.obstacles.slice(count).map(o=>o.id);
 }
 for(const [i,segment] of level.segments.entries())course.sections.push({from:i?course.checkpoints[i-1]:0,to:course.checkpoints[i],motif:segment.challenges.join(' + '),width:6.4});
 // Bangunan berimpit atau massa batuan tertanam menjadi batas fisik, tanpa
 // panel boundary tersembunyi. Posisi tepi mengikuti chord belokan jalur.
 const edgeStart=course.obstacles.length;
 const random=rng(stage*7919+117),rockPalette=world===1?['#69786a','#7c826e','#858575','#607065']:world===3?['#b87a52','#cb9364','#aa6e50','#c28a63']:world===4?['#667b9b','#7a88a9','#5c7193','#8691ae']:['#a8cbdc','#b9dbe5','#8faeca','#a5bbd4'];
 for(let s=-3;s<route.length+3;){
  const stride=world===0||world===2?4.2+random()*.8:2.0+random()*.4,end=Math.min(route.length+3,s+stride);
  for(const side of [-1,1]){
   const a=routePoint(route,s,side*(corridorHalfWidth(course,s)+(corridorHalfWidth(course,s)<1?-.15:.05))),b=routePoint(route,end,side*(corridorHalfWidth(course,end)+(corridorHalfWidth(course,end)<1?-.15:.05))),mid=(s+end)/2,yaw=Math.atan2(-(b.x-a.x),-(b.z-a.z)),w=world===0||world===2?4.5+random()*2:world===1?3.4+random()*2.2:5.5+random()*1.5;
   const kind=world===0?'house':world===2?'factory':world===3?'mesa':world===4?'crystal':world===5?'ice':'rock',h=world===0?4.2+random()*5:world===2?5+random()*5:world===1?3.2+random()*3.2:7+random()*4;
   const p=add(kind,mid,0,w,Math.hypot(b.x-a.x,b.z-a.z)+.12,h,world===0?['#d5b49b','#c8a3ac','#9dbdba','#b3a1c1'][Math.floor(random()*4)]:rockPalette[Math.floor(mid*1.31)%rockPalette.length]);
   const embedded=world!==0&&world!==2;p.x=(a.x+b.x)/2+Math.cos(yaw)*side*w/2;p.z=(a.z+b.z)/2-Math.sin(yaw)*side*w/2;p.yaw=yaw;p.lateral=side*(corridorHalfWidth(course,mid)+w/2);const floor=Math.min(groundHeight(course,a.x,a.z),groundHeight(course,b.x,b.z));p.bottom=floor+(embedded?1.4-h/2:-.08);p.top=p.bottom+h;
   if(embedded){const q=add(kind,mid,0,w*1.1,stride*3,h*.9,rockPalette[(Math.floor(mid*1.31)+1)%rockPalette.length]);q.x=p.x+Math.cos(yaw)*side*2-Math.sin(yaw)*stride*.4;q.z=p.z-Math.sin(yaw)*side*2-Math.cos(yaw)*stride*.4;q.yaw=yaw;q.bottom=p.bottom;q.top=p.bottom+h*.9;}
   if(world===1){if(random()>.35){const rock=add('rock',mid+(random()-.5)*2,side*(corridorHalfWidth(course,mid)+3.8+random()*2),2+random()*2,2+random()*2,2+random()*3,theme.stone);rock.bottom-=1;rock.top-=1;}const trunk=add('tree',mid+(random()-.5)*stride,side*(corridorHalfWidth(course,mid)+2.8+random()*2),.7+random()*.6,.8,5+random()*4);if(random()>.5)trunk.color='#568958';}
   if(world===4&&random()>.55){const crystal=add('crystal',mid,side*(corridorHalfWidth(course,mid)+3.8+random()*2),1+random(),1.2,5+random()*4,['#96cfe4','#b39bd9','#8292c9'][Math.floor(random()*3)]);crystal.yaw+=random();}
  }
  s=end;
 }
 // Offset chord di siku tajam dapat memotong jalur. Geser massa tepi hingga
 // ruang pembawa sepanjang lebar jalan bebas, termasuk tinggi lompatan.
 // Mesh dan collider dipindah bersama; massa yang tak dapat ditempatkan dibuang.
 const probes:(Vec3&{yaw:number})[]=[];
 for(let s=0;s<=route.length;s+=.65){const half=corridorHalfWidth(course,s),edge=Math.max(0,half-GLASS_BODY_RADIUS-(half<1?.17:.04));for(let k=0;k<=12;k++){const p=routePoint(route,s,edge*(k/6-1));probes.push({x:p.x,y:groundHeight(course,p.x,p.z)+2.5,z:p.z,yaw:p.yaw});}}
 const removed=new Set<GlassProp>();for(const o of course.obstacles.slice(edgeStart)){const side=Math.sign(routeProject(route,o.x,o.z).lateral)||1;
  for(let n=0;n<64;n++){const parts=propParts(course,o,0),radius=Math.hypot(o.w,o.d)/2+1;
   const hit=probes.find(p=>Math.hypot(p.x-o.x,p.z-o.z)<radius&&parts.some(part=>part.geometry?obbHullOverlap(p,WORLD_BASIS,[GLASS_BODY_RADIUS,2.5,GLASS_BODY_RADIUS],part.center,part.basis,part.half,part.geometry as 'gem'):obbOverlap(p,WORLD_BASIS,[GLASS_BODY_RADIUS,2.5,GLASS_BODY_RADIUS],part.center,part.basis,part.half)));
   if(!hit)break;if(n===63){removed.add(o);break;}const direction=Math.sign((o.x-hit.x)*Math.cos(hit.yaw)-(o.z-hit.z)*Math.sin(hit.yaw))||side;o.x+=Math.cos(hit.yaw)*direction*.3;o.z-=Math.sin(hit.yaw)*direction*.3;
  }
 }
 course.obstacles=course.obstacles.filter(o=>!removed.has(o));const sceneryStart=course.obstacles.length;
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
export function platformPose(course:GlassCourse,o:GlassProp,time:number){if(o.axis==='rotary'){const phase=((time/(o.period||13)+o.phase/(Math.PI*2))%1+1)%1,t=Math.max(0,(phase-.6)/.4),rotation=t*t*(3-2*t)*Math.PI*2;return {x:o.x,y:groundHeight(course,o.x,o.z)+.06,z:o.z,yaw:o.yaw+Math.PI/2+rotation};}const wave=(1-Math.cos(time*2*Math.PI/(o.period||10)))/2,offset=(wave*2-1)*(o.travel||0),p=routePoint(course.route,o.s+(o.axis!=='vertical'?offset:0)),low=routePoint(course.route,o.s-3),high=routePoint(course.route,o.s+3),y=o.axis==='vertical'?groundHeight(course,low.x,low.z)+wave*(groundHeight(course,high.x,high.z)-groundHeight(course,low.x,low.z)):groundHeight(course,p.x,p.z)+.06;return {x:p.x,y,z:p.z,yaw:p.yaw+(o.axis==='side'?Math.PI/2:0)};}
function localPoint(o:{x:number;z:number;yaw:number},x:number,y:number,z:number){return {x:o.x+Math.cos(o.yaw)*x+Math.sin(o.yaw)*z,y,z:o.z-Math.sin(o.yaw)*x+Math.cos(o.yaw)*z};}
export function propParts(course:GlassCourse,o:GlassProp,time:number):GlassPart[]{
 const parts:GlassPart[]=[],basis=yawBasis(o.yaw),box=(x:number,y:number,z:number,w:number,h:number,d:number,color:string,axes=basis)=>parts.push({center:localPoint(o,x,y,z),basis:axes,half:[w/2,h/2,d/2],color,id:o.id,kind:o.kind});
 if(o.kind==='alley'){for(const side of [-1,1])box(side*1.53,o.bottom+2.4,0,2,4.8,8,o.color||'#7d9097');return parts;}
 if(o.kind==='weaveFrame'){
  const half=3.2,gap=(o.travel||1.3)/2,offset=o.lateral;
  for(const side of [-1,1]){const edge=side*half-offset,inner=side*gap,w=Math.abs(edge-inner);box((edge+inner)/2,o.bottom+1.8,0,w,3.6,.35,side<0?'#728d96':o.color||'#c2a17b');}
  box(0,o.bottom+2.35,0,(o.travel||1.3)+.25,.22,.45,'#d4bc86');return parts;
 }
 if(o.kind==='pallet'){box(0,o.bottom+.875,0,4.0,1.75,1.6,['#b28b60','#6c583e','#b98757','#b16f4c','#7185a7','#adcddc'][course.world]);for(const side of [-1,1])box(side*1.8,o.bottom+.88,0,.08,1.8,1.7,'#415468');return parts;}
 if(o.kind==='awning'){box(0,o.bottom+1.14,0,6.4,.42,1.4,o.color||'#be8b68');for(const side of [-1,1])box(side*3.4,o.bottom+1.9,0,.18,3.8,.20,'#655d52');return parts;}
 if(o.kind==='hurdle'){const h=o.travel||.65;box(0,o.bottom+h/2,0,o.w,h,o.d===1?.5:o.d,course.world===1?'#796044':o.color||'#c2a873');parts[0].support=true;return parts;}
 if(o.kind==='splitRack'){box(-1.9,o.bottom+1.26,0,2.6,.42,1.4,'#8d7768');box(1.375,o.bottom+.75,0,1.3,1.5,1.4,'#9f825e');for(const side of [-1,1])box(side*3.4,o.bottom+1.4,0,.18,2.8,.2,'#52636d');return parts;}
 if(o.kind==='platform'){
  const p=platformPose(course,o,time),axes=yawBasis(p.yaw),add=(u:number,y:number,v:number,w:number,h:number,d:number,color:string,support=false)=>parts.push({center:localPoint(p,u,y,v),basis:axes,half:[w/2,h/2,d/2],color,id:o.id,kind:o.kind,support});
  add(0,p.y-.225,0,o.w,.45,o.d,'#768d96',true);add(0,p.y-.34,0,o.w*.68,.5,o.d*.62,'#3b4b57');for(const side of o.axis==='rotary'?[]:[-1,1]){if(o.axis==='side'){add(0,p.y+.3,side*(o.d/2-.12),o.w,.6,.12,'#d4ad63');add(side*(o.w/2-.12),p.y-.04,0,.18,.06,o.d,'#dfc98c');}else{add(side*(o.w/2-.12),p.y+.3,0,.12,.6,o.d,'#d4ad63');add(0,p.y-.04,side*(o.d/2-.12),o.w,.06,.18,'#dfc98c');}}
  if(o.axis==='vertical'){const low=routePoint(course.route,o.s-2.5).y;for(const side of [-1,1])parts.push({center:localPoint(o,side*4.6,low+1.7,0),basis,half:[.1,2.6,.2],color:'#596975',id:o.id,kind:o.kind});}return parts;
 }
 if(['hammer','axe','logSwing'].includes(o.kind)){
  const pivotY=o.bottom+4.5,angle=o.kind==='hammer'?time*2*Math.PI/(o.period||7.5)+o.phase:Math.sin(time*2*Math.PI/(o.period||6)+o.phase)*(o.kind==='logSwing'?1.35:1.05),L=3.5,u={x:Math.cos(o.yaw)*Math.cos(angle),y:Math.sin(angle),z:-Math.sin(o.yaw)*Math.cos(angle)},v={x:-Math.cos(o.yaw)*Math.sin(angle),y:Math.cos(angle),z:Math.sin(o.yaw)*Math.sin(angle)},n=basis[2],axes=[u,v,n];
  const part=(along:number,w:number,h:number,d:number,color:string)=>box(along*Math.sin(angle),pivotY-along*Math.cos(angle),0,w,h,d,color,axes);
  part(L/2,.18,L,.18,'#785d45');part(L,o.kind==='logSwing'?2.8:o.kind==='axe'?1.9:1.65,o.kind==='axe'?1.25:.95,o.kind==='axe'?.25:1.1,o.kind==='axe'?'#b4c6d0':'#9c6c47');for(const side of [-1,1])box(side*3.5,o.bottom+2.25,0,.25,4.5,.3,'#52616a');box(0,pivotY,0,7.2,.25,.3,'#52616a');return parts;
 }
 if(o.kind==='stepping'){box(0,o.bottom-.12,0,o.w,.24,o.d,course.world===1?'#8b6b45':'#a4a39a');for(const side of [-1,1])box(side*Math.min(2.2,o.w*.3),(o.bottom-7)/2,0,.65,o.bottom+7,.8,'#827a68');parts.forEach(part=>part.support=true);return parts;}
 if(['iris','scissor','breathing'].includes(o.kind)){
  const phase=((time/(o.period||13)+o.phase/(Math.PI*2))%1+1)%1,wave=phase<.55?1:(1+Math.cos((phase-.55)/.45*Math.PI*2))/2;
  if(o.kind==='breathing'){
   for(const side of [-1,1]){const x=side*(.65+wave*3.6);box(x,o.bottom+1.8,0,1.5,3.6,1.8,side===-1?'#789d9d':'#bb8a83');box(side*4.8,o.bottom+2.2,0,.35,4.4,2.1,'#526b73');}return parts;
  }
  if(o.kind==='scissor'){
   for(const side of [-1,1]){const angle=wave*Math.PI/2,a=-side*angle,axes=[{x:Math.cos(o.yaw)*Math.cos(a),y:Math.sin(a),z:-Math.sin(o.yaw)*Math.cos(a)},{x:-Math.cos(o.yaw)*Math.sin(a),y:Math.cos(a),z:Math.sin(o.yaw)*Math.sin(a)},basis[2]];
    box(side*(3.2-1.8*Math.cos(angle)),o.bottom+.8+1.8*Math.sin(angle),0,3.6,.24,.65,side===-1?'#dcaf7a':'#83b3b8',axes);box(side*3.4,o.bottom+.7,0,.32,1.4,1,'#506975');}
   return parts;
  }
  for(let n=0;n<8;n++){const a=n*Math.PI/4,r=.15+wave*4.2,axes=[{x:Math.cos(o.yaw)*Math.cos(a),y:Math.sin(a),z:-Math.sin(o.yaw)*Math.cos(a)},{x:-Math.cos(o.yaw)*Math.sin(a),y:Math.cos(a),z:Math.sin(o.yaw)*Math.sin(a)},basis[2]];
   box(Math.cos(a)*r,o.bottom+1.8+Math.sin(a)*r,0,1.35,.6,.45,n%2?'#b58a99':'#85bfc0',axes);parts.at(-1)!.geometry='gem';}
  return parts;
 }
 if(o.kind==='zipper'){const raw=(1-Math.cos(time*2*Math.PI/(o.period||10.5)+o.phase))/2,t=Math.max(0,Math.min(1,(raw-.15)/.7)),wave=t*t*(3-2*t);for(const side of [-1,1]){const y=o.bottom+.30+(side===-1?wave:1-wave)*3.4;box(side*1.6,y,0,3.1,.55,1.3,side===-1?'#b97d63':'#6e9eaa');box(side*1.6,(y+o.bottom+4.8)/2,0,.2,o.bottom+4.8-y,.2,'#879ba2');}for(const side of [-1,1])box(side*3.5,o.bottom+2.4,0,.28,4.8,.35,'#596b73');box(0,o.bottom+4.8,0,7.3,.30,.45,'#596b73');return parts;}
 if(o.kind==='sweeper'){const angle=time*2*Math.PI/(o.period||7)+o.phase,axes=yawBasis(o.yaw+angle);box(0,o.bottom+.48,0,6.0,.28,.28,'#d5a263',axes);box(0,o.bottom+.28,0,.48,.55,.48,'#536776');return parts;}
 if(o.kind==='crusher'){const wave=(1-Math.cos(time*2*Math.PI/(o.period||6)+o.phase))/2,y=o.bottom+.30+wave*3.4;box(0,y,0,6.3,.55,1.3,'#c19061');box(0,(y+o.bottom+4.8)/2,0,.24,o.bottom+4.8-y,.24,'#81979e');for(const side of [-1,1])box(side*3.5,o.bottom+2.4,0,.28,4.8,.35,'#596b73');box(0,o.bottom+4.8,0,7.3,.30,.45,'#596b73');return parts;}
 if(o.kind==='traffic'){const x=Math.sin(time*2*Math.PI/(o.period||7)+o.phase)*4.4;box(x,o.bottom+.65,0,1.8,1.3,2.5,'#b17b60');box(x,o.bottom+1.5,-.65,1.4,.5,1.1,'#87b8c6');for(const side of [-1,1])box(x+side*.9,o.bottom+.25,0,.22,.5,1.9,'#34424c');return parts;}
 if(o.kind==='car'){box(0,o.bottom+.43,0,1.9,.65,4,o.color||'#b57a72');box(0,o.bottom+1.05,.05,1.6,.75,2.15,o.color||'#b57a72');for(const side of [-1,1])for(const z of [-1.25,1.25])box(side*.94,o.bottom+.28,z,.18,.55,.7,'#28333b');return parts;}
 if(o.kind==='pole'||o.kind==='antenna'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.kind==='antenna'?'#8a9db7':'#795d44');box(0,o.top-.4,0,o.kind==='antenna'?3:1.65,.14,.25,'#8b9da4');if(o.kind==='antenna')box(0,o.top,0,1.6,.8,.18,'#a2cfe1');return parts;}
 if(o.kind==='tree'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,'#6c513d');for(const [y,r,h,color] of [[o.top-.1,1.8,3.0,'#215e4f'],[o.top+1.1,1.4,2.2,'#3b8962']] as const)parts.push({center:{x:o.x,y,z:o.z},basis,half:[r,h/2,r],color,id:o.id,kind:o.kind,geometry:'cone'});return parts;}
 if(o.kind==='house'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.color||'#d0bea6');box(0,o.top+.4,0,o.w+.35,1.1,o.d+.4,'#997062');parts[1].geometry='roof';return parts;}
 if(o.kind==='factory'){box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,'#9c765d');box(0,o.top+.2,0,o.w+.2,.4,o.d+.2,'#53626a');for(const side of [-1,1])box(side*1.4,o.top+1.2,0,.55,2.0,.55,'#5a6975');return parts;}
 box(0,(o.bottom+o.top)/2,0,o.w,o.top-o.bottom,o.d,o.color||'#8a8e93');if(['ice','rock','mesa','crystal'].includes(o.kind))parts[0].geometry='gem';return parts;
}
export function inPlatform(course:GlassCourse,o:GlassProp,time:number,x:number,z:number,margin=0){const p=platformPose(course,o,time),dx=x-p.x,dz=z-p.z,c=Math.cos(p.yaw),s=Math.sin(p.yaw);return Math.abs(c*dx-s*dz)<=o.w/2+margin&&Math.abs(s*dx+c*dz)<=o.d/2+margin;}
const staticCache=new WeakMap<GlassCourse,GlassPart[]>();
export function courseParts(course:GlassCourse,time:number){let stationary=staticCache.get(course);if(!stationary){stationary=course.obstacles.filter(o=>!glassMovingKinds.has(o.kind)).flatMap(o=>propParts(course,o,0));staticCache.set(course,stationary);}return stationary.concat(course.obstacles.filter(o=>glassMovingKinds.has(o.kind)).flatMap(o=>propParts(course,o,time)));}

/** Indeks spasial hanya mengurangi kandidat; bentuk collider/render tetap sama. */
const collisionIndex=new WeakMap<GlassCourse,Map<string,GlassPart[]>>();
export function localCourseParts(course:GlassCourse,time:number,positions:{x:number;z:number}[]){
 let cells=collisionIndex.get(course);const size=8;
 if(!cells){courseParts(course,0);cells=new Map();for(const part of staticCache.get(course)!){const radius=Math.hypot(part.half[0],part.half[1],part.half[2]);for(let x=Math.floor((part.center.x-radius)/size);x<=Math.floor((part.center.x+radius)/size);x++)for(let z=Math.floor((part.center.z-radius)/size);z<=Math.floor((part.center.z+radius)/size);z++){const key=`${x},${z}`,list=cells.get(key)||[];list.push(part);cells.set(key,list);}}collisionIndex.set(course,cells);}
 const selected=new Set<GlassPart>();for(const p of positions)for(let x=Math.floor((p.x-3)/size);x<=Math.floor((p.x+3)/size);x++)for(let z=Math.floor((p.z-3)/size);z<=Math.floor((p.z+3)/size);z++)for(const part of cells.get(`${x},${z}`)||[])selected.add(part);
 for(const o of course.obstacles.filter(o=>glassMovingKinds.has(o.kind)))for(const part of propParts(course,o,time))if(positions.some(p=>Math.hypot(p.x-part.center.x,p.z-part.center.z)<Math.hypot(part.half[0],part.half[1],part.half[2])+4))selected.add(part);
 return [...selected];
}
