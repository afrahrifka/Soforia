import test from 'node:test';
import assert from 'node:assert/strict';
import {GlassPresentation} from '../glass-presentation.ts';
import {createGame} from '../../../platform/game-runtime.ts';
test('Kaca: snapshot 30 Hz tampil kontinu per frame tanpa memutasi state server',()=>{
 const view=new GlassPresentation(),g=createGame('glass');
 const frames=[0,33,66,99].map(time=>{const state=structuredClone(g);state.pane.z-=time*.0038;state.players.forEach((p:any)=>p.z-=time*.0038);state.elapsed=time/1000;view.push(state,time,'match');return state;});
 const previous=structuredClone(frames);const samples=[60,76,92,108,124].map(t=>view.sample(t).players[0].z);
 for(let i=1;i<samples.length;i++)assert.ok(Math.abs((samples[i-1]-samples[i])-.0608)<1e-8);
 assert.deepEqual(frames,previous);
});
test('Kaca: respawn dan pergantian match langsung membuang frame posisi lama',()=>{
 const view=new GlassPresentation(),g=createGame('glass');view.push(g,0,'a');const next=structuredClone(g);next.pane.z=-20;next.players.forEach((p:any)=>p.z=-20);view.push(next,33,'a');assert.equal(view.sample(35).pane.z,-20);
 view.push(g,66,'b');assert.equal(view.sample(67).pane.z,g.pane.z);
});
