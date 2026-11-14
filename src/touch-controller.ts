export type TouchPreferences={leftHanded:boolean;large:boolean;draftAnswer:number|null;connected:boolean};
const escape=(s:any)=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
const button=(action:string,label:string,icon:string,disabled=false,extra='')=>`<button class="touch-action ${extra}" data-do="${action}" aria-label="${escape(label)}" ${disabled?'disabled':''}><span aria-hidden="true">${icon}</span><small>${escape(label)}</small></button>`;
export function touchMarkup(state:any,personal:any,prefs:TouchPreferences){
 const host=state.you.host,phase=state.phase,game=state.game,quiz=phase==='playing'&&game?.id==='seirama';let buttons='';
 if(phase==='catalog')buttons=button('remote-confirm','Main','▶',!host,'accent')+button('mode','Mode','☁',!host)+button('level','Arena','▦',!host||state.selected!=='orbit')+button('settings','Pengaturan','⚙');
 else if(phase==='tutorial'||phase==='paused')buttons=button('ready',state.players[state.you.slot]?.ready?'Menunggu':'Siap','✓',state.players[state.you.slot]?.ready,'accent')+button('help','Cara main','?',false)+button('mute','Suara','♪')+button('home','Home','⌂');
 else if(phase==='countdown')buttons=button('noop',String(state.countdown||1),'◷',true,'accent')+button('pause','Jeda','Ⅱ')+button('mute','Suara','♪')+button('home','Home','⌂');
 else if(phase==='results')buttons=button('start','Main lagi','↻',!host,'accent')+button('home','Pilih game','⌂')+button('next-arena','Arena lanjut','▦',!host||state.selected!=='orbit')+button('settings','Pengaturan','⚙');
 else if(game?.id==='garden')buttons=button('plant','Tanam','🌱',false,'garden-tool')+button('water','Siram','💧',false,'garden-tool')+button('harvest','Panen','🧺',false,'garden-tool')+button('deposit','Antar','↗',!game.players[state.you.slot].carry)+button('use','Aksi / bibit','✋')+button('pause','Jeda','Ⅱ');
 else if(quiz){
  const answered=personal.answer!==null&&personal.answer!==undefined;
  if(game.revealed)buttons=button('next',personal.nextReady?'Menunggu':'Lanjut','→',personal.nextReady,'accent')+button('pause','Jeda','Ⅱ')+button('mute','Suara','♪')+button('home','Home','⌂');
  else {
   buttons=game.question[1].map((choice:string,i:number)=>`<button class="touch-action answer-key ${((answered?personal.answer:prefs.draftAnswer)===i)?'chosen':''}" data-do="answer" data-value="${i}" aria-label="${'ABCD'[i]}: ${escape(choice)}" ${answered?'disabled':''}><span>${'ABCD'[i]}</span><small>${escape(choice)}</small></button>`).join('');
   buttons+=answered?button('reveal',personal.revealReady?'Menunggu':'Ungkap','♡',personal.revealReady||!game.answered.every(Boolean),'accent'):button('lock-answer','Kunci','✓',prefs.draftAnswer===null,'accent');
   buttons+=button('skip','Lewati','→');
  }
 }else buttons=button('pause','Jeda','Ⅱ')+button('help','Cara main','?')+button('stop-motion','Berhenti','■')+button('mute','Suara','♪');
 const analogDisabled=!prefs.connected||(phase==='catalog'?!host:phase==='playing'?!!(quiz&&(game.revealed||personal.answer!==null&&personal.answer!==undefined)):true);
 return `<main class="touch-screen ${prefs.leftHanded?'left-handed':''} ${prefs.large?'big-controls':''}" data-phase="${phase}" data-game="${game?.id||'catalog'}"><div class="touch-utilities"><button class="touch-utility home-key ${prefs.connected?'connected':'disconnected'}" data-do="home" aria-label="Home">⌂</button><button class="touch-utility" data-do="fullscreen" aria-label="Layar penuh">⛶</button></div><section class="touch-layout"><div class="analog-zone"><div id="pad" class="analog ${analogDisabled?'analog-disabled':''}" role="group" aria-label="${phase==='catalog'?'Analog pilih game':quiz?'Analog pilih jawaban':'Analog gerak karakter'}" data-disabled="${analogDisabled}"><span class="analog-guide" aria-hidden="true">✥</span><div id="knob" aria-hidden="true"></div></div></div><div class="action-zone ${buttons.includes('garden-tool')||quiz&&!game.revealed?'six-actions':''}" role="group" aria-label="Tombol aksi">${buttons}</div></section></main>`;
}
export function syncTouch(state:any,connected:boolean,muted:boolean){
 document.querySelector('.home-key')?.classList.toggle('connected',connected);document.querySelector('.home-key')?.classList.toggle('disconnected',!connected);
 if(state.phase==='catalog'){const arena=document.querySelector<HTMLButtonElement>('[data-do=level]');if(arena)arena.disabled=!state.you.host||state.selected!=='orbit';}
 if(state.phase==='playing'&&state.game?.id==='garden'){
  const p=state.game.players[state.you.slot],deposit=document.querySelector<HTMLButtonElement>('[data-do=deposit]');if(deposit)deposit.disabled=!p.carry;
  for(const [name,tool] of [['plant',0],['water',1],['harvest',2]] as const)document.querySelector(`[data-do=${name}]`)?.classList.toggle('equipped',p.tool===tool);
 }
 const mute=document.querySelector<HTMLButtonElement>('.touch-action[data-do=mute]');if(mute)mute.setAttribute('aria-pressed',String(muted));
}
