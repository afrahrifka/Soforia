import type {SceneKit} from '../../shared/game-contracts.ts';
import * as T from 'three';
import {addAsset,assetChoices} from '../../shared/renderer/assets3d.ts';
export function buildConsole(g:any,kit:SceneKit){
 const {world,scene,keyLight,team,box,shape,group,label,animate,contact,tree,person,material,geometry,targetAspect}=kit;

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
 animate(world,(state,t)=>plots.forEach((m:any,i:number)=>{const p=state.plots[i],growing=p.stage==='growing',ripe=p.stage==='ripe',size=ripe?1:.35+.65*Math.min(p.growth/12,1);m.crop.visible=(growing||ripe)&&p.crop!=='berry';m.berry.visible=(growing||ripe)&&p.crop==='berry';m.seed.visible=p.stage==='seed';m.wet.visible=growing;m.crop.scale.setScalar(size);m.berry.scale.setScalar(size);m.ring.visible=ripe;m.ring.scale.setScalar(.53+(kit.reducedMotion?0:Math.sin(t*2+i)*.025));}));
 const people=g.players.map((_:any,i:number)=>{const root=group(world);const avatar=person(root,team[i]);label(root,i?'B':'A',0,1.6,0,.6,team[i]);const carry=shape(avatar,'sphere','#f0ac60',0,.65,-.38,.2);const facing=shape(world,'ring',team[i],0,.2,0,.38,.38,.38,true);facing.rotation.x=Math.PI/2;return {root,avatar,carry,facing,first:true};});
 animate(world,(state,_t,dt)=>people.forEach((m:any,i:number)=>{const p=state.players[i],x=gx(p.x),z=gz(p.y);if(m.first||kit.reducedMotion){m.root.position.set(x,0,z);m.first=false;}else{m.root.position.x=T.MathUtils.damp(m.root.position.x,x,20,dt);m.root.position.z=T.MathUtils.damp(m.root.position.z,z,20,dt);}m.avatar.rotation.y=Math.atan2(-p.dx,-p.dy);m.carry.visible=!!p.carry;m.carry.material=material(p.carry==='berry'?'#df7897':'#f0ac60');m.facing.position.set(gx(p.x+p.dx),.2,gz(p.y+p.dy));}));
}
