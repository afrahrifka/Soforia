import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,gameAction,tickGame,publicGame,privateGame} from '../../../platform/game-runtime.ts';
test('Kebun: siklus tanam/siram/panen, aksi ganda dan deposit',()=>{
 const g=createGame('garden');const p=g.players[0],plot=g.plots[0];p.x=plot.x-1;p.y=plot.y;p.dx=1;p.dy=0;
 gameAction(g,0,'use');assert.equal(plot.stage,'seed');gameAction(g,0,'tool');gameAction(g,0,'use');assert.equal(plot.stage,'growing');
 for(let i=0;i<721;i++)tickGame(g,[],1/60);assert.equal(plot.stage,'ripe');gameAction(g,0,'tool');gameAction(g,0,'use');gameAction(g,0,'use');assert.equal(p.carry,'carrot');assert.equal(plot.stage,'empty');
 p.x=6;p.y=5;p.dx=1;p.dy=0;gameAction(g,0,'use');gameAction(g,0,'use');assert.equal(g.harvest.carrot,1);assert.equal(p.carry,null);
});
test('Kebun: setiap petak mempunyai sisi yang dapat diakses',()=>{const g=createGame('garden');for(const t of g.plots){assert.ok([[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy])=>{const x=t.x+dx,y=t.y+dy;return x>=0&&x<8&&y>=0&&y<6&&!g.plots.some((p:any)=>p.x===x&&p.y===y);}));}});
test('Kebun: dua pemain dapat menyelesaikan target 6+6 melalui rute dan aksi legal',()=>{
 const g=createGame('garden');
 const blocked=(x:number,y:number)=>g.plots.some((p:any)=>p.x===x&&p.y===y)||(y===0&&(x===0||x===1))||(x===7&&y===5);
 function interact(slot:number,tx:number,ty:number){
  const p=g.players[slot],queue:any[]=[{x:p.x,y:p.y,path:[]}],seen=new Set([`${p.x},${p.y}`]);let route:any;
  while(queue.length){const q=queue.shift();if(Math.abs(q.x-tx)+Math.abs(q.y-ty)===1){route=q;break;}for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const x=q.x+dx,y=q.y+dy,k=`${x},${y}`;if(x>=0&&x<8&&y>=0&&y<6&&!blocked(x,y)&&!seen.has(k)){seen.add(k);queue.push({x,y,path:[...q.path,{x:dx,y:dy}]});}}}
  assert.ok(route,'station or plot is reachable');
  for(const step of route.path){tickGame(g,[],.01);const input=[{x:0,y:0},{x:0,y:0}];input[slot]=step;tickGame(g,input,.26);}
  tickGame(g,[],.01);const input=[{x:0,y:0},{x:0,y:0}];input[slot]={x:tx-p.x,y:ty-p.y};tickGame(g,input,.02);gameAction(g,slot,'use');
 }
 for(let i=0;i<12;i++){const s=i%2,p=g.players[s];while(p.tool!==0)gameAction(g,s,'tool');interact(s,i<6?0:1,0);interact(s,g.plots[i].x,g.plots[i].y);gameAction(g,s,'tool');interact(s,g.plots[i].x,g.plots[i].y);}
 tickGame(g,[],12.1);
 for(let i=0;i<12;i++){const s=i%2,p=g.players[s];while(p.tool!==2)gameAction(g,s,'tool');interact(s,g.plots[i].x,g.plots[i].y);assert.ok(p.carry);interact(s,7,5);}
 assert.deepEqual(g.harvest,{carrot:6,berry:6});assert.equal(g.finished,true);
});
test('Kebun: tombol langsung memilih alat atomik dan Antar tidak dipicu tombol Siram',()=>{
 const g=createGame('garden'),p=g.players[0],plot=g.plots[0];p.x=plot.x-1;p.y=plot.y;p.dx=1;p.dy=0;p.tool=2;
 gameAction(g,0,'plant');assert.equal(p.tool,0);assert.equal(plot.stage,'seed');
 gameAction(g,0,'water');assert.equal(p.tool,1);assert.equal(plot.stage,'growing');tickGame(g,[],12.1);
 gameAction(g,0,'harvest');assert.equal(p.tool,2);assert.equal(p.carry,'carrot');
 gameAction(g,0,'deposit');assert.equal(p.carry,'carrot');assert.equal(g.harvest.carrot,0);
 p.x=6;p.y=5;p.dx=1;p.dy=0;gameAction(g,0,'water');assert.equal(p.carry,'carrot');assert.equal(g.harvest.carrot,0);
 gameAction(g,0,'deposit');assert.equal(p.carry,null);assert.equal(g.harvest.carrot,1);
});
