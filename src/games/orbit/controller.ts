import {button} from '../../shared/html.ts';
export function controller(state:any){const p=state.game.players[state.you.slot];return {buttons:button('use','Pulsa pelindung','✦',p.pulse>0||p.down>0,'accent')+button('mute','Suara','♪')};}
export function syncController(state:any){if(state.phase!=='playing')return;const p=state.game.players[state.you.slot],pulse=document.querySelector<HTMLButtonElement>('[data-do=use]');if(pulse){pulse.disabled=p.pulse>0||p.down>0;const text=pulse.querySelector('small');if(text)text.textContent=p.pulse>0?`Pulsa · ${Math.ceil(p.pulse)} dtk`:'Pulsa pelindung';}}
