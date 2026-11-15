import type {GameServer} from '../../shared/game-contracts.ts';
import {clamp} from '../../shared/random.ts';


const server:GameServer={
create(base,{random}){const {level}=base;return {...base,players:[{x:0,y:2,dx:1,dy:0,tool:0,crop:'carrot',carry:null,nextMove:0},{x:7,y:2,dx:-1,dy:0,tool:0,crop:'berry',carry:null,nextMove:0}],plots:Array.from({length:12},(_,i)=>({x:2+i%4,y:[1,3,4][Math.floor(i/4)],stage:'empty',crop:null,growth:0})),feedback:['Arahkan lingkaran ke petak di sebelahmu.','Arahkan lingkaran ke petak di sebelahmu.'],harvest:{carrot:0,berry:0}};},
action(g,slot,name,value:any){const p=g.players[slot];
if(name==='tool'){p.tool=(p.tool+1)%3;return;}
const x=p.x+p.dx,y=p.y+p.dy;
g.feedback??=['',''];
g.feedback[slot]='Arahkan lingkaran ke petak yang ingin dirawat.';
if(['plant','water','harvest'].includes(name)){
   if(x===7&&y===5){g.feedback[slot]='Peti panen: gunakan Antar saat membawa hasil.';return;}
   p.tool={plant:0,water:1,harvest:2}[name];name='use';
  }else if(name==='deposit'){
   if(x!==7||y!==5){g.feedback[slot]='Dekati peti kanan bawah dan arahkan lingkaran ke peti.';return;}
   name='use';
  }
if(name!=='use')return;
if(y===0&&(x===0||x===1)){p.crop=x===0?'carrot':'berry';g.feedback[slot]=`Bibit ${p.crop==='berry'?'stroberi':'wortel'} dipilih. Kembali ke petak kosong.`;return;}
if(x===7&&y===5&&p.carry){g.harvest[p.carry]++;g.feedback[slot]='Panen diantar! Bantu siapkan sisanya.';p.carry=null;g.finished=g.harvest.carrot>=6&&g.harvest.berry>=6;return;}
const plot=g.plots.find((t:any)=>t.x===x&&t.y===y);
if(!plot)return;
if(p.carry&&p.tool===2){g.feedback[slot]='Tangan penuh. Antar hasil ke peti dahulu.';return;}
if(p.tool===0&&plot.stage==='empty'){plot.stage='seed';plot.crop=p.crop;g.feedback[slot]='Bibit ditanam. Sekarang tekan Siram.';}
  else if(p.tool===1&&plot.stage==='seed'){plot.stage='growing';plot.growth=0;g.feedback[slot]='Sudah disiram. Tumbuh selama 12 detik.';}
  else if(p.tool===2&&plot.stage==='ripe'&&!p.carry){p.carry=plot.crop;plot.stage='empty';plot.crop=null;plot.growth=0;g.feedback[slot]='Panen berhasil! Antar ke peti kanan bawah.';}
  else g.feedback[slot]=plot.stage==='empty'?'Petak kosong: tekan Tanam.':plot.stage==='seed'?'Bibit belum disiram: tekan Siram.':plot.stage==='growing'?`Tunggu ${Math.ceil(12-plot.growth)} detik lagi, lalu Panen.`:'Tanaman matang: tekan Panen.';},
tick(g,inputs,dt){for(const t of g.plots)if(t.stage==='growing'){t.growth+=dt;if(t.growth>=12)t.stage='ripe';}
for(const [i,p] of g.players.entries()){
   const input=inputs[i]||{x:0,y:0};if(Math.hypot(input.x,input.y)<.3){p.nextMove=0;continue;}
   if(g.elapsed<p.nextMove)continue;
   const dx=Math.abs(input.x)>Math.abs(input.y)?Math.sign(input.x):0,dy=dx?0:Math.sign(input.y);
   p.dx=dx;p.dy=dy;const x=clamp(p.x+dx,0,7),y=clamp(p.y+dy,0,5);
   if(!g.plots.some((t:any)=>t.x===x&&t.y===y)&&!(y===0&&(x===0||x===1))&&!(x===7&&y===5)) {p.x=x;p.y=y;}
   p.nextMove=g.elapsed+(p.nextMove===0?.25:.15);
  }},
publicState:g=>g,privateState:()=>({}),result:g=>({title:'Piknik kalian sudah siap.',detail:`Selesai bersama dalam ${Math.floor(g.elapsed/60)} menit ${Math.floor(g.elapsed%60)} detik.`,stars:g.mode==='relaxed'?null:(g.elapsed<=240?3:g.elapsed<=360?2:1)}),

};export default server;
