// Fixture browser: penempatan awal sintetis di checkpoint akhir, bukan gameplay rute.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const source=`
import {createGlass,tickGlass,glassCourse,groundHeight} from './src/games/glass/glass.ts';
import {routePoint} from './src/games/glass/glass-route.ts';
import {planGlassCamera} from './src/games/glass/glass-camera.ts';
import {draw3D} from './src/platform/scene3d.ts';
import {gameHud} from './src/platform/game-hud.ts';
import {touchMarkup} from './src/platform/touch-controller.ts';
import {GlassPresentation} from './src/games/glass/glass-presentation.ts';
let g,view=new GlassPresentation(),clock=0;
function render(){view.push(structuredClone(g),clock,'fixture');draw3D(document.querySelector('canvas'),view.sample(clock),0,{instance:'fixture',reduced:true});document.querySelector('#hud').innerHTML=gameHud({game:g});document.querySelector('#controller').innerHTML=touchMarkup({phase:'playing',you:{host:true,slot:0},players:[{connected:true},{connected:true}],game:g},{},{connected:true,leftHanded:false,large:false,draftAnswer:null});return {stage:g.stage,checkpoint:g.checkpoint,cleared:g.cleared,finished:g.finished,retry:g.retryTime,breaks:g.breaks,visualStage:view.sample(clock).stage};}
window.setup=stage=>{g={...createGlass(stage),id:'glass',seed:42,level:stage+1,finished:false};const c=glassCourse(stage);g.checkpoint=c.checkpoints.length-1;g.cleared=g.checkpoint;const s=c.checkpoints.at(-1),center=routePoint(c.route,s);g.players.forEach((p,i)=>{const q=routePoint(c.route,s,i?1.8:-1.8);p.x=q.x;p.z=q.z;p.y=groundHeight(c,p.x,p.z);});g.pane={...g.pane,x:center.x,z:center.z,y:(g.players[0].y+g.players[1].y)/2+1.4,yaw:center.yaw};g.camera=planGlassCamera(g,c,1/60,true);clock+=100;return render();};
window.advance=()=>{g.elapsed+=1/60;tickGlass(g,[{},{}],1/60);clock+=16;return render();};`;
const bundle=await build({stdin:{contents:source,resolveDir:process.cwd()},bundle:true,write:false,platform:'browser',format:'esm'});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox']});const errors=[],results=[];
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));
 await page.route('http://transition.local/**',route=>route.fulfill(new URL(route.request().url()).pathname.endsWith('.js')?{contentType:'application/javascript',body:bundle.outputFiles[0].text}:{contentType:'text/html',body:'<!doctype html><style>body{margin:0}canvas{display:block;width:1280px;height:720px}#hud{position:absolute;top:12px;left:12px;color:white;background:#18132699;padding:8px}#controller{display:none}</style><canvas></canvas><div id="hud"></div><div id="controller"></div><script type="module" src="/scene.js"></script>'}));
 await page.goto('http://transition.local/');await page.waitForFunction(()=>window.setup);
 for(const stage of [0,9,31,58]){
  const before=await page.evaluate(stage=>window.setup(stage),stage),after=await page.evaluate(()=>window.advance());
  assert.equal(after.stage,stage+1);assert.equal(after.visualStage,stage+1);assert.equal(after.checkpoint,0);assert.equal(after.cleared,before.cleared+1);assert.equal(after.retry,0);assert.equal(after.breaks,0);
  assert.doesNotMatch(await page.locator('#hud').innerText(),/checkpoint|\b\d+\s*\/\s*\d+|persen|%/i);
  assert.equal(await page.locator('#controller [data-do="next"]').count(),0);assert.equal(await page.locator('#controller .glass-key').count(),4);assert.equal(await page.locator('canvas').getAttribute('data-world-text-labels'),'0');assert.equal(await page.locator('canvas').getAttribute('data-render-error'),null);
  results.push({from:before.stage+1,to:after.stage+1,sameTick:true,oldStageInterpolation:false,confirmation:false});
 }
 await page.locator('canvas').screenshot({path:'src/games/glass/evidence/kaca-instant-stage.png'});assert.deepEqual(errors,[]);
 const report={tanggal:'2026-11-15',hasil:'lulus',results,errors,batas:'Fixture browser Chromium di checkpoint akhir sintetis. Menguji satu tick logika permainan, renderer/interpolasi, HUD dan markup kontrol; bukan penuntasan rute melalui dua HP.'};await writeFile('src/games/glass/evidence/kaca-instant-stage-report.json',JSON.stringify(report,null,2)+'\n');console.log(report);
}finally{await browser.close();}
