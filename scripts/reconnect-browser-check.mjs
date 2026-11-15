import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../src/server.ts');
const app=await startServer({host:'127.0.0.1',port:58100,operatorPort:58101,publicDir:new URL('../dist/public',import.meta.url).pathname});
let browser;const errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
 const display=await browser.newPage();let state;display.on('websocket',ws=>ws.on('framereceived',e=>{const m=JSON.parse(String(e.payload));if(m.type==='game.snapshot')state=m.payload;}));await display.goto(app.local+'/console');await display.locator('.home-pairing img').waitFor();const invitation=state.pairing.url;
 const ctx=await browser.newContext({viewport:{width:915,height:412},isMobile:true,hasTouch:true});
 const a=await ctx.newPage();a.on('pageerror',e=>errors.push(e.message));let playerState;a.on('websocket',ws=>ws.on('framereceived',e=>{const m=JSON.parse(String(e.payload));if(m.type==='game.snapshot')playerState=m.payload;}));await a.goto(invitation);await a.locator('.touch-screen').waitFor();const id=playerState.you.id;
 const forbidden='[data-do=mode],[data-do=level],[data-do=stage-select],[data-do=stage-prev],[data-do=stage-next],[data-do=next-arena]';assert.equal(await a.locator(forbidden).count(),0);assert.equal(await display.locator('.home-mode').count(),0);
 // Scan QR di tab baru dengan sessionStorage kosong, localStorage tetap milik HP yang sama.
 const tab=await ctx.newPage();await tab.addInitScript(()=>{const Original=WebSocket;window.openedSockets=0;window.WebSocket=class extends Original{constructor(...args){super(...args);window.openedSockets++;if(window.dropIncoming){window.dropIncoming=false;window.watchdogRecovered=true;}this.addEventListener('message',e=>{if(window.dropIncoming)e.stopImmediatePropagation();});}};});await tab.goto(invitation);await tab.locator('.touch-screen').waitFor();assert.equal(state.players.length,1);assert.equal(state.players[0].id,id);assert.equal(state.players[0].connected,true);await a.close();
 await tab.getByRole('button',{name:'Main',exact:true}).tap();await tab.getByRole('button',{name:'Siap',exact:true}).tap();await tab.waitForFunction(()=>document.querySelector('.touch-screen')?.dataset.phase==='playing');const instance=state.gameInstanceId;
 // Putuskan jaringan controller tanpa menutup browser/tab.
 await ctx.setOffline(true);await new Promise(r=>setTimeout(r,4500));assert.equal(state.players[0].connected,false);assert.equal(state.phase,'playing');await ctx.setOffline(false);
 for(let i=0;i<100&&!state.players[0].connected;i++)await new Promise(r=>setTimeout(r,100));assert.equal(state.players[0].connected,true);assert.equal(state.players.length,1);assert.equal(state.players[0].id,id);assert.equal(state.gameInstanceId,instance);
 // Koneksi masuk berhenti tetapi socket masih OPEN: watchdog harus membuka koneksi pengganti.
 const sockets=await tab.evaluate(()=>{window.dropIncoming=true;return window.openedSockets;});await tab.waitForFunction(count=>window.openedSockets>count&&window.watchdogRecovered,sockets,{timeout:10000});await tab.waitForTimeout(300);assert.equal(state.players.length,1);assert.equal(state.players[0].id,id);assert.equal(state.gameInstanceId,instance);
 await tab.getByRole('button',{name:'Home',exact:true}).first().tap();await display.locator('.console-home').waitFor();
 // Navigasi hingga Kaca dan periksa tidak ada pemilih stage, lalu uji dev keyboard terpisah.
 for(let i=0;i<4;i++){await tab.getByRole('button',{name:'Arah kanan',exact:true}).tap();await tab.waitForTimeout(100);}
 assert.equal(state.selected,'glass');assert.equal(await tab.locator(forbidden).count(),0);assert.equal(await tab.getByRole('button',{name:'Main',exact:true}).count(),1);
 assert.deepEqual(errors,[]);const report={tanggal:'2026-11-15',hasil:'lulus',cakupan:['scan QR tab baru kembali ke identitas lama tanpa slot ganda','offline 4,5 detik terdeteksi','online pulih otomatis ke slot dan match yang sama tanpa pause','watchdog memulihkan socket OPEN yang tidak lagi menerima snapshot','menu umum dan Kaca tanpa tombol mode/arena/pemilih stage'],batas:'Jaringan disimulasikan Playwright Chromium; perlu uji HP fisik dan perpindahan Wi-Fi.'};await writeFile('docs/evidence/reconnect-browser-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();await app.close();}
