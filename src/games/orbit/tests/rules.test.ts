import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,gameAction,tickGame,publicGame,privateGame} from '../../../platform/game-runtime.ts';
test('Orbit: seed deterministik, kecepatan diagonal, kedua gerbang dan recovery pasangan',()=>{
 const a=createGame('orbit','relaxed',1,123),b=createGame('orbit','relaxed',1,123);assert.deepEqual(a.energies,b.energies);
 tickGame(a,[{x:1,y:1},{x:0,y:0}],1);assert.ok(Math.abs(Math.hypot(a.players[0].x-120,a.players[0].y-300)-180)<.001);
 a.energies.forEach((e:any)=>e.taken=true);a.players[0].x=1140;a.players[0].y=260;a.players[1].x=1140;a.players[1].y=460;
 for(let i=0;i<121;i++)tickGame(a,[],1/60);assert.equal(a.finished,true);
 const c=createGame('orbit');c.players[0].down=3;c.players[1].x=c.players[0].x;c.players[1].y=c.players[0].y;for(let i=0;i<61;i++)tickGame(c,[],1/60);assert.equal(c.players[0].down,0);assert.equal(c.helps,1);
});
test('Orbit: pulsa melindungi dan menyelamatkan pasangan dekat, dengan cooldown delapan detik',()=>{
 const g=createGame('orbit');g.players[1].down=3;gameAction(g,0,'use');assert.equal(g.players[0].pulse,8);assert.equal(g.players[1].down,0);assert.equal(g.helps,1);assert.equal(g.players[1].immune,2);
 g.players[1].down=3;gameAction(g,0,'use');assert.equal(g.players[1].down,3);tickGame(g,[],8);assert.equal(g.players[0].pulse,0);
 g.players[1].x=1000;g.players[1].down=3;gameAction(g,0,'use');assert.equal(g.players[1].down,3);
});
