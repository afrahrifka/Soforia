import {routePoint} from './glass-route.ts';
import {groundHeight,type GlassCourse} from './glass-world.ts';
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
 const out:number[]=[],points=[routePoint(course.route,-25),...course.route.points,routePoint(course.route,course.route.length+25)],half=course.route.width/2;
 const edge=(p:typeof points[number],side:number)=>{const x=p.x+Math.cos(p.yaw)*half*side,z=p.z-Math.sin(p.yaw)*half*side;return {x,y:groundHeight(course,x,z)+.018,z};};
 for(let i=0;i<points.length-1;i++){
  let polys=[[edge(points[i],-1),edge(points[i],1),edge(points[i+1],-1)],[edge(points[i],1),edge(points[i+1],1),edge(points[i+1],-1)]];
  for(const gap of course.gaps)polys=polys.flatMap(poly=>subtractHole(poly,gap));for(const poly of polys)for(let j=1;j<poly.length-1;j++)for(const p of [poly[0],poly[j],poly[j+1]])out.push(p.x,p.y,p.z);
 }
 return out;
}
