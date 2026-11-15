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
