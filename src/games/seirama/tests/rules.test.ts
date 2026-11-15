import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,gameAction,tickGame,publicGame,privateGame} from '../../../platform/game-runtime.ts';
import {questions} from '../questions.ts';
test('Seirama: 40 soal unik dan delapan ronde tanpa pengulangan',()=>{assert.equal(questions.length,40);assert.equal(new Set(questions.map(q=>q[0])).size,40);const g=createGame('seirama');assert.equal(new Set(g.bank).size,8);});
test('Seirama: jawaban tidak diserialisasi sebelum kedua pihak siap; skip menghapus jawaban',()=>{
 const g=createGame('seirama');gameAction(g,0,'answer',2);gameAction(g,1,'answer',1);assert.equal('answers' in publicGame(g),false);assert.deepEqual(privateGame(g,1),{answer:1,revealReady:false,nextReady:false});
 gameAction(g,0,'reveal');assert.equal('answers' in publicGame(g),false);gameAction(g,1,'reveal');assert.deepEqual(publicGame(g).answers,[2,1]);assert.equal(g.played,1);
 gameAction(g,0,'next');assert.equal(g.round,0);gameAction(g,1,'next');assert.equal(g.round,1);assert.deepEqual(g.answers,[null,null]);gameAction(g,0,'answer',3);gameAction(g,1,'skip');assert.equal('answers' in publicGame(g),false);assert.deepEqual(g.answers,[null,null]);assert.equal(g.played,1);
});
test('Seirama: semua ronde dilewati selesai tanpa skor palsu',()=>{const g=createGame('seirama');for(let i=0;i<8;i++){gameAction(g,0,'skip');gameAction(g,0,'next');gameAction(g,1,'next');}assert.equal(g.finished,true);assert.equal(g.matches,0);assert.equal(g.played,0);});
