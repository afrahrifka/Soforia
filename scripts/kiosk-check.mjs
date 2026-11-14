import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import { writeFile, mkdir, mkdtemp, rm } from 'node:fs/promises';
import assert from 'node:assert/strict';
if(!process.env.DISPLAY&&!process.env.WAYLAND_DISPLAY)throw Error('Uji kiosk memerlukan desktop grafis.');
const port=39410,child=spawn(process.execPath,['dist/server.mjs','--host','127.0.0.1','--port',String(port)],{stdio:'ignore'});let browser;const profile=await mkdtemp('/tmp/main-bareng-kiosk-test-');
try{
 for(let i=0;i<60;i++){try{if((await fetch(`http://127.0.0.1:${port}/healthz`)).ok)break;}catch{}await new Promise(r=>setTimeout(r,100));}
 browser=await chromium.launchPersistentContext(profile,{viewport:null,executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:false,ignoreDefaultArgs:['--enable-automation'],args:['--no-sandbox','--kiosk','--start-fullscreen','--no-first-run']});
 const context=browser,page=context.pages()[0]||await context.newPage();await page.goto(`http://127.0.0.1:${port+1}/console`);await page.locator('.qr-frame img').waitFor();await page.waitForTimeout(1500);
 const dimensions=await page.evaluate(()=>({innerWidth,innerHeight,outerWidth,outerHeight,screenWidth:screen.width,screenHeight:screen.height}));
 assert.ok(dimensions.innerWidth>=dimensions.screenWidth-2&&dimensions.innerHeight>=dimensions.screenHeight-2,JSON.stringify(dimensions));assert.equal(await page.locator('button,input,a').count(),0);
 const report={result:'PASS',browser:'Chromium desktop',checks:['headful --kiosk --start-fullscreen fills screen','display has no button/input/link controls'],dimensions,limitation:'Application kiosk, not operating-system lockdown.'};await mkdir('docs/evidence',{recursive:true});await writeFile('docs/evidence/kiosk-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser?.close();child.kill('SIGTERM');if(child.exitCode===null)await new Promise(r=>child.once('exit',r));await rm(profile,{recursive:true,force:true});}
