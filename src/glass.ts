import {obbOverlap,obbHullOverlap,WORLD_BASIS,moveGlassBody,GLASS_BODY_RADIUS} from './glass-collision.ts';
import {glassCourse,glassWorlds,groundHeight,staticFloorAt,propParts,courseParts,platformPose,inPlatform,type GlassCourse,type GlassProp,type GlassPart} from './glass-world.ts';
import {routePoint,routeProject,routeControls} from './glass-route.ts';
import {planGlassCamera} from './glass-camera.ts';
export {glassCourse,glassWorlds,propParts,platformPose,groundHeight,staticFloorAt};
export type {GlassCourse};
export const GLASS_STAGE_COUNT=60,GLASS_ARM_MAX=2.2,GLASS_PANE_WIDTH=2.4,GLASS_PANE_HEIGHT=1.2,GLASS_GRIP_HEIGHT=1.4;
export const GLASS_SOLID_SEGMENTS=[{u:0,v:0,w:2.4,h:1.2,d:.055},...[-1,1].map(side=>({u:side*1.2,v:0,w:.035,h:1.2,d:.055})),...[-1,1].map(side=>({u:0,v:side*.6,w:2.4,h:.035,d:.055}))];
function carrier(x:number,z:number,y:number){return {x,z,y,vy:0,lift:0,crouch:false,lifting:false,rotating:false,jump:false,grounded:true,lower:0,gripHeight:GLASS_GRIP_HEIGHT,support:null as string|null};}
function place(g:any){
 const course=glassCourse(g.stage),s=g.checkpoint===0?2:course.checkpoints[g.checkpoint-1]+1,center=routePoint(course.route,s),a=routePoint(course.route,s,-1.8),b=routePoint(course.route,s,1.8);
 g.players=[carrier(a.x,a.z,groundHeight(course,a.x,a.z)),carrier(b.x,b.z,groundHeight(course,b.x,b.z))];
 g.pane={x:center.x,z:center.z,y:(g.players[0].y+g.players[1].y)/2+GLASS_GRIP_HEIGHT,yaw:center.yaw,tilt:0,roll:0,slope:0};g.armStress=0;g.pressure=0;g.strain=0;g.retryTime=0;g.recoveryKind=null;g.revision=(g.revision||0)+1;g.progress=s;g.camera=planGlassCamera(g,course,1/60,true);
}
export function createGlass(stage=0){const g:any={stage:Math.max(0,Math.min(59,stage)),startStage:Math.max(0,Math.min(59,stage)),stagesCompleted:0,checkpoint:0,cleared:0,breaks:0,retryTime:0,stageClear:false,nextReady:[false,false],revision:0,strain:0,armStress:0,pressure:0,elapsed:0,protection:0,message:'Antar kaca melalui jalan berkelok. Hindari menyentuh benda padat.'};place(g);return g;}
export function glassGrip(p:any){return p.y+(p.gripHeight??GLASS_GRIP_HEIGHT);}
export function glassBasis(g:any){const r=g.pane.roll||0,t=g.pane.slope||0,y=g.pane.yaw||0,c=Math.cos(t),s=Math.sin(t),cr=Math.cos(r),sr=Math.sin(r),cy=Math.cos(y),sy=Math.sin(y);
 const rotate=(x:number,up:number,z:number)=>({x:cy*x+sy*z,y:up,z:-sy*x+cy*z});return [rotate(c,s,0),rotate(s*sr,-c*sr,cr),rotate(s*cr,-c*cr,-sr)];}
export function glassPoint(g:any,x:number,y:number,thickness=0){const p=g.pane,[u,v,n]=glassBasis(g);return {x:p.x+u.x*x+v.x*y+n.x*thickness,y:p.y+u.y*x+v.y*y+n.y*thickness,z:p.z+u.z*x+v.z*y+n.z*thickness};}
export function glassCorners(g:any){return [-1,1].flatMap(side=>[-1,1].map(edge=>glassPoint(g,side*GLASS_PANE_WIDTH/2,edge*GLASS_PANE_HEIGHT/2)));}
export function glassEndpoints(g:any){return [-1,1].map(side=>glassPoint(g,side*GLASS_PANE_WIDTH/2,0));}
export function glassLimbAnchors(g:any,slot:number){const p=g.players[slot],side=slot===0?-1:1,yaw=g.pane.yaw||0;return [-1,1].map(edge=>({shoulder:{x:p.x+Math.sin(yaw)*edge*.25,y:p.y+1.02-(p.lower||0)*.45,z:p.z+Math.cos(yaw)*edge*.25},hand:glassPoint(g,side*GLASS_PANE_WIDTH/2,edge*GLASS_PANE_HEIGHT/2)}));}
export function glassArmLengths(g:any,slot:number){return glassLimbAnchors(g,slot).map(({shoulder:a,hand:b})=>Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z));}
export function neutralGlass(g:any){if(g?.id==='glass')for(const p of g.players){p.lifting=false;p.rotating=false;p.jump=false;}}
export function glassAction(g:any,slot:number,name:string,value?:unknown){if(g.finished)return;if(name==='next'&&g.stageClear){g.nextReady[slot]=true;if(g.nextReady.every(Boolean)){g.stage++;g.checkpoint=0;g.stageClear=false;g.nextReady=[false,false];place(g);}return;}if(g.retryTime>0||g.stageClear)return;const p=g.players[slot];if(name==='jump'&&p.grounded&&!p.crouch){p.vy=5.8;p.grounded=false;p.support=null;}if(name==='retry'){g.recoveryKind='manual';g.retryTime=.45;g.message='Mengulang dari checkpoint terakhir.';g.revision++;}}
function shatter(g:any,message:string){if(g.retryTime>0)return;g.breaks++;g.recoveryKind='collision';g.retryTime=1.1;g.message=message;g.revision++;neutralGlass(g);}
function broadOverlap(center:{x:number;y:number;z:number},basis:any[],half:number[],part:GlassPart){
 for(const axis of ['x','y','z'] as const){const radius=half.reduce((sum,h,i)=>sum+h*Math.abs(basis[i][axis]),0)+part.half.reduce((sum,h,i)=>sum+h*Math.abs(part.basis[i][axis]),0);if(Math.abs(center[axis]-part.center[axis])>radius+1e-8)return false;}return true;
}
export function glassHitsPart(g:any,part:GlassPart){const basis=glassBasis(g);if(!broadOverlap(g.pane,basis,[1.218,.618,.0275],part))return false;
 return GLASS_SOLID_SEGMENTS.some(segment=>{const center=glassPoint(g,segment.u,segment.v),half=[segment.w/2,segment.h/2,segment.d/2];return part.geometry&&part.geometry!=='box'?obbHullOverlap(center,basis,half,part.center,part.basis,part.half,part.geometry):obbOverlap(center,basis,half,part.center,part.basis,part.half);});
}
export function glassHitsObstacle(g:any,o:GlassProp){return propParts(glassCourse(g.stage),o,g.elapsed||0).some(part=>glassHitsPart(g,part));}
export function bodyHitsPart(p:any,part:GlassPart){const height=1.67*Math.max(.3,1-(p.lower||0)*.55),center={x:p.x,y:p.y+height/2,z:p.z},half=[GLASS_BODY_RADIUS,height/2,GLASS_BODY_RADIUS];
 if((!part.geometry||part.geometry==='box')&&Math.abs(part.basis[1].y)>.999999&&Math.abs(part.basis[0].y)<1e-8&&Math.abs(part.basis[2].y)<1e-8){
  if(p.y>=part.center.y+part.half[1]||p.y+height<=part.center.y-part.half[1])return false;
  const dx=p.x-part.center.x,dz=p.z-part.center.z,u=Math.max(0,Math.abs(dx*part.basis[0].x+dz*part.basis[0].z)-part.half[0]),v=Math.max(0,Math.abs(dx*part.basis[2].x+dz*part.basis[2].z)-part.half[2]);return u*u+v*v<GLASS_BODY_RADIUS**2-1e-9;
 }
 return broadOverlap(center,WORLD_BASIS,half,part)&&(part.geometry&&part.geometry!=='box'?obbHullOverlap(center,WORLD_BASIS,half,part.center,part.basis,part.half,part.geometry):obbOverlap(center,WORLD_BASIS,half,part.center,part.basis,part.half));}
export function tickGlass(g:any,inputs:any[],dt:number){
 if(g.finished||g.stageClear)return;if(g.retryTime>0){g.retryTime-=dt;if(g.retryTime<=0){place(g);g.message=`Kembali ke checkpoint ${g.checkpoint}.`;}return;}
 const course=glassCourse(g.stage),now=g.elapsed||0,parts=courseParts(course,now),platforms=course.obstacles.filter(o=>o.kind==='platform');
 for(const [i,p] of g.players.entries()){
  const input=inputs[i]||{},length=Math.max(1,Math.hypot(input.x||0,input.y||0)),glassY=Math.max(-1,Math.min(1,input.glassY||0));p.lifting=glassY<-.1;p.rotating=Math.abs(input.glassX||0)>.1;
  p.gripHeight=Math.max(.05,Math.min(2.6,p.gripHeight-glassY*1.2*dt));p.lower=Math.max(0,GLASS_GRIP_HEIGHT-p.gripHeight);p.lift=Math.max(0,p.gripHeight-GLASS_GRIP_HEIGHT);p.crouch=p.gripHeight<1.05;
  if(p.support&&p.grounded){const platform=platforms.find(o=>o.id===p.support);if(platform){const a=platformPose(course,platform,now-dt),b=platformPose(course,platform,now),dx=p.x-a.x,dz=p.z-a.z,u=Math.cos(a.yaw)*dx-Math.sin(a.yaw)*dz,v=Math.sin(a.yaw)*dx+Math.cos(a.yaw)*dz;p.x=b.x+Math.cos(b.yaw)*u+Math.sin(b.yaw)*v;p.z=b.z-Math.sin(b.yaw)*u+Math.cos(b.yaw)*v;p.y+=b.y-a.y;}}
  const blocked=(candidate:any)=>parts.some(part=>!(part.support&&part.id===candidate.support||part.kind==='platform'&&part.center.y+part.half[1]<=candidate.y+.2)&&bodyHitsPart(candidate,part))||staticFloorAt(course,candidate.x,candidate.z)&&groundHeight(course,candidate.x,candidate.z)>candidate.y+.28;
  const move=routeControls(g.camera.yaw,(input.x||0)/length,(input.y||0)/length),speed=p.crouch?2.2:3.8;moveGlassBody(p,move.x*speed*dt,move.z*speed*dt,blocked);
  const previousY=p.y,wasGrounded=p.grounded;p.vy-=14*dt;p.y+=p.vy*dt;p.grounded=false;let floor=staticFloorAt(course,p.x,p.z)?groundHeight(course,p.x,p.z):-7;let support:string|null=null;
  for(const platform of platforms){const pose=platformPose(course,platform,now);if(inPlatform(course,platform,now,p.x,p.z)&&pose.y>floor&&(previousY>=pose.y-.2||p.support===platform.id)){floor=pose.y;support=platform.id;}}
  if(p.vy<=0&&(p.y<=floor||wasGrounded&&Math.abs(previousY-floor)<.22)){p.y=floor;p.vy=0;p.grounded=true;p.support=support;}else p.support=null;
 }
 const [a,b]=g.players,pane=g.pane,blend=1-Math.exp(-14*dt);pane.x+=((a.x+b.x)/2-pane.x)*blend;pane.z+=((a.z+b.z)/2-pane.z)*blend;pane.y+=((glassGrip(a)+glassGrip(b))/2-pane.y)*blend;
 const targetYaw=Math.atan2(-(b.z-a.z),b.x-a.x);pane.yaw+=Math.atan2(Math.sin(targetYaw-pane.yaw),Math.cos(targetYaw-pane.yaw))*blend;
 pane.roll+=(Math.max(-1,Math.min(1,(inputs[0]?.glassX||0)+(inputs[1]?.glassX||0))))*1.5*dt;pane.tilt=pane.roll;pane.slope=Math.atan2(glassGrip(b)-glassGrip(a),2.4);
 const blocked=(p:any)=>parts.some(part=>!(part.support&&part.id===p.support||part.kind==='platform'&&part.center.y+part.half[1]<=p.y+.2)&&bodyHitsPart(p,part))||staticFloorAt(course,p.x,p.z)&&groundHeight(course,p.x,p.z)>p.y+.28;
 for(let iteration=0;iteration<4;iteration++)for(const [slot,p] of g.players.entries())for(const {shoulder,hand} of glassLimbAnchors(g,slot)){
  const dx=hand.x-shoulder.x,dy=hand.y-shoulder.y,dz=hand.z-shoulder.z,length=Math.hypot(dx,dy,dz),excess=length-GLASS_ARM_MAX;if(excess>0)moveGlassBody(p,dx/length*excess,dz/length*excess,blocked);
 }
 const distance=Math.hypot(b.x-a.x,b.z-a.z);if(distance<.69){const nx=(b.x-a.x)/(distance||1),nz=(b.z-a.z)/(distance||1),push=(.69-distance)/2;moveGlassBody(a,-nx*push,-nz*push,blocked);moveGlassBody(b,nx*push,nz*push,blocked);}
 g.strain=Math.max(0,Math.min(1,(Math.max(...g.players.flatMap((_:any,i:number)=>glassArmLengths(g,i)))-.65)/(GLASS_ARM_MAX-.65)));g.armStress=0;g.pressure=0;
 // Pecah hanya dari kontak volume nyata. Tidak ada syarat sudut, jarak badan atau jangkauan tangan.
 for(const part of parts)if(glassHitsPart(g,part)){shatter(g,`Kaca menyentuh ${part.kind==='car'?'mobil':part.kind==='tree'?'batang pohon':part.kind==='hammer'?'palu':part.kind==='axe'?'kapak':part.kind==='pole'?'tiang listrik':'benda padat'}.`);break;}
 if(!g.retryTime)for(const p of g.players){const scale=Math.max(.3,1-p.lower*.55);for(const box of [{center:{x:p.x,y:p.y+.82*scale,z:p.z},basis:WORLD_BASIS,half:[.19,.30*scale,.14]},{center:{x:p.x,y:p.y+1.34*scale,z:p.z},basis:WORLD_BASIS,half:[.15,.17*scale,.14]}])if(glassHitsPart(g,{...box,color:'',id:'body',kind:'body'})){shatter(g,'Kaca menyentuh badan pembawa. Beri ruang di antara badan dan kaca.');break;}}
 if(!g.retryTime)for(const depth of [-.0275,.0275])for(const u of [-1,-.5,0,.5,1])for(const v of [-1,0,1]){const point=glassPoint(g,u*1.2,v*.6,depth),floor=staticFloorAt(course,point.x,point.z)?groundHeight(course,point.x,point.z):-7;if(point.y<=floor+.001){shatter(g,'Kaca menyentuh tanah.');break;}}
 if(!g.retryTime&&g.players.every((p:any)=>!p.support&&p.y<routeProject(course.route,p.x,p.z).y-3)){g.recoveryKind='fall';g.retryTime=1.1;g.message='Tim jatuh dari jalur. Kembali ke checkpoint tanpa menghitung kaca pecah.';g.revision++;neutralGlass(g);}
 const center=routeProject(course.route,pane.x,pane.z);g.progress=center.s;g.camera=planGlassCamera(g,course,dt);
 if(g.retryTime)return;const station=course.checkpoints[g.checkpoint];if(station!==undefined){const target=routePoint(course.route,station);if(g.players.every((p:any)=>Math.hypot(p.x-target.x,p.z-target.z)<4&&p.grounded)&&Math.hypot(pane.x-target.x,pane.z-target.z)<3){g.checkpoint++;g.cleared++;g.revision++;g.message=`Checkpoint ${g.checkpoint}/4 tersimpan.`;if(g.checkpoint===4){g.stagesCompleted++;g.stageClear=true;g.nextReady=[false,false];if(g.stage===59)g.finished=true;}}}
}
