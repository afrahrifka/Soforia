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
  assert.equal((await fetch(app.base+'/api/operator',{method:'POST',headers:{Origin:app.base}})).status,403);
  assert.equal((await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:'http://evil.example'}})).status,403);
  const credential=await (await fetch(app.local+'/api/operator',{method:'POST',headers:{Origin:app.local}})).json();
  const display=new Client(app.local,credential.token);clients.push(display);await display.wait(()=>display.state?.pairing);
  const invitation=new URL(display.state.pairing.url).hash.slice(8);
  const join=async(name:string)=>{const r=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite:invitation,name})});assert.equal(r.status,200);const c=new Client(app.base,(await r.json()).token);clients.push(c);await c.wait(()=>c.auth.role==='player');return c;};
  const a=await join('Pemain Sintetis A'),b=await join('Pemain Sintetis B');await display.wait(()=>display.state.players.length===2);
  for(const type of ['select','menu.navigate','start','pause','reset','approve']){const count=display.messages.filter(m=>m.type==='error').length;display.send(type,{id:'garden',direction:'right'});await display.wait(()=>display.messages.filter(m=>m.type==='error').length>count);assert.equal(display.messages.filter(m=>m.type==='error').at(-1).payload.code,'DISPLAY_READ_ONLY');}
  a.send('menu.navigate',{direction:'left'});await display.wait(()=>display.state.selected==='seirama');a.send('menu.navigate',{direction:'right'});await display.wait(()=>display.state.selected==='orbit');
  const full=await fetch(app.base+'/api/join',{method:'POST',headers:{Origin:app.base,'Content-Type':'application/json'},body:JSON.stringify({invite:invitation})});assert.equal(full.status,409);
  b.send('select',{id:'garden'});await b.wait(()=>b.messages.some(m=>m.type==='error'&&m.payload.code==='ACTION_DENIED'));assert.equal(display.state.selected,'orbit');
  a.send('start');await a.wait(()=>a.state?.phase==='tutorial');await b.wait(()=>b.state?.phase==='tutorial');a.send('ready');b.send('ready');
  await a.wait(()=>a.state?.phase==='playing');const pump=setInterval(()=>{a.send('input.state',{x:1,y:0},true);b.send('input.state',{x:0,y:0},true);},33);timers.push(pump);await a.wait(()=>a.state.game.players[0].x>135);clearInterval(pump);
  await a.wait(()=>a.state.phase==='paused');assert.ok(a.state.game.players[0].x<220,'stale input must stop');
  const resumeToken=b.credential;b.close();await display.wait(()=>display.state.players[1].connected===false);
  const restored=new Client(app.base,resumeToken);clients.push(restored);await restored.wait(()=>restored.auth.role==='player');assert.equal(restored.auth.slot,1);assert.notEqual(restored.credential,resumeToken);
  await display.wait(()=>display.state.players.filter((p:any)=>p.connected).length===2);assert.equal(display.state.players.length,2);
  a.send('exit');a.send('select',{id:'seirama'});a.send('start');await a.wait(()=>a.state.phase==='tutorial');await restored.wait(()=>restored.state.phase==='tutorial');a.send('ready');restored.send('ready');await a.wait(()=>a.state.phase==='playing');
  const qpump=setInterval(()=>{a.send('input.state',{x:0,y:0},true);restored.send('input.state',{x:0,y:0},true);},50);
  timers.push(qpump);a.send('action',{name:'answer',value:3,actionSeq:1},true);await a.wait(()=>a.private?.answer===3);await display.wait(()=>display.state.game.answered[0]);assert.equal('answers' in display.state.game,false);assert.equal('answers' in restored.state.game,false);assert.equal(restored.private.answer,null);
  restored.send('action',{name:'answer',value:1,actionSeq:1},true);await display.wait(()=>display.state.game.answered.every(Boolean));a.send('action',{name:'reveal',actionSeq:2},true);await display.wait(()=>display.state.game.revealReady[0]);assert.equal('answers' in display.state.game,false);restored.send('action',{name:'reveal',actionSeq:2},true);await display.wait(()=>display.state.game.revealed);assert.deepEqual(display.state.game.answers,[3,1]);clearInterval(qpump);restored.send('home');await display.wait(()=>display.state.phase==='catalog');assert.equal(display.state.game,null);
 }finally{timers.forEach(clearInterval);clients.forEach(c=>c.close());await app.close();}
});
