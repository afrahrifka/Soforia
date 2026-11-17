// Video review deterministik: server asli, input analog/aksi; tanpa teleportasi.
import {build} from 'esbuild';
import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {spawn,execFileSync} from 'node:child_process';
import {once} from 'node:events';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {join,basename} from 'node:path';
import assert from 'node:assert/strict';
import server from '../server.ts';
import {packageReview} from './package-review.mjs';
import {LEVELS,findTile} from '../levels.ts';
import {fresh,path} from './solve.ts';
const root='src/games/jam-berulang',fps=24,frames=[],chapters=[];
const reviewStamp=new Date().toISOString().replace(/\D/g,'').slice(0,14),reportPath=`${root}/evidence/video-arena-review-report.json`;
const fingerprint=async()=>{const hash=createHash('sha256');for(const name of ['server.ts','levels.ts','console.ts','scenery.ts','hud.ts'])hash.update(await readFile(`${root}/${name}`)).update('\0');return hash.digest('hex');};
const sourceHash=await fingerprint();
const g=fresh();let caption='',speed=1,budget=0;
const capture=(paused=false)=>frames.push({g:structuredClone(server.publicState(g)),caption,speed,paused});
function hold(seconds,text){caption=text;for(let n=0;n<Math.round(seconds*fps);n++)capture(true);}
function tick(dt,x=0,y=0){g.elapsed+=dt;server.tick(g,[{x,y},{x:0,y:0}],dt);budget+=dt;while(budget>=speed/fps-1e-8){budget-=speed/fps;capture();}}
function walk(target,text){caption=text;const route=path(g,target);assert.ok(route);for(const p of route){let n=0;while(Math.hypot(g.runner.x-p.x,g.runner.y-p.y)>.025){assert.ok(n++<4000,'Rute tersangkut');const dx=p.x-g.runner.x,dy=p.y-g.runner.y,dist=Math.hypot(dx,dy);tick(Math.min(.025,dist/3.1),dx/dist,dy/dist);}}}
function action(slot,name,text){server.action(g,slot,name);hold(1.2,text);}
for(let district=0;district<6;district++){
 assert.equal(g.district,district);speed=1;budget=0;
 chapters.push({district:district+1,title:LEVELS[district].title,seconds:frames.length/fps,speed});
 hold(district===0?3:1.5,`${LEVELS[district].title} · alur lengkap 1×`);
 for(const [plate,gate] of LEVELS[district].objectives){
  const p=findTile(district,plate);if(!p)continue;
  walk(p,`A · Berjalan ke pelat ${plate}; posisi ini sedang direkam`);
  action(1,'record',`B · Kunci rekaman saat A berada di pelat ${plate}`);
  action(1,'rewind','B · Ulang menit; A kembali ke titik awal sesuai aturan');
  action(1,'replay',`B · Putar jejak; gema mengulang perjalanan menuju ${plate}`);
  const duration=g.traces[g.selected].duration;caption=`Gema menuju ${plate} · A menunggu replay dan jendela gerbang ${gate}`;
  for(let i=0;i<Math.ceil(duration/.025)+2;i++)tick(.025);
  for(let n=0;!g.open.includes(gate)&&n<2500;n++)tick(.025);
  assert.ok(g.open.includes(gate));hold(1.5,`Pelat ${plate} aktif · Gerbang ${gate} terbuka`);
  walk(findTile(district,gate),`A · Menyeberangi ${gate} sementara gema menahan ${plate}`);
  assert.ok(g.latched.includes(gate));hold(1.2,`Gerbang ${gate} kini terkait permanen`);
 }
 for(const c of ['a','b','c']){walk(findTile(district,c),`A · Menuju roda ${c}`);action(0,'interact',`A · Ambil roda ${c} — inventaris ${g.collected.length}/3`);}
 assert.equal(g.collected.length,3);walk(findTile(district,'E'),'A · Bawa tiga roda menuju menara E');
 hold(1.5,'Tiga roda lengkap · A memasang roda pada menara');server.action(g,0,'interact');
 assert.ok(g.finished||g.district===district+1);
}
assert.equal(g.finished,true);hold(3,'Enam distrik selesai · Tinjau keterbacaan, gerak, kamera dan kerja sama');
console.log(`Rencana: ${frames.length} frame / ${(frames.length/fps).toFixed(1)} detik, enam distrik melalui input/aksi asli.`);
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
import {draw3D} from './src/platform/scene3d.ts';
import client from './${root}/client.ts';import server from './${root}/server.ts';
const original=client.buildConsole;client.buildConsole=(g,k)=>{original(g,k);window.assets=k.world.userData.jamAssets;};
window.show=(f,time)=>{draw3D(document.querySelector('canvas'),f.g,time);document.querySelector('#game-hud').innerHTML=client.hud({game:f.g});document.querySelector('#caption').textContent=f.caption;document.querySelector('#telemetry').textContent='SIMULASI INPUT · '+(f.paused?'JEDA PENJELASAN':f.speed+'×')+' · A: '+f.g.runner.x.toFixed(1)+', '+f.g.runner.y.toFixed(1)+' · GERBANG '+(f.g.open.join('/')||'—')+' · ARSIP '+f.g.traceCount;};
`},bundle:true,write:false,platform:'browser',format:'esm'});
const css=await readFile('dist/public/style.css','utf8'),errors=[],requests=[],assetFailures=[];
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox',...(process.env.JAM_SOFTWARE_RENDER==='1'?[]:['--use-gl=angle','--use-angle=gl'])]});
await mkdir(`${root}/evidence`,{recursive:true});const videoDir=join(homedir(),'Videos','Soforia');await mkdir(videoDir,{recursive:true});const video=join(videoDir,`jam-berulang-arena-review-${reviewStamp}.mp4`);
const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe']});let encodingErrors='';encoder.stderr.on('data',s=>encodingErrors+=s);const encoded=once(encoder,'close');
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>requests.push(r.url()));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());assert.equal(u.hostname,'review.local','Permintaan internet tidak diizinkan');if(u.pathname==='/bundle.js')return route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});if(u.pathname.startsWith('/games/jam-berulang/assets/'))return route.fulfill({body:await readFile('src'+u.pathname),contentType:u.pathname.endsWith('.gltf')?'model/gltf+json':'image/jpeg'});return route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>${css}#view{position:fixed;inset:0}canvas{width:100%;height:100%;display:block}#review{position:absolute;top:24px;left:50%;transform:translateX(-50%);width:440px;padding:10px 16px;border-radius:12px;background:#102435ee;color:#fff0d5;text-align:center;font:14px system-ui;box-shadow:0 6px 24px #0004}#telemetry{display:block;font-size:10px;letter-spacing:.7px;margin-bottom:7px;color:#b7e3dc}</style><div id="view" data-game-scope="jam-berulang"><canvas></canvas><div id="game-hud" class="game-hud"></div><div id="review"><small id="telemetry"></small><span id="caption"></span></div></div><script type="module" src="/bundle.js"></script>`});});
 await page.goto('http://review.local');await page.waitForFunction(()=>window.show);let district=-1,lastKey='',lastJpg;const cdp=await page.context().newCDPSession(page);
 for(let i=0;i<frames.length;i++){
  const frame=frames[i],key=frame.paused?JSON.stringify([frame.g.district,frame.g.elapsed,frame.caption]):String(i);
  if(key===lastKey){if(!encoder.stdin.write(lastJpg))await once(encoder.stdin,'drain');continue;}
  await page.evaluate(({frame,time})=>window.show(frame,time),{frame,time:i/fps});
  if(district!==frame.g.district){district=frame.g.district;await page.waitForFunction(()=>window.assets?.pending===0);assetFailures.push(...await page.evaluate(()=>window.assets.failed));await page.evaluate(({frame,time})=>window.show(frame,time),{frame,time:i/fps});}
  assert.equal(await page.evaluate(()=>document.querySelector('canvas').getAttribute('data-render-error')),null);
  const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88,fromSurface:true});const jpg=Buffer.from(shot.data,'base64');lastKey=key;lastJpg=jpg;if(!encoder.stdin.write(jpg))await once(encoder.stdin,'drain');
  if(i===Math.round(chapters[district].seconds*fps))await page.screenshot({path:join(videoDir,basename(video,'.mp4')+`-district-${district+1}.png`)});
  if(i%150===0)console.log(`Render ${i}/${frames.length} · distrik ${district+1}`);
 }
 encoder.stdin.end();const [code]=await encoded;assert.equal(code,0,encodingErrors);assert.deepEqual(errors,[]);assert.deepEqual(requests,[]);assert.deepEqual(assetFailures,[]);
 const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-of','json',video],{encoding:'utf8'}));
 assert.equal(probe.streams[0].width,1280);assert.equal(probe.streams[0].height,720);assert.equal(Number(probe.streams[0].nb_frames),frames.length);
 assert.equal(await fingerprint(),sourceHash,'Source berubah selama rekaman');
 await writeFile(reportPath,JSON.stringify({result:'PASS',sourceHash,video,frames:frames.length,fps,duration:Number(probe.format.duration),bytes:Number(probe.format.size),codec:probe.streams[0].codec_name,chapters,completed:g.completed,errors,requests,assetFailures,limitation:'Render offline fixed-step 24 fps, tanpa audio. Seluruh distrik 1×, jeda penjelasan membekukan waktu simulasi. Semua perjalanan/gerbang melalui input dan aksi server asli; reset posisi hanya rewind/transisi aturan game. Bukan playtest manusia, dua HP fisik atau benchmark FPS/latensi.'},null,2)+'\n');
 await packageReview({reportPath,notesPath:`${root}/evidence/VIDEO-ARENA-REVIEW.md`});console.log(`PASS ${video}`);
}finally{encoder.stdin.destroy();if(encoder.exitCode===null)encoder.kill();await browser.close();}
