// Fixture visual statis; terpisah dari bukti gameplay server/controller.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
process.env.MAIN_BARENG_TEST='1';
const {createGame}=await import('../../../platform/game-runtime.ts');
const bundle=await build({stdin:{contents:`import {draw3D} from './src/platform/scene3d.ts';let id=0;window.show=g=>draw3D(document.querySelector('canvas'),g,0,{instance:String(++id),reduced:true});`,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm'});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});const errors=[],resources=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://natural.local/**',route=>route.fulfill(new URL(route.request().url()).pathname.endsWith('.js')?{contentType:'application/javascript',body:bundle.outputFiles[0].text}:{contentType:'text/html',body:'<!doctype html><style>body{margin:0}canvas{display:block;width:1280px;height:720px}</style><canvas></canvas><script type="module" src="/scene.js"></script>'}));
 await page.goto('http://natural.local/');await page.waitForFunction(()=>window.show);
 for(const [stage,name] of [[0,'road'],[10,'forest'],[20,'mountain-road'],[30,'forest-dusk'],[40,'space'],[50,'moon'],[0,'road']]){
  await page.evaluate(g=>window.show(g),createGame('glass','relaxed',stage+1,42));const canvas=page.locator('canvas');assert.equal(await canvas.getAttribute('data-render-error'),null);assert.equal(await canvas.getAttribute('data-world-text-labels'),'0');resources.push({stage:stage+1,geometries:await canvas.getAttribute('data-geometries'),textures:await canvas.getAttribute('data-textures'),drawCalls:await canvas.getAttribute('data-draw-calls')});await canvas.screenshot({path:`src/games/glass/evidence/kaca-winding-${name}.png`});
 }
 assert.equal(resources[0].geometries,resources.at(-1).geometries);assert.equal(resources[0].textures,resources.at(-1).textures);
 for(const angle of [0,45,90,180]){const g=createGame('glass','relaxed',1,42);g.pane.roll=angle*Math.PI/180;await page.evaluate(g=>window.show(g),g);await page.locator('canvas').screenshot({path:`src/games/glass/evidence/kaca-winding-roll-${angle}.png`});}
 const overview=createGame('glass','relaxed',23,42);const {glassCourse}=await import('../glass.ts');const course=glassCourse(22),points=course.route.points;const x=(Math.min(...points.map(p=>p.x))+Math.max(...points.map(p=>p.x)))/2,z=(Math.min(...points.map(p=>p.z))+Math.max(...points.map(p=>p.z)))/2;overview.camera={...overview.camera,x,y:75,z:z+32,targetX:x,targetY:0,targetZ:z};await page.evaluate(g=>window.show(g),overview);await page.locator('canvas').screenshot({path:'src/games/glass/evidence/kaca-winding-overview.png'});
 assert.deepEqual(errors,[]);const report={tanggal:'2026-11-15',hasil:'lulus',cakupan:['enam lingkungan di atas tanah','empat pose guling 0/45/90/180 derajat','geometri dan tekstur pulih setelah pergantian enam dunia','tanpa error render/JavaScript'],resources,errors,batas:'Fixture statis Chromium. Bukan gameplay, playtest manusia, dua HP atau benchmark FPS.'};await writeFile('src/games/glass/evidence/kaca-winding-visual-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
