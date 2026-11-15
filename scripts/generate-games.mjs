import {readdir,readFile,writeFile,mkdir,lstat} from 'node:fs/promises';
import {resolve,dirname} from 'node:path';import {fileURLToPath} from 'node:url';
export async function discoverGames(root=resolve(dirname(fileURLToPath(import.meta.url)),'..')){
 const directory=resolve(root,'src/games'),entries=await readdir(directory,{withFileTypes:true}),games=[],seen=new Set();
 for(const entry of entries.filter(e=>e.isDirectory()).sort((a,b)=>a.name.localeCompare(b.name))){
  if(!/^[a-z][a-z0-9-]{1,31}$/.test(entry.name)||['constructor','prototype'].includes(entry.name))throw Error(`ID folder game tidak valid: ${entry.name}`);
  let m;try{if(!(await lstat(resolve(directory,entry.name,'manifest.json'))).isFile())throw Error();m=JSON.parse(await readFile(resolve(directory,entry.name,'manifest.json'),'utf8'));}catch{throw Error(`Manifest wajib dan harus JSON valid: ${entry.name}`);}
  const required=['id','title','tag','description','duration','icon','color','layout','instructions'];if(m.schemaVersion!==1||m.players!==2||required.some(k=>typeof m[k]!=='string'||!m[k].trim())||m.id!==entry.name||seen.has(m.id))throw Error(`Kontrak/ID manifest tidak valid atau duplikat: ${entry.name}`);
  if(!/^#[0-9a-fA-F]{6}$/.test(m.color)||!m.menu||['title','line','genre'].some(k=>typeof m.menu[k]!=='string'||!m.menu[k])||m.order!==undefined&&!Number.isFinite(m.order))throw Error(`Metadata menu tidak valid: ${m.id}`);
  if(!m.input||!Array.isArray(m.input.axes)||m.input.axes.length>8||!m.input.axes.includes('x')||!m.input.axes.includes('y')||m.input.axes.some(k=>typeof k!=='string'||!/^[a-zA-Z][a-zA-Z0-9]{0,23}$/.test(k)||['__proto__','constructor','prototype'].includes(k))||new Set(m.input.axes).size!==m.input.axes.length||!Array.isArray(m.input.actions)||m.input.actions.length>24||m.input.actions.some(k=>typeof k!=='string'||!/^[a-z][a-z0-9-]{0,31}$/.test(k))||new Set(m.input.actions).size!==m.input.actions.length)throw Error(`Schema input tidak valid: ${m.id}`);
  if(m.developer&&(typeof m.developer.keyboard!=='boolean'||!Number.isInteger(m.developer.maxLevel)||m.developer.maxLevel<1||m.developer.maxLevel>10000))throw Error(`Kapabilitas developer tidak valid: ${m.id}`);
  for(const file of ['server.ts','client.ts','console.ts','controller.ts','hud.ts','style.css','AGENTS.md','README.md','STATUS.md']){try{if(!(await lstat(resolve(directory,m.id,file))).isFile())throw Error();}catch{throw Error(`Berkas modul wajib tidak ditemukan: ${m.id}/${file}`);}}
  const tests=await readdir(resolve(directory,m.id,'tests')).catch(()=>[]);if(!tests.some(name=>name.endsWith('.test.ts')))throw Error(`Game wajib memiliki tes sendiri: ${m.id}`);
  seen.add(m.id);games.push(m);
 }
 if(!games.length)throw Error('Minimal satu game harus terdaftar.');
 return games.sort((a,b)=>(a.order??1000)-(b.order??1000)||a.id.localeCompare(b.id));
}
export async function generateGames(root=resolve(dirname(fileURLToPath(import.meta.url)),'..')){
 const games=await discoverGames(root),out=resolve(root,'src/generated');await mkdir(out,{recursive:true});
 const banner='// GENERATED — jangan diedit/commit. Sumber: src/games/*/manifest.json\n';
 await writeFile(resolve(out,'catalog.ts'),banner+`import type {GameManifest} from '../shared/game-contracts.ts';\nexport const catalog:GameManifest[]=${JSON.stringify(games,null,2)};\n`);
 for(const kind of ['server','client']){const names=games.map((g,i)=>({id:g.id,name:'game'+i}));const imports=names.map(g=>`import ${g.name} from '../games/${g.id}/${kind}.ts';`).join('\n');await writeFile(resolve(out,`${kind}-registry.ts`),banner+`import type {Game${kind==='server'?'Server':'Client'}} from '../shared/game-contracts.ts';\n${imports}\nexport const games:Record<string,Game${kind==='server'?'Server':'Client'}>={${names.map(g=>`'${g.id}':${g.name}`).join(',')}};\n`);}
 return games;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const games=await generateGames();console.log(`Registry dibuat: ${games.length} modul; tidak ada daftar game yang diedit manual.`);}
