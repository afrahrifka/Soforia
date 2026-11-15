export type Vec3={x:number;y:number;z:number};
const dot=(a:Vec3,b:Vec3)=>a.x*b.x+a.y*b.y+a.z*b.z;
const cross=(a:Vec3,b:Vec3)=>({x:a.y*b.z-a.z*b.y,y:a.z*b.x-a.x*b.z,z:a.x*b.y-a.y*b.x});
/** SAT kotak berorientasi vs kotak dunia; sumbu silang mencegah sudut kaca menembus. */
export const WORLD_BASIS=[{x:1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:0,z:1}];
export function obbOverlap(center:Vec3,basis:Vec3[],half:number[],other:Vec3,otherBasis:Vec3[],size:number[]){
 const delta={x:other.x-center.x,y:other.y-center.y,z:other.z-center.z};
 for(const axis of [...basis,...otherBasis,...basis.flatMap(a=>otherBasis.map(b=>cross(a,b)))]){
  if(dot(axis,axis)<1e-12)continue;
  const radius=half.reduce((sum,h,i)=>sum+h*Math.abs(dot(basis[i],axis)),0)+size.reduce((sum,h,i)=>sum+h*Math.abs(dot(otherBasis[i],axis)),0);
  if(Math.abs(dot(delta,axis))>radius+1e-8)return false;
 }
 return true;
}
export function boxOverlap(center:Vec3,basis:Vec3[],half:number[],other:Vec3,size:number[]){return obbOverlap(center,basis,half,other,WORLD_BASIS,size);}
export function yawBasis(yaw:number){return [{x:Math.cos(yaw),y:0,z:-Math.sin(yaw)},{x:0,y:1,z:0},{x:Math.sin(yaw),y:0,z:Math.cos(yaw)}];}
export const GLASS_BODY_RADIUS=.34;
/** Langkah kecil dan slide per sumbu, juga dipakai oleh tarikan lengan dan dorongan badan. */
export function moveGlassBody(p:any,dx:number,dz:number,blocked:(p:any)=>boolean){
 const steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
 for(let i=0;i<steps;i++){
  const x=p.x;p.x+=dx/steps;if(blocked(p))p.x=x;
  const z=p.z;p.z+=dz/steps;if(blocked(p))p.z=z;
 }
}

export type SolidShape='cone'|'gem'|'roof';
export function solidProfile(shape:SolidShape){
 const vertices:Vec3[]=shape==='cone'?Array.from({length:8},(_,i)=>({x:Math.sin(i*Math.PI/4),y:-1,z:Math.cos(i*Math.PI/4)})).concat([{x:0,y:1,z:0}]):shape==='roof'?[{x:-1,y:-1,z:-1},{x:1,y:-1,z:-1},{x:0,y:1,z:-1},{x:-1,y:-1,z:1},{x:1,y:-1,z:1},{x:0,y:1,z:1}]:[{x:1,y:0,z:0},{x:-1,y:0,z:0},{x:0,y:1,z:0},{x:0,y:-1,z:0},{x:0,y:0,z:1},{x:0,y:0,z:-1}];
 const edges:number[][]=[],faces:number[][]=[];
 if(shape==='cone'){for(let i=0;i<8;i++){edges.push([i,(i+1)%8],[i,8]);faces.push([i,(i+1)%8,8]);}faces.push([0,1,2,3,4,5,6,7]);}
 else if(shape==='roof'){faces.push([0,2,1],[3,4,5],[0,3,5,2],[1,2,5,4],[0,1,4,3]);edges.push([0,1],[1,2],[2,0],[3,4],[4,5],[5,3],[0,3],[1,4],[2,5]);}
 else {for(const x of [0,1])for(const y of [2,3])for(const z of [4,5])faces.push([x,y,z]);for(let i=0;i<6;i++)for(let j=i+1;j<6;j++)if(Math.floor(i/2)!==Math.floor(j/2))edges.push([i,j]);}
 return {vertices,edges,faces};
}
/** SAT memakai bidang geometri yang sama, tidak menganggap ruang kosong kotak sebagai benda. */
export function obbHullOverlap(center:Vec3,basis:Vec3[],half:number[],other:Vec3,axes:Vec3[],size:number[],shape:SolidShape){
 const {vertices,edges,faces}=solidProfile(shape),points=vertices.map(p=>({x:other.x+axes[0].x*p.x*size[0]+axes[1].x*p.y*size[1]+axes[2].x*p.z*size[2],y:other.y+axes[0].y*p.x*size[0]+axes[1].y*p.y*size[1]+axes[2].y*p.z*size[2],z:other.z+axes[0].z*p.x*size[0]+axes[1].z*p.y*size[1]+axes[2].z*p.z*size[2]}));
 const delta=(a:Vec3,b:Vec3)=>({x:a.x-b.x,y:a.y-b.y,z:a.z-b.z}),edgeVectors=edges.map(([a,b])=>delta(points[b],points[a])),normals=faces.map(([a,b,c])=>cross(delta(points[b],points[a]),delta(points[c],points[a])));
 for(const axis of [...basis,...normals,...basis.flatMap(a=>edgeVectors.map(b=>cross(a,b)))]){if(dot(axis,axis)<1e-12)continue;const middle=dot(center,axis),radius=half.reduce((sum,h,i)=>sum+h*Math.abs(dot(basis[i],axis)),0),projections=points.map(p=>dot(p,axis));if(middle+radius<Math.min(...projections)-1e-8||middle-radius>Math.max(...projections)+1e-8)return false;}
 return true;
}
