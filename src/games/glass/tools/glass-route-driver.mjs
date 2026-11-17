import {challengeExtent,posture,weaveOffset} from '../glass-pacing.ts';
// Pengendali sintetis berpengetahuan map. Memakai input/aksi runtime tanpa teleport/kekebalan.
import {tickGame,gameAction} from '../../../platform/game-runtime.ts';
import {glassCourse,groundHeight,bodyHitsPart,glassHitsPart} from '../glass.ts';
import {routePoint,routeProject} from '../glass-route.ts';
import {platformPose,courseParts} from '../glass-world.ts';
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function driveGlassCourse(g,{analogOnly=false,limit=22000,onTick}={}){
 const startStage=g.stage,course=glassCourse(startStage),visited=[],committed=new Set(),jumps=new Set(),actions={roll:0,raise:0,lower:0,jump:0,wait:0},ferries=new Map();let ticks=0,lastProgress=-10,lastProgressTick=0,lastTrialError=null,bestTrialError=null;const trialFailures=new Map();
 const taskCursor=new WeakMap();
 const station=state=>routeProject(course.route,(state.players[0].x+state.players[1].x)/2,(state.players[0].z+state.players[1].z)/2).s;
 function formation(s,state=g){
  const trailing=Math.min(...state.players.map(p=>routeProject(course.route,p.x,p.z).s));
  let index=taskCursor.get(state)??taskCursor.get(g)??0;while(index<course.encounters.length){const e=course.encounters[index],tail=challengeExtent(e.kind,e.group).after;if(trailing<=e.s+tail+.6||s<=e.s+tail+(['roll','threadHop','threadBridge','threadHammer'].includes(e.kind)?Math.max(4.8,11-tail):posture(e.kind)==='thread'?(e.kind==='zipper'?2.8:4.8):e.kind==='stepping'?3.8:2.6))break;index++;}taskCursor.set(state,index);const e=course.encounters[index];
  let offset=0,yawOffset=0,span=1.8,roll=0,grips=[1.4,1.4],speed=2.8;
  if(!analogOnly&&e){const delta=s-e.s,kind=e.kind;
   if(posture(kind)==='thread'){yawOffset=Math.PI/2;roll=Math.PI/2;span=2;speed=2.6;}
   if(kind==='zipper')offset=-1.5;
   if(kind==='traffic'){span=1.7;speed=3.0;}
   if(kind==='threadHop')grips=[1.65,1.65];
   if(kind==='raise'){span=2.6;grips=[2.2,2.2];}
   if(kind==='duck'){grips=[.4,.4];speed=1.9;}
   if(kind==='split'||kind==='tiltWeave'){span=2.6;speed=1.9;const t=kind==='tiltWeave'?smooth((delta+2)/4):0;grips=[.35+2.05*t,2.4-2.05*t];}
   if(kind==='weave'){speed=1.9;span=2.5;}
  }
  return {offset,yawOffset,span,roll,grips,speed,e:!analogOnly?e:null};
 }
 function targetsAt(s,config,state=g){
  let c=routePoint(course.route,s,config.offset||0);const current=Math.atan2(-(state.players[1].z-state.players[0].z),state.players[1].x-state.players[0].x);
  let points=null,desired=c.yaw+config.yawOffset;
  if(config.e?.kind==='weave'){
   points=[-1,1].map((side,i)=>{const position=routeProject(course.route,state.players[i].x,state.players[i].z).s,at=config.e?.kind==='weave'?Math.min(s+side*config.span,position+.45):s+side*config.span,p=routePoint(course.route,at,config.e?.kind==='weave'?weaveOffset(at-config.e.s,startStage):config.offset);return {x:p.x,z:p.z};});desired=Math.atan2(-(points[1].z-points[0].z),points[1].x-points[0].x);
  }
  const delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current)),yaw=current+clamp(delta,-.18,.18);
  if(Math.abs(delta)>.5){const near=routeProject(course.route,(state.players[0].x+state.players[1].x)/2,(state.players[0].z+state.players[1].z)/2);c=routePoint(course.route,near.s,config.offset||0);}
  else if(points)return points;
  return [-1,1].map(side=>({x:c.x+Math.cos(yaw)*config.span*side,z:c.z-Math.sin(yaw)*config.span*side}));
 }
 function inputs(state,targets,config,move=true){return state.players.map((p,i)=>{let dx=move?(targets[i].x-p.x)*4:0,dz=move?(targets[i].z-p.z)*4:0;const magnitude=Math.hypot(dx,dz),max=config.speed;dx/=Math.max(1,magnitude/max);dz/=Math.max(1,magnitude/max);const speed=p.crouch?2.2:3.8,yaw=state.camera.yaw;return {x:clamp((Math.cos(yaw)*dx-Math.sin(yaw)*dz)/speed),y:clamp((Math.sin(yaw)*dx+Math.cos(yaw)*dz)/speed),glassX:analogOnly?0:clamp((config.roll-state.pane.roll)*4),glassY:analogOnly?0:clamp((p.gripHeight-Math.max(config.grips[i],Math.abs(Math.sin(state.pane.roll))*.618+.1))*6)};});}
 function maybeJump(state,s,set){if(analogOnly)return;for(const e of course.encounters.filter(e=>['threadHop','threadBridge'].includes(e.kind))){const locations=e.kind==='threadHop'?course.obstacles.filter(o=>e.props.includes(o.id)).map(o=>o.s-e.s):course.gaps.filter(gap=>Math.abs(gap.s-e.s)<8).map(gap=>gap.s-e.s);for(const offset of locations)for(const [slot,p] of state.players.entries()){const location=e.s+offset,position=routeProject(course.route,p.x,p.z).s,key=`${e.s}:${offset}:${slot}`;if(!set.has(key)&&position>=location-1.05&&position<location-.45&&p.grounded){gameAction(state,slot,'jump');set.add(key);if(state===g)actions.jump++;}}}for(const e of course.encounters){const locations=e.kind==='stepping'?[e.s-2.3,e.s+2.3]:['jump','sweeper'].includes(e.kind)?[e.s]:[];for(const location of locations)for(const [slot,p] of state.players.entries()){const position=routeProject(course.route,p.x,p.z).s,key=`${location}:${slot}`;if(set.has(key)||position<location-1.3||position>location-.5||!p.grounded)continue;gameAction(state,slot,'jump');set.add(key);if(state===g)actions.jump++;}}}


 function crossingSafe(e){const trial=structuredClone(g),jumped=new Set(jumps);taskCursor.set(trial,taskCursor.get(g)??0);for(let i=0;i<(e.kind==='turntable'?700:360);i++){const s=station(trial),config=formation(s,trial);if(s>e.s+challengeExtent(e.kind,e.group).after+1.4&&trial.players.every(p=>routeProject(course.route,p.x,p.z).s>e.s+challengeExtent(e.kind,e.group).after+.5))return true;maybeJump(trial,s,jumped);tickGame(trial,inputs(trial,targetsAt(s+.7,config,trial),config),1/60);if(trial.breaks||trial.retryTime){trialFailures.set(trial.message,(trialFailures.get(trial.message)||0)+1);lastTrialError={contacts:courseParts(course,trial.elapsed).filter(p=>glassHitsPart(trial,p)).map(p=>({id:p.id,kind:p.kind})),message:trial.message,s:station(trial),pane:trial.pane,players:trial.players};if(!bestTrialError||lastTrialError.s>bestTrialError.s)bestTrialError=lastTrialError;return false;}if(trial.stage!==startStage||trial.finished)return true;}return false;}
 for(;ticks<limit&&g.stage===startStage&&!g.finished;ticks++){
  const s=station(g),config=formation(s);let targets=targetsAt(Math.min(course.finish,s+.7),config),move=true;
  if(!analogOnly&&config.e){const e=config.e,edge=e.s-challengeExtent(e.kind,e.group).before-1.1;const checkpoint=e.kind==='tiltWeave'&&s>e.s+1.8&&s<e.s+2.8;if((s>edge-1.8&&s<edge||checkpoint)&&['duck','raise','split','tiltWeave'].includes(e.kind)&&(g.players.some((p,i)=>Math.abs(p.gripHeight-config.grips[i])>.12)||Math.abs(g.pane.roll-config.roll)>.16)){targets=targetsAt(s,config);actions.wait++;}}
  const activeFerry=course.encounters.find(e=>e===config.e&&['ferry','sideFerry','lift'].includes(e.kind)&&s>=e.s-12&&s<=e.s+12&&ferries.get(e.s)!=='done');
  for(const e of course.encounters){if(e!==activeFerry||!['ferry','sideFerry','lift'].includes(e.kind)||s<e.s-11||s>e.s+11)continue;const o=course.obstacles.find(o=>o.id===e.props[0]),p=platformPose(course,o,g.elapsed),position=routeProject(course.route,p.x,p.z),gap=course.gaps.find(gap=>Math.abs(gap.s-e.s)<.1),entry=e.s-gap.d/2,exit=e.s+gap.d/2,entryP=routePoint(course.route,entry-1),exitP=routePoint(course.route,exit+1),entryY=groundHeight(course,entryP.x,entryP.z),exitY=groundHeight(course,exitP.x,exitP.z);let phase=ferries.get(e.s)||'approach';
   if(phase==='approach'&&g.players.every(p=>p.support===o.id))phase='ride';
   if(phase==='approach'){const ready=o.axis==='vertical'?p.y<entryY+.16&&(platformPose(course,o,g.elapsed+.1).y<=p.y||p.y<entryY+.03):position.s<entry+1.2;if(ready)targets=targetsAt(o.axis==='vertical'?e.s-1.0:position.s,{...config,yawOffset:0,span:2});else targets=targetsAt(o.axis==='vertical'?e.s-o.d/2-1.2:entry-1.15,{...config,yawOffset:0,span:2});}
   if(phase==='ride'){move=o.axis==='vertical';if(move)targets=targetsAt(e.s+1,{...config,yawOffset:0,span:2});if(o.axis==='vertical'?p.y>=exitY-.10:position.s>exit-1.6)phase='exit';}
   if(phase==='exit'){move=true;targets=targetsAt(exit+3,{...config,yawOffset:0,span:2});if(g.players.every(p=>p.support===null&&routeProject(course.route,p.x,p.z).s>exit+.4)){phase='done';visited.push(e.kind);}}
   ferries.set(e.s,phase);
  }
  for(const e of course.encounters.filter(e=>e===config.e&&['hammer','threadHammer','axe','crusher','traffic','logSwing','zipper','iris','scissor','breathing','turntable'].includes(e.kind))){const stop=e.kind==='turntable'?6.4:challengeExtent(e.kind,e.group).before+2.6;if(s<e.s-stop-1.4||s>e.s+(e.kind==='turntable'?5.7:3.5)||committed.has(e.s))continue;if(s>e.s-stop-.5&&ticks%12===0&&crossingSafe(e)){committed.add(e.s);visited.push(e.kind);}else{targets=targetsAt(Math.min(s+.7,e.s-stop),config);actions.wait++;}}
  maybeJump(g,s,jumps);onTick?.({g,ticks,s,config});const control=inputs(g,targets,config,move);for(const input of control){if(Math.abs(input.glassX)>.1)actions.roll++;if(input.glassY<-.1)actions.raise++;if(input.glassY>.1)actions.lower++;}tickGame(g,control,1/60);
  if(g.breaks||g.retryTime)throw Error(JSON.stringify({stage:startStage+1,ticks,s,message:g.message,breaks:g.breaks,players:g.players,pane:g.pane,config,contacts:courseParts(course,g.elapsed).filter(p=>glassHitsPart(g,p)).map(p=>({id:p.id,kind:p.kind}))}));if(g.progress>lastProgress+.05){lastProgress=g.progress;lastProgressTick=ticks;}if(ticks-lastProgressTick>2400)throw Error('Macet '+JSON.stringify({stage:startStage+1,s,ticks,players:g.players,pane:g.pane,targets,control,config,lastTrialError,bestTrialError,trialFailures:[...trialFailures],ferries:[...ferries],blocking:courseParts(course,g.elapsed).filter(part=>g.players.some((p,i)=>bodyHitsPart({...p,x:p.x+Math.sign(targets[i].x-p.x)*.03,z:p.z+Math.sign(targets[i].z-p.z)*.03},part))).map(p=>({id:p.id,kind:p.kind,center:p.center})).slice(0,8)}));
 }
 if(g.stage===startStage&&!g.finished)throw Error(`Batas tick stage ${startStage+1}, s=${station(g)}`);return {ticks,visited,actions,length:course.route.length};
}
