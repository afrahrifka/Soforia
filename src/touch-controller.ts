import {GLASS_TURN_LEFT,GLASS_TURN_RIGHT} from './glass-controls.ts';
export type TouchPreferences={leftHanded:boolean;large:boolean;draftAnswer:number|null;connected:boolean};
const escape=(s:any)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const button=(action:string,label:string,icon:string,disabled=false,extra='')=>`<button class="touch-action ${extra}" data-do="${action}" aria-label="${escape(label)}" ${disabled?'disabled':''}><span aria-hidden="true">${icon}</span><small>${escape(label)}</small></button>`;
const glassKey=(axis:'x'|'y',value:number,label:string,icon:string,disabled:boolean)=>`<button class="touch-action glass-key" data-glass-${axis}="${value}" aria-label="${label}" aria-pressed="false" ${disabled?'disabled':''}><span aria-hidden="true">${icon}</span><small>${label}</small></button>`;
export function touchMarkup(state:any,personal:any,prefs:TouchPreferences){
 const host=state.you.host,phase=state.phase,game=state.game,quiz=phase==='playing'&&game?.id==='seirama';let buttons='';
 if(phase==='catalog')buttons=button('remote-confirm','Main','▶',false,'accent')+button('settings','Pengaturan','⚙');
 else if(phase==='tutorial'||phase==='paused')buttons=button('ready',state.players[state.you.slot]?.ready?'Menunggu':'Siap','✓',state.players[state.you.slot]?.ready,'accent')+button('mute','Suara','♪')+button('home','Home','⌂');
 else if(phase==='countdown')buttons=button('noop',String(state.countdown||1),'◷',true,'accent')+button('mute','Suara','♪')+button('home','Home','⌂');
 else if(phase==='results')buttons=button('start','Main lagi','↻',false,'accent')+button('home','Pilih game','⌂')+button('settings','Pengaturan','⚙');
 else if(game?.id==='glass')buttons=game.stageClear?button('next',game.nextReady[state.you.slot]?'Menunggu pasangan':'Stage berikutnya','→',game.nextReady[state.you.slot],'accent')+button('mute','Suara','♪'):glassKey('x',GLASS_TURN_LEFT,'Putar kiri','↶',game.retryTime>0)+glassKey('y',-1,'Naikkan','↑',game.retryTime>0)+glassKey('x',GLASS_TURN_RIGHT,'Putar kanan','↷',game.retryTime>0)+glassKey('y',1,'Turunkan','↓',game.retryTime>0)+button('jump','Lompat','⇧',game.retryTime>0,'accent jump-key');
 else if(game?.id==='property')buttons=button('use',game.turn===state.you.slot?(game.pending?(game.decision==='upgrade'?'Tingkatkan':'Beli properti'):game.stage==='rolling'?'Mengundi…':game.stage==='moving'?'Berjalan…':'Lempar dadu'):'Giliran lawan','⚄',game.turn!==state.you.slot||!['ready','decision'].includes(game.stage),'accent')+button('tool','Lewati', '→',!game.pending||game.turn!==state.you.slot);
 else if(game?.id==='orbit')buttons=button('use','Pulsa pelindung','✦',game.players[state.you.slot].pulse>0||game.players[state.you.slot].down>0,'accent')+button('mute','Suara','♪');
 else if(game?.id==='garden')buttons=button('plant','Tanam','🌱',false,'garden-tool')+button('water','Siram','💧',false,'garden-tool')+button('harvest','Panen','🧺',false,'garden-tool')+button('deposit','Antar','↗',!game.players[state.you.slot].carry)+button('use','Aksi / bibit','✋');
 else if(quiz){
  const answered=personal.answer!==null&&personal.answer!==undefined;
  if(game.revealed)buttons=button('next',personal.nextReady?'Menunggu':'Lanjut','→',personal.nextReady,'accent')+button('mute','Suara','♪')+button('home','Home','⌂');
  else {
   buttons=game.question[1].map((choice:string,i:number)=>`<button class="touch-action answer-key ${((answered?personal.answer:prefs.draftAnswer)===i)?'chosen':''}" data-do="answer" data-value="${i}" aria-label="${'ABCD'[i]}: ${escape(choice)}" ${answered?'disabled':''}><span>${'ABCD'[i]}</span><small>${escape(choice)}</small></button>`).join('');
   buttons+=answered?button('reveal',personal.revealReady?'Menunggu':'Ungkap','♡',personal.revealReady||!game.answered.every(Boolean),'accent'):button('lock-answer','Kunci','✓',prefs.draftAnswer===null,'accent');
   buttons+=button('skip','Lewati','→');
  }
 }else buttons=button('stop-motion','Berhenti','■')+button('mute','Suara','♪');
 const analogDisabled=!prefs.connected||(phase==='catalog'?false:phase==='playing'?!!(game?.id==='glass'&&(game.retryTime>0||game.stageClear)||quiz&&(game.revealed||personal.answer!==null&&personal.answer!==undefined)):true);
 return `<main class="touch-screen ${prefs.leftHanded?'left-handed':''} ${prefs.large?'big-controls':''}" data-phase="${phase}" data-game="${game?.id||'catalog'}" data-glass-controls="${game?.id==='glass'&&phase==='playing'&&!game.stageClear}"><div class="touch-utilities"><button class="touch-utility home-key ${prefs.connected?'connected':'disconnected'}" data-do="home" aria-label="Home">⌂</button>${state.game?`<button class="touch-utility pause-key" data-do="pause" aria-label="Jeda" ${['playing','countdown'].includes(phase)?'':'disabled'}>Ⅱ</button><button class="touch-utility" data-do="help" aria-label="Cara main">?</button>${game?.id==='glass'?'<button class="touch-utility" data-do="retry" aria-label="Ulang checkpoint">↻</button>':''}`:''}${host&&state.game?`<button class="touch-utility qr-key" data-do="pairing-toggle" aria-label="Tampilkan QR" aria-pressed="${!!state.qrVisible}" ${state.players.filter((p:any)=>p.connected).length>=2?'disabled':''}>▦</button>`:''}<button class="touch-utility" data-do="fullscreen" aria-label="Layar penuh">⛶</button></div><section class="touch-layout"><div class="analog-zone"><div id="pad" class="analog ${analogDisabled?'analog-disabled':''}" role="group" aria-label="${phase==='catalog'?'Analog pilih game':quiz?'Analog pilih jawaban':'Analog gerak karakter'}" data-disabled="${analogDisabled}"><span class="analog-guide" aria-hidden="true">✥</span><div id="knob" aria-hidden="true"></div></div>${game?.id==='glass'&&phase==='playing'?'<small class="stick-caption">GERAK KARAKTER</small>':''}</div><div class="action-zone ${game?.id==='glass'&&phase==='playing'&&!game.stageClear?'glass-actions':buttons.includes('garden-tool')||quiz&&!game.revealed?'six-actions':''}" role="group" aria-label="Tombol aksi">${buttons}</div></section></main>`;
}
export function syncTouch(state:any,connected:boolean,muted:boolean){
 const qr=document.querySelector<HTMLButtonElement>('[data-do=pairing-toggle]');if(qr){qr.setAttribute('aria-pressed',String(!!state.qrVisible));qr.setAttribute('aria-label',state.qrVisible?'Sembunyikan QR':'Tampilkan QR');qr.disabled=state.players.filter((p:any)=>p.connected).length>=2||!connected;}
 document.querySelector('.home-key')?.classList.toggle('connected',connected);document.querySelector('.home-key')?.classList.toggle('disconnected',!connected);
 if(state.phase==='playing'&&state.game?.id==='orbit'){
  const p=state.game.players[state.you.slot],pulse=document.querySelector<HTMLButtonElement>('[data-do=use]');if(pulse){pulse.disabled=p.pulse>0||p.down>0;const text=pulse.querySelector('small');if(text)text.textContent=p.pulse>0?`Pulsa · ${Math.ceil(p.pulse)} dtk`:'Pulsa pelindung';}
 }
 if(state.phase==='playing'&&state.game?.id==='garden'){
  const p=state.game.players[state.you.slot],deposit=document.querySelector<HTMLButtonElement>('[data-do=deposit]');if(deposit)deposit.disabled=!p.carry;
  for(const [name,tool] of [['plant',0],['water',1],['harvest',2]] as const)document.querySelector(`[data-do=${name}]`)?.classList.toggle('equipped',p.tool===tool);
 }
 const mute=document.querySelector<HTMLButtonElement>('.touch-action[data-do=mute]');if(mute)mute.setAttribute('aria-pressed',String(muted));
}
