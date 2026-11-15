import * as T from 'three';
import {glassLimbAnchors,GLASS_ARM_MAX} from './glass.ts';
const sphere=new T.SphereGeometry(1,32,24),tube=new T.CylinderGeometry(1,1,1,24);
const materials=new Map<string,T.MeshStandardMaterial>();
function mat(color:string){if(!materials.has(color))materials.set(color,new T.MeshStandardMaterial({color,roughness:.85,metalness:0}));return materials.get(color)!;}
function ellipsoid(root:T.Object3D,color:string,x:number,y:number,z:number,sx:number,sy=sx,sz=sx){const m=new T.Mesh(sphere,mat(color));m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
/** Humanoid elastis orisinal: kepala besar, tubuh membulat, dua lengan beruas. */
export function createSoftCarrier(parent:T.Object3D,color:string){
 const root=new T.Group(),body=new T.Group();root.add(body);parent.add(root);
 const torso=new T.Mesh(new T.CapsuleGeometry(.28,.32,10,24),mat(color));torso.userData.ownedGeometry=torso.geometry;torso.position.y=.82;torso.scale.z=.8;torso.castShadow=true;body.add(torso);
 ellipsoid(body,'#f4d4b5',0,1.34,0,.265,.29,.25);
 // Helm dan pakaian kerja memakai permukaan membulat dengan satu torso utuh.
 ellipsoid(body,'#e9bd4d',0,1.54,0,.29,.13,.28);ellipsoid(body,'#e9bd4d',0,1.48,.025,.32,.035,.32);
 for(const x of [-.085,.085])ellipsoid(body,'#344b58',x,1.34,.237,.022,.03,.018);
 for(const x of [-.16,.16])ellipsoid(body,'#f1d77f',x,.83,.207,.035,.25,.018);
 const legs=[-.145,.145].map(x=>{const leg=new T.Group();leg.position.set(x,.48,0);body.add(leg);const trouser=new T.Mesh(new T.CapsuleGeometry(.105,.22,8,16),mat('#354e61'));trouser.userData.ownedGeometry=trouser.geometry;trouser.position.y=-.18;leg.add(trouser);ellipsoid(leg,'#364149',0,-.4,.04,.125,.085,.18);return leg;});
 const arms=[0,1].map(()=>{const upper=new T.Mesh(tube,mat(color)),lower=new T.Mesh(tube,mat(color));upper.castShadow=lower.castShadow=true;parent.add(upper,lower);return {upper,lower,shoulder:ellipsoid(parent,color,0,0,0,.105),elbow:ellipsoid(parent,color,0,0,0,.1),hand:ellipsoid(parent,'#f7eee0',0,0,0,.12,.13,.12)};});
 const up=new T.Vector3(0,1,0),a=new T.Vector3(),b=new T.Vector3(),delta=new T.Vector3(),direction=new T.Vector3(),bend=new T.Vector3(),elbow=new T.Vector3(),middle=new T.Vector3();
 let lastX:number|undefined,lastZ=0,walkPhase=0,walkSpeed=0,facing=0,initialized=false;
 function bone(mesh:T.Mesh,from:T.Vector3,to:T.Vector3,radius:number){delta.subVectors(to,from);const length=delta.length();mesh.position.copy(from).add(to).multiplyScalar(.5);mesh.scale.set(radius,Math.max(.001,length),radius);mesh.quaternion.setFromUnitVectors(up,delta.normalize());}
 return {root,hands:arms.map(arm=>arm.hand),update(g:any,slot:number,time:number,dt:number,reduced:boolean){
  const p=g.players[slot],anchors=glassLimbAnchors(g,slot),hand=anchors[0].hand,dx=hand.x-p.x,dz=hand.z-p.z;
  const speed=lastX===undefined?0:Math.min(4.5,Math.hypot(p.x-lastX,p.z-lastZ)/dt);lastX=p.x;lastZ=p.z;walkSpeed=reduced?0:T.MathUtils.damp(walkSpeed,speed,12,dt);if(!reduced)walkPhase+=walkSpeed*dt*5;
  const targetFacing=Math.hypot(dx,dz)>.1?Math.atan2(dx,dz):facing;if(!initialized){facing=targetFacing;initialized=true;}else facing+=Math.atan2(Math.sin(targetFacing-facing),Math.cos(targetFacing-facing))*(1-Math.exp(-12*dt));
  root.position.set(p.x,p.y,p.z);body.rotation.y=facing;body.scale.y=Math.max(.3,1-(p.lower||0)*.55);body.rotation.z=0;body.rotation.x=0;
  legs.forEach((leg,i)=>leg.rotation.x=reduced?0:p.grounded?Math.sin(walkPhase+i*Math.PI)*Math.min(.38,walkSpeed*.1):.22);

  anchors.forEach((anchor,i)=>{
   const arm=arms[i];a.set(anchor.shoulder.x,anchor.shoulder.y,anchor.shoulder.z);b.set(anchor.hand.x,anchor.hand.y,anchor.hand.z);direction.subVectors(b,a);const reach=direction.length();direction.normalize();
   // Kedua ruas tumbuh secara terbatas; siku menekuk ke bawah pada jangkauan pendek.
   const segment=Math.min(GLASS_ARM_MAX/2,Math.max(.37,reach*.51)),height=Math.sqrt(Math.max(0,segment*segment-reach*reach/4));
   bend.set(0,-1,0).addScaledVector(direction,direction.y);if(bend.lengthSq()<.001)bend.set(0,0,1);bend.normalize();elbow.copy(a).add(b).multiplyScalar(.5).addScaledVector(bend,height);
   bone(arm.upper,a,elbow,.105);bone(arm.lower,elbow,b,.09);arm.shoulder.position.copy(a);arm.elbow.position.copy(elbow);arm.hand.position.copy(b);
   arm.upper.userData.armLength=Math.min(GLASS_ARM_MAX,reach);arm.lower.userData.armLimit=GLASS_ARM_MAX;
  });
 }};
}
