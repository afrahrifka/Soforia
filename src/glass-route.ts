/** Lintasan dunia orisinal, disampling berdasarkan panjang busur. Tidak bergantung pada render. */
export type RoutePoint={x:number;y:number;z:number;s:number;yaw:number};
export type Route={points:RoutePoint[];length:number;width:number;bounds:{minX:number;maxX:number;minZ:number;maxZ:number}};
const layouts=[
 [[0,6],[0,-12],[12,-25],[31,-25],[44,-12],[50,-29],[35,-47],[12,-53]],
 [[0,6],[0,-12],[-17,-27],[-36,-16],[-37,8],[-17,22],[8,12],[22,-10]],
 [[0,6],[0,-13],[16,-28],[38,-26],[52,-6],[42,16],[19,22],[12,5]],
 [[0,6],[0,-12],[-14,-25],[-32,-24],[-47,-41],[-32,-58],[-9,-54],[9,-35]]
];
function cubic(a:number,b:number,c:number,d:number,t:number){return .5*((2*b)+(-a+c)*t+(2*a-5*b+4*c-d)*t*t+(-a+3*b-3*c+d)*t*t*t);}
export function createGlassRoute(stage:number):Route{
 const shape=layouts[stage%layouts.length].map((p,i)=>[p[0]+(i>1?Math.sin(stage*.8+i)*(stage%3)*.5:0),p[1]+(i>1?Math.cos(stage*.7+i)*(stage%10)*.12:0)]),mirror=stage%8>=4?-1:1,scale=1+(Math.floor(stage/10)*.025),raw:{x:number;y:number;z:number}[]=[];
 for(let segment=0;segment<shape.length-1;segment++)for(let i=0;i<32;i++){
  const t=i/32,a=shape[Math.max(0,segment-1)],b=shape[segment],c=shape[segment+1],d=shape[Math.min(shape.length-1,segment+2)];
  const progress=(segment+t)/(shape.length-1),rise=Math.floor(stage/10)>=2?5:2.2;
  raw.push({x:cubic(a[0],b[0],c[0],d[0],t)*mirror*scale,z:cubic(a[1],b[1],c[1],d[1],t)*scale,y:progress*rise});
 }
 const last=shape.at(-1)!;raw.push({x:last[0]*mirror*scale,z:last[1]*scale,y:Math.floor(stage/10)>=2?5:2.2});
 const points:RoutePoint[]=[];let s=0;for(let i=0;i<raw.length;i++){
  if(i)s+=Math.hypot(raw[i].x-raw[i-1].x,raw[i].z-raw[i-1].z);
  const a=raw[Math.max(0,i-1)],b=raw[Math.min(raw.length-1,i+1)];points.push({...raw[i],s,yaw:Math.atan2(-(b.x-a.x),-(b.z-a.z))});
 }
 return {points,length:s,width:9.6,bounds:{minX:Math.min(...raw.map(p=>p.x))-32,maxX:Math.max(...raw.map(p=>p.x))+32,minZ:Math.min(...raw.map(p=>p.z))-32,maxZ:Math.max(...raw.map(p=>p.z))+32}};
}
export function routePoint(route:Route,s:number,lateral=0):RoutePoint{
 if(s<0||s>route.length){const p=s<0?route.points[0]:route.points.at(-1)!,distance=s-p.s;return {...p,x:p.x-Math.sin(p.yaw)*distance,z:p.z-Math.cos(p.yaw)*distance,s};}
 let low=0,high=route.points.length-1;
 while(low+1<high){const mid=(low+high)>>1;if(route.points[mid].s<s)low=mid;else high=mid;}
 const a=route.points[low],b=route.points[high],t=(s-a.s)/Math.max(.00001,b.s-a.s),yaw=a.yaw+Math.atan2(Math.sin(b.yaw-a.yaw),Math.cos(b.yaw-a.yaw))*t;
 return {x:a.x+(b.x-a.x)*t+Math.cos(yaw)*lateral,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t-Math.sin(yaw)*lateral,s,yaw};
}
export function routeProject(route:Route,x:number,z:number){
 let best={s:0,lateral:0,distance:Infinity,x:route.points[0].x,z:route.points[0].z,y:route.points[0].y,yaw:0};
 for(let i=0;i<route.points.length-1;i++){
  const a=route.points[i],b=route.points[i+1],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1))),px=a.x+dx*t,pz=a.z+dz*t,distance=Math.hypot(x-px,z-pz);
  if(distance<best.distance){const yaw=Math.atan2(-dx,-dz);best={s:a.s+(b.s-a.s)*t,lateral:(x-px)*Math.cos(yaw)-(z-pz)*Math.sin(yaw),distance,x:px,z:pz,y:a.y+(b.y-a.y)*t,yaw};}
 }
 return best;
}
export function terrainHeight(route:Route,x:number,z:number){
 const near=routeProject(route,x,z),shoulder=Math.max(0,Math.min(1,(near.distance-6)/12));
 return near.y+shoulder*(Math.sin(x*.16)*Math.cos(z*.11)*.45-.08);
}
export function routeControls(yaw:number,x:number,y:number){return {x:Math.cos(yaw)*x+Math.sin(yaw)*y,z:-Math.sin(yaw)*x+Math.cos(yaw)*y};}
