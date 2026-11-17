import {arenaSourceHash} from './arena-source.mjs';
// Atlas lintasan dan fixture render: posisi sintetis, bukan playtest.
import {build} from 'esbuild';import {chromium} from '@playwright/test';import {writeFile} from 'node:fs/promises';import assert from 'node:assert/strict';
import {createGame} from '../../../platform/game-runtime.ts';import {glassCourse} from '../glass.ts';import {createGlassRoute,routePoint} from '../glass-route.ts';import {glassLevels,glassMovingKinds} from '../glass-levels.ts';import {planGlassCamera} from '../glass-camera.ts';import {challengePose} from './glass-challenge-check.mjs';
const root='src/games/glass/evidence',errors=[],sourceHash=await arenaSourceHash();
const bundle=await build({stdin:{resolveDir:process.cwd(),contents:`import {draw3D} from './src/platform/scene3d.ts';let id=0;window.show=g=>draw3D(document.querySelector('canvas'),g,0,{instance:String(++id),reduced:true});`},bundle:true,write:false,platform:'browser',format:'esm'});
const browser=await chromium.launch({executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE||'/usr/sbin/chromium',headless:true,args:['--no-sandbox','--use-gl=angle','--use-angle=gl']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:720}});page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',async route=>{const u=new URL(route.request().url());assert.equal(u.hostname,'arena.local');return route.fulfill(u.pathname==='/view.js'?{contentType:'text/javascript',body:bundle.outputFiles[0].text}:{contentType:'text/html',body:'<!doctype html><style>body{margin:0;background:#111d2b}canvas{display:block;width:1280px;height:720px}</style><canvas></canvas><script type="module" src="/view.js"></script>'});});
 await page.goto('http://arena.local');await page.waitForFunction(()=>window.show);
 const samples=[...Array.from({length:6},(_,stage)=>({stage,kind:glassLevels[stage].challenges[0]})),...['iris','scissor','breathing','weave','tiltWeave','turntable'].map(kind=>({stage:glassLevels.findIndex(l=>l.challenges.includes(kind)),kind}))];
 const results=[];
 for(const {stage,kind} of samples){
  const g=createGame('glass','relaxed',stage+1,42),c=glassCourse(stage),e=c.encounters.find(e=>e.kind===kind),pose=challengePose(c,e.s-(['weave','tiltWeave','turntable'].includes(kind)?10:4),kind==='weave'?'roll':['roll','raise','duck','split'].includes(kind)?kind:'walk');
  g.players=g.players.map((p,i)=>({...p,...pose.players[i]}));g.pane=pose.pane;g.camera=planGlassCamera(g,c,1/60,true);g.camera.y+=1.5;
  if(['iris','scissor','breathing'].includes(kind)){const o=c.obstacles.find(o=>e.props.includes(o.id));g.elapsed=((.775-o.phase/(Math.PI*2))%1+1)%1*o.period;}
  await page.evaluate(g=>window.show(g),g);assert.equal(await page.locator('canvas').getAttribute('data-render-error'),null);const file=`pacing-${String(stage+1).padStart(2,'0')}-${kind}.png`;await page.screenshot({path:`${root}/${file}`});results.push({stage:stage+1,kind,file});
 }
 const reports=[];let svg='<svg xmlns="http://www.w3.org/2000/svg" width="2160" height="2820" viewBox="0 0 2160 2820"><rect width="2160" height="2820" fill="#101b2a"/><text x="24" y="35" fill="#f6e2bd" font-size="25" font-family="sans-serif">KACA BERDUA — 60 SILUET ARENA / peta, bukan cuplikan gameplay</text>';
 const colors=['#efbf84','#82c89f','#e69b80','#daa070','#a4b6ee','#c1e4ec'];
 for(let stage=0;stage<60;stage++){
  const r=createGlassRoute(stage),l=glassLevels[stage],x=(stage%6)*360,y=60+Math.floor(stage/6)*276,w=r.bounds.maxX-r.bounds.minX-48,h=r.bounds.maxZ-r.bounds.minZ-48,scale=Math.min(305/Math.max(w,1),185/Math.max(h,1)),tx=x+180-(r.bounds.minX+24+w/2)*scale,ty=y+126-(r.bounds.minZ+24+h/2)*scale,xy=p=>`${(p.x*scale+tx).toFixed(1)},${(p.z*scale+ty).toFixed(1)}`;
  svg+=`<rect x="${x+6}" y="${y}" width="348" height="267" rx="12" fill="#192a3d"/><text x="${x+16}" y="${y+24}" font-family="sans-serif" font-size="15" fill="${colors[l.biome]}">${stage+1}. ${l.name.replaceAll('&','&amp;')}</text><polyline points="${r.points.filter((_,i)=>i%4===0).map(xy).join(' ')}" fill="none" stroke="${colors[l.biome]}" stroke-width="5" stroke-linejoin="round"/>`;
  r.encounters.forEach((s,i)=>{const p=routePoint(r,s),kind=l.challenges[i],special=['iris','scissor','breathing'].includes(kind);svg+=`<circle cx="${p.x*scale+tx}" cy="${p.z*scale+ty}" r="${special?4:2.6}" fill="${special?'#e9a2ef':glassMovingKinds.has(kind)||['ferry','sideFerry','lift'].includes(kind)?'#f4b57d':'#7cd1d7'}"/>`;});
  svg+=`<text x="${x+16}" y="${y+245}" font-family="sans-serif" font-size="11" fill="#d0dae3">${l.arena} · ${l.segments.map(s=>s.challenges.length).join('/')} encounter</text>`;
  reports.push({stage:stage+1,name:l.name,arena:l.arena,headings:r.headings,segments:l.segments.map(s=>s.challenges),grade:l.grade,tempo:l.tempo,length:r.length});
 }
 svg+='</svg>';await writeFile(`${root}/pacing-atlas.svg`,svg);
 await page.unroute('**/*');await page.setViewportSize({width:2160,height:2820});await page.setContent(`<style>body{margin:0}</style>${svg}`);await page.screenshot({path:`${root}/pacing-atlas.png`});assert.deepEqual(errors,[]);
 assert.equal(await arenaSourceHash(),sourceHash);await writeFile(`${root}/pacing-design-report.json`,JSON.stringify({result:'PASS',sourceHash,stages:reports,fixtures:results,errors,limitation:'Atlas geometri dan fixture statis, bukan perjalanan input atau penilaian keseruan manusia.'},null,2)+'\n');console.log('PASS: 60 siluet dan 12 fixture scene.');
}finally{await browser.close();}
