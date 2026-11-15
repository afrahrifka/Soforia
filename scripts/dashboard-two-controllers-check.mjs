import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../src/server.ts');
const app=await startServer({host:'127.0.0.1',port:58300,operatorPort:58301,publicDir:new URL('../dist/public',import.meta.url).pathname});
let browser;const errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
 const display=await browser.newPage();let state;display.on('websocket',ws=>ws.on('framereceived',e=>{const m=JSON.parse(String(e.payload));if(m.type==='game.snapshot')state=m.payload;}));await display.goto(app.local+'/console');await display.locator('.home-pairing img').waitFor();const invitation=state.pairing.url;
 const phones=[];for(let i=0;i<2;i++){const phone=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});phone.on('pageerror',e=>errors.push(e.message));await phone.goto(invitation);await phone.locator('#pad').waitFor();assert.equal(await phone.locator('#pad').getAttribute('data-disabled'),'false');assert.equal(await phone.getByRole('button',{name:'Main',exact:true}).isEnabled(),true);phones.push(phone);}
 const cdps=await Promise.all(phones.map(p=>p.context().newCDPSession(p)));
 async function navigate(slot,x,id){const r=await phones[slot].locator('#pad').boundingBox();await cdps[slot].send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*(.5+.3*x),y:r.y+r.height*.5,id:1}]});await phones[slot].waitForTimeout(80);await cdps[slot].send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await display.waitForSelector(`[data-game-id=${id}][aria-current=true]`);assert.equal(await display.locator('.console-tile.selected').count(),1);}
 await navigate(0,1,'garden');await navigate(1,1,'seirama');await navigate(0,-1,'garden');await navigate(1,-1,'orbit');
 await phones[1].getByRole('button',{name:'Main',exact:true}).tap();await display.locator('.overlay-card').waitFor();assert.equal(state.game.id,'orbit');assert.equal(state.phase,'tutorial');
 for(const phone of phones)await phone.getByRole('button',{name:'Siap',exact:true}).waitFor();
 assert.deepEqual(errors,[]);const report={tanggal:'2026-11-15',hasil:'lulus',cakupan:['analog dashboard aktif pada kedua controller','kedua controller dapat menggeser pilihan game bersama','satu sorotan game tersinkron','tombol Main pemain 2 memulai game terpilih','kedua pemain menerima tutorial/Siap','tanpa error JavaScript'],batas:'Dua controller browser sintetis; bukan dua HP fisik.'};await writeFile('docs/evidence/dashboard-two-controllers-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();await app.close();}
