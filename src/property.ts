/** Aturan dan metadata Kota Berdua; tidak mengandung state sesi atau aset jaringan. */
export const districts = [
 {name:'Pelabuhan',color:'#75c9df'}, {name:'Pasar Senja',color:'#efbd69'},
 {name:'Taman Kota',color:'#97c889'}, {name:'Bukit Bintang',color:'#b49cda'}
];
export const propertyTiles = [
 {name:'Alun-alun',kind:'start',district:-1},
 {name:'Kedai Ombak',kind:'land',district:0}, {name:'Rumah Perahu',kind:'land',district:0}, {name:'Menara Suar',kind:'land',district:0},
 {name:'Festival',kind:'event',district:-1},
 {name:'Warung Rona',kind:'land',district:1}, {name:'Pasar Lentera',kind:'land',district:1}, {name:'Kafe Senja',kind:'land',district:1},
 {name:'Taman Rehat',kind:'park',district:-1},
 {name:'Rumah Daun',kind:'land',district:2}, {name:'Kebun Atap',kind:'land',district:2}, {name:'Paviliun',kind:'land',district:2},
 {name:'Festival',kind:'event',district:-1},
 {name:'Studio Bulan',kind:'land',district:3}, {name:'Vila Aurora',kind:'land',district:3}, {name:'Observatorium',kind:'land',district:3}
] as const;
export const propertyPrice=(index:number)=>100+Math.floor(index/4)*30+(index%4-1)*20;
export const upgradePrice=(index:number)=>Math.round(propertyPrice(index)*.6);
export function districtOwned(g:any,index:number){const district=propertyTiles[index].district;return g.owners[index]>=0&&district>=0&&propertyTiles.every((tile,i)=>tile.district!==district||g.owners[i]===g.owners[index]);}
export function propertyRent(g:any,index:number){return Math.round(propertyPrice(index)*.2)*(1+g.levels[index])*(districtOwned(g,index)?2:1);}
export function propertyValue(g:any,slot:number){return g.players[slot].money+g.owners.reduce((sum:number,owner:number,i:number)=>sum+(owner===slot?propertyPrice(i)+g.levels[i]*upgradePrice(i):0),0);}
export function createProperty(){return {turn:0,moves:0,dice:0,pending:false,decision:'',stage:'ready',stageTime:0,stepsLeft:0,randomStep:0,revision:0,owners:Array(16).fill(-1),levels:Array(16).fill(0),players:[{position:0,money:650},{position:0,money:650}],history:[] as string[],message:'Pemain A · lempar dadu untuk memulai kota kalian.'};}
function record(g:any,message:string){g.message=message;g.history=[message,...g.history].slice(0,5);g.revision++;}
function endTurn(g:any){g.pending=false;g.decision='';g.moves++;g.turn=1-g.turn;g.finished=g.moves>=24;g.stage=g.finished?'finished':'ready';g.revision++;}
export function propertyAction(g:any,slot:number,name:string){
 if(g.finished||slot!==g.turn)return;
 const player=g.players[slot],index=player.position;
 if(g.stage==='decision'){
  if(!['use','tool'].includes(name))return;
  if(name==='use'){
   const cost=g.decision==='upgrade'?upgradePrice(index):propertyPrice(index);
   if(player.money<cost)return;
   player.money-=cost;
   if(g.decision==='upgrade'){g.levels[index]++;record(g,`${slot?'B':'A'} meningkatkan ${propertyTiles[index].name} · −${cost}`);}
   else{g.owners[index]=slot;record(g,`${slot?'B':'A'} membeli ${propertyTiles[index].name} · −${cost}`);}
  }else record(g,`${slot?'B':'A'} menyimpan uang dan melewati penawaran.`);
  endTurn(g);return;
 }
 if(g.stage!=='ready'||name!=='use')return;
 // PRNG per pertandingan: seed yang sama memberi urutan dadu dan kartu sama.
 g.randomStep++;let n=(g.seed+Math.imul(g.randomStep,0x9e3779b9))|0;n=Math.imul(n^(n>>>16),0x21f0aaad);n=Math.imul(n^(n>>>15),0x735a2d97);n=(n^(n>>>15))>>>0;
 g.dice=1+n%6;g.stage='rolling';g.stageTime=.65;g.stepsLeft=g.dice;g.revision++;
 g.message=`Pemain ${slot?'B':'A'} melempar dadu…`;
}
function arrive(g:any){
 const slot=g.turn,p=g.players[slot],i=p.position,tile=propertyTiles[i],owner=g.owners[i];
 if(tile.kind==='land'){
  if(owner<0&&p.money>=propertyPrice(i)){g.stage='decision';g.pending=true;g.decision='buy';record(g,`${tile.name} · beli ${propertyPrice(i)} atau simpan uang?`);return;}
  if(owner===slot&&g.levels[i]<2&&p.money>=upgradePrice(i)){g.stage='decision';g.pending=true;g.decision='upgrade';record(g,`${tile.name} · tingkatkan ${upgradePrice(i)} untuk menaikkan sewa?`);return;}
  if(owner>=0&&owner!==slot){const rent=Math.min(p.money,propertyRent(g,i));p.money-=rent;g.players[owner].money+=rent;record(g,`${slot?'B':'A'} membayar sewa ${tile.name} · ${rent} ke ${owner?'B':'A'}`);}
  else record(g,`${slot?'B':'A'} singgah di ${tile.name}${owner<0?' · uang belum cukup untuk membeli':''}.`);
 }else if(tile.kind==='event'){
  const cards=[{amount:90,text:'Festival ramai! Usaha lokal mendapat bonus'},{amount:-45,text:'Patungan merawat kota'},{amount:60,text:'Hadiah lomba taman kota'},{amount:120,text:'Pesanan besar dari pengunjung'}];
  const card=cards[(g.seed+g.randomStep*7+g.moves)%cards.length],amount=Math.max(-p.money,card.amount);p.money+=amount;record(g,`${slot?'B':'A'} · ${card.text} · ${amount>=0?'+':''}${amount}`);
 }else if(tile.kind==='park'){p.money+=55;record(g,`${slot?'B':'A'} beristirahat di taman · +55`);}
 else record(g,`${slot?'B':'A'} kembali ke Alun-alun.`);
 endTurn(g);
}
export function tickProperty(g:any,dt:number){
 if(!['rolling','moving'].includes(g.stage)||g.finished)return;
 g.stageTime-=dt;
 while(g.stageTime<=0&&['rolling','moving'].includes(g.stage)){
  if(g.stage==='rolling'){g.stage='moving';g.stageTime+=.2;g.revision++;continue;}
  const p=g.players[g.turn];p.position=(p.position+1)%16;g.stepsLeft--;g.revision++;
  if(p.position===0){p.money+=120;record(g,`${g.turn?'B':'A'} melewati Alun-alun · +120`);}
  if(g.stepsLeft===0){arrive(g);return;}g.stageTime+=.2;
 }
}
