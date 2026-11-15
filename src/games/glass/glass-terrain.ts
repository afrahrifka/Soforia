import {routePoint} from './glass-route.ts';
import {groundHeight,corridorHalfWidth,type GlassCourse} from './glass-world.ts';
import type {Vec3} from './glass-collision.ts';
function split(poly:Vec3[],distance:(p:Vec3)=>number){
 const positive:Vec3[]=[],negative:Vec3[]=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=distance(a),db=distance(b);(da>=0?positive:negative).push(a);if(da*db<0){const t=da/(da-db),p={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};positive.push(p);negative.push(p);}}return {positive,negative};
}
function subtractHole(poly:Vec3[],g:{x:number;z:number;yaw:number;w:number;d:number}){
 let inside=[poly];const outside:Vec3[][]=[],c=Math.cos(g.yaw),s=Math.sin(g.yaw),u=(p:Vec3)=>c*(p.x-g.x)-s*(p.z-g.z),v=(p:Vec3)=>s*(p.x-g.x)+c*(p.z-g.z);
 for(const edge of [(p:Vec3)=>g.w/2-u(p),(p:Vec3)=>g.w/2+u(p),(p:Vec3)=>g.d/2-v(p),(p:Vec3)=>g.d/2+v(p)]){const next:Vec3[][]=[];for(const p of inside){const halves=split(p,edge);if(halves.negative.length>=3)outside.push(halves.negative);if(halves.positive.length>=3)next.push(halves.positive);}inside=next;}return outside;
}
export function glassTerrainTriangles(course:GlassCourse){
 const out:number[]=[],t=course.terrain;
 for(let z=0;z<t.rows-1;z++)for(let x=0;x<t.columns-1;x++){
  const point=(i:number,j:number)=>({x:t.x+i*t.step,y:t.heights[j*t.columns+i],z:t.z+j*t.step}),a=point(x,z),b=point(x+1,z),c=point(x,z+1),d=point(x+1,z+1);
  let polys=[[a,c,b],[b,c,d]];for(const gap of course.gaps)polys=polys.flatMap(poly=>subtractHole(poly,gap));
  for(const poly of polys)for(let i=1;i<poly.length-1;i++)for(const p of [poly[0],poly[i],poly[i+1]])out.push(p.x,p.y,p.z);
 }
 return out;
}
export function glassRoadTriangles(course:GlassCourse){
 const out:number[]=[],points=course.route.points;
 const edge=(p:typeof points[number],side:number)=>{const half=corridorHalfWidth(course,p.s),x=p.x+Math.cos(p.yaw)*half*side,z=p.z-Math.sin(p.yaw)*half*side;return {x,y:groundHeight(course,x,z)+.018,z};};
 for(let i=0;i<points.length-1;i++){
  let polys=[[edge(points[i],-1),edge(points[i],1),edge(points[i+1],-1)],[edge(points[i],1),edge(points[i+1],1),edge(points[i+1],-1)]];
  for(const gap of course.gaps)polys=polys.flatMap(poly=>subtractHole(poly,gap));for(const poly of polys)for(let j=1;j<poly.length-1;j++)for(const p of [poly[0],poly[j],poly[j+1]])out.push(p.x,p.y,p.z);
 }
 return out;
}

/** Dinding tanah tepi jurang mengikuti footprint lubang yang juga dipakai collision. */
export function glassPitTriangles(course:GlassCourse){const out:number[]=[];for(const gap of course.gaps){const corners=[[-gap.w/2,-gap.d/2],[-gap.w/2,gap.d/2],[gap.w/2,gap.d/2],[gap.w/2,-gap.d/2]];for(let edge=0;edge<4;edge++){const a=corners[edge],b=corners[(edge+1)%4],n=Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1]));for(let i=0;i<n;i++){const point=(t:number)=>{const u=a[0]+(b[0]-a[0])*t,v=a[1]+(b[1]-a[1])*t,x=gap.x+Math.cos(gap.yaw)*u+Math.sin(gap.yaw)*v,z=gap.z-Math.sin(gap.yaw)*u+Math.cos(gap.yaw)*v;return {x,y:groundHeight(course,x,z),z};},p=point(i/n),q=point((i+1)/n),lowP={...p,y:gap.bottom},lowQ={...q,y:gap.bottom};for(const v of [p,q,lowP,q,lowQ,lowP])out.push(v.x,v.y,v.z);}}}return out;}
