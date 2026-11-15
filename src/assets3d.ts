import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {modelCatalog} from './asset-catalog.ts';
type Cached={promise:Promise<T.Group>;source?:T.Group;refs:number;used:number};
const loader=new GLTFLoader(),cache=new Map<string,Cached>();
let pending=0,failed=0,loaded=0,clock=0;const usedModels=new Set<string>();
export const assetEvidence=()=>({modelIds:[...usedModels].sort(),cached:cache.size});
export const assetStats=()=>({pending,failed,loaded,cached:cache.size});
export function assetChoices(pack:string,pattern:RegExp){return Object.keys(modelCatalog).filter(id=>id.startsWith(pack+'/')&&pattern.test(id.split('/')[1]));}
function releaseTemplate(root:T.Group){const geometries=new Set<T.BufferGeometry>(),materials=new Set<T.Material>(),textures=new Set<T.Texture>();root.traverse(o=>{if(o instanceof T.Mesh){geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.add(m);for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);}}});geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());}
function trim(){for(const [key,item] of [...cache.entries()].sort((a,b)=>a[1].used-b[1].used)){if(cache.size<=64)break;if(item.refs===0&&item.source){releaseTemplate(item.source);cache.delete(key);}}}
function load(id:string){
 let item=cache.get(id);if(item)return item;
 const url=modelCatalog[id];if(!url)throw Error(`Model tidak terdaftar: ${id}`);
 pending++;const entry:Cached={refs:0,used:++clock,promise:null!};cache.set(id,entry);
 entry.promise=loader.loadAsync(url).then(gltf=>{const root=new T.Group(),bounds=new T.Box3().setFromObject(gltf.scene),size=bounds.getSize(new T.Vector3()),center=bounds.getCenter(new T.Vector3()),scale=1/Math.max(size.y,.001);gltf.scene.position.set(-center.x,-bounds.min.y,-center.z);root.add(gltf.scene);root.scale.setScalar(scale);root.updateMatrixWorld(true);root.traverse(o=>{if(o instanceof T.Mesh){o.castShadow=true;o.receiveShadow=true;for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial){const metal=/metal|iron|copper|gold|silver|parts_cog/i.test(id);m.metalness=Math.min(m.metalness,metal?.45:.03);m.roughness=Math.max(m.roughness,.55);}}});entry.source=root;pending--;loaded++;usedModels.add(id);trim();return root;}).catch(error=>{pending--;failed++;throw error;});
 return entry;
}
export function addAsset(parent:T.Object3D,id:string,options:{x?:number;y?:number;z?:number;height?:number;width?:number;depth?:number;maxFootprint?:number;yaw?:number;fallback?:T.Object3D[]}={}){
 const root=new T.Group();root.position.set(options.x||0,options.y||0,options.z||0);root.rotation.y=options.yaw||0;root.userData.assetId=id;parent.add(root);
 const item=load(id);item.refs++;item.used=++clock;let active=true;root.userData.releaseAsset=()=>{if(active){active=false;item.refs--;item.used=++clock;trim();}};
 item.promise.then(source=>{if(!active)return;const model=source.clone(true);const bounds=new T.Box3().setFromObject(model),size=bounds.getSize(new T.Vector3());let height=options.height??1;if(options.maxFootprint)height=Math.min(height,options.maxFootprint/Math.max(size.x,size.z,.001));model.scale.multiply(new T.Vector3(options.width!==undefined?options.width/Math.max(size.x,.001):height,height,options.depth!==undefined?options.depth/Math.max(size.z,.001):height));root.add(model);root.userData.assetReady=true;options.fallback?.forEach(o=>o.visible=false);}).catch(()=>{root.userData.assetFailed=true;});
 return root;
}
export function releaseAssetInstances(root:T.Object3D){root.traverse(o=>{if(typeof o.userData.releaseAsset==='function')o.userData.releaseAsset();});}
