import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../../../platform/server.ts');
const app=await startServer({host:'127.0.0.1',port:57820,operatorPort:57821,publicDir:new URL('../../../../dist/public',import.meta.url).pathname});
let browser;
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage();
 await page.addInitScript(()=>{const Original=WebSocket;window.WebSocket=class extends Original{constructor(...args){super(...args);this.addEventListener('message',e=>{const m=JSON.parse(e.data);if(m.type==='game.snapshot')window.testSnapshot=m.payload;});}};});
 async function retryCheckpoint(){const before=await page.evaluate(()=>window.testSnapshot.game.revision);await page.keyboard.press('Backspace');await page.waitForFunction(revision=>window.testSnapshot.game.revision>=revision+2&&window.testSnapshot.game.retryTime<=0,before,{timeout:15000});}
 await page.goto(app.local+'/console');await page.waitForFunction(()=>window.testSnapshot?.phase==='catalog');
 await page.keyboard.press('F2');await page.waitForFunction(()=>window.testSnapshot?.keyboard);
 await page.keyboard.press('Enter');await page.waitForFunction(()=>window.testSnapshot?.phase==='tutorial');await page.keyboard.press('Enter');await page.waitForFunction(()=>window.testSnapshot?.phase==='playing');
 assert.equal(await page.locator('canvas').getAttribute('data-world-text-labels'),'0');
 for(const [code,direction] of [['KeyQ',1],['KeyE',-1],['KeyU',1],['KeyO',-1]]){
  await page.keyboard.down(code);await page.waitForFunction(sign=>window.testSnapshot.game.pane.roll*sign>.08,direction);await page.keyboard.up(code);
  const roll=await page.evaluate(()=>window.testSnapshot.game.pane.roll);assert.ok(roll*direction>0);
  await retryCheckpoint();
 }
 await page.keyboard.down('KeyQ');try{await page.waitForFunction(()=>window.testSnapshot.game.pane.roll>Math.PI*2+.1,{},{timeout:25000});}catch(error){console.log(await page.evaluate(()=>({phase:window.testSnapshot.phase,roll:window.testSnapshot.game?.pane.roll,breaks:window.testSnapshot.game?.breaks,message:window.testSnapshot.game?.message,players:window.testSnapshot.game?.players})));throw error;}await page.keyboard.up('KeyQ');assert.ok(Math.abs(await page.evaluate(()=>window.testSnapshot.game.pane.slope))<.1);assert.equal(await page.evaluate(()=>window.testSnapshot.game.breaks),0);
 await retryCheckpoint();
 await page.keyboard.press('Space');await page.waitForFunction(()=>!window.testSnapshot.game.players[0].grounded);
 await retryCheckpoint();
 await page.keyboard.down('KeyR');await page.keyboard.down('KeyI');await page.waitForFunction(()=>window.testSnapshot.game.players.every(p=>p.lifting));
 await page.keyboard.up('KeyR');await page.waitForFunction(()=>!window.testSnapshot.game.players[0].lifting&&window.testSnapshot.game.players[1].lifting);
 await page.evaluate(()=>window.dispatchEvent(new Event('blur')));await page.waitForFunction(()=>window.testSnapshot.game.players.every(p=>!p.lifting));await page.keyboard.up('KeyI');
 await page.keyboard.down('KeyD');await page.keyboard.down('ArrowRight');await page.waitForTimeout(100);await page.keyboard.up('KeyD');await page.keyboard.up('ArrowRight');
 await retryCheckpoint();
 await page.keyboard.press('KeyP');await page.waitForFunction(()=>window.testSnapshot.phase==='paused');
 await page.keyboard.press('Home');await page.waitForFunction(()=>window.testSnapshot.phase==='catalog');await page.keyboard.press('BracketRight');await page.waitForFunction(()=>window.testSnapshot.level===2);
 await page.keyboard.press('F3');await page.waitForFunction(()=>!window.testSnapshot.keyboard);assert.equal(await page.evaluate(()=>window.testSnapshot.players.length),0);
 const report={tanggal:'2026-11-15',hasil:'lulus',lingkungan:'Chromium headless, satu keyboard sintetis; bukan dua HP atau playtest fisik',cakupan:['aktivasi dua slot tanpa HP','mulai dan siap','Q/U dan E/O menggulingkan kaca pada sumbu panjang; ujung tidak bertukar tinggi','putaran berguling melewati 360 derajat','tanpa banner dunia dan tanpa pecah saat guling bebas','tinggi dua pemain bersamaan','release satu pemain independen','blur menetralkan kedua pemain tanpa pause','gerak dua pemain','lompat','jeda','katalog dan pilih stage','keluar melepas slot']};
 await writeFile('src/games/glass/evidence/glass-keyboard-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();await app.close();}
