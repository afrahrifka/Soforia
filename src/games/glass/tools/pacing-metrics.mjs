// Ukur ruang fisik antar encounter, bukan memperlebar label aktivitas secara artifisial.
import {glassCourse,propParts} from '../glass-world.ts';import {routeProject} from '../glass-route.ts';import {solidProfile} from '../glass-collision.ts';
export function pacingMetrics(stage){
 const c=glassCourse(stage),intervals=[];
 for(const e of c.encounters){
  for(const o of c.obstacles.filter(o=>e.props.includes(o.id))){let lo=Infinity,hi=-Infinity;
   for(const t of [0,(o.period||1)/4,(o.period||1)/2,(o.period||1)*.75])for(const p of propParts(c,o,t)){
    const vertices=p.geometry&&p.geometry!=='box'?solidProfile(p.geometry).vertices:[-1,1].flatMap(x=>[-1,1].flatMap(y=>[-1,1].map(z=>({x,y,z}))));
    for(const v of vertices){const near=routeProject(c.route,p.center.x+p.basis[0].x*v.x*p.half[0]+p.basis[1].x*v.y*p.half[1]+p.basis[2].x*v.z*p.half[2],p.center.z+p.basis[0].z*v.x*p.half[0]+p.basis[1].z*v.y*p.half[1]+p.basis[2].z*v.z*p.half[2]);lo=Math.min(lo,near.s);hi=Math.max(hi,near.s);}
   }
   if(Number.isFinite(lo))intervals.push({from:Math.max(2,lo),to:Math.min(c.finish,hi),kind:e.kind,prop:o.id});
  }
  if(['roll','threadHop','threadBridge','threadHammer'].includes(e.kind))intervals.push({from:e.s-4,to:e.s+4,kind:e.kind});
 }
 for(const gap of c.gaps){const ss=[];for(const u of [-gap.w/2,gap.w/2])for(const v of [-gap.d/2,gap.d/2])ss.push(routeProject(c.route,gap.x+Math.cos(gap.yaw)*u+Math.sin(gap.yaw)*v,gap.z-Math.sin(gap.yaw)*u+Math.cos(gap.yaw)*v).s);intervals.push({from:Math.max(2,Math.min(...ss)),to:Math.min(c.finish,Math.max(...ss)),kind:'gap'});}
 intervals.sort((a,b)=>a.from-b.from);let end=2;const empty=[];for(const i of intervals){if(i.from>end)empty.push({from:end,to:i.from,length:i.from-end});end=Math.max(end,i.to);}if(end<c.finish)empty.push({from:end,to:c.finish,length:c.finish-end});
 return {stage:stage+1,title:c.title,length:c.finish-2,encounters:c.encounters.length,maxEmpty:Math.max(0,...empty.map(g=>g.length)),emptyDistance:empty.reduce((n,g)=>n+g.length,0),intervals,empty};
}
if(process.argv[1]?.endsWith('pacing-metrics.mjs')){
 const {readFile,writeFile}=await import('node:fs/promises'),{arenaSourceHash}=await import('./arena-source.mjs');
 const before=JSON.parse(await readFile('src/games/glass/evidence/pacing-before.json','utf8')),stages=Array.from({length:60},(_,i)=>pacingMetrics(i));
 const summary=rows=>({meanPath:rows.reduce((n,r)=>n+r.length,0)/rows.length,maxEmpty:Math.max(...rows.map(r=>r.maxEmpty)),meanEmptyDistance:rows.reduce((n,r)=>n+r.emptyDistance,0)/rows.length});
 const report={sourceHash:await arenaSourceHash(),before:summary(before.stages||before.results),after:summary(stages),stages,limitation:'Panjang geometri longitudinal, bukan durasi bermain atau bukti keseruan. Envelope mesin diukur pada empat fase; pergantian formasi tidak dihitung sebagai rintangan fisik.'};
 const {default:assert}=await import('node:assert/strict');assert.ok(report.after.meanPath<report.before.meanPath*.65,'Rute rata-rata harus jauh lebih padat');assert.ok(report.after.meanEmptyDistance<report.before.meanEmptyDistance*.5,'Perjalanan kosong harus berkurang setidaknya separuh');assert.ok(report.after.maxEmpty<26,'Tidak boleh ada koridor kosong panjang seperti sebelumnya');
 report.result='PASS';await writeFile('src/games/glass/evidence/pacing-comparison.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({before:report.before,after:report.after}));
}
