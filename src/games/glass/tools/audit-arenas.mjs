import {readFile,writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {arenaSourceHash} from './arena-source.mjs';import {createGame} from '../../../platform/game-runtime.ts';import {driveGlassCourse} from './glass-route-driver.mjs';import {glassLevels} from '../glass-levels.ts';
const root='src/games/glass/evidence',sourceHash=await arenaSourceHash();
const shards=await Promise.all(['1-20','21-40','41-60'].map(async r=>JSON.parse(await readFile(`${root}/pacing-course-${r}.json`,'utf8'))));
for(const shard of shards){assert.equal(shard.result,'PASS');assert.equal(shard.sourceHash,sourceHash,'Hasil rute harus berasal dari source yang sama dengan workspace.');assert.equal(shard.stages,20);}
const results=shards.flatMap(s=>s.results).sort((a,b)=>a.stage-b.stage);assert.deepEqual(results.map(r=>r.stage),Array.from({length:60},(_,i)=>i+1));assert.ok(results.every(r=>r.breaks===0));
const negative=[];for(let stage=0;stage<6;stage++){
 let blocked=false,reason='';try{driveGlassCourse(createGame('glass','relaxed',stage+1,42),{analogOnly:true});}catch(e){blocked=true;reason=e.message;}
 assert.ok(blocked,`Stage ${stage+1} tidak boleh selesai dengan analog saja`);negative.push({stage:stage+1,result:'BLOCKED',reason});
}
assert.equal(await arenaSourceHash(),sourceHash);
const report={result:'PASS',sourceHash,range:[1,60],stages:60,checkpoints:results.reduce((n,r)=>n+r.checkpoints,0),encounters:glassLevels.reduce((n,l)=>n+l.challenges.length,0),results,negative,limitation:'Gabungan tiga rentang input sintetis pada hash source yang sama, tanpa teleport/kekebalan. Rute mengetahui peta dan merencanakan fase. Bukan playtest, dua HP fisik, benchmark atau bukti keseruan manusia.'};
await writeFile(`${root}/pacing-progression-report.json`,JSON.stringify(report,null,2)+'\n');console.log(`PASS: ${results.length} stage / ${report.checkpoints} checkpoint, enam kontrol negatif terhalang.`);
