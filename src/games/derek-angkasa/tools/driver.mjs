// Pengendali map-aware, memakai axis dan action server; tidak memindahkan state untuk lulus.
import server,{sensors,LIMITS} from '../server.ts';import {MISSIONS} from '../maps.ts';import {wrap,clamp,safePose} from '../physics.ts';
export function newRound(mission=0,mode='relaxed',seed=42){return server.create({id:'derek-angkasa',mode,level:mission+1,seed,elapsed:0,finished:false,score:0},{random:()=>.5});}
export function planPath(g,angle){const m=g.modules[g.index],d=MISSIONS[g.mission].deliveries[g.index],installed=g.modules.filter(m=>m.status==='installed'),grid=.4,nx=59,ny=49,px=x=>-11.6+x*grid,py=y=>-9.6+y*grid,at=(x,y)=>({x:px(x),y:py(y)}),start={x:Math.round((m.x+11.6)/grid),y:Math.round((m.y+9.6)/grid)},goal=d.target,key=(x,y)=>y*nx+x;
 const valid=new Map(),clear=(x,y)=>{const k=key(x,y);if(x<0||x>=nx||y<0||y>=ny)return false;if(!valid.has(k))valid.set(k,safePose(g.mission,{...at(x,y),angle,kind:m.kind},g.clock,installed,true));return valid.get(k);};
 const origin=key(start.x,start.y),open=[{...start,k:origin,f:0}],cost=new Map([[origin,0]]),came=new Map();let end=null;
 while(open.length){open.sort((a,b)=>b.f-a.f);const p=open.pop();if(p.closed)continue;const pos=at(p.x,p.y);if(Math.hypot(pos.x-goal.x,pos.y-goal.y)<.31){end=p.k;break;}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const x=p.x+dx,y=p.y+dy,k=key(x,y),next=at(x,y),travel=Math.hypot(dx,dy)*grid;if(!clear(x,y)||dx&&dy&&(!clear(p.x+dx,p.y)||!clear(p.x,p.y+dy)))continue;
   const mid={x:(pos.x+next.x)/2,y:(pos.y+next.y)/2,kind:m.kind,angle};if(!safePose(g.mission,mid,g.clock,installed,true))continue;const c=cost.get(p.k)+travel;if(c>=(cost.get(k)??Infinity))continue;cost.set(k,c);came.set(k,p.k);open.push({x,y,k,f:c+Math.hypot(next.x-goal.x,next.y-goal.y)});
  }
 }
 if(end===null)throw Error('Tidak ada rute aman '+(g.mission+1)+'/'+g.index+' pada sudut '+angle);
 const path=[];for(let k=end;k!==origin;k=came.get(k)){path.push(at(k%nx,Math.floor(k/nx)));}path.reverse();path.push({...goal});return path;
}
export function driveRound(g,{onTick,limit=70000}={}){
 if(g.phase==='briefing')server.action(g,0,g.mode==='relaxed'?'start-relaxed':'start-challenge');let ticks=0,index=-1,phase='capture',path=[],waypoint=0,stalled=0,best=Infinity;const actions={grip:0,dock:0,thrust:0,brake:0,turn:0};const fuels=[],paths=[];
 function act(slot,name){server.action(g,slot,name);actions[name]=(actions[name]||0)+1;}
 for(;ticks<limit&&g.phase==='assembly';ticks++){
  if(g.index!==index){if(index>=0)fuels.push(g.history.at(-1).fuel);index=g.index;phase='capture';path=[];waypoint=0;best=Infinity;stalled=0;}
  const m=g.modules[index],d=MISSIONS[g.mission].deliveries[index],s=sensors(g);let target={x:m.x,y:m.y},angle=phase==='capture'?d.capture:d.dock,brake=false,thrust=0;
  if(phase==='capture'){
   if(s.distance<.1&&Math.abs(s.captureError)<.07&&s.spin<.09){act(0,'grip');if(g.attached){phase='orient';}}
  }else if(phase==='orient'){
   if(Math.abs(wrap(d.dock-m.angle))<.04&&s.spin<.07){path=planPath(g,d.dock);paths.push({module:index,path});phase='carry';}
  }else if(phase==='carry'){
   while(waypoint<path.length-1&&Math.hypot(path[waypoint].x-m.x,path[waypoint].y-m.y)<.3)waypoint++;
   const p=path[waypoint];target=p;brake=true;
   if(waypoint===path.length-1&&s.dockDistance<.23&&s.speed<.13&&Math.abs(s.dockError)<.04){act(0,'dock');phase='dock';}
  }else {target=d.target;brake=true;}
  const err=wrap(angle-m.angle);if(Math.abs(err)<.07)brake=true;const turn=clamp(err*2.6-m.omega*3.6,-1,1);
  // Kepala mengikuti sasaran lewat input; pegas server tetap memindahkan beban.
  const dx=target.x-g.arm.x,dy=target.y-g.arm.y,v=Math.hypot(dx,dy),scale=Math.min(1,v*3.5),inputA={x:v?dx/v*scale:0,y:v?dy/v*scale:0},inputB={x:turn,y:0,brake:brake?1:0,thrust};
  if(brake)actions.brake++;if(Math.abs(turn)>.05)actions.turn++;if(thrust)actions.thrust++;
  onTick?.({g,ticks,phase,inputA,inputB});g.elapsed+=1/60;server.tick(g,[inputA,inputB],1/60);
  if(g.rescue||g.roundRescues)throw Error('Pemulihan tidak diharapkan '+JSON.stringify({mission:g.mission+1,index,phase,fuel:g.fuel,s:sensors(g),m,arm:g.arm}));
  const distance=phase==='carry'?Math.hypot(target.x-m.x,target.y-m.y):Math.abs(err)+s.distance;
  if(distance<best-.02){best=distance;stalled=0;}else stalled++;
  if(stalled>2400){throw Error('Macet '+JSON.stringify({mission:g.mission+1,index,phase,waypoint,target,m,arm:g.arm,s:sensors(g),fuel:g.fuel,message:g.message}));}
  if(phase==='carry'&&waypoint!==paths.at(-1)?.lastWaypoint){best=Infinity;stalled=0;paths.at(-1).lastWaypoint=waypoint;}
 }
 if(g.phase!=='showcase')throw Error('Batas tick '+JSON.stringify({mission:g.mission+1,phase,index}));fuels.push(g.history.at(-1).fuel);return {mission:g.mission+1,ticks,time:g.clock,contacts:g.roundContacts,rescues:g.roundRescues,fuels,actions,paths};
}
