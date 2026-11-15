import {solidProfile} from './glass-collision.ts';
import {glassTerrainTriangles,glassRoadTriangles} from './glass-terrain.ts';
import {routePoint} from './glass-route.ts';
import {forestChoices} from './scene-assets.ts';
import {createSoftCarrier} from './soft-carrier.ts';
import {addAsset,assetChoices,assetStats,releaseAssetInstances} from './assets3d.ts';
import {GLASS_SOLID_SEGMENTS,glassBasis,glassCourse,glassWorlds,propParts,groundHeight,staticFloorAt} from './glass.ts';
import * as T from 'three';
import { districts, propertyTiles } from './property.ts';

const team=['#ff9e87','#a8dbe7'];
type Animated={object:T.Object3D;update:(g:any,t:number,dt:number)=>void};
let renderer:T.WebGLRenderer|undefined,canvas:HTMLCanvasElement|null=null,scene:T.Scene,camera:T.OrthographicCamera|T.PerspectiveCamera,world:T.Group;
let identity='',animated:Animated[]=[],lastTime=0,visualTime=0,lastWidth=0,lastHeight=0,failedCanvas:HTMLCanvasElement|null=null;
const geometries=new Map<string,T.BufferGeometry>(),materials=new Map<string,T.MeshStandardMaterial>();
const textures:T.Texture[]=[];
let worldLabels=0;
let reducedMotion=false,keyLight:T.DirectionalLight|undefined;
function roofGeometry(){const profile=solidProfile('roof'),positions:number[]=[];for(const face of profile.faces)for(let i=1;i<face.length-1;i++)for(const index of [face[0],face[i],face[i+1]]){const p=profile.vertices[index];positions.push(p.x,p.y,p.z);}const geometry=new T.BufferGeometry();geometry.setAttribute('position',new T.Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;}
function geometry(kind:string){if(!geometries.has(kind))geometries.set(kind,kind==='sphere'?new T.SphereGeometry(1,16,12):kind==='cone'?new T.ConeGeometry(1,1,8):kind==='cylinder'?new T.CylinderGeometry(1,1,1,20):kind==='ring'?new T.TorusGeometry(1,.055,8,48):kind==='gem'?new T.OctahedronGeometry(1):kind==='roof'?roofGeometry():new T.BoxGeometry(1,1,1));return geometries.get(kind)!;}
function material(color:string,glow=false){const key=color+glow;if(!materials.has(key))materials.set(key,new T.MeshStandardMaterial({color,roughness:.72,metalness:.08,...(glow?{emissive:color,emissiveIntensity:.65}:{})}));return materials.get(key)!;}
function shape(parent:T.Object3D,kind:string,color:string,x:number,y:number,z:number,sx:number,sy=sx,sz=sx,glow=false){const mesh=new T.Mesh(geometry(kind),material(color,glow));mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);mesh.castShadow=true;mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function box(parent:T.Object3D,color:string,x:number,y:number,z:number,w:number,h:number,d:number){return shape(parent,'box',color,x,y,z,w,h,d);}
function group(parent:T.Object3D,x=0,y=0,z=0){const g=new T.Group();g.position.set(x,y,z);parent.add(g);return g;}
function label(parent:T.Object3D,text:string,x:number,y:number,z:number,width=1.7,color='#f9f3e8',background='#203b4f'){
 worldLabels++;
 const surface=document.createElement('canvas');surface.width=Math.max(128,Math.min(512,text.length*26+48));surface.height=112;const c=surface.getContext('2d')!;
 c.fillStyle=background;c.beginPath();c.roundRect(3,3,surface.width-6,106,22);c.fill();c.strokeStyle=color+'70';c.lineWidth=3;c.stroke();c.fillStyle=color;c.font=text.length<=2?'800 80px system-ui':'600 35px system-ui';c.textAlign='center';c.textBaseline='middle';c.fillText(text,surface.width/2,57,surface.width-24);
 const texture=new T.CanvasTexture(surface);texture.colorSpace=T.SRGBColorSpace;textures.push(texture);
 const sprite=new T.Sprite(new T.SpriteMaterial({map:texture,depthTest:false,transparent:true}));sprite.position.set(x,y,z);const height=width*(text.length<=2?.7:.22);sprite.scale.set(Math.min(width,height*surface.width/112),height,1);sprite.renderOrder=5;parent.add(sprite);return sprite;
}
function animate(object:T.Object3D,update:Animated['update']){animated.push({object,update});}
function contact(parent:T.Object3D,x:number,z:number,r=.45){return shape(parent,'cylinder','#344545',x,.02,z,r,.015,r);}
function tree(parent:T.Object3D,x:number,z:number,size=1){const trunk=box(parent,'#967052',x,.45*size,z,.13*size,.9*size,.13*size),a=shape(parent,'sphere','#709b7c',x,1.05*size,z,.52*size,.65*size,.52*size),b=shape(parent,'sphere','#a3bc86',x-.15*size,1.3*size,z,.35*size,.4*size,.35*size);addAsset(parent,forestChoices[Math.abs(Math.round(x*13+z*7))%forestChoices.length],{x,z,height:1.7*size,fallback:[trunk,a,b]});}
function person(parent:T.Object3D,color:string){const p=group(parent);shape(p,'cylinder',color,0,.48,0,.22,.55,.22);shape(p,'sphere','#f5d8b2',0,.94,0,.22);shape(p,'sphere',color,0,1.08,0,.24,.12,.24);box(p,'#314658',-.13,.12,0,.16,.25,.23);box(p,'#314658',.13,.12,0,.16,.25,.23);return p;}
function disposeWorld(){
 if(world){releaseAssetInstances(world);scene.traverse(o=>{if(o instanceof T.DirectionalLight)o.shadow.dispose();});world.traverse(o=>{if(o instanceof T.InstancedMesh)o.dispose();if(o instanceof T.Sprite){o.material.dispose();}if(o.userData.ownedMaterial instanceof T.Material)o.userData.ownedMaterial.dispose();if(o.userData.ownedGeometry instanceof T.BufferGeometry)o.userData.ownedGeometry.dispose();});scene.remove(world);}
 textures.splice(0).forEach(t=>t.dispose());animated=[];
}
function setup(target:HTMLCanvasElement){
 if(renderer&&canvas!==target){renderer.dispose();renderer.forceContextLoss();renderer=undefined;}
 canvas=target;renderer=new T.WebGLRenderer({canvas:target,antialias:true,alpha:false,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.5));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;identity='';lastWidth=0;lastHeight=0;
 target.addEventListener('webglcontextlost',event=>{event.preventDefault();identity='';target.dataset.renderError='Konteks 3D terputus. Muat ulang layar konsol.';});
}
function build(g:any){
 disposeWorld();worldLabels=0;lastWidth=0;lastHeight=0;scene=new T.Scene();world=new T.Group();scene.add(world);const space=g.id==='orbit';scene.background=new T.Color(space?'#101c35':g.id==='garden'?'#b8cdb7':'#bfd1d3');scene.fog=new T.Fog(scene.background,28,65);
 camera=new T.OrthographicCamera(-11,11,6.2,-6.2,.1,90);camera.position.set(0,17,space?12:15);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(space?0xbfdfff:0xfff6dc,space?0x18203b:0x698c83,2.3));const sun=new T.DirectionalLight(0xffe5c5,3);sun.position.set(-7,15,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-13;sun.shadow.camera.right=13;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.04;keyLight=sun;scene.add(sun,sun.target);
 if(g.id==='glass')buildGlass(g);else if(g.id==='orbit')buildOrbit(g);else if(g.id==='garden')buildGarden(g);else if(g.id==='property')buildCity(g);else buildQuiz();
}
function buildOrbit(g:any){
 box(world,'#203b53',0,-.5,0,19,.5,10.8);
 for(let i=0;i<38;i++){const x=((i*137)%185)/10-9.2,z=((i*73)%101)/10-5;shape(world,'cylinder','#36536a',x,-.23,z,.025,.01,.025,true);}
 // Batas arena dan dekorasi berada di luar jalur permainan.
 for(const z of [-5.45,5.45])box(world,'#61718b',0,-.1,z,19.2,.3,.12);
 for(const x of [-9.6,9.6])box(world,'#61718b',x,-.1,0,.12,.3,11);
 for(let i=0;i<65;i++){const x=Math.sin(i*43.7)*23,z=Math.cos(i*18.3)*15;shape(world,'sphere','#adc4d9',x,-2-Math.abs(Math.cos(i))*3,z,.025+(i%3)*.014,undefined,undefined,true);}
 shape(world,'sphere','#627a9f',-10,-2,-7,2.1);const planetRing=shape(world,'ring','#b5b1bf',-10,-2,-7,3,3,3);planetRing.rotation.x=1.15;
 label(world,`ORBIT · ARENA ${g.level}`,0,.2,-5.9,3.2);
 const crystalModels=g.energies.map((e:any)=>{const root=group(world,(e.x-640)/70,0,(e.y-360)/70);const gem=shape(root,'gem','#ffe1a1',0,.55,0,.2,.34,.2,true);const halo=shape(root,'ring','#7d8c6c',0,.04,0,.32,.32,.32);halo.rotation.x=Math.PI/2;return {root,gem,halo,burstAt:-100,wasTaken:false};});
 animate(world,(state,t)=>{crystalModels.forEach((m:any,i:number)=>{const taken=state.energies[i].taken;if(taken&&!m.wasTaken)m.burstAt=t;m.wasTaken=taken;const age=t-m.burstAt;m.root.visible=!taken||(!reducedMotion&&age<.5);m.gem.visible=!taken;m.halo.scale.setScalar(taken?.32+age*1.6:.32);m.gem.rotation.y=reducedMotion?0:t*.9;m.gem.position.y=.55+(reducedMotion?0:Math.sin(t*2+i)*.08);});});
 const obstacleModels=g.obstacles.map(()=>{const root=group(world);shape(root,'gem','#84738a',0,.4,0,.43,.5,.43);shape(root,'gem','#b2a0a1',-.16,.7,.1,.18);contact(root,0,0,.48);addAsset(root,'kaykit-space/rock_A',{height:.85,width:.85,depth:.85,fallback:root.children.filter(o=>o.position.y>.1)});return root;});
 animate(world,(state,t)=>obstacleModels.forEach((m:any,i:number)=>{const o=state.obstacles[i];m.position.set((o.x-640)/70,0,(o.y+Math.sin(state.elapsed+o.phase)*70-360)/70);m.rotation.y=reducedMotion?0:t*.2+i;}));
 const gates=[260,460].map((z,i)=>{const root=group(world,500/70,0,(z-360)/70);shape(root,'cylinder','#304c59',0,0,0,.7,.13,.7);const ring=shape(root,'ring',team[i],0,.12,0,.63,.63,.63,true);ring.rotation.x=Math.PI/2;const tower=shape(root,'ring',team[i],0,1,0,.68,1,.68,true);label(root,i?'PAD B':'PAD A',0,2,0,1.2);return {ring,tower};});
 animate(world,(state,t)=>gates.forEach(m=>{const ready=state.energies.every((e:any)=>e.taken)&&state.gateOpen;m.tower.visible=ready;m.ring.material=material(ready?'#d5ffc6':'#687f92',ready);m.tower.scale.setScalar(.65+Math.min(state.gate/2,1)*.4);m.tower.rotation.y=reducedMotion?0:t*.5;}));
 const ships=g.players.map((_:any,i:number)=>{
  const root=group(world);contact(root,0,0,.38);const body=group(root,0,.42,0);shape(body,'sphere',team[i],0,0,0,.24,.17,.48);const nose=shape(body,'cone',team[i],0,.02,-.42,.24,.4,.2);nose.rotation.x=-Math.PI/2;box(body,team[i],0,0,.02,.85,.08,.3);shape(body,'sphere','#294557',0,.16,-.1,.14,.1,.19);const flame=shape(body,'cone','#ffcf8d',0,0,.6,.12,.4,.12,true);flame.rotation.x=-Math.PI/2;addAsset(body,i?'kaykit-space/lander_B':'kaykit-space/lander_A',{height:.7,width:.8,depth:1.1,y:-.15,fallback:body.children.filter(o=>o!==flame)});const shield=shape(root,'ring','#b9e8dc',0,.25,0,.55,.55,.55,true);shield.rotation.x=Math.PI/2;label(root,i?'B':'A',0,1.25,0,.6,team[i]);return {root,body,flame,shield,x:0,z:0,first:true};
 });
 animate(world,(state,t,dt)=>ships.forEach((m:any,i:number)=>{const p=state.players[i],x=(p.x-640)/70,z=(p.y-360)/70;if(m.first||reducedMotion){m.root.position.set(x,0,z);m.first=false;}else{m.root.position.x=T.MathUtils.damp(m.root.position.x,x,22,dt);m.root.position.z=T.MathUtils.damp(m.root.position.z,z,22,dt);}const dx=x-m.x,dz=z-m.z;if(Math.hypot(dx,dz)>.005)m.body.rotation.y=Math.atan2(-dx,-dz);m.x=x;m.z=z;m.flame.visible=!p.down;m.shield.visible=p.immune>0;m.body.position.y=.42+(reducedMotion?0:Math.sin(t*3+i)*.035);m.body.visible=!(p.down&&Math.floor(t*4)%2); }));
}
function buildGarden(g:any){
 box(world,'#6e8b72',0,-.55,0,17,.65,12);box(world,'#a7b98b',0,-.18,0,16.5,.15,11.5);
 for(let x=0;x<8;x++)for(let z=0;z<6;z++)box(world,(x+z)%2?'#bdc69b':'#b1bd90',(x-3.5)*1.7,-.02,(z-2.5)*1.5,1.64,.13,1.44);
 for(const z of [-5.3,5.3]){box(world,'#d7c29c',0,.42,z,16,.1,.09);box(world,'#d7c29c',0,.75,z,16,.1,.09);for(let x=-7.8;x<8;x+=1.1)box(world,'#f0dcba',x,.45,z,.12,1,.12);}
 [[-7.5,-4.4],[7.5,-4.5],[-7.5,4.3],[7.5,4.4]].forEach(([x,z])=>tree(world,x,z,1.1));
 const gx=(x:number)=>(x-3.5)*1.7,gz=(z:number)=>(z-2.5)*1.5;
 for(let i=0;i<2;i++){box(world,'#a67d53',gx(i),.3,gz(0),1.25,.6,1.1);for(let j=0;j<3;j++){shape(world,'sphere',i?'#ce6f88':'#edaa58',gx(i)+(j-1)*.3,.7,gz(0),.16);};label(world,i?'BIBIT STROBERI':'BIBIT WORTEL',gx(i),1.2,gz(0),2.1);}
 const well=group(world,gx(7),0,gz(0));shape(well,'cylinder','#a7b9b1',0,.35,0,.52,.7,.52);shape(well,'cylinder','#699ca9',0,.72,0,.4,.03,.4);const rim=shape(well,'ring','#e8e0ca',0,.74,0,.49,.49,.49);rim.rotation.x=Math.PI/2;for(const x of [-.5,.5])box(well,'#977959',x,.8,0,.09,1.6,.09);for(const side of [-1,1]){const roof=box(well,'#ab8573',side*.28,1.7,0,.66,.09,1.15);roof.rotation.z=side*-.4;}label(well,'SUMUR',0,2.2,0,1.3);
 const basket=group(world,gx(7),0,gz(5));box(basket,'#715740',0,.1,0,1.2,.15,1);for(const x of [-.58,.58])for(const z of [-.48,.48])box(basket,'#d1aa75',x,.35,z,.12,.7,.12);for(let i=0;i<3;i++){const y=.2+i*.2;for(const z of [-.5,.5])box(basket,'#d5ac72',0,y,z,1.2,.13,.08);for(const x of [-.58,.58])box(basket,'#c49a64',x,y,0,.08,.13,1);}label(basket,'ANTAR PANEN',0,1.2,0,2);
 const produce=Array.from({length:12},(_,i)=>shape(basket,'sphere',i<6?'#efac65':'#d87591',-.4+(i%3)*.4,.3+Math.floor(i/6)*.22,-.25+(Math.floor(i/3)%2)*.5,.16));animate(basket,state=>produce.forEach((fruit,i)=>fruit.visible=i<6?i<state.harvest.carrot:i-6<state.harvest.berry));
 for(const [i,x] of [-7.5,7.5].entries()){addAsset(world,i?'kenney-nature/flower_redA':'kenney-nature/flower_yellowA',{x,z:1,height:.65});addAsset(world,'kaykit-resources/Wood_Log_Stack',{x,z:-2,height:.6});}
 label(world,'KEBUN KITA',0,.5,-5.8,3,'#fff9e4','#4c715a');
 const plots=g.plots.map((p:any)=>{
  const root=group(world,gx(p.x),.05,gz(p.y));box(root,'#815a43',0,.06,0,1.35,.15,1.2);for(let row=-1;row<=1;row++)box(root,'#a27a55',0,.15,row*.3,1.1,.045,.07);
  const crop=group(root);for(const x of [-.33,.33])for(const z of [-.28,.28]){shape(crop,'cone','#efad65',x,.35,z,.13,.35,.13);const leaf=shape(crop,'sphere','#83b66d',x,.6,z,.2,.1,.12);leaf.rotation.z=.5;}
  const berry=group(root);for(const x of [-.3,.3]){shape(berry,'sphere','#79a868',x,.4,0,.33,.3,.33);for(const z of [-.18,.18])shape(berry,'sphere','#d9738f',x,.48,z,.13);}
  const seed=shape(root,'sphere','#8eae6d',0,.23,0,.16,.09,.16);const wet=box(root,'#577c80',0,.16,0,1.15,.025,.95);
  const ring=shape(root,'ring','#ffe6a2',0,.18,0,.53,.53,.53,true);ring.rotation.x=Math.PI/2;return {root,crop,berry,seed,wet,ring};
 });
 animate(world,(state,t)=>plots.forEach((m:any,i:number)=>{const p=state.plots[i],growing=p.stage==='growing',ripe=p.stage==='ripe',size=ripe?1:.35+.65*Math.min(p.growth/12,1);m.crop.visible=(growing||ripe)&&p.crop!=='berry';m.berry.visible=(growing||ripe)&&p.crop==='berry';m.seed.visible=p.stage==='seed';m.wet.visible=growing;m.crop.scale.setScalar(size);m.berry.scale.setScalar(size);m.ring.visible=ripe;m.ring.scale.setScalar(.53+(reducedMotion?0:Math.sin(t*2+i)*.025));}));
 const people=g.players.map((_:any,i:number)=>{const root=group(world);const avatar=person(root,team[i]);label(root,i?'B':'A',0,1.6,0,.6,team[i]);const carry=shape(avatar,'sphere','#f0ac60',0,.65,-.38,.2);const facing=shape(world,'ring',team[i],0,.2,0,.38,.38,.38,true);facing.rotation.x=Math.PI/2;return {root,avatar,carry,facing,first:true};});
 animate(world,(state,_t,dt)=>people.forEach((m:any,i:number)=>{const p=state.players[i],x=gx(p.x),z=gz(p.y);if(m.first||reducedMotion){m.root.position.set(x,0,z);m.first=false;}else{m.root.position.x=T.MathUtils.damp(m.root.position.x,x,20,dt);m.root.position.z=T.MathUtils.damp(m.root.position.z,z,20,dt);}m.avatar.rotation.y=Math.atan2(-p.dx,-p.dy);m.carry.visible=!!p.carry;m.carry.material=material(p.carry==='berry'?'#df7897':'#f0ac60');m.facing.position.set(gx(p.x+p.dx),.2,gz(p.y+p.dy));}));
}
export function boardPosition(i:number):[number,number]{return i<5?[(i-2)*2.05,-4.1]:i<9?[4.1,(i-6)*2.05]:i<13?[(10-i)*2.05,4.1]:[-4.1,(14-i)*2.05];}
function buildCity(g:any){
 camera.position.set(0,16,14);camera.lookAt(0,0,0);box(world,'#789596',0,-.65,0,12.5,.7,12.5);box(world,'#e2d9bd',0,-.24,0,12,.16,12);
 box(world,'#7f9f8a',0,-.06,0,5.9,.14,5.9);box(world,'#dad2b7',0,.04,0,5.9,.08,.65);box(world,'#dad2b7',0,.04,0,.65,.08,5.9);
 for(const [x,z] of [[-2,-2],[2,-2],[-2,2],[2,2]])tree(world,x,z,.75);
 for(const [x,z] of [[-5.7,-5.7],[5.7,-5.7],[-5.7,5.7],[5.7,5.7]]){shape(world,'cylinder','#3e6466',x,.8,z,.035,1.6,.035);shape(world,'sphere','#ffedbc',x,1.65,z,.13,undefined,undefined,true);}
 for(const x of [-1.8,1.8]){box(world,'#b28d64',x,.3,1.5,.7,.1,.3);box(world,'#b28d64',x,.53,1.66,.7,.32,.06);for(const dx of [-.25,.25])box(world,'#4c6860',x+dx,.15,1.5,.055,.3,.25);}
 const fountain=group(world);shape(fountain,'cylinder','#ede0ba',0,.15,0,.95,.3,.95);shape(fountain,'cylinder','#8acbd6',0,.33,0,.8,.05,.8);shape(fountain,'cylinder','#ede0ba',0,.5,0,.15,.5,.15);shape(fountain,'sphere','#c1f0ec',0,.88,0,.25,.35,.25,true);
 label(world,'KOTA BERDUA',0,1.6,-.2,3.1,'#fff9e5','#355f62');
 const tiles=propertyTiles.map((tile,i)=>{
  const [x,z]=boardPosition(i),root=group(world,x,0,z),color=tile.district<0?'#c7c9b5':districts[tile.district].color;
  const slab=box(root,'#f0e5ca',0,.08,0,1.91,.2,1.91);box(root,color,0,.2,-.72,1.83,.06,.35);
  const outline=shape(root,'ring','#fff1ac',0,.23,0,.87,.87,.87,true);outline.rotation.x=Math.PI/2;
  const building=group(root,0,.22,0),body=box(building,'#c1b49a',0,.27,0,.65,.55,.6);const roof=shape(building,'cone',color,0,.72,0,.5,.4,.45);roof.rotation.y=Math.PI/4;
  // Siluet tempat mengikuti distrik: suar, kedai, kebun atap, observatorium.
  if(tile.kind==='land'){
   if(i===3){roof.visible=false;shape(building,'cylinder','#f5e5c8',0,.9,0,.22,1.3,.22);shape(building,'sphere','#ffe7a5',0,1.65,0,.22,.17,.22,true);shape(building,'cone','#de8c70',0,1.9,0,.34,.22,.34);}
   if(tile.district===1){for(let a=0;a<6;a++)box(building,a%2?'#fff0cc':'#dc937b',-.4+a*.16,.57,.48,.16,.08,.45);box(building,'#654f44',-.38,.25,.63,.045,.5,.045);box(building,'#654f44',.43,.25,.63,.045,.5,.045);}
   if(tile.district===2){roof.visible=false;box(building,'#9db484',0,.59,0,.8,.1,.75);for(const x of [-.22,.22]){shape(building,'sphere','#6d9473',x,.75,0,.22,.25,.22);shape(building,'sphere','#e9b87e',x,.89,.12,.07);}}
   if(i===15){roof.visible=false;shape(building,'sphere','#b6afcf',0,.65,0,.45,.4,.45);const telescope=shape(building,'cylinder','#e2d8c9',0,.99,-.25,.12,.65,.12);telescope.rotation.x=-.7;}
   if(i===2){box(building,'#aabac0',0,.05,.46,.95,.08,.2);box(building,'#e3b47e',-.4,.25,.5,.07,.4,.07);}
  }
  const annex=box(building,'#e5d3ad',.36,.23,.12,.35,.45,.4);const tower=box(building,color,-.18,.85,.08,.3,1.1,.3);
  for(const wx of [-.18,.18])box(building,'#fff4c7',wx,.32,.31,.12,.16,.02);
  const flag=box(root,team[0],-.7,.55,-.3,.08,.7,.08);const banner=box(root,team[0],-.53,.83,-.3,.35,.2,.04);
  if(tile.kind!=='land'){
   building.visible=false;
   if(tile.kind==='park'){tree(root,-.15,-.12,.65);box(root,'#b18a61',.34,.25,.35,.6,.1,.22);}
   else if(tile.kind==='event'){for(const x of [-.5,.5])box(root,'#967b62',x,.65,-.2,.06,1.3,.06);box(root,'#cfa478',0,1.15,-.2,1.1,.04,.04);for(let j=0;j<4;j++){const flag=shape(root,'cone',j%2?'#e7b570':'#b19cd2',-.37+j*.25,1,-.2,.12,.25,.03);flag.rotation.z=Math.PI;}}
   else{shape(root,'cylinder','#dfc18d',0,.22,-.12,.42,.15,.42);const ring=shape(root,'ring','#f6edd1',0,.33,-.12,.36,.36,.36);ring.rotation.x=Math.PI/2;}
  }
  if(tile.kind==='land'&&i!==3&&i!==15){addAsset(building,`kaykit-city/building_${'ABCDEFGH'[i%8]}`,{height:1.05,width:.9,depth:.9,fallback:building.children.filter(o=>o!==annex&&o!==tower)});}
  label(root,tile.name,0,.4,.82,1.85,'#fff9e8','#385861');return {slab,outline,building,body,annex,tower,flag,banner};
 });
 animate(world,(state,t)=>tiles.forEach((m,i)=>{const owned=state.owners[i]>=0;m.building.visible=propertyTiles[i].kind==='land';m.body.material=material(owned?team[state.owners[i]]:'#c1b49a');m.annex.visible=owned&&state.levels[i]>=1;m.tower.visible=owned&&state.levels[i]>=2;m.flag.visible=m.banner.visible=owned;if(owned){m.banner.material=material(team[state.owners[i]]);m.flag.material=material(team[state.owners[i]]);}m.outline.visible=state.players[state.turn].position===i;m.outline.scale.setScalar(.87+(reducedMotion?0:Math.sin(t*3)*.025));}));
 const tokens=g.players.map((_:any,i:number)=>{const root=group(world);contact(root,0,0,.28);const p=person(root,team[i]);p.scale.setScalar(.72);label(root,i?'B':'A',0,1.3,0,.6,team[i]);return {root,first:true};});
 animate(world,(state,t,dt)=>tokens.forEach((m,i)=>{const [x,baseZ]=boardPosition(state.players[i].position),z=baseZ+.5,tx=x+(i?.25:-.25);if(m.first||reducedMotion){m.root.position.set(tx,.2,z);m.first=false;}else{m.root.position.x=T.MathUtils.damp(m.root.position.x,tx,25,dt);m.root.position.z=T.MathUtils.damp(m.root.position.z,z,25,dt);m.root.position.y=.2+(state.stage==='moving'&&state.turn===i?Math.abs(Math.sin(t*15))*.17:0);}}));
 // Titik pada dadu memakai geometri yang sama.
 const die=group(world,1.5,.65,1.4);box(die,'#fff3d8',0,0,0,.72,.72,.72);
 const pips:T.Mesh[]=[];for(const [x,z] of [[-.2,-.2],[.2,.2],[-.2,.2],[.2,-.2],[0,0],[0,-.2],[0,.2]])pips.push(shape(die,'sphere','#375463',x,.37,z,.055,.012,.055));
 const faces=[[4],[0,1],[0,1,4],[0,1,2,3],[0,1,2,3,4],[0,1,2,3,5,6]];
 animate(world,(state,t)=>{die.rotation.set(0,0,0);if(state.stage==='rolling'&&!reducedMotion){die.rotation.x=t*11;die.rotation.z=t*8;}pips.forEach((pip,i)=>pip.visible=faces[Math.max(0,state.dice-1)].includes(i));});
}
function targetAspect(){return Math.max(.5,(canvas?.clientWidth||1280)/(canvas?.clientHeight||720));}
function buildGlass(g:any){
 const course=glassCourse(g.stage),theme=glassWorlds[course.world],forest=[1,3].includes(course.world),space=course.world>=4,sky=space?'#090f27':forest?'#bed1bd':'#c7dce8';
 scene.background=new T.Color(sky);scene.fog=new T.Fog(sky,48,155);camera=new T.PerspectiveCamera(46,targetAspect(),.1,230);
 if(keyLight){keyLight.color.set(space?'#cbd8ff':'#fff1dd');keyLight.intensity=space?2:2.6;}
 box(world,space?'#5b6984':forest?'#70875a':'#84956f',0,-7.3,-20,600,.6,600);
 const mesh=(positions:number[],color:string)=>{const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(positions,3));geo.computeVertexNormals();const object=new T.Mesh(geo,material(color));object.receiveShadow=true;object.userData.ownedGeometry=geo;world.add(object);};
 mesh(glassTerrainTriangles(course),space?'#7987a3':forest?'#78945e':'#a1ae88');mesh(glassRoadTriangles(course),space?'#8593af':forest?'#b09b77':'#4d5863');
 const batches=new Map<string,T.Matrix4[]>(),matrix=new T.Matrix4(),basisMatrix=new T.Matrix4(),v0=new T.Vector3(),v1=new T.Vector3(),v2=new T.Vector3(),quaternion=new T.Quaternion();
 function partMatrix(part:ReturnType<typeof propParts>[number]){basisMatrix.makeBasis(v0.set(part.basis[0].x,part.basis[0].y,part.basis[0].z),v1.set(part.basis[1].x,part.basis[1].y,part.basis[1].z),v2.set(part.basis[2].x,part.basis[2].y,part.basis[2].z));quaternion.setFromRotationMatrix(basisMatrix);return new T.Matrix4().compose(new T.Vector3(part.center.x,part.center.y,part.center.z),quaternion,new T.Vector3(part.half[0]*(part.geometry&&part.geometry!=='box'?1:2),part.half[1]*(part.geometry==='gem'||part.geometry==='roof'?1:2),part.half[2]*(part.geometry&&part.geometry!=='box'?1:2)));}
 const batch=(color:string,matrix:T.Matrix4)=>{if(!batches.has(color))batches.set(color,[]);batches.get(color)!.push(matrix);};
 const decor=(o:{x:number;z:number;yaw:number},x:number,y:number,z:number,w:number,h:number,d:number,color:string)=>{const objectMatrix=new T.Matrix4().makeRotationY(o.yaw);objectMatrix.setPosition(o.x+Math.cos(o.yaw)*x+Math.sin(o.yaw)*z,y,o.z-Math.sin(o.yaw)*x+Math.cos(o.yaw)*z);objectMatrix.scale(new T.Vector3(w,h,d));batch('box|'+color,objectMatrix);};
 const moving:{prop:typeof course.obstacles[number];meshes:T.Mesh[]}[]=[];
 for(const o of course.obstacles){
  const parts=propParts(course,o,g.elapsed||0);
  if(['platform','hammer','axe'].includes(o.kind)){moving.push({prop:o,meshes:parts.map(part=>{const object=new T.Mesh(geometry('box'),material(part.color));object.matrixAutoUpdate=false;object.matrix.copy(partMatrix(part));object.castShadow=object.receiveShadow=true;world.add(object);return object;})});}
  else for(const part of parts)batch((part.geometry||'box')+'|'+part.color,partMatrix(part));
  if(o.kind==='car'){
   decor(o,0,o.bottom+1.1,-1.035,1.44,.44,.018,'#b5d3dc');decor(o,0,o.bottom+1.1,1.135,1.44,.44,.018,'#b5d3dc');
   for(const side of [-1,1]){decor(o,side*.57,o.bottom+.50,-2.008,.36,.18,.015,'#d9e4ce');decor(o,side*.57,o.bottom+.50,2.008,.32,.18,.015,'#a34742');}
  }
  if(o.kind==='house'){
   for(const dx of [-1.2,0,1.2])decor(o,dx,o.bottom+1.9,-o.d/2-.008,.65,.9,.015,'#56788a');
  }
 }
 // Marka dan trotoar mengikuti kurva, tidak membentuk lorong lurus baru.
 if(!forest&&!space)for(let s=-23;s<course.route.length+23;s+=3){const p=routePoint(course.route,s);if(!staticFloorAt(course,p.x,p.z))continue;decor(p,0,groundHeight(course,p.x,p.z)+.035,0,.11,.02,1.2,'#e4d5a5');}
 for(const [key,matrices] of batches){const [kind,color]=key.split('|');const object=new T.InstancedMesh(geometry(kind),material(color),matrices.length);matrices.forEach((m,i)=>object.setMatrixAt(i,m));object.castShadow=object.receiveShadow=true;world.add(object);}
 const pads=course.checkpoints.map((s,i)=>{const p=routePoint(course.route,s),ring=shape(world,'ring','#ddc783',p.x,groundHeight(course,p.x,p.z)+.055,p.z,1.65,1.65,1.65,true);ring.rotation.x=Math.PI/2;return ring;});
 if(space){
  const stars=new T.InstancedMesh(geometry('sphere'),material('#c5d8ff',true),110);for(let i=0;i<110;i++){matrix.makeScale(.05,.05,.05);matrix.setPosition(Math.sin(i*12.3)*110,12+i%35,-80+Math.cos(i*4.1)*100);stars.setMatrixAt(i,matrix);}world.add(stars);
  shape(world,'sphere','#6c79b1',-45,24,-95,16,16,16);
 }else for(let i=0;i<9;i++){const p=course.route.points[Math.floor((i+1)*course.route.points.length/10)],x=i%2?course.route.bounds.maxX+14:course.route.bounds.minX-14,hill=shape(world,'sphere','#7d9870',x,-7,p.z,14,9+i%3,18);hill.castShadow=false;}
 const frame=group(world),pane=shape(frame,'box','#bbdfe4',0,0,0,2.4,1.2,.055),glassMaterial=new T.MeshStandardMaterial({color:'#c2e7ed',transparent:true,opacity:.36,roughness:.12,metalness:.14,depthWrite:false,side:T.DoubleSide});pane.material=glassMaterial;pane.userData.ownedMaterial=glassMaterial;
 for(const segment of GLASS_SOLID_SEGMENTS.slice(1))box(frame,segment.v>0?'#b9a3e0':'#d4eee7',segment.u,segment.v,0,segment.w,segment.h,segment.d);
 const people=g.players.map((_:any,i:number)=>createSoftCarrier(world,team[i]));
 const shards=Array.from({length:10},()=>{const shard=shape(world,'gem','#c6e4e9',0,0,0,.14,.07,.12);shard.castShadow=false;shard.visible=false;return shard;});
 animate(world,(state,t,dt)=>{
  frame.visible=state.recoveryKind!=='collision'||state.retryTime<=0;shards.forEach((shard,i)=>{const age=1.1-state.retryTime;shard.visible=state.recoveryKind==='collision'&&state.retryTime>0;shard.position.set(state.pane.x+Math.cos(i*2.4)*age*.8,state.pane.y+Math.sin(i)*age*.5-age*age*2,state.pane.z+Math.sin(i*2.4)*age*.8);shard.rotation.set(i+age*3,i*.7+age,i*.4);});frame.position.set(state.pane.x,state.pane.y,state.pane.z);const basis=glassBasis(state);basisMatrix.makeBasis(v0.set(basis[0].x,basis[0].y,basis[0].z),v1.set(basis[1].x,basis[1].y,basis[1].z),v2.set(basis[2].x,basis[2].y,basis[2].z));frame.quaternion.setFromRotationMatrix(basisMatrix);
  people.forEach((model,i)=>model.update(state,i,t,dt,reducedMotion));pads.forEach((ring,i)=>ring.material=material(state.checkpoint>i?'#a9cdae':'#ddc783',true));
  for(const item of moving){const parts=propParts(course,item.prop,state.elapsed);parts.forEach((part,i)=>item.meshes[i].matrix.copy(partMatrix(part)));}
  const view=state.camera;if(view){camera.position.set(view.x,view.y,view.z);camera.lookAt(view.targetX,view.targetY,view.targetZ);}
  if(keyLight){keyLight.position.set(state.pane.x-9,state.pane.y+16,state.pane.z+7);keyLight.target.position.set(state.pane.x,state.pane.y,state.pane.z);}
 });
}
function buildQuiz(){
 box(world,'#a2b3ac',0,-.4,0,17,.5,10);shape(world,'cylinder','#e0cdb2',0,-.05,0,7.5,.3,3.8);
 for(const [i,x] of [-6,6].entries()){const p=person(world,team[i]);p.position.set(x,0,0);p.scale.setScalar(1.8);label(world,i?'B':'A',x,2.8,0,1,team[i]);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const gem=shape(world,'gem',i%2?'#e9b4ac':'#d9e5b4',Math.cos(a)*5,.6,Math.sin(a)*3,.2);animate(gem,(_g,t)=>{gem.rotation.y=reducedMotion?0:t*.3;});}
}
export function draw3D(target:HTMLCanvasElement,g:any,time:number,options:{instance?:string;reduced?:boolean}={}){
 if(failedCanvas===target)return;
 try{
  if(canvas!==target||!renderer)setup(target);
  reducedMotion=!!options.reduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const next=(options.instance||`${g.id}:${g.seed}:${g.level}`)+(g.id==='glass'?`:${g.stage}`:'');if(identity!==next){build(g);identity=next;visualTime=0;}
  const dt=Math.min(.05,Math.max(.001,time-lastTime));lastTime=time;if(!reducedMotion)visualTime+=dt;
  const width=Math.max(1,target.clientWidth),height=Math.max(1,target.clientHeight);
  if(width!==lastWidth||height!==lastHeight){renderer!.setSize(width,height,false);const aspect=width/height;if(camera instanceof T.PerspectiveCamera){camera.aspect=aspect;}else{const halfHeight=Math.max(6.4,10.3/aspect);const offset=g.id==='property'?2.7:0;camera.left=-halfHeight*aspect+offset;camera.right=halfHeight*aspect+offset;camera.top=halfHeight;camera.bottom=-halfHeight;}camera.updateProjectionMatrix();lastWidth=width;lastHeight=height;}
  for(const item of animated)item.update(g,visualTime,dt);
  renderer!.render(scene,camera);
  const assets=assetStats();target.dataset.assetLoaded=String(assets.loaded);target.dataset.assetPending=String(assets.pending);target.dataset.assetFailed=String(assets.failed);target.dataset.assetCached=String(assets.cached);
  target.dataset.geometries=String(renderer!.info.memory.geometries);target.dataset.textures=String(renderer!.info.memory.textures);target.dataset.worldTextLabels=String(worldLabels);target.dataset.drawCalls=String(renderer!.info.render.calls);
 }catch{failedCanvas=target;target.dataset.renderError='Tampilan 3D tidak tersedia';const note=document.createElement('div');note.className='render-error';note.textContent='Tampilan 3D tidak tersedia. Aktifkan akselerasi grafis/WebGL pada browser laptop lalu muat ulang. Controller dan sesi tetap tersambung.';target.parentElement?.append(note);}
}
export function release3D(){disposeWorld();renderer?.dispose();renderer?.forceContextLoss();renderer=undefined;canvas=null;identity='';failedCanvas=null;}
