import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../src/server.ts');
const app=await startServer({host:'127.0.0.1',port:58200,operatorPort:58201,publicDir:new URL('../dist/public',import.meta.url).pathname});
let browser;const errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
 const display=await browser.newPage();let state;display.on('websocket',ws=>ws.on('framereceived',e=>{const m=JSON.parse(String(e.payload));if(m.type==='game.snapshot')state=m.payload;}));await display.goto(app.local+'/console');await display.locator('.home-pairing img').waitFor();
 const invitation=state.pairing.url,phones=[];
 for(let i=0;i<2;i++){const p=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});p.on('pageerror',e=>errors.push(e.message));await p.goto(invitation);await p.locator('#pad').waitFor();phones.push(p);}
 const [a,b]=phones,cdps=await Promise.all(phones.map(p=>p.context().newCDPSession(p)));
 async function hold(slot,label){const r=await phones[slot].getByRole('button',{name:label,exact:true}).boundingBox();await cdps[slot].send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width/2,y:r.y+r.height/2,id:3}]});}
 async function release(slot){await cdps[slot].send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 async function until(predicate){const end=Date.now()+15000;while(!predicate()){assert.ok(Date.now()<end,'Arah/tinggi tidak mencapai hasil yang diminta');await a.waitForTimeout(20);}}
 async function reset(){const revision=state.game.revision;await a.getByRole('button',{name:'Ulang checkpoint',exact:true}).tap();await until(()=>state.game.revision>=revision+2&&state.game.retryTime<=0&&Math.abs(state.game.pane.roll)<.001);}
 const cdp=cdps[0];for(let i=0;i<4;i++){const r=await a.locator('#pad').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.8,y:r.y+r.height*.5,id:1}]});await a.waitForTimeout(80);await release(0);await a.waitForTimeout(100);}assert.equal(state.selected,'glass');
 await a.getByRole('button',{name:'Main',exact:true}).tap();await a.getByRole('button',{name:'Siap',exact:true}).tap();await until(()=>state.players[0].ready);await b.getByRole('button',{name:'Siap',exact:true}).tap();await until(()=>state.phase==='playing');
 for(let slot=0;slot<2;slot++)for(const [label,sign] of [['Putar kiri',1],['Putar kanan',-1]]){await hold(slot,label);await until(()=>state.game.pane.roll*sign>.12);await release(slot);assert.ok(Math.abs(state.game.pane.yaw)<.25);assert.equal(state.game.breaks,0);await reset();}
 for(let slot=0;slot<2;slot++){await hold(slot,'Naikkan');await until(()=>state.game.players[slot].gripHeight>1.6);await release(slot);assert.ok(state.game.pane.slope*(slot===0?-1:1)>0);await reset();}
 const baseline=state.game.pane.y;await Promise.all([hold(0,'Naikkan'),hold(1,'Naikkan')]);await until(()=>state.game.players.every(p=>p.gripHeight>1.6));await Promise.all([release(0),release(1)]);assert.ok(state.game.pane.y>baseline+.1);assert.ok(Math.abs(state.game.pane.roll)<.08);assert.ok(Math.abs(state.game.pane.yaw)<.25);assert.deepEqual(errors,[]);
 const report={tanggal:'2026-11-15',hasil:'lulus',cakupan:['HP A dan B: Putar kiri guling pada sumbu panjang arah positif','HP A dan B: Putar kanan guling pada sumbu panjang arah negatif','Naikkan A menaikkan sisi A; Naikkan B menaikkan sisi B','mengangkat bersama menaikkan pusat tanpa guling tambahan','tanpa error JavaScript'],batas:'Dua controller browser sintetis. Bukan dua HP fisik atau bukti balancing rute.'};await writeFile('docs/evidence/glass-direction-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();await app.close();}
