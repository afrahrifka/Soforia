import {solidProfile} from '../shared/math/collision.ts';
import {forestChoices} from '../shared/renderer/scene-assets.ts';
import {addAsset,assetStats,releaseAssetInstances} from '../shared/renderer/assets3d.ts';
import {gameClient} from './client-registry.ts';
import * as T from 'three';
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
 disposeWorld();worldLabels=0;lastWidth=0;lastHeight=0;scene=new T.Scene();world=new T.Group();scene.add(world);const environment=gameClient(g.id).environment||{},space=!!environment.space;scene.background=new T.Color(environment.background||'#bfd1d3');scene.fog=new T.Fog(scene.background,28,65);
 camera=new T.OrthographicCamera(-11,11,6.2,-6.2,.1,90);camera.position.set(0,17,space?12:15);camera.lookAt(0,0,0);
 scene.add(new T.HemisphereLight(space?0xbfdfff:0xfff6dc,space?0x18203b:0x698c83,2.3));const sun=new T.DirectionalLight(0xffe5c5,3);sun.position.set(-7,15,7);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-13;sun.shadow.camera.right=13;sun.shadow.camera.top=12;sun.shadow.camera.bottom=-12;sun.shadow.normalBias=.04;keyLight=sun;scene.add(sun,sun.target);
 gameClient(g.id).buildConsole(g,sceneKit);
}




function targetAspect(){return Math.max(.5,(canvas?.clientWidth||1280)/(canvas?.clientHeight||720));}


export function draw3D(target:HTMLCanvasElement,g:any,time:number,options:{instance?:string;reduced?:boolean}={}){
 if(failedCanvas===target)return;
 try{
  if(canvas!==target||!renderer)setup(target);
  reducedMotion=!!options.reduced||window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const next=(options.instance||`${g.id}:${g.seed}:${g.level}`)+(gameClient(g.id).sceneKey?.(g)??'');if(identity!==next){build(g);identity=next;visualTime=0;}
  const dt=Math.min(.05,Math.max(.001,time-lastTime));lastTime=time;if(!reducedMotion)visualTime+=dt;
  const width=Math.max(1,target.clientWidth),height=Math.max(1,target.clientHeight);
  if(width!==lastWidth||height!==lastHeight){renderer!.setSize(width,height,false);const aspect=width/height;if(camera instanceof T.PerspectiveCamera){camera.aspect=aspect;}else{const halfHeight=Math.max(6.4,10.3/aspect);const offset=gameClient(g.id).cameraOffset||0;camera.left=-halfHeight*aspect+offset;camera.right=halfHeight*aspect+offset;camera.top=halfHeight;camera.bottom=-halfHeight;}camera.updateProjectionMatrix();lastWidth=width;lastHeight=height;}
  for(const item of animated)item.update(g,visualTime,dt);
  renderer!.render(scene,camera);
  const assets=assetStats();target.dataset.assetLoaded=String(assets.loaded);target.dataset.assetPending=String(assets.pending);target.dataset.assetFailed=String(assets.failed);target.dataset.assetCached=String(assets.cached);
  target.dataset.geometries=String(renderer!.info.memory.geometries);target.dataset.textures=String(renderer!.info.memory.textures);target.dataset.worldTextLabels=String(worldLabels);target.dataset.drawCalls=String(renderer!.info.render.calls);
 }catch{failedCanvas=target;target.dataset.renderError='Tampilan 3D tidak tersedia';const note=document.createElement('div');note.className='render-error';note.textContent='Tampilan 3D tidak tersedia. Aktifkan akselerasi grafis/WebGL pada browser laptop lalu muat ulang. Controller dan sesi tetap tersambung.';target.parentElement?.append(note);}
}
export function release3D(){disposeWorld();renderer?.dispose();renderer?.forceContextLoss();renderer=undefined;canvas=null;identity='';failedCanvas=null;}

const sceneKit:any={get world(){return world;},get scene(){return scene;},get camera(){return camera;},set camera(value:any){camera=value;},get keyLight(){return keyLight;},get reducedMotion(){return reducedMotion;},team,box,shape,group,label,animate,contact,tree,person,material,geometry,targetAspect};
