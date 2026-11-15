// Pengendali sintetis memakai pengetahuan geometri. Tidak masuk bundle aplikasi.
import {tickGame} from '../src/games.ts';
import {glassCourse,glassHitsPart,bodyHitsPart,groundHeight} from '../src/glass.ts';
import {routePoint,routeProject} from '../src/glass-route.ts';
import {propParts,platformPose,courseParts,staticFloorAt} from '../src/glass-world.ts';
const clamp=v=>Math.max(-1,Math.min(1,v));
function pose(course,s,offset,span,height=1.7){
 const a=routePoint(course.route,s,offset-span),b=routePoint(course.route,s,offset+span),center=routePoint(course.route,s,offset);a.y=groundHeight(course,a.x,a.z);b.y=groundHeight(course,b.x,b.z);
 return {players:[a,b].map(p=>({...p,lower:0})),pane:{x:center.x,y:(a.y+b.y)/2+height,z:center.z,yaw:center.yaw,roll:0,slope:Math.atan2(b.y-a.y,2.4)}};
}
function safePose(candidate,parts){return parts.every(part=>!candidate.players.some(p=>bodyHitsPart(p,part))&&!glassHitsPart(candidate,part));}
function planFormation(course){
 const stationary=course.obstacles.filter(o=>!['platform','hammer','axe','wire'].includes(o.kind)).flatMap(o=>propParts(course,o,0)).map(p=>({...p,half:[p.half[0]+.05,p.half[1]+.05,p.half[2]+.4]}));
 const states=[];for(let offset=-1.75;offset<=1.751;offset+=.25)for(const span of [1.5,1.7,1.8])states.push({offset,span});
 const rows=[],spacing=.5,count=Math.ceil((course.finish-2)/spacing)+1;
 for(let i=0;i<count;i++){
  const s=Math.min(course.finish,2+i*spacing),point=routePoint(course.route,s),near=stationary.filter(p=>Math.hypot(p.center.x-point.x,p.center.z-point.z)<9),cost=states.map(()=>Infinity),parent=states.map(()=>-1);
  for(let j=0;j<states.length;j++){
   const state=states[j];if(!safePose(pose(course,s,state.offset,state.span),near))continue;
   const local=state.offset**2*.10+(state.span-1.8)**2*.25;
   if(i===0){cost[j]=local+state.offset**2*20+(state.span-1.8)**2*20;continue;}
   for(let k=0;k<states.length;k++){
    if(!Number.isFinite(rows[i-1].cost[k]))continue;const prior=states[k];if(Math.abs(state.offset-prior.offset)>.251||Math.abs(state.span-prior.span)>.21)continue;
    const candidate=rows[i-1].cost[k]+local+(state.offset-prior.offset)**2*5+(state.span-prior.span)**2*8;if(candidate<cost[j]){cost[j]=candidate;parent[j]=k;}
   }
  }
  if(!cost.some(Number.isFinite))throw Error(`Tidak ada formasi bebas benda di stage ${course.stage+1}, s=${s}`);rows.push({s,cost,parent});
 }
 let index=rows.at(-1).cost.indexOf(Math.min(...rows.at(-1).cost));const plan=[];for(let i=rows.length-1;i>=0;i--){plan.push({s:rows[i].s,...states[index]});index=rows[i].parent[index];}return plan.reverse();
}
export function driveGlassCourse(g){
 const course=glassCourse(g.stage),plan=planFormation(course),visited=[],platform=course.obstacles.find(o=>o.kind==='platform'),gap=course.gaps[0],hazards=course.obstacles.filter(o=>['hammer','axe'].includes(o.kind));let ticks=0,transport='approach',transportDone=!platform,trace;let lastProgress=-100,lastProgressTick=0;const committed=new Set();
 const formation=s=>{let i=Math.max(0,Math.min(plan.length-2,Math.floor((s-2)/.5))),a=plan[i],b=plan[i+1],t=clamp((s-a.s)/(b.s-a.s||1));return {offset:a.offset+(b.offset-a.offset)*t,span:a.span+(b.span-a.span)*t};};
 function inputsTo(targets,move=true,state=g,avoidMoving=true){
  const nearby=courseParts(course,state.elapsed).filter(part=>(avoidMoving||!['hammer','axe'].includes(part.kind))&&Math.hypot(part.center.x-state.pane.x,part.center.z-state.pane.z)<10);
  return state.players.map((p,i)=>{
   let dx=move?(targets[i].x-p.x)*3.5:0,dz=move?(targets[i].z-p.z)*3.5:0;const middle=routeProject(course.route,(state.players[0].x+state.players[1].x)/2,(state.players[0].z+state.players[1].z)/2),forward={x:-Math.sin(middle.yaw),z:-Math.cos(middle.yaw)},ahead=(p.x-middle.x)*forward.x+(p.z-middle.z)*forward.z,advance=dx*forward.x+dz*forward.z;if(ahead>.45&&advance>0){dx-=forward.x*advance*.85;dz-=forward.z*advance*.85;}const magnitude=Math.hypot(dx,dz),norm=Math.max(1,magnitude/.71);dx/=norm;dz/=norm;
   const clear=(vx,vz)=>{
    for(const d of [.15,.3,.45]){const probe={...p,x:p.x+vx*d/.71,z:p.z+vz*d/.71};if(staticFloorAt(course,probe.x,probe.z)&&groundHeight(course,probe.x,probe.z)>probe.y+.28)return false;
     if(nearby.some(part=>!(part.support&&part.id===p.support||part.kind==='platform'&&part.center.y+part.half[1]<=p.y+.2)&&bodyHitsPart(probe,part)))return false;
    }
    return true;
   };
   if(magnitude>.15&&!clear(dx,dz)){
    let chosen=null,score=-Infinity;for(const degrees of [-20,20,-40,40,-60,60,-80,80,-100,100]){
     const angle=degrees*Math.PI/180,x=dx*Math.cos(angle)-dz*Math.sin(angle),z=dx*Math.sin(angle)+dz*Math.cos(angle);if(!clear(x,z))continue;
     const toward=(state.pane.x-p.x)*x+(state.pane.z-p.z)*z,value=x*dx+z*dz+toward*.04-Math.abs(degrees)*.0001;if(value>score){score=value;chosen={x,z};}
    }
    if(chosen){dx=chosen.x;dz=chosen.z;}else {dx=0;dz=0;}
   }
   const yaw=state.camera.yaw;return {x:clamp(Math.cos(yaw)*dx-Math.sin(yaw)*dz),y:clamp(Math.sin(yaw)*dx+Math.cos(yaw)*dz),glassX:clamp(-state.pane.roll*4),glassY:clamp((p.gripHeight-1.7)*5)};
  });
 }
 function crossingSafe(hazard){
  const trial=structuredClone(g);for(let i=0;i<270;i++){
   const s=routeProject(course.route,(trial.players[0].x+trial.players[1].x)/2,(trial.players[0].z+trial.players[1].z)/2).s,config=formation(s),targets=pose(course,s+.8,config.offset,config.span).players;
   tickGame(trial,inputsTo(targets,true,trial,false),1/60);if(trial.breaks)return false;if(trial.stageClear||trial.progress>hazard.s+3.5)return true;
  }return false;
 }
 const tick=inputs=>{tickGame(g,inputs,1/60);ticks++;if(g.breaks)throw Error(`Stage ${g.stage+1}, cp${g.checkpoint}, s=${g.progress.toFixed(2)}: ${g.message}; pane=${JSON.stringify(g.pane)}; players=${JSON.stringify(g.players.map(p=>({x:p.x,y:p.y,z:p.z,support:p.support})))}`);};
 for(let i=0;i<35000&&!g.stageClear;i++){
  const projections=g.players.map(p=>routeProject(course.route,p.x,p.z)),s=routeProject(course.route,(g.players[0].x+g.players[1].x)/2,(g.players[0].z+g.players[1].z)/2).s,config=formation(s),targetS=Math.min(course.finish,s+.8),base=pose(course,targetS,config.offset,config.span);let targets=base.players,move=true;
  if(platform&&!transportDone&&s>gap.s-gap.d/2-3.4){
   const p=platformPose(course,platform,g.elapsed),projection=routeProject(course.route,p.x,p.z),entry=gap.s-gap.d/2,exit=gap.s+gap.d/2,entryY=groundHeight(course,routePoint(course.route,entry-1).x,routePoint(course.route,entry-1).z),exitP=routePoint(course.route,exit+1),exitY=groundHeight(course,exitP.x,exitP.z);
   const on=g.players.every(p=>p.support===platform.id);
   if(on&&transport==='approach')transport='ride';
   const ready=platform.axis==='forward'?projection.s<entry+1.5:platform.axis==='side'?Math.abs(projection.lateral)<1.0:p.y<entryY+.18&&(platformPose(course,platform,g.elapsed+.1).y<=p.y||p.y<entryY+.03);
   if(transport==='approach'){
    if(ready){targets=[-1.6,1.6].map(side=>({x:p.x+Math.cos(p.yaw)*side,z:p.z-Math.sin(p.yaw)*side}));}
    else {targets=pose(course,platform.axis==='vertical'?gap.s-platform.d/2-1.2:entry-1.0,0,1.6).players;}
   }else if(transport==='ride'){
    if(platform.axis==='forward'){move=false;if(projection.s>exit-1.5)transport='exit';}
    else {targets=[-1.6,1.6].map(side=>({x:p.x+Math.cos(p.yaw)*side-Math.sin(p.yaw)*1.3,z:p.z-Math.sin(p.yaw)*side-Math.cos(p.yaw)*1.3}));if(platform.axis==='vertical'?p.y>=exitY-.18:Math.abs(projection.lateral)<.7)transport='exit';}
   }
   if(transport==='exit'){targets=pose(course,exit+4,0,1.6).players;if(projections.every(q=>q.s>exit+.4)&&g.players.every(p=>p.support===null)){transportDone=true;visited.push({kind:'platform',axis:platform.axis});}}
  }
  let avoidMoving=true;
  if(transportDone||!platform||s<gap.s-gap.d/2-4)for(const hazard of hazards){
   if(s<hazard.s-5||s>hazard.s+3.5)continue;
   if(committed.has(hazard.id)){avoidMoving=false;continue;}
   if(s>hazard.s-3.8&&ticks%12===0&&crossingSafe(hazard)){committed.add(hazard.id);avoidMoving=false;continue;}
   targets=pose(course,Math.min(s+.5,hazard.s-3.2),config.offset,config.span).players;
  }

  trace={s,config,targets,inputs:inputsTo(targets,move,g,avoidMoving)};tick(trace.inputs);if(g.progress>lastProgress+.05){lastProgress=g.progress;lastProgressTick=ticks;}if(ticks-lastProgressTick>2000)throw Error('Macet '+JSON.stringify({stage:g.stage+1,checkpoint:g.checkpoint,trace,players:g.players,platform:transport}));
 }
 if(!g.stageClear)throw Error(`Rute macet stage ${g.stage+1}, cp${g.checkpoint}, s=${g.progress}, transport=${transport}, elapsed=${g.elapsed}; players=${JSON.stringify(g.players)}`);
 for(const hazard of hazards)visited.push({kind:hazard.kind});return {ticks,visited,length:course.route.length};
}
