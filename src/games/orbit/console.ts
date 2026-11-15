import type {SceneKit} from '../../shared/game-contracts.ts';
import * as T from 'three';
import {addAsset,assetChoices} from '../../shared/renderer/assets3d.ts';
export function buildConsole(g:any,kit:SceneKit){
 const {world,scene,keyLight,team,box,shape,group,label,animate,contact,tree,person,material,geometry,targetAspect}=kit;

 box(world,'#203b53',0,-.5,0,19,.5,10.8);
 for(let i=0;i<38;i++){const x=((i*137)%185)/10-9.2,z=((i*73)%101)/10-5;shape(world,'cylinder','#36536a',x,-.23,z,.025,.01,.025,true);}
 // Batas arena dan dekorasi berada di luar jalur permainan.
 for(const z of [-5.45,5.45])box(world,'#61718b',0,-.1,z,19.2,.3,.12);
 for(const x of [-9.6,9.6])box(world,'#61718b',x,-.1,0,.12,.3,11);
 for(let i=0;i<65;i++){const x=Math.sin(i*43.7)*23,z=Math.cos(i*18.3)*15;shape(world,'sphere','#adc4d9',x,-2-Math.abs(Math.cos(i))*3,z,.025+(i%3)*.014,undefined,undefined,true);}
 shape(world,'sphere','#627a9f',-10,-2,-7,2.1);const planetRing=shape(world,'ring','#b5b1bf',-10,-2,-7,3,3,3);planetRing.rotation.x=1.15;
 label(world,`ORBIT · ARENA ${g.level}`,0,.2,-5.9,3.2);
 const crystalModels=g.energies.map((e:any)=>{const root=group(world,(e.x-640)/70,0,(e.y-360)/70);const gem=shape(root,'gem','#ffe1a1',0,.55,0,.2,.34,.2,true);const halo=shape(root,'ring','#7d8c6c',0,.04,0,.32,.32,.32);halo.rotation.x=Math.PI/2;return {root,gem,halo,burstAt:-100,wasTaken:false};});
 animate(world,(state,t)=>{crystalModels.forEach((m:any,i:number)=>{const taken=state.energies[i].taken;if(taken&&!m.wasTaken)m.burstAt=t;m.wasTaken=taken;const age=t-m.burstAt;m.root.visible=!taken||(!kit.reducedMotion&&age<.5);m.gem.visible=!taken;m.halo.scale.setScalar(taken?.32+age*1.6:.32);m.gem.rotation.y=kit.reducedMotion?0:t*.9;m.gem.position.y=.55+(kit.reducedMotion?0:Math.sin(t*2+i)*.08);});});
 const obstacleModels=g.obstacles.map(()=>{const root=group(world);shape(root,'gem','#84738a',0,.4,0,.43,.5,.43);shape(root,'gem','#b2a0a1',-.16,.7,.1,.18);contact(root,0,0,.48);addAsset(root,'kaykit-space/rock_A',{height:.85,width:.85,depth:.85,fallback:root.children.filter(o=>o.position.y>.1)});return root;});
 animate(world,(state,t)=>obstacleModels.forEach((m:any,i:number)=>{const o=state.obstacles[i];m.position.set((o.x-640)/70,0,(o.y+Math.sin(state.elapsed+o.phase)*70-360)/70);m.rotation.y=kit.reducedMotion?0:t*.2+i;}));
 const gates=[260,460].map((z,i)=>{const root=group(world,500/70,0,(z-360)/70);shape(root,'cylinder','#304c59',0,0,0,.7,.13,.7);const ring=shape(root,'ring',team[i],0,.12,0,.63,.63,.63,true);ring.rotation.x=Math.PI/2;const tower=shape(root,'ring',team[i],0,1,0,.68,1,.68,true);label(root,i?'PAD B':'PAD A',0,2,0,1.2);return {ring,tower};});
 animate(world,(state,t)=>gates.forEach(m=>{const ready=state.energies.every((e:any)=>e.taken)&&state.gateOpen;m.tower.visible=ready;m.ring.material=material(ready?'#d5ffc6':'#687f92',ready);m.tower.scale.setScalar(.65+Math.min(state.gate/2,1)*.4);m.tower.rotation.y=kit.reducedMotion?0:t*.5;}));
 const ships=g.players.map((_:any,i:number)=>{
  const root=group(world);contact(root,0,0,.38);const body=group(root,0,.42,0);shape(body,'sphere',team[i],0,0,0,.24,.17,.48);const nose=shape(body,'cone',team[i],0,.02,-.42,.24,.4,.2);nose.rotation.x=-Math.PI/2;box(body,team[i],0,0,.02,.85,.08,.3);shape(body,'sphere','#294557',0,.16,-.1,.14,.1,.19);const flame=shape(body,'cone','#ffcf8d',0,0,.6,.12,.4,.12,true);flame.rotation.x=-Math.PI/2;addAsset(body,i?'kaykit-space/lander_B':'kaykit-space/lander_A',{height:.7,width:.8,depth:1.1,y:-.15,fallback:body.children.filter(o=>o!==flame)});const shield=shape(root,'ring','#b9e8dc',0,.25,0,.55,.55,.55,true);shield.rotation.x=Math.PI/2;label(root,i?'B':'A',0,1.25,0,.6,team[i]);return {root,body,flame,shield,x:0,z:0,first:true};
 });
 animate(world,(state,t,dt)=>ships.forEach((m:any,i:number)=>{const p=state.players[i],x=(p.x-640)/70,z=(p.y-360)/70;if(m.first||kit.reducedMotion){m.root.position.set(x,0,z);m.first=false;}else{m.root.position.x=T.MathUtils.damp(m.root.position.x,x,22,dt);m.root.position.z=T.MathUtils.damp(m.root.position.z,z,22,dt);}const dx=x-m.x,dz=z-m.z;if(Math.hypot(dx,dz)>.005)m.body.rotation.y=Math.atan2(-dx,-dz);m.x=x;m.z=z;m.flame.visible=!p.down;m.shield.visible=p.immune>0;m.body.position.y=.42+(kit.reducedMotion?0:Math.sin(t*3+i)*.035);m.body.visible=!(p.down&&Math.floor(t*4)%2); }));
}
