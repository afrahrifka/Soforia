import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
process.env.MAIN_BARENG_TEST='1';
const {startServer}=await import('../src/server.ts');
const app=await startServer({host:'127.0.0.1',port:57830,operatorPort:57831,publicDir:new URL('../dist/public',import.meta.url).pathname});
let browser;
const errors=[];
try{
 browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:1920,height:1080}});page.on('pageerror',e=>errors.push(e.message));let state;
 page.on('websocket',ws=>ws.on('framereceived',e=>{const m=JSON.parse(String(e.payload));if(m.type==='game.snapshot')state=m.payload;}));
 await page.goto(app.local+'/console');await page.locator('.home-pairing img').waitFor();await page.waitForFunction(()=>document.querySelector('.qr-frame img').naturalWidth>0);
 const screenshots=[];
 async function screenshot(name){await page.waitForTimeout(650);await page.screenshot({path:`docs/evidence/${name}.png`,mask:[page.locator('.qr-frame'),page.locator('.pairing-code')],maskColor:'#b69cde'});screenshots.push(name);}
 async function fit(){assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth||document.documentElement.scrollHeight>innerHeight),false);const bounds=await page.locator('.feature-copy,.home-pairing,.home-game-row').evaluateAll(els=>els.map(el=>{const r=el.getBoundingClientRect();return {x:r.x,y:r.y,right:r.right,bottom:r.bottom};}));for(const r of bounds)assert.ok(r.x>=0&&r.y>=0&&r.right<=page.viewportSize().width&&r.bottom<=page.viewportSize().height,JSON.stringify(r));}
 await fit();await screenshot('menu-purple-1920');
 const phone=await browser.newPage({viewport:{width:915,height:412},isMobile:true,hasTouch:true});await phone.goto(state.pairing.url);await phone.locator('#pad').waitFor();
 const cdp=await phone.context().newCDPSession(phone);
 async function next(){const r=await phone.locator('#pad').boundingBox();await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:r.x+r.width*.8,y:r.y+r.height*.5,id:1}]});await phone.waitForTimeout(80);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 for(const id of ['garden','seirama','property','glass']){await next();await page.waitForSelector(`[data-game-id=${id}][aria-current=true]`);assert.equal(await page.locator('.console-tile.selected').count(),1);await fit();await screenshot(`menu-purple-${id}`);}
 for(const size of [{width:1366,height:768},{width:1280,height:720},{width:1920,height:1080}]){await page.setViewportSize(size);await fit();if(size.width===1366)await screenshot('menu-purple-1366');}
 await phone.getByRole('button',{name:'Main',exact:true}).tap();await page.locator('.overlay-card').waitFor();assert.equal(await page.locator('.console-home').count(),0);
 await phone.getByRole('button',{name:'Home',exact:true}).first().tap();await page.locator('.console-home').waitFor();await page.emulateMedia({reducedMotion:'reduce'});assert.equal(await page.locator('.feature-art').evaluate(el=>getComputedStyle(el).animationName),'none');
 assert.deepEqual(errors,[]);
 const report={tanggal:'2026-11-15',hasil:'lulus',cakupan:['QR termuat','navigasi lima game dari analog controller browser','satu sorotan aktif','layout tanpa scroll 1280×720, 1366×768, 1920×1080','mulai Kaca dan kembali ke menu','reduced motion','tanpa error JavaScript'],screenshots,privasi:'QR dan kode sesi ditutupi pada cuplikan',batas:'Uji Chromium, bukan dua HP fisik atau uji performa.'};await writeFile('docs/evidence/menu-purple-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser?.close();await app.close();}
