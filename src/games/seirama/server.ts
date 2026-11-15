import type {GameServer} from '../../shared/game-contracts.ts';
import {clamp} from '../../shared/random.ts';
import {questions} from './questions.ts';
function nextRound(g:any){g.round++;if(g.round===8){g.finished=true;return;}g.answers=[null,null];g.revealReady=[false,false];g.nextReady=[false,false];g.revealed=false;g.skipped=false;}
function publicState(g:any){
 if(!g)return null;
 const {bank,answers,revealReady,nextReady,...pub}=g;
 return {...pub,question:questions[bank[Math.min(g.round,7)]],subject:g.round%2,answered:answers.map((a:any)=>a!==null),revealReady,nextReady,...(g.revealed&&!g.skipped?{answers:[...answers]}:{})};
}
const server:GameServer={
create(base,{random}){const {level}=base;const bank=questions.map((_,i)=>i);
for(let i=bank.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]];}
return {...base,round:0,bank:bank.slice(0,8),answers:[null,null],revealReady:[false,false],nextReady:[false,false],revealed:false,skipped:false,matches:0,played:0};},
action(g,slot,name,value:any){if(name==='answer'&&!g.revealed&&g.answers[slot]===null&&Number.isInteger(value)&&value>=0&&value<4)g.answers[slot]=value;
if(name==='reveal'&&!g.revealed&&g.answers.every((a:any)=>a!==null)){
   g.revealReady[slot]=true;if(g.revealReady.every(Boolean)){g.revealed=true;g.played++;if(g.answers[0]===g.answers[1])g.matches++;}
  }
if(name==='skip'&&!g.revealed){g.answers=[null,null];g.skipped=true;g.revealed=true;}
if(name==='next'&&g.revealed){g.nextReady[slot]=true;if(g.nextReady.every(Boolean))nextRound(g);}},
tick(g,inputs,dt){},
publicState:publicState,privateState:(g,slot)=>({answer:g.answers[slot],revealReady:g.revealReady[slot],nextReady:g.nextReady[slot]}),result:g=>({title:'Delapan cerita kecil, satu waktu bersama.',detail:`${g.matches} tebakan sama dari ${g.played} pertanyaan yang diungkap.`}),
controllerReplaced(g,slot){if(!g.revealed){g.answers[slot]=null;g.revealReady=[false,false];}g.nextReady[slot]=false;}
};export default server;
