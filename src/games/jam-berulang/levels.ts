/** Arena authored dari ruang/penghubung eksplisit; sel dipakai collision dan render. */
export type Gate='G'|'H'|'I';
export interface Sweeper {from:[number,number];to:[number,number];period:number;phase:number;radius:number}
export interface District {
 title:string;subtitle:string;hint:string;palette:string[];rows:string[];
 zone:'harbor'|'islands'|'aqueduct'|'orrery'|'archive'|'paradox';
 objectives:[string,Gate][];windows?:Partial<Record<Gate,[number,number]>>;
 hold?:Partial<Record<Gate,number>>;shutters?:Partial<Record<'='|'V',{period:number;open:[number,number]}>>;
 sweepers:Sweeper[];
}
class Arena {
 cells:string[][];
 constructor(public width:number,public height:number){this.cells=Array.from({length:height},()=>Array(width).fill(' '));}
 paint(x:number,y:number,c='.'){if(x>0&&y>0&&x<this.width-1&&y<this.height-1)this.cells[y][x]=c;return this;}
 ellipse(x:number,y:number,rx:number,ry=rx){for(let v=1;v<this.height-1;v++)for(let u=1;u<this.width-1;u++)if(((u-x)/rx)**2+((v-y)/ry)**2<=1.06)this.paint(u,v);return this;}
 path(points:[number,number][],width=1){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],n=Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]));for(let t=0;t<=n;t++)for(let u=0;u<width;u++)for(let v=0;v<width;v++)this.paint(Math.round(a[0]+(b[0]-a[0])*t/Math.max(1,n))+u,Math.round(a[1]+(b[1]-a[1])*t/Math.max(1,n))+v);}return this;}
 symbols(entries:[string,number,number][]){entries.forEach(([c,x,y])=>this.paint(x,y,c));return this;}
 rows(){return this.cells.map(row=>row.join(''));}
}
const harbor=new Arena(21,15);
for(let y=1;y<14;y++)for(let x=1;x<20;x++){const r=((x-10)/8)**2+((y-7)/5)**2;if(r<=1.12&&r>=.30)harbor.paint(x,y);}
harbor.symbols([['S',2,7],['a',10,2],['b',18,7],['c',10,12],['E',4,10],['T',5,4],['T',15,10]]);
const islands=new Arena(23,17).ellipse(4,4,3).ellipse(4,12,3).ellipse(17,9,4.8,6).path([[4,4],[4,12]]).path([[4,9],[17,9]]).symbols([['S',3,3],['P',3,13],['G',10,9],['a',4,3],['b',17,4],['c',20,12],['E',17,14],['T',17,8],['T',18,9]]);
const aqueduct=new Arena(25,19).ellipse(4,4,3).ellipse(4,14,3).ellipse(13,14,3).ellipse(21,5,3).ellipse(21,14,3).path([[4,4],[4,14],[21,14],[21,5]]).symbols([['S',3,3],['P',3,16],['G',9,14],['=',17,14],['a',4,3],['b',12,13],['c',22,4],['E',20,16],['T',13,15]]);
const orrery=new Arena(27,21).ellipse(5,10,4).ellipse(14,5,3).ellipse(14,16,3).ellipse(23,10,3).path([[5,10],[5,5],[23,5],[23,10]]).path([[14,5],[14,16],[23,16],[23,10]]).symbols([['S',3,9],['P',3,11],['G',10,5],['V',14,10],['V',23,7],['a',5,8],['b',14,17],['c',24,10],['E',21,11]]);
const archive=new Arena(25,23).ellipse(5,4,4,3).ellipse(19,4,4,3).ellipse(12,18,5,3.5).path([[5,4],[19,4],[19,12],[12,12],[12,18]]).symbols([['S',3,3],['Q',3,5],['H',12,4],['P',21,5],['G',15,12],['V',19,9],['=',12,15],['a',6,3],['b',19,3],['c',12,20],['E',9,18],['T',12,18]]);
const paradox=new Arena(29,25).ellipse(5,19,4).ellipse(5,5,3).ellipse(23,5,4).ellipse(23,19,4).ellipse(14,12,3).path([[5,19],[5,5],[23,5],[23,19],[14,19],[14,12]]).symbols([['S',3,19],['P',3,21],['G',5,12],['Q',3,4],['H',14,5],['R',25,4],['I',23,12],['V',18,5],['=',18,19],['a',5,18],['b',24,6],['c',14,11],['E',14,13]]);
export const LEVELS:District[]=[
 {title:'Pelabuhan Jarum',zone:'harbor',subtitle:'Lingkar dermaga dengan dua arah eksplorasi',hint:'Ikuti cincin dermaga: roda berada di tiga ujung berbeda. Lubang tengah bukan jalan pintas.',palette:['#b8a286','#496678','#d4a66e'],objectives:[],sweepers:[],rows:harbor.rows()},
 {title:'Kepulauan Gema',zone:'islands',subtitle:'Tiga pulau, satu diri yang ditinggalkan',hint:'P berada di pulau selatan. Kunci rekaman di P, ulang menit dan putar gema sebelum melintasi jembatan G.',palette:['#9ac8b2','#397c87','#dbbd88'],objectives:[['P','G']],hold:{G:.6},sweepers:[],rows:islands.rows()},
 {title:'Akuaduk Patah',zone:'aqueduct',subtitle:'Rangkaian tapal kuda dan jembatan berkala',hint:'G menerima P pada detik 10–34. Jembatan bercahaya = terbuka 2–7 dari tiap 10 detik. Tunggu tanda terang sebelum menyeberang.',palette:['#c4a785','#98745f','#7abac2'],objectives:[['P','G']],windows:{G:[10,34]},hold:{G:1},shutters:{'=':{period:10,open:[2,7]}},sweepers:[],rows:aqueduct.rows()},
 {title:'Planetarium Retak',zone:'orrery',subtitle:'Lintasan orbit, sekat berfase dan jarum berjalan',hint:'Rekam P untuk G. Dua cabang orbit dipisahkan sekat V: lewat pada 3–8 dari tiap 12 detik. Jarum bergerak benar-benar menghalangi jalan.',palette:['#958db8','#555783','#c6af78'],objectives:[['P','G']],windows:{G:[18,38]},hold:{G:1.5},shutters:{V:{period:12,open:[3,8]}},sweepers:[{from:[12,5],to:[16,5],period:8,phase:0,radius:.24}],rows:orrery.rows()},
 {title:'Arsip Jam Pasir',zone:'archive',subtitle:'Urutan terbalik: buka H sebelum mencari P',hint:'Q → H dahulu, baru P → G. Rekam ulang di halaman atas. Sekat V dan jembatan = berganti fase; simpan roda lintas loop.',palette:['#a990aa','#56465f','#c79b6b'],objectives:[['Q','H'],['P','G']],windows:{H:[12,32],G:[30,48]},hold:{H:1.5,G:2},shutters:{V:{period:12,open:[1,6]},'=':{period:12,open:[7,11]}},sweepers:[{from:[10,18],to:[14,18],period:9,phase:1,radius:.25}],rows:archive.rows()},
 {title:'Mahkota Paradoks',zone:'paradox',subtitle:'Spiral empat pulau dengan tiga kunci ingatan',hint:'P → G, Q → H, R → I. Tiga rekaman, tiga jendela berbeda, sekat atas dan jembatan bawah. Jarum pusat menjaga menara.',palette:['#718b9c','#536484','#e4ba77'],objectives:[['P','G'],['Q','H'],['R','I']],windows:{G:[8,24],H:[22,38],I:[40,55]},hold:{G:1.5,H:2,I:2.5},shutters:{V:{period:10,open:[2,6]},'=':{period:10,open:[6,9]}},sweepers:[{from:[12,12],to:[16,12],period:7,phase:2,radius:.26},{from:[21,19],to:[25,19],period:9,phase:0,radius:.24}],rows:paradox.rows()}
];
export const TILE=.8;
export const tileAt=(level:number,x:number,y:number)=>LEVELS[level].rows[Math.round(y)]?.[Math.round(x)]??' ';
export function findTile(level:number,symbol:string){const rows=LEVELS[level].rows;for(let y=0;y<rows.length;y++){const x=rows[y].indexOf(symbol);if(x>=0)return {x,y};}return null;}
export const solid=(c:string)=>c===' '||c==='#'||c==='~'||c==='T';
export const gatePlate=(gate:string)=>({G:'P',H:'Q',I:'R'} as Record<string,string>)[gate];
export function shutterOpen(level:number,c:string,time:number){const rule=LEVELS[level].shutters?.[c as '='|'V'];if(!rule)return true;const phase=((time%rule.period)+rule.period)%rule.period;return phase>=rule.open[0]&&phase<rule.open[1];}
export function sweeperPosition(o:Sweeper,time:number){const f=(1-Math.cos(time*2*Math.PI/o.period+o.phase))/2;return {x:o.from[0]+(o.to[0]-o.from[0])*f,y:o.from[1]+(o.to[1]-o.from[1])*f,radius:o.radius};}
export function arenaPoint(level:number,x:number,y:number){const rows=LEVELS[level].rows;return {x:(x-(rows[0].length-1)/2)*TILE,z:(y-(rows.length-1)/2)*TILE};}
