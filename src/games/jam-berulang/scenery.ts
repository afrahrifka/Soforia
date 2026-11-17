import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {LEVELS,arenaPoint,TILE} from './levels.ts';
import type {SceneKit} from '../../shared/game-contracts.ts';
export const houses=['building_home_A_blue','building_home_B_blue','building_tavern_blue','building_market_blue','building_blacksmith_blue','building_church_blue','building_watermill_blue','building_windmill_blue','building_well_blue','building_tower_A_blue'];
export const trees=['tree_single_A','tree_single_B','trees_A_small'];
export const props=['barrel','crate_A_small','sack','wheelbarrow'];
export const plants=['waterlily_A','waterplant_A','waterplant_B'];
export const rocks=['rock_single_A','rock_single_B','rock_single_C'];
export const landscape=['hills_A_trees','hills_B_trees','mountain_A_grass_trees','mountain_B_grass_trees','cloud_big','cloud_small'];
const base='/games/jam-berulang/assets/';
/** Resource dimiliki scene ini; callback host juga membatalkan hasil load yang terlambat. */
export function scenery(kit:SceneKit,district:number){
 const {world,scene}=kit,d=LEVELS[district],water=['#305a72','#317b85','#284954','#24243d','#382a43','#111d39'][district];
 kit.shape(world,'cylinder',water,0,-.8,0,34,.3,30);const loader=new GLTFLoader();let alive=true;
 const templates=new Map<string,Promise<T.Object3D>>(),geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();
 const stats={pending:0,loaded:0,failed:[] as string[]};world.userData.jamAssets=stats;
 function collect(root:T.Object3D){root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const v of Object.values(m))if(v instanceof T.Texture)textures.add(v);}}});}
 function dispose(){geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
 const owner=new T.Group();owner.userData.releaseAsset=()=>{alive=false;dispose();};world.add(owner);
 function model(name:string,x:number,z:number,height:number,footprint:number,yaw=0,y=0){
  const root=new T.Group();root.position.set(x,y,z);root.rotation.y=yaw;root.userData.releaseAsset=()=>{};world.add(root);
  if(!templates.has(name)){stats.pending++;templates.set(name,loader.loadAsync(base+name+'.gltf').then(g=>{collect(g.scene);stats.pending--;stats.loaded++;if(!alive)dispose();return g.scene;}).catch(e=>{stats.pending--;stats.failed.push(name);throw e;}));}
  templates.get(name)!.then(template=>{if(!alive)return;const copy=template.clone(true),bounds=new T.Box3().setFromObject(copy),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3());const s=Math.min(height/Math.max(size.y,.001),footprint/Math.max(size.x,size.z,.001));copy.position.set(-center.x,-bounds.min.y,-center.z);const pivot=new T.Group();pivot.add(copy);pivot.scale.setScalar(s);root.add(pivot);copy.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;}});}).catch(()=>{});return root;
 }
 function texture(name:string,color=false){const t=new T.TextureLoader().load(base+name);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(7.6,4.8);t.anisotropy=4;if(color)t.colorSpace=T.SRGBColorSpace;textures.add(t);return t;}
 const paving=new T.MeshStandardMaterial({map:texture('cobblestone-diff.jpg',true),normalMap:texture('cobblestone-nor_gl.jpg'),roughnessMap:texture('cobblestone-rough.jpg'),roughness:.92,normalScale:new T.Vector2(.55,.55),color:'#bfc2b9'});materials.add(paving);
 const top:number[]=[],sides:number[]=[];
 const at=(x:number,y:number)=>d.rows[y]?.[x]??' ';
 for(let y=0;y<d.rows.length;y++)for(let x=0;x<d.rows[0].length;x++){
  if(at(x,y)===' '||at(x,y)==='~')continue;const p=arenaPoint(district,x,y),h=TILE/2;
  for(const [u,v] of [[-1,-1],[-1,1],[1,-1],[1,-1],[-1,1],[1,1]])top.push(p.x+u*h,-.005,p.z+v*h);
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])if(at(x+dx,y+dy)===' '){
   const ax=p.x+(dx?dx:-1)*h,az=p.z+(dy?dy:-1)*h,bx=p.x+(dx?dx:1)*h,bz=p.z+(dy?dy:1)*h;
   sides.push(ax,0,az,bx,0,bz,ax,-.6,az,bx,0,bz,bx,-.6,bz,ax,-.6,az);
  }
 }
 const floorGeometry=new T.BufferGeometry();floorGeometry.setAttribute('position',new T.Float32BufferAttribute(top,3));floorGeometry.setAttribute('uv',new T.Float32BufferAttribute(top.flatMap((_,i)=>i%3===0?[top[i]/15,top[i+2]/10]:[]),2));floorGeometry.computeVertexNormals();
 const floor=new T.Mesh(floorGeometry,paving);geometries.add(floorGeometry);floor.receiveShadow=true;floor.userData.releaseAsset=()=>{};world.add(floor);
 const edgeGeometry=new T.BufferGeometry();edgeGeometry.setAttribute('position',new T.Float32BufferAttribute(sides,3));edgeGeometry.computeVertexNormals();const edgeMaterial=new T.MeshStandardMaterial({color:d.palette[1],side:T.DoubleSide,roughness:.9});geometries.add(edgeGeometry);materials.add(edgeMaterial);const edges=new T.Mesh(edgeGeometry,edgeMaterial);edges.userData.releaseAsset=()=>{};world.add(edges);
 paving.color.set(d.palette[0]);
 const skies=['#233949','#294952','#433a35','#181c38','#352638','#10182f'];scene.background=new T.Color(skies[district]);scene.fog=new T.Fog(skies[district],35,80);
 scene.traverse((o:T.Object3D)=>{if(o instanceof T.HemisphereLight){o.color.set('#e2ecff');o.groundColor.set('#6b6259');o.intensity=1.65;}});
 if(kit.keyLight){kit.keyLight.color.set('#ffd6a2');kit.keyLight.intensity=3.2;kit.keyLight.position.set(-9,12,5);kit.keyLight.shadow.mapSize.set(2048,2048);}
 const rim=new T.DirectionalLight('#91c7ed',1.1);rim.position.set(8,6,-9);world.add(rim);
 // Siluet landmark berada di lubang/luar jalan, berbeda untuk tiap zona.
 const point=(x:number,y:number)=>arenaPoint(district,x,y);
 function asset(name:string,x:number,y:number,height:number,size:number){const p=point(x,y);return model(name,p.x,p.z,height,size);}
 if(d.zone==='harbor'){
  asset('building_watermill_blue',10,7,2.9,3.8);for(const x of [3,17])asset('barrel',x,7,.3,.3);
 }else if(d.zone==='islands'){
  for(const [x,y] of [[9,3],[10,14],[21,3]])asset('rock_single_C',x,y,2,2);asset('building_well_blue',17,9,.65,.65);
 }else if(d.zone==='aqueduct'){
  for(const [x,y] of [[8,5],[13,5],[17,5]]){const p=point(x,y);kit.shape(world,'cylinder','#a8997c',p.x,1.4,p.z,.34,2.8,.34);const arch=kit.shape(world,'ring','#b7ab91',p.x,2.4,p.z,1.6,1.6,1.6);arch.rotation.y=Math.PI/2;}
  asset('building_watermill_blue',13,8,2.2,2.5);
 }else if(d.zone==='orrery'){
  const p=point(19,11);for(let n=0;n<3;n++){const ring=kit.shape(world,'ring',['#c7a970','#84bfc7','#a593d0'][n],p.x,1,p.z,1.25,1.25,1.25);ring.rotation.set(n*.8,.4+n,.3);}
  asset('building_tower_A_blue',23,13,1.5,1.2);
 }else if(d.zone==='archive'){
  const p=point(12,8);for(let n=0;n<7;n++){const book=kit.box(world,['#846482','#c0a478','#6a8b96'][n%3],p.x,1+n*.18,p.z,2.2,.14,1.4);book.rotation.y=n*.3;}
  asset('building_church_blue',5,10,2.4,2.8);
 }else{
  const p=point(14,2);for(let n=0;n<12;n++){const a=n*Math.PI/6,tooth=kit.box(world,'#b8a176',p.x+Math.cos(a)*1.8,2.6+Math.sin(a)*1.8,p.z,.35,.3,.45);tooth.rotation.z=a;}
  const p2=point(14,2);for(let n=0;n<3;n++){const crown=kit.shape(world,'ring','#a1bfe3',p2.x,1+n*.4,p2.z,1.8+n*.15,1.8+n*.15,1.8+n*.15);crown.rotation.x=Math.PI/2;}
 }
 return {model};
}
