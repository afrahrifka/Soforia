// Fixture sintetis untuk inspeksi aset; terpisah dari bukti gameplay dua controller.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.env.MAIN_BARENG_TEST='1';
const {createGame}=await import('../src/games.ts');
const bundle=await build({stdin:{contents:`import {draw3D} from './src/scene3d.ts';import {assetEvidence} from './src/assets3d.ts';window.assetEvidence=assetEvidence;let game,iteration=0,lastDraw=-1000;window.showFixture=g=>{game=g;iteration++;draw3D(document.querySelector('canvas'),game,performance.now()/1000,{instance:String(iteration),reduced:true});};function frame(t){if(game&&t-lastDraw>200){lastDraw=t;draw3D(document.querySelector('canvas'),game,t/1000,{instance:String(iteration),reduced:true});}requestAnimationFrame(frame);}requestAnimationFrame(frame);`,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm'});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});
const errors=[],checks=[];let page;const quick=process.argv.includes('--glass-only');
try{
 page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error')errors.push(msg.text());});
 await page.route('http://visual.local/**',async route=>{
  const path=decodeURIComponent(new URL(route.request().url()).pathname);
  if(path.startsWith('/assets/')){const bytes=await readFile('public'+path);return route.fulfill({contentType:path.endsWith('.gltf')?'model/gltf+json':path.endsWith('.png')?'image/png':path.endsWith('.glb')?'model/gltf-binary':'application/octet-stream',body:bytes});}
  return route.fulfill(path.endsWith('.js')?{contentType:'application/javascript',body:bundle.outputFiles[0].text}:{contentType:'text/html',body:'<!doctype html><html><head><style>body{margin:0}canvas{display:block;width:1280px;height:720px}</style></head><body><canvas aria-label="Fixture model 3D"></canvas><script type="module" src="/scene.js"></script></body></html>'});
 });
 await page.goto('http://visual.local/');await page.waitForFunction(()=>window.showFixture);
 await mkdir('artifacts',{recursive:true});
 for(const id of (quick?['glass']:['orbit','garden','property','seirama','glass'])){
  const g=createGame(id,'relaxed',3,42);
  if(id==='garden'){g.plots.forEach((p,i)=>{p.stage=['seed','growing','ripe'][i%3];p.crop=i%2?'berry':'carrot';p.growth=7;});g.players[0].carry='carrot';g.players[1].carry='berry';}
  if(id==='property'){g.owners=g.owners.map((_,i)=>[0,4,8,12].includes(i)?-1:i%2);g.levels=g.levels.map((_,i)=>i%3);g.dice=5;}
  if(id==='orbit'){g.players[0].immune=2;g.energies.forEach((e,i)=>e.taken=i<5);}
  await page.evaluate(g=>window.showFixture(g),g);await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-asset-pending')==='0');await page.waitForTimeout(200);
  const canvas=page.locator('canvas');assert.equal(await canvas.getAttribute('data-render-error'),null);assert.equal(await canvas.getAttribute('data-asset-failed'),'0');if(id!=='glass')assert.ok(Number(await canvas.getAttribute('data-asset-loaded'))>0);assert.ok(Number(await canvas.getAttribute('data-draw-calls'))>0);const geometry=await canvas.getAttribute('data-geometries'),textures=await canvas.getAttribute('data-textures');assert.ok(Number(geometry)>0);if(id!=='glass')assert.ok(Number(textures)>0);else assert.equal(await canvas.getAttribute('data-world-text-labels'),'0','Kaca tidak memakai label/banner teks melayang');
  const imageA=await canvas.screenshot();await page.waitForTimeout(350);const imageB=await canvas.screenshot();assert.deepEqual(imageA,imageB,'Reduced motion harus menghasilkan frame statis untuk state fixture tetap');assert.equal(await canvas.getAttribute('data-geometries'),geometry);assert.equal(await canvas.getAttribute('data-textures'),textures);
  await writeFile(`artifacts/assets-${id}-3d.png`,imageB);checks.push({id,geometry:Number(geometry),textures:Number(textures),reducedMotion:'frame statis identik',render:'PASS'});
 }
 const extended=createGame('glass','relaxed',1,42);extended.players[0].x=-2.5;extended.players[1].x=2.5;await page.evaluate(g=>window.showFixture(g),extended);await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-asset-pending')==='0');await page.waitForTimeout(200);await page.locator('canvas').screenshot({path:'artifacts/glass-arms-extended.png'});
 for(const angle of [0,45,90,180]){const pose=createGame('glass','relaxed',1,42);pose.pane.roll=angle*Math.PI/180;await page.evaluate(g=>window.showFixture(g),pose);await page.waitForTimeout(200);await page.locator('canvas').screenshot({path:`artifacts/glass-guling-${angle}.png`});}
 const vertical=createGame('glass','relaxed',1,42);vertical.pane.roll=Math.PI/2;vertical.pane.tilt=Math.PI/2;vertical.pane.y=1.6;vertical.players[0].x=-1.8;vertical.players[1].x=1.8;await page.evaluate(g=>window.showFixture(g),vertical);await page.waitForTimeout(220);await page.locator('canvas').screenshot({path:'artifacts/glass-four-corners-vertical.png'});
 const stageResources=[];
 for(const stage of [0,10,20,30,40,50,0]){await page.evaluate(g=>window.showFixture(g),createGame('glass','relaxed',stage+1,42));await page.waitForFunction(()=>document.querySelector('canvas')?.getAttribute('data-asset-pending')==='0');await page.waitForTimeout(150);const canvas=page.locator('canvas');assert.equal(await canvas.getAttribute('data-render-error'),null);stageResources.push({stage:stage+1,geometry:await canvas.getAttribute('data-geometries'),textures:await canvas.getAttribute('data-textures')});await canvas.screenshot({path:`artifacts/glass-world-${Math.floor(stage/10)+1}.png`});}
 assert.equal(stageResources[0].geometry,stageResources.at(-1).geometry,'Geometri tidak bertambah setelah pergantian enam dunia');assert.equal(stageResources[0].textures,stageResources.at(-1).textures);assert.ok(Number(await page.locator('canvas').getAttribute('data-asset-cached'))<=64);assert.equal(await page.locator('canvas').getAttribute('data-asset-failed'),'0');checks.push({id:quick?'glass-preview':'glass-six-worlds',render:'PASS',stageResources});
 assert.deepEqual(errors,[]);const evidence=await page.evaluate(()=>window.assetEvidence());const report={result:'PASS',checks,errors,downloadedModelsParsed:evidence.modelIds,uniqueDownloadedModels:evidence.modelIds.length,cacheLimit:64,limitation:'Fixture sintetis untuk memeriksa model dan reduced motion. Bukan pengujian aturan game, dua HP fisik, FPS hardware, atau input-to-photon.'};await writeFile(quick?'artifacts/visual-glass-preview-report.json':'artifacts/visual-3d-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report,null,2));
}finally{await browser.close();}
