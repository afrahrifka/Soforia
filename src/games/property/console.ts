import type {SceneKit} from '../../shared/game-contracts.ts';
import * as T from 'three';
import {addAsset,assetChoices} from '../../shared/renderer/assets3d.ts';
import {districts,propertyTiles} from './property.ts';
export function boardPosition(i:number):[number,number]{return i<5?[(i-2)*2.05,-4.1]:i<9?[4.1,(i-6)*2.05]:i<13?[(10-i)*2.05,4.1]:[-4.1,(14-i)*2.05];}
export function buildConsole(g:any,kit:SceneKit){
 const {world,scene,keyLight,team,box,shape,group,label,animate,contact,tree,person,material,geometry,targetAspect}=kit;

 kit.camera.position.set(0,16,14);kit.camera.lookAt(0,0,0);box(world,'#789596',0,-.65,0,12.5,.7,12.5);box(world,'#e2d9bd',0,-.24,0,12,.16,12);
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
 animate(world,(state,t)=>tiles.forEach((m,i)=>{const owned=state.owners[i]>=0;m.building.visible=propertyTiles[i].kind==='land';m.body.material=material(owned?team[state.owners[i]]:'#c1b49a');m.annex.visible=owned&&state.levels[i]>=1;m.tower.visible=owned&&state.levels[i]>=2;m.flag.visible=m.banner.visible=owned;if(owned){m.banner.material=material(team[state.owners[i]]);m.flag.material=material(team[state.owners[i]]);}m.outline.visible=state.players[state.turn].position===i;m.outline.scale.setScalar(.87+(kit.reducedMotion?0:Math.sin(t*3)*.025));}));
 const tokens=g.players.map((_:any,i:number)=>{const root=group(world);contact(root,0,0,.28);const p=person(root,team[i]);p.scale.setScalar(.72);label(root,i?'B':'A',0,1.3,0,.6,team[i]);return {root,first:true};});
 animate(world,(state,t,dt)=>tokens.forEach((m,i)=>{const [x,baseZ]=boardPosition(state.players[i].position),z=baseZ+.5,tx=x+(i?.25:-.25);if(m.first||kit.reducedMotion){m.root.position.set(tx,.2,z);m.first=false;}else{m.root.position.x=T.MathUtils.damp(m.root.position.x,tx,25,dt);m.root.position.z=T.MathUtils.damp(m.root.position.z,z,25,dt);m.root.position.y=.2+(state.stage==='moving'&&state.turn===i?Math.abs(Math.sin(t*15))*.17:0);}}));
 // Titik pada dadu memakai geometri yang sama.
 const die=group(world,1.5,.65,1.4);box(die,'#fff3d8',0,0,0,.72,.72,.72);
 const pips:T.Mesh[]=[];for(const [x,z] of [[-.2,-.2],[.2,.2],[-.2,.2],[.2,-.2],[0,0],[0,-.2],[0,.2]])pips.push(shape(die,'sphere','#375463',x,.37,z,.055,.012,.055));
 const faces=[[4],[0,1],[0,1,4],[0,1,2,3],[0,1,2,3,4],[0,1,2,3,5,6]];
 animate(world,(state,t)=>{die.rotation.set(0,0,0);if(state.stage==='rolling'&&!kit.reducedMotion){die.rotation.x=t*11;die.rotation.z=t*8;}pips.forEach((pip,i)=>pip.visible=faces[Math.max(0,state.dice-1)].includes(i));});
}
