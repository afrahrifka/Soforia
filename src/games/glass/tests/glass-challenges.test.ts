import {posture,encounterGap,challengeExtent,weaveOffset} from '../glass-pacing.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import {glassLevels,glassMovingKinds} from '../glass-levels.ts';
import {glassCourse,propParts,groundHeight,bodyHitsPart} from '../glass.ts';
import {corridorHalfWidth,platformPose} from '../glass-world.ts';
import {routePoint,routeProject} from '../glass-route.ts';
import {challengePose,poseContacts,inspectChallenges} from '../tools/glass-challenge-check.mjs';

test('Kaca: 60 susunan tantangan dan nama unik; bioma berganti, bukan sepuluh pengulangan',()=>{
 assert.equal(glassLevels.length,60);assert.equal(new Set(glassLevels.map(l=>l.name)).size,60);assert.equal(new Set(glassLevels.map(l=>l.challenges.join(','))).size,60);
 for(let i=0;i<60;i++){const level=glassLevels[i];assert.ok(level.challenges.some(k=>['roll','raise','duck','jump','split'].includes(k)));assert.ok(level.challenges.some(k=>['hammer','axe','sweeper','crusher','traffic','logSwing','ferry','sideFerry','lift','zipper','stepping'].includes(k)));if(i)assert.notEqual(level.biome,glassLevels[i-1].biome);}
});

test('Kaca: encounter statis mempunyai pose solusi yang tidak mengenai collider',()=>{const report=inspectChallenges();assert.ok(report.results.length>100);assert.deepEqual(report.failures,[]);assert.ok(report.results.every(r=>r.defaultBlocked));});

test('Kaca: mencari arah/formasi lain dengan analog saja tetap terhalang benda nyata',()=>{
 for(const kind of ['roll','raise','duck','jump','split']){
  const stage=glassLevels.findIndex(l=>l.challenges.includes(kind as any)),c=glassCourse(stage),e=c.encounters.find(e=>e.kind===kind)!;let escape=0;
  for(let angle=0;angle<=Math.PI+.001;angle+=Math.PI/12)for(let offset=-2.8;offset<=2.81;offset+=.2)for(const span of [1.4,1.8,2.6]){
   let clear=true;for(const distance of [-3,-2,-1,0,1,2,3]){
    const s=e.s+distance,pose=challengePose(c,s,'walk',offset),point=routePoint(c.route,s,offset),yaw=point.yaw+angle;
    pose.players.forEach((p:any,i:number)=>{const side=i?1:-1;p.x=point.x+Math.cos(yaw)*span*side;p.z=point.z-Math.sin(yaw)*span*side;p.y=groundHeight(c,p.x,p.z);});pose.pane.y=pose.players.reduce((sum:number,p:any)=>sum+p.y,0)/2+1.4;pose.pane.yaw=yaw;pose.pane.slope=Math.atan2(pose.players[1].y-pose.players[0].y,2.4);
    if(poseContacts(c,pose).length){clear=false;break;}
   }if(clear)escape++;

  }
  assert.equal(escape,0,`${kind}: ada formasi tanpa aksi yang dapat melintas`);
 }
});

test('Kaca: semua jenis mesin mengubah collider yang juga dipakai renderer',()=>{
 for(const kind of [...glassMovingKinds].filter(k=>k!=='platform')){
  const stage=glassLevels.findIndex(l=>l.challenges.includes(kind as any));const c=glassCourse(stage),o=c.obstacles.find(o=>o.kind===kind)!;assert.ok(o,kind);const a=propParts(c,o,0),phases=[.2,.4,.6,.8].map(t=>propParts(c,o,t*(o.period||6)));assert.ok(phases.every(p=>p.length===a.length));assert.ok(phases.some(p=>p.some((part,i)=>Math.hypot(part.center.x-a[i].center.x,part.center.y-a[i].center.y,part.center.z-a[i].center.z)>.4||part.basis.some((axis,j)=>Math.hypot(axis.x-a[i].basis[j].x,axis.y-a[i].basis[j].y,axis.z-a[i].basis[j].z)>.4))),kind);
 }
});

test('Kaca: ujung lift sejajar daratan dan kedua bukaan feri menyamping tidak dipagari',()=>{
 const c=glassCourse(4),o=c.obstacles.find(o=>o.kind==='platform')!,a=routePoint(c.route,o.s-3),b=routePoint(c.route,o.s+3);assert.ok(Math.abs(platformPose(c,o,0).y-groundHeight(c,a.x,a.z))<1e-8);assert.ok(Math.abs(platformPose(c,o,o.period!/2).y-groundHeight(c,b.x,b.z))<1e-8);
 const sideCourse=glassCourse(9),f=sideCourse.obstacles.find(o=>o.kind==='platform')!,p=platformPose(sideCourse,f,0);for(const u of [-f.w/2+.4,f.w/2-.4]){const body={x:p.x+Math.cos(p.yaw)*u,z:p.z-Math.sin(p.yaw)*u,y:p.y};assert.ok(propParts(sideCourse,f,0).filter(part=>!part.support&&part.center.y+part.half[1]>p.y+.2).every(part=>!bodyHitsPart(body,part)));}
});

test('Kaca: lorong lompat menuntut lompatan DAN guling melalui bentuk fisik',()=>{
 const c=glassCourse(0),e=c.encounters.find(e=>e.kind==='threadHop')!,base=challengePose(c,e.s-1.6,'roll'),parts=c.obstacles.flatMap(o=>propParts(c,o,0));
 assert.ok(parts.some(part=>base.players.some(p=>bodyHitsPart(p,part))),'tanpa lompat badan tertahan ambang');
 const jump=structuredClone(base);jump.players.forEach(p=>p.y+=.9);jump.pane.y+=.9;
 assert.ok(parts.every(part=>!jump.players.some(p=>bodyHitsPart(p,part))));
 // Collider bidang kaca dan badan yang sama dengan runtime, tanpa sudut wajib.
 const rolled=poseContacts(c,jump);assert.deepEqual(rolled,[]);jump.pane.roll=0;assert.ok(poseContacts(c,jump).length>0,'kaca datar menyentuh bangunan pada lorong sempit');
});

test('Kaca: iris bintang, gunting dan dinding bernapas mempunyai fase aman nyata serta fase yang menghalangi',()=>{
 for(const kind of ['iris','scissor','breathing']){
  const stage=glassLevels.findIndex(l=>l.challenges.includes(kind as any)),c=glassCourse(stage),e=c.encounters.find(e=>e.kind===kind)!,o=c.obstacles.find(o=>e.props.includes(o.id))!,pose=challengePose(c,e.s);
  const time=(phase:number)=>((phase-o.phase/(Math.PI*2))%1+1)%1*o.period!;
  assert.deepEqual(poseContacts(c,pose,time(.2)),[],`${kind}: bukaan harus benar-benar dapat dilalui`);
  assert.ok(poseContacts(c,pose,time(.775)).length>0,`${kind}: bentuk tertutup harus menghalangi`);
 }
});

test('Kaca: panjang rangkaian meningkat per bab, 60 siluet berbeda dan jeda pemulihan tetap ada',()=>{
 const totals=glassLevels.map(l=>l.challenges.length);
 assert.deepEqual([totals[0],totals[6],totals[18],totals[36],totals[54]],[10,12,14,16,23]);
 assert.equal(new Set(glassLevels.map(l=>l.headings.join(','))).size,60);
 for(let stage=0;stage<60;stage++){
  const c=glassCourse(stage);
  for(let group=0;group<c.checkpoints.length;group++){
   const encounters=c.encounters.filter(e=>e.group===group);const last=encounters.at(-1)!;const recovery=c.checkpoints[group]-last.to;assert.ok(posture(last.kind)==='thread'?recovery>=7.3&&recovery<=8.7:recovery>=2.8&&recovery<=4.2,'jeda checkpoint mengikuti kebutuhan keluar formasi');
  }
  if(stage>=24)assert.ok(c.encounters.filter(e=>['iris','scissor','breathing'].includes(e.kind)).length>=2);
 }
});


test('Kaca: celah antar tantangan dihitung dari footprint dan kebutuhan transisi',()=>{
 assert.ok(encounterGap('raise','duck',0,0)<10);
 assert.ok(encounterGap('ferry','roll',0,2)>=challengeExtent('ferry').after+challengeExtent('roll').before+10);
 assert.ok(encounterGap('crusher','traffic',59,3)>=8);
});

test('Kaca: slalom memindah bukaan, rak menukar sisi tinggi dan dek berputar secara fisik',()=>{
 const slalom=glassCourse(1),e=slalom.encounters.find(e=>e.kind==='weave')!,frames=slalom.obstacles.filter(o=>e.props.includes(o.id));
 assert.equal(frames.length,3);assert.ok(frames[0].lateral<0&&frames[1].lateral>0&&frames[2].lateral<0);assert.equal(weaveOffset(-6,1),frames[0].lateral);for(const frame of frames){assert.deepEqual(poseContacts(slalom,challengePose(slalom,frame.s,'roll',frame.lateral)),[],'bukaan slalom dapat dilalui');assert.ok(poseContacts(slalom,challengePose(slalom,frame.s,'roll')).length,'guling lurus saja masih terhalang panel');}
 const stage=glassLevels.findIndex(l=>l.challenges.includes('tiltWeave')),c=glassCourse(stage),tilt=c.encounters.find(e=>e.kind==='tiltWeave')!,racks=c.obstacles.filter(o=>tilt.props.includes(o.id));assert.equal(racks.length,2);assert.ok(Math.abs(Math.abs(racks[1].yaw-racks[0].yaw)-Math.PI)<.01);
 const rotaryStage=glassLevels.findIndex(l=>l.challenges.includes('turntable')),r=glassCourse(rotaryStage),deck=r.obstacles.find(o=>o.axis==='rotary')!;assert.ok(deck);const poses=[0,.25,.5,.75].map(t=>platformPose(r,deck,t*deck.period!));assert.ok(poses.some(p=>Math.abs(Math.sin(p.yaw-poses[0].yaw))>.5));assert.ok(propParts(r,deck,0).some(p=>p.support));
});
