import assert from 'node:assert/strict';
import {mkdir,writeFile} from 'node:fs/promises';
import {createGame} from '../src/games.ts';
import {glassCourse} from '../src/glass.ts';
import {driveGlassCourse} from './glass-route-driver.mjs';
const results=[];let failure;
for(let stage=0;stage<60;stage++){
 try{const g=createGame('glass','relaxed',stage+1,42),course=glassCourse(stage),{ticks,visited}=driveGlassCourse(g);assert.equal(g.stageClear,true);assert.equal(g.checkpoint,4);assert.equal(g.breaks,0);results.push({stage:stage+1,world:course.world+1,length:course.route.length,checkpoints:4,ticks,breaks:g.breaks,encounters:visited,result:'PASS'});if(stage%10===9)console.log(`PASS ${stage+1}/60 stage berkelok`);}
 catch(error){failure={stage:stage+1,message:error.message};break;}
}
await mkdir('artifacts',{recursive:true});const report={result:failure?'FAIL':'PASS',stages:results.length,checkpoints:results.length*4,results,...(failure?{failure}:{}),limitation:'Input sintetis dengan pengetahuan peta dan perencanaan formasi/waktu; tanpa teleport atau kekebalan. Bukan dua HP, playtest manusia atau benchmark performa.'};await writeFile('artifacts/glass-course-report.json',JSON.stringify(report,null,2)+'\n');await writeFile('docs/evidence/kaca-winding-course-report.json',JSON.stringify(report,null,2)+'\n');if(failure)throw Error(failure.message);console.log('PASS: 60 rute dunia berkelok / 240 checkpoint, platform dan rintangan kontak fisik.');
