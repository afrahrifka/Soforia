import {createGlass,glassAction,tickGlass} from './glass.ts';
import {createProperty,propertyAction,tickProperty,propertyValue} from './property.ts';
import { randomInt } from 'node:crypto';
import { questions } from './questions.ts';
export const catalog = [
 {id:'orbit',title:'Orbit Berdua',tag:'PETUALANGAN KOOPERATIF',description:'Dua penjelajah. Satu perjalanan pulang. Kumpulkan cahaya dan buka gerbang bersama.',duration:'3–5 menit',icon:'✦',color:'#aaa0ff',layout:'move',instructions:'Geser pad untuk menerbangkan pesawat. Ambil 12 cahaya, lalu masing-masing tempati satu pad gerbang selama 2 detik. Dekati pasangan untuk membantu saat terkena puing.'},
 {id:'garden',title:'Kebun Berdua',tag:'TUMBUH BERSAMA',description:'Tanam sedikit kebahagiaan. Rawat kebun kecil untuk piknik kalian berdua.',duration:'5–8 menit',icon:'❀',color:'#a7d7aa',layout:'grid',instructions:'Gunakan panah untuk berjalan dan menghadap petak. Ganti alat: Bibit → Air → Keranjang. Tanam, siram, tunggu 12 detik, lalu panen dan antar ke peti di kanan bawah. Bibit berada di dua kotak kiri atas; air tersedia dari sumur.'},
 {id:'seirama',title:'Seirama',tag:'KENALI SATU SAMA LAIN',description:'Seberapa sering pikiran kalian bertemu? Tebak hal-hal kecil yang disukai pasangan.',duration:'5–10 menit',icon:'♡',color:'#edaca9',layout:'choice',instructions:'Bergantian memilih jawaban sendiri dan menebak pasangan. Pilihan tetap pribadi sampai keduanya siap mengungkap. Lewati pertanyaan kapan saja, tanpa penalti. Tidak ada penilaian kualitas hubungan.'},
 {id:'property',title:'Kota Berdua 3D',tag:'DUEL PROPERTI',description:'Bangun distrik, tingkatkan bangunan, dan atur uangmu. Duel kota mungil dalam 12 ronde.',duration:'5–10 menit',icon:'⌂',color:'#edc484',layout:'move',instructions:'Bergiliran lempar dadu. Pilih beli atau simpan uang saat singgah di properti kosong. Lengkapi tiga properti satu distrik untuk sewa ganda; singgah di properti sendiri untuk meningkatkan bangunan, maksimal dua tingkat. Festival memberi kejutan, taman memberi 55, dan melewati Alun-alun memberi 120. Setelah 12 ronde (24 giliran), uang + nilai bangunan menentukan pemenang. Tidak ada utang atau eliminasi.'},
 {id:'glass',title:'Kaca Berdua',tag:'ANGKUT KACA · 60 STAGE',description:'Satu kaca rapuh. Dua pembawa. Enam dunia, 60 stage dan 240 checkpoint untuk ditaklukkan bersama.',duration:'2–5 menit / stage',icon:'◇',color:'#a3dbe2',layout:'carry',instructions:'Antar kaca tanpa menyentuh benda padat. Analog untuk berjalan mengikuti arah kamera; Putar kiri/kanan menggulingkan kaca, Naikkan/Turunkan mengatur tinggi sisi sendiri. Tidak ada sudut wajib. Beri ruang saat melewati mobil, tiang dan pohon. Pada level lanjut, tunggu platform mendekat, naik bersama, lalu turun di tempat aman. Hindari kontak dengan palu dan kapak yang bergerak. Jeda hanya melalui tombol Jeda.'}
];
export const clamp=(n:number,a:number,b:number)=>Math.min(b,Math.max(a,n));
export function rng(seed:number){return ()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return ((t^t>>>14)>>>0)/4294967296;};}
export function createGame(id:string, mode='relaxed',level=1,seed=randomInt(2**30)):any {
 const random=rng(seed),base={id,mode,level,seed,elapsed:0,finished:false,score:0};
 if(id==='glass')return {...base,...createGlass(level-1)};
 if(id==='property')return {...base,...createProperty()};
 if(id==='orbit')return {...base,players:[{x:120,y:300,down:0,help:0,immune:0,pulse:0},{x:120,y:420,down:0,help:0,immune:0,pulse:0}],energies:Array.from({length:12},(_,i)=>({id:i,x:240+random()*730,y:90+random()*540,taken:false})),gate:0,helps:0,obstacles:level===1?[]:Array.from({length:level===2?3:5},(_,i)=>({x:460+i*110,y:160+random()*400,r:28,phase:random()*6.28})),gateOpen:true};
 if(id==='garden')return {...base,players:[{x:0,y:2,dx:1,dy:0,tool:0,crop:'carrot',carry:null,nextMove:0},{x:7,y:2,dx:-1,dy:0,tool:0,crop:'berry',carry:null,nextMove:0}],plots:Array.from({length:12},(_,i)=>({x:2+i%4,y:[1,3,4][Math.floor(i/4)],stage:'empty',crop:null,growth:0})),feedback:['Arahkan lingkaran ke petak di sebelahmu.','Arahkan lingkaran ke petak di sebelahmu.'],harvest:{carrot:0,berry:0}};
 const bank=questions.map((_,i)=>i);for(let i=bank.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[bank[i],bank[j]]=[bank[j],bank[i]];}
 return {...base,round:0,bank:bank.slice(0,8),answers:[null,null],revealReady:[false,false],nextReady:[false,false],revealed:false,skipped:false,matches:0,played:0};
}
export function nextRound(g:any){g.round++;if(g.round===8){g.finished=true;return;}g.answers=[null,null];g.revealReady=[false,false];g.nextReady=[false,false];g.revealed=false;g.skipped=false;}
export function gameAction(g:any,slot:number,name:string,value?:any){
 if(g.finished)return;
 if(g.id==='glass'){glassAction(g,slot,name,value);return;}
 if(g.id==='property'){propertyAction(g,slot,name);return;}
 if(g.id==='orbit'&&name==='use'){
  const p=g.players[slot];if(p.down||p.pulse>0)return;p.pulse=8;p.immune=Math.max(p.immune,2);
  const partner=g.players[1-slot];if(Math.hypot(p.x-partner.x,p.y-partner.y)<200){partner.immune=Math.max(partner.immune,2);if(partner.down){partner.down=0;partner.help=0;g.helps++;}}return;
 }
 if(g.id==='garden'){
  const p=g.players[slot];if(name==='tool'){p.tool=(p.tool+1)%3;return;}
  const x=p.x+p.dx,y=p.y+p.dy;
  g.feedback??=['',''];g.feedback[slot]='Arahkan lingkaran ke petak yang ingin dirawat.';
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
  const plot=g.plots.find((t:any)=>t.x===x&&t.y===y);if(!plot)return;
  if(p.carry&&p.tool===2){g.feedback[slot]='Tangan penuh. Antar hasil ke peti dahulu.';return;}
  if(p.tool===0&&plot.stage==='empty'){plot.stage='seed';plot.crop=p.crop;g.feedback[slot]='Bibit ditanam. Sekarang tekan Siram.';}
  else if(p.tool===1&&plot.stage==='seed'){plot.stage='growing';plot.growth=0;g.feedback[slot]='Sudah disiram. Tumbuh selama 12 detik.';}
  else if(p.tool===2&&plot.stage==='ripe'&&!p.carry){p.carry=plot.crop;plot.stage='empty';plot.crop=null;plot.growth=0;g.feedback[slot]='Panen berhasil! Antar ke peti kanan bawah.';}
  else g.feedback[slot]=plot.stage==='empty'?'Petak kosong: tekan Tanam.':plot.stage==='seed'?'Bibit belum disiram: tekan Siram.':plot.stage==='growing'?`Tunggu ${Math.ceil(12-plot.growth)} detik lagi, lalu Panen.`:'Tanaman matang: tekan Panen.';
 }
 if(g.id==='seirama'){
  if(name==='answer'&&!g.revealed&&g.answers[slot]===null&&Number.isInteger(value)&&value>=0&&value<4)g.answers[slot]=value;
  if(name==='reveal'&&!g.revealed&&g.answers.every((a:any)=>a!==null)){
   g.revealReady[slot]=true;if(g.revealReady.every(Boolean)){g.revealed=true;g.played++;if(g.answers[0]===g.answers[1])g.matches++;}
  }
  if(name==='skip'&&!g.revealed){g.answers=[null,null];g.skipped=true;g.revealed=true;}
  if(name==='next'&&g.revealed){g.nextReady[slot]=true;if(g.nextReady.every(Boolean))nextRound(g);}
 }
}
export function tickGame(g:any,inputs:any[],dt:number){
 if(g.finished)return;g.elapsed+=dt;
 if(g.id==='glass'){tickGlass(g,inputs,dt);return;}
 if(g.id==='property'){tickProperty(g,dt);return;}
 if(g.id==='orbit'){
  g.gateOpen=g.level<3||Math.floor(g.elapsed/8)%2===0;
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
  if(g.gate>=2)g.finished=true;
 }
 if(g.id==='garden'){
  for(const t of g.plots)if(t.stage==='growing'){t.growth+=dt;if(t.growth>=12)t.stage='ripe';}
  for(const [i,p] of g.players.entries()){
   const input=inputs[i]||{x:0,y:0};if(Math.hypot(input.x,input.y)<.3){p.nextMove=0;continue;}
   if(g.elapsed<p.nextMove)continue;
   const dx=Math.abs(input.x)>Math.abs(input.y)?Math.sign(input.x):0,dy=dx?0:Math.sign(input.y);
   p.dx=dx;p.dy=dy;const x=clamp(p.x+dx,0,7),y=clamp(p.y+dy,0,5);
   if(!g.plots.some((t:any)=>t.x===x&&t.y===y)&&!(y===0&&(x===0||x===1))&&!(x===7&&y===5)) {p.x=x;p.y=y;}
   p.nextMove=g.elapsed+(p.nextMove===0?.25:.15);
  }
 }
}
export function publicGame(g:any){
 if(!g)return null;
 if(g.id!=='seirama')return g;
 const {bank,answers,revealReady,nextReady,...pub}=g;
 return {...pub,question:questions[bank[Math.min(g.round,7)]],subject:g.round%2,answered:answers.map((a:any)=>a!==null),revealReady,nextReady,...(g.revealed&&!g.skipped?{answers:[...answers]}:{})};
}
export function privateGame(g:any,slot:number){return g?.id==='seirama'?{answer:g.answers[slot],revealReady:g.revealReady[slot],nextReady:g.nextReady[slot]}:{};}
export function result(g:any){if(g.id==='glass')return {title:g.stagesCompleted===60?'Enam dunia, satu kerja sama yang luar biasa.':'Jalur terakhir berhasil dituntaskan!',detail:`${g.stagesCompleted} stage dituntaskan · ${g.cleared} checkpoint dilalui · ${g.breaks} kaca pecah.`,stars:null};if(g.id==='property'){const values=[propertyValue(g,0),propertyValue(g,1)];return {title:values[0]===values[1]?'Kota seimbang!':`Pemain ${values[0]>values[1]?'A':'B'} memenangkan kota!`,detail:`Nilai aset A: ${values[0]} · B: ${values[1]}`};}return g.id==='seirama'?{title:'Delapan cerita kecil, satu waktu bersama.',detail:`${g.matches} tebakan sama dari ${g.played} pertanyaan yang diungkap.`}:{title:g.id==='orbit'?'Kalian membawa cahaya pulang.':'Piknik kalian sudah siap!',detail:`Selesai bersama dalam ${Math.floor(g.elapsed/60)} menit ${Math.floor(g.elapsed%60)} detik.`,stars:g.mode==='relaxed'?null:(g.elapsed<=(g.id==='orbit'?120:240)?3:g.elapsed<=(g.id==='orbit'?180:360)?2:1)};}
