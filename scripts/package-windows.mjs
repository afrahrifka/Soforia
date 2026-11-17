/**
 * Membuat satu file executable (Node SEA) yang membawa server, game, dan aset.
 * Build mesin boleh mengunduh runtime resmi Node.js satu kali; pengguna akhir tidak
 * membutuhkan Node, npm, browser bawaan proyek, atau dependency lain.
 *
 * Contoh:
 *   npm run package:windows
 *   node scripts/package-windows.mjs --target linux-x64 --smoke
 */
import {build} from 'esbuild';
import {execFileSync,spawn} from 'node:child_process';
import {createHash} from 'node:crypto';
import {chmodSync,copyFileSync,existsSync,mkdirSync,mkdtempSync,readFileSync,readdirSync,rmSync,statSync,writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {basename,dirname,join} from 'node:path';
import {ASSET,packArchive} from './sea/archive.mjs';

const NODE_VERSION='v22.23.5';
const SEA_FUSE='NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';
const ROOT=process.cwd(),ARTIFACTS=join(ROOT,'artifacts'),CACHE=join(ARTIFACTS,'runtime-cache');
const version=JSON.parse(readFileSync(join(ROOT,'package.json'),'utf8')).version;
const args=process.argv.slice(2);
const option=(name,fallback)=>{const index=args.indexOf('--'+name);return index<0?fallback:args[index+1];};
const target=option('target','windows-x64'),smoke=args.includes('--smoke');
if(!['windows-x64','linux-x64'].includes(target))throw Error('Target hanya windows-x64 atau linux-x64.');
if(!existsSync(join(ROOT,'dist','public','index.html')))throw Error('dist belum ada. Jalankan npm run build terlebih dahulu.');
mkdirSync(CACHE,{recursive:true});

function sha256(data){return createHash('sha256').update(data).digest('hex');}
async function officialFile(name,label){
 const cachePath=join(CACHE,name);
 let data;
 try{data=readFileSync(cachePath);}catch{
  const url='https://nodejs.org/dist/'+NODE_VERSION+'/'+name;
  process.stdout.write('Mengunduh '+label+' resmi satu kali... ');
  const response=await fetch(url);
  if(!response.ok)throw Error('Unduhan '+label+' gagal: HTTP '+response.status);
  data=Buffer.from(await response.arrayBuffer());mkdirSync(dirname(cachePath),{recursive:true});writeFileSync(cachePath,data);console.log('ok');
 }
 const sums=await (await fetch('https://nodejs.org/dist/'+NODE_VERSION+'/SHASUMS256.txt')).text();
 const expected=sums.split('\n').find(line=>line.endsWith('  '+name))?.split(/\s+/)[0];
 if(!expected||sha256(data)!==expected)throw Error('Checksum '+label+' tidak cocok dengan SHASUMS256 resmi.');
 return cachePath;
}
async function runtime(){
 if(target==='windows-x64')return {exe:await officialFile('win-x64/node.exe','Node.js Windows x64'),kind:'pe'};
 const archive=await officialFile('node-'+NODE_VERSION+'-linux-x64.tar.xz','Node.js Linux x64');
 const unpack=join(ARTIFACTS,'runtime-cache','node-'+NODE_VERSION+'-linux-x64');
 if(!existsSync(join(unpack,'bin','node'))){mkdirSync(unpack,{recursive:true});execFileSync('tar',['-xJf',archive,'-C',unpack,'--strip-components=1']);}
 return {exe:join(unpack,'bin','node'),kind:'elf'};
}
async function blobRuntime(){
 if(process.version===NODE_VERSION)return process.execPath;
 if(process.platform==='win32')return (await runtime()).exe;
 if(process.platform==='linux'&&process.arch==='x64'){
  const archive=await officialFile('node-'+NODE_VERSION+'-linux-x64.tar.xz','Node.js Linux x64');
  const unpack=join(ARTIFACTS,'runtime-cache','node-'+NODE_VERSION+'-linux-x64');
  if(!existsSync(join(unpack,'bin','node'))){mkdirSync(unpack,{recursive:true});execFileSync('tar',['-xJf',archive,'-C',unpack,'--strip-components=1']);}
  return join(unpack,'bin','node');
 }
 throw Error('Build lintas platform memerlukan host Linux x64 atau Windows dengan Node '+NODE_VERSION+'.');
}
function walk(dir,prefix=''){
 const result=[];
 for(const entry of readdirSync(dir,{withFileTypes:true}).sort((a,b)=>a.name.localeCompare(b.name))){
  const path=join(dir,entry.name),name=prefix?prefix+'/'+entry.name:entry.name;
  if(entry.isDirectory())result.push(...walk(path,name));
  else if(entry.isFile())result.push({abs:path,path:name,size:statSync(path).size});
  else throw Error('Entri tidak didukung dalam paket: '+path);
 }
 return result;
}
async function nodeLicense(){
 const cachePath=join(CACHE,'node-LICENSE.txt');
 try{return readFileSync(cachePath,'utf8');}catch{
  const response=await fetch('https://raw.githubusercontent.com/nodejs/node/'+NODE_VERSION+'/LICENSE');
  if(!response.ok)return 'Node.js license: https://github.com/nodejs/node/blob/'+NODE_VERSION+'/LICENSE\n';
  const text=await response.text();writeFileSync(cachePath,text);return text;
 }
}
async function notices(){
 let text='# Bundled third-party notices\n\nMain Bareng source: MIT (lihat LICENSE). Model dan aset pihak ketiga tetap mengikuti lisensi masing-masing; lihat assets/ATTRIBUTION.md dan assets/KENNEY_License.txt.\n\n';
 text+='## Node.js runtime '+NODE_VERSION+'\n\n```text\n'+await nodeLicense()+'\n```\n\n';
 try{
  const tree=JSON.parse(execFileSync('npm',['ls','--omit=dev','--all','--json'],{encoding:'utf8',maxBuffer:8*1024*1024}));
  const seen=new Set();const visit=node=>{for(const [name,entry] of Object.entries(node.dependencies||{})){if(entry.version&&!seen.has(name+entry.version)){seen.add(name+entry.version);
   const dir=join(ROOT,'node_modules',name);if(!existsSync(dir))continue;const pkg=JSON.parse(readFileSync(join(dir,'package.json'),'utf8'));
   text+='## '+name+' '+pkg.version+'\n\nLicense: '+JSON.stringify(pkg.license||'see package')+'\n\n';
   for(const file of readdirSync(dir))if(/^(licen[cs]e|copying|notice)(\.|$)/i.test(file))text+='```text\n'+readFileSync(join(dir,file),'utf8')+'\n```\n\n';
  }visit(entry);}};visit(tree);
 }catch(error){text+='Production dependency licenses are listed in package-lock.json.\n\n';}
 return text;
}
async function makeArchive(){
 const files=walk(join(ROOT,'dist','public')).map(file=>({path:file.path,data:readFileSync(file.abs)}));
 files.push({path:'THIRD_PARTY_NOTICES.md',data:Buffer.from(await notices())});
 files.push({path:'LICENSE',data:readFileSync(join(ROOT,'LICENSE'))});
 return packArchive(files,version);
}
async function makeBundle(outFile){
 await build({entryPoints:[join(ROOT,'scripts','sea','entry.ts')],bundle:true,platform:'node',target:'node22',format:'cjs',outfile:outFile,logLevel:'warning',banner:{js:"process.env.MAIN_BARENG_TEST='1';"},define:{'process.env.MAIN_BARENG_SEA':'1'}});
}
function inject(exe,blob){
 const cli=join(ROOT,'node_modules','postject','dist','cli.js');
 if(!existsSync(cli))throw Error('postject belum terpasang. Jalankan npm ci.');
 execFileSync(process.execPath,[cli,exe,'NODE_SEA_BLOB',blob,'--sentinel-fuse',SEA_FUSE,'--overwrite'],{stdio:'inherit'});
}
async function smokeTest(exe,kind){
 if(kind==='pe'&&process.platform!=='win32')throw Error('Smoke test Windows memerlukan host Windows.');
 const port=45990,operatorPort=port+1,dataDir=mkdtempSync(join(tmpdir(),'main-bareng-sea-'));
 const child=spawn(exe,['--host','127.0.0.1','--port',String(port),'--no-open','--data-dir',dataDir],{env:{...process.env,MAIN_BARENG_NO_OPEN:'1'},stdio:['ignore','pipe','pipe']});
 let output='';child.stdout.on('data',data=>{output+=data;});child.stderr.on('data',data=>{output+=data;});
 const wait=async(url,attempts=200)=>{let last;for(let n=0;n<attempts;n++){try{const response=await fetch(url);if(response.ok)return response;}catch(error){last=error;}await new Promise(ok=>setTimeout(ok,100));}throw Error('Smoke test timeout: '+url+'\n'+output+'\n'+String(last||''));};
 try{
  await wait('http://127.0.0.1:'+operatorPort+'/healthz');
  const info=await (await wait('http://127.0.0.1:'+port+'/api/info')).json();
  const consolePage=await (await wait('http://127.0.0.1:'+operatorPort+'/console')).text();
  const derek=await (await wait('http://127.0.0.1:'+port+'/games/derek-angkasa/client.js')).text();
  if(!info.catalog?.some(game=>game.id==='derek-angkasa'))throw Error('Katalog Derek Angkasa tidak ditemukan.');
  if(!consolePage.includes('catalog')&&!consolePage.includes('app.js'))throw Error('Halaman konsol tidak valid.');
  if(!derek.includes('export default')&&!derek.includes('import'))throw Error('Client Derek Angkasa tidak valid.');
  const cache=join(dataDir,'MainBareng','app');
  if(!existsSync(cache))throw Error('Aset tidak diekstrak ke folder data.');
  console.log('PASS smoke: health, katalog, konsol, client Derek Angkasa, ekstraksi aset.');
 }finally{
  child.kill('SIGTERM');await new Promise(ok=>setTimeout(ok,300));if(!child.killed)child.kill('SIGKILL');
  rmSync(dataDir,{recursive:true,force:true});
 }
}
if(!existsSync(join(ROOT,'node_modules','postject')))throw Error('postject belum terpasang. Jalankan npm ci.');
const {archive,manifest}=await makeArchive();
const work=join(ARTIFACTS,'sea-build-'+target);rmSync(work,{recursive:true,force:true});mkdirSync(work,{recursive:true});
const archivePath=join(work,'app.bundle');writeFileSync(archivePath,archive);
const bundlePath=join(work,'main.cjs');await makeBundle(bundlePath);
const configPath=join(work,'sea-config.json');writeFileSync(configPath,JSON.stringify({main:bundlePath,output:join(work,'sea.blob'),disableExperimentalSEAWarning:true,useSnapshot:false,useCodeCache:false,assets:{[ASSET]:archivePath}},null,2));
const blobNode=await blobRuntime();execFileSync(blobNode,['--experimental-sea-config',configPath],{stdio:'inherit'});
const {exe:runtimeExe,kind}=await runtime();
const name='main-bareng-'+manifest.version+'-'+target;const out=join(ARTIFACTS,name+(kind==='pe'?'.exe':''));
copyFileSync(runtimeExe,out);inject(out,join(work,'sea.blob'));chmodSync(out,0o755);
const header=readFileSync(out).subarray(0,4);
if(kind==='pe'&&header.toString('latin1',0,2)!=='MZ')throw Error('Hasil bukan PE/EXE Windows.');
if(kind==='elf'&&header.readUInt32BE(0)!==0x7f454c46)throw Error('Hasil bukan ELF Linux.');
const digest=sha256(readFileSync(out));
writeFileSync(out+'.sha256',digest+'  '+basename(out)+'\n');
console.log('');
console.log('Paket siap:',out);
console.log('Ukuran   :',(statSync(out).size/1024/1024).toFixed(1),'MiB');
console.log('Build ID :',manifest.buildId);
console.log('SHA-256  :',digest);
if(smoke)await smokeTest(out,kind);
