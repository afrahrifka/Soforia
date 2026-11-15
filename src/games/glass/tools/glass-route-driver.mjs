// Pengendali sintetis berpengetahuan map. Memakai input/aksi runtime tanpa teleport/kekebalan.
import {tickGame,gameAction} from '../../../platform/game-runtime.ts';
import {glassCourse,groundHeight} from '../glass.ts';
import {routePoint,routeProject} from '../glass-route.ts';
import {platformPose} from '../glass-world.ts';
const clamp=(v,a=-1,b=1)=>Math.max(a,Math.min(b,v));
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t);};
export function driveGlassCourse(g,{analogOnly=false,limit=22000}={}){
 const startStage=g.stage,course=glassCourse(startStage),visited=[],committed=new Set(),jumps=new Set(),actions={roll:0,raise:0,lower:0,jump:0,wait:0},ferries=new Map();let ticks=0,lastProgress=-10,lastProgressTick=0;
 const station=state=>routeProject(course.route,(state.players[0].x+state.players[1].x)/2,(state.players[0].z+state.players[1].z)/2).s;
 function formation(s){let offset=0,yawOffset=0,span=1.8,roll=0,grips=[1.4,1.4],speed=2.8;
  if(!analogOnly)for(const e of course.encounters){const delta=s-e.s;if(delta< -13||delta>12)continue;const t=smooth((delta+13)/4)*(1-smooth((delta-6)/6));if(e.kind==='roll'||e.kind==='zipper'){const r=1-smooth((delta-9)/3);yawOffset=r*Math.PI/2;roll=r*Math.PI/2;span=2.0;if(e.kind==='zipper')offset=-1.5*smooth((delta+9)/4)*(1-smooth((delta-3)/3));}if(e.kind==='raise'||e.kind==='split')span+=.8*t;if(e.kind==='raise')grips=grips.map(h=>h+.8*t);if(e.kind==='duck')grips=grips.map(h=>h-1.0*t);if(e.kind==='split')grips=[1.4-1.05*t,1.4+1.0*t];if(['duck','split'].includes(e.kind)&&t>.2)speed=1.9;}
  return {offset,yawOffset,span,roll,grips,speed};
 }
 function targetsAt(s,config,state=g){let c=routePoint(course.route,s,config.offset||0);const desired=c.yaw+config.yawOffset,current=Math.atan2(-(state.players[1].z-state.players[0].z),state.players[1].x-state.players[0].x),delta=Math.atan2(Math.sin(desired-current),Math.cos(desired-current)),yaw=current+clamp(delta,-.18,.18);if(Math.abs(delta)>.16){const near=routeProject(course.route,(state.players[0].x+state.players[1].x)/2,(state.players[0].z+state.players[1].z)/2);c=routePoint(course.route,near.s,near.lateral);}return [-1,1].map(side=>({x:c.x+Math.cos(yaw)*config.span*side,z:c.z-Math.sin(yaw)*config.span*side}));}

 function inputs(state,targets,config,move=true){return state.players.map((p,i)=>{let dx=move?(targets[i].x-p.x)*4:0,dz=move?(targets[i].z-p.z)*4:0;const magnitude=Math.hypot(dx,dz),max=config.speed;dx/=Math.max(1,magnitude/max);dz/=Math.max(1,magnitude/max);const speed=p.crouch?2.2:3.8,yaw=state.camera.yaw;return {x:clamp((Math.cos(yaw)*dx-Math.sin(yaw)*dz)/speed),y:clamp((Math.sin(yaw)*dx+Math.cos(yaw)*dz)/speed),glassX:analogOnly?0:clamp((config.roll-state.pane.roll)*4),glassY:analogOnly?0:clamp((p.gripHeight-config.grips[i])*6)};});}
 function maybeJump(state,s,set){if(analogOnly)return;for(const e of course.encounters){const locations=e.kind==='stepping'?[e.s-2.3,e.s+2.3]:['jump','sweeper'].includes(e.kind)?[e.s]:[];for(const location of locations){if(set.has(location)||s<location-1.3||s>location-.5)continue;if(state.players.every(p=>p.grounded)){gameAction(state,0,'jump');gameAction(state,1,'jump');set.add(location);if(state===g)actions.jump+=2;}}}}

 function crossingSafe(e){const trial=structuredClone(g),jumped=new Set(jumps);for(let i=0;i<280;i++){const s=station(trial),config=formation(s);maybeJump(trial,s,jumped);tickGame(trial,inputs(trial,targetsAt(s+.7,config,trial),config),1/60);if(trial.breaks||trial.retryTime)return false;if(trial.stage!==startStage||trial.finished||s>e.s+3.4)return true;}return false;}
 for(;ticks<limit&&g.stage===startStage&&!g.finished;ticks++){
  const s=station(g),config=formation(s);let targets=targetsAt(Math.min(course.finish,s+.7),config),move=true;
  for(const e of course.encounters){if(!['ferry','sideFerry','lift'].includes(e.kind)||s<e.s-11||s>e.s+11)continue;const o=course.obstacles.find(o=>o.id===e.props[0]),p=platformPose(course,o,g.elapsed),position=routeProject(course.route,p.x,p.z),gap=course.gaps.find(gap=>Math.abs(gap.s-e.s)<.1),entry=e.s-gap.d/2,exit=e.s+gap.d/2,entryP=routePoint(course.route,entry-1),exitP=routePoint(course.route,exit+1),entryY=groundHeight(course,entryP.x,entryP.z),exitY=groundHeight(course,exitP.x,exitP.z);let phase=ferries.get(e.s)||'approach';
   if(phase==='approach'&&g.players.every(p=>p.support===o.id))phase='ride';
   if(phase==='approach'){const ready=o.axis==='vertical'?p.y<entryY+.16&&(platformPose(course,o,g.elapsed+.1).y<=p.y||p.y<entryY+.03):position.s<entry+1.2;if(ready)targets=targetsAt(o.axis==='vertical'?e.s-1.0:position.s,{...config,yawOffset:0,span:1.6});else targets=targetsAt(o.axis==='vertical'?e.s-o.d/2-1.2:entry-1.15,{...config,yawOffset:0,span:1.6});}
   if(phase==='ride'){move=o.axis==='vertical';if(move)targets=targetsAt(e.s+1,{...config,yawOffset:0,span:1.6});if(o.axis==='vertical'?p.y>=exitY-.10:position.s>exit-1.6)phase='exit';}
   if(phase==='exit'){move=true;targets=targetsAt(exit+3,{...config,yawOffset:0,span:1.6});if(g.players.every(p=>p.support===null&&routeProject(course.route,p.x,p.z).s>exit+.4)){phase='done';visited.push(e.kind);}}
   ferries.set(e.s,phase);
  }
  for(const e of course.encounters.filter(e=>['hammer','axe','crusher','traffic','logSwing','zipper'].includes(e.kind))){if(s<e.s-5||s>e.s+3.5||committed.has(e.s))continue;if(s>e.s-3.9&&ticks%12===0&&crossingSafe(e)){committed.add(e.s);visited.push(e.kind);}else{targets=targetsAt(Math.min(s+.7,e.s-3.3),config);actions.wait++;}}
  maybeJump(g,s,jumps);const control=inputs(g,targets,config,move);for(const input of control){if(Math.abs(input.glassX)>.1)actions.roll++;if(input.glassY<-.1)actions.raise++;if(input.glassY>.1)actions.lower++;}tickGame(g,control,1/60);
  if(g.breaks||g.retryTime)throw Error(JSON.stringify({stage:startStage+1,ticks,s,message:g.message,breaks:g.breaks,players:g.players,pane:g.pane}));if(g.progress>lastProgress+.05){lastProgress=g.progress;lastProgressTick=ticks;}if(ticks-lastProgressTick>2400)throw Error('Macet '+JSON.stringify({stage:startStage+1,s,ticks,players:g.players,targets,control,config,ferries:[...ferries]}));
 }
 if(g.stage===startStage&&!g.finished)throw Error(`Batas tick stage ${startStage+1}, s=${station(g)}`);return {ticks,visited,actions,length:course.route.length};
}
