import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGame} from '../../../platform/game-runtime.ts';
import {glassCourse} from '../glass.ts';
import {driveGlassCourse} from './glass-route-driver.mjs';
import {arenaSourceHash} from './arena-source.mjs';
const sourceHash=await arenaSourceHash();
const arg=(name,fallback)=>{const i=process.argv.indexOf(name);return i<0?fallback:Number(process.argv[i+1]);};
const from=arg('--from',1),to=arg('--to',60);assert.ok(Number.isInteger(from)&&Number.isInteger(to)&&from>=1&&to<=60&&from<=to);
const results=[];let failure;
for(let stage=from-1;stage<to;stage++){
 try{const g=createGame('glass','relaxed',stage+1,42),course=glassCourse(stage),{ticks,visited,actions}=driveGlassCourse(g);assert.equal(g.stagesCompleted,1);assert.equal(g.cleared,course.checkpoints.length);assert.equal(g.stage,Math.min(59,stage+1));assert.equal(g.breaks,0);results.push({stage:stage+1,world:course.world+1,length:course.route.length,checkpoints:course.checkpoints.length,ticks,actions,breaks:g.breaks,encounters:visited,result:'PASS'});console.log(`PASS ${stage+1}/60 stage dengan aksi`);}
 catch(error){failure={stage:stage+1,message:error.message};break;}
}
assert.equal(await arenaSourceHash(),sourceHash,'Sumber berubah selama pengujian; ulangi rentang ini.');
const report={result:failure?'FAIL':'PASS',sourceHash,range:[from,to],stages:results.length,checkpoints:results.reduce((sum,r)=>sum+r.checkpoints,0),results,...(failure?{failure}:{}),limitation:'Input sintetis dengan pengetahuan peta dan perencanaan formasi/waktu; tanpa teleport atau kekebalan. Bukan dua HP, playtest manusia atau benchmark performa.'};await writeFile(`src/games/glass/evidence/pacing-course-${from}-${to}.json`,JSON.stringify(report,null,2)+'\n');if(failure)throw Error(failure.message);console.log(`PASS: ${results.length} stage dengan rangkaian aksi / ${report.checkpoints} checkpoint, tanpa teleport atau kekebalan.`);
