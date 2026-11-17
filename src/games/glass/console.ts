import type {SceneKit} from '../../shared/game-contracts.ts';
import * as T from 'three';
import {addAsset,assetChoices} from '../../shared/renderer/assets3d.ts';
import {solidProfile} from './glass-collision.ts';
import {glassMovingKinds} from './glass-levels.ts';
import {glassTerrainTriangles,glassRoadTriangles,glassPitTriangles} from './glass-terrain.ts';
import {routePoint} from './glass-route.ts';
import {createSoftCarrier} from './soft-carrier.ts';
import {GLASS_SOLID_SEGMENTS,glassBasis,glassCourse,glassWorlds,propParts,groundHeight,staticFloorAt} from './glass.ts';
export function buildConsole(g:any,kit:SceneKit){
 const {world,scene,keyLight,team,box,shape,group,label,animate,contact,tree,person,material,geometry,targetAspect}=kit;

 const course=glassCourse(g.stage),theme=glassWorlds[course.world],forest=course.world===1,space=course.world===4,sky=theme.sky;
 scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,48,155);kit.camera=new T.PerspectiveCamera(46,targetAspect(),.1,230);
 if(keyLight){keyLight.color.set(space?'#cbd8ff':'#fff1dd');keyLight.intensity=space?2:2.6;}
 box(world,space?'#5b6984':forest?'#70875a':'#84956f',0,-7.3,-20,600,.6,600);
 // Map lebih panjang: pecah mesh tanah/jalan agar frustum dapat membuang
 // bagian jauh. Semua segitiga dipertahankan, termasuk potongan lubang.
 const mesh=(positions:number[],color:string)=>{
  const chunks=new Map<string,number[]>();for(let i=0;i<positions.length;i+=9){const x=(positions[i]+positions[i+3]+positions[i+6])/3,z=(positions[i+2]+positions[i+5]+positions[i+8])/3,key=`${Math.floor(x/20)},${Math.floor(z/20)}`,chunk=chunks.get(key)||[];for(let j=0;j<9;j++)chunk.push(positions[i+j]);chunks.set(key,chunk);}
  for(const chunk of chunks.values()){const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(chunk,3));geo.computeVertexNormals();geo.computeBoundingSphere();const object=new T.Mesh(geo,material(color));object.receiveShadow=true;object.userData.ownedGeometry=geo;world.add(object);}
 };
 mesh(glassTerrainTriangles(course),theme.ground);mesh(glassRoadTriangles(course),theme.road);
 if(course.gaps.length){mesh(glassPitTriangles(course),new T.Color(theme.stone).multiplyScalar(.48).getStyle());for(const gap of course.gaps){const water=box(world,['#417f9c','#397f7e','#946b4d','#4f9394','#344467','#698baa'][course.world],gap.x,gap.bottom+.02,gap.z,gap.w,.04,gap.d);water.rotation.y=gap.yaw;water.receiveShadow=false;}}
 const batches=new Map<string,T.Matrix4[]>(),matrix=new T.Matrix4(),basisMatrix=new T.Matrix4(),v0=new T.Vector3(),v1=new T.Vector3(),v2=new T.Vector3(),quaternion=new T.Quaternion();
 function partMatrix(part:ReturnType<typeof propParts>[number]){basisMatrix.makeBasis(v0.set(part.basis[0].x,part.basis[0].y,part.basis[0].z),v1.set(part.basis[1].x,part.basis[1].y,part.basis[1].z),v2.set(part.basis[2].x,part.basis[2].y,part.basis[2].z));quaternion.setFromRotationMatrix(basisMatrix);return new T.Matrix4().compose(new T.Vector3(part.center.x,part.center.y,part.center.z),quaternion,new T.Vector3(part.half[0]*(part.geometry&&part.geometry!=='box'?1:2),part.half[1]*(part.geometry==='gem'||part.geometry==='roof'?1:2),part.half[2]*(part.geometry&&part.geometry!=='box'?1:2)));}
 const batch=(color:string,matrix:T.Matrix4)=>{if(!batches.has(color))batches.set(color,[]);batches.get(color)!.push(matrix);};
 const decor=(o:{x:number;z:number;yaw:number},x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{const objectMatrix=new T.Matrix4().makeRotationY(o.yaw);objectMatrix.setPosition(o.x+Math.cos(o.yaw)*x+Math.sin(o.yaw)*z,y,o.z-Math.sin(o.yaw)*x+Math.cos(o.yaw)*z);objectMatrix.scale(new T.Vector3(w,h,d));batch('box|'+color,objectMatrix);};
 const moving:{prop:typeof course.obstacles[number];meshes:T.Mesh[]}[]=[];
 for(const o of course.obstacles){
  const parts=propParts(course,o,g.elapsed||0);
  if(glassMovingKinds.has(o.kind)){moving.push({prop:o,meshes:parts.map(part=>{const object=new T.Mesh(geometry(part.geometry||'box'),material(part.color));object.matrixAutoUpdate=false;object.matrix.copy(partMatrix(part));object.castShadow=object.receiveShadow=true;world.add(object);return object;})});}
  else for(const part of parts)batch((part.geometry||'box')+'|'+part.color,partMatrix(part));
  if(o.kind==='car'){
   decor(o,0,o.bottom+1.1,-1.035,1.44,.44,.018,'#b5d3dc');decor(o,0,o.bottom+1.1,1.135,1.44,.44,.018,'#b5d3dc');
   for(const side of [-1,1]){decor(o,side*.57,o.bottom+.50,-2.008,.36,.18,.015,'#d9e4ce');decor(o,side*.57,o.bottom+.50,2.008,.32,.18,.015,'#a34742');}
  }
  if(o.kind==='factory'){for(const z of [-1.5,0,1.5])decor(o,(-Math.sign(o.lateral)||1)*(o.w/2+.006),o.bottom+2.0,z,.012,1.0,.85,'#303d48');}
  if(o.kind==='house'){
   const side=-Math.sign(o.lateral)||1;for(const z of [-1.5,1.5])for(const y of [1.9,3.4])if(y<o.top-o.bottom-.3)decor(o,side*(o.w/2+.006),o.bottom+y,z,.012,.8,.65,'#62899d');decor(o,side*(o.w/2+.007),o.bottom+.95,0,.014,1.9,.8,'#80624f');
   for(const dx of [-1.2,0,1.2])decor(o,dx,o.bottom+1.9,-o.d/2-.008,.65,.9,.015,'#56788a');
  }
 }
 // Marka dan trotoar mengikuti kurva, tidak membentuk lorong lurus baru.
 if(course.world===0||course.world===2||course.world===4)for(let s=2;s<course.route.length;s+=3){const p=routePoint(course.route,s);if(!staticFloorAt(course,p.x,p.z))continue;decor(p,0,groundHeight(course,p.x,p.z)+.035,0,.11,.02,1.2,'#e4d5a5');}
 for(const [key,matrices] of batches){const [kind,color]=key.split('|');const object=new T.InstancedMesh(geometry(kind),material(color),matrices.length);matrices.forEach((m,i)=>object.setMatrixAt(i,m));object.castShadow=object.receiveShadow=true;world.add(object);}
 const pads=course.checkpoints.map((s,i)=>{const p=routePoint(course.route,s),ring=shape(world,'ring','#ddc783',p.x,groundHeight(course,p.x,p.z)+.055,p.z,1.65,1.65,1.65,true);ring.rotation.x=Math.PI/2;return ring;});
 if(course.world===5){
  const flakes=new T.InstancedMesh(geometry('sphere'),material('#e4eef2',true),85);const snowMatrix=new T.Matrix4();flakes.castShadow=false;world.add(flakes);animate(world,(state,t)=>{const center=state.pane;for(let i=0;i<85;i++){snowMatrix.makeScale(.035,.035,.035);snowMatrix.setPosition(center.x+Math.sin(i*31.7)*13,center.y+((i*.37-(kit.reducedMotion?0:t*.8))%9+9)%9,center.z+Math.cos(i*17.3)*12);flakes.setMatrixAt(i,snowMatrix);}flakes.instanceMatrix.needsUpdate=true;});
 }
 if(space){
  const stars=new T.InstancedMesh(geometry('sphere'),material('#c5d8ff',true),110);for(let i=0;i<110;i++){matrix.makeScale(.05,.05,.05);matrix.setPosition(Math.sin(i*12.3)*110,12+i%35,-80+Math.cos(i*4.1)*100);stars.setMatrixAt(i,matrix);}world.add(stars);
  shape(world,'sphere','#6c79b1',-45,24,-95,16,16,16);
 }else for(let i=0;i<9;i++){const p=course.route.points[Math.floor((i+1)*course.route.points.length/10)],x=i%2?course.route.bounds.maxX+14:course.route.bounds.minX-14,hill=shape(world,'sphere',theme.color,x,-7,p.z,14,9+i%3,18);hill.castShadow=false;}
 const frame=group(world),pane=shape(frame,'box','#bbdfe4',0,0,0,2.4,1.2,.055),glassMaterial=new T.MeshStandardMaterial({color:'#c2e7ed',transparent:true,opacity:.36,roughness:.12,metalness:.14,depthWrite:false,side:T.DoubleSide});pane.material=glassMaterial;pane.userData.ownedMaterial=glassMaterial;
 for(const segment of GLASS_SOLID_SEGMENTS.slice(1))box(frame,segment.v>0?'#b9a3e0':'#d4eee7',segment.u,segment.v,0,segment.w,segment.h,segment.d);
 const people=g.players.map((_:any,i:number)=>createSoftCarrier(world,team[i]));
 const shards=Array.from({length:10},()=>{const shard=shape(world,'gem','#c6e4e9',0,0,0,.14,.07,.12);shard.castShadow=false;shard.visible=false;return shard;});
 animate(world,(state,t,dt)=>{
  frame.visible=state.recoveryKind!=='collision'||state.retryTime<=0;shards.forEach((shard,i)=>{const age=1.1-state.retryTime;shard.visible=state.recoveryKind==='collision'&&state.retryTime>0;shard.position.set(state.pane.x+Math.cos(i*2.4)*age*.8,state.pane.y+Math.sin(i)*age*.5-age*age*2,state.pane.z+Math.sin(i*2.4)*age*.8);shard.rotation.set(i+age*3,i*.7+age,i*.4);});frame.position.set(state.pane.x,state.pane.y,state.pane.z);const basis=glassBasis(state);basisMatrix.makeBasis(v0.set(basis[0].x,basis[0].y,basis[0].z),v1.set(basis[1].x,basis[1].y,basis[1].z),v2.set(basis[2].x,basis[2].y,basis[2].z));frame.quaternion.setFromRotationMatrix(basisMatrix);
  people.forEach((model,i)=>model.update(state,i,t,dt,kit.reducedMotion));pads.forEach((ring,i)=>{ring.visible=i===state.checkpoint;});
  for(const item of moving){const parts=propParts(course,item.prop,state.elapsed);parts.forEach((part,i)=>item.meshes[i].matrix.copy(partMatrix(part)));}
  const view=state.camera;if(view){kit.camera.position.set(view.x,view.y,view.z);kit.camera.lookAt(view.targetX,view.targetY,view.targetZ);}
  if(keyLight){keyLight.position.set(state.pane.x-9,state.pane.y+16,state.pane.z+7);keyLight.target.position.set(state.pane.x,state.pane.y,state.pane.z);}
 });
}
