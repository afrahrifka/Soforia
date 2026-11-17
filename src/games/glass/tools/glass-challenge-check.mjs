// Pemeriksaan geometri encounter: bukan playtest manusia atau bukti menuntaskan rute.
import {createGame} from '../../../platform/game-runtime.ts';
import {glassCourse,glassHitsPart,bodyHitsPart,groundHeight} from '../glass.ts';
import {courseParts,corridorHalfWidth} from '../glass-world.ts';
import {routePoint,routeProject} from '../glass-route.ts';
import {GLASS_BODY_RADIUS} from '../glass-collision.ts';
import {writeFile} from 'node:fs/promises';
export function challengePose(course,s,kind='walk',offset=0){
 const p=routePoint(course.route,s,offset),yaw=p.yaw+(kind==='roll'?Math.PI/2:0),span=['raise','split'].includes(kind)?2.6:1.6,grips=kind==='duck'?[.4,.4]:kind==='raise'?[2.2,2.2]:kind==='split'?[.35,2.4]:[1.4,1.4];
 const players=[-1,1].map((side,i)=>{const x=p.x+Math.cos(yaw)*span*side,z=p.z-Math.sin(yaw)*span*side;return {x,z,y:groundHeight(course,x,z)+(kind==='jump'?.9:0),gripHeight:grips[i],lower:Math.max(0,1.4-grips[i]),grounded:kind!=='jump',support:null};});
 return {players,pane:{x:p.x,z:p.z,y:(players[0].y+players[1].y+grips[0]+grips[1])/2,yaw,roll:kind==='roll'?Math.PI/2:0,slope:Math.atan2(players[1].y+grips[1]-players[0].y-grips[0],2.4)}};
}
export function poseContacts(course,pose,time=0){const nearby=courseParts(course,time).filter(part=>Math.hypot(part.center.x-pose.pane.x,part.center.z-pose.pane.z)<9);const outside=pose.players.some(p=>{const near=routeProject(course.route,p.x,p.z);return Math.abs(near.lateral)>corridorHalfWidth(course,near.s)-GLASS_BODY_RADIUS;});return (outside?['outside-corridor']:[]).concat(nearby.filter(part=>pose.players.some(p=>bodyHitsPart(p,part))||glassHitsPart(pose,part)).map(p=>p.kind));}
export function inspectChallenges(){const failures=[],results=[];for(let stage=0;stage<60;stage++){const c=glassCourse(stage);for(const e of c.encounters.filter(e=>['roll','raise','duck','jump','split'].includes(e.kind))){const pose=challengePose(c,e.s,e.kind),contacts=poseContacts(c,pose);if(contacts.length)failures.push({stage:stage+1,kind:e.kind,s:e.s,contacts});results.push({stage:stage+1,kind:e.kind,solutionFree:contacts.length===0,defaultBlocked:poseContacts(c,challengePose(c,e.s)).length>0});}}return {results,failures};}
if(process.argv[1]?.endsWith('glass-challenge-check.mjs')){const report=inspectChallenges();await writeFile('src/games/glass/evidence/kaca-challenge-geometry-report.json',JSON.stringify({result:report.failures.length?'FAIL':'PASS',...report,limitation:'Pose geometri di encounter, bukan perjalanan input. Jalur/ketinggian nyata harus diverifikasi terpisah.'},null,2)+'\n');console.log(JSON.stringify({count:report.results.length,failures:report.failures},null,2));if(report.failures.length)process.exitCode=1;}
