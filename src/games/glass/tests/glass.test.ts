import {glassLevels,encounterBudget} from '../glass-levels.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as T from 'three';
import {createGame,gameAction,tickGame} from '../../../platform/game-runtime.ts';
import {glassCourse,glassBasis,glassPoint,glassEndpoints,glassCorners,glassLimbAnchors,glassArmLengths,glassHitsPart,glassHitsObstacle,bodyHitsPart,groundHeight,propParts,platformPose,neutralGlass} from '../glass.ts';
import {routePoint,routeProject,routeControls} from '../glass-route.ts';
import {glassTerrainTriangles,glassRoadTriangles} from '../glass-terrain.ts';
import {planGlassCamera} from '../glass-camera.ts';
import {obbOverlap,obbHullOverlap,WORLD_BASIS,moveGlassBody} from '../glass-collision.ts';
import {createSoftCarrier} from '../soft-carrier.ts';
import {keyboardGlassInputs,GLASS_TURN_LEFT,GLASS_TURN_RIGHT} from '../glass-controls.ts';
import {touchMarkup} from '../../../platform/touch-controller.ts';
const idle={x:0,y:0,glassX:0,glassY:0};
function step(g:any,a:any=idle,b:any=idle,n=1){for(let i=0;i<n;i++)tickGame(g,[a,b],1/60);}
function worldPose(g:any,s:number){const course=glassCourse(g.stage),center=routePoint(course.route,s);g.players.forEach((p:any,i:number)=>{const q=routePoint(course.route,s,i?1.8:-1.8);p.x=q.x;p.z=q.z;p.y=groundHeight(course,p.x,p.z);p.vy=0;p.grounded=true;});g.pane={...g.pane,x:center.x,y:(g.players[0].y+g.players[1].y)/2+1.4,z:center.z,yaw:center.yaw,roll:0,slope:0};g.camera=planGlassCamera(g,course,1/60,true);}

test('Kaca: 60 rute terbuka memiliki rangkaian tantangan dan checkpoint fisik unik',()=>{
 const fingerprints=new Set();for(let stage=0;stage<60;stage++){const c=glassCourse(stage);assert.equal(c.checkpoints.length,glassLevels[stage].segments.length);assert.ok(c.encounters.length>=c.checkpoints.length*2);assert.ok(c.route.length>90);assert.ok(c.checkpoints.every((s,i)=>i===0||s>c.checkpoints[i-1]));assert.ok(Math.hypot(c.route.points.at(-1)!.x-c.route.points[0].x,c.route.points.at(-1)!.z-c.route.points[0].z)>14,'ujung rute tidak menumpuk spawn pada arena padat');assert.equal(c.world,glassLevels[stage].biome);fingerprints.add(JSON.stringify([c.route.points,c.obstacles]));assert.ok(c.obstacles.every(o=>!['aperture','moving','beam','lift'].includes(o.kind)));}assert.equal(fingerprints.size,60);
});
test('Kaca: proyeksi lintasan dan kontrol kamera konsisten pada seluruh arah',()=>{
 const c=glassCourse(2);for(let s=3;s<c.route.length-3;s+=3){const p=routePoint(c.route,s,1);const near=routeProject(c.route,p.x,p.z);assert.ok(Math.abs(near.s-s)<.15);assert.ok(Math.abs(near.lateral-1)<.02);const input=routeControls(p.yaw,0,-1);assert.ok(Math.hypot(input.x+Math.sin(p.yaw),input.z+Math.cos(p.yaw))<1e-10);}
});
test('Kaca: tidak ada sudut wajib atau pecah dari tekanan/jangkauan tanpa kontak',()=>{
 for(const angle of [-2.4,-.17,0,.13,.73,Math.PI/2,Math.PI,Math.PI*2+.1]){const g=createGame('glass');g.pane.roll=angle;g.pressure=100;g.armStress=100;step(g,idle,idle,60);assert.equal(g.breaks,0,`sudut ${angle} bebas di ruang kosong`);assert.equal(g.pane.roll,angle);}
 const g=createGame('glass');const center={x:g.pane.x,z:g.pane.z},yaw=g.pane.yaw;g.players.forEach((p:any,i:number)=>{const side=i?1:-1;p.x=center.x+Math.cos(yaw)*4*side;p.z=center.z-Math.sin(yaw)*4*side;});step(g,idle,idle,30);assert.equal(g.breaks,0,'regangan lengan saja tidak memecahkan kaca');
});
test('Kaca: hanya kontak volume nyata dengan mobil memecahkan kaca',()=>{
 const g=createGame('glass'),car=glassCourse(0).obstacles.find(o=>o.kind==='car')!,roof=propParts(glassCourse(0),car,0)[1];g.pane={...g.pane,x:roof.center.x,y:roof.center.y+roof.half[1]+.0285,z:roof.center.z,yaw:car.yaw,roll:0,slope:0};assert.equal(glassHitsPart(g,roof),false);g.pane.y-=.002;assert.equal(glassHitsPart(g,roof),true);
});
test('Kaca: guling penuh tidak mengangkat salah satu ujung; angkat sisi merupakan slope terpisah',()=>{
 const g=createGame('glass');step(g,idle,idle,30);const endpoints=glassEndpoints(g);step(g,{...idle,glassX:1},idle,260);assert.ok(g.pane.roll>Math.PI*2);assert.equal(g.breaks,0);glassEndpoints(g).forEach((p,i)=>assert.ok(Math.hypot(p.x-endpoints[i].x,p.y-endpoints[i].y,p.z-endpoints[i].z)<1e-7));const roll=g.pane.roll;step(g,{...idle,glassY:-1},idle,12);assert.ok(g.pane.slope<0);assert.equal(g.pane.roll,roll);step(g,idle,idle,20);assert.equal(g.pane.roll,roll);
});
test('Kaca: empat tangan dan renderer memakai rotasi dunia, guling dan slope yang sama',()=>{
 const g=createGame('glass'),scene=new T.Group(),model=createSoftCarrier(scene,'#ff9e87');for(const yaw of [0,.8,-1.7])for(const roll of [0,.3,Math.PI/2,Math.PI*2]){g.pane.yaw=yaw;g.pane.roll=roll;g.pane.slope=.2;const matrix=new T.Matrix4().makeRotationY(yaw).multiply(new T.Matrix4().makeRotationZ(.2)).multiply(new T.Matrix4().makeRotationX(Math.PI/2+roll));for(const x of [-1.2,1.2])for(const v of [-.6,.6]){const a=glassPoint(g,x,v),b=new T.Vector3(x,v,0).applyMatrix4(matrix).add(new T.Vector3(g.pane.x,g.pane.y,g.pane.z));assert.ok(b.distanceTo(new T.Vector3(a.x,a.y,a.z))<1e-9);}model.update(g,0,0,1/60,true);glassLimbAnchors(g,0).forEach((a,i)=>assert.ok(model.hands[i].position.distanceTo(new T.Vector3(a.hand.x,a.hand.y,a.hand.z))<1e-9));assert.equal(new Set(glassCorners(g).map(p=>JSON.stringify(p))).size,4);}
});
test('Kaca: tombol HP/keyboard sama dan tombol berlawanan saling menetralkan',()=>{
 const markup=touchMarkup({you:{host:true,slot:0},phase:'playing',players:[{connected:true},{connected:true}],game:{id:'glass',retryTime:0}}, {},{leftHanded:false,large:false,draftAnswer:null,connected:true});assert.match(markup,/data-glass-x="1"[^>]*aria-label="Putar kiri"/);assert.match(markup,/data-glass-x="-1"[^>]*aria-label="Putar kanan"/);
 for(const [key,slot,value] of [['KeyQ',0,GLASS_TURN_LEFT],['KeyE',0,GLASS_TURN_RIGHT],['KeyU',1,GLASS_TURN_LEFT],['KeyO',1,GLASS_TURN_RIGHT]] as const)assert.equal(keyboardGlassInputs(new Set([key]))[slot].glassX,value);assert.ok(keyboardGlassInputs(new Set(['KeyQ','KeyE','KeyU','KeyO'])).every(p=>p.glassX===0));
});
test('Kaca: pecah berasal dari kontak badan pembawa, bukan jarak dua badan',()=>{
 const g=createGame('glass');g.players[0].x=g.pane.x;g.players[0].z=g.pane.z;step(g);assert.equal(g.breaks,1);assert.match(g.message,/menyentuh badan/);const safe=createGame('glass');safe.pressure=1e6;step(safe);assert.equal(safe.breaks,0);
});
test('Kaca: tanah hanya memecahkan saat permukaan kaca benar-benar mencapai tanah',()=>{
 const safe=createGame('glass');step(safe,{...idle,glassY:1},{...idle,glassY:1},90);assert.equal(safe.breaks,0,'kaca datar masih mempunyai jarak ke tanah');for(let i=0;i<120&&!safe.breaks;i++)step(safe,{...idle,glassX:1},idle);assert.equal(safe.breaks,1);assert.match(safe.message,/menyentuh tanah/);
});
test('Kaca: lompat satu maupun dua pembawa mempertahankan guling dan tidak pecah tanpa kontak',()=>{
 for(const both of [false,true]){const g=createGame('glass'),before=g.players.map((p:any)=>p.y);gameAction(g,0,'jump');if(both)gameAction(g,1,'jump');step(g,idle,idle,20);assert.ok(g.players[0].y>before[0]+.5);assert.equal(g.pane.roll,0);assert.equal(g.breaks,0);}
});
test('Kaca: checkpoint harus didatangi di koordinat dunia dan tidak dapat dilewati lewat angka Z',()=>{
 const g=createGame('glass'),course=glassCourse(0);g.players.forEach((p:any)=>p.z=-100);step(g);assert.equal(g.checkpoint,0);const correct=createGame('glass');for(const s of course.checkpoints){worldPose(correct,s);step(correct);}assert.equal(correct.stagesCompleted,1);assert.equal(correct.cleared,4);assert.equal(correct.stage,1);assert.equal(correct.checkpoint,0);assert.equal(correct.retryTime,0);assert.equal(correct.finished,false);gameAction(correct,0,'next');gameAction(correct,1,'next');assert.equal(correct.stage,1);
});
test('Kaca: retry kembali ke checkpoint dunia yang benar tanpa menghapus progres',()=>{
 const g=createGame('glass');g.checkpoint=2;gameAction(g,0,'retry');step(g,idle,idle,40);const p=routePoint(glassCourse(0).route,glassCourse(0).checkpoints[1]+1);assert.equal(g.checkpoint,2);assert.ok(Math.hypot(g.pane.x-p.x,g.pane.z-p.z)<.01);assert.equal(g.retryTime,0);
});
test('Kaca: camera berputar halus mengikuti kelokan serta tetap membingkai dua pembawa',()=>{
 const g=createGame('glass'),c=glassCourse(0);let previous=g.camera.heading,total=0;for(let s=2;s<c.route.length-3;s+=.5){const previousView={...g.camera,heading:previous};worldPose(g,s);g.camera=previousView;const camera=planGlassCamera(g,c,.1);const delta=Math.atan2(Math.sin(camera.heading-previous),Math.cos(camera.heading-previous));assert.ok(Math.abs(delta)<.5);total+=Math.abs(delta);previous=camera.heading;assert.ok(Number.isFinite(camera.x+camera.y+camera.z));assert.ok(camera.distance>=9.5&&camera.distance<=16);}assert.ok(total>2);
});
test('Kaca: penumpang ikut translasi, rotasi dan ketinggian platform tanpa teleport',()=>{
 for(const stage of [3,9,4]){const g=createGame('glass','relaxed',stage+1),c=glassCourse(stage),platform=c.obstacles.find(o=>o.kind==='platform')!,pose=platformPose(c,platform,0);g.players.forEach((p:any,i:number)=>{p.x=pose.x+Math.cos(pose.yaw)*(i?1.6:-1.6);p.z=pose.z-Math.sin(pose.yaw)*(i?1.6:-1.6);p.y=pose.y;p.support=platform.id;});g.pane={...g.pane,x:pose.x,y:pose.y+1.4,z:pose.z,yaw:pose.yaw};g.camera=planGlassCamera(g,c,1/60,true);const before={...g.players[0]};step(g,idle,idle,120);assert.equal(g.breaks,0,platform.axis);assert.ok(Math.hypot(g.players[0].x-before.x,g.players[0].y-before.y,g.players[0].z-before.z)>.5);assert.ok(g.players.every((p:any)=>p.support===platform.id));}
});
test('Kaca: kepala/poros palu dan kapak memakai bagian collider fisik bergerak',()=>{
 for(const stage of [11,3]){const c=glassCourse(stage),o=c.obstacles.find(o=>['hammer','axe'].includes(o.kind))!,a=propParts(c,o,0),b=propParts(c,o,(o.period||6)/2);assert.ok(Math.hypot(a[0].center.x-b[0].center.x,a[0].center.y-b[0].center.y,a[0].center.z-b[0].center.z)>.5);const g=createGame('glass','relaxed',stage+1);g.pane={...g.pane,...a[1].center,yaw:o.yaw,roll:0};assert.equal(glassHitsPart(g,a[1]),true);}
});
test('Kaca: badan tidak menembus kotak mobil atau tiang, termasuk gerak besar dan diagonal',()=>{
 const c=glassCourse(0),pole=c.obstacles.find(o=>o.kind==='pole')!,part=propParts(c,pole,0)[0],u=part.basis[0],p={x:part.center.x-u.x*2,z:part.center.z-u.z*2,y:pole.bottom,lower:0};const blocked=(p:any)=>bodyHitsPart(p,part);moveGlassBody(p,u.x*6,u.z*6,blocked);assert.equal(blocked(p),false);assert.ok((p.x-part.center.x)*u.x+(p.z-part.center.z)*u.z<-.4);
});
test('Kaca: SAT dua kotak dunia mendeteksi kontak tanpa aturan orientasi',()=>{
 const basis=glassBasis(createGame('glass'));assert.equal(obbOverlap({x:0,y:0,z:0},basis,[1.2,.6,.03],{x:4,y:0,z:0},WORLD_BASIS,[.5,.5,.5]),false);assert.equal(obbOverlap({x:0,y:0,z:0},basis,[1.2,.6,.03],{x:1,y:0,z:0},WORLD_BASIS,[.5,.5,.5]),true);
});
test('Kaca: mesh tanah/jalan mempunyai lubang lift nyata dan angka finite',()=>{
 for(const stage of [0,10,20,21,22,40]){const c=glassCourse(stage);for(const positions of [glassTerrainTriangles(c),glassRoadTriangles(c)]){assert.ok(positions.length>0);assert.ok(positions.every(Number.isFinite));assert.equal(positions.length%9,0);}assert.equal(c.gaps.length,c.encounters.filter(e=>['ferry','sideFerry','lift','turntable'].includes(e.kind)).length+c.encounters.reduce((n,e)=>n+(e.kind==='stepping'?2:e.kind==='threadBridge'?(e.group>=2?4:2):0),0));}
});
test('Kaca: netral menghentikan kontrol tanpa mereset tinggi atau orientasi',()=>{
 const g=createGame('glass');step(g,{...idle,glassX:.2,glassY:-1},idle,12);const before={roll:g.pane.roll,height:g.players[0].gripHeight};neutralGlass(g);step(g,idle,idle,30);assert.equal(g.pane.roll,before.roll);assert.equal(g.players[0].gripHeight,before.height);assert.equal(g.players[0].lifting,false);assert.equal(g.players[0].rotating,false);
});


test('Kaca: ruang kosong kotak pembatas daun/batu tidak dihitung sebagai sentuhan',()=>{
 assert.equal(obbHullOverlap({x:.9,y:.9,z:0},WORLD_BASIS,[.02,.02,.02],{x:0,y:0,z:0},WORLD_BASIS,[1,1,1],'cone'),false);
 assert.equal(obbHullOverlap({x:0,y:0,z:0},WORLD_BASIS,[.02,.02,.02],{x:0,y:0,z:0},WORLD_BASIS,[1,1,1],'cone'),true);
 assert.equal(obbHullOverlap({x:.8,y:.8,z:.8},WORLD_BASIS,[.02,.02,.02],{x:0,y:0,z:0},WORLD_BASIS,[1,1,1],'gem'),false);
});

test('Kaca: ruang kosong di atas sisi atap tidak memecahkan kaca',()=>{assert.equal(obbHullOverlap({x:.9,y:.9,z:0},WORLD_BASIS,[.02,.02,.02],{x:0,y:0,z:0},WORLD_BASIS,[1,1,1],'roof'),false);assert.equal(obbHullOverlap({x:0,y:0,z:0},WORLD_BASIS,[.02,.02,.02],{x:0,y:0,z:0},WORLD_BASIS,[1,1,1],'roof'),true);});

test('Kaca: checkpoint akhir langsung memindahkan 59 stage dan menutup stage terakhir',()=>{
 for(let stage=0;stage<60;stage++){
  const g=createGame('glass','relaxed',stage+1,42);const count=glassCourse(stage).checkpoints.length;g.checkpoint=count-1;g.cleared=count-1;g.breaks=2;g.elapsed=20;worldPose(g,glassCourse(stage).checkpoints[count-1]);step(g);
  assert.equal(g.stage,Math.min(stage+1,59));assert.equal(g.stagesCompleted,1);assert.equal(g.cleared,count);assert.equal(g.breaks,2);assert.equal(g.retryTime,0);assert.equal(g.finished,stage===59);assert.equal(g.checkpoint,stage===59?count:0);assert.equal(g.stageClear,undefined);assert.equal(g.nextReady,undefined);
  if(stage<59){const spawn=routePoint(glassCourse(stage+1).route,2);assert.ok(Math.hypot(g.pane.x-spawn.x,g.pane.z-spawn.z)<1e-8);const before=g.players[0].z;step(g,{...idle,y:-1},idle);assert.notEqual(g.players[0].z,before,'input langsung aktif pada stage baru');}
 }
});

test('Kaca: pagar platform yang masuk ke badan tidak mengunci semua gerak pemain',()=>{
 const g=createGame('glass','relaxed',4,42),course=glassCourse(3),platform=course.obstacles.find(o=>o.kind==='platform')!,pose=platformPose(course,platform,0);
 g.players.forEach((p:any,i:number)=>{const u=i?1.6:-3.68;p.x=pose.x+Math.cos(pose.yaw)*u;p.z=pose.z-Math.sin(pose.yaw)*u;p.y=pose.y;p.support=platform.id;});
 g.pane={...g.pane,x:(g.players[0].x+g.players[1].x)/2,z:(g.players[0].z+g.players[1].z)/2,y:pose.y+1.7,yaw:pose.yaw};const rail=propParts(course,platform,0)[2];
 assert.equal(bodyHitsPart(g.players[0],rail),true);step(g);assert.equal(bodyHitsPart(g.players[0],propParts(course,platform,g.elapsed)[2]),false);assert.equal(g.breaks,0);
});

test('Kaca: celah jembatan putus harus dilompati; berjalan tidak dapat naik dari jurang',()=>{
 const c=glassCourse(1),stepping=c.encounters.find(e=>e.kind==='stepping')!,gap=c.gaps.find(g=>Math.abs(g.s-stepping.s)<3)!;
 for(const jump of [false,true]){
  const g=createGame('glass','relaxed',2,42);worldPose(g,gap.s-1.2);if(jump){gameAction(g,0,'jump');gameAction(g,1,'jump');}
  step(g,{...idle,y:-1},{...idle,y:-1},54);const s=routeProject(c.route,g.pane.x,g.pane.z).s;
  if(jump){assert.equal(g.breaks,0);assert.ok(s>gap.s+gap.d/2);assert.ok(g.players.every((p:any)=>p.grounded));}else assert.ok(s<gap.s+gap.d/2,'tidak menapak ke bank seberang tanpa melompat');
 }
});


test('Kaca: checkpoint menutup rangkaian bertambah, bukan satu encounter',()=>{
 for(let stage=0;stage<60;stage++){const c=glassCourse(stage);let previous=0;for(let i=0;i<c.checkpoints.length;i++){const encounters=c.encounters.filter(e=>e.group===i);assert.equal(encounters.length,encounterBudget(stage,i));assert.ok(encounters.every(e=>e.s>previous&&e.to<c.checkpoints[i]));previous=c.checkpoints[i];}assert.ok(c.obstacles.every(o=>o.kind!=='boundary'));}
 const g=createGame('glass'),c=glassCourse(0);worldPose(g,(c.encounters[0].to+c.encounters[1].from)/2);step(g);assert.equal(g.checkpoint,0);worldPose(g,c.checkpoints[0]);step(g);assert.equal(g.checkpoint,1);gameAction(g,0,'retry');step(g,idle,idle,40);assert.equal(g.checkpoint,1);assert.ok(Math.abs(g.progress-c.checkpoints[0])<2);
});

test('Kaca: indeks collision lokal tetap menyertakan setiap kontak volume dari geometri penuh',async()=>{
 const {localCourseParts,courseParts}=await import('../glass-world.ts');for(const stage of [0,1,2,3,4,5]){const c=glassCourse(stage),g=createGame('glass','relaxed',stage+1,42);for(const e of c.encounters){worldPose(g,e.s);g.pane.roll=Math.PI/3;const all=courseParts(c,1.23),local=new Set(localCourseParts(c,1.23,[...g.players,g.pane]));for(const part of all)if(glassHitsPart(g,part)||g.players.some((p:any)=>bodyHitsPart(p,part)))assert.ok(local.has(part)||localHasPart(local,part),`Kontak hilang ${stage}:${part.kind}`);}}
 function localHasPart(parts:Set<any>,target:any){return [...parts].some(p=>p.id===target.id&&Math.hypot(p.center.x-target.center.x,p.center.y-target.center.y,p.center.z-target.center.z)<1e-8);}
});

test('Kaca: badan membulat tidak membesar pada lorong diagonal dan tetap menabrak hull batu',()=>{
 for(const angle of [0,Math.PI/4,Math.PI/3]){
  const c=Math.cos(angle),s=Math.sin(angle),part:any={center:{x:0,y:1,z:0},basis:[{x:c,y:0,z:-s},{x:0,y:1,z:0},{x:s,y:0,z:c}],half:[1,3,1],color:'#888',id:'diagonal-stone',kind:'rock',geometry:'gem'};
  const body=(u:number,v:number)=>({x:c*u+s*v,y:0,z:-s*u+c*v});
  assert.equal(bodyHitsPart(body(.8,.8),part),false,'ruang luar hull harus tetap dapat dilalui');
  assert.equal(bodyHitsPart(body(.7,.7),part),true,'kontak lingkaran terhadap hull tetap padat');
 }
});
