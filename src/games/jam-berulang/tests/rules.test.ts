import test from 'node:test';import assert from 'node:assert/strict';
import server,{sampleAt,loopBudget} from '../server.ts';import {LEVELS,findTile,solid,shutterOpen,sweeperPosition} from '../levels.ts';import {fresh,tick,walk,solveCampaign,path} from '../tools/solve.ts';
test('kampanye enam peta dapat diselesaikan memakai gerak, rekam dan replay nyata',()=>{const {g,reports}=solveCampaign();assert.equal(g.completed.length,6);assert.equal(g.score,18);assert.deepEqual(reports.map(r=>r.loops),[1,2,2,2,3,4]);});
test('enam ukuran/siluet berbeda, satu spawn/tujuan dan tiga roda; pasangan gerbang lengkap',()=>{assert.equal(new Set(LEVELS.map(d=>`${d.rows[0].length}x${d.rows.length}`)).size,6);for(const d of LEVELS){assert.ok(d.rows.length>=15);for(const r of d.rows)assert.equal(r.length,d.rows[0].length);for(const c of ['S','E','a','b','c'])assert.equal([...d.rows.join('')].filter(x=>x===c).length,1);for(const [a,b] of [['P','G'],['Q','H'],['R','I']])assert.equal(d.rows.join('').includes(a),d.rows.join('').includes(b));}});
test('replay deterministik: interpolasi, hold titik akhir, dan tidak memutasi sumber',()=>{const points=[{t:0,x:0,y:1},{t:2,x:4,y:3}],before=JSON.stringify(points);assert.deepEqual(sampleAt(points,1),{t:1,x:2,y:2});assert.deepEqual(sampleAt(points,100),points[1]);assert.deepEqual(sampleAt(points,-1),points[0]);assert.equal(sampleAt([],1),null);assert.equal(JSON.stringify(points),before);});
test('pelari tidak boleh mengubah rekaman; perencana tidak boleh mengambil benda',()=>{const g=fresh();tick(g,1);for(const name of ['rewind','record','replay','trace','mark'])server.action(g,0,name);assert.equal(g.loop,1);assert.equal(g.recording,true);walk(g,findTile(0,'a')!);server.action(g,1,'interact');assert.equal(g.collected.length,0);server.action(g,0,'interact');assert.deepEqual(g.collected,['a']);});
test('benda tidak digandakan dan tetap hilang setelah loop; archive dibatasi',()=>{const g=fresh();walk(g,findTile(0,'a')!);server.action(g,0,'interact');server.action(g,0,'interact');assert.equal(g.collected.length,1);for(let i=0;i<8;i++){tick(g,1);server.action(g,1,'rewind');}assert.equal(g.traces.length,4);assert.deepEqual(g.collected,['a']);assert.equal(g.finished,false);});
test('santai tanpa deadline dan tantangan lewat tiga loop tetap bisa dilanjutkan',()=>{const relaxed=fresh();for(let i=0;i<90;i++)tick(relaxed,1);assert.equal(relaxed.loop,1);assert.ok(relaxed.clock>89);const g=fresh('challenge');for(let i=0;i<181;i++)tick(g,1);assert.equal(g.loop,4);assert.equal(g.overtime,true);assert.equal(g.finished,false);});
test('serialisasi/reconnect mempertahankan replay, benda dan progres secara deterministik',()=>{const g=fresh();tick(g,1,1,0);server.action(g,1,'record');server.action(g,1,'rewind');server.action(g,1,'replay');tick(g,.25);const restored=JSON.parse(JSON.stringify(g));for(let i=0;i<80;i++){tick(g,.025,0,1);tick(restored,.025,0,1);}assert.deepEqual(g,restored);assert.equal('timeline' in (server.privateState(g,0) as any),false);assert.ok('timeline' in (server.privateState(g,1) as any));assert.equal('draft' in (server.publicState(g) as any),false);});
test('collision menahan batas kota, kanal dan gerbang tertutup',()=>{const g=fresh();for(let i=0;i<100;i++)tick(g,.025,-1,-1);assert.ok(g.runner.x>=.7&&g.runner.y>=.7);const solved=solveCampaign().g;server.action(solved,1,'rewind');assert.equal(solved.finished,true);});
test('rekaman sesi panjang mempunyai batas sampel dan seluruh nilai tetap finite',()=>{const g=fresh();for(let i=0;i<4000;i++)tick(g,.1,i%2?1:-1,0);assert.ok(g.draft.length<=1200);assert.ok(g.draft.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.t)));server.action(g,1,'seek',NaN);server.tick(g,[{x:NaN,y:Infinity}],NaN);assert.ok(Number.isFinite(g.runner.x));assert.ok(Number.isFinite(g.cursor));});
test('rekaman terkunci tidak disambung dengan gerak yang tidak pernah direkam',()=>{const g=fresh();tick(g,1,1,0);server.action(g,1,'record');const end={...g.draft.at(-1)!};tick(g,1,0,1);server.action(g,1,'record');assert.equal(g.recording,false);assert.deepEqual(g.draft.at(-1),end);server.action(g,1,'rewind');assert.equal(g.traces[0].duration,end.t);assert.ok(g.traces[0].events.every(e=>e.t<=end.t));});
test('jendela gerbang periodik tidak menghapus kait permanen',()=>{const g=fresh();g.district=2;g.runner={...findTile(2,'P')!};g.draft=[{t:0,...g.runner}];tick(g,1);server.action(g,1,'record');server.action(g,1,'rewind');server.action(g,1,'replay');tick(g,1.1);assert.equal(g.open.includes('G'),false);for(let n=0;n<10;n++)tick(g,1);assert.equal(g.open.includes('G'),true);walk(g,findTile(2,'G')!);assert.ok(g.latched.includes('G'));server.action(g,1,'replay');for(let n=0;n<60;n++)tick(g,1);assert.equal(g.open.includes('G'),true);});

test('gerbang merupakan sambungan wajib, pelat berikutnya hanya dicapai setelah kunci sebelumnya',()=>{
 for(let district=0;district<6;district++){
  const g=fresh();g.district=district;g.runner={...findTile(district,'S')!};
  for(const [plate,gate] of LEVELS[district].objectives){
   assert.ok(path(g,findTile(district,plate)!),'pelat harus bisa dicapai');
   assert.equal(path(g,findTile(district,'E')!),null,'tidak boleh ada jalan pintas ke menara');
   g.open.push(gate);g.latched.push(gate);g.runner={...findTile(district,gate)!};
  }
  assert.ok(path(g,findTile(district,'E')!));
 }
});
test('pelat lanjut memerlukan tahan stabil; preview garis waktu tidak mengisi muatan',()=>{
 const g=fresh();g.district=1;g.runner={...findTile(1,'P')!};g.plateCharge={};tick(g,.2);assert.equal(g.open.includes('G'),false);tick(g,.5);assert.equal(g.open.includes('G'),true);
 g.runner={...findTile(1,'S')!};g.preview={t:0,...findTile(1,'P')!};tick(g,.025);assert.equal(g.open.includes('G'),false);assert.equal(g.plateCharge.G,0);
});
test('fase sekat benar-benar menahan badan, dapat ditunggu dan tidak menjebak pemain yang sudah melintas',()=>{
 const g=fresh();g.district=2;g.runner={x:16,y:14};g.open=['G'];g.latched=['G'];g.clock=0;
 for(let i=0;i<16;i++)tick(g,.025,1,0);assert.ok(g.runner.x<16.3,'sekat tertutup tidak dapat dimasuki');
 for(let i=0;i<120;i++)tick(g,.025,1,0);assert.ok(g.runner.x>18,'fase terang dapat dilintasi');
 g.runner={x:17,y:14};g.clock=7.1;for(let i=0;i<20;i++)tick(g,.025,1,0);assert.ok(g.runner.x>17.5,'keluar tetap mungkin setelah sekat menutup');
 assert.equal(shutterOpen(2,'=',1),false);assert.equal(shutterOpen(2,'=',3),true);assert.equal(shutterOpen(2,'=',13),true);
});
test('jarum dinamis mempunyai posisi deterministik dan collider badan yang sesuai',()=>{
 const g=fresh();g.district=3;g.clock=0;const o=LEVELS[3].sweepers[0],p=sweeperPosition(o,0);g.runner={x:p.x-.6,y:p.y};
 tick(g,.025,1,0);assert.ok(g.runner.x<p.x-.45);assert.deepEqual(sweeperPosition(o,0),sweeperPosition(o,o.period));
 assert.notDeepEqual(sweeperPosition(o,0),sweeperPosition(o,o.period/2));
 assert.ok(LEVELS.every(d=>d.rows.join('').includes(' ')));
});

test('sasaran medali final mengizinkan empat loop minimum tanpa overtime yang tidak terhindarkan',()=>{
 assert.equal(loopBudget(0,'challenge'),3);assert.equal(loopBudget(5,'challenge'),4);
 const g=fresh('challenge');g.district=5;g.runner={...findTile(5,'S')!};for(let n=0;n<3;n++){tick(g,1);server.action(g,1,'rewind');}assert.equal(g.loop,4);assert.equal(g.overtime,false);tick(g,1);server.action(g,1,'rewind');assert.equal(g.overtime,true);
});
