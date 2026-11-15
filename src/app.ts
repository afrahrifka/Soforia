import {keyboardGlassInputs} from './glass-controls.ts';
import {GlassPresentation} from './glass-presentation.ts';
import {gameHud} from './game-hud.ts';
import { draw3D, release3D } from './scene3d.ts';
import { touchMarkup, syncTouch } from './touch-controller.ts';
function safeStorage(name:'localStorage'|'sessionStorage') {try {const s=window[name];s.setItem('__mb_probe','1');s.removeItem('__mb_probe');return s;} catch {const memory=new Map<string,string>();return {getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}};}}
const localStore=safeStorage('localStorage'),sessionStore=safeStorage('sessionStorage');
const glassPresentation=new GlassPresentation();
const app=document.querySelector('#app') as HTMLElement;
const esc=(s:any)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const operator=location.pathname==='/console'&&location.hostname==='127.0.0.1';
let invite=new URLSearchParams(location.hash.slice(1)).get('invite')||'';
if(location.hash)history.replaceState(null,'',location.pathname);
let socket:WebSocket,state:any=null,privateState:any={},auth:any={},seq=0,actionSeq=0,credential=sessionStore.getItem('mb-token')||localStore.getItem('mb-resume')||'',role='',key='',retry=0,connected=false,wasConnected=false,stopReconnect=false,gameCanvas:HTMLCanvasElement|null=null,lastSnapshot=performance.now(),lastFrame=performance.now(),frameSamples:number[]=[],fps=60,rtts:number[]=[],reconnectTimer:any;
let recoveryToken=localStore.getItem('mb-recovery')||Array.from(crypto.getRandomValues(new Uint8Array(32)),b=>b.toString(16).padStart(2,'0')).join('');localStore.setItem('mb-recovery',recoveryToken);
let axes={x:0,y:0},glassAxes={glassX:0,glassY:0},blockedAt=0,diag=false,draftAnswer:number|null=null,lastRound=-1,presentationAttempted=false;
let muted=localStore.getItem('mb-muted')==='1',leftHanded=localStore.getItem('mb-left')==='1',large=localStore.getItem('mb-large')==='1',reduced=localStore.getItem('mb-motion')==='1';
document.body.classList.toggle('reduced',reduced);
document.body.classList.toggle('display-only',operator);
function toast(message:string){const el=document.querySelector('#toast')!;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4000);}
function send(type:string,payload:any={},game=false){if(operator&&!['heartbeat','dev.keyboard'].includes(type))return;if(socket?.readyState!==1)return;socket.send(JSON.stringify({v:1,type,sessionId:auth.sessionId,connectionEpoch:auth.connectionEpoch,seq:++seq,...(game?{gameInstanceId:state?.gameInstanceId}:{}),payload}));}
function act(name:string,value?:any){send('action',{name,value,actionSeq:++actionSeq},true);}
function neutral(){axes={x:0,y:0};if(state?.phase==='playing')send('input.state',{...axes,...glassAxes},true);}
function connect(){
 clearTimeout(reconnectTimer);lastSnapshot=performance.now();socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
 socket.onopen=()=>{socket.send(JSON.stringify({v:1,type:'auth',payload:{token:credential||recoveryToken,recoveryToken}}));};
 socket.onmessage=event=>{
  const message=JSON.parse(event.data),p=message.payload;
  if(message.type==='auth.ok'){invite='';auth=p;role=p.role;seq=0;actionSeq=Math.max(actionSeq,p.lastAction||0);connected=true;retry=0;wasConnected=true;if(p.token){credential=p.token;sessionStore.setItem('mb-token',credential);localStore.setItem('mb-resume',credential);}key='';}
  if(message.type==='game.snapshot'){if(!operator)gameSound(state,p);if(p.game?.round!==lastRound){draftAnswer=null;lastRound=p.game?.round??-1;}state=p;lastSnapshot=performance.now();if(operator&&p.game?.id==='glass')glassPresentation.push(p.game,lastSnapshot,p.gameInstanceId);render();if(role==='player'&&!presentationAttempted){presentationAttempted=true;requestControllerFullscreen();}}
  if(message.type==='private.state'){const changed=JSON.stringify(privateState)!==JSON.stringify(p);privateState=p;if(changed)render();}
  if(message.type==='error')toast(p.message);
  if(message.type==='pong'&&typeof p.sent==='number'){rtts.push(performance.now()-p.sent);if(rtts.length>1000)rtts.shift();}
 };
 socket.onclose=e=>{glassCancel();connected=false;analogCancel();neutral();if(!operator&&state)syncTouch(state,false,muted);if(stopReconnect)return;if(e.code===4001||e.code===4000||e.code===4003){sessionStore.removeItem('mb-token');localStore.removeItem('mb-resume');credential='';role='';state=null;key='';if(operator){if(e.code===4001){bootDisplay();}else{app.innerHTML='<div class="loading">Layar dipindahkan ke jendela konsol lain.</div>';}}else{if(invite){const nextInvite=invite;invite='';autoJoin(nextInvite);}else{showJoin();toast(e.reason||'Sesi berakhir. Scan QR kembali.');}}return;}toast('Koneksi terputus. Menghubungkan kembali…');retry++;reconnectTimer=setTimeout(connect,Math.min(5000,500*2**Math.min(retry,4))+Math.random()*200);};
 socket.onerror=()=>{};
}
function logo(){return '<span class="logo-mark">m<span>✦</span></span>';}
function header(){return `${operator?'<div class="keyboard-help">F2: uji keyboard Kaca · Enter: mulai/siap · [ / ]: stage · P: jeda · Home: katalog · F3: keluar mode<br>A: WASD gerak · Q/E miring · R/F tinggi · Spasi lompat · T lanjut<br>B: panah gerak · U/O miring · I/K tinggi · Shift kanan lompat · L lanjut · Backspace: ulang checkpoint</div>':''}<header class="topbar"><div class="brand">${logo()} main bareng<span>LOCAL PLAY</span></div><nav><span class="connection"><i></i> ${operator?'LAYAR KONSOL · KONTROL DARI HP':'Controller '+(state?.you?.slot===0?'A':'B')}</span>${operator?'':'<button class="icon-button" data-do="settings" aria-label="Pengaturan">⚙</button>'}</nav></header>`;}
function playerBadge(p:any,i:number){return `<div class="player-chip ${p?.connected?'online':''}"><span class="avatar p${i}">${i?'B':'A'}</span><span>${esc(p?.name||'Menunggu pasangan…')}<small>${p?(p.connected?(p.ready?'Siap bermain':'Terhubung'):'Terputus'):'Scan QR untuk bergabung'}</small></span>${p?.connected?'<b>✓</b>':'<span class="empty-dot">+</span>'}</div>`;}
function art(id:string){
 if(id==='orbit')return `<div class="art orbit-art"><div class="orbit-ring r1"></div><div class="orbit-ring r2"></div><div class="art-planet"></div><span class="art-star s1">✦</span><span class="art-star s2">✧</span><span class="art-star s3">✦</span><svg class="ship-art" viewBox="0 0 200 130" aria-hidden="true"><path d="M28 91 10 110 53 104" fill="#f2b388"/><path d="M45 83 122 27 173 28 152 75 70 105Z" fill="#efeee8"/><path d="m77 90 23 31 36-65" fill="#b5a4ef"/><path d="m65 69-30-16 73-7" fill="#b5a4ef"/><circle cx="130" cy="50" r="14" fill="#263b49"/><circle cx="130" cy="50" r="8" fill="#b6ddcc"/></svg><span class="art-orb friend"></span></div>`;
 if(id==='glass')return `<div class="art glass-art"><div class="glass-art-pane"></div><span class="glass-art-carrier a">A</span><span class="glass-art-carrier b">B</span><strong>60 STAGE · 240 CHECKPOINT</strong></div>`;
 if(id==='property')return `<div class="art city-art"><div class="city-mini-board"><i></i><i></i><i></i><i></i><b>⌂</b><span>⚄</span></div><span class="city-art-caption">SATU KOTA. DUA STRATEGI.</span></div>`;
 if(id==='garden')return `<div class="art garden-art"><div class="garden-sun"></div><svg viewBox="0 0 400 210" aria-hidden="true"><path d="M40 170 200 90 360 170 200 245Z" fill="#42654a"/><path d="m65 160 130-64 136 65-130 62Z" fill="#a98768"/>${[0,1,2,3,4,5].map((i)=>{const x=110+(i%3)*63,y=145+Math.floor(i/3)*29-(i%3)*9;return `<g transform="translate(${x},${y})"><ellipse rx="20" ry="9" fill="#6f5843"/><path d="M0 0V-30" stroke="#406c40" stroke-width="4"/><ellipse cx="-9" cy="-22" rx="12" ry="6" transform="rotate(30)" fill="#bfe699"/><ellipse cx="12" cy="-20" rx="12" ry="6" transform="rotate(-30)" fill="#8ac57c"/><circle cy="-35" r="8" fill="${i%2?'#eaa59a':'#ecce8d'}"/></g>`;}).join('')}</svg><span class="garden-cloud">☁</span></div>`;
 return `<div class="art heart-art"><div class="floating-card card-back">?</div><div class="floating-card card-front">♡<small>kita.</small></div><span class="tiny-heart h1">✧</span><span class="tiny-heart h2">♡</span></div>`;
}
const menuCopy:Record<string,{title:string;line:string;genre:string}>={
 orbit:{title:'Orbit\nBerdua',line:'Temukan cahaya. Pulang bersama.',genre:'Petualangan'},
 garden:{title:'Kebun\nBerdua',line:'Kebahagiaan kecil, tumbuh berdua.',genre:'Simulasi santai'},
 seirama:{title:'Seirama',line:'Dua pikiran. Satu frekuensi.',genre:'Cerita & pilihan'},
 property:{title:'Kota\nBerdua',line:'Satu kota. Dua strategi.',genre:'Strategi'},
 glass:{title:'Kaca\nBerdua',line:'Jaga keseimbangan. Jaga satu sama lain.',genre:'Kerja sama'}
};
function card(g:any){return `<article class="game-card console-tile ${state.selected===g.id?'selected':''}" data-game-id="${g.id}" aria-label="${esc(g.title)}" aria-current="${state.selected===g.id?'true':'false'}">${art(g.id)}<span class="tile-name">${esc(g.title)}</span></article>`;}
function catalogView(){
 const g=state.catalog.find((g:any)=>g.id===state.selected),copy=menuCopy[g.id],index=state.catalog.findIndex((item:any)=>item.id===g.id);
 return `<main class="console-home theme-${g.id}" aria-label="Pemilihan game">
 <div class="home-atmosphere" aria-hidden="true"><div class="home-orbit orbit-one"></div><div class="home-orbit orbit-two"></div><div class="home-stars"></div></div>
 <header class="home-top"><div class="home-tabs"><span class="active">Game</span><span class="home-wordmark">main bareng<span>✦</span></span></div><div class="home-status"><span class="local-status"><i></i> Lokal</span><div class="home-players">${[0,1].map(i=>`<span class="home-avatar ${state.players[i]?.connected?'online':''}" aria-label="Pemain ${i?'B':'A'} ${state.players[i]?.connected?'terhubung':'belum terhubung'}">${i?'B':'A'}<i></i></span>`).join('')}</div><span class="home-time" aria-label="Jam lokal"></span></div></header>
 <section class="home-library" aria-label="Koleksi game"><div class="home-game-row">${state.catalog.map(card).join('')}</div></section>
 <section class="home-feature" aria-label="Game terpilih"><div class="feature-copy"><p class="feature-genre">MAIN BARENG ORIGINALS <span>•</span> ${copy.genre}</p><h1>${copy.title.split('\n').map(esc).join('<br>')}<span class="title-spark">✦</span></h1><p class="feature-line">${copy.line}</p><div class="feature-meta"><span>2 pemain</span><i></i><span>${esc(g.duration)}</span>${g.id==='glass'?`<i></i><span>Stage ${state.level}</span>`:''}</div><div class="feature-actions"><span class="home-play">Main <span>▶</span></span></div></div><div class="feature-art" aria-hidden="true"><div class="feature-halo"></div>${art(g.id)}<span class="feature-edition">${String(index+1).padStart(2,'0')} <i>/</i> MAIN BARENG</span></div></section>
 <aside class="home-pairing" aria-label="Controller">${state.pairing?.open?`<div class="qr-frame"><img src="/api/qr?${state.pairing.code}" alt="Scan QR untuk controller" width="96" height="96"></div><div><strong>Gabung & main.</strong><p>Scan dengan HP</p><span class="pairing-code">${esc(state.pairing.code)}</span><small>${esc(state.pairing.manualUrl)}</small></div>`:`<div class="pairing-ready">${state.keyboard?'⌨':'◉'}</div><div><strong>${state.keyboard?'Keyboard siap.':'Tim siap.'}</strong><p>${state.keyboard?'Enter untuk main':'Mulai dari controller'}</p></div>`}</aside>
 <footer class="home-bottom"><div><span class="nav-key">← →</span> Pilih game <span class="nav-separator"></span><span class="nav-key">▶</span> Main dari controller</div><span>${state.keyboard?'F3 · Keluar keyboard':'F2 · Uji keyboard Kaca'}</span><div class="library-position">${state.catalog.map((item:any)=>`<i class="${item.id===g.id?'active':''}"></i>`).join('')}</div></footer>
 </main>`;
}
function consoleGame(){const g=state.catalog.find((g:any)=>g.id===state.selected),quiz=state.game?.id==='seirama';return `<main class="play-main immersive-game"><div class="game-stage ${quiz?'quiz-stage':''}">${quiz?quizDisplay():''}<div id="game-hud" class="game-hud ${state.game?.id==='property'?'city-hud':''}"></div><canvas id="game" width="1280" height="720" aria-label="Layar permainan ${esc(g.title)}"></canvas>${['tutorial','paused','countdown','results'].includes(state.phase)?overlay(g):''}<div id="game-pairing"></div></div></main>`;}
function overlay(g:any){
 if(state.phase==='countdown')return `<div class="overlay"><span class="countdown">${state.countdown||1}</span><p>Petualangan kalian dimulai.</p></div>`;
 if(state.phase==='results')return `<div class="overlay"><div class="overlay-card"><div class="result-icon">✦</div><p class="eyebrow">${state.game?.id==='property'?'KOTA SELESAI':'SELESAI BERSAMA'}</p><h2>${esc(state.result.title)}</h2><p>${esc(state.result.detail)}</p>${state.result.stars?`<p class="stars">${'★'.repeat(state.result.stars)}</p>`:''}<p class="display-result-hint">Main lagi · Home · Arena lanjut — tombol di HP A</p></div></div>`;
 return `<div class="overlay"><div class="overlay-card"><div class="result-icon">${state.phase==='paused'?'Ⅱ':g.icon}</div><p class="eyebrow">${state.phase==='paused'?'AMBIL WAKTU SEJENAK':'CARA BERMAIN'}</p><h2>${state.phase==='paused'?'Kita lanjut saat siap.':g.title}</h2><p>${esc(state.phase==='paused'?state.reason:g.instructions)}</p><div class="ready-list">${state.players.map((p:any,i:number)=>`<span><i class="player-dot p${i}"></i>${esc(p.name)}<b>${p.ready?'✓ Siap':'Tekan Siap di HP'}</b></span>`).join('')}</div><p class="muted">Semua pemain yang terhubung menekan Siap pada controller HP.</p></div></div>`;
}
function quizDisplay(){const g=state.game;if(!g)return '';return `<section class="quiz-display"><p class="eyebrow">PERTANYAAN ${Math.min(g.round+1,8)} DARI 8 · TENTANG ${esc(state.players[g.subject]?.name)}</p><h2>${esc(g.question[0])}</h2>${g.revealed?(g.skipped?'<div class="skip-note">Dilewati. Selalu ada cerita lain. ♡</div>':`<div class="answer-reveal">${g.answers.map((a:number,i:number)=>`<div><span class="avatar p${i}">${i?'B':'A'}</span><small>${esc(state.players[i]?.name)}${i===g.subject?' memilih':' menebak'}</small><h3>${esc(g.question[1][a])}</h3></div>`).join('')}</div><p>${g.answers[0]===g.answers[1]?'Satu pikiran, dua orang. ♡':'Sekarang ada hal baru yang kalian tahu. ✧'}</p>`):`<div class="quiz-hidden"><div>♡</div><p>Jawab di HP masing-masing.<br>Cerita kalian tetap pribadi sampai siap.</p><div class="quiz-status">${state.players.map((p:any,i:number)=>`<span>${esc(p.name)} · ${g.answered[i]?'Sudah memilih ✓':'Sedang memilih…'}</span>`).join('')}</div></div>`}<p class="muted">${g.revealed?'Tekan Lanjut pada kedua HP.':'Lewati kapan saja, tanpa penalti.'}</p></section>`;}
function controller(){return touchMarkup(state,privateState,{leftHanded,large,draftAnswer,connected});}
let menuRelease=()=>{};
let analogCancel=()=>{};
let glassCancel=()=>{};
let heldDirection='';
let lastHudElement:Element|null=null,lastHudMarkup='';
let lastAnalogChoice=0;
function analogInput(x:number,y:number){
 const magnitude=Math.hypot(x,y);
 if(state?.phase==='catalog'){
  axes={x:0,y:0};if(magnitude<.45){heldDirection='';return;}
  const direction=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
  if(direction!==heldDirection||performance.now()-lastAnalogChoice>430){heldDirection=direction;lastAnalogChoice=performance.now();send('menu.navigate',{direction});}
 }else if(state?.phase==='playing'&&state.game?.id==='seirama'){
  axes={x:0,y:0};if(magnitude<.45)return;
  if(privateState.answer!==null&&privateState.answer!==undefined||state.game.revealed)return;
  const direction=Math.abs(x)>Math.abs(y)?(x<0?'left':'right'):(y<0?'up':'down');
  if(direction===heldDirection&&performance.now()-lastAnalogChoice<430)return;heldDirection=direction;lastAnalogChoice=performance.now();
  const current=draftAnswer??0,row=Math.floor(current/2),col=current%2,index=(direction==='up'?0:direction==='down'?1:row)*2+(direction==='left'?0:direction==='right'?1:col);
  if(draftAnswer!==index){draftAnswer=index;render();}
 }else if(state?.phase==='playing')axes={x,y};
}
function render(){
 if(!state)return;
 const signature=JSON.stringify([role,state.phase,(!operator&&state.phase==='catalog')?(state.selected==='glass'?'remote-glass':'remote-menu'):state.selected,state.mode,state.level,state.players,state.pending,state.pairing?.open,state.pairing?.code,state.countdown,state.game?.id==='seirama'?{round:state.game.round,answered:state.game.answered,revealed:state.game.revealed,answers:state.game.answers,skipped:state.game.skipped,revealReady:state.game.revealReady,nextReady:state.game.nextReady}:null,state.game?.id==='seirama'?privateState:null,state.game?.id==='glass'?[state.game.stage,state.game.stageClear,state.game.nextReady,state.game.retryTime>0]:null,draftAnswer,diag,!operator&&state.game?.id==='property'?[state.game.turn,state.game.pending,state.game.moves,state.game.stage,state.game.decision]:null]);
 if(signature!==key){glassCancel();analogCancel();menuRelease();key=signature;neutral();document.body.classList.toggle('controller-only',!operator);document.body.classList.toggle('catalog-screen',operator&&state.phase==='catalog');const retained=operator?gameCanvas:null;app.innerHTML=operator?(state.phase==='catalog'?catalogView():consoleGame()):controller();gameCanvas=document.querySelector('#game');if(retained&&gameCanvas){gameCanvas.replaceWith(retained);gameCanvas=retained;}else if(retained){release3D();}bindTouch();if(diag)showSettings(true);}

 const pairing=document.querySelector<HTMLElement>('#game-pairing');
 if(pairing){const visible=!!(state.qrVisible&&state.pairing?.open),stamp=visible?state.pairing.code:'';if(pairing.dataset.stamp!==stamp){pairing.dataset.stamp=stamp;pairing.innerHTML=visible?`<aside class="game-qr-panel" aria-label="QR controller kedua"><div class="qr-frame"><img src="/api/qr?${state.pairing.code}" alt="Scan QR untuk pemain 2" width="240" height="240"></div><strong>Gabung sebagai pemain 2</strong><p>Scan dengan HP</p><span class="pairing-code">${esc(state.pairing.code)}</span><small>${esc(state.pairing.manualUrl)}</small></aside>`:'';}}
 const homeTime=document.querySelector('.home-time');if(homeTime)homeTime.textContent=new Intl.DateTimeFormat('id-ID',{hour:'2-digit',minute:'2-digit'}).format(new Date()).replace('.',':');
 const time=state.game?.elapsed||0,clock=document.querySelector('#game-clock');if(clock)clock.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
 const progress=document.querySelector('#game-progress');if(progress)progress.textContent=state.game?.id==='glass'?`Stage ${state.game.stage+1}/60 · checkpoint ${state.game.checkpoint}/4`:state.game?.id==='property'?`Giliran ${state.game.turn?'B':'A'} · ${state.game.moves}/24 giliran`:state.game?.id==='orbit'?`${state.game.energies.filter((e:any)=>e.taken).length}/12 cahaya`:state.game?.id==='garden'?`🥕 ${state.game.harvest.carrot}/6   🍓 ${state.game.harvest.berry}/6`:'';
 const hud=document.querySelector('#game-hud');if(hud){const markup=gameHud(state);if(lastHudElement!==hud||lastHudMarkup!==markup){hud.innerHTML=markup;lastHudElement=hud;lastHudMarkup=markup;}}
 if(!operator)syncTouch(state,connected,muted);
}

function bindTouch(){
 const pad=document.querySelector('#pad') as HTMLElement,knob=document.querySelector('#knob') as HTMLElement;
 let pointer:number|null=null,repeat:any=null,stick={x:0,y:0};
 const release=()=>{pointer=null;clearInterval(repeat);heldDirection='';stick={x:0,y:0};neutral();knob?.style.removeProperty('transform');};
 analogCancel=release;menuRelease=release;
 if(pad){
  const move=(e:PointerEvent)=>{if(e.pointerId!==pointer)return;const box=pad.getBoundingClientRect(),radius=box.width*.34,x=(e.clientX-box.left-box.width/2)/radius,y=(e.clientY-box.top-box.height/2)/radius,len=Math.max(1,Math.hypot(x,y));stick={x:x/len,y:y/len};if(Math.hypot(stick.x,stick.y)<.14)stick={x:0,y:0};knob.style.transform=`translate(${stick.x*radius*.78}px,${stick.y*radius*.78}px)`;analogInput(stick.x,stick.y);};
  pad.onpointerdown=e=>{if(pointer!==null||pad.dataset.disabled==='true')return;pointer=e.pointerId;pad.setPointerCapture(e.pointerId);move(e);if(pointer!==null)repeat=setInterval(()=>analogInput(stick.x,stick.y),60);};
  pad.onpointermove=move;pad.onpointerup=release;pad.onpointercancel=release;pad.onlostpointercapture=release;
 }
 const held=new Map<number,{button:HTMLButtonElement;x:number;y:number}>();
 const updateGlass=()=>{glassAxes={glassX:0,glassY:0};for(const key of held.values()){glassAxes.glassX+=key.x;glassAxes.glassY+=key.y;}glassAxes.glassX=Math.max(-1,Math.min(1,glassAxes.glassX));glassAxes.glassY=Math.max(-1,Math.min(1,glassAxes.glassY));if(state?.phase==='playing')send('input.state',{...axes,...glassAxes},true);};
 const releaseGlass=(id?:number)=>{for(const [pointer,key] of held){if(id===undefined||pointer===id){key.button.classList.remove('held-action');key.button.setAttribute('aria-pressed','false');held.delete(pointer);}}updateGlass();};
 glassCancel=()=>releaseGlass();
 document.querySelectorAll<HTMLButtonElement>('[data-glass-x],[data-glass-y]').forEach(button=>{
  button.onpointerdown=e=>{if(button.disabled||!connected||held.has(e.pointerId))return;e.preventDefault();button.setPointerCapture(e.pointerId);held.set(e.pointerId,{button,x:Number(button.dataset.glassX||0),y:Number(button.dataset.glassY||0)});button.classList.add('held-action');button.setAttribute('aria-pressed','true');updateGlass();};
  button.onpointerup=button.onpointercancel=button.onlostpointercapture=e=>releaseGlass(e.pointerId);
 });
}
let fullscreenPending=false,presentationUntil=0;
async function requestControllerFullscreen(){
 if(operator||!document.body.classList.contains('controller-only')||(document.fullscreenElement||(document as any).webkitFullscreenElement)||fullscreenPending)return;
 const root=document.documentElement as any,request=root.requestFullscreen||root.webkitRequestFullscreen;
 if(!request||document.fullscreenEnabled===false)return;
 fullscreenPending=true;presentationUntil=performance.now()+1200;
 try{await request.call(root,{navigationUI:'hide'});}catch{}finally{fullscreenPending=false;}
}
function updateControllerViewport(){document.documentElement.style.setProperty('--controller-height',`${window.visualViewport?.height||innerHeight}px`);}
updateControllerViewport();window.visualViewport?.addEventListener('resize',()=>{updateControllerViewport();glassCancel();analogCancel();});
window.addEventListener('resize',()=>{updateControllerViewport();glassCancel();analogCancel();});
document.addEventListener('fullscreenchange',()=>{updateControllerViewport();glassCancel();analogCancel();if(document.fullscreenElement&&!operator){const orientation=screen.orientation as any;if(orientation?.lock){try{orientation.lock('landscape').catch(()=>{});}catch{}}}});
// Request during the same trusted gesture as using a control; never add a blocking entry screen.
for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{if(e.isTrusted&&!operator&&document.body.classList.contains('controller-only'))requestControllerFullscreen();},{capture:true});
async function autoJoin(scanned:string){app.innerHTML='<main class="loading">✦<br>Menyambungkan controller…</main>';try{const response=await fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invite:scanned,recoveryToken})});const data=await response.json();if(!response.ok)throw Error(data.message||'Undangan tidak berlaku.');credential=data.token;sessionStore.setItem('mb-token',credential);localStore.setItem('mb-resume',credential);connect();}catch(error:any){showJoin();toast(error.message);}}
async function showJoin(){
 document.body.classList.remove('controller-only','controls-modal');
 app.innerHTML=`<main class="join-wrap"><a class="brand" href="/join">${logo()} main bareng<span>LOCAL PLAY</span></a><section class="join-card"><div class="join-illustration">✦<span>♡</span></div><p class="eyebrow">HP KAMU, CONTROLLER KAMU.</p><h1>Masuk ke ruang kalian.</h1><p>Masukkan kode ruang jika tidak memakai QR.</p><form id="join-form">${invite?'<div class="invite-valid">✓ Undangan QR sudah terbaca</div>':'<label for="room-code">Kode ruang dari laptop</label><input id="room-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="6 digit kode" required>'}<button class="primary full" type="submit">Gabung & main bareng →</button></form><p class="join-note">Pastikan HP dan laptop terhubung ke Wi-Fi yang sama. Internet tidak diperlukan.</p></section><span class="join-bottom">DIBUAT UNTUK WAKTU YANG BERARTI.</span></main>`;
 document.querySelector('#join-form')!.addEventListener('submit',async e=>{e.preventDefault();const form=e.target as HTMLFormElement,button=form.querySelector('button')!;button.disabled=true;try{const data=new FormData(form),response=await fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:data.get('name'),recoveryToken,...(invite?{invite}:{code:data.get('code')})})});const p=await response.json();if(!response.ok)throw Error(p.message||'Tidak dapat bergabung.');credential=p.token;sessionStore.setItem('mb-token',credential);localStore.setItem('mb-resume',credential);connect();}catch(e:any){toast(e.message);button.disabled=false;}});
}
function showSettings(diagnostics=false){
 document.body.classList.add('controls-modal');
 document.querySelector('#modal')?.remove();const modal=document.createElement('div');modal.id='modal';modal.className='modal';modal.innerHTML=`<section class="settings-panel"><div class="section-title"><h2>${diagnostics?'Jaringan & bantuan':'Buat senyaman kalian'}</h2><button data-do="close-settings" class="icon-button" aria-label="Tutup">×</button></div>${diagnostics?`<p>Gunakan satu Wi-Fi pribadi yang sama. Guest Wi-Fi bisa memblokir koneksi antarperangkat.</p><div class="info-box"><strong>${esc(state?.network?.base||location.origin)}</strong><p>RTT aplikasi: <span id="diag-rtt">—</span><br>Render: <span id="diag-fps">—</span><br>Koneksi: <span id="diag-connection">—</span></p></div><p>Jika HP tidak terhubung: periksa alamat IP, izin jaringan lokal browser, client isolation router dan firewall port aplikasi. Aplikasi tidak mengubah firewall atau Tailscale.</p><p class="muted">RTT adalah perjalanan pulang-pergi pesan, bukan ukuran sentuh-ke-gambar.</p>`:`<button class="setting-row" data-do="mute">Suara sintetis lokal <b>${muted?'Mati':'Aktif'}</b></button><button class="setting-row" data-do="motion">Kurangi animasi <b>${reduced?'Aktif':'Mati'}</b></button><button class="setting-row" data-do="left">Kontrol kidal <b>${leftHanded?'Aktif':'Mati'}</b></button><button class="setting-row" data-do="large">Tombol lebih besar <b>${large?'Aktif':'Mati'}</b></button><p class="muted">Preferensi tersimpan di browser perangkat ini.</p>`}${state?.you?.host?'<button class="danger full" data-do="reset">Akhiri ruang & hapus sesi</button>':''}${!operator?'<button class="subtle full" data-do="logout">Keluar controller</button>':''}</section>`;document.body.append(modal);
}
let audio:AudioContext;
function clickSound(){if(muted)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.setValueAtTime(520,audio.currentTime);o.frequency.exponentialRampToValueAtTime(290,audio.currentTime+.07);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.1);}catch{}}
function gameSound(previous:any,next:any){
 if(muted||!audio||audio.state!=='running'||document.hidden||previous?.gameInstanceId!==next.gameInstanceId)return;
 const before=previous?.game,g=next.game;if(!before||!g)return;
 let notes:number[]=[];
 if(next.phase==='results'&&previous.phase!=='results')notes=[523,659,784,1047];
 else if(g.id==='orbit'&&g.energies.filter((e:any)=>e.taken).length>before.energies.filter((e:any)=>e.taken).length)notes=[659,988];
 else if(g.id==='garden'&&g.harvest.carrot+g.harvest.berry>before.harvest.carrot+before.harvest.berry)notes=[523,784];
 else if(g.id==='property'&&g.turn===next.you?.slot&&before.stage!==g.stage&&g.stage==='decision')notes=[440,554];
 else if(g.id==='seirama'&&g.revealed&&!before.revealed)notes=[523,659];
 for(const [i,note] of notes.entries()){const at=audio.currentTime+i*.085,o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.value=note;v.gain.setValueAtTime(0,at);v.gain.linearRampToValueAtTime(.025,at+.015);v.gain.exponentialRampToValueAtTime(.001,at+.18);o.connect(v);v.connect(audio.destination);o.start(at);o.stop(at+.2);}
}

function handleControl(b:HTMLButtonElement){if(operator||!b||b.disabled)return;const action=b.dataset.do;if(b.hasAttribute('data-glass-x')||b.hasAttribute('data-glass-y'))return;clickSound();
 if(action==='pairing-toggle'){send('pairing.toggle');return;}
 if(action==='fullscreen'){requestControllerFullscreen();return;}
 if(action==='home'){glassCancel();analogCancel();send('home');return;}
 if(action==='stop-motion'){analogCancel();return;}
 if(action==='help'){glassCancel();analogCancel();const selected=state.catalog.find((g:any)=>g.id===state.selected);showSettings();const panel=document.querySelector('.settings-panel');if(panel){const note=document.createElement('p');note.textContent=selected.instructions;panel.prepend(note);}return;}
 if(action==='remote-confirm')send(state.phase==='catalog'||state.phase==='results'?'start':'ready');
 if(action==='remote-back'){if(state.phase!=='catalog'&&state.you?.host)send('exit');else toast('Beranda konsol. Gunakan D-pad untuk memilih game.');}
 if(action==='select')send('select',{id:b.dataset.id});
 if(action==='pause'){glassCancel();analogCancel();}if(['start','pairing','ready','pause'].includes(action!))send(action!);
 if(action==='exit'&&confirm('Kembali ke katalog? Progres ronde ini akan dihapus.'))send('exit');
 if(['use','tool','plant','water','harvest','deposit','reveal','skip','next','jump','retry'].includes(action!))act(action!);
 if(action==='answer'){draftAnswer=Number(b.dataset.value);render();}if(action==='lock-answer'&&draftAnswer!==null){act('answer',draftAnswer);}
 if(action==='reset'&&confirm('Akhiri sesi dan hapus pemain serta jawaban?')){send('reset');document.querySelector('#modal')?.remove();document.body.classList.remove('controls-modal');}
 if(action==='settings')showSettings();if(action==='diagnostics'){diag=true;showSettings(true);}if(action==='close-settings'){diag=false;document.querySelector('#modal')?.remove();document.body.classList.remove('controls-modal');}
 if(action==='logout'){stopReconnect=true;sessionStore.removeItem('mb-token');localStore.removeItem('mb-resume');socket?.close();location.href='/join';}
 if(action==='mute'){muted=!muted;localStore.setItem('mb-muted',muted?'1':'0');if(document.querySelector('#modal'))showSettings();else syncTouch(state,connected,muted);}
 if(action==='motion'){reduced=!reduced;localStore.setItem('mb-motion',reduced?'1':'0');document.body.classList.toggle('reduced',reduced);showSettings();}
 if(action==='left'||action==='large'){if(action==='left'){leftHanded=!leftHanded;localStore.setItem('mb-left',leftHanded?'1':'0');}else{large=!large;localStore.setItem('mb-large',large?'1':'0');}key='';render();showSettings();}
}
let pointerActionHandled=false;
// Dispatch action on pointerdown so a second finger works while the analog is held.
document.addEventListener('pointerdown',e=>{
 if(operator)return;
 const button=(e.target as HTMLElement).closest<HTMLButtonElement>('.touch-action[data-do],.touch-utility[data-do]');pointerActionHandled=!!button;
 if(button&&!button.disabled){e.preventDefault();handleControl(button);}
});
document.addEventListener('click',e=>{
 if(operator){e.preventDefault();return;}
 const handled=pointerActionHandled;pointerActionHandled=false;
 if(handled&&e.detail>0){e.preventDefault();return;}
 const button=(e.target as HTMLElement).closest<HTMLButtonElement>('[data-do]');if(button)handleControl(button);
});
setInterval(()=>{if(socket?.readyState===1&&role)send('heartbeat',{sent:performance.now()});},1000);
setInterval(()=>{if(role!=='player'||!connected||state?.phase!=='playing'||document.hidden)return;if(socket.bufferedAmount>8192){neutral();if(!blockedAt)blockedAt=performance.now();if(performance.now()-blockedAt>250)socket.close();return;}blockedAt=0;send('input.state',{...axes,...glassAxes},true);},1000/30);
setInterval(()=>{const median=rtts.length?Math.round([...rtts].sort((a,b)=>a-b)[Math.floor(rtts.length*.5)]):null;const rtt=document.querySelector('#rtt');if(rtt)rtt.textContent=connected?`LAN · ${median??'—'} ms`:'Menghubungkan…';const vals={'#diag-rtt':`${median??'—'} ms median · ${rtts.length} sampel`,'#diag-fps':`${Math.round(fps)} FPS`,'#diag-connection':connected?'Terhubung':'Menghubungkan ulang'};for(const [id,v] of Object.entries(vals)){const el=document.querySelector(id);if(el)el.textContent=v;}},500);
function reconnectStalled(){
 if(stopReconnect||document.hidden||!credential)return;
 if(socket?.readyState===1&&performance.now()-lastSnapshot<=4000)return;
 if(socket){socket.onclose=null;socket.onopen=null;socket.onmessage=null;socket.close();}
 connected=false;glassCancel();analogCancel();if(!operator&&state)syncTouch(state,false,muted);connect();
}
setInterval(reconnectStalled,1000);window.addEventListener('online',reconnectStalled);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)reconnectStalled();});
function suspend(){glassCancel();analogCancel();menuRelease();if(operator)return;neutral();}
window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',suspend);

// Seluruh artwork dirender lokal, tanpa gambar, font, atau audio jaringan luar.
function draw(time:number){requestAnimationFrame(draw);const dt=time-lastFrame;lastFrame=time;frameSamples.push(dt);if(frameSamples.length>60)frameSamples.shift();fps=1000/(frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length);
 if(!gameCanvas||!state?.game)return;draw3D(gameCanvas,state.game.id==='glass'&&!reduced?(glassPresentation.sample(time)||state.game):state.game,time/1000,{instance:state.gameInstanceId,reduced});
}
requestAnimationFrame(draw);
async function bootDisplay(){try{const response=await fetch('/api/operator',{method:'POST'});if(!response.ok)throw Error('Buka URL layar laptop yang ditampilkan terminal.');credential=(await response.json()).token;connect();}catch(e:any){app.innerHTML=`<div class="loading">${esc(e.message)}</div>`;}}
async function init(){
 if(operator){await bootDisplay();}
 else if(location.pathname==='/console'){app.innerHTML='<div class="loading">Buka layar konsol melalui URL lokal di terminal laptop.<br>Di HP, buka /join untuk menjadi controller.</div>';}
 else if(credential)connect();else if(invite){const scanned=invite;invite='';autoJoin(scanned);}else showJoin();
}
init();

// Kode fisik menjaga tata letak dua pemain konsisten, tanpa key-repeat untuk aksi.
const keyboardHeld=new Set<string>();
const keyboardCodes=new Set(['KeyW','KeyA','KeyS','KeyD','KeyQ','KeyE','KeyR','KeyF','Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','KeyU','KeyO','KeyI','KeyK','ShiftRight','KeyT','KeyL','Backspace','Enter','KeyP','Home','BracketLeft','BracketRight','F2','F3']);
function keyboardSend(command:string,extra:any={}){send('dev.keyboard',{command,...extra},true);}
function releaseKeyboard(){keyboardHeld.clear();if(operator&&state?.keyboard)keyboardSend('neutral');}
window.addEventListener('keydown',e=>{
 if(!operator||!connected||!keyboardCodes.has(e.code))return;
 if(e.code!=='F2'&&!state?.keyboard)return;
 e.preventDefault();if(e.repeat)return;keyboardHeld.add(e.code);
 if(e.code==='F2'){releaseKeyboard();if(!state?.keyboard)keyboardSend('enable');return;}
 if(e.code==='F3'){releaseKeyboard();keyboardSend('disable');return;}
 if(e.code==='Enter'){releaseKeyboard();keyboardSend('confirm');}
 if(e.code==='KeyP'){releaseKeyboard();keyboardSend('pause');}
 if(e.code==='Home'){releaseKeyboard();keyboardSend('home');}
 if(['BracketLeft','BracketRight'].includes(e.code))keyboardSend('stage',{level:Math.max(1,Math.min(60,state.level+(e.code==='BracketRight'?1:-1)))});
 const actions:any={Space:[0,'jump'],ShiftRight:[1,'jump'],KeyT:[0,'next'],KeyL:[1,'next'],Backspace:[0,'retry']};
 if(actions[e.code])keyboardSend('action',{slot:actions[e.code][0],name:actions[e.code][1]});
});
window.addEventListener('keyup',e=>{if(operator&&state?.keyboard&&keyboardCodes.has(e.code)){e.preventDefault();keyboardHeld.delete(e.code);}});
window.addEventListener('blur',releaseKeyboard);window.addEventListener('pagehide',releaseKeyboard);
document.addEventListener('visibilitychange',()=>{if(document.hidden)releaseKeyboard();});
setInterval(()=>{
 if(!operator||!connected||!state?.keyboard||state.phase!=='playing'||document.hidden){keyboardHeld.clear();return;}
 keyboardSend('input',{inputs:keyboardGlassInputs(keyboardHeld)});
},1000/30);
