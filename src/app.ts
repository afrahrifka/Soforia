import { touchMarkup, syncTouch } from './touch-controller.ts';
function safeStorage(name:'localStorage'|'sessionStorage') {try {const s=window[name];s.setItem('__mb_probe','1');s.removeItem('__mb_probe');return s;} catch {const memory=new Map<string,string>();return {getItem:(k:string)=>memory.get(k)??null,setItem:(k:string,v:string)=>{memory.set(k,v);},removeItem:(k:string)=>{memory.delete(k);}};}}
const localStore=safeStorage('localStorage'),sessionStore=safeStorage('sessionStorage');
const app=document.querySelector('#app') as HTMLElement;
const esc=(s:any)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const operator=location.pathname==='/console'&&location.hostname==='127.0.0.1';
let invite=new URLSearchParams(location.hash.slice(1)).get('invite')||'';
if(location.hash)history.replaceState(null,'',location.pathname);
let socket:WebSocket,state:any=null,privateState:any={},auth:any={},seq=0,actionSeq=0,credential=sessionStore.getItem('mb-token')||'',role='',key='',retry=0,connected=false,wasConnected=false,stopReconnect=false,gameCanvas:HTMLCanvasElement|null=null,lastSnapshot=performance.now(),lastFrame=performance.now(),frameSamples:number[]=[],fps=60,rtts:number[]=[],reconnectTimer:any;
let axes={x:0,y:0},blockedAt=0,diag=false,draftAnswer:number|null=null,lastRound=-1,presentationAttempted=false;
let muted=localStore.getItem('mb-muted')==='1',leftHanded=localStore.getItem('mb-left')==='1',large=localStore.getItem('mb-large')==='1',reduced=localStore.getItem('mb-motion')==='1';
document.body.classList.toggle('reduced',reduced);
document.body.classList.toggle('display-only',operator);
function toast(message:string){const el=document.querySelector('#toast')!;el.textContent=message;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),4000);}
function send(type:string,payload:any={},game=false){if(operator&&type!=='heartbeat')return;if(socket?.readyState!==1)return;socket.send(JSON.stringify({v:1,type,sessionId:auth.sessionId,connectionEpoch:auth.connectionEpoch,seq:++seq,...(game?{gameInstanceId:state?.gameInstanceId}:{}),payload}));}
function act(name:string,value?:any){send('action',{name,value,actionSeq:++actionSeq},true);}
function neutral(){axes={x:0,y:0};if(state?.phase==='playing')send('input.state',axes,true);}
function connect(){
 clearTimeout(reconnectTimer);socket=new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
 socket.onopen=()=>{socket.send(JSON.stringify({v:1,type:'auth',payload:{token:credential}}));};
 socket.onmessage=event=>{
  const message=JSON.parse(event.data),p=message.payload;
  if(message.type==='auth.ok'){auth=p;role=p.role;seq=0;actionSeq=Math.max(actionSeq,p.lastAction||0);connected=true;retry=0;wasConnected=true;if(p.token){credential=p.token;sessionStore.setItem('mb-token',credential);}key='';}
  if(message.type==='game.snapshot'){if(p.game?.round!==lastRound){draftAnswer=null;lastRound=p.game?.round??-1;}state=p;lastSnapshot=performance.now();render();if(role==='player'&&!presentationAttempted){presentationAttempted=true;requestControllerFullscreen();}}
  if(message.type==='private.state'){const changed=JSON.stringify(privateState)!==JSON.stringify(p);privateState=p;if(changed)render();}
  if(message.type==='error')toast(p.message);
  if(message.type==='pong'&&typeof p.sent==='number'){rtts.push(performance.now()-p.sent);if(rtts.length>1000)rtts.shift();}
 };
 socket.onclose=e=>{connected=false;analogCancel();neutral();if(!operator&&state)syncTouch(state,false,muted);if(stopReconnect)return;if(e.code===4001||e.code===4000||e.code===4003){sessionStore.removeItem('mb-token');credential='';role='';state=null;key='';if(operator){if(e.code===4001){bootDisplay();}else{app.innerHTML='<div class="loading">Layar dipindahkan ke jendela konsol lain.</div>';}}else{if(invite){const nextInvite=invite;invite='';autoJoin(nextInvite);}else{showJoin();toast(e.reason||'Sesi berakhir. Scan QR kembali.');}}return;}toast('Koneksi terputus. Menghubungkan kembali…');retry++;reconnectTimer=setTimeout(connect,Math.min(5000,500*2**Math.min(retry,4))+Math.random()*200);};
 socket.onerror=()=>{};
}
function logo(){return '<span class="logo-mark">m<span>✦</span></span>';}
function header(){return `<header class="topbar"><div class="brand">${logo()} main bareng<span>LOCAL PLAY</span></div><nav><span class="connection"><i></i> ${operator?'LAYAR KONSOL · KONTROL DARI HP':'Controller '+(state?.you?.slot===0?'A':'B')}</span>${operator?'':'<button class="icon-button" data-do="settings" aria-label="Pengaturan">⚙</button>'}</nav></header>`;}
function playerBadge(p:any,i:number){return `<div class="player-chip ${p?.connected?'online':''}"><span class="avatar p${i}">${i?'B':'A'}</span><span>${esc(p?.name||'Menunggu pasangan…')}<small>${p?(p.connected?(p.ready?'Siap bermain':'Terhubung'):'Terputus'):'Scan QR untuk bergabung'}</small></span>${p?.connected?'<b>✓</b>':'<span class="empty-dot">+</span>'}</div>`;}
function art(id:string){
 if(id==='orbit')return `<div class="art orbit-art"><div class="orbit-ring r1"></div><div class="orbit-ring r2"></div><div class="art-planet"></div><span class="art-star s1">✦</span><span class="art-star s2">✧</span><span class="art-star s3">✦</span><svg class="ship-art" viewBox="0 0 200 130" aria-hidden="true"><path d="M28 91 10 110 53 104" fill="#f2b388"/><path d="M45 83 122 27 173 28 152 75 70 105Z" fill="#efeee8"/><path d="m77 90 23 31 36-65" fill="#b5a4ef"/><path d="m65 69-30-16 73-7" fill="#b5a4ef"/><circle cx="130" cy="50" r="14" fill="#263b49"/><circle cx="130" cy="50" r="8" fill="#b6ddcc"/></svg><span class="art-orb friend"></span></div>`;
 if(id==='garden')return `<div class="art garden-art"><div class="garden-sun"></div><svg viewBox="0 0 400 210" aria-hidden="true"><path d="M40 170 200 90 360 170 200 245Z" fill="#42654a"/><path d="m65 160 130-64 136 65-130 62Z" fill="#a98768"/>${[0,1,2,3,4,5].map((i)=>{const x=110+(i%3)*63,y=145+Math.floor(i/3)*29-(i%3)*9;return `<g transform="translate(${x},${y})"><ellipse rx="20" ry="9" fill="#6f5843"/><path d="M0 0V-30" stroke="#406c40" stroke-width="4"/><ellipse cx="-9" cy="-22" rx="12" ry="6" transform="rotate(30)" fill="#bfe699"/><ellipse cx="12" cy="-20" rx="12" ry="6" transform="rotate(-30)" fill="#8ac57c"/><circle cy="-35" r="8" fill="${i%2?'#eaa59a':'#ecce8d'}"/></g>`;}).join('')}</svg><span class="garden-cloud">☁</span></div>`;
 return `<div class="art heart-art"><div class="floating-card card-back">?</div><div class="floating-card card-front">♡<small>kita.</small></div><span class="tiny-heart h1">✧</span><span class="tiny-heart h2">♡</span></div>`;
}
function card(g:any){return `<article class="game-card ${state.selected===g.id?'selected':''}" data-game-id="${g.id}" aria-current="${state.selected===g.id?'true':'false'}">${art(g.id)}<div class="card-info"><span class="eyebrow">${g.tag}</span><h2>${g.title}<span>${state.selected===g.id?'◀':''}</span></h2><p>${g.description}</p><div class="card-meta"><span>♧ 2 pemain</span><span>◷ ${g.duration}</span></div></div></article>`;}
function catalogView(){const g=state.catalog.find((g:any)=>g.id===state.selected);return `${header()}<main class="console-main"><section class="intro"><div><p class="eyebrow"><span class="tiny-pill">●</span> SATU LAYAR. DUA CONTROLLER.</p><h1>Waktu untuk <em>berdua.</em></h1><p>Scan QR. Ambil posisi. Kendalikan semuanya dari HP.</p></div><div class="offline-note"><span>⌁</span><div>Terhubung secara lokal<small>Tanpa internet. Tanpa distraksi.</small></div></div></section><div class="console-grid"><section class="library"><div class="section-title"><h3>Pilih cerita kalian <span>03</span></h3><span>ANALOG MEMILIH · TOMBOL MAIN MEMULAI</span></div><div class="game-grid">${state.catalog.map(card).join('')}</div><div class="launch-bar"><div><span class="selected-symbol">${g.icon}</span><div><small>PILIHAN KALIAN</small><strong>${g.title}</strong></div></div><div class="launch-actions"><span class="mode-toggle active">${state.mode==='relaxed'?'☁ Mode santai':'⚡ Mode tantangan'}</span>${state.selected==='orbit'?`<span class="mode-toggle">Arena ${state.level}/3</span>`:''}<span class="primary display-hint">Main dari HP A</span></div></div><div class="how-row"><span><b>← →</b> Pilih game</span><span><b>▶</b> Main / Siap</span><span><b>⌂</b> Home</span></div></section><aside class="session-panel"><div class="section-title"><h3>Controller kalian</h3><span class="live-pill">LOKAL</span></div><div class="player-stack">${playerBadge(state.players[0],0)}${playerBadge(state.players[1],1)}</div>${state.pairing?.open?`<div class="qr-block"><div class="qr-frame"><img src="/api/qr?${state.pairing.code}" alt="QR untuk membuka controller HP" width="166" height="166"></div><strong>Scan, langsung jadi controller.</strong><p>Tanpa daftar. Tanpa konfirmasi.<br>Gunakan Wi-Fi yang sama dengan laptop.</p><div class="session-code">KODE RUANG <b>${state.pairing.code}</b></div><p class="manual-address">${esc(state.pairing.manualUrl)}</p></div>`:`<div class="paired-card"><span>✦</span><h3>Tim sudah lengkap.</h3><p>Gunakan analog HP A untuk memilih game, lalu tekan Main.</p></div>`}<p class="privacy-caption">HP pertama menjadi host · maksimal 2 controller.</p></aside></div><footer><span>BUKAN SOAL MENANG. SOAL MAIN BARENG.</span><span>SEMUA KONTROL ADA DI HP</span></footer></main>`;}
function consoleGame(){const g=state.catalog.find((g:any)=>g.id===state.selected),quiz=state.game?.id==='seirama';return `${header()}<main class="play-main"><div class="game-top"><div><p class="eyebrow">${g.tag}</p><h1>${g.title}</h1></div><div class="game-controls"><span id="game-progress"></span><span class="clock" id="game-clock">00:00</span><span class="muted">OPTIONS di HP untuk jeda</span></div></div><div class="game-stage ${quiz?'quiz-stage':''}">${quiz?quizDisplay():`<canvas id="game" width="1280" height="720" aria-label="Layar permainan ${g.title}"></canvas>`}${['tutorial','paused','countdown','results'].includes(state.phase)?overlay(g):''}</div><div class="game-bottom"><div class="team-mini">${state.players.map((p:any,i:number)=>`<span><i class="player-dot p${i}"></i>${esc(p.name)} ${p.connected?'':'· terputus'}</span>`).join('')}</div><span>${state.game?.id==='orbit'?'Kumpulkan cahaya. Tempati dua gerbang bersama.':state.game?.id==='garden'?'Tanam → Siram → Panen → Antar ke peti.':'Jawaban hanya diungkap saat keduanya siap.'}</span></div></main>`;}
function overlay(g:any){
 if(state.phase==='countdown')return `<div class="overlay"><span class="countdown">${state.countdown||1}</span><p>Petualangan kalian dimulai.</p></div>`;
 if(state.phase==='results')return `<div class="overlay"><div class="overlay-card"><div class="result-icon">✦</div><p class="eyebrow">SELESAI BERSAMA</p><h2>${esc(state.result.title)}</h2><p>${esc(state.result.detail)}</p>${state.result.stars?`<p class="stars">${'★'.repeat(state.result.stars)}</p>`:''}<p class="display-result-hint">Main lagi · Home · Arena lanjut — tombol di HP A</p></div></div>`;
 return `<div class="overlay"><div class="overlay-card"><div class="result-icon">${state.phase==='paused'?'Ⅱ':g.icon}</div><p class="eyebrow">${state.phase==='paused'?'AMBIL WAKTU SEJENAK':'CARA BERMAIN'}</p><h2>${state.phase==='paused'?'Kita lanjut saat siap.':g.title}</h2><p>${esc(state.phase==='paused'?state.reason:g.instructions)}</p><div class="ready-list">${state.players.map((p:any,i:number)=>`<span><i class="player-dot p${i}"></i>${esc(p.name)}<b>${p.ready?'✓ Siap':'Tekan Siap di HP'}</b></span>`).join('')}</div><p class="muted">Kedua pemain menekan Siap pada controller HP.</p></div></div>`;
}
function quizDisplay(){const g=state.game;if(!g)return '';return `<section class="quiz-display"><p class="eyebrow">PERTANYAAN ${Math.min(g.round+1,8)} DARI 8 · TENTANG ${esc(state.players[g.subject]?.name)}</p><h2>${esc(g.question[0])}</h2>${g.revealed?(g.skipped?'<div class="skip-note">Dilewati. Selalu ada cerita lain. ♡</div>':`<div class="answer-reveal">${g.answers.map((a:number,i:number)=>`<div><span class="avatar p${i}">${i?'B':'A'}</span><small>${esc(state.players[i]?.name)}${i===g.subject?' memilih':' menebak'}</small><h3>${esc(g.question[1][a])}</h3></div>`).join('')}</div><p>${g.answers[0]===g.answers[1]?'Satu pikiran, dua orang. ♡':'Sekarang ada hal baru yang kalian tahu. ✧'}</p>`):`<div class="quiz-hidden"><div>♡</div><p>Jawab di HP masing-masing.<br>Cerita kalian tetap pribadi sampai siap.</p><div class="quiz-status">${state.players.map((p:any,i:number)=>`<span>${esc(p.name)} · ${g.answered[i]?'Sudah memilih ✓':'Sedang memilih…'}</span>`).join('')}</div></div>`}<p class="muted">${g.revealed?'Tekan Lanjut pada kedua HP.':'Lewati kapan saja, tanpa penalti.'}</p></section>`;}
function controller(){return touchMarkup(state,privateState,{leftHanded,large,draftAnswer,connected});}
let menuRelease=()=>{};
let analogCancel=()=>{};
let heldDirection='';
let lastAnalogChoice=0;
function analogInput(x:number,y:number){
 const magnitude=Math.hypot(x,y);
 if(state?.phase==='catalog'){
  axes={x:0,y:0};if(!state.you?.host||magnitude<.45){heldDirection='';return;}
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
 const signature=JSON.stringify([role,state.phase,(!operator&&state.phase==='catalog')?'remote-menu':state.selected,state.mode,state.level,state.players,state.pending,state.pairing?.open,state.pairing?.code,state.countdown,state.game?.id==='seirama'?{round:state.game.round,answered:state.game.answered,revealed:state.game.revealed,answers:state.game.answers,skipped:state.game.skipped,revealReady:state.game.revealReady,nextReady:state.game.nextReady}:null,state.game?.id==='seirama'?privateState:null,draftAnswer,diag]);
 if(signature!==key){analogCancel();menuRelease();key=signature;neutral();document.body.classList.toggle('controller-only',!operator);app.innerHTML=operator?(state.phase==='catalog'?catalogView():consoleGame()):controller();gameCanvas=document.querySelector('#game');bindTouch();if(diag)showSettings(true);}

 const time=state.game?.elapsed||0,clock=document.querySelector('#game-clock');if(clock)clock.textContent=`${String(Math.floor(time/60)).padStart(2,'0')}:${String(Math.floor(time%60)).padStart(2,'0')}`;
 const progress=document.querySelector('#game-progress');if(progress)progress.textContent=state.game?.id==='orbit'?`${state.game.energies.filter((e:any)=>e.taken).length}/12 cahaya`:state.game?.id==='garden'?`🥕 ${state.game.harvest.carrot}/6   🍓 ${state.game.harvest.berry}/6`:'';
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
updateControllerViewport();window.visualViewport?.addEventListener('resize',()=>{updateControllerViewport();analogCancel();});
window.addEventListener('resize',()=>{updateControllerViewport();analogCancel();});
document.addEventListener('fullscreenchange',()=>{updateControllerViewport();analogCancel();if(document.fullscreenElement&&!operator){const orientation=screen.orientation as any;if(orientation?.lock){try{orientation.lock('landscape').catch(()=>{});}catch{}}}});
// Request during the same trusted gesture as using a control; never add a blocking entry screen.
for(const type of ['pointerdown','pointerup','click'])document.addEventListener(type,e=>{if(e.isTrusted&&!operator&&document.body.classList.contains('controller-only'))requestControllerFullscreen();},{capture:true});
async function autoJoin(scanned:string){app.innerHTML='<main class="loading">✦<br>Menyambungkan controller…</main>';try{const response=await fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invite:scanned})});const data=await response.json();if(!response.ok)throw Error(data.message||'Undangan tidak berlaku.');credential=data.token;sessionStore.setItem('mb-token',credential);connect();}catch(error:any){showJoin();toast(error.message);}}
async function showJoin(){
 document.body.classList.remove('controller-only','controls-modal');
 app.innerHTML=`<main class="join-wrap"><a class="brand" href="/join">${logo()} main bareng<span>LOCAL PLAY</span></a><section class="join-card"><div class="join-illustration">✦<span>♡</span></div><p class="eyebrow">HP KAMU, CONTROLLER KAMU.</p><h1>Masuk ke ruang kalian.</h1><p>Masukkan kode ruang jika tidak memakai QR.</p><form id="join-form">${invite?'<div class="invite-valid">✓ Undangan QR sudah terbaca</div>':'<label for="room-code">Kode ruang dari laptop</label><input id="room-code" name="code" inputmode="numeric" pattern="[0-9]{6}" maxlength="6" placeholder="6 digit kode" required>'}<button class="primary full" type="submit">Gabung & main bareng →</button></form><p class="join-note">Pastikan HP dan laptop terhubung ke Wi-Fi yang sama. Internet tidak diperlukan.</p></section><span class="join-bottom">DIBUAT UNTUK WAKTU YANG BERARTI.</span></main>`;
 document.querySelector('#join-form')!.addEventListener('submit',async e=>{e.preventDefault();const form=e.target as HTMLFormElement,button=form.querySelector('button')!;button.disabled=true;try{const data=new FormData(form),response=await fetch('/api/join',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name:data.get('name'),...(invite?{invite}:{code:data.get('code')})})});const p=await response.json();if(!response.ok)throw Error(p.message||'Tidak dapat bergabung.');credential=p.token;sessionStore.setItem('mb-token',credential);connect();}catch(e:any){toast(e.message);button.disabled=false;}});
}
function showSettings(diagnostics=false){
 document.body.classList.add('controls-modal');
 document.querySelector('#modal')?.remove();const modal=document.createElement('div');modal.id='modal';modal.className='modal';modal.innerHTML=`<section class="settings-panel"><div class="section-title"><h2>${diagnostics?'Jaringan & bantuan':'Buat senyaman kalian'}</h2><button data-do="close-settings" class="icon-button" aria-label="Tutup">×</button></div>${diagnostics?`<p>Gunakan satu Wi-Fi pribadi yang sama. Guest Wi-Fi bisa memblokir koneksi antarperangkat.</p><div class="info-box"><strong>${esc(state?.network?.base||location.origin)}</strong><p>RTT aplikasi: <span id="diag-rtt">—</span><br>Render: <span id="diag-fps">—</span><br>Koneksi: <span id="diag-connection">—</span></p></div><p>Jika HP tidak terhubung: periksa alamat IP, izin jaringan lokal browser, client isolation router dan firewall port aplikasi. Aplikasi tidak mengubah firewall atau Tailscale.</p><p class="muted">RTT adalah perjalanan pulang-pergi pesan, bukan ukuran sentuh-ke-gambar.</p>`:`<button class="setting-row" data-do="mute">Suara sintetis lokal <b>${muted?'Mati':'Aktif'}</b></button><button class="setting-row" data-do="motion">Kurangi animasi <b>${reduced?'Aktif':'Mati'}</b></button><button class="setting-row" data-do="left">Kontrol kidal <b>${leftHanded?'Aktif':'Mati'}</b></button><button class="setting-row" data-do="large">Tombol lebih besar <b>${large?'Aktif':'Mati'}</b></button><p class="muted">Preferensi tersimpan di browser perangkat ini.</p>`}${state?.you?.host?'<button class="danger full" data-do="reset">Akhiri ruang & hapus sesi</button>':''}${!operator?'<button class="subtle full" data-do="logout">Keluar controller</button>':''}</section>`;document.body.append(modal);
}
let audio:AudioContext;
function clickSound(){if(muted)return;try{audio??=new AudioContext();if(audio.state==='suspended')audio.resume();const o=audio.createOscillator(),v=audio.createGain();o.type='sine';o.frequency.setValueAtTime(520,audio.currentTime);o.frequency.exponentialRampToValueAtTime(290,audio.currentTime+.07);v.gain.setValueAtTime(.035,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+.09);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+.1);}catch{}}
function handleControl(b:HTMLButtonElement){if(operator||!b||b.disabled)return;const action=b.dataset.do;clickSound();
 if(action==='fullscreen'){requestControllerFullscreen();return;}
 if(action==='home'){analogCancel();send('home');return;}
 if(action==='stop-motion'){analogCancel();return;}
 if(action==='help'){analogCancel();send('pause');const selected=state.catalog.find((g:any)=>g.id===state.selected);showSettings();const panel=document.querySelector('.settings-panel');if(panel){const note=document.createElement('p');note.textContent=selected.instructions;panel.prepend(note);}return;}
 if(action==='remote-confirm')send(state.phase==='catalog'||state.phase==='results'?'start':'ready');
 if(action==='remote-back'){if(state.phase!=='catalog'&&state.you?.host)send('exit');else toast('Beranda konsol. Gunakan D-pad untuk memilih game.');}
 if(action==='select')send('select',{id:b.dataset.id});
 if(action==='mode')send('select',{mode:state.mode==='relaxed'?'challenge':'relaxed'});
 if(action==='level')send('select',{level:state.level%3+1});
 if(action==='next-arena'){send('exit');send('select',{level:state.level%3+1});send('start');}
 if(['start','pairing','ready','pause'].includes(action!))send(action!);
 if(action==='exit'&&confirm('Kembali ke katalog? Progres ronde ini akan dihapus.'))send('exit');
 if(['use','tool','plant','water','harvest','deposit','reveal','skip','next'].includes(action!))act(action!);
 if(action==='answer'){draftAnswer=Number(b.dataset.value);render();}if(action==='lock-answer'&&draftAnswer!==null){act('answer',draftAnswer);}
 if(action==='reset'&&confirm('Akhiri sesi dan hapus pemain serta jawaban?')){send('reset');document.querySelector('#modal')?.remove();document.body.classList.remove('controls-modal');}
 if(action==='settings')showSettings();if(action==='diagnostics'){diag=true;showSettings(true);}if(action==='close-settings'){diag=false;document.querySelector('#modal')?.remove();document.body.classList.remove('controls-modal');}
 if(action==='logout'){stopReconnect=true;sessionStore.removeItem('mb-token');socket?.close();location.href='/join';}
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
setInterval(()=>{if(role!=='player'||!connected||state?.phase!=='playing'||document.hidden)return;if(socket.bufferedAmount>8192){neutral();if(!blockedAt)blockedAt=performance.now();if(performance.now()-blockedAt>250)socket.close();return;}blockedAt=0;send('input.state',axes,true);},1000/30);
setInterval(()=>{const median=rtts.length?Math.round([...rtts].sort((a,b)=>a-b)[Math.floor(rtts.length*.5)]):null;const rtt=document.querySelector('#rtt');if(rtt)rtt.textContent=connected?`LAN · ${median??'—'} ms`:'Menghubungkan…';const vals={'#diag-rtt':`${median??'—'} ms median · ${rtts.length} sampel`,'#diag-fps':`${Math.round(fps)} FPS`,'#diag-connection':connected?'Terhubung':'Menghubungkan ulang'};for(const [id,v] of Object.entries(vals)){const el=document.querySelector(id);if(el)el.textContent=v;}},500);
function suspend(){analogCancel();menuRelease();if(operator)return;neutral();if(performance.now()<presentationUntil&&!document.hidden)return;if(['playing','countdown'].includes(state?.phase))send('pause');}
window.addEventListener('blur',suspend);document.addEventListener('visibilitychange',()=>{if(document.hidden)suspend();});window.addEventListener('pagehide',suspend);

// Seluruh artwork dirender lokal, tanpa gambar, font, atau audio jaringan luar.
function draw(time:number){requestAnimationFrame(draw);const dt=time-lastFrame;lastFrame=time;frameSamples.push(dt);if(frameSamples.length>60)frameSamples.shift();fps=1000/(frameSamples.reduce((a,b)=>a+b,0)/frameSamples.length);
 if(!gameCanvas||!state?.game)return;const c=gameCanvas.getContext('2d')!,g=state.game;c.clearRect(0,0,1280,720);
 if(g.id==='orbit')drawOrbit(c,g,time/1000);if(g.id==='garden')drawGarden(c,g);
}
const colors=['#efa99b','#b8e787'];
function circle(c:CanvasRenderingContext2D,x:number,y:number,r:number,fill:string){c.fillStyle=fill;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
function text(c:CanvasRenderingContext2D,label:string,x:number,y:number,size=20,color='#e9efdf'){c.fillStyle=color;c.font=`${size}px system-ui`;c.textAlign='center';c.fillText(label,x,y);}
function drawOrbit(c:CanvasRenderingContext2D,g:any,time:number){
 c.fillStyle='#121e2e';c.fillRect(0,0,1280,720);const glow=c.createRadialGradient(850,300,20,850,300,700);glow.addColorStop(0,'#293a4a');glow.addColorStop(1,'#121e2e');c.fillStyle=glow;c.fillRect(0,0,1280,720);
 for(let i=0;i<130;i++){const x=(Math.sin(i*12.73)*43758.5%1+1)%1*1280,y=(Math.sin(i*9.31)*86543.7%1+1)%1*720;circle(c,x,y,i%5===0?2:1,i%3?'#63778b':'#a9b9b3');}
 c.strokeStyle='#56738633';c.lineWidth=1;c.beginPath();c.ellipse(900,360,300,200,-.3,0,7);c.stroke();circle(c,950,110,75,'#384d53');circle(c,970,100,63,'#405b5b');
 const collected=g.energies.filter((e:any)=>e.taken).length;
 for(const e of g.energies)if(!e.taken){circle(c,e.x,e.y,19,'#d4df8522');text(c,'✦',e.x,e.y+8,30,'#e9e7a3');}
 for(const o of g.obstacles){const y=o.y+Math.sin(g.elapsed+o.phase)*70;circle(c,o.x,y,o.r,'#7b7186');circle(c,o.x-8,y-6,7,'#645e72');circle(c,o.x+9,y+8,5,'#645e72');}
 for(const [i,y] of [260,460].entries()){circle(c,1140,y,50,collected===12&&g.gateOpen?'#b8e78722':'#ffffff07');c.strokeStyle=collected===12&&g.gateOpen?colors[i]:'#52626c';c.lineWidth=3;c.beginPath();c.arc(1140,y,46,0,7);c.stroke();text(c,i?'B':'A',1140,y+8,24,collected===12?colors[i]:'#73808b');}
 text(c,collected<12?'12 cahaya membuka jalan pulang':g.gateOpen?'Masing-masing tempati satu pad':'Tunggu gerbang menyala',1080,570,16,'#bac8c8');
 if(g.gate>0){c.fillStyle='#b8e787';c.fillRect(1040,600,200*Math.min(g.gate/2,1),5);}
 for(const [i,p] of g.players.entries()){
  c.save();c.translate(p.x,p.y);if(p.down)c.globalAlpha=.5;circle(c,0,0,28,colors[i]+'18');c.fillStyle=colors[i];c.beginPath();c.moveTo(27,0);c.lineTo(-19,-17);c.lineTo(-12,0);c.lineTo(-19,17);c.closePath();c.fill();circle(c,0,0,7,'#253642');if(!p.down){c.fillStyle='#ffc98c';c.beginPath();c.moveTo(-17,-6);c.lineTo(-28-(reduced?0:Math.sin(time*20)*5),0);c.lineTo(-17,6);c.fill();}c.restore();text(c,p.down?'Bantu aku ♡':i?'B':'A',p.x,p.y-35,16,colors[i]);
 }
 text(c,`ARENA ${g.level} / 3`,85,42,14,'#9eaec0');
}
function drawGarden(c:CanvasRenderingContext2D,g:any){
 c.fillStyle='#9bac82';c.fillRect(0,0,1280,720);const sx=256,sy=73,cell=96;
 for(let y=0;y<6;y++)for(let x=0;x<8;x++){c.fillStyle=(x+y)%2?'#b1c394':'#acc08f';c.beginPath();c.roundRect(sx+x*cell+2,sy+y*cell+2,cell-4,cell-4,12);c.fill();}
 text(c,'🥕',sx+48,sy+57,39);text(c,'🍓',sx+144,sy+57,39);text(c,'BIBIT',sx+96,sy-14,16,'#344c3a');text(c,'💧',sx+7*cell+48,sy+58,40);text(c,'🧺',sx+7*cell+48,sy+5*cell+60,44);text(c,'PETI PANEN',sx+7*cell+48,sy+6*cell+30,15,'#344c3a');
 for(const t of g.plots){const x=sx+t.x*cell+8,y=sy+t.y*cell+8;c.fillStyle='#846a52';c.beginPath();c.roundRect(x,y,80,80,13);c.fill();for(let j=0;j<3;j++){c.fillStyle='#735c472e';c.fillRect(x+12,y+15+j*22,56,5);}if(t.stage!=='empty')text(c,t.stage==='ripe'?(t.crop==='carrot'?'🥕':'🍓'):t.stage==='seed'?'·':'🌱',x+40,y+51,t.stage==='seed'?50:36,'#e8d5aa');if(t.stage==='growing'){c.fillStyle='#a7d7aa';c.fillRect(x+8,y+68,64*Math.min(t.growth/12,1),4);}}
 for(const [i,p] of g.players.entries()){const x=sx+p.x*cell+48,y=sy+p.y*cell+48;circle(c,x,y+12,25,'#344c3a22');circle(c,x,y,25,colors[i]);text(c,i?'B':'A',x,y+7,23,'#243a2d');circle(c,x+p.dx*27,y+p.dy*27,5,'#2b4130');if(p.carry)text(c,p.carry==='carrot'?'🥕':'🍓',x,y-33,23);}
 text(c,'TUMBUH BERSAMA',128,330,13,'#4b624a');text(c,'kebun',128,365,36,'#36513a');text(c,'kita.',128,407,36,'#36513a');text(c,'Tanpa terburu-buru.',128,446,15,'#526a50');text(c,'🥕 '+g.harvest.carrot+' / 6',1145,330,28,'#344c3a');text(c,'🍓 '+g.harvest.berry+' / 6',1145,385,28,'#344c3a');
}
if(operator){for(const type of ['pointerdown','pointerup','click','dblclick','contextmenu','wheel','keydown','keyup'])document.addEventListener(type,e=>{e.preventDefault();e.stopImmediatePropagation();},{capture:true,passive:false});}
requestAnimationFrame(draw);
async function bootDisplay(){try{const response=await fetch('/api/operator',{method:'POST'});if(!response.ok)throw Error('Buka URL layar laptop yang ditampilkan terminal.');credential=(await response.json()).token;connect();}catch(e:any){app.innerHTML=`<div class="loading">${esc(e.message)}</div>`;}}
async function init(){
 if(operator){await bootDisplay();}
 else if(location.pathname==='/console'){app.innerHTML='<div class="loading">Buka layar konsol melalui URL lokal di terminal laptop.<br>Di HP, buka /join untuk menjadi controller.</div>';}
 else if(credential)connect();else if(invite){const scanned=invite;invite='';autoJoin(scanned);}else showJoin();
}
init();
