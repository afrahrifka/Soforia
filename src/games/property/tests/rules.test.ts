import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,gameAction,tickGame,publicGame,privateGame} from '../../../platform/game-runtime.ts';
test('Kota Berdua: giliran otoritatif, dadu legal, aset dan akhir 24 giliran',()=>{
 const g=createGame('property');gameAction(g,1,'use');assert.equal(g.moves,0);
 for(let i=0;i<24;i++){const slot=g.turn;gameAction(g,slot,'use');for(let step=0;step<50&&['rolling','moving'].includes(g.stage);step++)tickGame(g,[],.1);if(g.pending)gameAction(g,slot,'use');assert.ok(g.dice>=1&&g.dice<=6);assert.ok(g.players.every((p:any)=>p.money>=0));assert.equal(g.moves,i+1);}
 assert.equal(g.finished,true);gameAction(g,g.turn,'use');assert.equal(g.moves,24);
});
