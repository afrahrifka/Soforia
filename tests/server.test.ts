import test from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket } from 'ws';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../src/server.ts');
class Client{
 ws:WebSocket;auth:any={};state:any;private:any;messages:any[]=[];seq=0;credential:string;timer:any;
 constructor(base:string,token:string){this.credential=token;this.ws=new WebSocket(base.replace('http','ws')+'/ws',{origin:base});this.ws.on('open',()=>this.ws.send(JSON.stringify({v:1,type:'auth',payload:{token}})));this.ws.on('message',data=>{const m=JSON.parse(String(data));this.messages.push(m);if(m.type==='auth.ok'){this.auth=m.payload;this.credential=m.payload.token||this.credential;}if(m.type==='game.snapshot')this.state=m.payload;if(m.type==='private.state')this.private=m.payload;});this.timer=setInterval(()=>{if(this.ws.readyState===1)this.send('heartbeat',{sent:0});},500);}
 send(type:string,payload:any={},game=false){if(this.ws.readyState===1)this.ws.send(JSON.stringify({v:1,type,sessionId:this.auth.sessionId,connectionEpoch:this.auth.connectionEpoch,seq:++this.seq,...(game?{gameInstanceId:this.state?.gameInstanceId}:{}),payload}));}
 async wait(fn:()=>any,timeout=6500){const end=Date.now()+timeout;while(Date.now()<end){if(fn())return;await new Promise(r=>setTimeout(r,15));}throw Error('Timeout pada phase '+this.state?.phase+'; pesan terakhir '+this.messages.slice(-2).map(m=>m.type).join(','));}
 close(){clearInterval(this.timer);this.ws.close();}
}
test('Server LAN: layar read-only, pairing otomatis, D-pad, batas pemain, resume dan privasi', {timeout:30000},async()=>{
 const port=41000+Math.floor(Math.random()*10000),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1,publicDir:new URL('../dist/public',import.meta.url).pathname}),clients:Client[]=[],timers:any[]=[];
 try{
  assert.equal((await fetch(app.base+'/healthz')).status,200);
  const model=await fetch(app.base+'/assets/kenney-platformer/models/crate.glb');assert.equal(model.status,200);assert.equal(model.headers.get('content-type'),'model/gltf-binary');assert.equal(new DataView(await model.arrayBuffer()).getUint32(0,true),0x46546c67);assert.equal((await fetch(app.base+'/assets/%2e%2e%2f..%2fpackage.json')).status,404);
  assert.equal((await fetch(app.base+'/api/operator',{method:'POST',headers:{Origin:app.base}})).status,403);
  assert.equal((await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:'http://evil.example'}})).status,403);
  const credential=await (await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}})).json();
  const display=new Client(app.local,credential.token);clients.push(display);await display.wait(()=>display.state?.pairing);
  const invitation=new URL(display.state.pairing.url).hash.slice(8);
  const join=async(name:string)=>{const r=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite:invitation,name})});assert.equal(r.status,200);const c=new Client(app.base,(await r.json()).token);clients.push(c);await c.wait(()=>c.auth.role==='player');return c;};
  const a=await join('Pemain Sintetis A'),b=await join('Pemain Sintetis B');await display.wait(()=>display.state.players.length===2);
  for(const type of ['select','menu.navigate','start','pause','reset','approve']){const count=display.messages.filter(m=>m.type==='error').length;display.send(type,{id:'garden',direction:'right'});await display.wait(()=>display.messages.filter(m=>m.type==='error').length>count);assert.equal(display.messages.filter(m=>m.type==='error').at(-1).payload.code,'DISPLAY_READ_ONLY');}
  a.send('menu.navigate',{direction:'left'});await display.wait(()=>display.state.selected==='glass');a.send('menu.navigate',{direction:'right'});await display.wait(()=>display.state.selected==='orbit');
  const full=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite:invitation})});assert.equal(full.status,409);
  b.send('select',{id:'garden'});await display.wait(()=>display.state.selected==='garden');b.send('menu.navigate',{direction:'left'});await display.wait(()=>display.state.selected==='orbit');
  b.send('start');await a.wait(()=>a.state?.phase==='tutorial');await b.wait(()=>b.state?.phase==='tutorial');a.send('ready');b.send('ready');
  await a.wait(()=>a.state?.phase==='playing');const pump=setInterval(()=>{a.send('input.state',{x:1,y:0},true);b.send('input.state',{x:0,y:0},true);},33);timers.push(pump);await a.wait(()=>a.state.game.players[0].x>135);clearInterval(pump);
  await new Promise(r=>setTimeout(r,650));assert.equal(a.state.phase,'playing');assert.ok(a.state.game.players[0].x<220,'stale input must stop');
  const resumeToken=b.credential;b.close();await display.wait(()=>display.state.players[1].connected===false);
  const restored=new Client(app.base,resumeToken);clients.push(restored);await restored.wait(()=>restored.auth.role==='player');assert.equal(restored.auth.slot,1);assert.notEqual(restored.credential,resumeToken);
  await display.wait(()=>display.state.players.filter((p:any)=>p.connected).length===2);assert.equal(display.state.players.length,2);
  a.send('exit');a.send('select',{id:'seirama'});a.send('start');await a.wait(()=>a.state.phase==='tutorial');await restored.wait(()=>restored.state.phase==='tutorial');a.send('ready');restored.send('ready');await a.wait(()=>a.state.phase==='playing');
  const qpump=setInterval(()=>{a.send('input.state',{x:0,y:0},true);restored.send('input.state',{x:0,y:0},true);},50);
  timers.push(qpump);a.send('action',{name:'answer',value:3,actionSeq:1},true);await a.wait(()=>a.private?.answer===3);await display.wait(()=>display.state.game.answered[0]);assert.equal('answers' in display.state.game,false);assert.equal('answers' in restored.state.game,false);assert.equal(restored.private.answer,null);
  restored.send('action',{name:'answer',value:1,actionSeq:1},true);await display.wait(()=>display.state.game.answered.every(Boolean));a.send('action',{name:'reveal',actionSeq:2},true);await display.wait(()=>display.state.game.revealReady[0]);assert.equal('answers' in display.state.game,false);restored.send('action',{name:'reveal',actionSeq:2},true);await display.wait(()=>display.state.game.revealed);assert.deepEqual(display.state.game.answers,[3,1]);clearInterval(qpump);restored.send('home');await display.wait(()=>display.state.phase==='catalog');assert.equal(display.state.game,null);
 }finally{timers.forEach(clearInterval);clients.forEach(c=>c.close());await app.close();}
});

test('Satu controller dapat masuk dan mulai; controller kedua menyusul tanpa jeda', {timeout:15000},async()=>{
 const port=51000+Math.floor(Math.random()*1000),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1}),clients:Client[]=[];
 try{
  const response=await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}});const credential=await response.json();const display=new Client(app.local,credential.token);clients.push(display);await display.wait(()=>display.state?.pairing);
  const invite=new URL(display.state.pairing.url).hash.slice(8);
  async function join(){const response=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite})});assert.equal(response.status,200);const player=new Client(app.base,(await response.json()).token);clients.push(player);await player.wait(()=>player.auth.role==='player');return player;}
  const a=await join();a.send('start');await a.wait(()=>a.state?.phase==='tutorial');a.send('ready');await a.wait(()=>a.state?.phase==='playing');assert.equal(a.state.players.length,1);
  const b=await join();await a.wait(()=>a.state.players.length===2);assert.equal(b.auth.slot,1);assert.equal(a.state.phase,'playing');
  display.close();b.close();await a.wait(()=>!a.state.players[1].connected);await new Promise(r=>setTimeout(r,650));assert.equal(a.state.phase,'playing');
  a.send('pause');await a.wait(()=>a.state.phase==='paused');
 }finally{clients.forEach(c=>c.close());await app.close();}
});

test('Kaca: masuk stage awal, input tervalidasi dan pause menetralkan kontrol kaca', {timeout:18000},async()=>{
 const port=53000+Math.floor(Math.random()*1000),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1}),clients:Client[]=[],timers:any[]=[];
 try{
  const response=await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}}),credential=await response.json();const display=new Client(app.local,credential.token);clients.push(display);await display.wait(()=>display.state?.pairing);const invite=new URL(display.state.pairing.url).hash.slice(8);
  const join=async()=>{const response=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite})});const c=new Client(app.base,(await response.json()).token);clients.push(c);await c.wait(()=>c.auth.role==='player');return c;};
  const a=await join(),b=await join();a.send('select',{id:'glass'});await display.wait(()=>display.state.selected==='glass');assert.equal(display.state.selected,'glass');a.send('start');await a.wait(()=>a.state.phase==='tutorial');assert.equal(a.state.game.stage,0);a.send('ready');b.send('ready');await a.wait(()=>a.state.phase==='playing');
  const pump=setInterval(()=>{a.send('input.state',{x:0,y:0,glassX:.5,glassY:-.8},true);b.send('input.state',{x:0,y:0},true);},30);timers.push(pump);await a.wait(()=>a.state.game.players[0].lift>.3);
  a.send('input.state',{x:0,y:0,glassX:2,glassY:0},true);await a.wait(()=>a.messages.some(m=>m.type==='error'&&m.payload.code==='INVALID_INPUT'));clearInterval(pump);a.send('pause');await a.wait(()=>a.state.phase==='paused');assert.equal(a.state.game.players[0].lifting,false);assert.equal(a.state.game.players[0].rotating,false);
  a.send('ready');b.send('ready');await a.wait(()=>a.state.phase==='playing');assert.equal(a.state.game.players[0].lifting,false);assert.equal(a.state.game.players[0].rotating,false);
 }finally{timers.forEach(clearInterval);clients.forEach(c=>c.close());await app.close();}
});

test('Uji keyboard lokal Kaca: dua slot, validasi, kontrol, jeda dan pelepasan slot', {timeout:15000},async()=>{
 const port=55000+Math.floor(Math.random()*1000),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1});let display:Client|undefined;
 try{
  const credential=await (await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}})).json();
  display=new Client(app.local,credential.token);const d=display;await d.wait(()=>d.state?.pairing);
  const command=(command:string,extra:any={})=>d.send('dev.keyboard',{command,...extra},true);
  command('enable');await d.wait(()=>d.state.keyboard);assert.equal(d.state.players.length,2);assert.equal(d.state.selected,'glass');
  command('stage',{level:3});await d.wait(()=>d.state.level===3);command('confirm');await d.wait(()=>d.state.phase==='tutorial');command('confirm');await d.wait(()=>d.state.phase==='playing');
  command('input',{inputs:[{x:0,y:0,glassX:2,glassY:0},{x:0,y:0,glassX:0,glassY:0}]});await d.wait(()=>d.messages.some(m=>m.payload.code==='INVALID_INPUT'));
  const before=d.state.game.players.map((p:any)=>p.gripHeight);
  const pump=setInterval(()=>command('input',{inputs:[0,1].map(()=>({x:0,y:0,glassX:0,glassY:-1}))}),30);
  try{await d.wait(()=>d.state.game.players.every((p:any,i:number)=>p.gripHeight>before[i]+.1));}finally{clearInterval(pump);}
  command('neutral');await d.wait(()=>d.state.game.players.every((p:any)=>!p.lifting));
  command('action',{slot:1,name:'jump'});await d.wait(()=>!d.state.game.players[1].grounded);
  command('pause');await d.wait(()=>d.state.phase==='paused');command('confirm');await d.wait(()=>d.state.phase==='playing');
  command('home');await d.wait(()=>d.state.phase==='catalog');command('disable');await d.wait(()=>!d.state.keyboard);assert.equal(d.state.players.length,0);
 }finally{display?.close();await app.close();}
});

test('QR permainan hanya dapat dinyalakan host dan tertutup setelah pemain kedua bergabung', {timeout:12000},async()=>{
 const port=56500+Math.floor(Math.random()*400),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1});const clients:Client[]=[];
 try{
  const credential=await (await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}})).json();const d=new Client(app.local,credential.token);clients.push(d);await d.wait(()=>d.state?.pairing);
  const invite=new URL(d.state.pairing.url).hash.slice(8);
  async function join(){const r=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite})});const p=new Client(app.base,(await r.json()).token);clients.push(p);await p.wait(()=>p.auth.role==='player');return p;}
  const a=await join();a.send('start');await d.wait(()=>d.state.phase==='tutorial');assert.equal(d.state.qrVisible,false);
  a.send('pairing.toggle');await d.wait(()=>d.state.qrVisible);assert.equal(d.state.phase,'tutorial');a.send('pairing.toggle');await d.wait(()=>!d.state.qrVisible);
  a.send('pairing.toggle');await d.wait(()=>d.state.qrVisible);const b=await join();await d.wait(()=>d.state.players.length===2&&!d.state.qrVisible);
  b.send('pairing.toggle');await b.wait(()=>b.messages.some(m=>m.type==='error'&&m.payload.code==='ACTION_DENIED'));assert.equal(d.state.qrVisible,false);
  d.send('pairing.toggle');await d.wait(()=>d.messages.some(m=>m.payload.code==='DISPLAY_READ_ONLY'));
 }finally{clients.forEach(c=>c.close());await app.close();}
});

test('Koneksi macet, pemulihan identitas dan scan ulang mengisi slot terputus tanpa pemain ganda', {timeout:18000},async()=>{
 const port=57000+Math.floor(Math.random()*300),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1});const clients:Client[]=[];
 try{
  const credential=await (await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}})).json();const d=new Client(app.local,credential.token);clients.push(d);await d.wait(()=>d.state?.pairing);const invite=new URL(d.state.pairing.url).hash.slice(8);
  const recovery='synthetic-recovery-device-key-0000000000000000000';
  async function join(extra:any={}){const r=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite,...extra})});assert.equal(r.status,200);const p=new Client(app.base,(await r.json()).token);clients.push(p);await p.wait(()=>p.auth.role==='player');return p;}
  const a=await join({recoveryToken:recovery}),b=await join();const oldId=a.state.you.id;
  a.send('select',{level:60,mode:'challenge'});await a.wait(()=>a.messages.some(m=>m.payload.code==='DEVELOPER_ONLY'));assert.equal(a.state.level,1);assert.equal(a.state.mode,'relaxed');
  a.send('start');await a.wait(()=>a.state.phase==='tutorial');a.send('ready');b.send('ready');await a.wait(()=>a.state.phase==='playing');const instance=a.state.gameInstanceId;
  // A berhenti mengirim meski socket masih OPEN: server harus mendeteksi heartbeat hilang.
  clearInterval(a.timer);await d.wait(()=>!d.state.players[0].connected);assert.equal(d.state.phase,'playing');assert.equal(d.state.players.length,2);assert.equal(d.state.pairing.open,true);
  const restored=new Client(app.base,recovery);clients.push(restored);await restored.wait(()=>restored.auth.role==='player');assert.equal(restored.auth.slot,0);assert.equal(restored.state.you.id,oldId);assert.equal(restored.state.gameInstanceId,instance);
  b.close();await d.wait(()=>!d.state.players[1].connected);restored.send('pairing.toggle');await d.wait(()=>d.state.qrVisible&&d.state.pairing.open);
  const replacement=await join();assert.equal(replacement.auth.slot,1);assert.equal(replacement.state.gameInstanceId,instance);assert.equal(replacement.state.phase,'playing');await d.wait(()=>d.state.players.every((p:any)=>p.connected));assert.equal(d.state.players.length,2);assert.equal(d.state.qrVisible,false);
  const full=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite})});assert.equal(full.status,409);
  // Identitas browser yang sama dapat scan ulang walaupun sesi penuh.
  const same=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite,recoveryToken:recovery})});assert.equal(same.status,200);
 }finally{clients.forEach(c=>c.close());await app.close();}
});

test('Pengganti slot QR tidak memperoleh jawaban privat Seirama perangkat sebelumnya', {timeout:12000},async()=>{
 const port=57400+Math.floor(Math.random()*200),app=await startServer({host:'127.0.0.1',port,operatorPort:port+1});const clients:Client[]=[];
 try{
  const credential=await (await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}})).json();const d=new Client(app.local,credential.token);clients.push(d);await d.wait(()=>d.state?.pairing);const invite=new URL(d.state.pairing.url).hash.slice(8);
  async function join(){const r=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite})});assert.equal(r.status,200);const p=new Client(app.base,(await r.json()).token);clients.push(p);await p.wait(()=>p.auth.role==='player');return p;}
  const a=await join(),b=await join();a.send('select',{id:'seirama'});a.send('start');await a.wait(()=>a.state.phase==='tutorial');await b.wait(()=>b.state.phase==='tutorial');a.send('ready');b.send('ready');await b.wait(()=>b.state.phase==='playing');b.send('action',{name:'answer',value:2,actionSeq:1},true);await b.wait(()=>b.private?.answer===2);const oldToken=b.credential;b.close();await d.wait(()=>!d.state.players[1].connected);const next=await join();await next.wait(()=>next.private?.answer===null);assert.equal(next.auth.slot,1);assert.equal(next.state.game.answered[1],false);
  const stale=new Client(app.base,oldToken);clients.push(stale);await new Promise<void>(r=>stale.ws.once('close',()=>r()));assert.equal(stale.auth.role,undefined);
 }finally{clients.forEach(c=>c.close());await app.close();}
});
