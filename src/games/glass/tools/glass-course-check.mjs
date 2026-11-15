import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGame} from '../../../platform/game-runtime.ts';
import {glassCourse} from '../glass.ts';
import {driveGlassCourse} from './glass-route-driver.mjs';
const results=[];let failure;
for(let stage=0;stage<60;stage++){
 try{const g=createGame('glass','relaxed',stage+1,42),course=glassCourse(stage),{ticks,visited,actions}=driveGlassCourse(g);assert.equal(g.stagesCompleted,1);assert.equal(g.cleared,course.checkpoints.length);assert.equal(g.stage,Math.min(59,stage+1));assert.equal(g.breaks,0);results.push({stage:stage+1,world:course.world+1,length:course.route.length,checkpoints:course.checkpoints.length,ticks,actions,breaks:g.breaks,encounters:visited,result:'PASS'});if(stage%10===9)console.log(`PASS ${stage+1}/60 stage dengan aksi`);}
 catch(error){failure={stage:stage+1,message:error.message};break;}
}
await mkdir('artifacts',{recursive:true});const report={result:failure?'FAIL':'PASS',stages:results.length,checkpoints:results.reduce((sum,r)=>sum+r.checkpoints,0),results,...(failure?{failure}:{}),limitation:'Input sintetis dengan pengetahuan peta dan perencanaan formasi/waktu; tanpa teleport atau kekebalan. Bukan dua HP, playtest manusia atau benchmark performa.'};await writeFile('artifacts/glass-course-report.json',JSON.stringify(report,null,2)+'\n');await writeFile('src/games/glass/evidence/kaca-authored-course-report.json',JSON.stringify(report,null,2)+'\n');if(failure)throw Error(failure.message);console.log('PASS: 60 stage dengan aksi karakter / 246 checkpoint, platform dan rintangan kontak fisik.');
