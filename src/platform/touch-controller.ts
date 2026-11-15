import {catalogController,syncCatalogController} from '../dashboard/controller.ts';
import {gameClient} from './client-registry.ts';import {button} from '../shared/html.ts';
export type TouchPreferences={leftHanded:boolean;large:boolean;draftAnswer:number|null;connected:boolean};
export function touchMarkup(state:any,personal:any,prefs:TouchPreferences){
 if(state.phase==='catalog')return catalogController(state,prefs);
 const host=state.you.host,phase=state.phase,game=state.game,view=game?gameClient(game.id).controller(state,personal,prefs):{buttons:''};let buttons='';
 if(phase==='catalog')buttons=button('remote-confirm','Main','▶',false,'accent')+button('settings','Pengaturan','⚙');
 else if(phase==='tutorial'||phase==='paused')buttons=button('ready',state.players[state.you.slot]?.ready?'Menunggu':'Siap','✓',state.players[state.you.slot]?.ready,'accent')+button('mute','Suara','♪')+button('home','Home','⌂');
 else if(phase==='countdown')buttons=button('noop',String(state.countdown||1),'◷',true,'accent')+button('mute','Suara','♪')+button('home','Home','⌂');
 else if(phase==='results')buttons=button('start','Main lagi','↻',false,'accent')+button('home','Pilih game','⌂')+button('settings','Pengaturan','⚙');else buttons=view.buttons;
 const playing=phase==='playing',analogDisabled=!prefs.connected||(phase==='catalog'?false:playing?!!view.analogDisabled:true);
 return `<main data-game-scope="${game?.id||'dashboard'}" class="touch-screen ${prefs.leftHanded?'left-handed':''} ${prefs.large?'big-controls':''}" data-phase="${phase}" data-game="${game?.id||'catalog'}" ${playing?view.attributes||'':''}><div class="touch-utilities"><button class="touch-utility home-key ${prefs.connected?'connected':'disconnected'}" data-do="home" aria-label="Home">⌂</button>${state.game?`<button class="touch-utility pause-key" data-do="pause" aria-label="Jeda" ${['playing','countdown'].includes(phase)?'':'disabled'}>Ⅱ</button><button class="touch-utility" data-do="help" aria-label="Cara main">?</button>${view.utilities||''}`:''}${host&&state.game?`<button class="touch-utility qr-key" data-do="pairing-toggle" aria-label="Tampilkan QR" aria-pressed="${!!state.qrVisible}" ${state.players.filter((p:any)=>p.connected).length>=2?'disabled':''}>▦</button>`:''}<button class="touch-utility" data-do="fullscreen" aria-label="Layar penuh">⛶</button></div><section class="touch-layout"><div class="analog-zone"><div id="pad" class="analog ${analogDisabled?'analog-disabled':''}" role="group" aria-label="${phase==='catalog'?'Analog pilih game':view.analogLabel||'Analog gerak karakter'}" data-disabled="${analogDisabled}"><span class="analog-guide" aria-hidden="true">✥</span><div id="knob" aria-hidden="true"></div></div>${playing&&view.caption?`<small class="stick-caption">${view.caption}</small>`:''}</div><div class="action-zone ${playing?view.actionClass||'':''}" role="group" aria-label="Tombol aksi">${buttons}</div></section></main>`;
}
export function syncTouch(state:any,connected:boolean,muted:boolean){
 if(state.phase==='catalog')syncCatalogController(state,connected);
 const qr=document.querySelector<HTMLButtonElement>('[data-do=pairing-toggle]');if(qr){qr.setAttribute('aria-pressed',String(!!state.qrVisible));qr.setAttribute('aria-label',state.qrVisible?'Sembunyikan QR':'Tampilkan QR');qr.disabled=state.players.filter((p:any)=>p.connected).length>=2||!connected;}
 document.querySelector('.home-key')?.classList.toggle('connected',connected);document.querySelector('.home-key')?.classList.toggle('disconnected',!connected);
 if(state.game)gameClient(state.game.id).syncController?.(state,connected,muted);
 const mute=document.querySelector<HTMLButtonElement>('.touch-action[data-do=mute]');if(mute)mute.setAttribute('aria-pressed',String(muted));
}
