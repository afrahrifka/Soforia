import type {SceneKit} from '../../shared/game-contracts.ts';
import * as T from 'three';
import {addAsset,assetChoices} from '../../shared/renderer/assets3d.ts';
export function buildConsole(g:any,kit:SceneKit){
 const {world,scene,keyLight,team,box,shape,group,label,animate,contact,tree,person,material,geometry,targetAspect}=kit;

 box(world,'#a2b3ac',0,-.4,0,17,.5,10);shape(world,'cylinder','#e0cdb2',0,-.05,0,7.5,.3,3.8);
 for(const [i,x] of [-6,6].entries()){const p=person(world,team[i]);p.position.set(x,0,0);p.scale.setScalar(1.8);label(world,i?'B':'A',x,2.8,0,1,team[i]);}
 for(let i=0;i<8;i++){const a=i*Math.PI/4;const gem=shape(world,'gem',i%2?'#e9b4ac':'#d9e5b4',Math.cos(a)*5,.6,Math.sin(a)*3,.2);animate(gem,(_g,t)=>{gem.rotation.y=kit.reducedMotion?0:t*.3;});}
}
