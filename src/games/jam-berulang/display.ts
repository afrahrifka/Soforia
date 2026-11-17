import {esc} from '../../shared/html.ts';
import {LEVELS} from './levels.ts';
/** Ringkasan waktu bersama di samping overlay hasil milik host. */
export function display(state:any){
 if(state.phase!=='results')return '';
 return `<aside class="clock-final-timeline" aria-label="Garis waktu bersama"><small>ARSIP DUA PENJAGA</small><h3>Menit yang kita lalui</h3>${state.game.completed.map((district:any)=>{
  const loops=[...district.timeline,{id:'akhir',duration:district.time,events:district.events}];
  return `<section><strong>${esc(LEVELS[district.district].title)}</strong>${loops.map((loop:any,index:number)=>{
   const duration=Math.max(1,loop.duration),description=loop.events.map((e:any)=>`${Math.round(e.t)}s: ${e.label}`).join('; ');
   return `<div class="clock-final-loop"><span>${index+1}</span><svg viewBox="0 0 180 20" role="img" aria-label="${esc(`Loop ${index+1}, ${Math.round(duration)} detik. ${description}`)}"><title>${esc(description||'Perjalanan Pelari')}</title><path d="M5 10H175" stroke="#688d98" stroke-width="3"/>${loop.events.map((e:any)=>`<circle cx="${5+Math.min(1,e.t/duration)*170}" cy="10" r="4" fill="#eec68c"/>`).join('')}</svg><small>${Math.round(duration)}s</small></div>`;
  }).join('')}</section>`;
 }).join('')}</aside>`;
}
