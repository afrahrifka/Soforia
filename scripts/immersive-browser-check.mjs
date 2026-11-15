import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../src/server.ts');
const app=await startServer({host:'127.0.0.1',port:57840,operatorPort:57841,publicDir:new URL('../dist/public',import.meta.url).pathname});
let browser;const errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
 const display=await browser.newPage({viewport:{width:1366,height:768}});display.on('pageerror',e=>errors.push(e.message));let state;
 display.on('websocket',ws=>ws.on('framereceived',e=>{const m=JSON.parse(String(e.payload));if(m.type==='game.snapshot')state=m.payload;}));
 await display.goto(app.local+'/console');await display.locator('.home-pairing img').waitFor();assert.ok((await display.locator('.home-pairing img').boundingBox()).width>=160);
 await display.screenshot({path:'docs/evidence/menu-large-qr.png',mask:[display.locator('.qr-frame'),display.locator('.pairing-code')],maskColor:'#b69cde'});
 const invitation=state.pairing.url;const a=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});await a.goto(invitation);await a.locator('#pad').waitFor();await a.getByRole('button',{name:'Main',exact:true}).tap();await display.locator('.overlay-card').waitFor();
 async function fit(){assert.equal(await display.locator('header,nav,.game-top,.game-bottom,.keyboard-help,.late-join').count(),0);for(const selector of ['.game-stage','#game']){const r=await display.locator(selector).boundingBox();assert.deepEqual(r,{x:0,y:0,...display.viewportSize()});}}
 await fit();assert.equal(await display.locator('#game-pairing img').count(),0);
 await a.getByRole('button',{name:'Siap',exact:true}).tap();await a.waitForFunction(()=>document.querySelector('.touch-screen').dataset.phase==='playing');
 await a.getByRole('button',{name:'Tampilkan QR',exact:true}).tap();await display.locator('#game-pairing img').waitFor();assert.equal(state.phase,'playing');assert.ok((await display.locator('#game-pairing img').boundingBox()).width>=170);
 await a.getByRole('button',{name:'Sembunyikan QR',exact:true}).tap();await display.waitForFunction(()=>!document.querySelector('#game-pairing img'));
 for(const size of [{width:1920,height:1080},{width:1280,height:720}]){await display.setViewportSize(size);await fit();}
 await display.screenshot({path:'docs/evidence/game-immersive.png'});
 await a.getByRole('button',{name:'Tampilkan QR',exact:true}).tap();await display.locator('#game-pairing img').waitFor();
 const b=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});await b.goto(invitation);await b.locator('#pad').waitFor();await display.waitForFunction(()=>!document.querySelector('#game-pairing img'));assert.equal(await b.locator('[data-do=pairing-toggle]').count(),0);assert.equal(await a.getByRole('button',{name:'Tampilkan QR',exact:true}).isDisabled(),true);assert.equal(state.phase,'playing');
 const cdp=await a.context().newCDPSession(a);
 await a.getByRole('button',{name:'Home',exact:true}).first().tap();await display.locator('.console-home').waitFor();
 for(const id of ['garden','seirama','property','glass']){const r=await a.locator('#pad').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.8,y:r.y+r.height*.5,id:1}]});await a.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await display.waitForSelector(`[data-game-id=${id}][aria-current=true]`);await a.getByRole('button',{name:'Main',exact:true}).tap();await display.locator('.overlay-card').waitFor();await fit();await a.getByRole('button',{name:'Home',exact:true}).first().tap();await display.locator('.console-home').waitFor();}
 assert.deepEqual(errors,[]);const report={tanggal:'2026-11-15',hasil:'lulus',cakupan:['QR dashboard >=160px','lima game tanpa header/navbar/footer/QR otomatis','canvas memenuhi viewport pada 1366×768, 1920×1080, 1280×720','host tampil/sembunyikan QR saat bermain tanpa pause','QR otomatis tertutup setelah pemain 2 bergabung','pemain 2 tidak mempunyai tombol QR','tanpa error JavaScript'],batas:'Chromium sintetis; kemampuan scan pada HP fisik belum diuji.'};await writeFile('docs/evidence/immersive-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();await app.close();}
