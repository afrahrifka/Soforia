import {glassArenas} from './glass-arenas.ts';
/** Rangkaian tantangan orisinal. Metadata membantu authoring/uji, bukan syarat menang. */
export type GlassChallenge='roll'|'raise'|'duck'|'jump'|'split'|'hammer'|'axe'|'sweeper'|'crusher'|'traffic'|'logSwing'|'ferry'|'sideFerry'|'lift'|'stepping'|'zipper'|'threadHop'|'threadBridge'|'threadHammer'|'iris'|'scissor'|'breathing'|'weave'|'tiltWeave'|'turntable';
export type GlassSegment={name:string;challenges:GlassChallenge[]};
export type GlassLevel={name:string;biome:number;route:number;challenges:GlassChallenge[];segments:GlassSegment[];tempo:number;arena:string;headings:number[];grade:number};
const rows:[string,number,GlassChallenge[]][]=[
 ['Gang Pengiriman',0,['raise','jump','traffic','roll']],['Akar & Ranting',1,['duck','jump','logSwing','split']],['Pergantian Shift',2,['roll','crusher','raise','sweeper']],['Jembatan Embun',3,['jump','ferry','duck','axe']],['Muatan Orbit',4,['raise','traffic','roll','lift']],['Lintasan Es',5,['duck','sweeper','jump','split']],
 ['Pasar Bergerak',0,['traffic','raise','crusher','jump']],['Dua Jalur Batang',1,['split','logSwing','roll','jump']],['Pabrik Berdenyut',2,['crusher','sweeper','duck','raise']],['Dermaga Menyamping',3,['sideFerry','roll','axe','split']],['Kargo Melayang',4,['ferry','raise','traffic','roll']],['Palu di Salju',5,['hammer','jump','duck','lift']],
 ['Bongkar Muat',0,['raise','traffic','split','crusher']],['Gerbang Akar',1,['roll','duck','logSwing','jump']],['Tiga Ketukan Mesin',2,['sweeper','crusher','jump','hammer']],['Tebing Dua Tinggi',3,['split','lift','axe','roll']],['Terowongan Servis',4,['duck','roll','crusher','sideFerry']],['Rahang Beku',5,['crusher','axe','raise','jump']],
 ['Truk & Terpal',0,['traffic','duck','raise','roll']],['Batang Berayun',1,['logSwing','split','jump','axe']],['Lorong Derek',2,['raise','lift','crusher','sweeper']],['Angkut Seberang',3,['ferry','axe','sideFerry','jump']],['Palka Tekanan',4,['roll','crusher','split','traffic']],['Jurang Angin',5,['sideFerry','hammer','jump','duck']],
 ['Jadwal Silang',0,['traffic','jump','crusher','split']],['Lorong Ranting',1,['duck','roll','logSwing','split']],['Palu Berantai',2,['hammer','crusher','sweeper','jump']],['Tambang Bertingkat',3,['lift','raise','axe','ferry']],['Transfer Satelit',4,['sideFerry','traffic','roll','crusher']],['Jembatan Putih',5,['jump','ferry','hammer','split']],
 ['Jam Sibuk',0,['traffic','crusher','raise','jump']],['Dua Pembawa Satu Akar',1,['split','duck','logSwing','roll']],['Sabuk Perakitan',2,['sweeper','raise','crusher','hammer']],['Lembah Kapak',3,['axe','sideFerry','split','lift']],['Hanggar Tertutup',4,['roll','duck','traffic','crusher']],['Bongkaran Es',5,['raise','hammer','jump','sideFerry']],
 ['Gang Dua Lantai',0,['lift','traffic','roll','split']],['Hutan Mengetuk',1,['logSwing','jump','duck','hammer']],['Piston Bergantian',2,['crusher','split','sweeper','raise']],['Jejak di Tebing',3,['roll','ferry','axe','jump']],['Satelit Menyilang',4,['traffic','sideFerry','crusher','split']],['Gua Salju',5,['duck','roll','hammer','lift']],
 ['Antar Sebelum Tutup',0,['raise','crusher','traffic','roll']],['Cabang yang Patah',1,['split','logSwing','duck','jump']],['Ruang Pengujian',2,['roll','sweeper','crusher','hammer']],['Tebing Naik Turun',3,['lift','axe','ferry','split']],['Dok Gravitasi',4,['sideFerry','raise','crusher','jump']],['Lintasan Badai',5,['hammer','duck','axe','roll']],
 ['Pengiriman Rapuh',0,['split','traffic','jump','crusher']],['Rimba Berayun',1,['logSwing','roll','split','axe']],['Konser Mesin',2,['sweeper','crusher','raise','hammer']],['Dua Dermaga',3,['ferry','sideFerry','roll','lift']],['Pelabuhan Malam',4,['traffic','crusher','duck','split']],['Puncak Gletser',5,['lift','hammer','jump','roll']],
 ['Shift Terakhir',0,['traffic','raise','split','crusher','jump']],['Jantung Rimba',1,['roll','logSwing','duck','split','axe']],['Rantai Produksi',2,['crusher','sweeper','raise','hammer','jump']],['Ekspedisi Puncak',3,['ferry','lift','axe','sideFerry','split']],['Jalur Pulang Orbit',4,['roll','traffic','crusher','raise','lift']],['Kaca di Puncak',5,['split','hammer','duck','axe','jump']]
];
for(const i of [1,3,5,7,17,37,53]){const index=rows[i][2].indexOf('jump');if(index>=0)rows[i][2][index]='stepping';}
for(const i of [2,8,20,26,38,56]){const index=rows[i][2].indexOf('crusher');if(index>=0)rows[i][2][index]='zipper';}
// Komposisi per rangkaian: anchor dipadukan dengan gerak/formasi yang berbeda,
// bukan mengambil prefix daftar yang sama pada setiap kemunculan anchor.
const companions:GlassChallenge[][]=[
 ['jump','threadHop','traffic','roll','threadBridge','duck'],
 ['raise','stepping','logSwing','split','threadHammer','roll'],
 ['threadHop','duck','zipper','raise','scissor','split'],
 ['duck','threadBridge','axe','raise','iris','jump'],
 ['roll','raise','traffic','lift','breathing','threadHop'],
 ['jump','split','hammer','duck','threadBridge','raise']
];
export function encounterBudget(stage:number,index:number){const band=stage<6?[2,2,3,3]:stage<18?[2,3,3,4]:stage<36?[3,3,4,4]:stage<54?[3,4,4,5]:[3,4,5,5,6];return band[index];}
export const glassLevels:GlassLevel[]=rows.map(([name,biome,anchors],stage)=>{
 const chapter=Math.floor(stage/6),segments=anchors.map((anchor,index)=>{
  const sequence:GlassChallenge[]=[anchor];const pool=companions[(biome+index+chapter)%6];
  for(let i=1;i<encounterBudget(stage,index);i++){
   let kind=pool[(i-1+chapter)%pool.length];
   if(chapter<2&&['iris','scissor','breathing'].includes(kind))kind=['hammer','axe','crusher'][['iris','scissor','breathing'].indexOf(kind)] as GlassChallenge;
   if(sequence.at(-1)===kind)kind=i%2?'threadHop':'split';sequence.push(kind);
  }
  if(stage>=6&&index===1)sequence[1]=(['breathing','scissor','iris'] as GlassChallenge[])[chapter%3];
  if(stage>=24&&index===2)sequence[2]=(['iris','breathing','scissor'] as GlassChallenge[])[biome%3];
  if(stage>=42&&index===3)sequence[3]=(['scissor','iris','breathing'] as GlassChallenge[])[biome%3];
  if(biome===1&&index===1)sequence[sequence.length-1]='weave';
  if(stage>=6&&index===2)sequence[sequence.length-1]='tiltWeave';
  if(stage>=8&&index===3)sequence[sequence.length-1]='turntable';
  return {name:`${name} · ${glassArenas[stage][0]} ${index+1}`,challenges:sequence};
 });
 // Setiap arena mempertahankan tantangan statis dan mesin. Anchor tetap dipakai
 // sebagai pengenal lokal; jumlah encounter tidak diperlakukan sebagai keseruan.
 return {name,biome,segments,challenges:segments.flatMap(s=>s.challenges),route:stage,arena:glassArenas[stage][0],headings:glassArenas[stage][1],grade:1+chapter*.2+(biome%3)*.15,tempo:1+chapter*.025};
});
export function glassLevel(stage:number){return glassLevels[Math.max(0,Math.min(59,Math.floor(stage)))];}
export const glassMovingKinds=new Set(['platform','hammer','axe','sweeper','crusher','traffic','logSwing','zipper','iris','scissor','breathing']);
