import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,gameAction,tickGame,result} from '../../../platform/game-runtime.ts';
import {propertyPrice,propertyRent,propertyValue,upgradePrice} from '../property.ts';
function settle(g:any){for(let i=0;i<50&&['rolling','moving'].includes(g.stage);i++)tickGame(g,[],.1);}

test('Kota: dadu dan gerak bertahap tidak bisa dilewati atau diulang dengan spam aksi',()=>{
 const g=createGame('property','relaxed',1,42);gameAction(g,1,'use');assert.equal(g.stage,'ready');
 gameAction(g,0,'use');const dice=g.dice;assert.equal(g.stage,'rolling');assert.equal(g.players[0].position,0);
 for(let i=0;i<10;i++)gameAction(g,0,'use');assert.equal(g.dice,dice);assert.equal(g.randomStep,1);
 tickGame(g,[],.4);assert.equal(g.players[0].position,0);settle(g);assert.equal(g.players[0].position,dice);assert.ok(['decision','ready'].includes(g.stage));
});
test('Kota: beli/lewati, peningkatan, dan nilai aset mematuhi saldo serta kepemilikan',()=>{
 const g=createGame('property');g.players[0].position=1;g.stage='decision';g.pending=true;g.decision='buy';const money=g.players[0].money;
 gameAction(g,1,'use');assert.equal(g.owners[1],-1);gameAction(g,0,'use');assert.equal(g.owners[1],0);assert.equal(g.players[0].money,money-propertyPrice(1));assert.equal(propertyValue(g,0),money);
 g.turn=0;g.stage='decision';g.pending=true;g.decision='upgrade';gameAction(g,0,'use');assert.equal(g.levels[1],1);assert.equal(g.players[0].money,money-propertyPrice(1)-upgradePrice(1));assert.equal(propertyValue(g,0),money);
 g.turn=0;g.stage='decision';g.pending=true;g.decision='buy';g.players[0].position=2;const before=g.players[0].money;gameAction(g,0,'tool');assert.equal(g.owners[2],-1);assert.equal(g.players[0].money,before);
});
test('Kota: distrik lengkap memberi sewa ganda; sewa tidak membuat saldo negatif',()=>{
 const g=createGame('property');assert.equal(propertyRent(g,1),20);g.owners[1]=g.owners[2]=g.owners[3]=1;assert.equal(propertyRent(g,1),40);g.levels[1]=2;assert.equal(propertyRent(g,1),120);
 g.players[0].money=7;g.players[0].position=0;g.stage='moving';g.stageTime=0;g.stepsLeft=1;const other=g.players[1].money;tickGame(g,[],.01);assert.equal(g.players[0].money,0);assert.equal(g.players[1].money,other+7);assert.equal(g.turn,1);
});
test('Kota: melewati awal memberi bonus, taman memberi hadiah, tanpa kehilangan giliran',()=>{
 const g=createGame('property');g.players[0].position=15;g.stage='moving';g.stageTime=0;g.stepsLeft=1;tickGame(g,[],.01);assert.equal(g.players[0].money,770);assert.equal(g.moves,1);
 g.turn=0;g.players[0].position=7;g.stage='moving';g.stageTime=0;g.stepsLeft=1;tickGame(g,[],.01);assert.equal(g.players[0].money,825);assert.equal(g.moves,2);
});
test('Kota: satu pertandingan selesai, rematch seed sama mereproduksi dadu dan transaksi',()=>{
 const run=()=>{const g=createGame('property','relaxed',1,123);const dice=[];for(let i=0;i<24;i++){const slot=g.turn;gameAction(g,slot,'use');dice.push(g.dice);settle(g);if(g.pending)gameAction(g,slot,i%3?'use':'tool');assert.ok(g.players.every((p:any)=>p.money>=0));assert.equal(g.moves,i+1);}assert.equal(g.finished,true);const summary=result(g);gameAction(g,g.turn,'use');assert.equal(g.moves,24);return {dice,summary,owners:g.owners,money:g.players.map((p:any)=>p.money)};};assert.deepEqual(run(),run());
});
