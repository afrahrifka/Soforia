import type {SceneKit} from '../../shared/game-contracts.ts';
import * as T from 'three';
import {scenery,houses,trees,props,plants,rocks} from './scenery.ts';
import {LEVELS,TILE,solid,arenaPoint,shutterOpen,sweeperPosition} from './levels.ts';

export function buildConsole(g:any,kit:SceneKit){
 const {world,box,shape,group,label,animate,material}=kit,d=LEVELS[g.district];
 const {model}=scenery(kit,g.district);
 const wx=(x:number)=>arenaPoint(g.district,x,0).x,wz=(y:number)=>arenaPoint(g.district,0,y).z;
 kit.camera=new T.PerspectiveCamera(38,kit.targetAspect(),.1,100);const distance=Math.max(d.rows.length*TILE,d.rows[0].length*TILE/kit.targetAspect())*1.3;kit.camera.position.set(1.5,distance*.92,distance*.78);kit.camera.lookAt(0,0,0);
 const occupied=new Set<string>();
 // Gabungkan blok bangunan tanpa melampaui sel collision miliknya.
 for(let y=1;y<d.rows.length-1;y++)for(let x=1;x<d.rows[0].length-1;x++){
  if(d.rows[y][x]!=='#'||occupied.has(`${x},${y}`))continue;
  let w=1,h=1;while(x+w<d.rows[0].length-1&&d.rows[y][x+w]==='#'&&!occupied.has(`${x+w},${y}`))w++;
  while(y+h<d.rows.length-1&&Array.from({length:w},(_,i)=>d.rows[y+h][x+i]==='#'&&!occupied.has(`${x+i},${y+h}`)).every(Boolean))h++;
  if(w>1&&h>1){for(let j=0;j<h;j++)for(let i=0;i<w;i++)occupied.add(`${x+i},${y+j}`);
   const X=wx(x+(w-1)/2),Z=wz(y+(h-1)/2);box(world,'#657776',X,.025,Z,w*TILE-.04,.05,h*TILE-.04);
   model(houses[(x+y+g.district)%houses.length],X,Z,1.65,Math.min(w,h)*TILE-.06,(x+y)%2*Math.PI);
  }
 }

 // Sel yang sama menentukan collision dan bangunan kota.
 const gates:any[]=[];const shutters:any[]=[];const needles=d.sweepers.map(o=>{const root=group(world);shape(root,'sphere','#df9d74',0,.23,0,o.radius*TILE,.23,o.radius*TILE,true);const hoop=shape(root,'ring','#e6c788',0,.18,0,o.radius*TILE,o.radius*TILE,o.radius*TILE);hoop.rotation.x=Math.PI/2;dynamicNeedles(root);return {o,root};});
 function dynamicNeedles(root:any){root.userData.releaseAsset=()=>{};}
const wheels:any[]=[];const plates:any[]=[];const dynamic=new Set<any>();
 d.rows.forEach((row,y)=>[...row].forEach((c,x)=>{const X=wx(x),Z=wz(y),hash=(x*17+y*31+g.district*13)%7;
  if(c===' ')return;
  if(c==='='||c==='V'){const root=group(world,X,0,Z);if(!solid(row[x-1]??' ')&&!solid(row[x+1]??' '))root.rotation.y=Math.PI/2;const barrier=box(root,'#aa7287',0,.35,0,.68,.7,.12);shape(root,'cylinder','#5b8593',0,.01,0,.35,.025,.35);label(root,c==='='?'PULSA':'FASE',0,.85,0,.6);dynamic.add(barrier);shutters.push({c,barrier});return;}
  if(c==='~'){
   const water=box(world,'#296f7e',X,.013,Z,.805,.035,.805);water.material=material('#296f7e');
   if(hash===0)model(plants[(x+y)%plants.length],X,Z,.18,.5,hash);
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]])if(d.rows[y+dy]?.[x+dx]&&d.rows[y+dy][x+dx]!=='~')box(world,'#9a9b8a',X+dx*.37,.015,Z+dy*.37,dx?.07:.8,.1,dy?.07:.8);
   if(hash<2){const ripple=shape(world,'ring','#6aa7a8',X,.04,Z,.17,.17,.17);ripple.rotation.x=Math.PI/2;dynamic.add(ripple);animate(ripple,(_:any,t:number)=>{ripple.scale.setScalar(.17*(1+Math.sin(t+hash)*.1));});}return;
  }
  if(c==='#'){
   if(occupied.has(`${x},${y}`))return;
   const edge=x===0||x===d.rows[0].length-1||y===0||y===d.rows.length-1;
   if(edge){box(world,'#67797a',X,.13,Z,.8,.26,.8);box(world,'#a7aa99',X,.28,Z,.81,.045,.81);if((x+y)%4===0){shape(world,'cylinder','#46565a',X,.48,Z,.055,.4,.055);shape(world,'sphere','#ffd5a0',X,.71,Z,.07,.1,.07,true);}return;}
   // Volume tinggi hanya pada sel padat; dinding rendah menjaga keterbacaan jalan.
   box(world,'#758486',X,.11,Z,.79,.22,.79);
   const nearGate=[d.rows[y-1]?.[x],d.rows[y+1]?.[x],row[x-1],row[x+1]].some(c=>c==='G'||c==='H');
   if(!nearGate&&hash<4)model(houses[(x+y*3+g.district)%houses.length],X,Z,1.1,.73,Math.PI*(hash%2),.22);
   else if(hash===5)model(props[(x+y)%props.length],X,Z,.28,.5,hash, .32);
   return;
  }
  if(c==='T'){
   shape(world,'cylinder','#637a6c',X,.04,Z,.36,.08,.36);
   model(trees[(x+y+g.district)%trees.length],X,Z,1.2,.7,hash);
   if(hash%2===0)model(rocks[hash%rocks.length],X+.22,Z+.22,.12,.2);return;
  }
  if('GHI'.includes(c)){const root=group(world,X,0,Z);if(!solid(row[x-1]??' ')&&!solid(row[x+1]??' '))root.rotation.y=Math.PI/2;for(const dx of [-.38,.38]){box(root,'#d2b486',dx,.7,0,.11,1.4,.2);shape(root,'gem','#fff0bc',dx,1.46,0,.1,.14,.1,true);}const bars=group(root);for(let n=0;n<5;n++)box(bars,'#4a626e',-.28+n*.14,.65,0,.04,1.2,.09);box(bars,'#ad925f',0,1.2,0,.7,.1,.1);label(root,c,0,1.85,0,.55);dynamic.add(bars);gates.push({c,bars});return;}
  if('PQR'.includes(c)){const disc=shape(world,'cylinder','#608ca0',X,.04,Z,.34,.06,.34);const ring=shape(world,'ring','#f4d28d',X,.09,Z,.26,.26,.26,true);ring.rotation.x=Math.PI/2;label(world,c,X,.48,Z,.5);dynamic.add(disc);dynamic.add(ring);plates.push({c,disc,ring});return;}
  if('abc'.includes(c)){const root=group(world,X,0,Z);shape(root,'cylinder','#6f7982',0,.08,0,.24,.16,.24);const gear=group(root,0,.48,0);const ring=shape(gear,'ring','#ffe3a0',0,0,0,.19,.19,.19,true);for(let n=0;n<8;n++){const a=n*Math.PI/4;const tooth=box(gear,'#d9ad68',Math.cos(a)*.23,Math.sin(a)*.23,0,.1,.1,.08);tooth.rotation.z=a;}label(root,c,0,1,0,.45);dynamic.add(root);wheels.push({c,root,gear,ring});return;}
  if(c==='E'){const root=group(world,X,0,Z);shape(root,'cylinder','#4c6579',0,.16,0,.48,.32,.48);shape(root,'cylinder','#b39b75',0,.8,0,.25,1.1,.25);shape(root,'sphere','#a5e0db',0,1.45,0,.31,.31,.31,true);for(let n=0;n<3;n++){const r=shape(root,'ring','#ffe3a5',0,1.45,0,.4,.4,.4);r.rotation.set(n*.8,n*.7,0);}label(root,'E · MENARA',0,2.1,0,1.3);return;}
  if(c==='S'){shape(world,'cylinder','#89aba2',X,.012,Z,.34,.023,.34);}
 }));
 // Menara jam menjadi landmark di luar batas jalan; tidak menutupi area puzzle.
 const clock=group(world,6.4,0,-4.1);box(clock,'#354b63',0,1.2,0,1,2.4,.7);box(clock,'#dbc398',0,2.35,0,1.2,.12,.85);
 const dial=shape(clock,'cylinder','#f9e4b8',0,2.9,.06,.55,.13,.55);dial.rotation.x=Math.PI/2;
 for(let i=0;i<12;i++){const a=i*Math.PI/6;shape(clock,'sphere','#4b5266',Math.sin(a)*.43,2.9+Math.cos(a)*.43,.15,.025);}
 clock.scale.setScalar(.55);
 const hand=group(clock,0,2.9,.18);box(hand,'#7c6176',0,.16,0,.035,.33,.025);shape(clock,'cone','#5b617f',0,3.65,0,.77,.6,.62);
 const keeper=(color:string)=>{
  const root=group(world),body=shape(root,'sphere',color,0,.49,0,.18,.28,.14);
  shape(root,'sphere','#efd0ad',0,.84,0,.15,.18,.15);shape(root,'sphere','#4a3846',0,.96,-.035,.16,.09,.15);
  shape(root,'cylinder','#d8b578',0,1,0,.22,.045,.21);shape(root,'cylinder','#3f5260',0,1.07,0,.14,.14,.14);
  for(const side of [-1,1]){shape(root,'sphere','#3a4d58',side*.085,.15,0,.065,.17,.07);shape(root,'sphere',color,side*.19,.5,0,.065,.19,.065);shape(root,'sphere','#efd0ad',side*.2,.33,.015,.06,.065,.06);}
  shape(root,'sphere','#d4a65f',0,.61,.09,.19,.065,.13);shape(root,'sphere','#584653',.04,.51,-.14,.14,.18,.065);
  body.userData.coat=true;return root;
 };
 const runner=keeper('#e7a381');const ghost=keeper('#7fddd9');ghost.traverse((obj:any)=>{if(obj.isMesh){obj.material=obj.material.clone();obj.material.transparent=true;obj.material.opacity=.42;obj.material.depthWrite=false;obj.userData.ownedMaterial=obj.material;}});
 const preview=shape(world,'ring','#f5efc7',0,.14,0,.31,.31,.31,true);preview.rotation.x=Math.PI/2;
 const trail=Array.from({length:10},()=>{const dot=shape(world,'sphere','#a2dedd',0,.12,0,.045,.045,.045,true);dot.visible=false;return dot;});let lastLoop=-1;let lastHead=-1;let trailIndex=0;
 label(runner,'A',0,1.4,0,.4);label(ghost,'GEMA',0,1.4,0,.85,'#b9ffff');

 dynamic.add(runner);dynamic.add(ghost);dynamic.add(preview);dynamic.add(hand);trail.forEach(dot=>dynamic.add(dot));
 // Geometri statis berbagi satu draw per material/bentuk, termasuk shadow pass.
 world.updateMatrixWorld(true);const batches=new Map<string,T.Mesh[]>();
 world.traverse((node:any)=>{if(!node.isMesh||Array.isArray(node.material))return;for(let p=node;p&&p!==world;p=p.parent)if(dynamic.has(p)||p.userData.releaseAsset)return;const key=node.geometry.uuid+node.material.uuid;const list=batches.get(key)??[];list.push(node);batches.set(key,list);});
 for(const list of batches.values()){if(list.length<2)continue;const mesh=new T.InstancedMesh(list[0].geometry,list[0].material,list.length);mesh.castShadow=true;mesh.receiveShadow=true;list.forEach((node,i)=>{mesh.setMatrixAt(i,node.matrixWorld);node.removeFromParent();});mesh.instanceMatrix.needsUpdate=true;world.add(mesh);}
 animate(world,(state:any,t:number)=>{
  const nx=wx(state.runner.x),nz=wz(state.runner.y),dx=nx-runner.position.x,dz=nz-runner.position.z;
  if(Math.hypot(dx,dz)>.002)runner.rotation.y=Math.atan2(dx,dz);runner.position.set(nx,.02,wz(state.runner.y));ghost.visible=!!state.ghost;if(state.ghost)ghost.position.set(wx(state.ghost.x),.025,wz(state.ghost.y));
  hand.rotation.z=-Math.min(state.clock,60)/60*Math.PI*2;
  needles.forEach(({o,root})=>{const p=sweeperPosition(o,state.clock);root.position.set(wx(p.x),0,wz(p.y));});
  shutters.forEach(({c,barrier})=>barrier.visible=!shutterOpen(g.district,c,state.clock));
  gates.forEach(m=>{m.bars.visible=!state.open.includes(m.c);});
  wheels.forEach(m=>{m.root.visible=!state.collected.includes(m.c);m.gear.rotation.y=kit.reducedMotion?0:t*.65;});
  plates.forEach(m=>{const gate=({P:'G',Q:'H',R:'I'} as Record<string,string>)[m.c],charge=(state.plateCharge?.[gate]??0)/(d.hold?.[gate as 'G']??1);m.disc.material=material(state.open.includes(gate)?'#d9c58f':'#608ca0');m.ring.scale.setScalar(.26*(.2+.8*Math.min(1,charge)));});
  preview.visible=!!state.preview;if(state.preview)preview.position.set(wx(state.preview.x),.14,wz(state.preview.y));
  if(lastLoop!==state.loop||state.playhead<lastHead||!state.replaying){trail.forEach(dot=>dot.visible=false);trailIndex=0;}lastLoop=state.loop;
  if(state.ghost&&!kit.reducedMotion&&Math.floor(state.playhead*3)!==Math.floor(lastHead*3)){const dot=trail[trailIndex++%trail.length];dot.visible=true;dot.position.set(wx(state.ghost.x),.1,wz(state.ghost.y));}lastHead=state.playhead;
 });
}
