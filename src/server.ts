import {neutralGlass} from './glass.ts';
import http from 'node:http';
import { networkInterfaces } from 'node:os';
import { randomBytes, randomInt, createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { resolve, extname, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { WebSocketServer, WebSocket } from 'ws';
import QRCode from 'qrcode';
import { catalog, createGame, tickGame, gameAction, publicGame, privateGame, result } from './games.ts';
const token=()=>randomBytes(24).toString('hex'),hash=(s:string)=>createHash('sha256').update(s).digest('hex');
const option=(name:string,fallback:string)=>{const i=process.argv.indexOf('--'+name);return i<0?fallback:process.argv[i+1];};
export function lanAddresses(){return Object.entries(networkInterfaces()).filter(([n])=>!/^(lo|tailscale|docker|br-|veth|tun|wg)/.test(n)).flatMap(([name,entries])=>(entries||[]).filter(e=>e.family==='IPv4'&&!e.internal&&(/^(10\.|192\.168\.)/.test(e.address)||/^172\.(1[6-9]|2\d|3[01])\./.test(e.address))).map(e=>({name,address:e.address})));}
export async function startServer(options:any={}){
 const addresses=lanAddresses(),host=options.host||option('host',addresses[0]?.address||'127.0.0.1'),port=Number(options.port??option('port','3210')),operatorPort=Number(options.operatorPort??option('operator-port',String(port+1)));
 if(!Number.isInteger(port)||port<1024||port>65534||!Number.isInteger(operatorPort)||operatorPort<1024||operatorPort>65535||operatorPort===port)throw Error('Port harus berbeda, antara 1024 dan 65535.');
 if(host!=='127.0.0.1'&&!addresses.some(a=>a.address===host))throw Error('Pilih --host dari IP LAN laptop, bukan alamat VPN atau interface publik.');
 const base=`http://${host}:${port}`,local=`http://127.0.0.1:${operatorPort}`,allowed=new Set([new URL(base).host,new URL(local).host]);
 const sessionId=token(),operatorToken=token(),players:any[]=[],pending:any[]=[],clients=new Set<any>(),inputs:any[]=[{x:0,y:0,glassX:0,glassY:0},{x:0,y:0,glassX:0,glassY:0}],limits=new Map<string,any>();
 let invite=token(),code=String(randomInt(100000,1000000)),pairUntil=performance.now()+300000,phase='catalog',selected='orbit',mode='relaxed',level=1,game:any=null,countdown=0,reason='',wasPaused=false,qrVisible=false,display:any=null,tick=0,previous=performance.now(),snapshotSeq=0,actionQueue:any[]=[];
 const root=options.publicDir||resolve(dirname(fileURLToPath(import.meta.url)),'public');
 function send(ws:any,type:string,payload:any){if(ws?.readyState===WebSocket.OPEN){if(ws.bufferedAmount>256*1024){ws.terminate();return;}ws.send(JSON.stringify({v:1,type,payload}));}}
 const connectedPlayer=(p:any)=>p.ws?.readyState===WebSocket.OPEN&&(p.keyboard||performance.now()-p.lastSeen<=3500);
 function disconnectPlayer(p:any){if(!p.ws)return;const old=p.ws;p.ws=null;p.ready=false;p.disconnectedAt=performance.now();neutralPlayer(p.slot);old.terminate();}
 function expireConnections(){for(const p of players)if(!p.keyboard&&p.ws&&!connectedPlayer(p))disconnectPlayer(p);}
 const availableSlot=()=>{const reserved=new Set(pending.map(p=>p.slot));for(let slot=0;slot<Math.min(2,players.length+1);slot++)if(!reserved.has(slot)&&(!players[slot]||!connectedPlayer(players[slot])))return slot;return -1;};
 function active(){return players.length>=1&&players.every(p=>p.ws?.readyState===WebSocket.OPEN&&performance.now()-p.lastSeen<3000);}
 function neutral(){neutralGlass(game);inputs.forEach(i=>{i.x=0;i.y=0;i.glassX=0;i.glassY=0;});}
 function neutralPlayer(slot:number,clearActions=true){inputs[slot]={x:0,y:0,glassX:0,glassY:0};if(game?.id==='glass'){const p=game.players[slot];p.lifting=false;p.rotating=false;p.jump=false;}if(clearActions)actionQueue=actionQueue.filter(a=>a.slot!==slot);}
 function pause(why:string){if(['playing','countdown','tutorial'].includes(phase)){wasPaused=phase==='playing'||(phase==='countdown'&&wasPaused);phase='paused';reason=why;neutral();actionQueue=[];players.forEach(p=>p.ready=false);}}
 function snapshot(ws:any){
  const p=ws.player;
  const pub:any={sessionId,phase,selected,mode,level,qrVisible,countdown:Math.ceil(countdown),reason,catalog,gameInstanceId:game?.instanceId||null,game:publicGame(game),result:game?.finished?result(game):null,keyboard:players.some(p=>p.keyboard),players:players.map(p=>({id:p.id,slot:p.slot,name:p.name,connected:connectedPlayer(p),ready:p.ready})),serverTick:tick,snapshotSeq:++snapshotSeq};
  
  if(ws.role==='display'){pub.pairing={url:`${base}/join#invite=${invite}`,manualUrl:`${base}/join`,code,open:performance.now()<pairUntil&&availableSlot()>=0,seconds:Math.max(0,Math.ceil((pairUntil-performance.now())/1000))};pub.network={base,addresses,local};}
  if(p)pub.you={id:p.id,slot:p.slot,host:p.slot===0};
  send(ws,'game.snapshot',pub);
  if(p)send(ws,'private.state',privateGame(game,p.slot));
 }
 function broadcast(){for(const ws of clients)if(ws.role==='display'||ws.player)snapshot(ws);}
 function fail(ws:any,code:string,message:string){send(ws,'error',{code,message});}
 const hostOnly=(ws:any)=>ws.role==='player'&&ws.player?.slot===0;
 function reset(){qrVisible=false;for(const p of players)p.ws?.close(4000,'Sesi diakhiri');for(const p of pending)p.ws?.close(4000,'Sesi diakhiri');players.length=0;pending.length=0;game=null;phase='catalog';actionQueue=[];neutral();invite=token();code=String(randomInt(100000,1000000));pairUntil=performance.now()+300000;}
 async function handler(req:any,res:any){
  const origin=req.headers.origin;
  const security={'Content-Security-Policy':"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' blob:; font-src 'self'; object-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer','Cache-Control':'no-store'};
  function respond(status:number,data:any){res.writeHead(status,{...security,'Content-Type':'application/json'});res.end(JSON.stringify(data));}
  if(!allowed.has(req.headers.host)||(origin&&origin!==`http://${req.headers.host}`)){respond(403,{error:'ORIGIN_REJECTED',message:'Alamat atau origin tidak diizinkan.'});return;}
  const path=new URL(req.url,base).pathname;
  if(req.method==='GET'&&path==='/healthz'){respond(200,{ok:true,version:'0.1.0-beta.3'});return;}
  if(req.method==='GET'&&path==='/api/info'){respond(200,{base,catalog});return;}
  if(req.method==='POST'&&path==='/api/operator'){
   if(req.socket.localPort!==operatorPort||origin!==local){respond(403,{error:'LOCAL_ONLY'});return;}respond(200,{token:operatorToken});return;
  }
  if(req.method==='GET'&&path==='/api/qr'){
   // Undangan hanya tersedia dari endpoint operator loopback.
   if(req.socket.localPort!==operatorPort){respond(403,{error:'LOCAL_ONLY'});return;}
   const svg=await QRCode.toString(`${base}/join#invite=${invite}`,{type:'svg',margin:1,color:{dark:'#172123',light:'#ffffff'},width:240});res.writeHead(200,{...security,'Content-Type':'image/svg+xml'});res.end(svg);return;
  }
  if(req.method==='POST'&&path==='/api/join'){
   if(origin!==`http://${req.headers.host}`){respond(403,{error:'ORIGIN_REJECTED'});return;}
   const now=performance.now(),ip=req.socket.remoteAddress;let limit=limits.get(ip);if(!limit||now-limit.start>60000){limit={start:now,count:0};limits.set(ip,limit);}let global=limits.get('*');if(!global||now-global.start>60000){global={start:now,count:0};limits.set('*',global);}if(++limit.count>5||++global.count>30){respond(429,{message:'Terlalu banyak percobaan. Tunggu satu menit.'});return;}
   let raw='';try{for await(const chunk of req){raw+=chunk;if(Buffer.byteLength(raw)>4096){respond(413,{message:'Data terlalu besar.'});return;}}const body=JSON.parse(raw);
    expireConnections();
    const recoveryKey=typeof body.recoveryToken==='string'&&body.recoveryToken.length>=32?hash(body.recoveryToken):null;
    if(recoveryKey&&players.some(p=>p.recoveryHash===recoveryKey)){respond(200,{token:body.recoveryToken});return;}
    if(now>pairUntil){respond(409,{message:'Undangan telah berubah. Scan QR terbaru.'});return;}
    if(availableSlot()<0){respond(409,{message:'Dua slot masih aktif atau sedang menyambung. Jika HP baru terputus, tunggu sekitar 4 detik lalu scan lagi.'});return;}
    if(typeof body.invite!=='string'&&typeof body.code!=='string'){respond(400,{message:'Scan QR atau masukkan kode.'});return;}
    if(body.invite!==invite&&body.code!==code){respond(401,{message:'Kode salah atau QR sudah berubah.'});return;}
    if(availableSlot()<0){respond(409,{message:'Dua controller sudah terhubung atau sedang menyambung.'});return;}
    const name=String(body.name||'').trim().slice(0,20),credential=token(),p={id:token(),slot:availableSlot(),name,hash:hash(credential),recoveryHash:recoveryKey,created:now,ws:null};pending.push(p);respond(200,{token:credential});broadcast();
   }catch{respond(400,{message:'Format permintaan tidak valid.'});}return;
  }
  if(req.method!=='GET'&&req.method!=='HEAD'){respond(405,{error:'METHOD_NOT_ALLOWED'});return;}
  let file=['/','/console','/join','/controller'].includes(path)?'index.html':path.slice(1);
  try{file=decodeURIComponent(file);}catch{respond(400,{error:'INVALID_PATH'});return;}
  const assetPath=resolve(root,file),assetRoot=resolve(root,'assets');const isAsset=file.startsWith('assets/')&&assetPath.startsWith(assetRoot+'/')&&/\.(gltf|glb|bin|png|jpg|jpeg|json|txt|md)$/i.test(file);
  if(!isAsset&&!['index.html','app.js','style.css','favicon.svg'].includes(file)){respond(404,{error:'NOT_FOUND'});return;}
  try{const data=await readFile(resolve(root,file));res.writeHead(200,{...security,...(isAsset?{'Cache-Control':'public, max-age=86400'}:{}),'Content-Type':({'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css','.svg':'image/svg+xml','.gltf':'model/gltf+json','.glb':'model/gltf-binary','.bin':'application/octet-stream','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.json':'application/json','.txt':'text/plain; charset=utf-8','.md':'text/plain; charset=utf-8'} as any)[extname(file)]||'application/octet-stream'});res.end(req.method==='HEAD'?undefined:data);}catch{respond(404,{message:'Build belum tersedia. Jalankan npm run build.'});}
 }
 const server=http.createServer((req,res)=>{handler(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();});});
 const operator=http.createServer((req,res)=>{handler(req,res).catch(()=>{if(!res.headersSent)res.writeHead(500);res.end();});});
 const wss=new WebSocketServer({noServer:true,maxPayload:8192,perMessageDeflate:false});
 function upgrade(req:any,socket:any,head:any){if(req.url!=='/ws'||!allowed.has(req.headers.host)||req.headers.origin!==`http://${req.headers.host}`){socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');socket.destroy();return;}wss.handleUpgrade(req,socket,head,ws=>wss.emit('connection',ws,req));}
 server.on('upgrade',upgrade);operator.on('upgrade',upgrade);
 wss.on('connection',(raw,req)=>{
  const ws:any=raw;clients.add(ws);ws.lastSeq=-1;ws.lastSeen=performance.now();ws.bucket={start:performance.now(),count:0};
  const deadline=setTimeout(()=>{if(!ws.role)ws.close(4001,'Autentikasi diperlukan');},3000);
  ws.on('message',(buffer:any)=>{
   try{
    const m=JSON.parse(buffer.toString());if(m?.v!==1||typeof m.type!=='string'||!m.payload||typeof m.payload!=='object'||Array.isArray(m.payload)){fail(ws,'INVALID_INPUT','Pesan tidak valid atau versi berbeda.');return;}
    const now=performance.now();if(now-ws.bucket.start>1000)ws.bucket={start:now,count:0};if(++ws.bucket.count>160){ws.close(4008,'Terlalu banyak pesan');return;}
    if(m.type==='auth'&&!ws.role){
     if(typeof m.payload.token!=='string'){ws.close(4001);return;}const key=hash(m.payload.token);
     if(key===hash(operatorToken)&&req.socket.localPort===operatorPort){if(display&&display!==ws)display.close(4003,'Layar dibuka kembali');ws.role='display';display=ws;send(ws,'auth.ok',{role:'display',sessionId});}
     else {
      let p=players.find(p=>p.resumeHash===key||p.recoveryHash===key)||(typeof m.payload.recoveryToken==='string'&&m.payload.recoveryToken.length>=32?players.find(p=>p.recoveryHash===hash(m.payload.recoveryToken)):undefined);
      if(p){if(!p.recoveryHash&&typeof m.payload.recoveryToken==='string'&&m.payload.recoveryToken.length>=32)p.recoveryHash=hash(m.payload.recoveryToken);const old=p.ws;p.ws=ws;p.epoch++;p.lastSeen=now;p.lastInput=now;p.disconnectedAt=null;p.ready=false;qrVisible=false;neutralPlayer(p.slot);ws.player=p;ws.role='player';const next=token();p.resumeHash=hash(next);send(ws,'auth.ok',{role:'player',token:next,sessionId,connectionEpoch:p.epoch,slot:p.slot,lastAction:p.lastAction});if(old&&old!==ws)old.close(4003,'Koneksi digantikan');}
      else {
       const index=pending.findIndex(p=>p.hash===key);if(index<0){ws.close(4001,'Sesi tidak berlaku, scan ulang QR');return;}
       const candidate=pending.splice(index,1)[0],previousPlayer=players[candidate.slot];
       if(previousPlayer&&connectedPlayer(previousPlayer)){ws.close(4001,'Slot sudah tersambung. Scan QR terbaru.');return;}
       const next=token();p={id:candidate.id,name:candidate.name||('Pemain '+(candidate.slot===0?'A':'B')),slot:candidate.slot,ws,epoch:(previousPlayer?.epoch||0)+1,resumeHash:hash(next),recoveryHash:candidate.recoveryHash,lastSeen:now,lastInput:now,disconnectedAt:null,ready:false,actions:new Set(),lastAction:0};
       // Pemindahan slot melalui QR tidak boleh membuka jawaban privat perangkat lama.
       if(previousPlayer&&game?.id==='seirama'){if(!game.revealed){game.answers[p.slot]=null;game.revealReady=[false,false];}game.nextReady[p.slot]=false;}
       neutralPlayer(p.slot);players[p.slot]=p;qrVisible=false;ws.player=p;ws.role='player';send(ws,'auth.ok',{role:'player',token:next,sessionId,connectionEpoch:p.epoch,slot:p.slot,lastAction:0});
      }
     }clearTimeout(deadline);broadcast();return;
    }
    if(!ws.role){fail(ws,'AUTH_REQUIRED','Scan QR untuk menyambungkan controller.');return;}
    if(ws.player&&ws.player.ws!==ws){ws.close(4003,'Koneksi digantikan');return;}
    if(m.type==='heartbeat'){ws.lastSeen=now;if(ws.player)ws.player.lastSeen=now;send(ws,'pong',{sent:m.payload.sent});return;}
    if(m.sessionId!==sessionId||!Number.isSafeInteger(m.seq)||m.seq<=ws.lastSeq||(ws.player&&m.connectionEpoch!==ws.player.epoch)){fail(ws,'STALE_CONNECTION','Koneksi tidak berlaku. Muat ulang controller.');return;}ws.lastSeq=m.seq;ws.lastSeen=now;if(ws.player)ws.player.lastSeen=now;
    // Mode uji lokal: hanya display terautentikasi, slot terpisah dari controller HP.
    if(ws.role==='display'&&m.type==='dev.keyboard'){
     const body=m.payload,enabled=players.some(p=>p.keyboard);
     if(body.command==='enable'){
      if(phase!=='catalog'||players.length||pending.length){fail(ws,'KEYBOARD_BUSY','Mode keyboard memerlukan katalog dan slot pemain kosong.');return;}
      for(let slot=0;slot<2;slot++)players.push({id:token(),slot,name:'Keyboard '+(slot?'B':'A'),keyboard:true,ws,ready:false,lastInput:now,lastSeen:now});
      selected='glass';level=1;neutral();broadcast();return;
     }
     if(!enabled)return;
     if(body.command==='disable'){players.length=0;game=null;phase='catalog';neutral();actionQueue=[];broadcast();return;}
     if(body.command==='home'){game=null;phase='catalog';neutral();actionQueue=[];broadcast();return;}
     if(body.command==='stage'&&phase==='catalog'&&Number.isInteger(body.level)&&body.level>=1&&body.level<=60){level=body.level;broadcast();return;}
     if(body.command==='confirm'){
      if(['catalog','results'].includes(phase)){game=createGame('glass',mode,level);game.instanceId=token();phase='tutorial';neutral();}
      else if(['tutorial','paused'].includes(phase)){wasPaused=phase==='paused'&&wasPaused;phase='countdown';countdown=3;neutral();}
      broadcast();return;
     }
     if(body.command==='pause'){pause('Uji keyboard dijeda. Enter untuk melanjutkan.');broadcast();return;}
     if(body.command==='neutral'){neutral();actionQueue=[];return;}
     if(phase!=='playing'||m.gameInstanceId!==game?.instanceId)return;
     if(body.command==='input'&&Array.isArray(body.inputs)&&body.inputs.length===2&&body.inputs.every((i:any)=>i&&['x','y','glassX','glassY'].every(k=>typeof i[k]==='number'&&Number.isFinite(i[k])&&Math.abs(i[k])<=1))){
      body.inputs.forEach((input:any,slot:number)=>{inputs[slot]={x:input.x,y:input.y,glassX:input.glassX,glassY:input.glassY};players[slot].lastInput=now;});return;
     }
     if(body.command==='action'&&[0,1].includes(body.slot)&&['jump','retry','next'].includes(body.name)){actionQueue.push({slot:body.slot,name:body.name,seq:m.seq});return;}
     fail(ws,'INVALID_INPUT','Kontrol keyboard tidak valid.');return;
    }
    if(ws.role==='display'){fail(ws,'DISPLAY_READ_ONLY','Layar laptop hanya menampilkan. Gunakan controller HP.');return;}
    const p=ws.player,body=m.payload;
    if(m.type==='pairing.toggle'&&hostOnly(ws)&&phase!=='catalog'){
     expireConnections();qrVisible=!qrVisible&&availableSlot()>=0;
     if(qrVisible&&now>pairUntil){invite=token();code=String(randomInt(100000,1000000));pairUntil=now+300000;}
     broadcast();return;
    }
    if(m.type==='pairing'&&hostOnly(ws)){invite=token();code=String(randomInt(100000,1000000));pairUntil=now+300000;broadcast();return;}
    if(m.type==='reset'&&hostOnly(ws)){reset();broadcast();return;}
    if(m.type==='menu.navigate'&&p&&phase==='catalog'){
     if(!['left','right','up','down'].includes(body.direction)){fail(ws,'INVALID_INPUT','Arah tidak valid.');return;}
     const index=catalog.findIndex(g=>g.id===selected),step=['left','up'].includes(body.direction)?-1:1;selected=catalog[(index+step+catalog.length)%catalog.length].id;level=1;broadcast();return;
    }
    if(m.type==='select'&&p&&phase==='catalog'){
     if('mode' in body||'level' in body){fail(ws,'DEVELOPER_ONLY','Pilihan stage hanya tersedia di mode developer.');return;}if(catalog.some(g=>g.id===body.id)){if(selected!==body.id)level=1;selected=body.id;}broadcast();return;
    }
    if(m.type==='start'&&p&&['catalog','results'].includes(phase)){
     if(!active()){fail(ws,'PLAYERS_REQUIRED','Sambungkan minimal satu HP dahulu.');return;}const same=phase==='results'&&game?.id===selected;game=createGame(selected,mode,level,same?game.seed:undefined);game.instanceId=token();phase='tutorial';qrVisible=false;players.forEach(p=>{p.ready=false;p.actions.clear();});neutral();actionQueue=[];broadcast();return;
    }
    if(m.type==='exit'&&hostOnly(ws)||m.type==='home'&&p){phase='catalog';qrVisible=false;game=null;neutral();actionQueue=[];players.forEach(p=>p.ready=false);broadcast();return;}
    if(m.type==='pause'){pause('Permainan dijeda. Tekan Siap di semua HP yang terhubung untuk melanjutkan.');broadcast();return;}
    if(m.type==='ready'&&p&&['tutorial','paused'].includes(phase)){
     p.ready=!p.ready;if(active()&&players.every(p=>p.ready)){wasPaused=phase==='paused'&&wasPaused;phase='countdown';countdown=3;neutral();players.forEach(p=>p.lastInput=now);}broadcast();return;
    }
    if(['input.state','action'].includes(m.type)){
     if(!p||phase!=='playing'||m.gameInstanceId!==game?.instanceId)return;
     if(m.type==='input.state'){
      const x=body.x,y=body.y;if(typeof x!=='number'||typeof y!=='number'||!Number.isFinite(x)||!Number.isFinite(y)||Math.abs(x)>1||Math.abs(y)>1){fail(ws,'INVALID_INPUT','Kontrol tidak valid.');return;}const glassX=body.glassX??0,glassY=body.glassY??0;if(![glassX,glassY].every(v=>typeof v==='number'&&Number.isFinite(v)&&Math.abs(v)<=1)){fail(ws,'INVALID_INPUT','Analog kaca tidak valid.');return;}inputs[p.slot]={x,y,glassX,glassY};p.lastInput=now;return;
     }
     if(!Number.isSafeInteger(body.actionSeq)||body.actionSeq<0||!['use','tool','plant','water','harvest','deposit','answer','reveal','skip','next','jump','retry'].includes(body.name)){fail(ws,'INVALID_INPUT','Aksi tidak valid.');return;}
     if(body.actionSeq>p.lastAction){p.actions.add(body.actionSeq);p.lastAction=Math.max(p.lastAction,body.actionSeq);if(p.actions.size>256)p.actions.delete(p.actions.values().next().value);actionQueue.push({slot:p.slot,name:body.name,value:body.value,seq:body.actionSeq});}send(ws,'action.ack',{actionSeq:body.actionSeq});return;
    }
    fail(ws,'ACTION_DENIED','Aksi tidak tersedia untuk peran atau layar ini.');
   }catch{fail(ws,'INVALID_INPUT','Pesan tidak dapat dibaca.');}
  });
  ws.on('close',()=>{clearTimeout(deadline);clients.delete(ws);if(ws===display){display=null;if(players.some(p=>p.keyboard)){players.length=0;game=null;phase='catalog';neutral();actionQueue=[];}}if(ws.player?.ws===ws){const p=ws.player;p.ws=null;p.ready=false;p.disconnectedAt=performance.now();neutralPlayer(p.slot);}if(ws.candidate){const i=pending.indexOf(ws.candidate);if(i>=0)pending.splice(i,1);}broadcast();});
  ws.on('error',()=>{});
 });
 let accumulator=0,frames=0;
 const timer=setInterval(()=>{
  const now=performance.now(),elapsed=(now-previous)/1000;previous=now;accumulator+=Math.min(elapsed,.08);
  expireConnections();
  for(const ws of clients){if(ws.role&&now-ws.lastSeen>3500)ws.terminate();}
  for(const p of players)if(p.ws&&now-p.lastInput>250&&['playing'].includes(phase)){neutralPlayer(p.slot,false);}
  if(now>pairUntil&&availableSlot()>=0&&(phase==='catalog'||qrVisible)){invite=token();code=String(randomInt(100000,1000000));pairUntil=now+300000;}
  for(let i=pending.length-1;i>=0;i--)if(now-pending[i].created>5000){pending[i].ws?.close(4001,'Permintaan kedaluwarsa');pending.splice(i,1);}
  for(const [key,l] of limits)if(now-l.start>60000)limits.delete(key);
  while(accumulator>=1/60){accumulator-=1/60;tick++;
   if(phase==='countdown'){countdown-=1/60;if(countdown<=0){phase='playing';players.forEach(p=>p.lastInput=now);}}
   if(phase==='playing'&&game){actionQueue.sort((a,b)=>a.slot-b.slot||a.seq-b.seq);for(const a of actionQueue)gameAction(game,a.slot,a.name,a.value);actionQueue=[];tickGame(game,inputs,1/60);if(game.finished){phase='results';neutral();}}
  }
  if(++frames%2===0)broadcast();
 },1000/60);
 async function listen(s:any,p:number,h:string){await new Promise<void>((ok,no)=>{s.once('error',no);s.listen(p,h,()=>{s.off('error',no);ok();});});}
 try{await listen(operator,operatorPort,'127.0.0.1');await listen(server,port,host);}catch(e){clearInterval(timer);operator.close();server.close();throw e;}
 return {base,local,addresses,close:async()=>{clearInterval(timer);for(const ws of clients)ws.terminate();wss.close();await Promise.all([new Promise<void>(r=>server.close(()=>r())),new Promise<void>(r=>operator.close(()=>r()))]);}};
}
if(process.env.MAIN_BARENG_TEST!=='1'){
 startServer().then(app=>{console.log(`\n  MAIN BARENG · konsol LAN offline\n\n  Layar laptop : ${app.local}/console\n  Controller HP: ${app.base}/join\n\n  Sambungkan kedua HP ke Wi-Fi yang sama. Scan QR: HP langsung menjadi controller A/B.\n  Tidak perlu internet saat bermain. Gunakan ./stop.sh untuk menghentikan launcher.\n`);for(const name of ['SIGINT','SIGTERM'])process.once(name,()=>{app.close().then(()=>process.exit());});}).catch(e=>{console.error('Gagal menjalankan Main Bareng:',e.message,'\nPilih --host IP_LAN --port 3210 --operator-port 3211; jangan hentikan layanan lain.');process.exitCode=1;});
}
