import type {GameServer} from '../../shared/game-contracts.ts';
import {clamp} from '../../shared/random.ts';


const server:GameServer={
create(base,{random}){const {level}=base;return {...base,players:[{x:120,y:300,down:0,help:0,immune:0,pulse:0},{x:120,y:420,down:0,help:0,immune:0,pulse:0}],energies:Array.from({length:12},(_,i)=>({id:i,x:240+random()*730,y:90+random()*540,taken:false})),gate:0,helps:0,obstacles:level===1?[]:Array.from({length:level===2?3:5},(_,i)=>({x:460+i*110,y:160+random()*400,r:28,phase:random()*6.28})),gateOpen:true};},
action(g,slot,name,value:any){if(name!=='use')return;
const p=g.players[slot];
if(p.down||p.pulse>0)return;
p.pulse=8;
p.immune=Math.max(p.immune,2);
const partner=g.players[1-slot];
if(Math.hypot(p.x-partner.x,p.y-partner.y)<200){partner.immune=Math.max(partner.immune,2);if(partner.down){partner.down=0;partner.help=0;g.helps++;}}
return;},
tick(g,inputs,dt){g.gateOpen=g.level<3||Math.floor(g.elapsed/8)%2===0;
for(const [i,p] of g.players.entries()){
   p.immune=Math.max(0,p.immune-dt);p.pulse=Math.max(0,(p.pulse||0)-dt);
   if(p.down>0){p.down=Math.max(0,p.down-dt);const other=g.players[1-i];if(!other.down&&Math.hypot(p.x-other.x,p.y-other.y)<90)p.help+=dt;else p.help=0;if(p.help>=1){p.down=0;g.helps++;}if(!p.down){p.help=0;p.immune=2;}continue;}
   const input=inputs[i]||{x:0,y:0},length=Math.max(1,Math.hypot(input.x,input.y));
   p.x=clamp(p.x+input.x/length*180*dt,30,1250);p.y=clamp(p.y+input.y/length*180*dt,40,680);
   for(const e of g.energies)if(!e.taken&&Math.hypot(p.x-e.x,p.y-e.y)<30)e.taken=true;
   for(const o of g.obstacles)if(!p.immune&&Math.hypot(p.x-o.x,p.y-(o.y+Math.sin(g.elapsed+o.phase)*70))<o.r+16){p.down=3;p.help=0;}
  }
const [a,b]=g.players,pad=(p:any,y:number)=>!p.down&&Math.hypot(p.x-1140,p.y-y)<48;
if(g.energies.every((e:any)=>e.taken)&&g.gateOpen&&((pad(a,260)&&pad(b,460))||(pad(a,460)&&pad(b,260))))g.gate+=dt;else g.gate=0;
if(g.gate>=2)g.finished=true;},
publicState:g=>g,privateState:()=>({}),result:g=>({title:'Kalian membawa cahaya pulang.',detail:`Selesai bersama dalam ${Math.floor(g.elapsed/60)} menit ${Math.floor(g.elapsed%60)} detik.`,stars:g.mode==='relaxed'?null:(g.elapsed<=120?3:g.elapsed<=180?2:1)}),

};export default server;
