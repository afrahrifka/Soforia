// Cuplikan dari perjalanan input utuh. Hook observasi hanya membaca state sebelum tick berikutnya.
import {build} from 'esbuild';import {chromium} from '@playwright/test';
import {readFile,writeFile,mkdir,rename} from 'node:fs/promises';import {spawn,execFileSync} from 'node:child_process';import {once} from 'node:events';import {homedir} from 'node:os';import {join} from 'node:path';import assert from 'node:assert/strict';
import {createGame} from '../../../platform/game-runtime.ts';import {glassCourse,glassWorlds} from '../glass-world.ts';import {glassLevels} from '../glass-levels.ts';import {driveGlassCourse} from './glass-route-driver.mjs';import {arenaSourceHash} from './arena-source.mjs';
const root='src/games/glass',fps=24,sourceHash=await arenaSourceHash(),stamp=new Date().toISOString().replace(/\D/g,'').slice(0,14),videoDir=join(homedir(),'Videos','Soforia');
await mkdir(videoDir,{recursive:true});const video=join(videoDir,`carry-the-glass-pacing-review-${stamp}.mp4`);
const audit=JSON.parse(await readFile(`${root}/evidence/pacing-progression-report.json`,'utf8'));assert.equal(audit.result,'PASS');assert.equal(audit.sourceHash,sourceHash,'Audit arena harus cocok dengan source aktif.');
const names={weave:'Slalom tiga bukaan',tiltWeave:'Tukar sisi tinggi-rendah',turntable:'Jembatan putar',raise:'Angkat muatan',jump:'Lompat bersama',traffic:'Arus silang',threadHop:'Satu baris + lompat terpisah',duck:'Ratakan lalu merunduk',roll:'Guling dan ubah formasi',threadBridge:'Pijakan sempit beruntun',stepping:'Jembatan putus',logSwing:'Batang berayun',split:'Tinggi dua sisi berbeda',zipper:'Piston bergantian',sweeper:'Batang penyapu',ferry:'Feri maju-mundur',axe:'Kapak berayun',lift:'Lift dua tebing',scissor:'Bilah gunting',crusher:'Rahang mesin',sideFerry:'Feri menyamping',hammer:'Palu berputar',iris:'Iris bintang',breathing:'Dinding bernapas',threadHammer:'Satu baris + palu'};
const selected=[0,1,2,3,4,5,6,9,12,14,17,36,59],seen=new Set(),coverage=new Set(),clips=[],runs=[];
for(const stage of selected){
 const c=glassCourse(stage),l=glassLevels[stage],ranges=[];
 if(stage===0)ranges.push({from:0,to:c.checkpoints[0]+1});
 for(const e of c.encounters)if(!seen.has(e.kind)){seen.add(e.kind);ranges.push({from:e.s-8,to:e.s+7});}
 if(stage===5)ranges.push({from:c.encounters[0].s-8,to:c.encounters[0].s+7});
 if(stage===36||stage===59){const group=stage===59?l.segments.length-1:2;const es=c.encounters.filter(e=>e.group===group);ranges.push({from:es[0].s-12,to:c.checkpoints[group]+1});}
 ranges.sort((a,b)=>a.from-b.from);const windows=[];for(const r of ranges){const last=windows.at(-1);if(last&&r.from<=last.to+2)last.to=Math.max(last.to,r.to);else windows.push({...r});}
 const g=createGame('glass','relaxed',stage+1,42);let elapsed=g.elapsed,nextSample=0,active=null,clip=null;
 function observe(){
  if(g.stage!==stage)return;const s=g.progress,range=windows.find(w=>s>=w.from&&s<=w.to);if(!range)return;
  if(active!==range){active=range;nextSample=elapsed;clip={stage:stage+1,title:l.name,biome:glassWorlds[c.world].name,fromS:range.from,toS:range.to,sourceFrom:elapsed,sourceTo:elapsed,frames:[],kinds:c.encounters.filter(e=>e.s>=range.from&&e.s<=range.to).map(e=>e.kind)};clips.push(clip);}
  if(elapsed+1e-7<nextSample)return;nextSample+=1/fps;clip.sourceTo=elapsed;
  const near=c.encounters.reduce((best,e)=>Math.abs(e.s-s)<Math.abs(best.s-s)?e:best,c.encounters[0]);
  for(const e of c.encounters)if(Math.abs(e.s-s)<.2)coverage.add(e.kind);
  const state=structuredClone(g);clip.frames.push({g:state,caption:Math.abs(near.s-s)<13?(names[near.kind]??near.kind):'Perjalanan dan perubahan formasi',kind:near.kind});
 }
 Object.defineProperty(g,'elapsed',{enumerable:true,configurable:true,get:()=>elapsed,set:value=>{observe();elapsed=value;}});
 const result=driveGlassCourse(g);observe();assert.equal(g.breaks,0);assert.equal(g.stagesCompleted,1);
 const expected=audit.results.find(r=>r.stage===stage+1);assert.equal(result.ticks,expected.ticks,'Observasi tidak boleh mengubah perjalanan/timing input.');
 runs.push({stage:stage+1,ticks:result.ticks,expectedTicks:expected.ticks,completed:true,breaks:g.breaks,actions:result.actions});console.log(`Simulasi ${stage+1}: PASS, ${clips.filter(c=>c.stage===stage+1).reduce((n,c)=>n+c.frames.length,0)} frame dipilih.`);
}
assert.equal(coverage.size,25);assert.equal(await arenaSourceHash(),sourceHash);assert.ok(clips.every(c=>c.frames.length>0));
let totalFrames=0;const introFrames=fps*1.5;
const chapters=clips.map((c,i)=>{const chapter={index:i+1,stage:c.stage,title:`${c.stage}. ${c.title} · ${c.kinds.map(k=>names[k]).join(' + ')}`,seconds:totalFrames/fps,sourceFrom:c.sourceFrom,sourceTo:c.sourceTo,fromS:c.fromS,toS:c.toS,kinds:c.kinds,speed:1};totalFrames+=introFrames+c.frames.length;return chapter;});
console.log(`Rencana video: ${clips.length} bab, ${totalFrames} frame, ${(totalFrames/fps).toFixed(1)} detik; 25 jenis rintangan.`);
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`
import {draw3D} from './src/platform/scene3d.ts';import client from './${root}/client.ts';
window.show=(f,time,stage,biome,intro)=>{draw3D(document.querySelector('canvas'),f.g,time);document.querySelector('#hud').innerHTML=client.hud({game:f.g});document.querySelector('#meta').textContent='SIMULASI INPUT · '+(intro?'PENGANTAR / WAKTU DITAHAN':'1× · CUPLIKAN RUTE')+' · STAGE '+stage+' / 60';document.querySelector('#caption').textContent=biome+' · '+f.caption;const g=f.g;document.querySelector('#detail').textContent='Guling '+Math.round(g.pane.roll*180/Math.PI)+'° · Pegangan A '+g.players[0].gripHeight.toFixed(2)+' / B '+g.players[1].gripHeight.toFixed(2)+' · '+g.players.map((p,i)=>(i?'B':'A')+(p.grounded?' menapak':' lompat')).join(' · ')+' · t '+g.elapsed.toFixed(1)+'s';};
`},bundle:true,write:false,platform:'browser',format:'esm'});
const css=await readFile('dist/public/style.css','utf8'),errors=[],failed=[],external=[];
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox',...(process.env.GLASS_SOFTWARE_RENDER==='1'?[]:['--use-gl=angle','--use-angle=gl'])]});
const encoder=spawn('ffmpeg',['-y','-hide_banner','-loglevel','error','-f','image2pipe','-vcodec','mjpeg','-framerate',String(fps),'-i','pipe:0','-an','-c:v','libx264','-preset','fast','-crf','19','-pix_fmt','yuv420p','-movflags','+faststart',video],{stdio:['pipe','ignore','pipe']});let encoderErrors='';encoder.stderr.on('data',s=>encoderErrors+=s);const encoded=once(encoder,'close');
try{
 const page=await browser.newPage({viewport:{width:1280,height:720},deviceScaleFactor:1});page.on('pageerror',e=>errors.push(e.message));page.on('requestfailed',r=>failed.push(r.url()));
 await page.route('**/*',async route=>{const u=new URL(route.request().url());if(u.hostname!=='glass-review.local'){external.push(u.href);return route.abort();}if(u.pathname==='/bundle.js')return route.fulfill({contentType:'text/javascript',body:bundle.outputFiles[0].text});return route.fulfill({contentType:'text/html',body:`<!doctype html><meta charset="utf-8"><style>${css}#view{position:fixed;inset:0}canvas{display:block;width:100%;height:100%}#review{position:absolute;top:18px;left:50%;transform:translateX(-50%);width:590px;padding:10px 16px;background:#132536ec;border-radius:14px;text-align:center;color:#f7e6c7;font:15px system-ui}#meta{display:block;font-size:10px;letter-spacing:1px;color:#ace2dc;margin-bottom:6px}#detail{position:absolute;bottom:15px;left:50%;transform:translateX(-50%);padding:9px 16px;background:#132536e8;border-radius:12px;color:#e3dfd4;font:12px system-ui;white-space:nowrap}</style><div id="view" data-game-scope="glass"><canvas></canvas><div id="hud" class="game-hud"></div><div id="review"><small id="meta"></small><span id="caption"></span></div><div id="detail"></div></div><script type="module" src="/bundle.js"></script>`});});
 await page.goto('http://glass-review.local');await page.waitForFunction(()=>window.show);const cdp=await page.context().newCDPSession(page);let frameIndex=0;
 const write=async jpg=>{if(!encoder.stdin.write(jpg))await once(encoder.stdin,'drain');frameIndex++;};
 for(const [i,clip] of clips.entries()){
  const show=async(f,intro=false)=>{await page.evaluate(({f,time,stage,biome,intro})=>window.show(f,time,stage,biome,intro),{f,time:frameIndex/fps,stage:clip.stage,biome:clip.biome,intro});assert.equal(await page.evaluate(()=>document.querySelector('canvas').getAttribute('data-render-error')),null);const shot=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:88,fromSurface:true});return Buffer.from(shot.data,'base64');};
  const intro=await show(clip.frames[0],true);for(let n=0;n<introFrames;n++)await write(intro);
  for(const f of clip.frames){await write(await show(f));if(frameIndex%300===0)console.log(`Render ${frameIndex}/${totalFrames} · stage ${clip.stage}`);}
  console.log(`Bab ${i+1}/${clips.length}: stage ${clip.stage} selesai.`);
 }
 assert.equal(frameIndex,totalFrames);encoder.stdin.end();const [code]=await encoded;assert.equal(code,0,encoderErrors);assert.deepEqual(errors,[]);assert.deepEqual(failed,[]);assert.deepEqual(external,[]);assert.equal(await arenaSourceHash(),sourceHash);
 const metadata=';FFMETADATA1\ntitle=Carry the Glass — Review Arena dan Gameplay\n'+chapters.map((c,i)=>`[CHAPTER]\nTIMEBASE=1/1000\nSTART=${Math.round(c.seconds*1000)}\nEND=${Math.round((chapters[i+1]?.seconds??totalFrames/fps)*1000)}\ntitle=${c.title}\n`).join('');
 const metaPath=`${root}/evidence/video-pacing-review-chapters.ffmetadata`;await writeFile(metaPath,metadata);const packaged=video.replace('.mp4','-packaged.mp4');execFileSync('ffmpeg',['-y','-hide_banner','-loglevel','error','-i',video,'-i',metaPath,'-map','0:v:0','-map_metadata','1','-map_chapters','1','-c','copy','-movflags','+faststart',packaged]);await rename(packaged,video);
 execFileSync('ffmpeg',['-hide_banner','-v','error','-i',video,'-map','0:v:0','-f','null','-']);const probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_format','-show_streams','-show_chapters','-of','json',video],{encoding:'utf8'}));assert.equal(probe.chapters.length,chapters.length);assert.equal(Number(probe.streams[0].nb_frames),totalFrames);
 const report={result:'PASS',video,sourceHash,fps,width:1280,height:720,frames:totalFrames,duration:Number(probe.format.duration),bytes:Number(probe.format.size),fullDecode:'PASS',chapters,selectedStages:selected.map(i=>i+1),coverage:[...coverage].sort(),runs,errors,failed,external,limitation:'Montase cuplikan dari rute input nyata, bukan seluruh kampanye 60 stage. Setiap stage sampel dijalankan dari spawn sampai selesai tanpa teleport/kekebalan; jumlah tick sama dengan audit arena. Potongan antar-bab menghilangkan sebagian perjalanan. Gameplay cuplikan 1×; pengantar 1,5 detik menahan simulasi. Render offline 24 fps tanpa audio; bukan playtest manusia, dua HP fisik, FPS realtime atau latensi.'};
 await writeFile(`${root}/evidence/video-pacing-review-report.json`,JSON.stringify(report,null,2)+'\n');const time=s=>`${String(Math.floor(s/60)).padStart(2,'0')}:${String(Math.floor(s%60)).padStart(2,'0')}`;
 await writeFile(`${root}/evidence/VIDEO-ARENA-REVIEW.md`,`# Carry the Glass — review gameplay\n\n[Video MP4](${video}) · 1280×720 · 24 fps · ${time(report.duration)} · tanpa audio.\n\n${report.limitation}\n\n| Mulai | Stage | Rintangan |\n|---|---|---|\n${chapters.map(c=>`| ${time(c.seconds)} | ${c.stage} | ${c.kinds.map(k=>names[k]).join(', ')} |`).join('\n')}\n\nFokus review: keterbacaan gerak kamera, jarak badan/kaca, waktu mengubah formasi, kesempatan membaca bukaan mesin, kenyamanan lompat terpisah, durasi menunggu dan rangkaian final. Pemain sintetis mengetahui solusi dan fase di muka; rekaman ini belum membuktikan kelayakan bagi pemain baru.\n`);console.log(`PASS ${video}`);
}finally{encoder.stdin.destroy();if(encoder.exitCode===null)encoder.kill();await browser.close();}
