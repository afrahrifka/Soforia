import type {GameServer} from '../../shared/game-contracts.ts';
import {MISSIONS,BOUNDS} from './maps.ts';
import {clamp,wrap,blocked} from './physics.ts';
export const LIMITS={captureDistance:.62,captureAngle:14*Math.PI/180,captureSpeed:.42,captureSpin:.18,dockDistance:.34,dockSpeed:.16,dockSpin:.07};
export function fuelCapacity(mode:string){return mode==='relaxed'?100:75;}
function message(g:any,text:string){g.message=text;g.messageUntil=g.clock+4;g.revision++;}
function prepare(g:any,mission:number,phase='briefing'){
 g.mission=clamp(mission,0,MISSIONS.length-1);const map=MISSIONS[g.mission];g.phase=phase;g.index=0;g.clock=0;g.fuel=fuelCapacity(g.mode);g.fuelUsed=0;g.docked=0;g.attached=false;g.dockRequested=false;g.dockHold=0;g.brakeTime=0;g.emptyTime=0;g.rescue=null;g.roundRescues=0;g.roundContacts=0;g.contactCooldown=0;g.viewYaw=0;g.viewTilt=.75;g.thrustActive=0;g.brakingActive=false;g.overSpin=false;
 g.modules=map.deliveries.map((d,i)=>{const variant=g.variant||0,offset=variant?Math.sin(g.seed*.013+variant*2.7+i)*.22:0;return {x:d.spawn.x,y:d.spawn.y+offset,angle:wrap(d.initial+variant*.37),vx:0,vy:0,omega:0,kind:d.kind,status:i?'queued':'free'};});
 g.arm={x:clamp(map.deliveries[0].spawn.x-1,-BOUNDS.x,BOUNDS.x),y:map.deliveries[0].spawn.y};g.history=[];g.revision++;message(g,phase==='briefing'?map.brief:'A dekati titik capit. B sejajarkan sudut tangkap.');
}
export function currentSpec(g:any){return MISSIONS[g.mission].deliveries[g.index];}
export function sensors(g:any){const m=g.modules[g.index],d=currentSpec(g);if(!m||!d)return null;return {distance:Math.hypot(m.x-g.arm.x,m.y-g.arm.y),captureError:wrap(d.capture-m.angle),dockError:wrap(d.dock-m.angle),dockDistance:Math.hypot(m.x-d.target.x,m.y-d.target.y),speed:Math.hypot(m.vx,m.vy),spin:Math.abs(m.omega)};}
function recall(g:any){if(g.phase!=='assembly'||g.rescue)return;g.modules[g.index].status='recovering';g.rescue={from:{x:g.modules[g.index].x,y:g.modules[g.index].y},arm:{...g.arm},time:0};g.attached=false;g.dockRequested=false;g.dockHold=0;g.roundRescues++;message(g,'Tug servis memulihkan modul aktif. Modul terpasang tetap aman.');}
function burn(g:any,amount:number){const spent=Math.min(g.fuel,amount);g.fuel-=spent;g.fuelUsed+=spent;}
function dock(g:any){
 const m=g.modules[g.index],d=currentSpec(g);Object.assign(m,{x:d.target.x,y:d.target.y,angle:d.dock,vx:0,vy:0,omega:0,status:'installed'});g.docked++;g.history.push({name:d.name,time:g.clock,fuel:g.fuel});g.fuel=fuelCapacity(g.mode);g.attached=false;g.dockRequested=false;g.dockHold=0;g.brakeTime=0;g.emptyTime=0;g.revision++;
 if(g.index===2){g.phase='showcase';g.roundTime=g.clock;g.completed.push({mission:g.mission,mode:g.mode,time:g.clock,fuelRemaining:g.history.at(-1).fuel,fuelUsed:g.fuelUsed,rescues:g.roundRescues,contacts:g.roundContacts,overtime:g.mode!=='relaxed'&&g.clock>MISSIONS[g.mission].time,variant:g.variant});g.score+=3;message(g,'Stasiun utuh. Putar untuk meninjau karya kalian, lalu pilih misi berikutnya.');}
 else {g.index++;g.modules[g.index].status='free';message(g,'Checkpoint tersimpan. Bahan bakar penuh; modul berikutnya siap ditangkap.');}
}
const axis=(input:any,key:string)=>Number.isFinite(input?.[key])?clamp(input[key],-1,1):0;
const server:GameServer={
 create(base){const g:any={...base,mission:0,phase:'briefing',variant:0,revision:0,activeTime:0,completed:[]};prepare(g,Math.floor((Number.isFinite(base.level)?base.level:1)-1));return g;},
 action(g,slot,name,value){
  if(slot!==0&&slot!==1||g.finished)return;
  if(g.phase==='briefing'){if(slot!==0)return;if(name==='next'||name==='previous'){prepare(g,(g.mission+(name==='next'?1:MISSIONS.length-1))%MISSIONS.length);return;}if(name==='start-relaxed'||name==='start-challenge'){g.mode=name==='start-relaxed'?'relaxed':'challenge';prepare(g,g.mission,'assembly');}return;}
  if(g.phase==='showcase'){if(name==='reset-view'){g.viewYaw=0;g.viewTilt=.75;g.thrustActive=0;g.brakingActive=false;g.overSpin=false;return;}if(slot!==0)return;if(name==='next'){prepare(g,(g.mission+1)%MISSIONS.length);return;}if(name==='replay'){g.variant++;prepare(g,g.mission,'assembly');return;}if(name==='finish')g.finished=true;return;}
  if(name==='recall'){recall(g);return;}if(g.rescue)return;
  if(name==='grip'&&slot===0){if(g.attached){g.attached=false;g.modules[g.index].status='free';g.dockRequested=false;g.dockHold=0;message(g,'Capit dibuka; modul melayang bebas.');return;}const s=sensors(g)!;if(s.distance>LIMITS.captureDistance){message(g,'Capit belum dekat. A periksa sensor jarak.');return;}if(Math.abs(s.captureError)>LIMITS.captureAngle||s.spin>LIMITS.captureSpin){message(g,'Tangkapan belum sejajar. B periksa sudut dan rem.');return;}if(s.speed>LIMITS.captureSpeed){message(g,'Modul masih melaju. B perlambat sebelum menutup capit.');return;}g.attached=true;g.modules[g.index].status='held';message(g,'Capit mengunci. A memindahkan; B menjaga orientasi dan kecepatan.');return;}
  if(name==='dock'&&slot===0){if(!g.attached){message(g,'Tangkap modul sebelum meminta pemasangan.');return;}g.dockRequested=!g.dockRequested;g.dockHold=0;message(g,g.dockRequested?'Pemasangan disiapkan. Sejajarkan cincin; B tahan Rem saat diam.':'Pemasangan dibatalkan.');}
 },
 tick(g,inputs,dt){
  if(g.finished||!Number.isFinite(dt)||dt<=0)return;const a=inputs[0]||{},b=inputs[1]||{};
  if(g.phase!=='assembly'){g.viewYaw=wrap(g.viewYaw+(axis(a,'x')+axis(b,'x'))*.65*Math.min(dt,.1));g.viewTilt=clamp(g.viewTilt+(axis(a,'y')+axis(b,'y'))*.35*Math.min(dt,.1),.3,1.15);return;}
  let left=Math.min(dt,2);while(left>1e-8&&g.phase==='assembly'){
   const step=Math.min(left,1/120);left-=step;g.clock+=step;g.activeTime+=step;g.contactCooldown=Math.max(0,g.contactCooldown-step);const m=g.modules[g.index],d=currentSpec(g),map=MISSIONS[g.mission];
   if(g.rescue){g.rescue.time+=step;const t=clamp(g.rescue.time/3,0,1),u=t*t*(3-2*t);m.x=g.rescue.from.x+(d.spawn.x-g.rescue.from.x)*u;m.y=g.rescue.from.y+(d.spawn.y-g.rescue.from.y)*u;m.vx=m.vy=m.omega=0;g.arm.x=g.rescue.arm.x+(d.spawn.x-1-g.rescue.arm.x)*u;g.arm.y=g.rescue.arm.y+(d.spawn.y-g.rescue.arm.y)*u;if(t>=1){m.angle=d.initial;m.status='free';g.rescue=null;g.fuel=fuelCapacity(g.mode);g.emptyTime=0;message(g,'Servis selesai. Coba lagi dari checkpoint modul ini.');}continue;}
   const x=axis(a,'x'),y=axis(a,'y'),len=Math.max(1,Math.hypot(x,y)),fine=axis(a,'fine')>.1,speed=fine?.42:1.25;g.arm.x=clamp(g.arm.x+x/len*speed*step,-BOUNDS.x,BOUNDS.x);g.arm.y=clamp(g.arm.y+y/len*speed*step,-BOUNDS.y,BOUNDS.y);
   const turn=axis(b,'x'),thrust=axis(b,'thrust'),brake=axis(b,'brake')>.1,power=g.fuel>0?1:0;g.thrustActive=thrust*power;g.brakingActive=brake;m.omega=clamp(m.omega+turn*.8/d.mass*power*step,-.75,.75);m.omega*=Math.exp(-(brake?7:.36)*step);m.vx+=Math.cos(m.angle)*thrust*.85/d.mass*power*step;m.vy+=Math.sin(m.angle)*thrust*.85/d.mass*power*step;burn(g,(Math.abs(turn)*.75+Math.abs(thrust)*1.25+(brake?.35:0))*step);
   // Kopling RCS abstrak: putaran berlebihan memberi drift halus, bukan kerusakan.
   const overdrive=Math.max(0,Math.abs(m.omega)-.55)*.11;g.overSpin=overdrive>0;if(overdrive){m.vx+=Math.cos(m.angle+Math.PI/2)*overdrive*step;m.vy+=Math.sin(m.angle+Math.PI/2)*overdrive*step;}
   if(g.attached){const dx=g.arm.x-m.x,dy=g.arm.y-m.y,dist=Math.hypot(dx,dy);if(dist>3){g.attached=false;m.status='free';g.dockRequested=false;message(g,'Capit melepas beban yang tertarik terlalu jauh. Dekati dan tangkap kembali.');}else{m.vx+=dx*5/d.mass*step;m.vy+=dy*5/d.mass*step;}}
   const drag=brake?3.8:g.attached?1.6:.08;m.vx*=Math.exp(-drag*step);m.vy*=Math.exp(-drag*step);const v=Math.hypot(m.vx,m.vy),max=.95;if(v>max){m.vx*=max/v;m.vy*=max/v;}
   const installed=g.modules.filter((p:any)=>p.status==='installed'),hit=(pose:any)=>blocked(g.mission,pose,g.clock,installed);let contact=false;
   for(const key of ['x','y'] as const){const candidate={...m,[key]:m[key==='x'?'x':'y']+m[key==='x'?'vx':'vy']*step};if(!hit(candidate))m[key]=candidate[key];else{m[key==='x'?'vx':'vy']*=-.12;contact=true;}}
   const rotated={...m,angle:wrap(m.angle+m.omega*step)};if(!hit(rotated))m.angle=rotated.angle;else{m.omega*=-.15;contact=true;}
   // Gantri dapat memasuki beban yang diam; dorong perlahan, tanpa kerusakan.
   const overlap=hit(m);if(overlap&&overlap!=='boundary'){const o=map.obstacles.find(o=>o.id===overlap);if(o){const dx=m.x-o.x,dy=m.y-o.y,n=Math.max(.01,Math.hypot(dx,dy));m.x=clamp(m.x+dx/n*.7*step,-BOUNDS.x+1.5,BOUNDS.x-1.5);m.y=clamp(m.y+dy/n*.7*step,-BOUNDS.y+1.5,BOUNDS.y-1.5);contact=true;}}
   if(contact&&!g.contactCooldown){g.roundContacts++;g.contactCooldown=.7;message(g,'Muatan menyentuh struktur. Mundur sedikit atau ubah orientasi; tidak ada kerusakan.');}
   if(brake)g.brakeTime+=step;else g.brakeTime=0;const s=sensors(g)!,angleTolerance=map.tolerance*Math.PI/180*(g.mode==='relaxed'?1.2:1),ready=g.attached&&s.dockDistance<=LIMITS.dockDistance&&Math.abs(s.dockError)<=angleTolerance&&s.speed<=LIMITS.dockSpeed&&s.spin<=LIMITS.dockSpin&&g.brakeTime>=.5&&!contact;g.dockHold=g.dockRequested&&ready?g.dockHold+step:0;if(g.dockHold>=map.hold){dock(g);continue;}if(g.fuel<=.001){g.emptyTime+=step;if(g.emptyTime>=5)recall(g);}else g.emptyTime=0;
  }
 },
 publicState(g){const {messageUntil,emptyTime,contactCooldown,brakeTime,...state}=g;return structuredClone(state);},
 privateState(g,slot){const s=sensors(g);return slot===0?{role:'arm',distance:s?.distance??0,dockDistance:s?.dockDistance??0,canGrip:!!s&&s.distance<=LIMITS.captureDistance,attached:g.attached}:{role:'attitude',captureError:s?.captureError??0,dockError:s?.dockError??0,spin:s?.spin??0,speed:s?.speed??0,braking:g.brakeTime>=.5};},
 result(g){const missions=g.completed.length,total=g.completed.reduce((n:number,r:any)=>n+r.time,0);return {title:missions+' stasiun dirakit bersama',detail:missions*3+' modul · '+Math.floor(total/60)+' menit '+Math.floor(total%60)+' detik perakitan · '+g.completed.reduce((n:number,r:any)=>n+r.rescues,0)+' servis · '+g.completed.reduce((n:number,r:any)=>n+r.fuelUsed,0).toFixed(1)+' unit propelan digunakan. Setiap modul terpasang menjadi checkpoint.',stars:g.mode==='relaxed'?null:g.completed.filter((r:any)=>r.mode!=='relaxed').some((r:any)=>r.overtime||r.rescues)?1:g.completed.filter((r:any)=>r.mode!=='relaxed').some((r:any)=>r.contacts>3)?2:3};}
};export default server;
